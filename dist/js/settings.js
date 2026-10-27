window.SettingsPage = (() => {
let custBookingsUnsub = null;
let custChatsUnsub = null;
let custFavoritesUnsub = null;
let custSukiUnsub = null;
// Re-entry guard + place-join cache: re-entering My Activity must not
// re-subscribe (and re-bill) the same four listeners, and the Suki
// wallet must not re-fetch a place doc it already resolved this session.
let activeCustKey = "";
const placeJoinCache = new Map();

function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, s => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[s]));
}

function safeString(str) { return String(str ?? "").split("").map(c => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")).join(""); }

function getRequestMeta(requestType) {
    const key = String(requestType || "booking").toLowerCase();
    const map = {
        booking: { icon: "📅", title: "General Booking", confirmLabel: "Confirm Completed" },
        table: { icon: "🍽️", title: "Table Reservation", confirmLabel: "Confirm Completed" },
        table_reservation: { icon: "🍽️", title: "Table Reservation", confirmLabel: "Confirm Completed" },
        food: { icon: "🍱", title: "Food Reservation", confirmLabel: "Confirm Received" },
        food_reservation: { icon: "🍱", title: "Food Reservation", confirmLabel: "Confirm Received" },
        pickup: { icon: "🛍️", title: "Pickup Order", confirmLabel: "Confirm Picked Up" },
        pickup_order: { icon: "🛍️", title: "Pickup Pre-order", confirmLabel: "Confirm Picked Up" },
        advance_order: { icon: "🗓️", title: "Advance Order", confirmLabel: "Confirm Received" },
        delivery: { icon: "🛵", title: "Delivery Order", confirmLabel: "Confirm Received" },
        delivery_order: { icon: "🛵", title: "Delivery Order", confirmLabel: "Confirm Received" }
    };
    return map[key] || map.booking;
}

function formatDateTime(ts) {
    if (!ts || !ts.toDate) return "Just now";
    return ts.toDate().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });
}

function normalizeStatusLabel(status) {
    return String(status || "pending").replace(/_/g, " ").toUpperCase();
}

function getStatusTone(status) {
    return String(status || "pending").toLowerCase().replace(/\s+/g, "_");
}

function getTransactionSummary(d) {
    const parts = [];
    if (d.details) parts.push(d.details);
    if (d.orderItems && !String(d.details || "").includes(d.orderItems)) parts.push("Order: " + d.orderItems);
    if (d.pickupTime) parts.push("Pickup: " + d.pickupTime);
    if (d.neededTime) parts.push("Needed: " + d.neededTime);
    if (d.deliveryAddress) parts.push("Address: " + d.deliveryAddress);
    if (d.paymentMethod) parts.push("Payment: " + d.paymentMethod);
    return parts.filter(Boolean).join("\n") || "No additional details.";
}

async function deleteCustomerBooking(bookingId) {
    window.alert("Transaction history is kept for records and cannot be deleted.");
}

// Customer cancellation (status-based, manual flow):
// pending -> 100% refund; accepted/payment_submitted -> the establishment's
// refundPercent (snapshotted at order time); preparing or later -> closed.
async function cancelCustomerBooking(bookingId) {
    const d = (currentTransactionDocs || []).find(x => x.id === bookingId);
    if (!d) return;
    const status = String(d.status || "pending").toLowerCase();
    if (!["pending", "accepted", "payment_submitted"].includes(status)) return;

    const refundPercent = status === "pending" ? 100 : (d.refundPercent ?? 50);
    const placeName = d.placeName || "The establishment";
    const msg = status === "pending"
        ? `${placeName} hasn't accepted your order yet — cancelling now gives you a 100% refund.`
        : `${placeName} has accepted your order and is about to prepare it. If you cancel now, you'll get a ${refundPercent}% refund — they keep ${100 - refundPercent}% as compensation for their effort.`;

    const ans = await window.vConfirm("Cancel this order?", msg, "Yes, cancel", true);
    if (!ans) return;

    try {
        await window.ViciData.command("booking", { bookingId: bookingId, patch: {
            status: "cancelled",
            refundPercent,
            cancelledAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        } });


        window.showToast("Order cancelled.", "info");
    } catch (error) {
        alert("Error cancelling: " + error.message);
    }
}

