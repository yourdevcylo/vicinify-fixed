window.DashboardPage = (() => {
        let currentAdminPlaces = [];
    let adminData = { places: [], buzz_posts: [], bookings: [], messages: [] };

    let globalBookingsUnsub = [];
    let globalMessagesUnsub = [];
    let bizPostsUnsub = null;
    // Inbox data maps live at module level so updateBookingStatus can
    // reuse the listener's copy instead of re-reading the booking doc.
    const bookingMap = new Map();
    const messageMap = new Map();
    // Short-lived caches so re-entering the dashboard does not re-read
    // the same places/users sets on every tab tap.
    let myPlacesCache = null, myPlacesCacheUid = null, myPlacesCacheAt = 0;
    let adminSnapCache = null, adminSnapAt = 0;
    // Ownership grants must never DEMOTE: an admin (or the permanent
    // admin) who is assigned/claims a place keeps the admin role.
    const PERMANENT_ADMIN_UID = "Z45NZhQTgsTUX79WJ5ksCH8N3c02";
    function roleAfterOwnershipGrant(currentRole, targetUid) {
        if (targetUid === PERMANENT_ADMIN_UID || currentRole === "admin") return null;
        return "business";
    }

    function getRole() { return AppState.userProfile?.role || "user"; }
    function isAdmin() { return getRole() === "admin"; }
    function requireAdminAction() {
        if (isAdmin()) return true;
        alert("Admin access is required for this action.");
        return false;
    }
    function canManagePlaceData(place) {
        const uid = window.auth?.currentUser?.uid;
        if (!place || !uid) return false;
        return isAdmin() || (Boolean(place.owner_uid) && place.owner_uid === uid);
    }
    async function canManagePlaceId(placeId) {
        if (!placeId) return false;
        const local = currentAdminPlaces.find(p => p.id === placeId);
        // Cache-first: the dashboard already fetched this place; the
        // server-side rules enforce ownership regardless of this check.
        if (local) return canManagePlaceData(local);
        if (window.db) {
            try {
                const snap = await window.db.collection("places").doc(placeId).get();
                return snap.exists && canManagePlaceData({ ...snap.data(), id: snap.id });
            } catch (error) {
                console.warn("Permission place lookup failed, using dashboard cache.", error);
            }
        }
        return false;
    }
    function escapeHtml(str) { if (!str) return ""; return String(str).replace(/[&<>"']/g, s => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[s])); }

    function getRequestMeta(requestType) {
        const key = String(requestType || "booking").toLowerCase();
        const map = {
            booking: { icon: "calendar-days", title: "General Booking", fulfillLabel: "Mark as Fulfilled", confirmLabel: "Confirm Completed" },
            table: { icon: "utensils", title: "Table Reservation", fulfillLabel: "Mark Dining Completed", confirmLabel: "Confirm Completed" },
            table_reservation: { icon: "utensils", title: "Table Reservation", fulfillLabel: "Mark Dining Completed", confirmLabel: "Confirm Completed" },
            food: { icon: "package", title: "Food Reservation", fulfillLabel: "Mark Food Prepared", confirmLabel: "Confirm Received" },
            food_reservation: { icon: "package", title: "Food Reservation", fulfillLabel: "Mark Food Prepared", confirmLabel: "Confirm Received" },
            pickup: { icon: "shopping-bag", title: "Pickup Order", fulfillLabel: "Mark Ready for Pickup", confirmLabel: "Confirm Picked Up" },
            pickup_order: { icon: "shopping-bag", title: "Pickup Pre-order", fulfillLabel: "Mark Ready for Pickup", confirmLabel: "Confirm Picked Up" },
            advance_order: { icon: "calendar-clock", title: "Advance Order", fulfillLabel: "Mark Order Completed", confirmLabel: "Confirm Received" },
            delivery: { icon: "truck", title: "Delivery Order", fulfillLabel: "Mark Delivered", confirmLabel: "Confirm Received" },
            delivery_order: { icon: "truck", title: "Delivery Order", fulfillLabel: "Mark Delivered", confirmLabel: "Confirm Received" }
        };
        return map[key] || map.booking;
    }
    function renderRequestDetails(order) {
        return window.renderRequestDetailRows(order);
    }

    function safeString(str) { return String(str ?? "").split("").map(c => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")).join(""); }

    function renderBusinessFreshnessTask(place) {
        const freshness = window.getViciFreshnessStatus?.(place) || { className: "freshness-unconfirmed", label: "Needs confirmation", shortLabel: "Unconfirmed", level: "unconfirmed", tone: "#ef4444", bg: "#fef2f2", border: "#fecaca" };
        const isFresh = freshness.level === "active";
        const prompt = isFresh
            ? "Info is fresh. Confirm again if your hours, menu, delivery, or contact info changed."
            : freshness.isInactive
                ? "This listing may be marked inactive in recommendations until the business info is confirmed."
                : "Please confirm or update your hours, menu, delivery, contact info, and promos.";

        return `
            <div class="business-freshness-task ${freshness.className}">
                <div class="business-freshness-top">
                    <span class="business-freshness-badge" style="background:${freshness.bg}; border-color:${freshness.border}; color:${freshness.tone};">
                        <i data-lucide="${freshness.isInactive ? "pause-circle" : isFresh ? "check-circle-2" : "alert-triangle"}"></i>
                        ${escapeHtml(freshness.shortLabel)}
                    </span>
                    <span>${escapeHtml(freshness.label)}</span>
                </div>
                <p>${escapeHtml(prompt)}</p>
                <div class="business-freshness-actions">
                    <button type="button" class="biz-confirm-info-btn" data-confirm-info="${place.id}">
                        <i data-lucide="check-circle-2"></i> No changes
                    </button>
                    <button type="button" class="biz-post-update-btn" data-post-update="${place.id}" data-place-name="${escapeHtml(place.name || "Establishment")}">
                        <i data-lucide="megaphone"></i> Post update
                    </button>
                </div>
            </div>
        `;
    }

    async function confirmBusinessInfo(placeId) {
        if (!placeId) return;
        try {
            await window.db.collection("places").doc(placeId).update({
                lastConfirmedAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastBusinessUpdateAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                infoFreshnessStatus: "active"
            });
            window.showToast?.("Business info confirmed. Freshness status updated.", "success");
            renderMy();
            window.MapPage?.refresh?.();
        } catch (error) {
            console.error("Confirm business info failed:", error);
            window.showToast?.("Unable to confirm info: " + error.message, "error");
        }
    }

    function setNotifBadge(id, count) {
        const badge = document.getElementById(id);
        if (!badge) return;

        const n = Number(count || 0);
        if (n > 0) {
            badge.textContent = n > 9 ? "9+" : String(n);
            badge.classList.remove("hidden");
            badge.style.display = "inline-flex";
        } else {
            badge.textContent = "0";
            badge.classList.add("hidden");
            badge.style.display = "none";
        }
    }

    function ownerHasRead(data, ownerUid) {
        return Array.isArray(data.ownerReadBy) && data.ownerReadBy.includes(ownerUid);
    }

    function isOwnerUnreadTransaction(data, ownerUid) {
        if (!ownerUid) return false;
        if (ownerHasRead(data, ownerUid)) return false;
        const deletedBy = data.deletedBy || [];
        if (deletedBy.includes(ownerUid) || deletedBy.includes("owner_deleted")) return false;
        return true;
    }

    function isOwnerUnreadMessage(data, ownerUid) {
        if(!window.isConversationMessage(data))return false;
        if (!ownerUid) return false;
        if (ownerHasRead(data, ownerUid)) return false;
        if (data.senderUid === ownerUid || data.createdBy === ownerUid) return false;
        if (data.userId === ownerUid) return false;
        if (data.reply && !data.text) return false;
        const deletedBy = data.deletedBy || [];
        if (deletedBy.includes(ownerUid) || deletedBy.includes("owner_deleted")) return false;
        return true;
    }

    // Session cap: each doc is marked read at most once per page session,
    // so a denied/non-persisting write can never retry in a loop.
    const _ownerReadAttempted = new Set();
    async function markDocsOwnerRead(collectionName, docs) {
        const user = window.auth?.currentUser;
        if (!user || !docs || docs.length === 0) return;

        try {
            const batch = window.db.batch();
            let count = 0;

            docs.forEach(d => {
                if (!d || !d.id) return;
                if (Array.isArray(d.ownerReadBy) && d.ownerReadBy.includes(user.uid)) return;
                if (_ownerReadAttempted.has(collectionName + ":" + d.id)) return;
                _ownerReadAttempted.add(collectionName + ":" + d.id);

                const ref = window.db.collection(collectionName).doc(d.id);
                batch.update(ref, {
                    ownerReadBy: firebase.firestore.FieldValue.arrayUnion(user.uid),
                    ownerReadAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                count++;
            });

            if (count > 0) await batch.commit();
        } catch (error) {
            console.warn("Unable to mark owner notifications as read:", error.message);
        }
    }


    function chunkArray(arr, size) {
    const chunks = [];

    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }

    return chunks;
}

    function setDashText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = String(value);
    }

    function updateDashboardKpis(places = []) {
        // Visibility follows the data, not the role string: the strip is
        // owner metrics, so it only exists when there are establishments
        // to report (or for the admin). A standard account — or any
        // account with zero places — never sees an all-zero strip, no
        // matter which render path ran or when the profile resolved.
        const kpiGrid = document.getElementById("dashboardKpiGrid");
        if (kpiGrid) {
            const showKpi = (Array.isArray(places) && places.length > 0) || getRole() === "admin";
            kpiGrid.classList.toggle("hidden", !showKpi);
        }
        const total = places.length;
        const open = places.filter(p => p.status === "open").length;
        const pending = places.filter(p => (p.approval_status || "pending") === "pending").length;
        const unread = (Number(window._dashPendingCount) || 0) + (Number(window._dashMsgCount) || 0);

        setDashText("dashKpiEstablishments", total);
        setDashText("dashKpiOpen", open);
        setDashText("dashKpiPending", pending);
        setDashText("dashKpiUnread", unread);
    }

    async function renderMy() {
        const wrap = document.getElementById("myEstablishments");
        const inbox = document.getElementById("ownerInboxSection");
        const role = getRole();

        // I-update ang condition: Hayaan ang 'admin' at 'business' na makita ang dashboard
        // Pero siguraduhin na may container (#myEstablishments)
        if (!wrap) {
            console.error("Dashboard container (#myEstablishments) not found!");
            return;
        }

        // Kung 'user' lang at hindi admin/business, itago natin
        if (role !== "admin" && role !== "business") {
            wrap.parentElement.classList.add("hidden");
            if (inbox) inbox.classList.add("hidden");
            updateDashboardKpis([]);
            // One-tab rule: standard users get the My Activity hub on this tab.
            const hub = document.getElementById("customerActivitySection");
            if (hub) hub.classList.remove("hidden");
            // The KPI strip is owner metrics: for a standard account it is
            // REMOVED from the DOM entirely (not just hidden), so no CSS
            // rule or later render can ever surface it on My Activity.
            const kpiEl = document.getElementById("dashboardKpiGrid");
            if (kpiEl) kpiEl.remove();
            const heroActions = document.querySelector("#page-dashboard .dash-pro-actions");
            if (heroActions) heroActions.classList.add("hidden");
            const adminCard = document.getElementById("adminReviewCard");
            if (adminCard) adminCard.classList.add("hidden");
            if (window.SettingsPage && typeof window.SettingsPage.startCustomerActivity === "function") {
                window.SettingsPage.startCustomerActivity();
            }
            window.debouncedIcons?.();
            return;
        } 
        
        // Kung admin o business, ipakita ang mga sections
        wrap.parentElement.classList.remove("hidden");
        if (inbox) inbox.classList.remove("hidden");
        const hub = document.getElementById("customerActivitySection");
        if (hub) hub.classList.add("hidden");
        const heroActions = document.querySelector("#page-dashboard .dash-pro-actions");
        if (heroActions) heroActions.classList.remove("hidden");

        const user = window.auth.currentUser;
        if (!user) { 
            wrap.innerHTML = `<div class="muted" style="font-size: 15px;">Please log in to view.</div>`; 
            return; 
        }

        // ... ituloy ang loading logic mo sa baba ...

        wrap.innerHTML = `<div class="muted" style="font-size: 15px;">Loading your establishments...</div>`;

        try {
        let places;
        if (myPlacesCache && myPlacesCacheUid === user.uid && (Date.now() - myPlacesCacheAt) < 60000) {
            places = myPlacesCache;
        } else {
            const ownedSnap = await window.db.collection("places")
    .where("owner_uid", "==", user.uid)
    .limit(20)
    .get();

            places = ownedSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));

            // Admins also operate the places they personally added: the
            // Add page always creates owner_uid: null (unclaimed until an
            // owner is assigned), so without this an admin's own demo
            // places never reach the hub or its inbox.
            if (isAdmin()) {
                try {
                    const addedSnap = await window.db.collection("places")
                        .where("addedBy", "==", user.uid)
                        .limit(20)
                        .get();
                    const seenPlaceIds = new Set(places.map(p => p.id));
                    addedSnap.docs.forEach(doc => {
                        if (!seenPlaceIds.has(doc.id)) places.push({ ...doc.data(), id: doc.id });
                    });
                } catch (e) { /* hub still works with owned places alone */ }
            }
            myPlacesCache = places;
            myPlacesCacheUid = user.uid;
            myPlacesCacheAt = Date.now();
        }

places.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
updateDashboardKpis(places);

            if (places.length === 0) {
                wrap.innerHTML = `
                    <div class="business-empty-state" style="text-align:center; padding: 40px 0;">
                        <div class="business-empty-icon" style="background: #f8fafc; width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
                            <i data-lucide="store" style="color:var(--ui-muted); width: 40px; height: 40px;"></i>
                        </div>
                        <div style="font-weight: 700; font-size: 18px; color:var(--ui-ink);">No establishments yet</div>
                        <button class="dash-action-btn" style="margin: 20px auto 0; background: #0f172a; color: white; font-size: 15px; padding: 12px 20px;" onclick="showPage('page-add')"><i data-lucide="plus" style="width: 18px; height: 18px;"></i> Add Establishment</button>
                    </div>`;
                if (inbox) inbox.classList.add("hidden");
                listenToSukiInbox(null, []);
                window.debouncedIcons?.();
                return;
            }

            currentAdminPlaces = places;
            if (inbox) { inbox.classList.remove("hidden"); listenToGlobalInbox(places.map(p => p.id)); }
            listenToSukiInbox(user.uid, places.map(p => p.id));

            let html = "";
            places.forEach(p => {
                const approvalStatus = p.approval_status || "pending";
                const opStatus = p.status === "open" || p.status === "busy" || p.status === "closed" ? p.status : "closed";
                let topBadgeText = "PENDING"; let topBadgeClass = "status-pending";

                if (approvalStatus === "pending") { topBadgeText = "PENDING APPROVAL"; topBadgeClass = "status-pending"; }
                else if (approvalStatus === "rejected") { topBadgeText = "REJECTED BY ADMIN"; topBadgeClass = "status-rejected"; }
                else {
                    topBadgeText = opStatus.toUpperCase();
                    if (opStatus === "open") topBadgeClass = "status-accepted";
                    else if (opStatus === "busy") topBadgeClass = "status-pending";
                    else topBadgeClass = "status-rejected";
                }

                html += `
  <div class="biz-card" style="padding: 22px; display: flex; flex-direction: column; gap: 16px;">
    
    <!-- Header: Title & Verification -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
            <h3 data-no-translate style="margin: 0; font-size: 18px; font-weight: 800; color:var(--ui-ink); letter-spacing: -0.02em;">${escapeHtml(p.name)}</h3>
            <p style="margin: 4px 0 0; font-size: 13px; color:var(--ui-muted); display: flex; align-items: center; gap: 4px;">
                <i data-lucide="map-pin" style="width: 14px; height: 14px;"></i> ${escapeHtml(p.address || p.brgy || "Lipa City")}
            </p>
        </div>
        <span class="status-badge ${topBadgeClass}" style="padding: 6px 10px; border-radius: 8px; font-size: 11px;">${topBadgeText}</span>
    </div>

    <!-- Freshness / Setup Task -->
    ${renderBusinessFreshnessTask(p)}

    <!-- Suki Card status -->
    <div class="biz-card-actions-row" style="display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
        <div class="suki-status-line ${p.suki_enabled ? "on" : ""}"><span class="suki-dot"></span>${p.suki_enabled ? `Suki Card ON &bull; ${p.suki_stamp_count || 8} stamps` : "Suki Card OFF"}</div>
        <div style="display: flex; gap: 8px;">
            <button class="biz-edit-btn" style="padding: 8px 12px; background:var(--ui-surface); border: 1px solid #e2e8f0; color:var(--ui-ink); border-radius: 10px; font-weight: 600; font-size: 13px; display: inline-flex; align-items: center; gap: 6px;" data-suki-edit="${p.id}">
                <i data-lucide="pencil" style="width: 14px; height: 14px;"></i> Edit Suki Card
            </button>
            <button type="button" class="biz-edit-btn" data-manage-menu="${p.id}">Manage menu</button>
            <button class="biz-edit-btn" style="padding: 8px 12px; background:var(--ui-surface); border: 1px solid #e2e8f0; color:var(--ui-ink); border-radius: 10px; font-weight: 600; font-size: 13px; display: inline-flex; align-items: center; gap: 6px;" data-posts="${p.id}">
                <i data-lucide="store" style="width: 14px; height: 14px;"></i> View page
            </button>
        </div>
    </div>

    <!-- Unified Status Toggles -->
    <div style="margin-top: 4px;">
        <p style="margin: 0 0 8px; font-size: 11px; font-weight: 800; color:var(--ui-muted); text-transform: uppercase; letter-spacing: 0.5px;">Live Store Status</p>
        <div class="biz-status-group" style="background: #f8fafc; padding: 6px; border-radius: 14px; display: flex; gap: 4px; border: 1px solid #f1f5f9;">
            <button class="biz-status-btn ${opStatus === 'open' ? 'active open' : ''}" style="flex: 1; border: none; background: transparent; box-shadow: none;" data-id="${p.id}" data-val="open"><div class="biz-status-dot dot-open"></div> Open</button>
            <button class="biz-status-btn ${opStatus === 'busy' ? 'active busy' : ''}" style="flex: 1; border: none; background: transparent; box-shadow: none;" data-id="${p.id}" data-val="busy"><div class="biz-status-dot dot-busy"></div> Busy</button>
            <button class="biz-status-btn ${opStatus === 'closed' ? 'active closed' : ''}" style="flex: 1; border: none; background: transparent; box-shadow: none;" data-id="${p.id}" data-val="closed"><div class="biz-status-dot dot-closed"></div> Closed</button>
        </div>
    </div>

    <!-- Edit Action -->
    <button class="biz-edit-btn" style="margin-top: 8px; padding: 12px; background:var(--ui-surface); border: 1px solid #e2e8f0; color:var(--ui-ink); border-radius: 12px; font-weight: 600;" data-edit="${p.id}">
        <i data-lucide="settings" style="width: 16px; height: 16px;"></i> Manage Listing
    </button>
  </div>`;
            });
            wrap.innerHTML = html;
            window.debouncedIcons?.();

            wrap.querySelectorAll(".biz-status-btn").forEach(btn => {
                btn.addEventListener("click", async () => {
                    try {
                        // updatedAt must move with the status: the map's
                        // freshness check (and live sync) keys off it.
                        await window.db.collection("places").doc(btn.dataset.id).update({
                            status: btn.dataset.val,
                            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                        myPlacesCache = null; myPlacesCacheAt = 0;
                        window.invalidatePlacesCache?.();
                    } catch (e) {
                        window.showToast?.("Could not update status. Please try again.", "error");
                        return;
                    }
                    renderMy(); window.MapPage?.refresh?.();
                });
            });
            wrap.querySelectorAll("[data-confirm-info]").forEach(btn => {
                btn.addEventListener("click", () => confirmBusinessInfo(btn.dataset.confirmInfo));
            });
            wrap.querySelectorAll("[data-post-update]").forEach(btn => {
                btn.addEventListener("click", () => {
                    if (window.openPlacePostModal) {
                        window.openPlacePostModal(btn.dataset.postUpdate, btn.dataset.placeName || "Establishment");
                    } else {
                        window.showToast?.("Open the Map page once to load the post modal.", "info");
                    }
                });
            });
            wrap.querySelectorAll("[data-edit]").forEach(btn => { btn.addEventListener("click", () => openBusinessPortal(btn.dataset.edit)); });
            wrap.querySelectorAll("[data-suki-edit]").forEach(btn => {
                btn.addEventListener("click", () => openSukiStudio(btn.dataset.sukiEdit));
            });
            wrap.querySelectorAll('[data-manage-menu]').forEach(b=>b.onclick=()=>window.ViciCommerce.openMenu(b.dataset.manageMenu));
            wrap.querySelectorAll("[data-posts]").forEach(btn => {
                btn.addEventListener("click", () => openBizPosts(btn.dataset.posts));
            });
        } catch (e) {
            console.error(e);
            wrap.innerHTML = `<div style="color:red; padding:20px; font-size: 15px;">Error loading data: ${escapeHtml(e.message)}</div>`;
        }
    } 


    function chunkArray(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}


    let activeInboxKey = "";
    function listenToGlobalInbox(placeIds) {
    // Re-entry guard: re-subscribing the same places re-bills every
    // listener's full result set. Only restart when the set changes.
    const inboxKey = (placeIds || []).slice().sort().join(",");
    if (inboxKey && inboxKey === activeInboxKey && globalBookingsUnsub.length) return;
    activeInboxKey = inboxKey;
    globalBookingsUnsub.forEach(unsub => {
    if (typeof unsub === "function") unsub();
});

globalMessagesUnsub.forEach(unsub => {
    if (typeof unsub === "function") unsub();
});

globalBookingsUnsub = [];
globalMessagesUnsub = [];

    const bookingsWrap = document.getElementById("biz-panel-bookings");
    const messagesWrap = document.getElementById("biz-panel-messages");
    const bookBadge = document.getElementById("ownerBookBadge");
    const msgBadge = document.getElementById("ownerMsgBadge");
    const currentUserUid = window.auth?.currentUser?.uid;

    if (!placeIds || placeIds.length === 0) {
        setNotifBadge("ownerBookBadge", 0);
        setNotifBadge("ownerMsgBadge", 0);

        if (bookingsWrap) {
            bookingsWrap.innerHTML = `<div style="text-align:center; padding:30px; color:var(--ui-muted); font-size:15px;">No requests yet.</div>`;
        }

        if (messagesWrap) {
            messagesWrap.innerHTML = `<div style="text-align:center; padding:30px; color:var(--ui-muted); font-size:15px;">No messages yet.</div>`;
        }

        return;
    }

    const chunks = chunkArray(placeIds, 10);
    bookingMap.clear();
    messageMap.clear();

    async function markOwnerTransactionsRead() {
        const docs = Array.from(bookingMap.values()).filter(d => isOwnerUnreadTransaction(d, currentUserUid));
        await markDocsOwnerRead("bookings", docs);
        setNotifBadge("ownerBookBadge", 0);
        window._dashPendingCount = 0;
        window.GlobalNotifier?.refreshDashBadge?.();
    }

    async function markOwnerMessagesRead() {
        const docs = Array.from(messageMap.values()).filter(d => isOwnerUnreadMessage(d, currentUserUid));
        await markDocsOwnerRead("messages", docs);
        setNotifBadge("ownerMsgBadge", 0);
        window._dashMsgCount = 0;
        window.GlobalNotifier?.refreshDashBadge?.();
    }

    window.DashboardPageMarkOwnerTransactionsRead = markOwnerTransactionsRead;
    window.DashboardPageMarkOwnerMessagesRead = markOwnerMessagesRead;
    window.DashboardPageMarkOwnerMessageThreadRead = async function(customerUid, placeId) {
        const docs = Array.from(messageMap.values()).filter(d => {
            return d.userId === customerUid && d.placeId === placeId && isOwnerUnreadMessage(d, currentUserUid);
        });
        await markDocsOwnerRead("messages", docs);
    };


    // v53BK #6: debounced render + fast path for single-doc updates
    let renderBookingsTimer = null;
    let renderBookingsPending = false;
    function scheduleRenderBookings() {
        if (renderBookingsTimer) {
            renderBookingsPending = true;
            return;
        }
        renderBookingsTimer = setTimeout(() => {
            renderBookingsTimer = null;
            if (renderBookingsPending) {
                renderBookingsPending = false;
                renderBookings();
                // Re-arm if more arrived during render
                if (renderBookingsPending) scheduleRenderBookings();
            }
        }, 100);
        renderBookings();
    }
    function renderBookings() {
        if (!bookingsWrap) return;

        let docs = Array.from(bookingMap.values()).filter(d => {
            const deletedBy = d.deletedBy || [];
            return !deletedBy.includes(currentUserUid) && !deletedBy.includes("owner_deleted");
        });

        docs.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));

        const unreadBookingCount = docs.filter(d => isOwnerUnreadTransaction(d, currentUserUid)).length;
        setNotifBadge("ownerBookBadge", unreadBookingCount);
        window._dashPendingCount = unreadBookingCount;
        updateDashboardKpis(currentAdminPlaces || []);
        window.GlobalNotifier?.refreshDashBadge?.();

        if (docs.length === 0) {
            bookingsWrap.innerHTML = `<div style="text-align:center; padding:30px; color:var(--ui-muted); font-size:15px;">No requests yet, or they have been deleted.</div>`;
            window.debouncedIcons?.();
            return;
        }

        let html = "";

        docs.forEach(d => {
            const dateStr = d.createdAt && d.createdAt.toDate ? d.createdAt.toDate().toLocaleString() : "Just now";
            const initial = (d.userName || "U").charAt(0).toUpperCase();
            const status = d.status || "pending";
            const meta = getRequestMeta(d.requestType);
            const paymentFlow = window.PaymentPolicy.flow(d);
            const unreadDot = isOwnerUnreadTransaction(d, currentUserUid) ? `<span class="inbox-unread-dot" title="Unread update"></span>` : "";

            html += `
                <article class="order-ticket status-${status}">
                    <div class="ticket-top">
                        <div class="ticket-id">
                            <div class="biz-avatar ticket-avatar">${initial}</div>
                            <div class="ticket-who">
                                <h4>${escapeHtml(d.userName || "Customer")} ${unreadDot}</h4>
                                <p class="ticket-place">@ ${escapeHtml(d.placeName || "Establishment")}</p>
                            </div>
                        </div>
                        <span class="status-badge status-${status}">${status.toUpperCase()}</span>
                    </div>
                    <p class="ticket-meta"><i data-lucide="${meta.icon}" aria-hidden="true"></i> <span>${escapeHtml(meta.title)} · ${dateStr}</span></p>
                    <details class="ticket-request-details"><summary>Request details</summary>${renderRequestDetails(d)}</details>
                    ${
                        status === "pending" ? `
                            <div class="biz-interact-actions ticket-actions">
                                <button class="btn-deny" style="font-size: 13px; padding: 9px;" onclick="window.DashboardPage.updateBookingStatus('${d.id}', 'rejected')">
                                    <i data-lucide="x" style="width:15px; height:15px;"></i> Reject
                                </button>
                                <button class="btn-accept" style="font-size: 13px; padding: 9px;" onclick="window.DashboardPage.updateBookingStatus('${d.id}', 'accepted')">
                                    <i data-lucide="check" style="width:15px; height:15px;"></i> Accept Request
                                </button>
                            </div>
                        ` : status === "accepted" && !paymentFlow.canPrepare ? `<div class="payment-awaiting-note">Waiting for online payment proof. Verify the received payment before preparation.</div>` : status === "accepted" ? `
                            <div class="biz-interact-actions ticket-actions">
                                <button class="btn-accept" style="font-size: 13px; padding: 9px; background: #ea580c; color: white; width: 100%;" onclick="window.DashboardPage.updateBookingStatus('${d.id}', 'preparing')">
                                    <i data-lucide="chef-hat" style="width:15px; height:15px;"></i> Start Preparing
                                </button>
                            </div>
                        ` : status === "preparing" ? `
                            <div class="biz-interact-actions ticket-actions">
                                <button class="btn-accept" style="font-size: 13px; padding: 9px; background: #0d9488; color: white; width: 100%;" onclick="window.DashboardPage.updateBookingStatus('${d.id}', '${["delivery_order", "delivery"].includes(d.requestType) ? "out_for_delivery" : "ready"}')">
                                    <i data-lucide="check" style="width:15px; height:15px;"></i> ${["delivery_order", "delivery"].includes(d.requestType) ? "Mark Out for Delivery" : "Mark Ready"}
                                </button>
                            </div>
                        ` : status === "out_for_delivery" ? `<div class="ticket-actions"><button class="btn-accept" onclick="window.DashboardPage.updateBookingStatus('${d.id}', 'delivered')">Mark Delivered</button></div>` : status === "ready" ? `
                            <div class="biz-interact-actions ticket-actions">
                                <button class="btn-accept" style="font-size: 13px; padding: 9px; background: #0f172a; color: white; width: 100%;" onclick="window.DashboardPage.updateBookingStatus('${d.id}', 'fulfilled')">
                                    <i data-lucide="check-circle" style="width:15px; height:15px;"></i> ${escapeHtml(meta.fulfillLabel)}
                                </button>
                            </div>
                        ` : status === "payment_submitted" ? `
                            <div class="ticket-proof" style="background:var(--ui-success-bg); border:1px solid var(--ui-success-line); border-radius:12px; padding:10px;">
                                <div style="font-size:12px; font-weight:900; color:#92400e; margin-bottom:8px;">Payment details submitted — please review</div>
                                ${d.paymentReference ? `<div class="payment-reference-review">Reference: <strong>${escapeHtml(d.paymentReference)}</strong><br>Amount submitted: ₱${escapeHtml(d.paymentAmount || "—")}</div>` : ""}
                                ${(d.paymentProofPath || d.paymentProofUrl) ? `<img ${d.paymentProofPath ? `data-proof-booking="${escapeHtml(d.id)}" data-proof-version="${escapeHtml(d.paymentProofPath)}"` : `src="${escapeHtml(window.safeImageUrl(d.paymentProofUrl))}"`} alt="Payment proof" style="width:100%; max-height:160px; object-fit:contain; border-radius:8px; border:1px solid #fde68a; margin-bottom:8px; background:var(--ui-surface);" loading="lazy" />` : `<div style="font-size:12px; color:#92400e;">No receipt image attached. Verify the submitted reference against your actual account.</div>`}
                                <div class="biz-interact-actions" style="margin-top:0;">
                                    <button class="btn-deny" style="font-size: 13px; padding: 9px;" onclick="window.reviewPaymentProof('${d.id}', null, 'resubmit')">
                                        <i data-lucide="x" style="width:15px; height:15px;"></i> Decline payment
                                    </button>
                                    <button class="btn-accept" style="font-size: 13px; padding: 9px;" onclick="window.reviewPaymentProof('${d.id}', null, 'confirm')">
                                        <i data-lucide="check" style="width:15px; height:15px;"></i> Accept payment
                                    </button>
                                </div>
                            </div>
                        ` : status === "payment_confirmed" ? `
                            <div class="biz-interact-actions ticket-actions">
                                <div style="font-size:12px; color:#166534; font-weight:800; background:#dcfce7; padding:8px; border-radius:8px; text-align:center; width:100%; margin-bottom:8px;">Payment confirmed</div>
                                <button class="btn-accept" style="font-size: 13px; padding: 9px; background: #ea580c; color: white; width: 100%;" onclick="window.DashboardPage.updateBookingStatus('${d.id}', 'preparing')">
                                    <i data-lucide="chef-hat" style="width:15px; height:15px;"></i> Start Preparing
                                </button>
                            </div>
                        ` : `
                            <div class="biz-interact-actions ticket-actions">
                                <button class="btn-deny" onclick="window.DashboardPage.deleteBooking('${d.id}')" style="background:#fef2f2; color:#ef4444; border-color:#fee2e2; width:100%; font-size: 13px; padding: 9px;">
                                    <i data-lucide="archive" style="width:15px; height:15px;"></i> Hide record
                                </button>
                            </div>
                        `
                    }
                    <button type="button" class="payment-conversation-action" onclick="window.openChatModal('${d.placeId}', '${safeString(d.placeName || "Establishment")}', '${d.userId}', 'transaction', '${d.id}')"><i data-lucide="clipboard-list"></i> Open transaction</button>
                </article>
            `;
        });

        bookingsWrap.innerHTML = `<div class="ticket-board">${html}</div>`;
        window.debouncedIcons?.();
    }

    function renderMessages() {
        if (!messagesWrap) return;

        let docs = Array.from(messageMap.values()).filter(d => {
    const deletedBy = d.deletedBy || [];

    return (
        window.isConversationMessage(d) && d.userId !== currentUserUid &&
        !deletedBy.includes(currentUserUid) &&
        !deletedBy.includes("owner_deleted")
    );
});

        let threads = {};

        docs.forEach(d => {
            const threadKey = d.userId + "_" + d.placeId;
            const currentTime = d.createdAt?.toMillis?.() || 0;
            const savedTime = threads[threadKey]?.createdAt?.toMillis?.() || 0;

            if (!threads[threadKey] || currentTime > savedTime) {
                threads[threadKey] = d;
            }
        });

        let threadArr = Object.values(threads).sort((a, b) => {
            return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
        });

        const threadUnread = thread => docs.some(message=>message.placeId===thread.placeId && message.userId===thread.userId && isOwnerUnreadMessage(message,currentUserUid));
        const unreadThreadCount = threadArr.filter(threadUnread).length;
        setNotifBadge("ownerMsgBadge", unreadThreadCount);
        window._dashMsgCount = unreadThreadCount;
        updateDashboardKpis(currentAdminPlaces || []);
        window.GlobalNotifier?.refreshDashBadge?.();

        if (threadArr.length === 0) {
            messagesWrap.innerHTML = `<div style="text-align:center; padding:30px; color:var(--ui-muted); font-size:15px;">No messages yet, or they have been deleted.</div>`;
            window.debouncedIcons?.();
            return;
        }

        let unreadHtml = "";
        let readHtml = "";

        threadArr.forEach(d => {
            const dateStr = d.createdAt && d.createdAt.toDate
                ? d.createdAt.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : "Just now";

            const initial = (d.userName || "U").charAt(0).toUpperCase();
            const waitingForBusiness = d.senderRole ? d.senderRole === 'customer' : !d.reply;
            const lastMsg = d.reply ? `You: ${d.reply}` : `${d.senderUid===currentUserUid?'You: ':''}${d.text || 'Transaction update'}`;
            const businessName=currentAdminPlaces.find(place=>place.id===d.placeId)?.name || (d.placeName !== d.userName ? d.placeName : '') || 'Establishment';

            const rowHtml = `
                <div class="inbox-row business-chat-row" style="position: relative; padding: 16px; padding-right: 50px; display: flex; align-items: center; gap: 14px;" onclick="window.DashboardPage.markOwnerMessageThreadRead('${d.userId}', '${d.placeId}'); window.openChatModal('${d.placeId}', '${safeString(d.userName || "Customer")}', '${d.userId}')">
                    <div class="inbox-avatar" style="background: var(--ui-success-bg); color: var(--ui-success-ink); width: 44px; height: 44px; font-size: 20px;">${escapeHtml(initial)}</div>

                    <div class="inbox-content" style="flex: 1; overflow: hidden;">
                        <div class="inbox-top" style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <div class="inbox-name" style="font-size: 16px; font-weight: 700;">
                                ${escapeHtml(d.userName || "Customer")}
                                <span data-no-translate class="business-chat-place">${escapeHtml(businessName)}</span>
                            </div>
                            <div class="inbox-time" style="font-size: 13px; color:var(--ui-muted);">${dateStr}</div>
                        </div>

                        <div class="inbox-bottom" style="display: flex; align-items: center; gap: 8px;">
                            <div class="inbox-snippet" style="font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; ${!d.reply ? "font-weight:700; color:var(--ui-ink);" : "color:var(--ui-muted);"}">${escapeHtml(lastMsg)}</div>
                            ${threadUnread(d) ? `<div class="inbox-unread" style="background:var(--ui-success-bg); color:var(--ui-success-ink); font-size: 11px; padding: 2px 6px;">NEW</div>` : ""}
                        </div>
                    </div>

                    <button onclick="window.DashboardPage.deleteChatThread('${d.userId}', '${d.placeId}', event)" style="position: absolute; right: 16px; top: 50%; transform: translateY(-50%); background: transparent; border: none; color: var(--ui-muted); width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s;" title="Hide conversation">
                        <i data-lucide="archive" style="width: 20px; height: 20px;"></i>
                    </button>
                </div>
            `;

            if (waitingForBusiness) unreadHtml += rowHtml;
            else readHtml += rowHtml;
        });

        let finalHtml = "";

        if (unreadHtml) {
            finalHtml += `<div style="font-size: 14px; font-weight: 800; color: var(--ui-muted); margin-bottom: 12px; margin-top: 12px; text-transform: uppercase; letter-spacing: 0.5px;" class="business-chat-heading">Needs your reply</div>` + unreadHtml;
        }

        if (readHtml) {
            finalHtml += `<div style="font-size: 14px; font-weight: 800; color:var(--ui-muted); margin-top: 32px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;" class="business-chat-heading">Conversations</div>` + readHtml;
        }

        messagesWrap.innerHTML = finalHtml;
        window.debouncedIcons?.();
    }

    chunks.forEach(chunk => {
        const bookingUnsub = window.db.collection("bookings")
    .where("placeId", "in", chunk).orderBy("createdAt", "desc").limit(50)
    .onSnapshot(snap => {
        snap.docChanges().forEach(change => {
            if (change.type === "removed") {
                bookingMap.delete(change.doc.id);
            } else {
                bookingMap.set(change.doc.id, {
                    id: change.doc.id,
                    ...change.doc.data()
                });
            }
        });

        scheduleRenderBookings();
    }, err => window.handleFirestoreError(err));

globalBookingsUnsub.push(bookingUnsub);


        const messageUnsub = window.db.collection("messages")
            .where("placeId", "in", chunk).orderBy("createdAt", "desc").limit(50)
            .onSnapshot(snap => {
                snap.docChanges().forEach(change => {
                    if (change.type === "removed") {
                        messageMap.delete(change.doc.id);
                    } else {
                        messageMap.set(change.doc.id, {
                            id: change.doc.id,
                            ...change.doc.data()
                        });
                    }
                });

                renderMessages();
            }, err => window.handleFirestoreError(err));

        globalMessagesUnsub.push(messageUnsub);
    });
}

    // =====================================
    // 🔥 SUKI CARD INBOX (owner-tap stamp approvals) 🔥
    // =====================================
    let sukiUnsubs = [];
    const sukiRequestMap = new Map();
    const sukiClaimMap = new Map();

    let activeSukiKey = "";
    function listenToSukiInbox(ownerUid, placeIds) {
        // Same re-entry guard as the global inbox.
        const sukiKey = (ownerUid || "") + "|" + (placeIds || []).slice().sort().join(",");
        if (ownerUid && placeIds && placeIds.length && sukiKey === activeSukiKey && sukiUnsubs.length) return;
        activeSukiKey = sukiKey;
        sukiUnsubs.forEach(unsub => { if (typeof unsub === "function") unsub(); });
        sukiUnsubs = [];
        sukiRequestMap.clear();
        sukiClaimMap.clear();

        const sukiWrap = document.getElementById("biz-panel-suki");
        if (!ownerUid || !placeIds || placeIds.length === 0) {
            setNotifBadge("ownerSukiBadge", 0);
            if (sukiWrap) sukiWrap.innerHTML = `<div style="text-align:center; padding:30px; color:var(--ui-muted); font-size:15px;">No Suki Card requests yet.</div>`;
            return;
        }

        // Bounded: pending stamp requests for this owner's places.
        // Filtered by placeId (not owner_uid) so requests are found even
        // when the request's owner_uid field is empty.
        chunkArray(placeIds, 10).forEach(chunk => {
            sukiUnsubs.push(window.db.collection("stamp_requests")
                .where("placeId", "in", chunk)
                .where("status", "==", "pending")
                .limit(20)
                .onSnapshot(snap => {
                    snap.docChanges().forEach(change => {
                        if (change.type === "removed") sukiRequestMap.delete(change.doc.id);
                        else sukiRequestMap.set(change.doc.id, { id: change.doc.id, ...change.doc.data() });
                    });
                    renderSukiPanel();
                }, err => window.handleFirestoreError(err)));
        });

        // Claim requests on this owner's cards (bounded per place chunk).
        chunkArray(placeIds, 10).forEach(chunk => {
            sukiUnsubs.push(window.db.collection("loyalty_cards")
                .where("placeId", "in", chunk)
                .where("claimRequested", "==", true)
                .limit(20)
                .onSnapshot(snap => {
                    snap.docChanges().forEach(change => {
                        if (change.type === "removed") sukiClaimMap.delete(change.doc.id);
                        else sukiClaimMap.set(change.doc.id, { id: change.doc.id, ...change.doc.data() });
                    });
                    renderSukiPanel();
                }, err => window.handleFirestoreError(err)));
        });
    }

    function renderSukiPanel() {
        const wrap = document.getElementById("biz-panel-suki");
        if (!wrap) return;

        const reqs = Array.from(sukiRequestMap.values())
            .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        const claims = Array.from(sukiClaimMap.values())
            .filter(c => !c.claimed)
            .sort((a, b) => (b.claimRequestedAt?.toMillis?.() || 0) - (a.claimRequestedAt?.toMillis?.() || 0));
        setNotifBadge("ownerSukiBadge", reqs.length + claims.length);

        let html = `<div style="font-size:14px; font-weight:800; color:var(--ui-ink); margin:12px 0;">Requesting a stamp (${reqs.length})</div>`;
        if (reqs.length === 0) {
            html += `<div style="text-align:center; padding:20px; color:var(--ui-muted); font-size:14px;">No pending stamp requests.</div>`;
        } else {
            reqs.forEach(d => {
                const initial = (d.customerName || "S").charAt(0).toUpperCase();
                html += `
                <div class="suki-req-card">
                    <div class="suki-req-info">
                        <div class="suki-req-avatar">${escapeHtml(initial)}</div>
                        <div>
                            <div style="font-size:15px; font-weight:700; color:var(--ui-ink);">${escapeHtml(d.customerName || "Customer")} is requesting a stamp</div>
                            <div style="font-size:13px; color:var(--ui-muted);">@ ${escapeHtml(d.placeName || "Establishment")}</div>
                        </div>
                    </div>
                    <div class="suki-req-actions">
                        <button class="suki-deny-btn" onclick="window.DashboardPage.rejectStampRequest('${d.id}')">Reject</button>
                        <button class="suki-approve-btn" onclick="window.DashboardPage.approveStampRequest('${d.id}')"><i data-lucide="check"></i> Approve</button>
                    </div>
                </div>`;
            });
        }

        html += `<div style="font-size:14px; font-weight:800; color:var(--ui-ink); margin:20px 0 12px;">Claim requests (${claims.length})</div>`;
        if (claims.length === 0) {
            html += `<div style="text-align:center; padding:20px; color:var(--ui-muted); font-size:14px;">No claims waiting.</div>`;
        } else {
            claims.forEach(c => {
                const initial = (c.customerName || "S").charAt(0).toUpperCase();
                html += `
                <div class="suki-req-card">
                    <div class="suki-req-info">
                        <div class="suki-req-avatar" style="background:#fef9c3; color:#854d0e;">${escapeHtml(initial)}</div>
                        <div>
                            <div style="font-size:15px; font-weight:700; color:var(--ui-ink);">${escapeHtml(c.customerName || "Customer")} — wants to claim the reward 🎁</div>
                            <div style="font-size:13px; color:var(--ui-muted);">Card: ${escapeHtml(c.id)}</div>
                        </div>
                    </div>
                    <div class="suki-req-actions">
                        <button class="suki-approve-btn" onclick="window.DashboardPage.markSukiClaimed('${c.id}')"><i data-lucide="gift"></i> Mark as claimed</button>
                    </div>
                </div>`;
            });
        }

        wrap.innerHTML = html;
        window.debouncedIcons?.();
    }
    async function deleteChatThread(userId, placeId, event) {
        if (event) event.stopPropagation();
        const ans = await window.vConfirm("Hide Conversation", "Hide this conversation from your business inbox? It will remain in the customer's Chat History.", "Hide", true);
        if (!ans) return;

        try {
            const user = window.auth.currentUser;
            const snap = await window.db.collection("messages").where("placeId", "==", placeId).where("userId", "==", userId).limit(20).get();
            const batch = window.db.batch();
            // Hide only for this account; never hide another participant’s history.
            snap.forEach(doc => { batch.update(doc.ref, { deletedBy: firebase.firestore.FieldValue.arrayUnion(user.uid) }); });
            await batch.commit();
        } catch (e) { alert("Error: " + e.message); }
    }

    async function deleteBooking(id) {
        const ans = await window.vConfirm("Hide Record", "Hide this completed request from your dashboard? It remains in the customer history.", "Hide", true);
        if (!ans) return;

        try {
            const user = window.auth.currentUser;
            // Hide only for this account; never hide another participant’s history.
            await window.db.collection("bookings").doc(id).update({ deletedBy: firebase.firestore.FieldValue.arrayUnion(user.uid) });
        } catch (e) { alert("Error: " + e.message); }
    }

    // =====================================
    // 🔥 FILTERING LOGIC 🔥
    // =====================================
    function applyAdminFilters() {
        const q = (document.getElementById("adminSearchInput")?.value || "").toLowerCase();

        const selCats = Array.from(document.querySelectorAll("#fgroup-category input:checked")).map(cb => cb.value);
        const selApp = Array.from(document.querySelectorAll("#fgroup-approval_status input:checked")).map(cb => cb.value);
        const selVer = Array.from(document.querySelectorAll("#fgroup-is_verified input:checked")).map(cb => cb.value);
        const selBook = Array.from(document.querySelectorAll("#fgroup-accepts_booking input:checked")).map(cb => cb.value);

        const totalFilters = selCats.length + selApp.length + selVer.length + selBook.length;

        document.getElementById("filterCountText").textContent = totalFilters === 1 ? `1 filter applied` : `${totalFilters} filters applied`;

        const badge = document.getElementById("mainFilterBadge");
        if (totalFilters > 0) {
            badge.textContent = totalFilters;
            badge.classList.remove("hidden");
        } else {
            badge.classList.add("hidden");
        }

        document.querySelectorAll("#adminPlacesTableBody tr").forEach(row => {
            const textMatch = row.innerText.toLowerCase().includes(q);

            const catMatch = selCats.length === 0 || selCats.includes(row.dataset.category);
            const appMatch = selApp.length === 0 || selApp.includes(row.dataset.approval);
            const verMatch = selVer.length === 0 || selVer.includes(row.dataset.verified);
            const bookMatch = selBook.length === 0 || selBook.includes(row.dataset.booking);

            row.style.display = (textMatch && catMatch && appMatch && verMatch && bookMatch) ? "" : "none";
        });
    }

    function clearFilterGroup(groupId) {
        document.querySelectorAll(`#fgroup-${groupId} input[type='checkbox']`).forEach(cb => cb.checked = false);
        applyAdminFilters();
    }

    function clearAdminFilters() {
        document.querySelectorAll("#adminFilterPopover input[type='checkbox']").forEach(cb => cb.checked = false);
        applyAdminFilters();
    }

    function switchFilterTab(tabId, btnElement) {
        document.querySelectorAll(".filter-tab").forEach(b => b.classList.remove("active"));
        btnElement.classList.add("active");
        document.querySelectorAll(".fgroup-panel").forEach(p => { p.classList.add("hidden"); p.classList.remove("active"); });
        const targetGroup = document.getElementById("fgroup-" + tabId);
        if (targetGroup) { targetGroup.classList.remove("hidden"); targetGroup.classList.add("active"); }
    }

    // =====================================
    // 🔥 FULL ADMIN DATABASE MANAGEMENT 🔥
    // =====================================
    async function renderAdmin() {
        const role = getRole();
        const adminCard = document.getElementById("adminReviewCard");
        if (!adminCard) return;

        if (role !== "admin") { adminCard.classList.add("hidden"); return; }
        adminCard.classList.remove("hidden");
        const wrap = document.getElementById("pendingList");
        wrap.innerHTML = `<div class="muted" style="font-size: 15px;">Loading dashboard...</div>`;

        try {
          let placesSnap, usersSnap;
          if (adminSnapCache && (Date.now() - adminSnapAt) < 60000) {
              placesSnap = adminSnapCache.placesSnap;
              usersSnap = adminSnapCache.usersSnap;
          } else {
              placesSnap = await window.db.collection("places")
            .limit(20)
            .get();
              usersSnap = await window.db.collection("users").limit(20).get();
              adminSnapCache = { placesSnap, usersSnap };
              adminSnapAt = Date.now();
          }
            let places = []; let totalPlaces = 0; let pendingApprovals = 0; let totalBusinessOwners = 0;

            placesSnap.forEach(doc => {
                const data = doc.data(); places.push({ ...data, id: doc.id }); totalPlaces++;
                if (data.status === "pending" || data.approval_status === "pending") pendingApprovals++;
            });
            await Promise.all(places.map(async place => {
                const privateDoc = await window.db.collection('private_places').doc(place.id).get();
                if (privateDoc.exists) place.owner_email = privateDoc.data().owner_email || '';
            }));
            usersSnap.forEach(doc => { if (doc.data().role === "business") totalBusinessOwners++; });

            const totals = await window.ViciData.command("adminSummary", {});
            totalPlaces = totals.totalPlaces; pendingApprovals = totals.pendingApprovals; totalBusinessOwners = totals.totalBusinessOwners;

            adminData.places = places;

            const categoriesList = ['restaurant', 'cafe', 'bakery', 'milktea', 'snackhouse', 'foodstall', 'eatery', 'dessert', 'fastfood'];

            let html = `
                <div class="dash-stats-grid">
                    <div class="stat-card"><div class="stat-icon-wrap" style="background: var(--ui-accent-soft); color:var(--ui-accent);"><i data-lucide="store" style="width: 36px; height: 36px;"></i></div><div><p class="stat-label" style="font-size: 14px;">Total Establishments</p><h3 class="stat-value" style="font-size: 28px;">${totalPlaces}</h3></div></div>
                    <div class="stat-card"><div class="stat-icon-wrap" style="background: rgba(234, 179, 8, 0.1); color: #eab308;"><i data-lucide="clock" style="width: 36px; height: 36px;"></i></div><div><p class="stat-label" style="font-size: 14px;">Pending Approvals</p><h3 class="stat-value" style="font-size: 28px;">${pendingApprovals}</h3></div></div>
                    <div class="stat-card"><div class="stat-icon-wrap" style="background: rgba(16, 185, 129, 0.1); color: #10b981;"><i data-lucide="users" style="width: 36px; height: 36px;"></i></div><div><p class="stat-label" style="font-size: 14px;">Registered Owners</p><h3 class="stat-value" style="font-size: 28px;">${totalBusinessOwners}</h3></div></div>
                </div>
                <div class="biz-portal-tabs" style="margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; overflow-x: auto; white-space: nowrap; scrollbar-width: none;">
                    <button class="biz-tab active" style="font-size: 15px; padding: 12px 16px;" data-biztab="admin-places"><i data-lucide="map" style="width:18px; height:18px;"></i> Establishments</button>
                    <button class="biz-tab" style="font-size: 15px; padding: 12px 16px;" data-biztab="admin-users" onclick="window.DashboardPage.loadAdminUsers()"><i data-lucide="users" style="width:18px; height:18px;"></i> Users</button>
                    <button class="biz-tab" style="font-size: 15px; padding: 12px 16px;" data-biztab="admin-buzz" onclick="window.DashboardPage.loadAdminBuzz()"><i data-lucide="zap" style="width:18px; height:18px;"></i> Buzz Posts</button>
                    <button class="biz-tab" style="font-size: 15px; padding: 12px 16px;" data-biztab="admin-bookings" onclick="window.DashboardPage.loadAdminBookings()"><i data-lucide="calendar" style="width:18px; height:18px;"></i> Transactions</button>
                    <button class="biz-tab" style="font-size: 15px; padding: 12px 16px;" data-biztab="admin-messages" onclick="window.DashboardPage.loadAdminMessages()"><i data-lucide="message-square" style="width:18px; height:18px;"></i> Messages</button>
                    <button class="biz-tab" style="font-size: 15px; padding: 12px 16px;" data-biztab="admin-claims" onclick="window.DashboardPage.loadAdminClaims()"><i data-lucide="shield-check" style="width:18px; height:18px;"></i> Claims</button>
                    <button class="biz-tab" style="font-size: 15px; padding: 12px 16px;" data-biztab="admin-reports" onclick="window.DashboardPage.loadAdminReports()"><i data-lucide="flag" style="width:18px; height:18px;"></i> Reports</button>
                    <button class="biz-tab" style="font-size: 15px; padding: 12px 16px;" data-biztab="admin-audit" onclick="window.DashboardPage.loadAdminAudit()"><i data-lucide="scroll-text" style="width:18px; height:18px;"></i> Audit</button>
                </div>

                <div id="biz-panel-admin-places" class="biz-panel active">
                    <div class="admin-db-container">
                        <div class="admin-db-header" style="justify-content: space-between; padding: 16px;">
                            <div class="admin-db-search">
                                <i data-lucide="search" style="width:18px; height:18px; color:var(--ui-muted);"></i>
                                <input type="text" id="adminSearchInput" style="font-size: 15px; padding: 10px;" placeholder="Search places..." oninput="window.DashboardPage.applyAdminFilters()" />
                            </div>
                            
                            <div class="admin-filter-wrap">
                                <button id="adminFilterBtn" class="dash-action-btn" style="position: relative; font-size: 14px; padding: 10px 16px;">
                                    <i data-lucide="filter" style="width:16px; height:16px;"></i> Filters
                                    <span id="mainFilterBadge" class="filter-badge hidden">0</span>
                                </button>
                                
                                <div id="adminFilterPopover" class="filter-popover hidden">
                                    <div class="filter-popover-top">Filters</div>
                                    <div class="filter-popover-body">
                                        <div class="filter-sidebar custom-scrollbar">
                                            <button class="filter-tab active" onclick="window.DashboardPage.switchFilterTab('category', this)">Category <i data-lucide="chevron-right"></i></button>
                                            <button class="filter-tab" onclick="window.DashboardPage.switchFilterTab('is_verified', this)">Is verified <i data-lucide="chevron-right"></i></button>
                                            <button class="filter-tab" onclick="window.DashboardPage.switchFilterTab('accepts_booking', this)">Accepts booking <i data-lucide="chevron-right"></i></button>
                                            <button class="filter-tab" onclick="window.DashboardPage.switchFilterTab('approval_status', this)">Approval status <i data-lucide="chevron-right"></i></button>
                                        </div>
                                        
                                        <div class="filter-content custom-scrollbar">
                                            <div id="fgroup-category" class="fgroup-panel active">
                                                <div class="fgroup-header">
                                                    <span class="fgroup-title">Category</span>
                                                    <button class="btn-clear-group" onclick="window.DashboardPage.clearFilterGroup('category')">Clear filter</button>
                                                </div>
                                                <div class="fgroup-list">
                                                    ${categoriesList.map(c => `<label class="filter-checkbox-label"><input type="checkbox" value="${c}" onchange="window.DashboardPage.applyAdminFilters()"> ${c}</label>`).join('')}
                                                </div>
                                            </div>

                                            <div id="fgroup-is_verified" class="fgroup-panel hidden">
                                                <div class="fgroup-header"><span class="fgroup-title">Is verified</span><button class="btn-clear-group" onclick="window.DashboardPage.clearFilterGroup('is_verified')">Clear filter</button></div>
                                                <div class="fgroup-list">
                                                    <label class="filter-checkbox-label"><input type="checkbox" value="true" onchange="window.DashboardPage.applyAdminFilters()"> true</label>
                                                    <label class="filter-checkbox-label"><input type="checkbox" value="false" onchange="window.DashboardPage.applyAdminFilters()"> false</label>
                                                </div>
                                            </div>
                                            <div id="fgroup-accepts_booking" class="fgroup-panel hidden">
                                                <div class="fgroup-header"><span class="fgroup-title">Accepts booking</span><button class="btn-clear-group" onclick="window.DashboardPage.clearFilterGroup('accepts_booking')">Clear filter</button></div>
                                                <div class="fgroup-list">${['true','false'].map(value=>`<label class="filter-checkbox-label"><input type="checkbox" value="${value}" onchange="window.DashboardPage.applyAdminFilters()"> ${value}</label>`).join('')}</div>
                                            </div>
                                            <div id="fgroup-approval_status" class="fgroup-panel hidden">
                                                <div class="fgroup-header"><span class="fgroup-title">Approval status</span><button class="btn-clear-group" onclick="window.DashboardPage.clearFilterGroup('approval_status')">Clear filter</button></div>
                                                <div class="fgroup-list">${['pending','approved','rejected'].map(value=>`<label class="filter-checkbox-label"><input type="checkbox" value="${value}" onchange="window.DashboardPage.applyAdminFilters()"> ${value}</label>`).join('')}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="filter-popover-footer">
                                        <span id="filterCountText">0 filters applied</span>
                                        <button class="btn-clear-all" onclick="window.DashboardPage.clearAdminFilters()">Clear</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="admin-table-scroll" style="overflow-x: auto;">
                            <table class="admin-db-table">
                                <thead><tr style="font-size: 14px;"><th>Name</th><th>Category</th><th>Owner Email</th><th>Approval Status</th></tr></thead>
                                <tbody id="adminPlacesTableBody">
                                    ${places.map(p => `
                                    <tr style="font-size: 14px;" onclick="window.DashboardPage.openEditPanel('places', '${p.id}')"
                                        data-category="${(p.category || p.cat || 'default').toLowerCase()}"
                                        data-approval="${(p.approval_status || p.status || 'pending').toLowerCase()}"
                                        data-verified="${p.is_verified ? 'true' : 'false'}"
                                        data-booking="${p.accepts_booking ? 'true' : 'false'}">
                                        <td data-no-translate style="font-weight: 700;">${escapeHtml(p.name || "N/A")}</td>
                                        <td>${escapeHtml(p.category || p.cat || "N/A")}</td>
                                        <td ${p.owner_email ? 'data-no-translate' : 'data-i18n="Unclaimed"'} onclick="event.stopPropagation(); window.DashboardPage.manualAssignOwner('${p.id}', '${safeString(p.name || "Establishment")}')" style="cursor:pointer; color: ${p.owner_email ? 'var(--ui-primary,#237e72)' : '#94a3b8'}; font-weight: 600;" title="Click to manually assign owner">
                                            ${escapeHtml(p.owner_email || "Unclaimed")}
                                        </td>
                                        <td><span class="status-badge status-${(p.approval_status || p.status || 'pending').toLowerCase()}">${(p.approval_status || p.status || 'pending').toUpperCase()}</span></td>
                                    </tr>`).join("")}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <div id="biz-panel-admin-users" class="biz-panel hidden"><div class="admin-db-container" id="adminUsersList"><div class="muted" style="padding:20px; font-size:15px;">Fetching users...</div></div></div>
                <div id="biz-panel-admin-buzz" class="biz-panel hidden"><div class="admin-db-container" id="adminBuzzList"><div class="muted" style="padding:20px; font-size:15px;">Fetching buzz posts...</div></div></div>
                <div id="biz-panel-admin-bookings" class="biz-panel hidden"><div class="admin-db-container" id="adminBookingsList"><div class="muted" style="padding:20px; font-size:15px;">Fetching transactions...</div></div></div>
                <div id="biz-panel-admin-messages" class="biz-panel hidden"><div class="admin-db-container" id="adminMessagesList"><div class="muted" style="padding:20px; font-size:15px;">Fetching messages...</div></div></div>
                <div id="biz-panel-admin-claims" class="biz-panel hidden"><div class="admin-db-container" id="adminClaimsList"><div class="muted" style="padding:20px; font-size:15px;">Fetching claims...</div></div></div>
                <div id="biz-panel-admin-reports" class="biz-panel hidden"><div class="admin-db-container" id="adminReportsList"><div class="muted" style="padding:20px; font-size:15px;">Fetching reports...</div></div></div>
                <div id="biz-panel-admin-audit" class="biz-panel hidden"><div class="admin-db-container" id="adminAuditList"><div class="muted" style="padding:20px; font-size:15px;">Fetching audit log...</div></div></div>
            `;
            wrap.innerHTML = html;
            window.debouncedIcons?.();

        } catch (e) {
            console.error(e);
            wrap.innerHTML = `<div style="color:red; padding:20px; font-size:15px;">Error loading admin: ${escapeHtml(e.message)}</div>`;
        }
    }

    async function loadAdminUsers() {
        if (!requireAdminAction()) return;
        const wrap = document.getElementById("adminUsersList");
        if (!wrap) return;
        wrap.innerHTML = `<div class="muted" style="padding:20px; font-size:15px;">Fetching users from database...</div>`;
        try {
            const snap = await window.db.collection("users").limit(20).get();
            let html = `<div class="admin-table-scroll" style="overflow-x: auto;"><table class="admin-db-table"><thead><tr style="font-size: 14px;"><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead><tbody>`;
            snap.forEach(doc => {
                const u = doc.data(); const r = u.role || 'user'; const badgeClass = r === 'admin' ? 'status-accepted' : (r === 'business' ? 'status-pending' : 'status-rejected');
                html += `<tr style="font-size: 14px;"><td data-no-translate style="font-weight:700;">${escapeHtml(u.fullName || 'Unknown')}</td><td data-no-translate style="color:var(--ui-muted);">${escapeHtml(u.email || 'No email')}</td><td><span class="status-badge ${badgeClass}">${r.toUpperCase()}${doc.id === PERMANENT_ADMIN_UID ? " • PERMANENT" : ""}</span></td><td><select ${doc.id === PERMANENT_ADMIN_UID ? 'disabled title="Permanent admin — role is locked"' : ""} onchange="window.DashboardPage.updateUserRole('${doc.id}', this.value)" style="padding:8px; border-radius:6px; border:1px solid #cbd5e1; outline:none; font-size:14px;"><option value="user" ${r === 'user' ? 'selected' : ''}>User</option><option value="business" ${r === 'business' ? 'selected' : ''}>Business</option><option value="admin" ${r === 'admin' ? 'selected' : ''}>Admin</option></select></td></tr>`;
            });
            html += `</tbody></table></div>`;
            wrap.innerHTML = html;
        } catch (e) { wrap.innerHTML = `<div style="color:red; padding:20px; font-size:15px;">Error: ${escapeHtml(e.message)}</div>`; }
    }

    // --- ADMIN AUDIT LOG: who did what, when (Admin Panel -> Audit tab) ---
    async function logAdminAction(action, target = {}) {
        try {
            const user = window.auth?.currentUser;
            if (!user) return;
            await window.db.collection("admin_audit").add({
                action,
                actorUid: user.uid,
                actorEmail: user.email || "",
                targetCollection: target.collection || "",
                targetId: target.id || "",
                targetLabel: target.label || "",
                detail: target.detail || "",
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (e) { /* audit must never block the action itself */ }
    }

    async function loadAdminClaims() {
        if (!requireAdminAction()) return;
        const wrap = document.getElementById("adminClaimsList");
        if (!wrap) return;
        wrap.innerHTML = `<div class="muted" style="padding:20px; font-size:15px;">Fetching claims...</div>`;
        try {
            const snap = await window.db.collection("business_claims").orderBy("createdAt", "desc").limit(20).get();
            let docs = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            docs.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
            if (!docs.length) {
                wrap.innerHTML = `<div class="muted" style="padding:24px; font-size:15px;">No business claims yet.</div>`;
                return;
            }
            let html = `<div class="admin-table-scroll" style="overflow-x:auto;"><table class="admin-db-table"><thead><tr style="font-size:14px;"><th>Establishment</th><th>Claimant</th><th>Status</th><th>Actions</th></tr></thead><tbody>`;
            docs.forEach(c => {
                const st = String(c.status || "pending").toLowerCase();
                const badge = st === "approved" ? "status-accepted" : (st === "pending" ? "status-pending" : "status-rejected");
                const date = c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString() : "";
                html += `<tr style="font-size:14px;">
                    <td style="font-weight:700;">${escapeHtml(c.placeName || "Establishment")}<div style="font-weight:500; color:var(--ui-muted); font-size:12px;">${escapeHtml(date)}</div></td>
                    <td>${escapeHtml(c.userName || "User")}<div data-no-translate style="color:var(--ui-muted); font-size:12px;">${escapeHtml(c.userEmail || "")}</div></td>
                    <td><span class="status-badge ${badge}">${escapeHtml(st.toUpperCase())}</span></td>
                    <td>${st === "pending" ? `<button onclick="window.DashboardPage.approveClaim('${c.id}')" style="background:#dcfce7; color:#166534; border:none; padding:9px 14px; border-radius:9px; font-weight:800; cursor:pointer; margin-right:6px;">Approve</button><button onclick="window.DashboardPage.rejectClaim('${c.id}')" style="background:#fee2e2; color:#991b1b; border:none; padding:9px 14px; border-radius:9px; font-weight:800; cursor:pointer;">Reject</button>` : ""}</td>
                </tr>`;
            });
            html += `</tbody></table></div>`;
            wrap.innerHTML = html;
        } catch (e) { wrap.innerHTML = `<div style="color:red; padding:20px; font-size:15px;">Error: ${escapeHtml(e.message)}</div>`; }
    }

    async function approveClaim(claimId) {
        if (!requireAdminAction()) return;
        try {
            const claimRef = window.db.collection("business_claims").doc(claimId);
            const claimSnap = await claimRef.get();
            if (!claimSnap.exists) return alert("Claim not found.");
            const c = claimSnap.data();
            const claimantSnap = await window.db.collection("users").doc(c.userId).get().catch(() => null);
            const claimantRole = claimantSnap && claimantSnap.exists ? claimantSnap.data().role : null;
            const batch = window.db.batch();
            batch.set(window.db.collection('private_places').doc(c.placeId), {owner_email:c.userEmail || '',owner_uid:c.userId}, {merge:true});
            batch.update(window.db.collection("places").doc(c.placeId), {
                owner_uid: c.userId,
                owner_email: firebase.firestore.FieldValue.delete(),
                approval_status: "approved",
                claimStatus: "verified",
                is_verified: true
            });
            const claimUserUpdate = { ownedPlaceId: c.placeId };
            const claimGrantedRole = roleAfterOwnershipGrant(claimantRole, c.userId);
            if (claimGrantedRole) claimUserUpdate.role = claimGrantedRole;
            batch.update(window.db.collection("users").doc(c.userId), claimUserUpdate);
            batch.update(claimRef, { status: "approved" });
            await batch.commit();
            logAdminAction("claim_approved", { collection: "business_claims", id: claimId, label: c.placeName || "" });
            alert("Claim approved. The claimant is now the establishment owner.");
            loadAdminClaims();
        } catch (e) { alert("Error: " + e.message); }
    }

    async function rejectClaim(claimId) {
        if (!requireAdminAction()) return;
        try {
            await window.db.collection("business_claims").doc(claimId).update({ status: "rejected" });
            logAdminAction("claim_rejected", { collection: "business_claims", id: claimId });
            loadAdminClaims();
        } catch (e) { alert("Error: " + e.message); }
    }

    async function loadAdminReports() {
        if (!requireAdminAction()) return;
        const wrap = document.getElementById("adminReportsList");
        if (!wrap) return;
        wrap.innerHTML = `<div class="muted" style="padding:20px; font-size:15px;">Fetching reports...</div>`;
        try {
            const snap = await window.db.collection("place_reports").orderBy("createdAt", "desc").limit(20).get();
            let docs = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            docs.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
            if (!docs.length) {
                wrap.innerHTML = `<div class="muted" style="padding:24px; font-size:15px;">No reports yet.</div>`;
                return;
            }
            let html = `<div class="admin-table-scroll" style="overflow-x:auto;"><table class="admin-db-table"><thead><tr style="font-size:14px;"><th>Establishment</th><th>Issue</th><th>Details</th><th>Status</th><th>Actions</th></tr></thead><tbody>`;
            docs.forEach(r => {
                const st = String(r.status || "open").toLowerCase();
                const badge = st === "resolved" ? "status-accepted" : (st === "dismissed" ? "status-rejected" : "status-pending");
                html += `<tr style="font-size:14px;">
                    <td style="font-weight:700;">${escapeHtml(r.placeName || "Establishment")}<div data-no-translate style="font-weight:500; color:var(--ui-muted); font-size:12px;">${escapeHtml(r.userName || "")}</div></td>
                    <td>${escapeHtml(r.issueType || "Report")}</td>
                    <td style="max-width:280px; white-space:pre-wrap;">${escapeHtml(r.details || "")}</td>
                    <td><span class="status-badge ${badge}">${escapeHtml(st.toUpperCase())}</span></td>
                    <td>${st === "open" ? `<button onclick="window.DashboardPage.resolveReport('${r.id}')" style="background:#dcfce7; color:#166534; border:none; padding:9px 14px; border-radius:9px; font-weight:800; cursor:pointer; margin-right:6px;">Resolve</button><button onclick="window.DashboardPage.dismissReport('${r.id}')" style="background:#f1f5f9; color:var(--ui-muted); border:none; padding:9px 14px; border-radius:9px; font-weight:800; cursor:pointer;">Dismiss</button>` : ""}</td>
                </tr>`;
            });
            html += `</tbody></table></div>`;
            wrap.innerHTML = html;
        } catch (e) { wrap.innerHTML = `<div style="color:red; padding:20px; font-size:15px;">Error: ${escapeHtml(e.message)}</div>`; }
    }

    async function resolveReport(reportId) {
        if (!requireAdminAction()) return;
        try { await window.db.collection("place_reports").doc(reportId).update({ status: "resolved" }); logAdminAction("report_resolved", { collection: "place_reports", id: reportId }); loadAdminReports(); }
        catch (e) { alert("Error: " + e.message); }
    }

    async function dismissReport(reportId) {
        if (!requireAdminAction()) return;
        try { await window.db.collection("place_reports").doc(reportId).update({ status: "dismissed" }); logAdminAction("report_dismissed", { collection: "place_reports", id: reportId }); loadAdminReports(); }
        catch (e) { alert("Error: " + e.message); }
    }

    async function loadAdminAudit() {
        if (!requireAdminAction()) return;
        const wrap = document.getElementById("adminAuditList");
        if (!wrap) return;
        wrap.innerHTML = `<div class="muted" style="padding:20px; font-size:15px;">Fetching audit log...</div>`;
        try {
            const snap = await window.db.collection("admin_audit").orderBy("createdAt", "desc").limit(20).get();
            if (snap.empty) {
                wrap.innerHTML = `<div class="muted" style="padding:24px; font-size:15px;">No admin actions logged yet.</div>`;
                return;
            }
            let html = `<div class="admin-table-scroll" style="overflow-x:auto;"><table class="admin-db-table"><thead><tr style="font-size:14px;"><th>When</th><th>Admin</th><th>Action</th><th>Target</th></tr></thead><tbody>`;
            snap.forEach(doc => {
                const a = doc.data();
                const when = a.createdAt?.toDate ? a.createdAt.toDate().toLocaleString() : "";
                html += `<tr style="font-size:14px;">
                    <td style="white-space:nowrap;">${escapeHtml(when)}</td>
                    <td data-no-translate>${escapeHtml(a.actorEmail || a.actorUid || "")}</td>
                    <td><span class="status-badge" style="background:var(--ui-accent-soft); color:var(--ui-accent);">${escapeHtml(String(a.action || "").toUpperCase())}</span></td>
                    <td>${escapeHtml(a.targetCollection || "")} ${escapeHtml(a.targetLabel || "")}<div style="color:var(--ui-muted); font-size:12px;">${escapeHtml(a.detail || "")}</div></td>
                </tr>`;
            });
            html += `</tbody></table></div>`;
            wrap.innerHTML = html;
        } catch (e) { wrap.innerHTML = `<div style="color:red; padding:20px; font-size:15px;">Error: ${escapeHtml(e.message)}</div>`; }
    }

    async function loadAdminBuzz() {
        if (!requireAdminAction()) return;
        const wrap = document.getElementById("adminBuzzList");
        if (!wrap) return;
        wrap.innerHTML = `<div class="muted" style="padding:20px; font-size:15px;">Fetching buzz posts...</div>`;
        try {
            const snap = await window.db.collection("buzz_posts").orderBy("createdAt", "desc").limit(20).get();
            let posts = [];
            let html = `<div class="admin-table-scroll" style="overflow-x: auto;"><table class="admin-db-table"><thead><tr style="font-size: 14px;"><th>Author</th><th>Barangay</th><th>Content</th><th>Type</th><th>Actions</th></tr></thead><tbody>`;
            snap.forEach(doc => {
                const d = doc.data();
                posts.push({ ...d, id: doc.id });
                html += `<tr style="font-size: 14px;" onclick="window.DashboardPage.openEditPanel('buzz_posts', '${doc.id}')">
                    <td data-no-translate style="font-weight:700;">${escapeHtml(d.authorName || 'User')}</td>
                    <td>${escapeHtml(d.barangay || 'All')}</td>
                    <td data-no-translate style="max-width:250px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(d.body || d.title || '')}</td>
                    <td><span class="status-badge" style="background:var(--ui-accent-soft); color:var(--ui-accent);">${(d.type || 'general').toUpperCase()}</span></td>
                    <td><button onclick="event.stopPropagation(); window.DashboardPage.adminDeleteRecord('buzz_posts', '${doc.id}')" style="background:#fef2f2; color:#ef4444; border:none; padding:8px 12px; border-radius:8px; cursor:pointer;" title="Delete Post"><i data-lucide="trash-2" style="width:16px; height:16px;"></i></button></td>
                </tr>`;
            });
            adminData.buzz_posts = posts;
            html += `</tbody></table></div>`;
            if (snap.size >= 20) html += `<div style="text-align:center; padding:14px;"><button onclick="window.DashboardPage.loadAdminMore('buzz_posts')" style="padding:11px 22px; border-radius:12px; border:1.5px solid var(--ui-success-bg); background:var(--ui-accent-soft); color:var(--ui-success-ink); font-weight:800; cursor:pointer;">Load more</button></div>`;
            window.__adminCursor_buzz_posts = snap.docs[snap.docs.length - 1] || null;
            wrap.innerHTML = html;
            window.debouncedIcons?.();
        } catch (e) { wrap.innerHTML = `<div style="color:red; padding:20px; font-size:15px;">Error: ${escapeHtml(e.message)}</div>`; }
    }

    function adminBookingStatusOptions(value) {
        const status=String(value || 'unknown');
        const labels={payment_submitted:'Payment submitted',payment_confirmed:'Payment confirmed',preparing:'Preparing',ready:'Ready',ready_for_pickup:'Ready for pickup',out_for_delivery:'Out for delivery',delivered:'Delivered',fulfilled:'Fulfilled',received:'Received',cancelled:'Cancelled',unknown:'No status recorded'};
        const current=['pending','accepted','rejected'].includes(status)?'':`<option value="${escapeHtml(status)}" selected disabled>${escapeHtml(labels[status] || status.replace(/_/g,' '))}</option>`;
        return current+['pending','accepted','rejected'].map(key=>`<option value="${key}"${status===key?' selected':''}>${key[0].toUpperCase()+key.slice(1)}</option>`).join('');
    }

    async function loadAdminBookings() {
        if (!requireAdminAction()) return;
        const wrap = document.getElementById("adminBookingsList");
        if (!wrap) return;
        wrap.innerHTML = `<div class="muted" style="padding:20px; font-size:15px;">Fetching transactions...</div>`;
        try {
            const snap = await window.db.collection("bookings").orderBy("createdAt", "desc").limit(20).get();
            let bks = [];
            let html = `<div class="admin-table-scroll" style="overflow-x: auto;"><table class="admin-db-table"><thead><tr style="font-size: 14px;"><th>Place</th><th>Customer</th><th>Details</th><th>Status</th><th>Actions</th></tr></thead><tbody>`;
            snap.forEach(doc => {
                const d = doc.data();
                if ((d.deletedBy || []).includes("admin_deleted")) return;
                bks.push({ ...d, id: doc.id });
                const s = d.status || d.bookingStatus || 'unknown';
                html += `<tr style="font-size: 14px;" onclick="window.DashboardPage.openEditPanel('bookings', '${doc.id}')">
                    <td data-no-translate style="font-weight:700;">${escapeHtml(d.placeName || 'N/A')}</td>
                    <td data-no-translate style="font-weight:600; color:var(--ui-muted);">${escapeHtml(d.userName || 'N/A')}</td>
                    <td style="max-width:250px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(d.details || '')}</td>
                    <td>
                        <select onclick="event.stopPropagation()" onchange="window.DashboardPage.adminUpdateBookingStatus('${doc.id}', this.value)" style="padding:8px; border-radius:6px; border:1px solid #cbd5e1; outline:none; font-size: 13px;">
                            ${adminBookingStatusOptions(s)}
                        </select>
                    </td>
                    <td><button onclick="event.stopPropagation(); window.DashboardPage.adminDeleteRecord('bookings', '${doc.id}')" style="background:#fef2f2; color:#ef4444; border:none; padding:8px 12px; border-radius:8px; cursor:pointer;" title="Hide Request from Admin"><i data-lucide="trash-2" style="width:16px; height:16px;"></i></button></td>
                </tr>`;
            });
            adminData.bookings = bks;
            html += `</tbody></table></div>`;
            if (snap.size >= 20) html += `<div style="text-align:center; padding:14px;"><button onclick="window.DashboardPage.loadAdminMore('bookings')" style="padding:11px 22px; border-radius:12px; border:1.5px solid var(--ui-success-bg); background:var(--ui-accent-soft); color:var(--ui-success-ink); font-weight:800; cursor:pointer;">Load more</button></div>`;
            window.__adminCursor_bookings = snap.docs[snap.docs.length - 1] || null;
            wrap.innerHTML = html;
            window.debouncedIcons?.();
        } catch (e) { wrap.innerHTML = `<div style="color:red; padding:20px; font-size:15px;">Error: ${escapeHtml(e.message)}</div>`; }
    }

    async function loadAdminMessages() {
        if (!requireAdminAction()) return;
        const wrap = document.getElementById("adminMessagesList");
        if (!wrap) return;
        wrap.innerHTML = `<div class="muted" style="padding:20px; font-size:15px;">Fetching messages...</div>`;
        try {
            const snap = await window.db.collection("messages").orderBy("createdAt", "desc").limit(20).get();
            let msgs = [];
            let html = `<div class="admin-table-scroll" style="overflow-x: auto;"><table class="admin-db-table"><thead><tr style="font-size: 14px;"><th>Place</th><th>Sender</th><th>Message</th><th>Reply</th><th>Actions</th></tr></thead><tbody>`;
            snap.forEach(doc => {
                const d = doc.data();
                if ((d.deletedBy || []).includes("admin_deleted")) return;
                msgs.push({ ...d, id: doc.id });
                html += `<tr style="font-size: 14px;" onclick="window.DashboardPage.openEditPanel('messages', '${doc.id}')">
                    <td data-no-translate style="font-weight:700;">${escapeHtml(d.placeName || 'N/A')}</td>
                    <td data-no-translate style="font-weight:600; color:var(--ui-muted);">${escapeHtml(d.userName || 'N/A')}</td>
                    <td style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(d.text || '')}</td>
                    <td style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--ui-muted);">${escapeHtml(d.reply || 'No reply yet')}</td>
                    <td><button onclick="event.stopPropagation(); window.DashboardPage.adminDeleteRecord('messages', '${doc.id}')" style="background:#fef2f2; color:#ef4444; border:none; padding:8px 12px; border-radius:8px; cursor:pointer;" title="Hide Message from Admin"><i data-lucide="trash-2" style="width:16px; height:16px;"></i></button></td>
                </tr>`;
            });
            adminData.messages = msgs;
            html += `</tbody></table></div>`;
            if (snap.size >= 20) html += `<div style="text-align:center; padding:14px;"><button onclick="window.DashboardPage.loadAdminMore('messages')" style="padding:11px 22px; border-radius:12px; border:1.5px solid var(--ui-success-bg); background:var(--ui-accent-soft); color:var(--ui-success-ink); font-weight:800; cursor:pointer;">Load more</button></div>`;
            window.__adminCursor_messages = snap.docs[snap.docs.length - 1] || null;
            wrap.innerHTML = html;
            window.debouncedIcons?.();
        } catch (e) { wrap.innerHTML = `<div style="color:red; padding:20px; font-size:15px;">Error: ${escapeHtml(e.message)}</div>`; }
    }

    // Load More: fetch the next 100 rows and append them to the open table.
    async function loadAdminMore(collectionName) {
        if (!requireAdminAction()) return;
        const cursorKey = "__adminCursor_" + collectionName;
        const cursor = window[cursorKey];
        if (!cursor) return;
        const wrapId = { buzz_posts: "adminBuzzList", bookings: "adminBookingsList", messages: "adminMessagesList" }[collectionName];
        const wrap = document.getElementById(wrapId);
        const tbody = wrap ? wrap.querySelector("tbody") : null;
        if (!tbody) return;
        try {
            const snap = await window.db.collection(collectionName)
                .orderBy("createdAt", "desc").startAfter(cursor).limit(20).get();
            let rows = "";
            snap.forEach(doc => {
                const d = doc.data();
                if (collectionName === "buzz_posts") {
                    rows += `<tr style="font-size: 14px;" onclick="window.DashboardPage.openEditPanel('buzz_posts', '${doc.id}')">
                        <td data-no-translate style="font-weight:700;">${escapeHtml(d.authorName || 'User')}</td>
                        <td>${escapeHtml(d.barangay || 'All')}</td>
                        <td data-no-translate style="max-width:250px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(d.body || d.title || '')}</td>
                        <td><span class="status-badge" style="background:var(--ui-accent-soft); color:var(--ui-accent);">${(d.type || 'general').toUpperCase()}</span></td>
                        <td><button onclick="event.stopPropagation(); window.DashboardPage.adminDeleteRecord('buzz_posts', '${doc.id}')" style="background:#fef2f2; color:#ef4444; border:none; padding:8px 12px; border-radius:8px; cursor:pointer;" title="Delete Post"><i data-lucide="trash-2" style="width:16px; height:16px;"></i></button></td>
                    </tr>`;
                } else if (collectionName === "bookings") {
                    if ((d.deletedBy || []).includes("admin_deleted")) return;
                    const s = d.status || d.bookingStatus || 'unknown';
                    rows += `<tr style="font-size: 14px;" onclick="window.DashboardPage.openEditPanel('bookings', '${doc.id}')">
                        <td data-no-translate style="font-weight:700;">${escapeHtml(d.placeName || 'N/A')}</td>
                        <td data-no-translate style="font-weight:600; color:var(--ui-muted);">${escapeHtml(d.userName || 'N/A')}</td>
                        <td style="max-width:250px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(d.details || '')}</td>
                        <td><select onclick="event.stopPropagation()" onchange="window.DashboardPage.adminUpdateBookingStatus('${doc.id}', this.value)" style="padding:8px; border-radius:6px; border:1px solid #cbd5e1; outline:none; font-size: 13px;">
                            ${adminBookingStatusOptions(s)}
                        </select></td>
                        <td><button onclick="event.stopPropagation(); window.DashboardPage.adminDeleteRecord('bookings', '${doc.id}')" style="background:#fef2f2; color:#ef4444; border:none; padding:8px 12px; border-radius:8px; cursor:pointer;" title="Hide Request from Admin"><i data-lucide="trash-2" style="width:16px; height:16px;"></i></button></td>
                    </tr>`;
                } else if (collectionName === "messages") {
                    if ((d.deletedBy || []).includes("admin_deleted")) return;
                    rows += `<tr style="font-size: 14px;" onclick="window.DashboardPage.openEditPanel('messages', '${doc.id}')">
                        <td data-no-translate style="font-weight:700;">${escapeHtml(d.placeName || 'N/A')}</td>
                        <td data-no-translate style="font-weight:600; color:var(--ui-muted);">${escapeHtml(d.userName || 'N/A')}</td>
                        <td style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(d.text || '')}</td>
                        <td style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--ui-muted);">${escapeHtml(d.reply || 'No reply yet')}</td>
                        <td><button onclick="event.stopPropagation(); window.DashboardPage.adminDeleteRecord('messages', '${doc.id}')" style="background:#fef2f2; color:#ef4444; border:none; padding:8px 12px; border-radius:8px; cursor:pointer;" title="Hide Message from Admin"><i data-lucide="trash-2" style="width:16px; height:16px;"></i></button></td>
                    </tr>`;
                }
            });
            tbody.insertAdjacentHTML("beforeend", rows);
            window[cursorKey] = snap.docs[snap.docs.length - 1] || cursor;
            window.debouncedIcons?.();
            if (snap.size < 100) {
                const btn = wrap.querySelector("button[onclick*='loadAdminMore']");
                if (btn) btn.parentElement.remove();
            }
        } catch (e) { alert("Error loading more: " + e.message); }
    }

    // 🔥 FIX: CUSTOM CONFIRM PARA SA ADMIN DELETE RECORD
    async function adminDeleteRecord(collectionName, id) {
        if (!requireAdminAction()) return;

        const isHistoryRecord = collectionName === "bookings" || collectionName === "messages";
        const title = isHistoryRecord ? "Hide Record" : "Delete Record";
        const message = isHistoryRecord
            ? "Hide this record from the admin dashboard? It will remain in the customer's transaction/chat history."
            : "Are you sure you want to permanently delete this record from the database?";
        const confirmText = isHistoryRecord ? "Hide" : "Delete";

        const ans = await window.vConfirm(title, message, confirmText, true);
        if (!ans) return;

        try {
            if (isHistoryRecord) {
                await window.db.collection(collectionName).doc(id).update({
                    deletedBy: firebase.firestore.FieldValue.arrayUnion("admin_deleted"),
                    adminHiddenAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                await window.db.collection(collectionName).doc(id).delete();
            }

            logAdminAction(isHistoryRecord ? "record_hidden" : "record_deleted", { collection: collectionName, id });
            closeSidePanel();
            if (collectionName === 'places') { render(); window.MapPage?.refresh?.(); }
            if (collectionName === 'buzz_posts') loadAdminBuzz();
            if (collectionName === 'bookings') loadAdminBookings();
            if (collectionName === 'messages') loadAdminMessages();
        } catch (e) { alert("Error updating record: " + e.message); }
    }

    // Request status updater for owner dashboard and admin dashboard
async function updateBookingStatus(id, stat) {
    try {
        const bookingRef = window.db.collection("bookings").doc(id);
        // The inbox listener already holds this booking in memory — only
        // pay a read when it is not there (e.g. admin table actions).
        const cachedBooking = bookingMap.get(id);
        let bookingData;
        if (cachedBooking) {
            bookingData = cachedBooking;
        } else {
            const bookingDoc = await bookingRef.get();
            bookingData = bookingDoc.exists ? bookingDoc.data() : {};
        }
        const requestType = String(bookingData.requestType || "booking").toLowerCase();
        const currentUser = window.auth?.currentUser;
        const transactionId = bookingData.transactionId || id;

        // Step 1 (critical): update the booking itself. If this fails, stop.
        try {
            await window.ViciData.command("booking", { bookingId: id, patch: { status: stat } });
        } catch (e) {
            console.error("[updateBookingStatus] booking update failed:", e);
            throw new Error("Could not update the booking (" + (e.code || e.message) + "). Please check your connection and try again.");
        }

        // 🛵 DELIVERY SMART FLOW FROM DASHBOARD:
        // If owner accepts a Delivery Order from dashboard, auto-create the delivery details card in chat.
        if (stat === "accepted" && requestType === "delivery_order" && bookingData.paymentFlowVersion !== 2) {
            const existingDeliveryReq = await window.db.collection("messages").where("placeId", "==", bookingData.placeId)
                .where("type", "==", "requirement_request")
                .where("bookingId", "==", id)
                .where("autoGeneratedDelivery", "==", true)
                .limit(1)
                .get();

            if (existingDeliveryReq.empty) {
                const preferredPayment = bookingData.paymentMethod || "GCash";
                const paymentOptions = Array.from(new Set([
                    preferredPayment,
                    "GCash",
                    "Maya",
                    "Bank Transfer",
                    "Others",
                    "Cash on Delivery if allowed"
                ].filter(Boolean)));

                await window.ContentPolicy.create(window.db, 'messages', {
                    placeId: bookingData.placeId,
                    placeName: bookingData.placeName,
                    userId: bookingData.userId,
                    userName: bookingData.userName || "Customer",
                    type: "requirement_request",
                    requestType: "delivery_order",
                    transactionId,
                    bookingId: id,
                    autoGeneratedDelivery: true,
                    requirements: {
                        address: true,
                        location: true,
                        payment: false,
                        orderDetails: true
                    },
                    prefillAddress: bookingData.deliveryAddress || "",
                    prefillOrderItems: bookingData.orderItems || "",
                    prefillPaymentMethod: preferredPayment,
                    amount: "",
                    acceptedPaymentMethods: paymentOptions,
                    notes: "Delivery accepted. Please submit complete address, barangay, city, landmark/location notes, current location, payment method, and reference number if paid online. Online payment is recommended to avoid fake orders.",
                    requirementStatus: "waiting_customer",
                    text: "Delivery order accepted. Customer can now submit delivery details.",
                    senderUid: currentUser?.uid || "business",
                    senderRole: "owner",
                    senderName: bookingData.placeName || "Business",
                    createdBy: currentUser?.uid || "business",
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    reply: null
                });
            }
        }

        // The live inbox listeners re-render on the write above — no
        // manual re-render here. (The old renderMy() call restarted every
        // inbox listener, ~80 reads per tap, and loadAdminBookings()
        // popped a false "Admin access is required" alert for owners.)
        // Admin tables are fetch-based, so refresh them for admins only.
        if (isAdmin()) loadAdminBookings();
    } catch (e) {
        console.error("[updateBookingStatus]", e);
        window.showToast?.(e.message || "Error updating request status.", "error");
    }
}

    // 🔥 FIX: CUSTOM CONFIRM PARA SA USER ROLE
    async function updateUserRole(uid, newRole) {
        if (uid === PERMANENT_ADMIN_UID) {
            alert("This is the permanent admin account. Its role can never be changed.");
            loadAdminUsers();
            return;
        }
        if (!requireAdminAction()) {
            loadAdminUsers();
            return;
        }

        const ans = await window.vConfirm("Change Role", `Change this user's role to ${newRole.toUpperCase()}?`, "Confirm", false);
        if (!ans) { loadAdminUsers(); return; }

        try { 
            await window.db.collection("users").doc(uid).update({ role: newRole });
            logAdminAction("role_changed", { collection: "users", id: uid, detail: "to " + newRole });
            alert("Role updated successfully!"); 
            loadAdminUsers(); 
            renderAdmin(); 
        } catch (e) { alert("Error: " + e.message); }
    }

    // =====================================
    // 🔥 FIX: CUSTOM UI PARA SA MANUAL B2B OWNER ASSIGNMENT 🔥
    // =====================================
    async function manualAssignOwner(placeId, placeName) {
        if (!requireAdminAction()) return;

        const targetEmail = await new Promise((resolve) => {
            const overlay = document.createElement("div");
            overlay.style.position = "fixed";
            overlay.style.top = "0";
            overlay.style.left = "0";
            overlay.style.width = "100%";
            overlay.style.height = "100%";
            overlay.style.background = "rgba(0,0,0,0.6)";
            overlay.style.zIndex = "9999";
            overlay.style.display = "flex";
            overlay.style.alignItems = "center";
            overlay.style.justifyContent = "center";

            overlay.innerHTML = `
                <div style="background:var(--ui-surface); padding: 24px; border-radius: 16px; width: 90%; max-width: 340px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
                    <h3 style="margin-top: 0; color:var(--ui-ink); font-size: 18px; margin-bottom: 8px;">Assign Owner</h3>
                    <p style="font-size: 14px; color:var(--ui-muted); margin-bottom: 16px; line-height: 1.5;">Assigning owner for: <strong data-no-translate style="color:var(--ui-ink);">${escapeHtml(placeName)}</strong><br><br>Enter user's registered email address:</p>
                    <input type="email" id="assignEmailInput" placeholder="user@example.com" autocomplete="off" style="width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 20px; box-sizing: border-box; font-family: inherit; font-size: 14px;" />
                    <div style="display: flex; gap: 10px;">
                        <button id="assignCancelBtn" style="flex: 1; padding: 12px; border-radius: 8px; border: none; background: #f1f5f9; color:var(--ui-muted); font-weight: bold; cursor: pointer;">Cancel</button>
                        <button id="assignConfirmBtn" style="flex: 1; padding: 12px; border-radius: 8px; border: none; background: var(--ui-primary,#237e72); color: white; font-weight: bold; cursor: pointer;">Assign</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            
            const inputField = document.getElementById("assignEmailInput");
            setTimeout(() => inputField.focus(), 100); 

            const cleanup = (val) => {
                overlay.remove();
                resolve(val);
            };

            document.getElementById("assignCancelBtn").onclick = () => cleanup(null);
            document.getElementById("assignConfirmBtn").onclick = () => cleanup(inputField.value.trim());
        });

        if (!targetEmail) return; 

        try {
            const userQuery = await window.db.collection("users")
                .where("email", "==", targetEmail.toLowerCase().trim())
                .limit(1)
                .get();

            if (userQuery.empty) {
                alert("Error: No user found with that email. Make sure they registered in the app first.");
                return;
            }

            const userDoc = userQuery.docs[0];
            const userUid = userDoc.id;

            const batch = window.db.batch();

            const userRef = window.db.collection("users").doc(userUid);
            const userUpdate = { ownedPlaceId: placeId };
            const grantedRole = roleAfterOwnershipGrant(userDoc.data().role, userUid);
            if (grantedRole) userUpdate.role = grantedRole;
            batch.update(userRef, userUpdate);

            const placeRef = window.db.collection("places").doc(placeId);
            batch.set(window.db.collection('private_places').doc(placeId), {owner_email:targetEmail.toLowerCase().trim(),owner_uid:userUid}, {merge:true});
            batch.update(placeRef, { 
                owner_uid: userUid,
                owner_email: firebase.firestore.FieldValue.delete(),
                approval_status: "approved",
                claimStatus: "verified",
                is_verified: true
            });

            await batch.commit();
            alert(`Success! ${targetEmail} is now the owner of ${placeName}.`);

            // Ownership changed: drop the short-lived caches so My
            // Establishments and the admin stats reflect it at once.
            myPlacesCache = null; myPlacesCacheAt = 0;
            adminSnapCache = null; adminSnapAt = 0;
            renderMy();
            renderAdmin();

        } catch (error) {
            console.error("Assignment Error:", error);
            alert("Something went wrong. Check console.");
        }
    }

    // =====================================
    // 🔥 UNIVERSAL DYNAMIC EDIT PANEL 🔥
    // =====================================
    function openEditPanel(type, id) {
        if (!requireAdminAction()) return;
        const overlay = document.getElementById("adminSidePanelOverlay");
        const panelTitle = document.getElementById("panelTitle");
        const panelBody = document.querySelector(".panel-body");

        let formHtml = `<input type="hidden" id="dynEditId" value="${id}">`;

        if (type === 'places') {
            const data = adminData.places.find(p => p.id === id);
if (!data) return;

const currentCat = data.category || data.cat || "default";

panelTitle.textContent = "Edit Establishment";
            formHtml += `
                <div class="admin-field"><label>Name</label><div class="sub-label">Establishment name</div><input type="text" id="dynName" value="${escapeHtml(data.name || '')}" style="font-size: 15px; padding: 12px;"/></div>
                
                <div class="admin-field"><label>Category</label><div class="sub-label">Type of establishment</div>
                    <select id="dynCat" style="font-size: 15px; padding: 12px;">
                        <option value="restaurant" ${currentCat === 'restaurant' ? 'selected' : ''}>Restaurant</option>
<option value="cafe" ${currentCat === 'cafe' ? 'selected' : ''}>Café</option>
<option value="bakery" ${currentCat === 'bakery' ? 'selected' : ''}>Bakery</option>
<option value="milktea" ${currentCat === 'milktea' ? 'selected' : ''}>Milk Tea</option>
<option value="snackhouse" ${currentCat === 'snackhouse' ? 'selected' : ''}>Snack House</option>
<option value="foodstall" ${currentCat === 'foodstall' ? 'selected' : ''}>Food Stall</option>
<option value="eatery" ${currentCat === 'eatery' ? 'selected' : ''}>Eatery</option>
<option value="dessert" ${currentCat === 'dessert' ? 'selected' : ''}>Dessert Shop</option>
<option value="fastfood" ${currentCat === 'fastfood' ? 'selected' : ''}>Fast-Food</option>
<option value="default" ${currentCat === 'default' ? 'selected' : ''}>Default</option>
                    </select>
                </div>
                <div class="admin-field"><label>Description</label><div class="sub-label">Short description</div><input type="text" id="dynDesc" value="${escapeHtml(data.description || data.desc || '')}" style="font-size: 15px; padding: 12px;"/></div>
                <div class="admin-field"><label>Address</label><div class="sub-label">Street address in Lipa City</div><input type="text" id="dynAddr" value="${escapeHtml(data.address || data.addr || '')}" style="font-size: 15px; padding: 12px;"/></div>
                <div class="admin-field"><label>Barangay</label><div class="sub-label">Barangay location</div><input type="text" id="dynBrgy" value="${escapeHtml(data.barangay || data.brgy || '')}" style="font-size: 15px; padding: 12px;"/></div>
                <div class="admin-field"><label>Owner Email</label><div class="sub-label">Business owner email</div><input type="text" id="dynEmail" value="${escapeHtml(data.owner_email || '')}" placeholder="Enter user's email..." style="font-size: 15px; padding: 12px;"/></div>
                <div class="admin-field"><label>Approval status</label>
                    <select id="dynApproval" style="font-size: 15px; padding: 12px;">
                        <option value="pending" ${(data.approval_status || data.status) === 'pending' ? 'selected' : ''}>pending</option>
                        <option value="approved" ${(data.approval_status || data.status) === 'approved' ? 'selected' : ''}>approved</option>
                        <option value="rejected" ${(data.approval_status || data.status) === 'rejected' ? 'selected' : ''}>rejected</option>
                    </select>
                </div>
                <div class="admin-checkbox-field"><div><label style="font-size: 15px;">is_verified</label><div class="sub-label">Verified by admin</div></div><input type="checkbox" id="dynVerified" ${data.is_verified ? 'checked' : ''} style="width: 20px; height: 20px;"></div>
                <div class="admin-checkbox-field"><div><label style="font-size: 15px;">accepts_booking</label><div class="sub-label">Allow customers to book</div></div><input type="checkbox" id="dynBooking" ${data.accepts_booking ? 'checked' : ''} style="width: 20px; height: 20px;"></div>

                <div class="admin-checkbox-field"><div><label style="font-size: 15px;">delivery_grab</label><div class="sub-label">Available on Grab/Foodpanda</div></div><input type="checkbox" id="dynGrab" ${data.delivery_grab ? 'checked' : ''} style="width: 20px; height: 20px;"></div>
                <div class="admin-checkbox-field"><div><label style="font-size: 15px;">delivery_inhouse</label><div class="sub-label">Has in-house delivery</div></div><input type="checkbox" id="dynInHouse" ${data.delivery_inhouse ? 'checked' : ''} style="width: 20px; height: 20px;"></div>
                <div class="admin-field"><label>Delivery Radius (km)</label><div class="sub-label">Delivery distance in km (e.g. 5)</div><input type="number" id="dynRadius" value="${escapeHtml(data.delivery_radius || '')}" style="font-size: 15px; padding: 12px;"/></div>
            `;
        }
        else if (type === 'buzz_posts') {
            const data = adminData.buzz_posts.find(p => p.id === id);
            if (!data) return;
            panelTitle.textContent = "Edit BuzzPost";
            formHtml += `
                <div class="admin-field"><label>Content</label><div class="sub-label">Post content / text</div><textarea id="dynBody" rows="4" style="font-size: 15px; padding: 12px;">${escapeHtml(data.body || data.title || '')}</textarea></div>
                <div class="admin-field"><label>Post type</label><div class="sub-label">Type of post</div>
                    <select id="dynType" style="font-size: 15px; padding: 12px;">
                        <option value="promo" ${data.type === 'promo' ? 'selected' : ''}>promo</option>
                        <option value="event" ${data.type === 'event' ? 'selected' : ''}>event</option>
                        <option value="tip" ${data.type === 'tip' ? 'selected' : ''}>tip</option>
                        <option value="announcement" ${data.type === 'announcement' ? 'selected' : ''}>announcement</option>
                        <option value="general" ${(data.type === 'general' || !data.type) ? 'selected' : ''}>general</option>
                    </select>
                </div>
                <div class="admin-field"><label>Barangay</label><div class="sub-label">Barangay/area this post belongs to</div><input type="text" id="dynBrgy" value="${escapeHtml(data.barangay || '')}" style="font-size: 15px; padding: 12px;"></div>
                <div class="admin-field"><label>Author</label><div class="sub-label">Display name of poster</div><input type="text" id="dynAuthor" value="${escapeHtml(data.authorName || '')}" style="font-size: 15px; padding: 12px;"></div>
            `;
        }
        else if (type === 'bookings') {
            const data = adminData.bookings.find(p => p.id === id);
            if (!data) return;
            panelTitle.textContent = "Edit Booking";
            formHtml += `
                <div class="admin-field"><label>Customer</label><input type="text" id="dynCustomer" value="${escapeHtml(data.userName || '')}" style="font-size: 15px; padding: 12px;"></div>
                <div class="admin-field"><label>Request details</label><div class="sub-label">Date, time, and service notes</div><textarea id="dynDetails" rows="5" style="font-size: 15px; padding: 12px;">${escapeHtml(data.details || '')}</textarea></div>
                <div class="admin-field"><label>status</label>
                    <select id="dynStatus" style="font-size: 15px; padding: 12px;">
                        <option value="pending" ${data.status === 'pending' ? 'selected' : ''}>pending</option>
                        <option value="accepted" ${data.status === 'accepted' ? 'selected' : ''}>accepted / confirmed</option>
                        <option value="rejected" ${data.status === 'rejected' ? 'selected' : ''}>rejected</option>
                    </select>
                </div>
            `;
        }
        else if (type === 'messages') {
            const data = adminData.messages.find(p => p.id === id);
            if (!data) return;
            panelTitle.textContent = "Edit Message Thread";
            formHtml += `
                <div class="admin-field"><label>Sender</label><div class="sub-label">Display name of the sender</div><input type="text" id="dynSender" value="${escapeHtml(data.userName || '')}" style="font-size: 15px; padding: 12px;"></div>
                <div class="admin-field"><label>Content</label><div class="sub-label">Message text from customer</div><textarea id="dynText" rows="4" style="font-size: 15px; padding: 12px;">${escapeHtml(data.text || '')}</textarea></div>
                <div class="admin-field"><label>Reply from the business owner</label><div class="sub-label">Reply from the business owner</div><textarea id="dynReply" rows="4" style="font-size: 15px; padding: 12px;">${escapeHtml(data.reply || '')}</textarea></div>
            `;
        }

        formHtml += `
            <div style="display: flex; gap: 12px; margin-top: 16px;">
                <button onclick="window.DashboardPage.saveDynamicEdit('${type}')" class="black-submit-btn" style="flex: 1; margin-top: 0; font-size: 15px; padding: 14px;">Submit Changes</button>
                <button onclick="window.DashboardPage.adminDeleteRecord('${type}', '${id}')" style="background: #ef4444; color: white; padding: 0 18px; border-radius: 10px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;" title="Delete Record">
                    <i data-lucide="trash-2" style="width: 22px; height: 22px;"></i>
                </button>
            </div>
        `;

        panelBody.innerHTML = formHtml;
        window.debouncedIcons?.();
        overlay.classList.remove("hidden");
        overlay.classList.add("show");
    }

    async function saveDynamicEdit(type) {
        if (!requireAdminAction()) return;

        const id = document.getElementById("dynEditId").value;
        const btn = document.querySelector(".black-submit-btn");
        btn.textContent = "Saving..."; btn.disabled = true;

        let updateData = {};

        if (type === 'places') {
    const name = document.getElementById("dynName") ? document.getElementById("dynName").value.trim() : "";
    const category = document.getElementById("dynCat").value;
    const description = document.getElementById("dynDesc").value.trim();
    const address = document.getElementById("dynAddr").value.trim();
    const barangay = document.getElementById("dynBrgy").value.trim();

    if (!name || !category || !description || !address || !barangay) {
    alert("Please fill Name, Category, Description, Address, and Barangay.");
    btn.textContent = "Submit Changes";
    btn.disabled = false;
    return;
}

if (name.length < 3) {
    alert("Establishment name must be at least 3 characters.");
    btn.textContent = "Submit Changes";
    btn.disabled = false;
    return;
}

if (description.length < 10) {
    alert("Description must be at least 10 characters.");
    btn.textContent = "Submit Changes";
    btn.disabled = false;
    return;
}

    updateData = {
        name,

        // standard field names
        category,
        description,
        address,
        barangay,

        // old field names para hindi magka-blank sa ibang part ng app
        cat: category,
        desc: description,
        addr: address,
        brgy: barangay,

        is_verified: document.getElementById("dynVerified").checked,
        accepts_booking: document.getElementById("dynBooking").checked,
        approval_status: document.getElementById("dynApproval").value,

        delivery_grab: document.getElementById("dynGrab") ? document.getElementById("dynGrab").checked : false,
        delivery_inhouse: document.getElementById("dynInHouse") ? document.getElementById("dynInHouse").checked : false,
        delivery_radius: document.getElementById("dynRadius") ? document.getElementById("dynRadius").value : "",

        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    const ownerEmailInput = document.getElementById("dynEmail").value.trim();
    updateData.owner_email = firebase.firestore.FieldValue.delete();

    if (ownerEmailInput) {
        try {
            const userQuery = await window.db.collection("users").where("email", "==", ownerEmailInput).limit(1).get();

            if (!userQuery.empty) {
                const targetUser = userQuery.docs[0];
                updateData.owner_uid = targetUser.id;

                const editGrantedRole = roleAfterOwnershipGrant(targetUser.data().role, targetUser.id);
                if (editGrantedRole) {
                    await window.db.collection("users").doc(targetUser.id).set({
                        role: editGrantedRole
                    }, { merge: true });
                }
            }
        } catch (e) {
            console.error("Error:", e);
        }
    }
}
        else if (type === 'buzz_posts') {
            updateData = {
                body: document.getElementById("dynBody").value,
                title: document.getElementById("dynBody").value,
                type: document.getElementById("dynType").value,
                barangay: document.getElementById("dynBrgy").value,
                authorName: document.getElementById("dynAuthor").value
            };
        }
        else if (type === 'bookings') {
            updateData = {
                userName: document.getElementById("dynCustomer").value,
                details: document.getElementById("dynDetails").value,
                status: document.getElementById("dynStatus").value
            };
        }
        else if (type === 'messages') {
            updateData = {
                userName: document.getElementById("dynSender").value,
                text: document.getElementById("dynText").value,
                reply: document.getElementById("dynReply").value
            };
        }

        try {
            if (type === 'places') {
                const batch = window.db.batch();
                batch.update(window.db.collection(type).doc(id), updateData);
                batch.set(window.db.collection('private_places').doc(id), {
                    owner_email:document.getElementById('dynEmail').value.trim() || null,
                    owner_uid:updateData.owner_uid || adminData.places.find(p=>p.id===id)?.owner_uid || null
                }, {merge:true});
                await batch.commit();
            } else if(type==='messages') await window.ContentPolicy.updateMessage(window.db,window.db.collection(type).doc(id),updateData);
            else await window.db.collection(type).doc(id).update(updateData);
            alert("Record successfully updated!");
            closeSidePanel();

            if (type === 'places') { render(); window.MapPage?.refresh?.(); }
            else if (type === 'buzz_posts') loadAdminBuzz();
            else if (type === 'bookings') loadAdminBookings();
            else if (type === 'messages') loadAdminMessages();
        }
        catch (error) {
            alert("Error saving: " + error.message);
            btn.textContent = "Submit Changes"; btn.disabled = false;
        }
    }

    function closeSidePanel() {
        const overlay = document.getElementById("adminSidePanelOverlay");
        overlay.classList.remove("show");
        setTimeout(() => overlay.classList.add("hidden"), 300);
    }

    // =====================================
    // 🔥 PREMIUM BUSINESS OWNER PORTAL 🔥
    // =====================================
    // 🔥 SUKI CARD STUDIO — local draft + live 3D preview 🔥
    // Lahat ng control nag-uupdate ng preview mula sa LOCAL
    // form state bago pa mag-save (gumagana kahit quota-blocked).
    // =====================================
    let sukiDraft = null;
    let sukiChipsBuilt = false;
    let sukiStudioBound = false;
    let sukiStudioPlace = null;

    function sukiDefaultDraft(place) {
        const cat = (window.vicinifyCatConfig && window.vicinifyCatConfig(String(place.category || place.cat || "default").toLowerCase())) || { color: "#f59e0b", icon: "coffee" };
    return {
            enabled: !!place.suki_enabled,
            template: place.suki_template || "custom",
            colorMode: place.suki_color_mode === "gradient" ? "gradient" : "solid",
            color: /^#[0-9a-f]{6}$/i.test(place.suki_color || '') ? place.suki_color : '#237e72',
            gradId: place.suki_gradient || "sunset",
            gradFrom: place.suki_gradient_from || "",
            gradTo: place.suki_gradient_to || "",
            pattern: place.suki_pattern || "none",
            icon: place.suki_icon || "",
            stampCount: Math.max(2, Math.min(24, parseInt(place.suki_stamp_count, 10) || 8)),
            reward: place.suki_reward || ""
        };
    }

    function sukiBuildStudioChips() {
        if (sukiChipsBuilt || !window.SukiDesign) return;
        sukiChipsBuilt = true;
        const D = window.SukiDesign;

        const tplWrap = document.getElementById("sukiTemplateChips");
        if (tplWrap) {
            tplWrap.innerHTML = Object.entries(D.TEMPLATES).map(([id, t]) =>
                `<button type="button" class="suki-chip suki-template-option" data-suki-template="${id}"><span class="suki-template-swatch" style="background:${t.colorMode==='gradient'?`linear-gradient(135deg,${t.gradFrom},${t.gradTo})`:t.color}"><span></span><span></span><span></span><span></span></span><strong>${escapeHtml(t.label)}</strong></button>`).join("");
            tplWrap.querySelectorAll("[data-suki-template]").forEach(btn => {
                btn.addEventListener("click", () => {
                    const t = D.TEMPLATES[btn.dataset.sukiTemplate];
                    if (!t || !sukiDraft) return;
                    // Template bundle fills the VISUAL fields; count/reward
                    // stay as-is (business-specific), all still editable.
                    sukiDraft.template = btn.dataset.sukiTemplate;
                    sukiDraft.colorMode = t.colorMode;
                    sukiDraft.color = t.color;
                    sukiDraft.gradId = t.gradId;
                    sukiDraft.gradFrom = t.gradFrom;
                    sukiDraft.gradTo = t.gradTo;
                    sukiDraft.pattern = t.pattern;
                    sukiSyncStudioFromDraft();
                    sukiRenderStudioPreview();
                });
            });
        }

        const gradWrap = document.getElementById("sukiGradientChips");
        if (gradWrap) {
            gradWrap.innerHTML = Object.entries(D.GRADIENTS).map(([id, g]) =>
                `<button type="button" class="suki-chip" data-suki-grad="${id}"><span class="suki-grad-dot" style="background:linear-gradient(135deg,${g.from},${g.to});"></span>${escapeHtml(g.label)}</button>`).join("");
            gradWrap.querySelectorAll("[data-suki-grad]").forEach(btn => {
                btn.addEventListener("click", () => {
                    const g = D.GRADIENTS[btn.dataset.sukiGrad];
                    if (!g || !sukiDraft) return;
                    sukiDraft.gradId = btn.dataset.sukiGrad;
                    sukiDraft.gradFrom = g.from;
                    sukiDraft.gradTo = g.to;
                    sukiDraft.colorMode = "gradient";
                    sukiSyncStudioFromDraft();
                    sukiRenderStudioPreview();
                });
            });
        }

        const patWrap = document.getElementById("sukiPatternChips");
        if (patWrap) {
            patWrap.innerHTML = Object.entries(D.PATTERNS).map(([id, label]) =>
                `<button type="button" class="suki-chip" data-suki-pattern="${id}">${escapeHtml(label)}</button>`).join("");
            patWrap.querySelectorAll("[data-suki-pattern]").forEach(btn => {
                btn.addEventListener("click", () => {
                    if (!sukiDraft) return;
                    sukiDraft.pattern = btn.dataset.sukiPattern;
                    sukiSyncStudioFromDraft();
                    sukiRenderStudioPreview();
                });
            });
        }

        const iconWrap = document.getElementById("sukiIconChips");
        if (iconWrap) {
            iconWrap.innerHTML = D.ICONS.map(ic =>
                ic === ""
                    ? `<button type="button" class="suki-chip" data-suki-icon="">Auto (category)</button>`
                    : `<button type="button" class="suki-chip" data-suki-icon="${ic}"><i data-lucide="${ic}"></i>${ic}</button>`).join("");
            iconWrap.querySelectorAll("[data-suki-icon]").forEach(btn => {
                btn.addEventListener("click", () => {
                    if (!sukiDraft) return;
                    sukiDraft.icon = btn.dataset.sukiIcon;
                    sukiSyncStudioFromDraft();
                    sukiRenderStudioPreview();
                });
            });
        }
        window.debouncedIcons?.();
    }

    function sukiSyncStudioFromDraft() {
        const d = sukiDraft;
        if (!d) return;
        document.getElementById("sukiEnabled").checked = d.enabled;
        const body = document.getElementById("sukiStudioBody");
        // The editor must stay accessible even before the owner enables the card.
        // Previously, turning the card off hid every editing field.
        if (body) body.style.display = "";
        const enabledHelp = document.getElementById("sukiEnabledHelp");
        if (enabledHelp) enabledHelp.textContent = d.enabled
            ? "The card is enabled for customers. Customize it and save your changes."
            : "The card is currently off for customers. You can still edit and save its design.";
        document.querySelectorAll("#sukiTemplateChips [data-suki-template]").forEach(b => b.classList.toggle("active", b.dataset.sukiTemplate === d.template));
        document.getElementById("sukiColorModeSolid").classList.toggle("active", d.colorMode === "solid");
        document.getElementById("sukiColorModeGradient").classList.toggle("active", d.colorMode === "gradient");
        document.getElementById("sukiColor").value = d.color;
        document.getElementById("sukiSolidRow").style.display = d.colorMode === "solid" ? "" : "none";
        document.getElementById("sukiGradientRow").style.display = d.colorMode === "gradient" ? "" : "none";
        const preset = window.SukiDesign.GRADIENTS[d.gradId];
        document.querySelectorAll("#sukiGradientChips [data-suki-grad]").forEach(b => b.classList.toggle("active", b.dataset.sukiGrad === d.gradId));
        document.getElementById("sukiGradFrom").value = d.gradFrom || (preset ? preset.from : "#f97316");
        document.getElementById("sukiGradTo").value = d.gradTo || (preset ? preset.to : "#ef4444");
        document.querySelectorAll("#sukiPatternChips [data-suki-pattern]").forEach(b => b.classList.toggle("active", b.dataset.sukiPattern === d.pattern));
        document.querySelectorAll("#sukiIconChips [data-suki-icon]").forEach(b => b.classList.toggle("active", b.dataset.sukiIcon === d.icon));
        document.querySelectorAll('#sukiStudioBody .suki-chip').forEach(button=>button.setAttribute('aria-pressed',String(button.classList.contains('active'))));
        document.getElementById("sukiStampCount").value = d.stampCount;
        document.getElementById("sukiReward").value = d.reward;
        window.debouncedIcons?.();
    }

    function sukiReadStudioToDraft() {
        const d = sukiDraft;
        if (!d) return d;
        d.enabled = document.getElementById("sukiEnabled").checked;
        d.color = document.getElementById("sukiColor").value;
        d.gradFrom = document.getElementById("sukiGradFrom").value;
        d.gradTo = document.getElementById("sukiGradTo").value;
        d.stampCount = Math.max(2, Math.min(24, parseInt(document.getElementById("sukiStampCount").value, 10) || 8));
        d.reward = document.getElementById("sukiReward").value.trim().slice(0, 120);
        return d;
    }

    function sukiRenderStudioPreview() {
        const wrap = document.getElementById("sukiStudioPreview");
        if (!wrap || !sukiDraft || !sukiStudioPlace || !window.Suki) return;
        const d = sukiDraft;
        const ghost = {
            ...sukiStudioPlace,
            suki_enabled: true,
            suki_stamp_count: d.stampCount,
            suki_reward: d.reward || "Free reward",
            suki_icon: d.icon || undefined,
            suki_template: d.template,
            suki_color_mode: d.colorMode,
            suki_color: d.color,
            suki_gradient: d.gradId,
            suki_gradient_from: d.gradFrom,
            suki_gradient_to: d.gradTo,
            suki_pattern: d.pattern
        };
        const sampleStamps = Math.max(0, Math.min(d.stampCount - 1, 5));
        wrap.innerHTML = window.Suki.renderCard(ghost, {
            cardId: "preview",
            stamps: sampleStamps,
            claimed: false,
            claimRequested: false,
            customerName: "Juan Suki"
        }, { hideActions: true });
        window.Suki.attachInteraction(wrap);
    }

    function sukiStudioInit(place) {
        sukiStudioPlace = place;
        sukiDraft = sukiDefaultDraft(place);
        sukiBuildStudioChips();
        sukiSyncStudioFromDraft();
        sukiRenderStudioPreview();

        if (sukiStudioBound) return;
        sukiStudioBound = true;
        document.getElementById("sukiEnabled").addEventListener("change", () => { sukiReadStudioToDraft(); sukiSyncStudioFromDraft(); sukiRenderStudioPreview(); });
        document.getElementById("sukiColorModeSolid").addEventListener("click", () => { if (sukiDraft) { sukiDraft.colorMode = "solid"; sukiSyncStudioFromDraft(); sukiRenderStudioPreview(); } });
        document.getElementById("sukiColorModeGradient").addEventListener("click", () => { if (sukiDraft) { sukiDraft.colorMode = "gradient"; sukiSyncStudioFromDraft(); sukiRenderStudioPreview(); } });
        document.getElementById("sukiColor").addEventListener("input", () => { if (sukiDraft) { sukiDraft.color = document.getElementById("sukiColor").value; sukiDraft.colorMode = "solid"; sukiSyncStudioFromDraft(); sukiRenderStudioPreview(); } });
        const gradCustom = () => {
            if (!sukiDraft) return;
            sukiDraft.gradId = "custom";
            sukiDraft.gradFrom = document.getElementById("sukiGradFrom").value;
            sukiDraft.gradTo = document.getElementById("sukiGradTo").value;
            sukiDraft.colorMode = "gradient";
            sukiSyncStudioFromDraft();
            sukiRenderStudioPreview();
        };
        document.getElementById("sukiGradFrom").addEventListener("input", gradCustom);
        document.getElementById("sukiGradTo").addEventListener("input", gradCustom);
        document.getElementById("sukiStampCount").addEventListener("input", () => { sukiReadStudioToDraft(); sukiRenderStudioPreview(); });
        document.getElementById("sukiReward").addEventListener("input", () => { sukiReadStudioToDraft(); sukiRenderStudioPreview(); });
        document.getElementById("sukiShowQrBtn").addEventListener("click", () => {
            const qr = document.getElementById("sukiStudioQr");
            if (!qr) return;
            if (!qr.classList.contains("hidden")) {
                qr.classList.add("hidden");
                if (qr._sukiQrTimer) { clearInterval(qr._sukiQrTimer); qr._sukiQrTimer = null; }
                return;
            }
            qr.classList.remove("hidden");
            window.Suki.renderOwnerQr(qr, (sukiStudioPlace && sukiStudioPlace.id) || document.getElementById("sukiStudioPlaceId").value);
        });
    }

    // =====================================
    function openBusinessPortal(id) {
        const place = currentAdminPlaces.find(p => p.id === id);
        if (!place) return;
        document.getElementById("bizPortalId").value = place.id;
        document.getElementById("bizPortalName").value = place.name || "";
        document.getElementById("bizPortalCat").value = place.category || place.cat || "restaurant";
        document.getElementById("bizPortalDesc").value = place.description || place.desc || "";
        window.PlaceFeatures?.renderForm(document.getElementById("bizPortalFeatures"), place.place_features || {});
        document.getElementById('bizAutoReplies').checked=place.auto_reply_enabled===true;
        for(const [topic,suffix] of Object.entries({menu:'Menu',hours:'Hours',delivery:'Delivery',booking:'Booking'}))
            document.getElementById('bizAuto'+suffix).value=place.auto_reply_answers?.[topic] || '';
        document.getElementById("bizPortalAddress").value = place.address || place.addr || "";
        document.getElementById("bizPortalPhone").value = place.contact_phone || place.phone || "";
        document.getElementById("bizPortalEmail").value = place.contact_email || "";
        document.getElementById("bizPortalBooking").checked = place.accepts_booking || false;
        const bizRefundEl = document.getElementById("bizRefund");
        if (bizRefundEl) bizRefundEl.value = String(place.refund_percent ?? 50);
        const bizPriceEl = document.getElementById("bizPortalPriceRange");
        if (bizPriceEl) bizPriceEl.value = place.priceRange || "";

        // Sa loob ng openBusinessPortal function:
        document.getElementById("bizGrab").checked = place.delivery_grab || false;
        document.getElementById("bizInHouse").checked = place.delivery_inhouse || false;
        document.getElementById("bizRadius").value = place.delivery_radius || "";

        let ops = place.operating_hours || {};
        document.getElementById("bizHoursMon").value = ops.monday || ""; document.getElementById("bizHoursTue").value = ops.tuesday || "";
        document.getElementById("bizHoursWed").value = ops.wednesday || ""; document.getElementById("bizHoursThu").value = ops.thursday || "";
        document.getElementById("bizHoursFri").value = ops.friday || ""; document.getElementById("bizHoursSat").value = ops.saturday || "";
        document.getElementById("bizHoursSun").value = ops.sunday || "";

        const preview = document.getElementById("bizPortalCoverPreview");
        if (place.coverPhoto) {
            const safeCover = window.safeImageUrl ? window.safeImageUrl(place.coverPhoto) : place.coverPhoto;
            preview.style.display = "block";
            preview.style.backgroundImage = safeCover ? `url("${safeCover}")` : "";
        } else {
            preview.style.display = "none";
        }

        const coverInput = document.getElementById("bizPortalCover");
        if (coverInput) {
            coverInput.value = "";
            coverInput.onchange = (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        preview.style.display = "block";
                        preview.style.backgroundImage = `url('${ev.target.result}')`;
                    };
                    reader.readAsDataURL(e.target.files[0]);
                } else {
                    preview.style.display = "none";
                    preview.style.backgroundImage = "";
                }
            };
        }

        // PLUS49: Store Logo — load current logo, wire preview + remove
        const logoPreview = document.getElementById("bizPortalLogoPreview");
        const logoRemoveBtn = document.getElementById("bizPortalLogoRemove");
        if (logoPreview) {
            logoPreview.dataset.removed = "0";
            if (place.logoUrl) {
                const safeLogo = window.safeImageUrl ? window.safeImageUrl(place.logoUrl) : place.logoUrl;
                logoPreview.style.display = "block";
                logoPreview.style.backgroundImage = safeLogo ? `url("${safeLogo}")` : "";
                if (logoRemoveBtn) logoRemoveBtn.style.display = "inline-block";
            } else {
                logoPreview.style.display = "none";
                logoPreview.style.backgroundImage = "";
                if (logoRemoveBtn) logoRemoveBtn.style.display = "none";
            }
        }
        const logoInput = document.getElementById("bizPortalLogo");
        if (logoInput) {
            logoInput.value = "";
            logoInput.onchange = (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        if (logoPreview) {
                            logoPreview.dataset.removed = "0";
                            logoPreview.style.display = "block";
                            logoPreview.style.backgroundImage = `url('${ev.target.result}')`;
                        }
                        if (logoRemoveBtn) logoRemoveBtn.style.display = "inline-block";
                    };
                    reader.readAsDataURL(e.target.files[0]);
                }
            };
        }
        if (logoRemoveBtn) {
            logoRemoveBtn.onclick = () => {
                if (logoPreview) {
                    logoPreview.dataset.removed = "1";
                    logoPreview.style.display = "none";
                    logoPreview.style.backgroundImage = "";
                }
                if (logoInput) logoInput.value = "";
                logoRemoveBtn.style.display = "none";
            };
        }

        window.debouncedIcons?.();
        showPage("page-biz-edit");
    }

    // 🔥 SUKI CARD STUDIO — sariling page, hiwalay sa Edit Establishment 🔥
    function openSukiStudio(id) {
        const place = currentAdminPlaces.find(p => p.id === id);
        if (!place) return;
        document.getElementById("sukiStudioPlaceId").value = place.id;
        document.getElementById("sukiStudioPlaceName").textContent = place.name || "";
        const status = document.getElementById("sukiStudioSaveStatus");
        if (status) { status.textContent = "Edit your Suki Card below, then choose Save Changes."; status.dataset.state = "idle"; }
        sukiStudioInit(place);
        window.debouncedIcons?.();
        showPage("page-suki-studio");
    }

    let sukiSaving = false;
    function setSukiSaving(value) {
        sukiSaving = value;
        ["saveSukiStudioBtn", "saveSukiStudioBottomBtn"].forEach(id => {
            const btn = document.getElementById(id);
            if (!btn) return;
            btn.disabled = value;
            btn.setAttribute("aria-busy", String(value));
            btn.innerHTML = value
                ? '<i data-lucide="loader-circle"></i> Saving...'
                : '<i data-lucide="save"></i> Save Changes';
        });
        window.debouncedIcons?.();
    }

    async function saveSukiStudio() {
        if (sukiSaving) return;
        const id = document.getElementById("sukiStudioPlaceId")?.value;
        const status = document.getElementById("sukiStudioSaveStatus");
        if (!id || !sukiDraft) {
            if (status) { status.textContent = "Choose an establishment first."; status.dataset.state = "error"; }
            window.showToast?.("No establishment selected.", "error");
            return;
        }
        // Save the exact field names already used by Firebase; no schema or DB migration.
        setSukiSaving(true);
        if (status) { status.textContent = "Saving to Firebase..."; status.dataset.state = "saving"; }
        try {
            if (!(await canManagePlaceId(id))) {
                throw new Error("Only the owner or an admin can edit the Suki Card.");
            }
            const sd = sukiReadStudioToDraft();
            const updateData = {
                suki_enabled: sd.enabled,
                suki_stamp_count: sd.stampCount,
                suki_reward: sd.reward,
                suki_icon: sd.icon,
                suki_template: sd.template,
                suki_color_mode: sd.colorMode,
                suki_color: sd.color,
                suki_gradient: sd.gradId,
                suki_gradient_from: sd.gradFrom,
                suki_gradient_to: sd.gradTo,
                suki_pattern: sd.pattern,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            await window.db.collection("places").doc(id).update(updateData);
            const idx = currentAdminPlaces.findIndex(p => p.id === id);
            if (idx >= 0) currentAdminPlaces[idx] = { ...currentAdminPlaces[idx], ...updateData };
            if (sukiStudioPlace?.id === id) sukiStudioPlace = { ...sukiStudioPlace, ...updateData };
            if (status) { status.textContent = "Saved successfully! Your Suki Card changes are now in Firebase."; status.dataset.state = "success"; }
            window.showToast?.("Suki Card saved!", "success");
            // Stay in the editor so the owner can verify or edit the card again.
            // The dashboard refreshes on return via showPage('page-dashboard').
        } catch (error) {
            if (status) { status.textContent = "Save failed: " + (error?.message || "Please try again."); status.dataset.state = "error"; }
            window.handleFirestoreError?.(error, "Could not save Suki Card.");
            console.error("Suki Card save failed:", error);
        } finally {
            setSukiSaving(false);
        }
    }

    async function saveBusinessPortal() {
        const id = document.getElementById("bizPortalId").value;
        const btn = document.getElementById("saveBizPortalBtn");

        const name = document.getElementById("bizPortalName").value.trim();
const category = document.getElementById("bizPortalCat").value;
const description = document.getElementById("bizPortalDesc").value.trim();
const address = document.getElementById("bizPortalAddress").value.trim();
const phone = document.getElementById("bizPortalPhone").value.trim();
const email = document.getElementById("bizPortalEmail").value.trim();

if (!name || !category || !description || !address) {
    alert("Please fill Business Name, Category, Description, and Address.");
    return;
}

if (name.length < 3) {
    alert("Business name must be at least 3 characters.");
    return;
}

if (description.length < 10) {
    alert("Description must be at least 10 characters.");
    return;
}

        const allowed = await canManagePlaceId(id);
        if (!allowed) {
            alert("Only the owner or an admin can edit this business profile.");
            return;
        }

        const autoAnswers={};
        for(const [topic,suffix] of Object.entries({menu:'Menu',hours:'Hours',delivery:'Delivery',booking:'Booking'})){
            const value=document.getElementById('bizAuto'+suffix).value.trim();
            const error=value && window.ContentPolicy.error('post',value);
            if(error)return window.alert(error);
            autoAnswers[topic]=value;
        }
        btn.textContent = "Saving..."; btn.disabled = true;
        try {
let updateData = {
    auto_reply_enabled:document.getElementById('bizAutoReplies').checked,
    auto_reply_answers:autoAnswers,
    name,

    ...(window.PlaceFeatures && document.getElementById("bizPortalFeatures") ? { place_features: window.PlaceFeatures.readForm(document.getElementById("bizPortalFeatures")) } : {}),
    // standard fields
    category,
    description,
    address,
    contact_phone: phone,
    contact_email: email,
    priceRange: document.getElementById("bizPortalPriceRange") ? document.getElementById("bizPortalPriceRange").value : "",

    // old aliases para compatible sa ibang parts
    cat: category,
    desc: description,
    addr: address,
    phone: phone,

    accepts_booking: document.getElementById("bizPortalBooking").checked,

    refund_percent: Number(document.getElementById("bizRefund")?.value || 50),

    delivery_grab: document.getElementById("bizGrab") ? document.getElementById("bizGrab").checked : false,
    delivery_inhouse: document.getElementById("bizInHouse") ? document.getElementById("bizInHouse").checked : false,
    delivery_radius: document.getElementById("bizRadius") ? document.getElementById("bizRadius").value : "",

    operating_hours: {
        monday: document.getElementById("bizHoursMon").value,
        tuesday: document.getElementById("bizHoursTue").value,
        wednesday: document.getElementById("bizHoursWed").value,
        thursday: document.getElementById("bizHoursThu").value,
        friday: document.getElementById("bizHoursFri").value,
        saturday: document.getElementById("bizHoursSat").value,
        sunday: document.getElementById("bizHoursSun").value
    },

    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
};

        // 🔥 KASAMA ITO, HUWAG BURAHIN 🔥
        const coverInput = document.getElementById("bizPortalCover");
        if (coverInput && coverInput.files && coverInput.files.length > 0) {
            btn.textContent = "Uploading Cover...";
            const newCoverPhoto = await window.uploadImageFileToStorage(coverInput.files[0], `place_covers/${id}`, { maxWidth: 1000, quality: 0.82 });
            updateData.coverPhoto = newCoverPhoto;
        }

        // PLUS49: Store Logo — remove flag wins; otherwise upload a newly chosen file
        const logoPreviewEl = document.getElementById("bizPortalLogoPreview");
        const logoInputEl = document.getElementById("bizPortalLogo");
        if (logoPreviewEl && logoPreviewEl.dataset.removed === "1") {
            updateData.logoUrl = "";
        } else if (logoInputEl && logoInputEl.files && logoInputEl.files.length > 0) {
            btn.textContent = "Uploading Logo...";
            updateData.logoUrl = await window.uploadImageFileToStorage(logoInputEl.files[0], `place_logos/${id}`, { maxWidth: 512, quality: 0.85 });
        }

            await window.db.collection("places").doc(id).update(updateData);
            myPlacesCache=null;myPlacesCacheAt=0;
            window.invalidatePlacesCache?.();
            alert("Business Profile Updated Successfully!");
            showPage("page-dashboard");
            render();
            window.MapPage?.refresh?.();
        }
        catch (error) { window.handleFirestoreError(error); alert("Error saving: " + error.message); }
        finally { btn.innerHTML = `<i data-lucide="save" style="width: 18px; height: 18px;"></i> Save`; window.debouncedIcons?.(); btn.disabled = false; }
    }

    // 🔥 ESTABLISHMENT POSTS — sariling page, hiwalay sa Edit Establishment 🔥
    function openBizPosts(id) {
        const place = currentAdminPlaces.find(p => p.id === id);
        if (!place) return;
        // Posts are managed in their public establishment context.
        window.viewPlace?.(id);
    }

    function openAddPostFromPosts() {
        const placeId = document.getElementById("bizPostsPlaceId").value;
        const placeName = document.getElementById("bizPostsPlaceName").textContent;
        if (window.openPlacePostModal) {
            window.openPlacePostModal(placeId, placeName);
        } else {
            alert("Please open the Map page at least once to load the Modal system.");
        }
    }

    function listenToBizPosts(placeId) {
        if (bizPostsUnsub) bizPostsUnsub();
        const wrap = document.getElementById("bizPostsList");
        if (!wrap) return;
        const currentUserUid = window.auth?.currentUser?.uid;

        bizPostsUnsub = window.db.collection("place_posts")
            .where("placeId", "==", placeId)
            .limit(15)
            .onSnapshot(snap => {
                if (snap.empty) {
                    wrap.innerHTML = `<div style="text-align:center; padding: 40px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; color:var(--ui-muted); font-size: 15px;">No posts for this establishment yet. Use Add Post for announcements and promos. Manage menu separately from the Menu tab.</div>`;
                    return;
                }

               let docs = snap.docs.map(d => ({ ...d.data(), id: d.id }))
    .filter(d => {
        const del = d.deletedBy || [];

        return (
            d.userId !== currentUserUid &&
            !del.includes(currentUserUid) &&
            !del.includes("owner_deleted")
        );
    });
                docs.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));

                let html = "";
                docs.forEach(d => {
                    const dateStr = d.createdAt && d.createdAt.toDate ? d.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now';
                    const safeMediaUrl = window.safeImageUrl ? window.safeImageUrl(d.mediaUrl) : d.mediaUrl;
                    let imgHtml = safeMediaUrl ? `<img src="${escapeHtml(safeMediaUrl)}" style="width: 120px; height: 120px; border-radius: 8px; object-fit: cover; margin-left: 16px; border: 1px solid #e2e8f0;" loading="lazy" />` : "";

                    html += `
                    <div style="background:var(--ui-surface); border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; display: flex; justify-content: space-between; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                        <div style="flex: 1;">
                            <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color:var(--ui-muted); margin-bottom: 8px;">${dateStr}</div>
                            <div data-no-translate style="font-size: 16px; color:var(--ui-ink); white-space: pre-wrap; line-height: 1.5;">${escapeHtml(d.body)}</div>
                        </div>
                        ${imgHtml}
                        <button onclick="window.DashboardPage.deletePlacePost('${d.id}')" style="margin-left: 20px; background: #fee2e2; color: #ef4444; border: none; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; align-self: flex-start; transition: 0.2s;" title="Delete Post">
                            <i data-lucide="trash-2" style="width: 20px; height: 20px;"></i>
                        </button>
                    </div>
                    `;
                });
                wrap.innerHTML = html;
                window.debouncedIcons?.();
            }, err => window.handleFirestoreError(err));
    }

    async function deletePlacePost(postId) {
        if (!postId || postId === "undefined") {
            return alert("This update cannot be deleted because its record ID is missing.");
        }

        // 🔥 FIX: CUSTOM CONFIRM PARA SA PAG-DELETE NG STORE UPDATE 🔥
        const ans = await window.vConfirm("Delete Update", "Are you sure you want to delete this store update? It will be removed from the map for all customers.", "Delete", true);
        if (!ans) return;

        try {
            const postDoc = await window.db.collection("place_posts").doc(postId).get();
            if (!postDoc.exists) return alert("This update was already deleted.");

            const allowed = await canManagePlaceId(postDoc.data().placeId);
            if (!allowed) return alert("Only the owner or an admin can delete this update.");

            await window.db.collection("place_posts").doc(postId).delete();
        } catch (e) {
            alert("Error deleting post: " + e.message);
        }
    }

    function render() {
        const dashTitle = document.getElementById("dashboardMainTitle");
        const dashSub = document.getElementById("dashboardSubTitle");
        const dashIcon = document.querySelector(".dash-pro-icon");
       if (dashTitle && dashSub) {
            if (getRole() === "admin") { 
                dashTitle.textContent = "Admin Hub";
                dashSub.textContent = "Manage establishments, users, posts, claims, and reports in one place."; 
                if (dashIcon) dashIcon.innerHTML = '<i data-lucide="database" style="color: white; width: 24px; height: 24px;"></i>'; 
            } else if (getRole() === "user") {
                dashTitle.textContent = "My Activity";
                dashSub.textContent = "Your orders, chats, Suki cards, and saved places.";
                if (dashIcon) dashIcon.innerHTML = '<i data-lucide="activity" style="color: white; width: 24px; height: 24px;"></i>';
            } else { 
                dashTitle.textContent = "Business Hub"; 
                dashSub.textContent = "Manage your listings, daily operations, and customer messages."; 
                if (dashIcon) dashIcon.innerHTML = '<i data-lucide="store" style="color: white; width: 24px; height: 24px;"></i>'; 
            }
            window.debouncedIcons?.();
        }
        renderMy(); renderAdmin();
    }

    document.addEventListener("DOMContentLoaded", () => {
        document.getElementById("closePanelBtn")?.addEventListener("click", closeSidePanel);
        document.getElementById("saveBizPortalBtn")?.addEventListener("click", saveBusinessPortal);

        // Handle Popover / Overlay Clicks
        document.addEventListener("click", (e) => {
            if (e.target.id === "adminSidePanelOverlay") closeSidePanel();

            // Popover Toggle Logic
            const filterBtn = e.target.closest("#adminFilterBtn");
            const popover = document.getElementById("adminFilterPopover");
            if (filterBtn) {
                popover.classList.toggle("hidden");
            } else if (popover && !popover.contains(e.target) && !e.target.closest(".filter-checkbox-label")) {
                popover.classList.add("hidden");
            }
        });

        document.body.addEventListener("click", (e) => {
            const tabBtn = e.target.closest(".biz-tab");
            if (!tabBtn) return;
            const parentGroup = tabBtn.parentElement;
            parentGroup.querySelectorAll(".biz-tab").forEach(t => t.classList.remove("active"));
            tabBtn.classList.add("active");

            const tabName = tabBtn.dataset.biztab;
            if (tabName.startsWith('admin-')) {
                document.querySelectorAll("[id^='biz-panel-admin-']").forEach(el => { el.classList.add("hidden"); el.classList.remove("active"); });
            } else {
                ["biz-panel-bookings", "biz-panel-messages", "biz-panel-suki"].forEach(id => {
                    document.getElementById(id)?.classList.add("hidden");
                    document.getElementById(id)?.classList.remove("active");
                });
            }
            const targetPanel = document.getElementById("biz-panel-" + tabName);
            if (targetPanel) { targetPanel.classList.remove("hidden"); targetPanel.classList.add("active"); }

            if (tabName === "bookings") {
                window.DashboardPageMarkOwnerTransactionsRead?.();
            }
            if (tabName === "messages") {
                window.DashboardPageMarkOwnerMessagesRead?.();
            }
        });
    });

    function stopAllListeners() {
        activeInboxKey = "";
        activeSukiKey = "";
        globalBookingsUnsub.forEach(u => { try { if (typeof u === "function") u(); } catch (e) {} });
        globalMessagesUnsub.forEach(u => { try { if (typeof u === "function") u(); } catch (e) {} });
        globalBookingsUnsub = [];
        globalMessagesUnsub = [];
        sukiUnsubs.forEach(u => { try { if (typeof u === "function") u(); } catch (e) {} });
        sukiUnsubs = [];
        if (bizPostsUnsub) { try { bizPostsUnsub(); } catch (e) {} bizPostsUnsub = null; }
        // The customer hub (My Activity) also lives on this page for standard users.
        try { window.SettingsPage?.stopAllListeners?.(); } catch (e) {}
    }

    function resetSession() {
        stopAllListeners();
        adminSnapCache = null; adminSnapAt = 0;
        myPlacesCache = null; myPlacesCacheUid = null; myPlacesCacheAt = 0;
        currentAdminPlaces = []; adminData = {places:[],buzz_posts:[],bookings:[],messages:[]};
        bookingMap.clear(); messageMap.clear();
        ['pendingList','myEstablishments','biz-panel-bookings','biz-panel-messages','biz-panel-suki','myBookingsList','myChatsList'].forEach(id=>{const el=document.getElementById(id);if(el)el.replaceChildren();});
        const overlay = document.getElementById('adminSidePanelOverlay');
        if(overlay) { overlay.classList.remove('show'); overlay.classList.add('hidden'); overlay.querySelector('.panel-body')?.replaceChildren(); }
    }
    return {
        resetSession,
        render,
        updateBookingStatus,
        deleteBooking,
        // 🔥 SUKI CARD (owner inbox approvals + claims)
        approveStampRequest: (id) => window.Suki?.approveRequest(id),
        rejectStampRequest: (id) => window.Suki?.rejectRequest(id),
        markSukiClaimed: (id) => window.Suki?.markClaimed(id),
        loadAdminUsers,
        updateUserRole,
        deleteChatThread,
        markOwnerTransactionsRead: () => window.DashboardPageMarkOwnerTransactionsRead?.(),
        markOwnerMessagesRead: () => window.DashboardPageMarkOwnerMessagesRead?.(),
        markOwnerMessageThreadRead: (customerUid, placeId) => window.DashboardPageMarkOwnerMessageThreadRead?.(customerUid, placeId),
        openBizPosts,
        openAddPostFromPosts,
        openSukiStudio,
        saveSukiStudio,
        deletePlacePost,
        confirmBusinessInfo,

        // Universal Edit Panel
        loadAdminBuzz,
        loadAdminAudit,
        loadAdminMore,
        loadAdminClaims,
        approveClaim,
        rejectClaim,
        loadAdminReports,
        resolveReport,
        dismissReport,
        loadAdminBookings,
        loadAdminMessages,
        adminDeleteRecord,
        adminUpdateBookingStatus: updateBookingStatus,
        openEditPanel,
        saveDynamicEdit,

        // 🔥 MANUAL B2B OWNER ASSIGNMENT 🔥
        manualAssignOwner,

        // 🔥 EXPOSED FILTER METHODS 🔥
        applyAdminFilters,
        clearAdminFilters,
        clearFilterGroup,
        switchFilterTab,
        stopAllListeners
    };
})();
