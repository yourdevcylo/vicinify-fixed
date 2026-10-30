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

// Eligibility remains enforced by the server transaction, including races with preparation.
function cancellationInfo(booking) {
    const status = getStatusTone(booking.status || booking.bookingStatus || "pending");
    const policy=window.PaymentPolicy?.cancellation(booking);
    const raw = Number(booking.refundPercent ?? 50);
    const rate=policy?.rate ?? (status==='pending'?100:raw);
    const isBooking=["booking","table","table_reservation","food","food_reservation"].includes(String(booking.requestType||"booking"));
    return {status,rate,label:isBooking?'booking':'order',allowed:policy?.allowed ?? ['pending','accepted','payment_submitted','payment_confirmed'].includes(status),paid:policy?.evidence ?? !!booking.paymentReference};
}
function reviewCancellation(booking) {
    const info = cancellationInfo(booking);
    return new Promise(resolve => {
        const modal = document.createElement("div");
        modal.className = "cancellation-modal";
        modal.innerHTML = `<div class="modalBackdrop"></div><section class="cancellation-sheet" role="dialog" aria-modal="true" aria-labelledby="cancelReviewTitle">
            <header><span class="cancel-review-icon"><i data-lucide="calendar-x"></i></span><button type="button" class="cancel-review-close" aria-label="Close cancellation"><i data-lucide="x"></i></button></header>
            <span class="cancel-review-eyebrow">REVIEW CANCELLATION</span><h3 id="cancelReviewTitle">Cancel this ${info.label}?</h3>
            <p>Your request with <strong>${escapeHtml(booking.placeName || "this establishment")}</strong> will be cancelled. This cannot be undone.</p>
            <div class="cancel-policy-summary"><span>${info.status === "pending" ? "Not accepted yet" : "Accepted by the business"}</span><strong>${!info.paid ? "Free cancellation" : info.rate + "% refund policy"}</strong><p>${!info.paid ? "No payment is recorded. No refund transfer is needed." : "The business must verify money received before a refund is calculated. Follow the refund status in the transaction summary."}</p></div>
            <p class="cancel-manual-note">If paid: the business reviews the refund amount, confirms the transfer reference, then you confirm receipt after checking your account. The conversation stays open until the refund is settled. Vicinify does not transfer money.</p>
            <footer><button type="button" class="cancel-review-keep">Keep ${info.label}</button><button type="button" class="cancel-review-confirm">Cancel ${info.label}</button></footer>
        </section>`;
        const previousFocus = document.activeElement;
        const finish = answer => { document.removeEventListener("keydown", onKey); modal.remove(); window.lockBodyScroll?.(false); previousFocus?.focus?.(); resolve(answer); };
        const onKey = event => {
            if (event.key === "Escape") finish(false);
            if (event.key === "Tab") {
                const buttons = [...modal.querySelectorAll("button")];
                if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1).focus(); }
                else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0].focus(); }
            }
        };
        modal.querySelector(".modalBackdrop").onclick = () => finish(false);
        modal.querySelector(".cancel-review-close").onclick = () => finish(false);
        modal.querySelector(".cancel-review-keep").onclick = () => finish(false);
        modal.querySelector(".cancel-review-confirm").onclick = () => finish(true);
        document.body.appendChild(modal); window.lockBodyScroll?.(true);
        document.addEventListener("keydown", onKey); window.debouncedIcons?.();
        modal.querySelector(".cancel-review-keep").focus();
    });
}
const cancellingBookings = new Set();
async function cancelCustomerBooking(bookingId) {
    if (cancellingBookings.has(bookingId)) return;
    const d = (currentTransactionDocs || []).find(x => x.id === bookingId);
    if (!d) return;
    if (!cancellationInfo(d).allowed) return window.showToast?.("Cancellation is no longer available at this stage.", "info");
    cancellingBookings.add(bookingId);
    try {
        if (!await reviewCancellation(d)) return;
        // The server reads the current status and original refund policy; the
        // browser never supplies a refund rate or marks money as refunded.
        await window.ViciData.command("booking", { bookingId, patch: { status: "cancelled" } });
        window.showToast?.("Request cancelled. Any refund must be arranged with the business.", "info");
    } catch (error) {
        window.showToast?.("Could not cancel this request. " + error.message, "error");
    } finally { cancellingBookings.delete(bookingId); }
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
    if (activeCustKey === user.uid && custBookingsUnsub) {syncOptionalActivityTab(user);return;}
    activeCustKey = user.uid;
    if (custBookingsUnsub) custBookingsUnsub();
    if (custChatsUnsub) custChatsUnsub();
    if (custFavoritesUnsub) custFavoritesUnsub();
    if (custSukiUnsub) custSukiUnsub();
    custBookingsUnsub = custChatsUnsub = custFavoritesUnsub = custSukiUnsub = null;
    currentTransactionDocs = []; currentChatDocs = [];

    // TRANSACTION HISTORY LISTENER
    // Reuse the notifier's ordered, bounded customer feed.
    custBookingsUnsub = window.ViciData.customerFeed("bookings", user.uid, snap => {
            const badge = document.getElementById("custBookBadge");
            const wrap = document.getElementById("myBookingsList");

            if (!wrap) return;

            if (snap.empty) {
                if (badge) { badge.classList.add("hidden"); badge.style.display = "none"; }
                wrap.innerHTML = `<div class="muted" style="text-align:center; padding: 24px;">No transaction history yet.</div>`;
                return;
            }

            let docs = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));

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
                const cancellation = cancellationInfo(d);
                const dateStr = formatDateTime(d.createdAt);
                const summary = window.renderRequestDetailRows(d);
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

                        <div class="transaction-history-details request-output-history">${summary}</div>

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

                            ${cancellation.allowed ? `
                                <div class="transaction-cancel-note">${status === "pending" ? "Free cancellation while pending." : `Cancellation available · ${cancellation.rate}% refund policy if paid.`}</div>
                                <button class="transaction-cancel-button" onclick="window.SettingsPage.cancelCustomerBooking('${d.id}')">Cancel ${cancellation.label}</button>
                            ` : status === "cancelled" ? `<div class="transaction-cancel-note">Cancelled · Open the transaction to follow the refund status.</div>` : ["preparing", "ready", "ready_for_pickup", "payment_confirmed", "out_for_delivery", "delivered", "fulfilled", "received"].includes(status) ? `<div class="transaction-cancel-note is-closed">Cancellation is closed at this stage. Contact the business if you need help.</div>` : ""}

                            <button class="transaction-action-chat" onclick="window.openChatModal('${d.placeId}', '${safeString(d.placeName || "Establishment")}', null, 'transaction', '${d.id}')">
                                Open transaction
                            </button>

                            <button class="transaction-action-chat" onclick="window.viewPlace('${d.placeId}', { focusReviews: true })">
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

            let docs = snap.docs.map(doc => ({ ...doc.data(), id: doc.id })).filter(d => !(d.deletedBy || []).includes(user.uid) && window.isConversationMessage(d));

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

            const finalHtml = threadArr.length ? threadArr.map(d => {
                const title = window.MapPage?.getCachedPlace?.(d.placeId)?.name || currentTransactionDocs.find(order=>order.placeId===d.placeId)?.placeName || d.placeName || 'Establishment';
                const own = d.senderUid === user.uid || (!d.senderUid && !d.reply);
                const preview = d.reply ? `Business: ${d.reply}` : d.type === 'text' ? `${own ? 'You' : 'Business'}: ${d.text || ''}` : d.text || 'Transaction update';
                const date = d.createdAt?.toDate ? d.createdAt.toDate().toLocaleDateString('en-US',{month:'short',day:'numeric'}) : 'Just now';
                const unread = isCustomerUnreadMessage(d,user.uid);
                return `<article class="activity-thread${unread?' is-unread':''}">
                    <button type="button" class="activity-thread-open" onclick="window.SettingsPage.markCustomerChatThreadRead('${safeString(d.placeId)}');window.openChatModal('${safeString(d.placeId)}','${safeString(title)}')">
                        <span class="activity-thread-avatar">${escapeHtml(title.charAt(0).toUpperCase())}</span>
                        <span class="activity-thread-copy"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(preview)}</span></span>
                        <span class="activity-thread-meta"><time>${escapeHtml(date)}</time>${unread?'<span class="activity-thread-unread">New</span>':''}</span>
                    </button>
                    <button type="button" class="activity-thread-hide" aria-label="Hide conversation with ${escapeHtml(title)}" onclick="window.SettingsPage.deleteCustomerChatThread('${safeString(d.placeId)}',event)"><i data-lucide="archive"></i></button>
                </article>`;
            }).join('') : '<div class="activity-empty">Your conversations will appear here.</div>';

            wrap.innerHTML = finalHtml;
            window.debouncedIcons?.();
        }, err => {
            window.handleFirestoreError(err);
            const w = document.getElementById("myChatsList");
            if (w) w.innerHTML = `<div class="muted" style="text-align:center; padding: 20px;">Could not load. Please try again later.</div>`;
        });

    syncOptionalActivityTab(user);
}
function startFavorites(user) {
    if(custFavoritesUnsub)return;
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

            let docs = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));

            docs.sort((a, b) => {
                return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
            });

            let html = "";

            docs.forEach(d => {
                html += `
                    <div class="inbox-row" style="position:relative; padding-right:50px;" onclick="window.viewPlace('${d.placeId}')">
                        <div class="inbox-avatar favorite-heart">
                            <i data-lucide="heart" style="fill:currentColor;"></i>
                        </div>

                        <div class="inbox-content">
                            <div class="inbox-name">${escapeHtml(d.placeName)}</div>
                            <div class="inbox-snippet" style="color:var(--ui-accent);">Click to view on map</div>
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

}
function startSukiCards(user) {
    if(custSukiUnsub)return;
    // SUKI CARDS LISTENER — one card per establishment, each rendered
    // in that place's own design. Bounded (customerUid filter + limit).
    custSukiUnsub = window.ViciData.sukiFeed(user.uid, snap => {
            const wrap = document.getElementById("mySukiCardsList");
            if (!wrap) return;

            if (snap.empty) {
                wrap.innerHTML = `<div class="muted" style="text-align:center; padding: 24px;">You don't have a Suki Card yet. Visit a store and scan with Vicinify!</div>`;
                return;
            }

            const cards = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            cards.sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));

            (async () => {
                try {
                    // Join place docs for design (bounded per-doc gets).
                    const placeMap = {};
                    const placeIds = [...new Set(cards.map(c => c.placeId).filter(Boolean))];
                    for (const pid of placeIds) {
                        const cached=window.MapPage?.getCachedPlace?.(pid);
                        if(cached) {placeMap[pid]=cached;continue;}
                        if (placeJoinCache.has(pid)) { placeMap[pid] = placeJoinCache.get(pid); continue; }
                        try {
                            const pd = await window.db.collection("places").doc(pid).get();
                            if (pd.exists) { placeMap[pid] = { ...pd.data(), id: pd.id }; placeJoinCache.set(pid, placeMap[pid]); }
                        } catch (e) { window.handleFirestoreError(e); }
                    }
                    if(window.auth?.currentUser?.uid!==user.uid || activeCustKey!==user.uid)return;
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
function syncOptionalActivityTab(user) {
    if(!user)return;
    const tab=document.querySelector('#customerActivitySection .cust-tab.active')?.dataset.custtab;
    if(tab==='favorites')startFavorites(user);
    if(tab==='suki')startSukiCards(user);
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
        if (soundBtn) { soundBtn.style.background = on ? "#237e72" : "#94a3b8"; soundBtn.setAttribute("role", "switch"); soundBtn.setAttribute("aria-checked", String(on)); soundBtn.setAttribute("aria-label", "Navigation sounds"); }
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
        if (!window.PasswordPolicy.isStrong(newPass)) return alert("New password must be at least 8 characters with uppercase, lowercase, a number, and a special character (!@#$%).");
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

        const nameProblem = window.ContentPolicy?.error('name',newName);
        if(nameProblem) return alert(nameProblem);
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
            window.clearAccountCredentials?.();
            await window.auth.signOut();
            window.clearAccountCredentials?.();
        } catch (error) {
            alert("Error logging out: " + error.message);
        }
    });

    deleteAccountBtn?.addEventListener("click", () => window.AccountDeletion?.open());

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

        syncOptionalActivityTab(window.auth?.currentUser);
        if (tabBtn.dataset.custtab === "bookings") {
            markCustomerTransactionsRead();
        }

        // Opening the list does not read every conversation. Mark only the
        // selected thread when it opens, avoiding a bulk write/read fan-out.
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
    reviewCancellation,
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