async function confirmReceivedBooking(bookingId, placeId) {
    const ans = await window.vConfirm(
        "Confirm Completed",
        "Confirm that you already received or completed this transaction?",
        "Confirm",
        false
    );

    if (!ans) return;

    try {
        await window.ViciData.command("booking", { bookingId: bookingId, patch: {
            status: "received",
            customer_confirmed: true,
            customerConfirmedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        } });


        const rateAns = await window.vConfirm(
            "Give Feedback",
            "Thank you for confirming. Would you like to rate this establishment now?",
            "Rate Now",
            false
        );

        if (rateAns && window.openFeedbackModal) {
            window.openFeedbackModal(placeId, bookingId, null);
        }
    } catch (error) {
        alert("Error confirming completed: " + error.message);
    }
}

async function deleteCustomerChatThread(placeId, event) {
    if (event) event.stopPropagation();

    const ans = await window.vConfirm(
        "Hide Chat",
        "Hide this conversation from your chat history? This will not delete the conversation for the business owner or admin records.",
        "Hide",
        true
    );

    if (!ans) return;

    try {
        const user = window.auth.currentUser;
        if (!user) return;

        const snap = await window.db.collection("messages")
            .where("placeId", "==", placeId)
            .where("userId", "==", user.uid)
            .limit(20)
            .get();

        const batch = window.db.batch();

        snap.forEach(doc => {
            batch.update(doc.ref, {
                deletedBy: firebase.firestore.FieldValue.arrayUnion(user.uid)
            });
        });

        await batch.commit();
    } catch (error) {
        alert("Error deleting conversation: " + error.message);
    }
}

async function removeFavorite(favId, event) {
    if (event) event.stopPropagation();

    const ans = await window.vConfirm(
        "Remove Favorite",
        "Remove this establishment from your Favorites?",
        "Remove",
        true
    );

    if (!ans) return;

    try {
        await window.db.collection("favorites").doc(favId).delete();
    } catch (error) {
        alert("Error: " + error.message);
    }
}

let currentTransactionDocs = [];
let currentChatDocs = [];

async function markCustomerTransactionsRead() {
    const user = window.auth?.currentUser;
    if (!user) return;
    const docs = currentTransactionDocs.filter(d => isCustomerUnreadTransaction(d, user.uid));
    await markDocsCustomerRead("bookings", docs);
    setNotifBadge("custBookBadge", 0);
    window._settingsTransactionCount = 0;
    window.GlobalNotifier?.refreshSettingsBadge?.();
}

async function markCustomerChatsRead() {
    const user = window.auth?.currentUser;
    if (!user) return;
    const docs = currentChatDocs.filter(d => isCustomerUnreadMessage(d, user.uid));
    await markDocsCustomerRead("messages", docs);
    setNotifBadge("custChatBadge", 0);
    window._settingsChatCount = 0;
    window.GlobalNotifier?.refreshSettingsBadge?.();
}

function listenToCustomerActivities(user) {
    if (!user || !user.uid) return;
    if (activeCustKey === user.uid && custBookingsUnsub) return;
    activeCustKey = user.uid;
    if (custBookingsUnsub) custBookingsUnsub();
    if (custChatsUnsub) custChatsUnsub();
    if (custFavoritesUnsub) custFavoritesUnsub();
    if (custSukiUnsub) custSukiUnsub();

    // TRANSACTION HISTORY LISTENER
    // No server orderBy: the (userId, createdAt) composite index is new
    // and may not exist yet on a fresh project — a missing index would
    // kill the query and leave the section on "Loading" forever.
    // The handler sorts client-side below; the window is the same 15.
    custBookingsUnsub = window.ViciData.customerFeed("bookings", user.uid, snap => {
            const badge = document.getElementById("custBookBadge");
            const wrap = document.getElementById("myBookingsList");

            if (!wrap) return;

            if (snap.empty) {
                if (badge) { badge.classList.add("hidden"); badge.style.display = "none"; }
                wrap.innerHTML = `<div class="muted" style="text-align:center; padding: 24px;">No transaction history yet.</div>`;
                return;
            }

            let docs = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            docs.sort((a, b) => {
                return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
            });

            currentTransactionDocs = docs;
            const unreadTransactionCount = docs.filter(d => isCustomerUnreadTransaction(d, user.uid)).length;
            setNotifBadge("custBookBadge", unreadTransactionCount);
            window._settingsTransactionCount = unreadTransactionCount;
            window.GlobalNotifier?.refreshSettingsBadge?.();

            if (docs.length === 0) {
                wrap.innerHTML = `<div class="muted" style="text-align:center; padding: 24px;">No transaction history yet.</div>`;
                return;
            }

            let html = "";

            docs.forEach(d => {
                const status = getStatusTone(d.status || d.bookingStatus || "pending");
                const meta = getRequestMeta(d.requestType);
                const dateStr = formatDateTime(d.createdAt);
                const summary = getTransactionSummary(d);
                const txId = d.transactionId || d.id;
                const unreadDot = isCustomerUnreadTransaction(d, user.uid) ? `<span class="inbox-unread-dot" title="Unread update"></span>` : "";

                html += `
                    <div class="transaction-history-card">
                        <div class="transaction-history-top">
                            <div style="min-width:0;">
                                <div class="transaction-history-place">${escapeHtml(d.placeName || "Establishment")}</div>
                                <div class="transaction-history-type"><span>${meta.icon}</span><span>${escapeHtml(meta.title)}</span></div>
                            </div>
                            <div style="display:flex; align-items:center; gap:10px;">${unreadDot}<span class="status-badge status-${status}" style="font-size:11px; padding:6px 10px; white-space:nowrap;">${escapeHtml(normalizeStatusLabel(d.status || d.bookingStatus || "pending"))}</span></div>
                        </div>

                        <div class="transaction-history-details">${escapeHtml(summary)}</div>

                        <div class="transaction-history-meta">
                            <span>${escapeHtml(dateStr)}</span>
                            <span>TX-${escapeHtml(String(txId).slice(0, 8).toUpperCase())}</span>
                        </div>

                        <div class="transaction-history-actions">
                            ${status === "fulfilled" || status === "delivered" || status === "ready_for_pickup" ? `
                                <button class="transaction-action-primary" onclick="window.SettingsPage.confirmReceivedBooking('${d.id}', '${d.placeId}')">
                                    ${escapeHtml(meta.confirmLabel)}
                                </button>
                            ` : ""}

                            ${status === "pending" ? `
                                <div style="font-size:11px; color:#16a34a; flex-basis:100%;">You can still cancel this order — free while it is pending.</div>
                            ` : ""}

                            ${["accepted", "payment_submitted"].includes(status) ? `
                                <div style="font-size:11px; color:#d97706; flex-basis:100%;">You can still cancel this order — a ${d.refundPercent ?? 50}% refund applies.</div>
                            ` : ""}

                            ${["pending", "accepted", "payment_submitted"].includes(status) ? `
                                <button class="transaction-action-chat" style="color:#dc2626;" onclick="window.SettingsPage.cancelCustomerBooking('${d.id}')">
                                    Cancel Order
                                </button>
                            ` : ""}

                            ${["preparing", "ready", "payment_confirmed"].includes(status) ? `
                                <div style="font-size:11px; color:#94a3b8; flex-basis:100%;">Preparation has started — this order can no longer be cancelled. No refund.</div>
                            ` : ""}

                            <button class="transaction-action-chat" onclick="window.openChatModal('${d.placeId}', '${safeString(d.placeName || "Establishment")}')">
                                Open Chat
                            </button>

                            <button class="transaction-action-chat" onclick="showPage('page-map'); setTimeout(() => window.viewPlace('${d.placeId}', { focusReviews: true }), 350)">
                                Reviews
                            </button>
                        </div>
                    </div>
                `;
            });

            wrap.innerHTML = html;
            window.debouncedIcons?.();
        }, err => {
            window.handleFirestoreError(err);
            const w = document.getElementById("myBookingsList");
            if (w) w.innerHTML = `<div class="muted" style="text-align:center; padding: 24px;">Could not load. Please try again later.</div>`;
        });

    // CHATS LISTENER
    custChatsUnsub = window.ViciData.customerFeed("messages", user.uid, snap => {
            const badge = document.getElementById("custChatBadge");
            const wrap = document.getElementById("myChatsList");

            if (!wrap) return;

            if (snap.empty) {
                if (badge) { badge.classList.add("hidden"); badge.style.display = "none"; }
                wrap.innerHTML = `<div class="muted" style="text-align:center; padding: 20px;">No messages yet.</div>`;
                return;
            }

            let docs = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).filter(d => !(d.deletedBy || []).includes(user.uid));

            let threads = {};

            docs.forEach(d => {
                const t1 = d.createdAt?.toMillis?.() || 0;
                const t2 = threads[d.placeId]?.createdAt?.toMillis?.() || 0;

                if (!threads[d.placeId] || t1 > t2) {
                    threads[d.placeId] = d;
                }
            });

            let threadArr = Object.values(threads).sort((a, b) => {
                return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
            });

            currentChatDocs = docs;
            const unreadChatCount = threadArr.filter(d => isCustomerUnreadMessage(d, user.uid)).length;
            setNotifBadge("custChatBadge", unreadChatCount);
            window._settingsChatCount = unreadChatCount;
            window.GlobalNotifier?.refreshSettingsBadge?.();

            let unreadHtml = "";
            let readHtml = "";

            threadArr.forEach(d => {
                const dateStr = d.createdAt && d.createdAt.toDate
                    ? d.createdAt.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : "Just now";

                const initial = (d.placeName || "P").charAt(0).toUpperCase();
                const lastMsg = d.reply ? `Reply: ${d.reply}` : `You: ${d.text}`;

                const rowHtml = `
                    <div class="inbox-row" style="position:relative; padding-right:50px;" onclick="window.SettingsPage.markCustomerChatThreadRead('${d.placeId}'); window.openChatModal('${d.placeId}', '${safeString(d.placeName)}')">
                        <div class="inbox-avatar">${initial}</div>

                        <div class="inbox-content">
                            <div class="inbox-top">
                                <div class="inbox-name">${escapeHtml(d.placeName)}</div>
                                <div class="inbox-time">${dateStr}</div>
                            </div>

                            <div class="inbox-bottom">
                                <div class="inbox-snippet" style="${d.reply ? "font-weight:700; color:#0f172a;" : "color:#64748b;"}">
                                    ${escapeHtml(lastMsg)}
                                </div>
                                ${isCustomerUnreadMessage(d, user.uid) ? `<div class="inbox-unread" style="background:#ef4444;">NEW</div>` : ""}
                            </div>
                        </div>

                        <button onclick="window.SettingsPage.deleteCustomerChatThread('${d.placeId}', event)"
                            style="position:absolute; right:16px; top:50%; transform:translateY(-50%); background:transparent; border:none; color:#ef4444; width:34px; height:34px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:0.2s;"
                            title="Hide Chat">
                            <i data-lucide="trash-2" style="width:18px; height:18px;"></i>
                        </button>
                    </div>
                `;

                if (d.reply) unreadHtml += rowHtml;
                else readHtml += rowHtml;
            });

            let finalHtml = "";

            if (unreadHtml) {
                finalHtml += `<div style="font-size:12px; font-weight:700; color:#3b82f6; margin-bottom:10px; margin-top:10px; text-transform:uppercase; letter-spacing:0.5px;">Active Conversations</div>` + unreadHtml;
            }

            if (readHtml) {
                finalHtml += `<div style="font-size:12px; font-weight:700; color:#64748b; margin-top:24px; margin-bottom:10px; text-transform:uppercase; letter-spacing:0.5px;">Awaiting Reply</div>` + readHtml;
            }

            if (threadArr.length === 0) {
                finalHtml = `<div class="muted" style="text-align:center; padding: 20px;">No messages, or they have been deleted.</div>`;
            }

            wrap.innerHTML = finalHtml;
            window.debouncedIcons?.();
        }, err => {
            window.handleFirestoreError(err);
            const w = document.getElementById("myChatsList");
            if (w) w.innerHTML = `<div class="muted" style="text-align:center; padding: 20px;">Could not load. Please try again later.</div>`;
        });

    // FAVORITES LISTENER
    custFavoritesUnsub = window.db.collection("favorites")
        .where("userId", "==", user.uid)
        .limit(15)
        .onSnapshot(snap => {
            const wrap = document.getElementById("myFavoritesList");
            if (!wrap) return;

            if (snap.empty) {
                wrap.innerHTML = `<div class="muted" style="text-align:center; padding: 20px;">No saved favorite establishments yet.</div>`;
                return;
            }

            let docs = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            docs.sort((a, b) => {
                return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
            });

            let html = "";

            docs.forEach(d => {
                html += `
                    <div class="inbox-row" style="position:relative; padding-right:50px;" onclick="showPage('page-map'); setTimeout(() => window.viewPlace('${d.placeId}'), 300)">
                        <div class="inbox-avatar" style="background:#fef2f2; color:#ef4444;">
                            <i data-lucide="heart" style="fill:#ef4444;"></i>
                        </div>

                        <div class="inbox-content">
                            <div class="inbox-name">${escapeHtml(d.placeName)}</div>
                            <div class="inbox-snippet" style="color:#3b82f6;">Click to view on map</div>
                        </div>

                        <button onclick="window.SettingsPage.removeFavorite('${d.id}', event)"
                            style="position:absolute; right:16px; top:50%; transform:translateY(-50%); background:transparent; border:none; color:#ef4444; width:34px; height:34px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:0.2s;"
                            title="Remove from Favorites">
                            <i data-lucide="trash-2" style="width:18px; height:18px;"></i>
                        </button>
                    </div>
                `;
            });

            wrap.innerHTML = html;
            window.debouncedIcons?.();
        }, err => window.handleFirestoreError(err));

    // SUKI CARDS LISTENER — one card per establishment, each rendered
    // in that place's own design. Bounded (customerUid filter + limit).
    custSukiUnsub = window.db.collection("loyalty_cards")
        .where("customerUid", "==", user.uid)
        .limit(20)
        .onSnapshot(snap => {
            const wrap = document.getElementById("mySukiCardsList");
            if (!wrap) return;

            if (snap.empty) {
                wrap.innerHTML = `<div class="muted" style="text-align:center; padding: 24px;">You don't have a Suki Card yet. Visit a store and scan with Vicinify!</div>`;
                return;
            }

            const cards = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            cards.sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));

            (async () => {
                try {
                    // Join place docs for design (bounded per-doc gets).
                    const placeMap = {};
                    const placeIds = [...new Set(cards.map(c => c.placeId).filter(Boolean))];
                    for (const pid of placeIds) {
                        if (placeJoinCache.has(pid)) { placeMap[pid] = placeJoinCache.get(pid); continue; }
                        try {
                            const pd = await window.db.collection("places").doc(pid).get();
                            if (pd.exists) { placeMap[pid] = { id: pd.id, ...pd.data() }; placeJoinCache.set(pid, placeMap[pid]); }
                        } catch (e) { window.handleFirestoreError(e); }
                    }
                    const html = cards.map(c => {
                        const p = placeMap[c.placeId];
                        if (!p) return "";
                        return `
                            <div class="suki-wallet-item">
                                ${window.Suki.renderCard(p, { cardId: c.id, ...c })}
                                <button type="button" class="suki-wallet-view-btn" onclick="window.viewPlace('${safeString(c.placeId)}')">Open store</button>
                            </div>`;
                    }).join("");
                    wrap.innerHTML = html || `<div class="muted" style="text-align:center; padding: 24px;">You don't have a Suki Card yet.</div>`;
                    window.Suki.attachInteraction(wrap);
                } catch (e) {
                    wrap.innerHTML = `<div class="muted" style="text-align:center; padding: 24px;">Could not load Suki Cards right now.</div>`;
                    window.handleFirestoreError(e, "Could not load Suki Cards.");
                }
            })();
        }, err => {
            if (!window.auth?.currentUser) return; // logged out — stay silent
            const wrap = document.getElementById("mySukiCardsList");
            if (wrap) wrap.innerHTML = `<div class="muted" style="text-align:center; padding: 24px;">Could not load Suki Cards right now.</div>`;
            window.handleFirestoreError(err, "Could not load Suki Cards.");
        });
}

function syncSettingsSegment(group, value) {
    const selector = `[data-settings-segment="${group}"] button`;
    document.querySelectorAll(selector).forEach(btn => {
        const key = btn.dataset.themeOption || btn.dataset.langOption;
        btn.classList.toggle("active", key === value);
        btn.setAttribute("aria-pressed", String(key === value));
    });
}

function initSettingsSegments() {
    const themeSelector = document.getElementById("themeSelector");
    const langSelector = document.getElementById("langSelector");
    const currentTheme = window.ThemeManager?.getTheme?.() || localStorage.getItem("vicinify_theme") || "system";
    const currentLang = window.LangManager?.getLanguage?.() || localStorage.getItem("vicinify_lang") || "en";

    if (themeSelector) themeSelector.value = currentTheme;
    if (langSelector) langSelector.value = currentLang;
    syncSettingsSegment("theme", currentTheme);
    syncSettingsSegment("language", currentLang);

    document.querySelectorAll("[data-theme-option]").forEach(btn => {
        btn.addEventListener("click", () => {
            const value = btn.dataset.themeOption || "system";
            if (themeSelector) themeSelector.value = value;
            window.ThemeManager?.setTheme?.(value);
            syncSettingsSegment("theme", value);
        });
    });

    document.querySelectorAll("[data-lang-option]").forEach(btn => {
        btn.addEventListener("click", () => {
            const value = btn.dataset.langOption || "en";
            if (langSelector) langSelector.value = value;
            window.LangManager?.setLanguage?.(value);
            syncSettingsSegment("language", value);
        });
    });

    themeSelector?.addEventListener("change", e => syncSettingsSegment("theme", e.target.value));
    langSelector?.addEventListener("change", e => syncSettingsSegment("language", e.target.value));
}

function init() {
    const nicknameInput = document.getElementById("profileNickname");
    const saveProfileBtn = document.getElementById("saveProfileBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const deleteAccountBtn = document.getElementById("deleteAccountBtn");
    const settingsResetBtn = document.getElementById("settingsResetPasswordBtn");
    const settingsChangeBtn = document.getElementById("settingsChangePasswordBtn");

    // v53BB: sound toggle
    const soundBtn = document.getElementById("soundToggleBtn");
    const soundKnob = document.getElementById("soundToggleKnob");
    function updateSoundToggle() {
        const on = window.NavSound?.enabled !== false;
        if (soundBtn) soundBtn.style.background = on ? "#4f46e5" : "#cbd5e1";
        if (soundKnob) soundKnob.style.left = on ? "23px" : "3px";
    }
    soundBtn?.addEventListener("click", () => {
        const on = window.NavSound?.toggle();
        updateSoundToggle();
        if (on) try { window.NavSound?.nav(); } catch (e) {}
    });
    updateSoundToggle();

    document.querySelector('.nav-item[data-goto="page-settings"]')?.addEventListener("click", () => {
        if (AppState.userProfile) {
            if (nicknameInput) nicknameInput.value = AppState.userProfile.fullName || "";
            // v53BK #4: removed duplicate listenToCustomerActivities(user) —
            // showPage("page-settings") already calls SettingsPage.render() which subscribes
        }
    });

    const themeSelector = document.getElementById("themeSelector");
    if (themeSelector) {
        themeSelector.value = localStorage.getItem("vicinify_theme") || "system";
        themeSelector.addEventListener("change", e => {
            if (window.ThemeManager) {
                window.ThemeManager.setTheme(e.target.value);
            }
        });
    }

    initSettingsSegments();

    // ----- Password & Security -----
    function refreshSecuritySection() {
        const user = window.auth?.currentUser;
        const emailEl = document.getElementById("settingsAccountEmail");
        const noteEl = document.getElementById("settingsProviderNote");
        const changeForm = document.getElementById("changePasswordForm");
        if (emailEl) emailEl.textContent = user ? (user.email || "—") : "Not signed in";
        if (user) {
            const isPasswordUser = (user.providerData || []).some(x => x.providerId === "password");
            if (noteEl) noteEl.textContent = isPasswordUser ? "" : "You signed in with a social/Google account, so manage your password in that account instead.";
            if (changeForm) changeForm.style.display = isPasswordUser ? "" : "none";
            if (settingsResetBtn) settingsResetBtn.disabled = !isPasswordUser;
        }
    }
    document.querySelector('.nav-item[data-goto="page-settings"]')?.addEventListener("click", refreshSecuritySection);
    if (window.auth) { try { window.auth.onAuthStateChanged(() => refreshSecuritySection()); } catch(e){} }
    refreshSecuritySection();
    settingsResetBtn?.addEventListener("click", async () => {
        const user = window.auth?.currentUser;
        if (!user || !user.email) return alert("You must be logged in to reset your password.");
        const ok = window.vConfirm ? await window.vConfirm("Reset Password", `Send a password reset link to ${user.email}?`, "Send Reset Link", false) : true;
        if (!ok) return;
        settingsResetBtn.disabled = true; const old = settingsResetBtn.textContent; settingsResetBtn.textContent = "Sending...";
        try {
            if (window.vicinifySendPasswordReset) await window.vicinifySendPasswordReset(user.email); else await window.auth.sendPasswordResetEmail(user.email);
            alert("Password reset email sent! Please check your inbox or spam folder.");
        } catch (error) { console.error("Settings reset error:", error); alert(window.vicinifyPasswordErrorMessage ? window.vicinifyPasswordErrorMessage(error) : ("Error: " + error.message)); }
        finally { settingsResetBtn.disabled = false; settingsResetBtn.textContent = old; }
    });
    settingsChangeBtn?.addEventListener("click", async () => {
        const user = window.auth?.currentUser;
        if (!user || !user.email) return alert("You must be logged in to change your password.");
        const curEl = document.getElementById("settingsCurrentPass"), newEl = document.getElementById("settingsNewPass"), confEl = document.getElementById("settingsConfirmPass");
        const currentPass = curEl?.value || "", newPass = newEl?.value || "", confirmPass = confEl?.value || "";
        if (!currentPass || !newPass || !confirmPass) return alert("Please fill in current, new, and confirm password fields.");
        if (newPass !== confirmPass) return alert("New password and confirmation do not match.");
        if (newPass.length < 8 || !/[a-z]/.test(newPass) || !/[A-Z]/.test(newPass) || !/\d/.test(newPass) || !/[!@#$%^&*(),.?":{}|<>]/.test(newPass)) return alert("New password must be at least 8 characters with uppercase, lowercase, a number, and a special character (!@#$%).");
        settingsChangeBtn.disabled = true; const old = settingsChangeBtn.textContent; settingsChangeBtn.textContent = "Updating...";
        try {
            const cred = firebase.auth.EmailAuthProvider.credential(user.email, currentPass);
            await user.reauthenticateWithCredential(cred);
            await user.updatePassword(newPass);
            if (curEl) curEl.value=""; if (newEl) newEl.value=""; if (confEl) confEl.value="";
            alert("Password updated successfully!");
        } catch (error) {
            console.error("Change password error:", error);
            if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") alert("Current password is incorrect.");
            else if (error.code === "auth/too-many-requests") alert("Too many failed attempts. Please wait a few minutes.");
            else if (error.code === "auth/weak-password") alert("That password is too weak.");
            else alert("Error: " + error.message);
        } finally { settingsChangeBtn.disabled = false; settingsChangeBtn.textContent = old; }
    });

    saveProfileBtn?.addEventListener("click", async () => {
        const user = window.auth.currentUser;
        if (!user) return alert("You must be logged in to save your profile.");

        const newName = nicknameInput ? nicknameInput.value.trim() : "User";

        saveProfileBtn.textContent = "Saving to Cloud...";
        saveProfileBtn.disabled = true;

        try {
            await window.db.collection("users").doc(user.uid).set({
                fullName: newName
            }, { merge: true });

            await window.db.collection("public_profiles").doc(user.uid).set({ fullName: newName.slice(0, 120) });
            AppState.userProfile.fullName = newName;
            alert("Profile saved successfully to Cloud!");
        } catch (error) {
            alert("Error saving profile: " + error.message);
        } finally {
            saveProfileBtn.textContent = "Save Profile";
            saveProfileBtn.disabled = false;
        }
    });

    logoutBtn?.addEventListener("click", async () => {
        const ans = await window.vConfirm(
            "Log Out",
            "Are you sure you want to log out of your account?",
            "Log Out",
            false
        );

        if (!ans) return;

        try {
            await window.auth.signOut();
        } catch (error) {
            alert("Error logging out: " + error.message);
        }
    });

    deleteAccountBtn?.addEventListener("click", () => {
        const user = window.auth.currentUser;
        if (!user) return;

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
            <div style="background:white; padding:24px; border-radius:16px; width:90%; max-width:340px; text-align:center; box-shadow:0 10px 25px rgba(0,0,0,0.2);">
                <div style="background:#fef2f2; width:48px; height:48px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 16px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                </div>

                <h3 style="margin-top:0; color:#0f172a; font-size:18px;">Delete Account</h3>
                <p style="font-size:13px; color:#64748b; margin-bottom:20px; line-height:1.5;">
                    This deletes your sign-in and profile. Transaction and business history remain; this is not a full data-erasure request. Enter your password to confirm.
                </p>

                <input type="password" id="delConfirmPass" placeholder="Enter your password" autocomplete="off"
                    style="width:100%; padding:12px; border:1px solid #cbd5e1; border-radius:8px; margin-bottom:20px; box-sizing:border-box; font-family:inherit; font-size:14px;" />

                <div style="display:flex; gap:10px;">
                    <button id="delCancelBtn" style="flex:1; padding:12px; border-radius:8px; border:none; background:#f1f5f9; color:#475569; font-weight:bold; cursor:pointer;">Cancel</button>
                    <button id="delConfirmBtn" style="flex:1; padding:12px; border-radius:8px; border:none; background:#ef4444; color:white; font-weight:bold; cursor:pointer;">Delete Data</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        document.getElementById("delCancelBtn").onclick = () => overlay.remove();

        document.getElementById("delConfirmBtn").onclick = async () => {
            const passInput = document.getElementById("delConfirmPass").value;

            if (!passInput) {
                return alert("Password cannot be empty.");
            }

            const btn = document.getElementById("delConfirmBtn");
            btn.textContent = "Verifying...";
            btn.disabled = true;

            try {
                const credential = firebase.auth.EmailAuthProvider.credential(user.email, passInput);
                await user.reauthenticateWithCredential(credential);

                window.isSelfDeleting = true;

                const deletion = window.db.batch();
                deletion.delete(window.db.collection("public_profiles").doc(user.uid));
                deletion.delete(window.db.collection("users").doc(user.uid));
                await deletion.commit();
                await user.delete();

                alert("Your sign-in account and profile were deleted. Related history records may remain for business and transaction records.");
                window.location.reload();
            } catch (error) {
                window.isSelfDeleting = false;
                console.error("Delete Error:", error);

                if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
                    alert("❌ INCORRECT PASSWORD! Account deletion failed.");
                } else if (error.code === "auth/too-many-requests") {
                    alert("Too many failed attempts. Please try again later.");
                } else {
                    alert("Error: " + error.message);
                }

                btn.textContent = "Delete Data";
                btn.disabled = false;
            }
        };
    });

    document.body.addEventListener("click", e => {
        const tabBtn = e.target.closest(".cust-tab");
        if (!tabBtn) return;

        document.querySelectorAll(".cust-tab").forEach(t => t.classList.remove("active"));
        tabBtn.classList.add("active");

        document.querySelectorAll(".cust-panel").forEach(p => {
            p.classList.remove("active");
            p.classList.add("hidden");
        });

        const targetPanel = document.getElementById("cust-panel-" + tabBtn.dataset.custtab);

        if (targetPanel) {
            targetPanel.classList.remove("hidden");
            targetPanel.classList.add("active");
        }

        if (tabBtn.dataset.custtab === "bookings") {
            markCustomerTransactionsRead();
        }

        if (tabBtn.dataset.custtab === "chats") {
            markCustomerChatsRead();
        }
    });
}

document.addEventListener("DOMContentLoaded", init);

return {
    // Customer activity (orders, chats, favorites, Suki) lives in the
    // My Activity hub on the dashboard tab now — Settings no longer
    // auto-starts these listeners. The hub starts them explicitly.
    render: () => {},
    startCustomerActivity: () => {
        const user = window.auth?.currentUser;
        if (user) listenToCustomerActivities(user);
    },
    deleteCustomerBooking,
    confirmReceivedBooking,
    cancelCustomerBooking,
    deleteCustomerChatThread,
    markCustomerTransactionsRead,
    markCustomerChatsRead,
    markCustomerChatThreadRead: async (placeId) => {
        const user = window.auth?.currentUser;
        if (!user) return;
        const docs = currentChatDocs.filter(d => d.placeId === placeId && isCustomerUnreadMessage(d, user.uid));
        await markDocsCustomerRead("messages", docs);
    },
    removeFavorite,
    stopAllListeners: () => {
        activeCustKey = "";
        [custBookingsUnsub, custChatsUnsub, custFavoritesUnsub, custSukiUnsub].forEach(u => { try { if (typeof u === "function") u(); } catch (e) {} });
        custBookingsUnsub = custChatsUnsub = custFavoritesUnsub = custSukiUnsub = null;
    }
};

})();
