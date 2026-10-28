// =========================================
// 🌙 THEME MANAGER (DARK MODE SAVER)
// =========================================
window.ThemeManager = (() => {
    function applyTheme(theme) {
        const resolvedTheme = theme === 'system'
            ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : theme;

        if (theme === 'dark') {
            document.body.classList.add('dark-mode'); document.body.classList.add('dark');
        } else if (theme === 'light') {
            document.body.classList.remove('dark-mode'); document.body.classList.remove('dark');
        } else { // system
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.body.classList.add('dark-mode'); document.body.classList.add('dark');
            } else {
                document.body.classList.remove('dark-mode'); document.body.classList.remove('dark');
            }
        }

        document.documentElement.dataset.theme = resolvedTheme;
        document.body.dataset.theme = resolvedTheme;
        document.querySelector('meta[name="theme-color"]')?.setAttribute("content", resolvedTheme === "dark" ? "#0f172a" : "#3b82f6");
        window.dispatchEvent(new CustomEvent("vicinify:themechange", { detail: { theme, resolvedTheme } }));
    }

    function init() {
        const savedTheme = localStorage.getItem('vicinify_theme') || 'system';
        applyTheme(savedTheme);

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (localStorage.getItem('vicinify_theme') === 'system') applyTheme('system');
        });
    }

    function setTheme(theme) {
        localStorage.setItem('vicinify_theme', theme);
        applyTheme(theme);
    }

    function getTheme() {
        return localStorage.getItem('vicinify_theme') || 'system';
    }

    return { init, setTheme, getTheme, applyTheme };
})();

window.ThemeManager.init();

// =========================================
// 🌍 GLOBAL TRANSLATION ENGINE (i18n) - BULLETPROOF
// =========================================
window.LangManager = (() => {
    // Ang ating Built-in Tagalog Dictionary!
    const phDictionary = {
        "Welcome to Vicinify": "Maligayang pagdating sa Vicinify",
        "Sign in to continue": "Mag-log in para magpatuloy",
        "Create your account": "Gumawa ng account",
        "Full Name": "Buong Pangalan",
        "Email": "Email Address",
        "Password": "Password",
        "Sign in": "Mag-log in",
        "Sign up": "Gumawa ng Account",
        "Map": "Mapa",
        "Add": "Magdagdag",
        "Buzz": "Balita",
        "Dashboard": "Dashboard",
        "Business Hub": "Business Hub",
        "Settings": "Settings",
        "Radius:": "Layo:",
        "All": "Lahat",
        "Add Establishment": "Magdagdag ng Tindahan",
        "Pin location, fill details, then submit for approval.": "I-pin ang lokasyon at punan ang detalye.",
        "Nearby Buzz": "Mga Balita Dito",
        "News in your area": "Mga kaganapan sa paligid mo",
        "Manage your establishments": "Pamahalaan ang iyong mga tindahan",
        "Profile & Settings": "Profile at Settings",
        "Manage your account and preferences": "Ayusin ang iyong account at app",
        "User Profile": "Impormasyon Mo",
        "Appearance & Language": "Hitsura at Wika",
        "Theme Preference": "Tema ng App",
        "System Default": "System Default",
        "Light Mode": "Maliwanag (Light Mode)",
        "Dark Mode": "Madilim (Dark Mode)",
        "Language": "Wika / Language",
        "My Activities": "Aking Aktibidad",
        "My Bookings": "Mga Request Ko",
        "My Requests": "Mga Request Ko",
        "My Chats": "Mga Chat Ko",
        "Favorites": "Paborito",
        "Log Out": "Mag-log Out",
        "Delete My Account": "Burahin ang Account",
        "Send Request": "Magpadala ng Request",
        "Customer Requests": "Mga Request ng Customer",
        "Ask Vicinify": "Magtanong (hal. 'Saan may murang kape?')"
        ,"Theme Preference": "Tema ng App"
        ,"System Default": "System Default"
        ,"Light Mode": "Light Mode"
        ,"Dark Mode": "Dark Mode"
        ,"Language": "Wika / Language"
        ,"Transactions": "Mga Transaksyon"
        ,"Chat History": "Kasaysayan ng Chat"
        ,"Save Profile": "I-save ang Profile"
        ,"Post": "Mag-post"
        ,"View Map": "Tingnan ang Mapa"
        ,"Add Establishment": "Magdagdag ng Establisyimento"
        ,"System": "System"
        ,"Light": "Maliwanag"
        ,"Dark": "Madilim"
        ,"English": "English"
        ,"Tagalog": "Tagalog"
        ,"Post Now": "Mag-post Ngayon"
        ,"Reviews": "Mga Review"
        ,"Feedback Insights": "Feedback Insights"

        ,"Business Hub": "Sentro ng Negosyo"
        ,"New Listing": "Bagong Listing"
        ,"My Establishments": "Aking mga Establisyimento"
        ,"Customer Inbox": "Inbox ng Customer"
        ,"Database Management": "Pamamahala ng Database"
        ,"Nearby Buzz": "Buzz sa Paligid"
        ,"News in your area": "Balita sa lugar mo"
        ,"Forgot password?": "Nakalimutan ang password?"
        ,"Password & Security": "Password at Seguridad"
        ,"Signed in as": "Naka-sign in bilang"
        ,"Send Password Reset Email": "Magpadala ng Email para I-reset ang Password"
        ,"We will email you a secure link so you can create a new password.": "Padadalhan ka namin ng secure link para gumawa ng bagong password."
        ,"Change password now": "Palitan ang password ngayon"
        ,"Current Password": "Kasalukuyang Password"
        ,"New Password": "Bagong Password"
        ,"Confirm New Password": "Kumpirmahin ang Bagong Password"
        ,"Update Password": "I-update ang Password"
        ,"Reset your password": "I-reset ang iyong password"
        ,"Cancel": "Kanselahin"
        ,"Send reset link": "Ipadala ang reset link"
        ,"Basic Info": "Pangunahing Impormasyon"
        ,"Operating Hours": "Oras ng Operasyon"
        ,"Create Post": "Gumawa ng Post"
        ,"Send Request": "Magpadala ng Request"
        ,"Send a Message": "Magpadala ng Mensahe"
        ,"Edit Establishment": "I-edit ang Establisyimento"
        ,"Account History": "Kasaysayan ng Account"
        ,"Appearance": "Hitsura"
        ,"Restaurant": "Restaurant"
        ,"Café": "Kapehan"
        ,"Bakery": "Panaderya"
        ,"Milk Tea": "Milk Tea"
        ,"Snack House": "Snack House"
        ,"Food Stall": "Food Stall"
        ,"Eatery": "Karinderya"
        ,"Dessert Shop": "Dessert Shop"
        ,"Fast-Food": "Fast-Food"
        ,"Filters": "Mga Filter"
        ,"Open": "Bukas"
        ,"Closed": "Sarado"
        ,"Busy": "Abala"
        ,"Fresh": "Aktibo"
        ,"Inactive": "Hindi Aktibo"
        ,"Nearby": "Malapit"
        ,"No ratings yet": "Wala pang rating"
        ,"Chat": "Chat"
        ,"Request": "Request"
        ,"Navigate": "Mag-navigate"
        ,"Message": "Mensahe"
        ,"View": "Tingnan"
        ,"Comment": "Komento"
        ,"No comments yet. Start the conversation.": "Wala pang komento. Simulan ang usapan."
        ,"Write a comment...": "Magkomento..."
        ,"Loading conversation...": "Naglo-load ng usapan..."
        ,"No messages yet. Send an inquiry!": "Wala pang mensahe. Magtanong na!"
        ,"No establishments found. Try adjusting the search radius or category.": "Walang nakitang tindahan. Baguhin ang layo o kategorya."
        ,"About this place": "Tungkol dito"
        ,"Menu & Store Posts": "Menu at Mga Post"
        ,"Rate this establishment": "I-rate ang tindahang ito"
        ,"Verified Reviews": "Mga Verified Review"
        ,"No menu posts yet": "Wala pang menu post"
        ,"away": "ang layo"
        ,"Reviews": "Mga Review"
        ,"Send": "Ipadala"
        ,"Search places...": "Maghanap ng lugar..."
        ,"Load more": "Mag-load pa"
        ,"Claims": "Mga Claim"
        ,"Reports": "Mga Report"
        ,"Audit": "Audit Log"
    };

    function translateDOM(lang = localStorage.getItem('vicinify_lang') || 'en') {
        // Papalitan nito yung mga text na may data-i18n tag
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = lang === 'ph' ? (phDictionary[key] || key) : key;
        });
        
        // Papalitan nito yung mga placeholder text sa inputs
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = lang === 'ph' ? (phDictionary[key] || key) : key;
        });

        document.documentElement.lang = lang === "ph" ? "tl" : "en";
        document.body.dataset.lang = lang;
    }

    function setup() {
        const currentLang = localStorage.getItem('vicinify_lang') || 'en';
        const selector = document.getElementById('langSelector');
        
        if (selector) {
            selector.value = currentLang;
            selector.addEventListener('change', (e) => {
                localStorage.setItem('vicinify_lang', e.target.value);
                translateDOM(e.target.value);
                window.dispatchEvent(new CustomEvent("vicinify:languagechange", { detail: { lang: e.target.value } }));
            });
        }

        translateDOM(currentLang);
    }

    function init() {
        // 🔥 BULLETPROOF TIMING: I-check kung ready na ang pahina 🔥
        if (document.readyState === 'loading') {
            document.addEventListener("DOMContentLoaded", setup);
        } else {
            setup();
        }
    }

    function setLanguage(lang) {
        localStorage.setItem('vicinify_lang', lang);
        const selector = document.getElementById('langSelector');
        if (selector) selector.value = lang;
        translateDOM(lang);
        window.dispatchEvent(new CustomEvent("vicinify:languagechange", { detail: { lang } }));
    }

    function getLanguage() {
        return localStorage.getItem('vicinify_lang') || 'en';
    }

    function translateKey(key){ const lang = localStorage.getItem('vicinify_lang') || 'en'; return lang === 'ph' ? (phDictionary[key] || key) : key; }
    return { init, translateDOM, setLanguage, getLanguage, translateKey };
})();

// Patakbuhin agad bago pa mag-load ang buong screen!
window.LangManager.init();
window.t = (key) => { try { const lang = window.LangManager?.getLanguage?.() || localStorage.getItem('vicinify_lang') || 'en'; return lang === 'ph' ? (window.LangManager?.translateKey?.(key) || key) : key; } catch(e){ return key; } };
// Re-translate dynamic pages after navigation (dynamic HTML is rendered on page switch)
document.addEventListener('click', (e) => { if (e.target.closest('[data-goto], .nav-item, .cust-tab, .biz-tab')) setTimeout(() => window.LangManager?.translateDOM?.(), 350); });

// =========================================
// MODERN TOAST SYSTEM (v17) — replaces every native alert()
// One engine: window.vicinifyToast(msg, type). alert() and
// showToast() both route here, so all ~130 old call sites get
// the new design without rewriting each one.
// Types: success | error | warning | info (auto-detected for alert())
// =========================================
window.__nativeAlert = window.__nativeAlert || window.alert.bind(window);
function vicinifyCleanMessage(msg) {
    const msgStr = String(msg ?? "");
    const low = msgStr.toLowerCase();
    let clean = msgStr.replace('Firebase Error: Firebase: ', '').replace('Firebase: ', '').replace(/\(auth\/.*\)\./g, '').trim();
    if (low.includes('email-already-in-use') || low.includes('already in use')) clean = "This email is already in use. Please try another one.";
    else if (low.includes('wrong-password') || low.includes('invalid-credential')) clean = "Invalid email or password. Please try again.";
    else if (low.includes('user-not-found')) clean = "No account registered with this email address.";
    else if (low.includes('too-many-requests')) clean = "Too many failed attempts. Please try again later.";
    else if (low.includes('network-request-failed') || low.includes('network error')) clean = "Network error. Please check your internet connection.";
    return clean || "Done.";
}
function vicinifyDetectType(msg, forced) {
    if (forced && ['success','error','warning','info'].includes(forced)) return forced;
    const low = String(msg ?? "").toLowerCase();
    if (/(error|failed|unable|invalid|denied|wrong|not allowed|does not exist|no longer exists|missing)/.test(low)) return 'error';
    if (/(please (enter|select|fill|choose|log|check|add)|required|at least|must )/.test(low)) return 'warning';
    if (/(success|sent|saved|created|updated|removed|deleted|approved|confirmed|submitted|done|thank)/.test(low)) return 'success';
    return 'info';
}

// Offline / back-online notice (slow-internet UX). Toast engine is defined below.
window.addEventListener("offline", () => { try { window.vicinifyToast && window.vicinifyToast("You are offline. Some features need internet.", "warning"); } catch (e) {} });
window.addEventListener("online", () => { try { window.vicinifyToast && window.vicinifyToast("Back online.", "success"); } catch (e) {} });

window.vicinifyToast = function(msg, type) {
    const text = vicinifyCleanMessage(msg);
    const kind = vicinifyDetectType(msg, type === 'auto' ? undefined : type);
    let stack = document.getElementById('v-toast-stack');
    if (!stack) {
        stack = document.createElement('div');
        stack.id = 'v-toast-stack';
        stack.setAttribute('aria-live', 'polite');
        document.body.appendChild(stack);
    }
    while (stack.children.length >= 3) stack.firstChild.remove();
    const icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.5l5 5L19.5 6.5"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4"><path stroke-linecap="round" d="M6 6l12 12M18 6L6 18"/></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.5V14m0 4.2v.3"/></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4"><path stroke-linecap="round" d="M12 10.5V18m0-11.5v.3"/></svg>'
    };
    const titles = { success: 'Success', error: 'Something went wrong', warning: 'Heads up', info: 'Info' };
    const el = document.createElement('div');
    el.className = 'v-toast v-toast-' + kind;
    el.setAttribute('role', 'status');
    const icon = document.createElement('span'); icon.className = 'v-toast-icon'; icon.innerHTML = icons[kind] || icons.info;
    const body = document.createElement('span'); body.className = 'v-toast-body';
    const titleEl = document.createElement('b'); titleEl.className = 'v-toast-title'; titleEl.textContent = titles[kind] || 'Info';
    const textEl = document.createElement('span'); textEl.className = 'v-toast-text'; textEl.textContent = text;
    body.append(titleEl, textEl);
    const close = document.createElement('button'); close.className = 'v-toast-close'; close.type = 'button'; close.setAttribute('aria-label', 'Dismiss');
    close.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" d="M6 6l12 12M18 6L6 18"/></svg>';
    const bar = document.createElement('span'); bar.className = 'v-toast-bar';
    el.append(icon, body, close, bar);
    stack.appendChild(el);
    const duration = Math.min(8500, Math.max(3600, 2200 + text.length * 45));
    bar.style.animationDuration = duration + 'ms';
    let gone = false;
    const dismiss = () => { if (gone) return; gone = true; el.classList.add('out'); setTimeout(() => el.remove(), 260); };
    close.onclick = dismiss;
    el.onclick = (e) => { if (e.target === el || e.target === body) dismiss(); };
    setTimeout(dismiss, duration);
    return el;
};
window.showToast = function(msg, type) { return window.vicinifyToast(msg, type || 'info'); };
window.alert = function(msg) { return window.vicinifyToast(msg, 'auto'); };

// ---------- Firestore quota guard (Spark free plan) ----------
// Any Firestore error whose code/message indicates quota exhaustion must
// surface a user-visible message — never a silent spinner. Returns true
// when the error was a quota error (and the toast was shown).
let _quotaToastAt = 0;
window.isFirestoreQuotaError = function(err) {
    if (!err) return false;
    const code = String(err.code || "").toLowerCase();
    const msg = String(err.message || err || "").toLowerCase();
    return code === "resource-exhausted" ||
        msg.indexOf("quota") !== -1 ||
        msg.indexOf("resource-exhausted") !== -1 ||
        msg.indexOf("resource exhausted") !== -1;
};
window.handleFirestoreError = function(err, fallbackMsg) {
    if (window.isFirestoreQuotaError(err)) {
        const now = Date.now();
        if (now - _quotaToastAt > 60000 && window.showToast) {
            _quotaToastAt = now;
            window.showToast("Free database quota is exhausted for today. Please try again later.", "error");
        }
        return true;
    }
    if (fallbackMsg && window.showToast) window.showToast(fallbackMsg, "error");
    return false;
};

window.vConfirm = function(title, message, confirmBtnText = "Confirm", isDanger = false) {
    return new Promise((resolve) => {
        const modalId = "vConfirmModal_" + Date.now();
        window.lockBodyScroll(true);
        const btnClass = isDanger ? "danger" : "primary";
        const btnStyle = isDanger ? "background: #ef4444; color: white; border: none; padding: 12px 18px; border-radius: 10px; font-weight: 600; cursor: pointer;" : "background: #0f172a; color: white; border: none; padding: 12px 18px; border-radius: 10px; font-weight: 600; cursor: pointer;";
        
        const modalHtml = `
            <div id="${modalId}" style="position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 99999;">
                <div class="modalBackdrop" style="position: absolute; inset: 0; background: rgba(0,0,0,0.5);"></div>
                <div class="modalBox" style="position: relative; width: 90%; max-width: 400px; background: #fff; border-radius: 18px; padding: 24px; z-index: 1; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.2);">
                    <h3 data-vconfirm-title style="margin-top: 0; font-size: 18px; color: #0f172a; margin-bottom: 12px;"></h3>
                    <p data-vconfirm-message style="font-size: 14px; color: #475569; margin-bottom: 24px; line-height: 1.5; white-space: pre-line;"></p>
                    <div style="display: flex; gap: 12px;">
                        <button id="cancelBtn_${modalId}" style="flex: 1; background: #f1f5f9; color: #475569; border: none; padding: 12px; border-radius: 10px; font-weight: 600; cursor: pointer;">Cancel</button>
                        <button id="confirmBtn_${modalId}" style="flex: 1; ${btnStyle}"></button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modalEl = document.getElementById(modalId);
        modalEl.querySelector("[data-vconfirm-title]").textContent = String(title || "Confirm");
        modalEl.querySelector("[data-vconfirm-message]").textContent = String(message || "");
        document.getElementById(`confirmBtn_${modalId}`).textContent = String(confirmBtnText || "Confirm");
        document.getElementById(`confirmBtn_${modalId}`).dataset.danger = String(isDanger);
        
        const cleanup = (result) => {
            window.lockBodyScroll(false);
            modalEl.remove();
            resolve(result);
        };

        document.getElementById(`cancelBtn_${modalId}`).onclick = () => cleanup(false);
        document.getElementById(`confirmBtn_${modalId}`).onclick = () => cleanup(true);
        modalEl.querySelector('.modalBackdrop').onclick = () => cleanup(false);
    });
};

// ---------- FIREBASE CONFIGURATION ----------
const firebaseConfig = {
    apiKey: "AIzaSyBaEwj_D18fXea9OqzCcF8Q9CH_rVZLoJA",
    authDomain: "vicinify-c9828.firebaseapp.com",
    projectId: "vicinify-c9828",
    storageBucket: "vicinify-c9828.firebasestorage.app",
    messagingSenderId: "198267160268",
    appId: "1:198267160268:web:1604e14237653546836469"
};

firebase.initializeApp(firebaseConfig);
window.auth = firebase.auth();
window.db = firebase.firestore();

// Local cache first: reloads and repeat visits read from this device's cache
// instead of re-billing every document from the server (Spark quota saver).
// NOTE (v49): multi-tab cache sync (synchronizeTabs:true) crashed the Firestore
// client with "INTERNAL ASSERTION FAILED: Unexpected state" when several app
// tabs were open at once — writes then hung forever on "Posting...".
// Single-tab cache only: the first tab gets the cache, other tabs fall back
// to live mode via the catch below. The app works either way.
try {
    window.db.enablePersistence().catch(() => {});
} catch (e) { /* cache unavailable (private mode etc.) — app still works without it */ }
window.storage = firebase.storage();

// v53BH: Debounced lucide — scanning entire DOM 66x is a major lag source
// Queues icon renders and batches them into one DOM scan per frame
window.debouncedIcons = (() => {
    let scheduled = false;
    let root = null;
    return function(scope) {
        if (scope && scope !== document) root = scope;
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
            scheduled = false;
            try {
                const target = root || document;
                root = null;
                if (window.lucide) {
                    if (target === document) window.lucide.createIcons();
                    else window.lucide.createIcons({ root: target });
                }
            } catch (e) {}
        });
    };
})();

// v53BB — Global loading overlay (reference-counted) + navigation sounds
window.GlobalLoader = (() => {
    let count = 0;
    let el = null;
    function ensure() {
        if (!el) {
            el = document.createElement("div");
            el.id = "globalLoader";
            el.innerHTML = `<div class="loader-box"><div class="spinner"></div><div class="loader-text" id="globalLoaderText">Loading...</div></div>`;
            document.body.appendChild(el);
        }
        return el;
    }
    return {
        show(text) {
            count++;
            const e = ensure();
            if (text) { const t = document.getElementById("globalLoaderText"); if (t) t.textContent = text; }
            e.classList.add("show");
        },
        hide() {
            count = Math.max(0, count - 1);
            if (count === 0 && el) el.classList.remove("show");
        },
        // Auto-wrap a promise: shows loader until it settles
        wrap(promise, text) {
            this.show(text);
            return Promise.resolve(promise).finally(() => this.hide());
        }
    };
})();

// v53BB — Subtle navigation sounds (Web Audio, no files needed)
window.NavSound = (() => {
    let ctx = null;
    let enabled = true;
    function getCtx() {
        if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
        if (ctx && ctx.state === "suspended") ctx.resume();
        return ctx;
    }
    function beep(freq, dur, vol) {
        if (!enabled) return;
        const ac = getCtx();
        if (!ac) return;
        try {
            const o = ac.createOscillator();
            const g = ac.createGain();
            o.type = "sine";
            o.frequency.value = freq;
            g.gain.setValueAtTime(vol || 0.08, ac.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
            o.connect(g); g.connect(ac.destination);
            o.start(); o.stop(ac.currentTime + dur);
        } catch (e) {}
    }
    return {
        // Soft click for navigation
        nav() { beep(660, 0.07); },
        // Slightly higher for actions (send, submit)
        action() { beep(880, 0.09); },
        // Success chime
        success() { beep(660, 0.08); setTimeout(() => beep(990, 0.1), 80); },
        toggle() { enabled = !enabled; return enabled; },
        get enabled() { return enabled; }
    };
})();


// ---------- Storage Keys ----------
const STORAGE = {
    ACCEPTED: "vicinify_places_accepted",
    PENDING: "vicinify_places_pending",
    BUZZ: "vicinify_buzz_posts",
    SETTINGS: "vicinify_settings"
};

// ---------- Helpers ----------
function readJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
}
function uid(prefix = "id") {
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
function formatDateTime(ts) {
    if (!ts) return "Just now";
    const d = typeof ts === 'object' && ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

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

function safeImageUrl(rawUrl) {
    const value = String(rawUrl || "").trim();
    if (!value || /[\u0000-\u001f"'<>\\]/.test(value)) return "";

    if (/^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(value)) {
        return value.replace(/\s/g, "");
    }

    if (value.startsWith("blob:")) return value;

    try {
        const parsed = new URL(value, window.location.href);
        if (parsed.protocol === "https:" || parsed.protocol === "http:") return value;
    } catch (e) {
        if (/^(assets|images|img)\//i.test(value)) return value;
    }

    return "";
}

window.safeImageUrl = safeImageUrl;

function toViciDate(value) {
    if (!value) return null;
    if (value.toDate && typeof value.toDate === "function") return value.toDate();
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function getViciFreshnessStatus(place = {}) {
    const stamp = place.lastConfirmedAt || place.infoConfirmedAt || place.businessConfirmedAt || place.lastBusinessUpdateAt || place.updatedAt || place.createdAt;
    const date = toViciDate(stamp);
    const days = date ? Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000)) : null;

    if (days == null) {
        return {
            level: "unconfirmed",
            label: "Needs confirmation",
            shortLabel: "Unconfirmed",
            tone: "#ef4444",
            bg: "#fef2f2",
            border: "#fecaca",
            markerColor: "#ef4444",
            className: "freshness-unconfirmed",
            days,
            isInactive: false
        };
    }

    if (days <= 7) {
        return {
            level: "active",
            label: days === 0 ? "Updated today" : `Updated ${days} day${days === 1 ? "" : "s"} ago`,
            shortLabel: "Fresh",
            tone: "#16a34a",
            bg: "#f0fdf4",
            border: "#bbf7d0",
            markerColor: null,
            className: "freshness-active",
            days,
            isInactive: false
        };
    }

    if (days <= 14) {
        return {
            level: "due",
            label: "Due for weekly check",
            shortLabel: "Due soon",
            tone: "#b45309",
            bg: "#fffbeb",
            border: "#fde68a",
            markerColor: "#f59e0b",
            className: "freshness-due",
            days,
            isInactive: false
        };
    }

    if (days <= 30) {
        return {
            level: "needs_update",
            label: "Info may need update",
            shortLabel: "Needs update",
            tone: "#c2410c",
            bg: "#fff7ed",
            border: "#fed7aa",
            markerColor: "#f97316",
            className: "freshness-needs-update",
            days,
            isInactive: false
        };
    }

    if (days <= 60) {
        return {
            level: "unconfirmed",
            label: "Info is unconfirmed",
            shortLabel: "Unconfirmed",
            tone: "#dc2626",
            bg: "#fef2f2",
            border: "#fecaca",
            markerColor: "#ef4444",
            className: "freshness-unconfirmed",
            days,
            isInactive: false
        };
    }

    return {
        level: "inactive",
        label: "Inactive / unconfirmed",
        shortLabel: "Inactive",
        tone: "#64748b",
        bg: "#f1f5f9",
        border: "#cbd5e1",
        markerColor: "#64748b",
        className: "freshness-inactive",
        days,
        isInactive: true
    };
}

window.toViciDate = toViciDate;
window.getViciFreshnessStatus = getViciFreshnessStatus;


/* v53W — Global modal scroll lock: background page cannot scroll while any modal is open.
   Reference-counted so stacked modals (open over open) unlock only when all are closed. */
window.__viciModalLocks = 0;
window.lockBodyScroll = function (on) {
    window.__viciModalLocks = Math.max(0, window.__viciModalLocks + (on ? 1 : -1));
    const locked = window.__viciModalLocks > 0;
    document.documentElement.classList.toggle("vici-modal-lock", locked);
    document.body.classList.toggle("vici-modal-lock", locked);
};

const AppState = {
    user: null,
    userProfile: null,
    userLocation: { lat: null, lng: null },
    radius: 300,
    activeCat: "all",
    activePage: "page-login",
    searchQuery: ""
};


function applyViciPageScrollState(pageId) {
    const isMapPage = pageId === "page-map";
    const html = document.documentElement;
    const body = document.body;
    if (!body) return;

    html.classList.toggle("vici-map-lock", isMapPage);
    body.classList.toggle("vici-map-lock", isMapPage);
    html.classList.toggle("map-page-lock", isMapPage);
    body.classList.toggle("map-page-lock", isMapPage);

    if (isMapPage) {
        window.scrollTo(0, 0);
        html.scrollTop = 0;
        body.scrollTop = 0;

        html.style.overflow = "hidden";
        html.style.overflowY = "hidden";
        html.style.height = "100dvh";
        html.style.maxHeight = "100dvh";
        html.style.scrollbarWidth = "none";

        body.style.overflow = "hidden";
        body.style.overflowY = "hidden";
        body.style.height = "100dvh";
        body.style.maxHeight = "100dvh";
        body.style.position = "relative";
        body.style.scrollbarWidth = "none";
    } else {
        html.style.overflow = "";
        html.style.overflowY = "";
        html.style.height = "";
        html.style.maxHeight = "";
        html.style.scrollbarWidth = "";

        body.style.overflow = "";
        body.style.overflowY = "";
        body.style.height = "";
        body.style.maxHeight = "";
        body.style.position = "";
        body.style.scrollbarWidth = "";

        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        html.scrollTop = 0;
        body.scrollTop = 0;
    }
}

window.applyViciPageScrollState = applyViciPageScrollState;

function resetViciPageScroll(pageId) {
    const html = document.documentElement;
    const body = document.body;
    const activePage = document.getElementById(pageId);
    const scrollingElement = document.scrollingElement || document.documentElement;

    try { window.scrollTo({ top: 0, left: 0, behavior: "auto" }); } catch (e) { window.scrollTo(0, 0); }
    if (html) html.scrollTop = 0;
    if (body) body.scrollTop = 0;
    if (scrollingElement) {
        scrollingElement.scrollTop = 0;
        scrollingElement.scrollLeft = 0;
    }

    const scrollContainers = [
        ".app",
        ".settings-content",
        ".dashboard-content",
        ".admin-content",
        ".filter-content",
        "#page-biz-edit"
    ];

    scrollContainers.forEach(selector => {
        const el = document.querySelector(selector);
        if (!el) return;
        el.scrollTop = 0;
        el.scrollLeft = 0;
        el.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
    });

    document.querySelectorAll(".page").forEach(page => {
        page.scrollTop = 0;
        page.scrollLeft = 0;
    });

    activePage?.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
}


// ---- Broken image guard (v13): never show the browser's broken-image placeholder (diamond-?) ----
// Any <img> that fails to load is removed; containers with data-img-fallback show their fallback instead.
document.addEventListener("error", function (e) {
    const el = e.target;
    if (el && el.tagName === "IMG") {
        el.style.display = "none";
        el.classList.add("img-broken");
        const wrap = el.closest("[data-img-fallback]");
        if (wrap) wrap.classList.add("img-fallback-on");
    }
}, true);

// ---------- Navigation ----------
function showPage(pageId) {
    const isMapPage = pageId === "page-map";

    applyViciPageScrollState(pageId);

    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    const page = document.getElementById(pageId);
    if (page) page.classList.add("active");

    applyViciPageScrollState(pageId);
    resetViciPageScroll(pageId);
    requestAnimationFrame(() => resetViciPageScroll(pageId));

    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(`.nav-item[data-goto="${pageId}"]`).forEach(b => b.classList.add("active"));

    // Quota saver: stop page-specific Firestore listeners when leaving
    // their page. They re-subscribe when the page renders again.
    const prevPage = AppState.activePage;
    if (prevPage && prevPage !== pageId) {
        try {
            if (prevPage === "page-dashboard") window.DashboardPage?.stopAllListeners?.();
            if (prevPage === "page-settings") window.SettingsPage?.stopAllListeners?.();
            if (prevPage === "page-place") window.MapPage?.stopPlaceListeners?.();
            if (prevPage === "page-buzz") window.BuzzPage?.stopListeners?.();
        } catch (e) {}
    }

    AppState.activePage = pageId;

    const bottomNav = document.querySelector(".bottom-nav");
    if (pageId === "page-login") {
        document.body.classList.add("on-login");
        if (bottomNav) bottomNav.style.display = "none";
    } else {
        document.body.classList.remove("on-login");
        if (bottomNav) bottomNav.style.display = "flex";
    }

    if (pageId === "page-map") {
        // Navigating to Map/Home always resets List View -> Map View (user report 2026-10-03).
        // Covers: bottom-nav Map tap, back from Place, and re-entering Map from other pages.
        // toggleView('map') itself calls MapPage.refresh after showing the map.
        if (typeof window.toggleView === "function") {
            try { window.toggleView("map"); } catch (e) { setTimeout(() => window.MapPage?.refresh?.(), 200); }
        } else {
            setTimeout(() => window.MapPage?.refresh?.(), 200);
        }
    }
    if (pageId === "page-buzz") window.BuzzPage?.render?.();
    if (pageId === "page-dashboard") window.DashboardPage?.render?.();
    if (pageId === "page-add") setTimeout(() => window.AddPage?.refreshMiniMap?.(), 200);
    if (pageId === "page-settings") window.SettingsPage?.render?.();

    // Floating order window hides on the hub, reappears elsewhere.
    setTimeout(() => { try { window.FloatingOrderWindow?.render(window._custBookingDocs || []); } catch (e) {} }, 60);

    setTimeout(() => resetViciPageScroll(pageId), 0);
    setTimeout(() => resetViciPageScroll(pageId), 80);
    setTimeout(() => resetViciPageScroll(pageId), 220);
    setTimeout(() => resetViciPageScroll(pageId), 420);
}

function initNav() {
    document.querySelectorAll(".nav-item, [data-goto]").forEach(btn => {
        btn.addEventListener("click", async () => {
            const target = btn.dataset.goto;
            if (!target) return;
            try { window.NavSound?.nav(); } catch (e) {}
            
            if (!AppState.user && target !== "page-login") {
                showPage("page-login");
                return;
            }

            if (AppState.user && !AppState.user.emailVerified && (target === "page-add" || target === "page-dashboard")) {
                const ans = await window.vConfirm(
                    "Account Not Verified", 
                    "You must verify your email address to access this feature. Please check your inbox or spam folder.\n\nWould you like us to resend the verification link?", 
                    "Resend Link", 
                    false
                );
                
                if (ans) {
                    window.resendVerificationEmail();
                }
                return;
            }

            showPage(target);
        });
    });
}

function loadSettings() {
    const s = readJSON(STORAGE.SETTINGS, { defaultRadius: 300 });
    AppState.radius = Number(s.defaultRadius || 300);
    return s;
}

function initAsk() {
    const askBtn = document.getElementById("askBtn");
    const askInput = document.getElementById("askInput");

    if (!askBtn || !askInput) return;

    function handleSpecialAsk(e) {
        const q = (askInput.value || "").trim().toLowerCase();

        if (q === "buzz") {
            e?.preventDefault?.();
            e?.stopImmediatePropagation?.();
            showPage("page-buzz");
            askInput.value = "";
            return true;
        }

        if (q === "add") {
            e?.preventDefault?.();
            e?.stopImmediatePropagation?.();

            if (AppState.user && !AppState.user.emailVerified) {
                window.alert("Please verify your email address first.");
                return true;
            }

            showPage("page-add");
            askInput.value = "";
            return true;
        }

        return false;
    }

    askBtn.addEventListener("click", handleSpecialAsk);

    askInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            handleSpecialAsk(e);
        }
    });
}

// ---------- REAL FIREBASE LOGIN & SIGNUP (WITH EMAIL SENDING) ----------

// ---------- PASSWORD RESET (shared by Login + Settings) ----------
window.vicinifySendPasswordReset = async function(email) {
    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw new Error("Please enter a valid email address.");
    if (!window.auth) throw new Error("Authentication is not ready yet. Please try again.");
    await window.auth.sendPasswordResetEmail(cleanEmail);
    return cleanEmail;
};
window.vicinifyPasswordErrorMessage = function(error) {
    const code = error && error.code ? error.code : "";
    if (code === "auth/invalid-email") return "That email address looks invalid. Please check and try again.";
    if (code === "auth/too-many-requests") return "Too many reset attempts. Please wait a few minutes and try again.";
    if (code === "auth/network-request-failed") return "Network problem. Please check your connection and try again.";
    return (error && error.message) ? error.message : "Could not send reset email. Please try again.";
};

function initLogin() {
    const loginBtn = document.getElementById("loginBtn");
    const toggleAuthBtn = document.getElementById("toggleAuthBtn");
    const authBox = document.getElementById("authBox");
    let isLoginMode = true;

    // 🔥 TOGGLE PASSWORD VISIBILITY LOGIC 🔥
    const togglePassBtn = document.getElementById("togglePassBtn");
    const eyeIcon = document.getElementById("eyeIcon");
    const passInput = document.getElementById("loginPass");

    if (togglePassBtn && passInput && eyeIcon) {
        togglePassBtn.addEventListener("click", () => {
            if (passInput.type === "password") {
                passInput.type = "text";
                eyeIcon.setAttribute("data-lucide", "eye-off");
                togglePassBtn.style.color = "#3b82f6";
            } else {
                passInput.type = "password";
                eyeIcon.setAttribute("data-lucide", "eye");
                togglePassBtn.style.color = "#94a3b8";
            }
            window.debouncedIcons?.();
        });
    }

    // ----- Forgot Password -----
    const forgotLink = document.getElementById("forgotPasswordLink");
    const forgotRow = document.getElementById("forgotRow");
    const forgotModal = document.getElementById("forgotModal");
    const forgotEmailInput = document.getElementById("forgotEmail");
    const forgotSendBtn = document.getElementById("forgotSendBtn");
    const forgotStatus = document.getElementById("forgotStatus");
    function openForgotModal() {
        if (!forgotModal) return;
        const emailInput = document.querySelector('input[type="email"]');
        if (forgotEmailInput && emailInput) forgotEmailInput.value = emailInput.value.trim();
        if (forgotStatus) { forgotStatus.textContent = ""; forgotStatus.className = "forgot-status"; }
        forgotModal.hidden = false; document.body.classList.add("modal-open");
        window.debouncedIcons?.();
        setTimeout(() => forgotEmailInput && forgotEmailInput.focus(), 50);
    }
    function closeForgotModal() { if (!forgotModal) return; forgotModal.hidden = true; document.body.classList.remove("modal-open"); }
    if (forgotLink) forgotLink.addEventListener("click", openForgotModal);
    if (forgotModal) {
        forgotModal.querySelectorAll("[data-close-forgot]").forEach(el => el.addEventListener("click", closeForgotModal));
        document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !forgotModal.hidden) closeForgotModal(); });
    }
    if (forgotSendBtn) forgotSendBtn.addEventListener("click", async () => {
        const email = forgotEmailInput ? forgotEmailInput.value : "";
        forgotSendBtn.disabled = true; const oldText = forgotSendBtn.textContent; forgotSendBtn.textContent = "Sending...";
        try {
            await window.vicinifySendPasswordReset(email);
            if (forgotStatus) { forgotStatus.textContent = "If an account exists for that email, a password reset link has been sent. Please check your inbox and spam folder."; forgotStatus.classList.add("success"); }
            window.alert("Password reset email sent! Please check your inbox or spam folder.");
        } catch (error) {
            console.error("Password reset error:", error);
            if (error && error.code === "auth/user-not-found") {
                if (forgotStatus) { forgotStatus.textContent = "If an account exists for that email, a password reset link has been sent. Please check your inbox and spam folder."; forgotStatus.classList.add("success"); }
            } else if (forgotStatus) { forgotStatus.textContent = window.vicinifyPasswordErrorMessage(error); forgotStatus.classList.add("error"); }
        } finally { forgotSendBtn.disabled = false; forgotSendBtn.textContent = oldText; }
    });
    window.__vicinifySetForgotVisible = (v) => { if (forgotRow) forgotRow.style.display = v ? "" : "none"; };

    // 🔥 PASSWORD STRENGTH LOGIC 🔥
    const reqLength = document.getElementById("reqLength");
    const reqUpper = document.getElementById("reqUpper");
    const reqNum = document.getElementById("reqNum");
    const reqSpec = document.getElementById("reqSpec");
    const pwText = document.getElementById("pwText");
    const bars = [document.getElementById("pwBar1"), document.getElementById("pwBar2"), document.getElementById("pwBar3"), document.getElementById("pwBar4")];

    let isPasswordStrong = false; 

    if (passInput) {
        passInput.addEventListener("input", (e) => {
            if (isLoginMode) return;

            const val = e.target.value;
            let score = 0;

            const hasLength = val.length >= 8;
            const hasUpperLower = /[a-z]/.test(val) && /[A-Z]/.test(val);
            const hasNum = /\d/.test(val);
            const hasSpec = /[!@#$%^&*(),.?":{}|<>]/.test(val);

            if (reqLength) { reqLength.style.color = hasLength ? "#10b981" : "#64748b"; reqLength.classList.toggle("met", hasLength); }
            if (reqUpper) { reqUpper.style.color = hasUpperLower ? "#10b981" : "#64748b"; reqUpper.classList.toggle("met", hasUpperLower); }
            if (reqNum) { reqNum.style.color = hasNum ? "#10b981" : "#64748b"; reqNum.classList.toggle("met", hasNum); }
            if (reqSpec) { reqSpec.style.color = hasSpec ? "#10b981" : "#64748b"; reqSpec.classList.toggle("met", hasSpec); }

            if (hasLength) score++;
            if (hasUpperLower) score++;
            if (hasNum) score++;
            if (hasSpec) score++;

            bars.forEach(b => { if(b) b.style.background = "#e2e8f0"; });

            if (val.length > 0) {
                if (score <= 1) {
                    if (bars[0]) bars[0].style.background = "#ef4444"; 
                    if (pwText) { pwText.textContent = "Weak Password"; pwText.style.color = "#ef4444"; }
                    isPasswordStrong = false;
                } else if (score === 2 || score === 3) {
                    if (bars[0]) bars[0].style.background = "#facc15"; 
                    if (bars[1]) bars[1].style.background = "#facc15";
                    if (score === 3 && bars[2]) bars[2].style.background = "#facc15";
                    if (pwText) { pwText.textContent = "Medium Password"; pwText.style.color = "#ca8a04"; }
                    isPasswordStrong = false;
                } else if (score === 4) {
                    bars.forEach(b => { if(b) b.style.background = "#10b981"; }); 
                    if (pwText) { pwText.textContent = "Strong Password"; pwText.style.color = "#10b981"; }
                    isPasswordStrong = true;
                }
            } else {
                if (pwText) { pwText.textContent = "Password Strength"; pwText.style.color = "#64748b"; }
                isPasswordStrong = false;
            }
        });
    }

    if (toggleAuthBtn) {
        toggleAuthBtn.addEventListener("click", () => {
            isLoginMode = !isLoginMode;
            const signupFields = document.querySelectorAll(".signup-field");

            if (isLoginMode) {
                authBox.classList.remove("signup-mode");
                document.getElementById("authTitle").textContent = "Welcome to Vicinify";
                document.getElementById("authSubtitle").textContent = "Sign in to continue to Lipa's local guide";
                loginBtn.textContent = "Sign in";
                loginBtn.disabled = false;
                toggleAuthBtn.textContent = "Sign up";
                const promptEl = document.getElementById("authPrompt"); if (promptEl) promptEl.textContent = "Don't have an account?";
                document.getElementById("authTabSignIn")?.classList.add("active");
                document.getElementById("authTabSignUp")?.classList.remove("active");
                if (passInput) passInput.setAttribute("autocomplete", "current-password");
                signupFields.forEach(el => el.style.display = "none");
                if (window.__vicinifySetForgotVisible) window.__vicinifySetForgotVisible(true);
            } else {
                authBox.classList.add("signup-mode");
                document.getElementById("authTitle").textContent = "Create your account";
                document.getElementById("authSubtitle").textContent = "Join Vicinify and discover Lipa City";
                loginBtn.textContent = "Create Account";
                const agreeTermsGate = document.getElementById("agreeTerms");
                loginBtn.disabled = !(agreeTermsGate && agreeTermsGate.checked);
                toggleAuthBtn.textContent = "Sign in";
                const promptEl2 = document.getElementById("authPrompt"); if (promptEl2) promptEl2.textContent = "Already have an account?";
                document.getElementById("authTabSignUp")?.classList.add("active");
                document.getElementById("authTabSignIn")?.classList.remove("active");
                if (passInput) passInput.setAttribute("autocomplete", "new-password");
                signupFields.forEach(el => el.style.display = "block");
                if (window.__vicinifySetForgotVisible) window.__vicinifySetForgotVisible(false);
                
                // Trigger input para mag-reset ang UI sa una
                if (passInput) passInput.dispatchEvent(new Event("input"));
            }
        });
    }


    // Auth tabs: clicking the inactive tab performs the same toggle as the footer switch
    const tabIn = document.getElementById("authTabSignIn");
    const tabUp = document.getElementById("authTabSignUp");
    if (tabIn) tabIn.addEventListener("click", () => { if (!isLoginMode) toggleAuthBtn?.click(); });
    if (tabUp) tabUp.addEventListener("click", () => { if (isLoginMode) toggleAuthBtn?.click(); });

    // PLUS45: Terms and Conditions — checkbox gates Create Account (Sign Up mode only)
    const agreeTermsBox = document.getElementById("agreeTerms");
    if (agreeTermsBox) {
        agreeTermsBox.addEventListener("change", () => {
            if (!isLoginMode && loginBtn) loginBtn.disabled = !agreeTermsBox.checked;
        });
    }
    const openTermsLink = document.getElementById("openTermsLink");
    if (openTermsLink) {
        openTermsLink.addEventListener("click", () => {
            document.getElementById("termsModal")?.classList.remove("hidden");
        });
    }

    if (loginBtn) {
        loginBtn.addEventListener("click", async () => {
            const emailInput = document.querySelector('input[type="email"]');
            const nameInput = document.querySelector('input[placeholder="e.g., Cylo De Torres"]');

            const email = emailInput ? emailInput.value.trim() : "";
            const password = passInput ? passInput.value : "";
            const fullName = nameInput ? nameInput.value.trim() : "User";

            if (!email || !password) {
                return window.alert("Please enter your email and password.");
            }

            if (!isLoginMode && fullName.length < 2) {
                return window.alert("Please enter your full name.");
            }

            // 💥 BAGO: I-block kung hindi pa strong ang password sa Sign Up 💥
            if (!isLoginMode && !isPasswordStrong) {
                return window.alert("Please create a Strong Password based on the requirements below.");
            }

            // PLUS45: Terms and Conditions agreement is required to create an account
            if (!isLoginMode && !document.getElementById("agreeTerms")?.checked) {
                return window.alert("Please agree to the Terms and Conditions to create your account.");
            }

            loginBtn.disabled = true;
            loginBtn.textContent = isLoginMode ? "Authenticating..." : "Creating Account...";

            try {
                if (isLoginMode) {
                    await window.auth.signInWithEmailAndPassword(email, password);
                } else {
                    const userCredential = await window.auth.createUserWithEmailAndPassword(email, password);
                    const user = userCredential.user;

                    await user.sendEmailVerification();

                    await window.db.collection("users").doc(user.uid).set({
                        uid: user.uid,
                        fullName: fullName,
                        email: user.email || email,
                        role: "user",
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });

                    window.alert("Account created successfully! A verification link has been sent to your email. Please verify to access all features.");
                }
            } catch (error) {
                // Login errors are generic (prevents email enumeration:
                // "user not found" vs "wrong password"). Signup keeps
                // specific messages (email in use, weak password) for UX.
                const msg = isLoginMode
                    ? "Invalid email or password. Please try again."
                    : ("Error: " + error.message);
                window.alert(msg);
                loginBtn.disabled = false;
                loginBtn.textContent = isLoginMode ? "Sign in" : "Create Account";
            }
        });
    }
}

window.resendVerificationEmail = async function() {
    const user = window.auth.currentUser;
    if (user && !user.emailVerified) {
        try {
            await user.sendEmailVerification();
            window.alert("Verification email sent! Please check your inbox or spam folder.");
        } catch (e) {
            window.alert("Error sending email: " + e.message);
        }
    } else {
        window.alert("Your account is already verified or you are not logged in.");
    }
};

let currentUserDocUnsub = null;

// ---------- FIREBASE AUTH STATE LISTENER ----------
window.auth.onAuthStateChanged(async (user) => {
    const loginBtn = document.getElementById("loginBtn");
    const dashNavBtn = document.querySelector('.nav-item[data-goto="page-dashboard"]');

    if (currentUserDocUnsub) {
        currentUserDocUnsub();
        currentUserDocUnsub = null;
    }

    if (user) {
        await user.reload();

        AppState.user = window.auth.currentUser;

        // Single user-doc read: the live snapshot below doubles as the
        // profile loader (previously a separate .get() duplicated this read).
        let profileApplied = false;
        const applyProfileToUI = () => {
            if (loginBtn) { loginBtn.disabled = false; loginBtn.textContent = "Sign in"; }
            if (dashNavBtn) {
                // One-tab rule: the hub tab is for everyone. Standard users
                // see "My Activity"; owners/admins see "Business Hub".
                dashNavBtn.style.display = "flex";
                const navText = dashNavBtn.querySelector(".navText");
                if (navText) {
                    const isUser = AppState.userProfile?.role === "user";
                    navText.textContent = isUser ? "My Activity" : "Business Hub";
                    navText.setAttribute("data-i18n", isUser ? "My Activity" : "Business Hub");
                }
            }
            if (profileApplied) return;
            profileApplied = true;
            if (window.GlobalNotifier) {
                setTimeout(() => { if (window.auth?.currentUser?.uid === user.uid) window.GlobalNotifier.start(user); }, 1500);
            }
            window.db.collection("public_profiles").doc(user.uid).set({ fullName: String(AppState.userProfile?.fullName || "Customer").slice(0, 120) }).catch(() => {});
            if (!AppState.user.emailVerified) {
                setTimeout(() => {
                    if (window.alert) window.alert("Your account is unverified. Please check your email to verify your account.");
                }, 2500);
            }
            showPage("page-map");
        };

        currentUserDocUnsub = window.db.collection("users").doc(user.uid).onSnapshot(async doc => {
            if (!doc.exists) {
                if (AppState.userProfile != null) {
                    if (window.isSelfDeleting) return;
                    window.alert("Your account has been removed from the system. You will be logged out.");
                    window.auth.signOut();
                    window.location.reload();
                    return;
                }
                const fallbackProfile = {
                    uid: user.uid,
                    fullName: user.displayName || "User",
                    email: user.email || "",
                    role: "user",
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                try {
                    await window.db.collection("users").doc(user.uid).set(fallbackProfile, { merge: true });
                } catch (e) {
                    console.log("Error creating profile:", e);
                }
                AppState.userProfile = fallbackProfile;
            } else {
                const profileData = doc.data();
                // Permanent admin lock: this UID is always admin, even if
                // the profile doc role was changed or recreated.
                if (user.uid === "Z45NZhQTgsTUX79WJ5ksCH8N3c02") profileData.role = "admin";
                AppState.userProfile = profileData;
            }
            applyProfileToUI();
        }, err => {
            window.handleFirestoreError(err);
            if (!AppState.userProfile) {
                AppState.userProfile = { uid: user.uid, fullName: "User", email: user.email || "", role: "user" };
            }
            applyProfileToUI();
        });
    } else {
        AppState.user = null;
        AppState.userProfile = null;
        if (loginBtn) { loginBtn.disabled = false; loginBtn.textContent = "Sign in"; }

        if (window.GlobalNotifier) {
            window.GlobalNotifier.stop();
        }

        // Stop all Firestore listeners BEFORE they error on lost auth
        // (prevents "Could not load ..." toasts right after logout).
        try { window.SettingsPage && window.SettingsPage.stopAllListeners && window.SettingsPage.stopAllListeners(); } catch (e) {}
        try { window.DashboardPage && window.DashboardPage.stopAllListeners && window.DashboardPage.stopAllListeners(); } catch (e) {}
        try { window.MapPage && window.MapPage.stopPlaceListeners && window.MapPage.stopPlaceListeners(); } catch (e) {}
        // The open chat-room listener belongs to this auth session too.
        if (currentChatUnsub) { try { currentChatUnsub(); } catch (e) {} currentChatUnsub = null; }
        // Clear Vici AI chat panel so the next account doesn't see the
        // previous user's conversation (privacy on shared devices).
        try { window.MapPage && window.MapPage.resetViciAI && window.MapPage.resetViciAI(); } catch (e) {}

        window.ViciData?.stop();
        showPage("page-login");
    }
});

// ---------- Boot ----------
document.addEventListener("DOMContentLoaded", () => {
document.body.classList.add("on-login");
loadSettings();
initNav();
initAsk();
initLogin();

setupChatActionButtons();

const unlockAudio = () => {
    const unlock = new Audio();
    unlock.play().catch(() => {});
    document.removeEventListener("click", unlockAudio);
    document.removeEventListener("touchstart", unlockAudio);
};

document.addEventListener("click", unlockAudio);
document.addEventListener("touchstart", unlockAudio);

});

// ==========================================================
// 🔥 VICINIFY IN-CHAT TRANSACTION HUB — FINAL WITH FEEDBACK
// ==========================================================
let currentChatUnsub = null;
let currentChatContext = { isOwner: false, pendingRequirementId: null, requestType: null };
// Latest rendered thread docs, so chat-card actions reuse them instead
// of re-reading the message doc (its fields never change after send).
let currentChatDocsCache = [];


function setupChatActionButtons() {
const chatInput = document.getElementById("chatMessageInput");
if (!chatInput || !chatInput.parentElement) return;

["chatAddressBtn", "chatShareLocationBtn", "chatPaymentBtn", "chatOrderBtn", "chatRequirementBtn"].forEach(id => {
    const oldBtn = document.getElementById(id);
    if (oldBtn) oldBtn.remove();
});

let actionBar = document.getElementById("chatQuickActions");
if (!actionBar) {
    actionBar = document.createElement("div");
    actionBar.id = "chatQuickActions";
    actionBar.hidden = true;
    chatInput.parentElement.insertBefore(actionBar, chatInput);
}
const makeActionBtn = (id, label, title, bg, color) => {
    const btn = document.createElement("button");
    btn.id = id;
    btn.type = "button";
    btn.innerHTML = label;
    btn.title = title;
    btn.setAttribute("aria-label", title);
    btn.style.cssText = `
        width:38px;
        height:38px;
        border-radius:50%;
        border:1px solid #e2e8f0;
        background:${bg};
        color:${color};
        cursor:pointer;
        font-size:17px;
        display:none;
        align-items:center;
        justify-content:center;
        flex-shrink:0;
        box-shadow:0 4px 12px rgba(15,23,42,0.08);
    `;
    btn.onclick = () => {
        if (currentChatContext.pendingRequirementId && window.openRequirementResponseModal) {
            window.openRequirementResponseModal(currentChatContext.pendingRequirementId);
        } else {
            window.alert("No active delivery/details request yet. Wait for the business to accept or request details.");
        }
    };
    actionBar.appendChild(btn);
    return btn;
};

makeActionBtn("chatAddressBtn", '<i data-lucide="home"></i>', "Submit delivery address", "#fff7ed", "#c2410c");
makeActionBtn("chatShareLocationBtn", '<i data-lucide="map-pin"></i>', "Submit current location", "#ecfdf5", "#047857");
makeActionBtn("chatPaymentBtn", '<i data-lucide="credit-card"></i>', "Submit payment details", "#eff6ff", "#1d4ed8");
makeActionBtn("chatOrderBtn", '<i data-lucide="clipboard-pen"></i>', "Submit order details", "#f8fafc", "#0f172a");

const reqBtn = document.createElement("button");
reqBtn.id = "chatRequirementBtn";
reqBtn.type = "button";
reqBtn.innerHTML = '<i data-lucide="clipboard-list"></i>';
reqBtn.title = "Request transaction requirements";
reqBtn.setAttribute("aria-label", reqBtn.title);
reqBtn.style.cssText = `
    width:40px;
    height:40px;
    border-radius:50%;
    border:1px solid #cbd5e1;
    background:white;
    cursor:pointer;
    font-size:18px;
    display:none;
    align-items:center;
    justify-content:center;
    flex-shrink:0;
    box-shadow:0 4px 12px rgba(15,23,42,0.08);
`;

reqBtn.onclick = () => window.openRequirementRequestModal();
actionBar.appendChild(reqBtn);

}

function updateChatQuickActions(isOwner, pendingRequirement) {
currentChatContext.isOwner = !!isOwner;
currentChatContext.pendingRequirementId = pendingRequirement?.id || null;
currentChatContext.requestType = pendingRequirement?.requestType || null;
currentChatContext.activeTransactionId = pendingRequirement?.transactionId || pendingRequirement?.bookingId || null;

const ownerBtn = document.getElementById("chatRequirementBtn");
if (ownerBtn) ownerBtn.style.display = isOwner ? "inline-flex" : "none";

const req = pendingRequirement?.requirements || {};
const showCustomerQuick = !isOwner && !!pendingRequirement && (pendingRequirement.requirementStatus || "waiting_customer") === "waiting_customer";

const buttonMap = {
    chatAddressBtn: !!req.address,
    chatShareLocationBtn: !!req.location,
    chatPaymentBtn: !!req.payment,
    chatOrderBtn: !!req.orderDetails
};

Object.entries(buttonMap).forEach(([id, shouldShow]) => {
    const btn = document.getElementById(id);
    if (btn) btn.style.display = showCustomerQuick && shouldShow ? "inline-flex" : "none";
});
const actionBar = document.getElementById("chatQuickActions");
if (actionBar) actionBar.hidden = !isOwner && !(showCustomerQuick && Object.values(buttonMap).some(Boolean));
}

function setupChatSuggestions(isOwnerView) {
    const input = document.getElementById("chatMessageInput");
    if (!input?.parentElement) return;
    let group = document.getElementById("chatSuggestions");
    if (!group) {
        group = document.createElement("div");
        group.id = "chatSuggestions";
        group.className = "chat-suggestions";
        group.setAttribute("role", "group");
        group.setAttribute("aria-label", "Suggested questions");
        const label = document.createElement("span");
        label.className = "chat-suggestions-label";
        label.textContent = "Quick questions";
        const heading = document.createElement("div");
        heading.className = "chat-suggestions-heading";
        heading.appendChild(label);
        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "chat-suggestions-toggle";
        toggle.textContent = "Hide";
        toggle.setAttribute("aria-expanded", "true");
        toggle.setAttribute("aria-controls", "chatSuggestionChoices");
        heading.appendChild(toggle);
        group.appendChild(heading);
        const choices = document.createElement("div");
        choices.id = "chatSuggestionChoices";
        choices.className = "chat-suggestion-choices";
        toggle.addEventListener("click", () => {
            choices.hidden = !choices.hidden;
            toggle.textContent = choices.hidden ? "Show" : "Hide";
            toggle.setAttribute("aria-expanded", String(!choices.hidden));
        });
        group.appendChild(choices);
        const questions = [
            ["View menu", "Hi! Can I see your menu, please?"],
            ["Opening hours", "Hi! What are your opening hours?"],
            ["Delivery options", "Hi! Do you offer delivery, and which areas do you cover?"],
            ["Book a table", "Hi! Can I reserve a table? What details do you need?"]
        ];
        questions.forEach(([title, message]) => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = title;
            button.className = "chat-suggestion";
            button.setAttribute("aria-label", "Draft message: " + message);
            button.addEventListener("click", () => {
                if (group.dataset.customer !== "true") return;
                // Draft only; sending still requires the customer's Send action.
                const draft = input.value.trim();
                input.value = draft ? draft + " " + message : message;
                input.dispatchEvent(new Event("input", { bubbles: true }));
                input.focus();
                input.setSelectionRange(input.value.length, input.value.length);
            });
            choices.appendChild(button);
        });
        input.parentElement.insertBefore(group, input);
        input.addEventListener("input", () => {
            group.hidden = group.dataset.customer !== "true" || !!input.value.trim();
        });
    }
    group.dataset.customer = String(!isOwnerView);
    group.hidden = isOwnerView || !!input.value.trim();
}

function setupChatComposer() {
    const input = document.getElementById("chatMessageInput");
    if (!input) return;
    const resize = () => {
        input.style.height = "auto";
        input.style.height = Math.max(44, Math.min(input.scrollHeight, 112)) + "px";
    };
    if (!input.dataset.composerReady) {
        input.dataset.composerReady = "true";
        input.addEventListener("input", resize);
        input.addEventListener("keydown", event => {
            if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
                event.preventDefault();
                window.sendChatMessage();
            }
        });
    }
    resize();
}

function splitPaymentMethods(raw) {
return String(raw || "")
.split(",")
.map(x => x.trim())
.filter(Boolean);
}

function getInitial(name) {
return String(name || "U").charAt(0).toUpperCase();
}

// Display-name memo: these helpers are called inside render loops and
// per message; without a cache each call costs 1 read for the same name.
const _nameMemo = new Map();
function _memoGet(key) {
    const hit = _nameMemo.get(key);
    if (hit && (Date.now() - hit.at) < 300000) return hit.value;
    return null;
}
function _memoSet(key, value) { _nameMemo.set(key, { value, at: Date.now() }); }

async function getCustomerDisplayName(customerUid) {
if (!customerUid) return "Customer";
const memoHit = _memoGet("u:" + customerUid);
if (memoHit) return memoHit;

try {
    const userDoc = await window.db.collection("public_profiles").doc(customerUid).get();

    if (userDoc.exists) {
        const data = userDoc.data();
        const name = data.fullName || data.displayName || "Customer";
        _memoSet("u:" + customerUid, name);
        return name;
    }
} catch (e) {
    console.warn("Customer name lookup failed:", e);
}

return "Customer";

}

async function getPlaceDisplayName(placeId, fallbackName = "Establishment") {
if (!placeId) return fallbackName || "Establishment";
const memoHit = _memoGet("p:" + placeId);
if (memoHit) return memoHit;

try {
    const placeDoc = await window.db.collection("places").doc(placeId).get();

    if (placeDoc.exists) {
        const data = placeDoc.data();
        const name = data.name || fallbackName || "Establishment";
        _memoSet("p:" + placeId, name);
        return name;
    }
} catch (e) {
    console.warn("Place name lookup failed:", e);
}

return fallbackName || "Establishment";

}

function getStatusBadgeStyle(status) {
const s = String(status || "info").toLowerCase();

const map = {
    pending: {
        bg: "#fef3c7",
        color: "#92400e",
        label: "Waiting for Business Acceptance"
    },
    accepted: {
        bg: "#dcfce7",
        color: "#166534",
        label: "Accepted by Business"
    },
    rejected: {
        bg: "#fee2e2",
        color: "#991b1b",
        label: "Rejected by Business"
    },
    fulfilled: {
        bg: "#dbeafe",
        color: "#1d4ed8",
        label: "Marked Fulfilled by Business"
    },
    received: {
        bg: "#ede9fe",
        color: "#5b21b6",
        label: "Confirmed Received by Customer"
    },
    waiting_customer: {
        bg: "#fef3c7",
        color: "#92400e",
        label: "Waiting for Customer Response"
    },
    submitted: {
        bg: "#dcfce7",
        color: "#166534",
        label: "Submitted by Customer"
    },
    confirmed: {
        bg: "#ede9fe",
        color: "#5b21b6",
        label: "Confirmed by Business"
    },
    pending_confirmation: {
        bg: "#fef3c7",
        color: "#92400e",
        label: "Waiting for Business Confirmation"
    },
    payment_submitted: {
        bg: "#fef3c7",
        color: "#92400e",
        label: "Payment Proof Submitted"
    },
    payment_confirmed: {
        bg: "#dcfce7",
        color: "#166534",
        label: "Payment Confirmed by Business"
    },
    preparing: {
        bg: "#ffedd5",
        color: "#c2410c",
        label: "Preparing Order"
    },
    out_for_delivery: {
        bg: "#e0f2fe",
        color: "#0369a1",
        label: "Out for Delivery"
    },
    delivered: {
        bg: "#dcfce7",
        color: "#166534",
        label: "Delivered by Business"
    },
    fulfilled_waiting_customer: {
        bg: "#dbeafe",
        color: "#1d4ed8",
        label: "Waiting for Customer Confirmation"
    },
    feedback_waiting: {
        bg: "#fef3c7",
        color: "#92400e",
        label: "Waiting for Customer Feedback"
    },
    feedback_submitted: {
        bg: "#dcfce7",
        color: "#166534",
        label: "Feedback Submitted by Customer"
    }
};

return map[s] || {
    bg: "#e0f2fe",
    color: "#0369a1",
    label: String(status || "Info")
};

}

function makeBadge(status) {
const style = getStatusBadgeStyle(status);

return `
    <span style="display:inline-block; margin-left:4px; padding:4px 9px; border-radius:999px; font-size:10px; font-weight:800; background:${style.bg}; color:${style.color};">
        ${escapeHtml(style.label)}
    </span>
`;

}

function getRequestMeta(requestType) {
const key = String(requestType || "table_reservation").toLowerCase();

const map = {
    booking: {
        key: "booking",
        icon: "📅",
        title: "General Booking Request",
        shortLabel: "Booking",
        color: "#2563eb",
        light: "#dbeafe",
        dark: "#1d4ed8",
        fulfillLabel: "Mark as Fulfilled",
        confirmLabel: "Confirm Completed"
    },
    table: {
        key: "table_reservation",
        icon: "🍽️",
        title: "Table Reservation Request",
        shortLabel: "Table Reservation",
        color: "#f97316",
        light: "#ffedd5",
        dark: "#c2410c",
        fulfillLabel: "Mark Dining Completed",
        confirmLabel: "Confirm Completed"
    },
    table_reservation: {
        key: "table_reservation",
        icon: "🍽️",
        title: "Table Reservation Request",
        shortLabel: "Table Reservation",
        color: "#f97316",
        light: "#ffedd5",
        dark: "#c2410c",
        fulfillLabel: "Mark Dining Completed",
        confirmLabel: "Confirm Completed"
    },
    food: {
        key: "food_reservation",
        icon: "🍱",
        title: "Food Reservation Request",
        shortLabel: "Food Reservation",
        color: "#16a34a",
        light: "#dcfce7",
        dark: "#166534",
        fulfillLabel: "Mark Food Prepared",
        confirmLabel: "Confirm Received"
    },
    food_reservation: {
        key: "food_reservation",
        icon: "🍱",
        title: "Food Reservation Request",
        shortLabel: "Food Reservation",
        color: "#16a34a",
        light: "#dcfce7",
        dark: "#166534",
        fulfillLabel: "Mark Food Prepared",
        confirmLabel: "Confirm Received"
    },
    pickup: {
        key: "pickup_order",
        icon: "🛍️",
        title: "Pickup Order Request",
        shortLabel: "Pickup Order",
        color: "#7c3aed",
        light: "#ede9fe",
        dark: "#5b21b6",
        fulfillLabel: "Mark Ready for Pickup",
        confirmLabel: "Confirm Picked Up"
    },
    pickup_order: {
        key: "pickup_order",
        icon: "🛍️",
        title: "Pickup Pre-order Request",
        shortLabel: "Pickup Pre-order",
        color: "#7c3aed",
        light: "#ede9fe",
        dark: "#5b21b6",
        fulfillLabel: "Mark Ready for Pickup",
        confirmLabel: "Confirm Picked Up"
    },
    advance_order: {
        key: "advance_order",
        icon: "🗓️",
        title: "Advance Order Request",
        shortLabel: "Advance Order",
        color: "#ea580c",
        light: "#ffedd5",
        dark: "#9a3412",
        fulfillLabel: "Mark Order Completed",
        confirmLabel: "Confirm Received"
    },
    delivery: {
        key: "delivery_order",
        icon: "🛵",
        title: "Delivery Order Request",
        shortLabel: "Delivery Order",
        color: "#0ea5e9",
        light: "#e0f2fe",
        dark: "#0369a1",
        fulfillLabel: "Mark Delivered",
        confirmLabel: "Confirm Received"
    },
    delivery_order: {
        key: "delivery_order",
        icon: "🛵",
        title: "Delivery Order Request",
        shortLabel: "Delivery Order",
        color: "#0ea5e9",
        light: "#e0f2fe",
        dark: "#0369a1",
        fulfillLabel: "Mark Delivered",
        confirmLabel: "Confirm Received"
    }
};

return map[key] || map.table_reservation;

}

function renderRequestDetailRows(d) {
const rows = [];

if (d.bookingDate) rows.push(["Date", d.bookingDate]);
if (d.bookingTime) rows.push(["Time", d.bookingTime]);
if (d.guestCount) rows.push(["Guests", d.guestCount]);
if (d.seatingPreference) rows.push(["Seating", d.seatingPreference]);
if (d.occasion) rows.push(["Occasion", d.occasion]);
if (d.fulfillmentType) rows.push(["Fulfillment", d.fulfillmentType]);
if (d.paymentType) rows.push(["Payment Type", d.paymentType]);
if (d.paymentMethod) rows.push(["Payment", d.paymentMethod]);
if (d.purpose) rows.push(["Purpose", d.purpose]);

let html = rows.map(([label, value]) => `
    <div><b>${escapeHtml(label)}:</b> ${escapeHtml(value)}</div>
`).join("");

if (d.orderItems) {
    html += `
        <div style="margin-top:8px;">
            <b>Items / Order:</b>
            <div style="white-space:pre-wrap; margin-top:4px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:9px;">${escapeHtml(d.orderItems)}</div>
        </div>
    `;
}

if (d.deliveryAddress) {
    html += `
        <div style="margin-top:8px;">
            <b>Delivery Address:</b>
            <div style="white-space:pre-wrap; margin-top:4px; background:#fff7ed; border:1px solid #fed7aa; border-radius:10px; padding:9px;">${escapeHtml(d.deliveryAddress)}</div>
        </div>
    `;
}

if (d.bookingDetails && d.bookingDetails !== "None") {
    html += `
        <div style="margin-top:8px;">
            <b>Notes:</b>
            <div style="white-space:pre-wrap; margin-top:4px;">${escapeHtml(d.bookingDetails)}</div>
        </div>
    `;
} else if (!html && d.details) {
    html += `<div style="white-space:pre-wrap;">${escapeHtml(d.details)}</div>`;
}

return html || `<div style="color:#64748b;">No additional details.</div>`;

}

function getCardSide(d, currentUid, isOwnerView, fallbackSenderRole = "customer") {
if (d.senderUid) {
return d.senderUid === currentUid ? "flex-end" : "flex-start";
}

if (d.createdBy && d.createdBy !== "system") {
    return d.createdBy === currentUid ? "flex-end" : "flex-start";
}

if (d.senderRole) {
    const myRole = isOwnerView ? "owner" : "customer";

    if (d.senderRole === "system") {
        return "flex-start";
    }

    return d.senderRole === myRole ? "flex-end" : "flex-start";
}

if (fallbackSenderRole === "owner") {
    return isOwnerView ? "flex-end" : "flex-start";
}

return isOwnerView ? "flex-start" : "flex-end";

}

function injectPremiumChatStyles() {
    if (document.getElementById("vicinifyPremiumChatStyles")) return;

    const style = document.createElement("style");
    style.id = "vicinifyPremiumChatStyles";
    style.innerHTML = `
        #chatModal { z-index: 9998 !important; }
        #chatModal .modalBackdrop { z-index: 9998 !important; }
        #chatModal .modalBox { z-index: 9999 !important; }
        .vtx-command { position: relative; top: auto; z-index: 1; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 12px; margin: 10px auto 14px; width: calc(100% - 16px); box-shadow: 0 6px 18px rgba(15,23,42,0.08); box-sizing: border-box; }
        .vtx-command-head { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:10px; }
        .vtx-title { display:flex; align-items:center; gap:10px; min-width:0; }
        .vtx-icon { width:40px; height:40px; border-radius:14px; display:flex; align-items:center; justify-content:center; color:white; font-size:20px; box-shadow:0 8px 18px rgba(15,23,42,0.16); }
        .vtx-name { font-size:13px; font-weight:900; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:210px; }
        .vtx-sub { font-size:11px; color:#64748b; font-weight:700; margin-top:2px; }
        .vtx-pill { font-size:10px; font-weight:900; border-radius:999px; padding:6px 9px; white-space:nowrap; }
        .vtx-progress { width:100%; height:8px; border-radius:999px; background:#e2e8f0; overflow:hidden; margin:10px 0 12px; }
        .vtx-progress-fill { height:100%; border-radius:999px; transition:width .35s ease; }
        .vtx-grid { display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:7px; margin-top:10px; }
        .vtx-mini { background:white; border:1px solid #e2e8f0; border-radius:14px; padding:9px; min-height:58px; }
        .vtx-mini-label { font-size:10px; color:#64748b; font-weight:800; text-transform:uppercase; letter-spacing:.03em; }
        .vtx-mini-value { font-size:12px; color:#0f172a; font-weight:900; margin-top:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .vtx-timeline { display:grid; gap:8px; margin-top:11px; }
        .vtx-step { display:flex; align-items:flex-start; gap:9px; }
        .vtx-dot { width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; flex-shrink:0; font-weight:900; }
        .vtx-step-title { font-size:12px; color:#0f172a; font-weight:900; }
        .vtx-step-sub { font-size:11px; color:#64748b; margin-top:1px; line-height:1.3; }
        .vtx-panel { display:grid; gap:8px; margin-top:10px; }
        .vtx-panel-card { background:white; border:1px solid #e2e8f0; border-radius:14px; padding:10px; font-size:12px; color:#334155; }
        .vtx-system { display:flex; align-items:center; justify-content:center; margin:14px 0; }
        .vtx-system span { background:#f8fafc; border:1px solid #e2e8f0; color:#64748b; padding:6px 12px; border-radius:999px; font-size:11px; font-weight:800; box-shadow:0 4px 12px rgba(15,23,42,0.06); }
        @media (max-width: 520px) { .vtx-grid { grid-template-columns: repeat(3, minmax(0,1fr)); gap:6px; } .vtx-mini { padding:8px; min-height:54px; } .vtx-name { max-width: 170px; } .vtx-command { border-radius:16px; width: calc(100% - 10px); } }
    `;
    document.head.appendChild(style);
}

function newestDoc(docs, predicate) {
    const list = docs.filter(predicate).sort((a, b) => getDocMillis(a) - getDocMillis(b));
    return list.length ? list[list.length - 1] : null;
}

function getDocMillis(d) {
    return d?.createdAt?.toMillis?.() || 0;
}

function getLatestBookingCard(docs) {
    const cards = docs.filter(d => d.type === "booking_card");

    if (!cards.length) return null;

    function cardStatus(card) {
        return normalizeStatusText(card.bookingStatus || card.status || card.requestStatus || "pending");
    }

    function isFinalCard(card) {
        const st = cardStatus(card);
        return [
            "received",
            "fulfilled",
            "completed",
            "done",
            "archived",
            "feedback_done",
            "feedback_submitted",
            "rejected",
            "cancelled",
            "canceled"
        ].includes(st);
    }

    const activeCards = cards.filter(card => !isFinalCard(card));
    const targetCards = activeCards.length ? activeCards : cards;

    targetCards.sort((a, b) => getDocMillis(a) - getDocMillis(b));

    return targetCards[targetCards.length - 1];
}

function sameTransaction(d, transactionId, bookingId, bookingMessageId) {
    if (!d) return false;
    if (transactionId && d.transactionId === transactionId) return true;
    if (bookingId && d.bookingId === bookingId) return true;
    if (bookingId && d.transactionId === bookingId) return true;
    if (bookingMessageId && d.linkedBookingMessageId === bookingMessageId) return true;
    if (bookingId && d.linkedBookingId === bookingId) return true;
    if (d.type === "booking_card" && d.id === bookingMessageId) return true;
    return false;
}

function getActiveTransactionDocs(docs) {
    const activeBooking = getLatestBookingCard(docs);

    if (!activeBooking) return [];

    const transactionId = activeBooking.transactionId || activeBooking.bookingId || activeBooking.id;
    const bookingId = activeBooking.bookingId || activeBooking.transactionId || null;
    const bookingMessageId = activeBooking.id || null;

    const scoped = docs.filter(d => sameTransaction(d, transactionId, bookingId, bookingMessageId));

    return scoped.length ? scoped : [activeBooking];
}

function normalizeStatusText(status) {
    return String(status || "").toLowerCase();
}

function isDone(status, values) {
    return values.includes(normalizeStatusText(status));
}

function renderTimelineStep(done, active, icon, title, sub, color = "#3b82f6") {
    const bg = done ? "#dcfce7" : active ? "#fff7ed" : "#f1f5f9";
    const c = done ? "#166534" : active ? "#ea580c" : "#94a3b8";
    const symbol = done ? "✓" : active ? "…" : icon;
    return `
        <div class="vtx-step">
            <div class="vtx-dot" style="background:${bg}; color:${c}; border:1px solid ${done ? "#bbf7d0" : active ? "#fed7aa" : "#e2e8f0"};">${symbol}</div>
            <div>
                <div class="vtx-step-title">${escapeHtml(title)}</div>
                <div class="vtx-step-sub">${escapeHtml(sub)}</div>
            </div>
        </div>
    `;
}

function getTransactionState(docs) {
    const scopedDocs = getActiveTransactionDocs(docs);

    const booking = getLatestBookingCard(scopedDocs);
    const req = newestDoc(scopedDocs, d => d.type === "requirement_request");
    const resp = newestDoc(scopedDocs, d => d.type === "requirement_response");
    const completion = newestDoc(scopedDocs, d => d.type === "completion_request");
    const feedbackReq = newestDoc(scopedDocs, d => d.type === "feedback_request");
    const feedbackResp = newestDoc(scopedDocs, d => d.type === "feedback_response");

    const requestType = booking?.requestType || req?.requestType || resp?.requestType || "booking";
    const meta = getRequestMeta(requestType);
    const bookingStatus = booking?.bookingStatus || booking?.status || "pending";
    const txStatus = ["preparing", "out_for_delivery", "delivered", "received"].includes(bookingStatus) ? bookingStatus : completion?.transactionStatus || "";

    const accepted = isDone(bookingStatus, ["accepted", "payment_submitted", "payment_confirmed", "preparing", "ready", "out_for_delivery", "delivered", "fulfilled", "received"]) || !!req || !!resp || !!completion || !!feedbackReq || !!feedbackResp;
    const rejected = normalizeStatusText(bookingStatus) === "rejected";
    const detailsSubmitted = !!resp;
    const paymentConfirmed = booking ? window.PaymentPolicy.flow(booking).verified : false;
    const onlinePayment = booking ? window.PaymentPolicy.isOnline(booking) : false;
    const preparing = normalizeStatusText(txStatus) === "preparing";
    const outForDelivery = normalizeStatusText(txStatus) === "out_for_delivery";
    const delivered = isDone(txStatus, ["delivered", "received"]) || isDone(bookingStatus, ["delivered", "fulfilled", "received"]);
    const received = normalizeStatusText(txStatus) === "received" || normalizeStatusText(bookingStatus) === "received" || !!feedbackReq || !!feedbackResp;
    const feedbackDone = !!feedbackResp || normalizeStatusText(feedbackReq?.feedbackStatus) === "feedback_submitted";

    return { booking, req, resp, completion, feedbackReq, feedbackResp, requestType, meta, bookingStatus, txStatus, accepted, rejected, detailsSubmitted, paymentConfirmed, onlinePayment, preparing, outForDelivery, delivered, received, feedbackDone };
}

function progressPercent(state) {
    if (state.rejected) return 100;
    const isDelivery = state.meta.key === "delivery_order";
    const items = isDelivery
        ? [!!state.booking, state.accepted, state.detailsSubmitted, !state.onlinePayment || state.paymentConfirmed, state.delivered || state.outForDelivery || state.received, state.feedbackDone]
        : [!!state.booking, state.accepted, state.delivered || state.received, state.feedbackDone];
    const done = items.filter(Boolean).length;
    return Math.max(10, Math.round((done / items.length) * 100));
}

function renderOrderSummaryMini(state) {
    const source = state.resp || state.booking || {};
    const order = source.orderDetails || source.orderItems || source.bookingDetails || "";
    const pay = source.paymentMethod || state.req?.prefillPaymentMethod || "";
    const amount = source.paymentAmount || state.req?.amount || "";
    const address = [source.houseStreet, source.barangay, source.city, source.landmark].filter(Boolean).join(", ") || source.deliveryAddress || state.req?.prefillAddress || "";

    let html = `<div class="vtx-panel">`;

    if (order && state.meta.key !== "table_reservation") {
        html += `
            <div class="vtx-panel-card">
                <div style="font-weight:900; color:#0f172a; margin-bottom:6px;">🧾 Order Summary</div>
                <div style="white-space:pre-wrap; line-height:1.45;">${escapeHtml(order)}</div>
            </div>
        `;
    }

    if (state.meta.key === "delivery_order" && address) {
        html += `
            <div class="vtx-panel-card">
                <div style="font-weight:900; color:#0f172a; margin-bottom:6px;">📍 Delivery Card</div>
                <div>${escapeHtml(address)}</div>
                ${source.lat && source.lng ? `<button onclick="window.viewSharedLocation(${Number(source.lat)}, ${Number(source.lng)})" style="margin-top:8px; border:none; background:#dcfce7; color:#166534; padding:7px 10px; border-radius:9px; font-weight:800; cursor:pointer;">View Map</button>` : ""}
            </div>
        `;
    }

    const paymentRelevantTypes = ["pickup_order", "advance_order", "delivery_order"];
    const hasRealPaymentInfo = paymentRelevantTypes.includes(state.meta.key) && (pay || amount || source.paymentReference || state.paymentConfirmed || source.paymentStatus);

    if (hasRealPaymentInfo) {
        html += `
            <div class="vtx-panel-card">
                <div style="font-weight:900; color:#0f172a; margin-bottom:6px;">💳 Payment Summary</div>
                ${pay ? `<div><b>Method:</b> ${escapeHtml(pay)}</div>` : ""}
                ${amount ? `<div><b>Amount:</b> ₱${escapeHtml(amount)}</div>` : ""}
                ${source.paymentReference ? `<div><b>Reference:</b> ${escapeHtml(source.paymentReference)}</div>` : ""}
                <div style="margin-top:5px;">${state.paymentConfirmed ? makeBadge("payment_confirmed") : makeBadge(source.paymentStatus || "pending_confirmation")}</div>
            </div>
        `;
    }

    html += `</div>`;
    return html === `<div class="vtx-panel"></div>` ? "" : html;
}

function buildVisibleTransactionSteps(state) {
    const meta = state.meta;
    const steps = [];

    steps.push(renderTimelineStep(true, false, "📅", "Request Sent", `${meta.shortLabel} created`, meta.color));

    if (state.rejected) {
        steps.push(renderTimelineStep(true, false, "✕", "Rejected", "Rejected by business", "#ef4444"));
        return steps.join("");
    }

    if (!state.accepted) {
        steps.push(renderTimelineStep(false, true, "○", "Waiting for Business", "Waiting for business acceptance", meta.color));
        return steps.join("");
    }

    steps.push(renderTimelineStep(true, false, "✓", "Accepted", "Accepted by business", meta.color));

    if (meta.key === "delivery_order") {
        if (!state.detailsSubmitted) {
            steps.push(renderTimelineStep(false, true, "📍", "Delivery Details", "Customer address, landmark, location, and payment details", meta.color));
            return steps.join("");
        }

        steps.push(renderTimelineStep(true, false, "📍", "Delivery Details", "Customer submitted delivery information", meta.color));

        if (state.onlinePayment && !state.paymentConfirmed) {
            steps.push(renderTimelineStep(false, true, "💳", "Payment Verification", "Waiting for business to confirm payment/reference", meta.color));
            return steps.join("");
        }

        if (state.onlinePayment) steps.push(renderTimelineStep(true, false, "💳", "Payment Verified", "Business verified the received payment", meta.color));
        else steps.push(renderTimelineStep(true, false, "💵", "Cash / COD", "Pay the business at pickup or delivery", meta.color));

        if (!state.preparing && !state.outForDelivery && !state.delivered && !state.received) {
            steps.push(renderTimelineStep(false, true, "🍳", "Preparing", "Waiting for business to prepare the order", meta.color));
            return steps.join("");
        }

        if (state.preparing) {
            steps.push(renderTimelineStep(false, true, "🍳", "Preparing", "Business is preparing the order", meta.color));
            return steps.join("");
        }

        steps.push(renderTimelineStep(true, false, "🍳", "Preparing", "Order preparation started", meta.color));

        if (state.outForDelivery) {
            steps.push(renderTimelineStep(false, true, "🛵", "Out for Delivery", "Order is on the way", meta.color));
            return steps.join("");
        }

        if (state.delivered || state.received) {
            steps.push(renderTimelineStep(true, false, "📦", "Delivered", "Business marked the order as delivered", meta.color));
        }

        if (state.delivered && !state.received) {
            steps.push(renderTimelineStep(false, true, "✅", "Customer Confirmation", "Waiting for customer to confirm received", meta.color));
            return steps.join("");
        }
    } else if (meta.key === "pickup_order") {
        if (state.onlinePayment && !state.paymentConfirmed) {
            steps.push(renderTimelineStep(false, true, "💳", "Payment / Order Check", "Waiting for business confirmation", meta.color));
            return steps.join("");
        }

        if (state.paymentConfirmed) {
            steps.push(renderTimelineStep(true, false, "💳", "Payment / Order Confirmed", "Business confirmed the order/payment details", meta.color));
        }

        if (!state.delivered && !state.received) {
            steps.push(renderTimelineStep(false, true, "🛍️", "Ready for Pickup", meta.fulfillLabel, meta.color));
            return steps.join("");
        }

        steps.push(renderTimelineStep(true, false, "🛍️", "Picked Up / Completed", "Customer pickup completed", meta.color));
    } else if (meta.key === "advance_order") {
        if (state.onlinePayment && !state.paymentConfirmed) {
            steps.push(renderTimelineStep(false, true, "💳", "Payment Required", "Waiting for business to verify payment/reference", meta.color));
            return steps.join("");
        }

        if (state.paymentConfirmed) {
            steps.push(renderTimelineStep(true, false, "💳", "Payment Verified", "Business confirmed payment", meta.color));
        }

        if (!state.delivered && !state.received) {
            steps.push(renderTimelineStep(false, true, "📅", "Scheduled / Preparing", meta.fulfillLabel, meta.color));
            return steps.join("");
        }

        steps.push(renderTimelineStep(true, false, "📦", "Completed", "Advance order completed", meta.color));
    } else {
        if (!state.delivered && !state.received) {
            const activeTitle = meta.key === "table_reservation" ? "Reservation Confirmed" : meta.key === "food_reservation" ? "Food Reserved" : "In Progress";
            steps.push(renderTimelineStep(false, true, "○", activeTitle, meta.fulfillLabel, meta.color));
            return steps.join("");
        }

        steps.push(renderTimelineStep(true, false, "📦", "Completed", meta.fulfillLabel, meta.color));
    }

    if (state.received && !state.feedbackDone) {
        steps.push(renderTimelineStep(false, true, "⭐", "Feedback", "Waiting for customer rating and review", meta.color));
        return steps.join("");
    }

    if (state.feedbackDone) {
        steps.push(renderTimelineStep(true, false, "⭐", "Feedback Done", "Customer rating and review submitted", meta.color));
    }

    return steps.join("");
}

function getTransactionCurrentLabel(state) {
    if (state.rejected) return "Rejected";
    if (state.feedbackDone) return "Feedback Done";
    if (state.received) return "Completed";
    if (state.delivered) return "Delivered";
    if (state.outForDelivery) return "Out for Delivery";
    if (state.preparing) return "Preparing";
    if (state.paymentConfirmed) return "Payment Verified";
    if (state.detailsSubmitted) return state.meta.key === "delivery_order" ? "Details Submitted" : "Order Details Submitted";
    if (state.accepted) return "Accepted";
    return "Pending";
}

function renderPaymentFlowCard(order, isOwner) {
    const flow = window.PaymentPolicy.flow(order);
    const status = order.bookingStatus || order.status || "pending";
    let title = "Confirm payment details in chat";
    let copy = "Agree on the final amount, delivery fee and payment method with the business before paying.";
    if (flow.closed) { title = "Payment flow closed"; copy = "If you already paid, contact the business to arrange any applicable refund."; }
    else if (status === "pending") { title = "Wait for acceptance"; copy = "The business needs to accept your request and confirm the final total before you pay."; }
    else if (order.paymentReviewDecision === "declined" && status === "accepted") { title = "Payment details declined · Correction needed"; copy = "Your order is still accepted. Check the business note below and resubmit corrected details. Do not pay again unless you have agreed it is necessary."; }
    else if (flow.verified) { title = "Payment accepted by business"; copy = "The business manually checked your payment. Preparation and fulfillment are tracked separately."; }
    else if (flow.reviewing) { title = isOwner ? "Check payment before confirming" : "Payment details · Under review"; copy = isOwner ? "Match the amount and reference against money received in your account. A screenshot alone is not confirmation." : "The business will verify the payment against its account. Do not pay again while it is under review."; }
    else if (flow.online && ["preparing", "ready", "out_for_delivery", "delivered", "fulfilled", "received"].includes(status)) { title = "Check the recorded payment"; copy = "Confirm the payment status with the business. Do not make a second payment unless you have agreed it is needed."; }
    else if (flow.online) { title = "Pay directly to the business"; copy = "Confirm the total and recipient account in chat, pay using the agreed method, then upload your receipt. Vicinify does not collect the payment."; }
    else if (order.paymentMethod) { title = "Cash / pay on pickup or delivery"; copy = "Pay the agreed amount directly to the business at pickup or delivery. No online payment proof is needed."; }
    return `<section class="payment-flow-card"><span class="payment-flow-eyebrow">PAYMENT · ${order.paymentType ? escapeHtml(order.paymentType) + " · " : ""}${escapeHtml(order.paymentMethod || "Not yet agreed")}</span><h4>${title}</h4><p>${copy}</p>
        ${!isOwner && flow.awaitingProof ? `<button type="button" class="payment-proof-upload" onclick="window.uploadPaymentProof('${order.bookingId}', '${order.id}')"><i data-lucide="receipt"></i> Add payment reference / receipt</button>` : ""}
        ${order.paymentReviewDecision === "declined" && order.paymentReviewNote ? `<p class="payment-review-reason"><strong>Business note:</strong> ${escapeHtml(order.paymentReviewNote)}</p>` : ""}
        ${order.paymentReference ? `<dl class="payment-reference-summary"><div><dt>Reference</dt><dd>${escapeHtml(order.paymentReference)}</dd></div><div><dt>Amount submitted</dt><dd>₱${escapeHtml(order.paymentAmount || "—")}</dd></div></dl>` : ""}
        ${order.paymentType === "Downpayment" && !flow.closed ? `<p class="payment-balance-note">This is a downpayment. Agree on any remaining balance with the business; it is not marked paid in full.</p>` : ""}
        ${flow.online && !flow.closed ? `<div class="payment-flow-steps"><span>1. Pay business</span><span>2. Submit proof</span><span>3. Business verifies</span></div>` : ""}
    </section>`;
}
function renderBookingNextAction(order) {
    const status = order.bookingStatus || order.status || "pending";
    const delivery = ["delivery_order", "delivery"].includes(order.requestType);
    const next = window.PaymentPolicy.flow(order).canPrepare ? ["preparing", "Start preparing"]
        : status === "preparing" ? (delivery ? ["out_for_delivery", "Mark out for delivery"] : ["ready", "Mark ready"])
        : status === "ready" ? ["fulfilled", "Mark fulfilled"]
        : status === "out_for_delivery" ? ["delivered", "Mark delivered"] : null;
    return next ? `<button type="button" class="payment-stage-action" onclick="window.updateBookingFromChat('${order.bookingId}', '${order.id}', '${next[0]}')">${next[1]}</button>` : "";
}

function renderInlineTransactionProgress(docs) {
    const state = getTransactionState(docs);
    if (!state.booking && !state.req && !state.resp && !state.completion) return "";

    injectPremiumChatStyles();

    const meta = state.meta;
    const pct = progressPercent(state);
    const currentLabel = getTransactionCurrentLabel(state);
    const extraSummary = state.accepted || state.detailsSubmitted || state.paymentConfirmed || state.delivered || state.received || state.feedbackDone
        ? renderOrderSummaryMini(state)
        : "";

    return `
        <div class="vtx-command vtx-inline-progress" style="position:relative !important; top:auto !important; margin:12px 0 0 !important; box-shadow:none !important; border:1px solid #e2e8f0 !important;">
            <div class="vtx-command-head">
                <div class="vtx-title">
                    <div class="vtx-icon" style="background:${meta.color};">${meta.icon}</div>
                    <div style="min-width:0;">
                        <div class="vtx-name">${escapeHtml(meta.shortLabel)}</div>
                        <div class="vtx-sub">Transaction progress</div>
                    </div>
                </div>
                <div class="vtx-pill" style="background:${state.rejected ? "#fee2e2" : meta.light}; color:${state.rejected ? "#991b1b" : meta.dark};">${escapeHtml(currentLabel)}</div>
            </div>

            <div class="vtx-progress"><div class="vtx-progress-fill" style="width:${pct}%; background:${state.rejected ? "#ef4444" : meta.color};"></div></div>

            <div class="vtx-grid">
                <div class="vtx-mini"><div class="vtx-mini-label">Current</div><div class="vtx-mini-value">${escapeHtml(currentLabel)}</div></div>
                <div class="vtx-mini"><div class="vtx-mini-label">Type</div><div class="vtx-mini-value">${escapeHtml(meta.shortLabel)}</div></div>
                <div class="vtx-mini"><div class="vtx-mini-label">Progress</div><div class="vtx-mini-value">${pct}%</div></div>
            </div>

            <div class="vtx-timeline">${buildVisibleTransactionSteps(state)}</div>
            ${extraSummary}
        </div>
    `;
}

function renderSystemUpdate(d, dateStr) {
    return `
        <div class="vtx-system">
            <span>${escapeHtml(d.icon || "•")} ${escapeHtml(d.text || "Transaction updated")} • ${escapeHtml(dateStr)}</span>
        </div>
    `;
}

async function addSystemUpdate(placeId, placeName, userId, userName, text, stage, icon, transactionId = null, bookingId = null) {
    try {
        const payload = {
            placeId,
            placeName,
            userId,
            userName: userName || "Customer",
            type: "system_update",
            stage: stage || "info",
            icon: icon || "✅",
            text,
            senderUid: window.auth.currentUser.uid,
            senderRole: window.auth.currentUser.uid === userId ? "customer" : "owner",
            senderName: window.auth.currentUser.uid === userId ? userName : placeName,
            createdBy: window.auth.currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            reply: null
        };

        if (transactionId) payload.transactionId = transactionId;
        if (bookingId) payload.bookingId = bookingId;

        await window.db.collection("messages").add(payload);
    } catch (e) {
        console.warn("System update skipped:", e);
    }
}

window.openChatModal = async function(placeId, placeName, customerUid = null) {
const user = window.auth?.currentUser;

if (!user) {
    window.alert("Please log in first to access the chat.");
    showPage("page-login");
    return;
}

if (!user.emailVerified) {
    const ans = await window.vConfirm(
        "Account Not Verified",
        "You must verify your email address to use the chat feature. Would you like us to resend the verification link?",
        "Resend Link",
        false
    );

    if (ans) window.resendVerificationEmail();
    return;
}

// Open FIRST with the name the caller already passed; the place fetch
// (real name + self-chat check) and the customer-name fetch now resolve
// in the background and update the header in place. They used to block
// the modal + listener behind two sequential round trips, which made
// the conversation (and its booking cards) feel hung on open.
const targetUid = customerUid || user.uid;
const isOwnerView = !!customerUid;

document.getElementById("chatPlaceId").value = placeId;
document.getElementById("chatPlaceName").value = placeName || "Establishment";
document.getElementById("chatCustomerUid").value = targetUid;

const provisionalTitle = isOwnerView ? "Customer" : (placeName || "Establishment");
document.getElementById("chatModalTitle").innerText = provisionalTitle;
document.getElementById("chatModalAvatar").innerText = getInitial(provisionalTitle);

const chatInput = document.getElementById("chatMessageInput");
if (chatInput) chatInput.value = "";
setupChatSuggestions(isOwnerView);
setupChatComposer();

const reqBtn = document.getElementById("chatRequirementBtn");
if (reqBtn) {
    reqBtn.style.display = isOwnerView ? "inline-flex" : "none";
}

injectPremiumChatStyles();
updateChatQuickActions(isOwnerView, null);
document.getElementById("chatModal").classList.remove("hidden");
document.getElementById("chatModal").setAttribute("aria-hidden", "false");
if (!window.__chatScrollLocked) { window.__chatScrollLocked = true; window.lockBodyScroll?.(true); }
listenToChatRoom(placeId, targetUid);

// Background header resolution. Guarded by the hidden fields so a
// late result can never overwrite a different chat opened meanwhile.
(async () => {
    const stillThisChat = () =>
        document.getElementById("chatPlaceId")?.value === placeId &&
        document.getElementById("chatCustomerUid")?.value === targetUid;
    try {
        if (!isOwnerView) {
            const placeDoc = await window.db.collection("places").doc(placeId).get();
            if (!placeDoc.exists || !stillThisChat()) return;
            const placeData = placeDoc.data();
            if (placeData.owner_uid === user.uid) {
                window.closeChatModal();
                window.alert("This is your own establishment. You cannot message yourself here.");
                return;
            }
            if (placeData.name) {
                document.getElementById("chatPlaceName").value = placeData.name;
                document.getElementById("chatModalTitle").innerText = placeData.name;
                document.getElementById("chatModalAvatar").innerText = getInitial(placeData.name);
            }
        } else {
            const name = await getCustomerDisplayName(customerUid);
            if (!stillThisChat()) return;
            document.getElementById("chatModalTitle").innerText = name;
            document.getElementById("chatModalAvatar").innerText = getInitial(name);
        }
    } catch (e) {
        console.error("Chat header resolution failed:", e);
    }
})();

};

window.closeChatModal = function() {
document.getElementById("chatModal").classList.add("hidden");
document.getElementById("chatModal").setAttribute("aria-hidden", "true");
if (window.__chatScrollLocked) { window.__chatScrollLocked = false; window.lockBodyScroll?.(false); }

if (currentChatUnsub) {
    currentChatUnsub();
    currentChatUnsub = null;
}

};

window.sendChatMessage = async function() {
const user = window.auth?.currentUser;
if (!user) return;

const placeId = document.getElementById("chatPlaceId").value;
const placeName = document.getElementById("chatPlaceName").value;
const customerUid = document.getElementById("chatCustomerUid").value;
const input = document.getElementById("chatMessageInput");
const text = input.value.trim();

if (!text) return;

// Clear right away (chat-style); the text is restored below if the send fails.
input.value = "";
input.dispatchEvent(new Event("input", { bubbles: true }));

const isOwner = user.uid !== customerUid;
const customerName = isOwner
    ? await getCustomerDisplayName(customerUid)
    : (AppState.userProfile?.fullName || user.displayName || "Customer");

const senderName = isOwner
    ? placeName
    : (AppState.userProfile?.fullName || user.displayName || "Customer");

try {
    await window.db.collection("messages").add({
        placeId,
        placeName,
        userId: customerUid,
        userName: customerName,
        type: "text",
        text,
        status: "sent",
        deliveredAt: null,
        seenAt: null,
        senderUid: user.uid,
        senderRole: isOwner ? "owner" : "customer",
        senderName,
        createdBy: user.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        reply: null
    });
} catch (error) {
    console.error("sendChatMessage failed:", error);
    input.value = text;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    if (window.vicinifyToast) window.vicinifyToast("Message not sent: " + error.message, "error");
    else window.alert("Error sending message: " + error.message);
}

};

document.addEventListener("DOMContentLoaded", setupChatComposer);

// Receipt images are optional; reference and amount are always reviewed manually.
async function compressPaymentReceipt(file) {
    if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) throw new Error("Choose an image under 8 MB.");
    return new Promise((resolve, reject) => {
        const img = new Image(), objectUrl = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            const scale = Math.min(1, 900 / Math.max(img.width, img.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(img.width * scale));
            canvas.height = Math.max(1, Math.round(img.height * scale));
            canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
            const data = canvas.toDataURL("image/jpeg", .72);
            if (data.length > 900 * 1024) reject(new Error("Receipt is too large. Try a smaller screenshot."));
            else resolve(data);
        };
        img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Could not read the receipt image.")); };
        img.src = objectUrl;
    });
}
window.uploadPaymentProof = async function(bookingId, messageId) {
    const user = window.auth?.currentUser;
    if (!user) return window.showToast?.("Please log in first.", "error");
    const existing = document.getElementById("paymentProofModal");
    if (existing) return existing.querySelector("input")?.focus();
    let order = currentChatDocsCache.find(d => d.bookingId === bookingId && d.type === "booking_card");
    if (!order) {
        try {
            const doc = await window.db.collection("bookings").doc(bookingId).get();
            if (doc.exists) order = doc.data();
        } catch (error) { return window.showToast?.("Could not load payment details. Try again.", "error"); }
    }
    if (!order || !window.PaymentPolicy.flow(order).awaitingProof && !window.PaymentPolicy.flow(order).reviewing)
        return window.showToast?.("This request is not awaiting online payment details.", "info");
    if (document.getElementById("paymentProofModal")) return;
    const modal = document.createElement("div");
    modal.id = "paymentProofModal";
    modal.className = "req-modal manual-payment-modal";
    modal.innerHTML = `<div class="modalBackdrop req-backdrop"></div>
        <form class="req-sheet" role="dialog" aria-modal="true" aria-labelledby="manualPaymentTitle">
            <header class="req-head"><span class="req-head-icon"><i data-lucide="receipt"></i></span><div class="req-head-text"><h3 id="manualPaymentTitle">Payment details</h3><p>Enter your reference number. A receipt image is optional.</p></div><button type="button" class="req-close" aria-label="Close payment details"><i data-lucide="x"></i></button></header>
            <div class="req-body">
                <div class="req-note"><span>Paid directly to <strong>${escapeHtml(order.placeName || "the business")}</strong> via ${escapeHtml(order.paymentMethod)}. Submit only after you have made the payment.</span></div>
                <div class="manual-payment-fields">
                    <label class="req-field"><span>Reference / transaction number *</span><input class="req-input" name="reference" required minlength="3" maxlength="80" autocomplete="off" placeholder="Enter the number from your payment receipt"></label>
                    <label class="req-field"><span>Amount paid (₱) *</span><input class="req-input" name="amount" required inputmode="decimal" autocomplete="off" placeholder="e.g. 588.00" value="${escapeHtml(order.paymentAmount || "")}"></label>
                    <label class="req-field"><span>Receipt image <em>optional</em></span><input class="req-input payment-receipt-file" name="receipt" type="file" accept="image/*"><small class="manual-payment-help">JPEG, PNG or WebP · up to 8 MB</small></label>
                    <div class="manual-receipt-preview" hidden><img alt="Your selected payment receipt"><button type="button" class="remove-payment-receipt">Remove image</button></div>
                </div>
                <p class="manual-payment-help">Submitting a reference number does not mark your request paid. The business checks the amount and reference against funds actually received.</p>
                <p class="manual-payment-error" role="alert" hidden></p>
            </div>
            <footer class="req-footer"><button type="button" class="req-btn ghost payment-details-cancel">Cancel</button><button type="submit" class="req-btn primary">Submit for review</button></footer>
        </form>`;
    const previousFocus = document.activeElement;
    let busy = false, previewUrl = null;
    const form = modal.querySelector("form"), error = modal.querySelector(".manual-payment-error");
    const close = () => {
        if (busy) return;
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        document.removeEventListener("keydown", onKey); modal.remove();
        const chat = document.getElementById("chatModal");
        if (!chat || chat.classList.contains("hidden")) window.lockBodyScroll?.(false);
        previousFocus?.focus?.();
    };
    const onKey = event => {
        if (event.key === "Escape") close();
        if (event.key === "Tab") {
            const items = [...form.querySelectorAll("button,input")].filter(el => !el.disabled && el.getClientRects().length);
            if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1)?.focus(); }
            else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0]?.focus(); }
        }
    };
    modal.querySelector(".req-close").onclick = close;
    modal.querySelector(".payment-details-cancel").onclick = close;
    modal.querySelector(".modalBackdrop").onclick = close;
    const receipt = form.elements.receipt, preview = modal.querySelector(".manual-receipt-preview");
    receipt.onchange = () => {
        if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null; }
        preview.hidden = true; error.hidden = true;
        const file = receipt.files[0];
        if (!file) return;
        if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) {
            receipt.value = ""; error.textContent = "Choose an image under 8 MB."; error.hidden = false; return;
        }
        previewUrl = URL.createObjectURL(file); preview.querySelector("img").src = previewUrl; preview.hidden = false;
    };
    modal.querySelector(".remove-payment-receipt").onclick = () => { receipt.value = ""; receipt.onchange(); };
    form.onsubmit = async event => {
        event.preventDefault();
        if (busy || !form.reportValidity()) return;
        error.hidden = true;
        let payment;
        try { payment = window.PaymentPolicy.details(form.elements.reference.value, form.elements.amount.value); }
        catch (err) { error.textContent = err.message; error.hidden = false; return; }
        busy = true;
        const submit = form.querySelector('[type="submit"]'); submit.disabled = true; submit.textContent = "Submitting…";
        try {
            const payload = { bookingId, reference: payment.paymentReference, amount: payment.paymentAmount };
            if (receipt.files[0]) payload.image = await compressPaymentReceipt(receipt.files[0]);
            await window.ViciData.command("proof", payload);
            busy = false; close();
            window.showToast?.("Payment details submitted. Waiting for business verification.", "success");
        } catch (err) {
            error.textContent = "Could not submit payment details. " + err.message; error.hidden = false;
        } finally { busy = false; submit.disabled = false; submit.textContent = "Submit for review"; }
    };
    document.body.appendChild(modal); window.lockBodyScroll?.(true); document.addEventListener("keydown", onKey);
    window.debouncedIcons?.(); form.elements.reference.focus();
};

function requestPaymentCorrectionNote() {
    if (document.getElementById("paymentCorrectionModal")) return Promise.resolve(null);
    return new Promise(resolve => {
        const modal = document.createElement("div");
        modal.id = "paymentCorrectionModal"; modal.className = "req-modal";
        modal.innerHTML = `<div class="modalBackdrop req-backdrop"></div><form class="req-sheet" role="dialog" aria-modal="true" aria-labelledby="paymentCorrectionTitle">
            <header class="req-head"><span class="req-head-icon"><i data-lucide="receipt-text"></i></span><div class="req-head-text"><h3 id="paymentCorrectionTitle">Decline payment details?</h3><p>The order stays accepted. The customer can correct and resubmit their payment details.</p></div><button type="button" class="req-close" aria-label="Close payment review"><i data-lucide="x"></i></button></header>
            <div class="req-body"><label class="req-field"><span>Reason for declining *</span><textarea class="req-input req-textarea" name="reason" required minlength="5" maxlength="500" placeholder="For example: reference not found, amount does not match, or receipt is unclear."></textarea></label><p class="manual-payment-help">Explain what needs correcting. Do not ask the customer to pay again if you have already received the payment.</p></div>
            <footer class="req-footer"><button type="button" class="req-btn ghost">Keep reviewing</button><button type="submit" class="req-btn payment-review-decline">Decline payment</button></footer></form>`;
        const previousFocus = document.activeElement;
        const finish = value => {
            document.removeEventListener("keydown", onKey); modal.remove();
            const chat = document.getElementById("chatModal");
            if (!chat || chat.classList.contains("hidden")) window.lockBodyScroll?.(false);
            previousFocus?.focus?.(); resolve(value);
        };
        const form = modal.querySelector("form");
        const onKey = event => {
            if (event.key === "Escape") finish(null);
            if (event.key === "Tab") {
                const inputs = [...form.querySelectorAll("button,textarea")];
                if (event.shiftKey && document.activeElement === inputs[0]) { event.preventDefault(); inputs.at(-1).focus(); }
                else if (!event.shiftKey && document.activeElement === inputs.at(-1)) { event.preventDefault(); inputs[0].focus(); }
            }
        };
        modal.querySelector(".req-close").onclick = () => finish(null);
        modal.querySelector(".ghost").onclick = () => finish(null);
        modal.querySelector(".modalBackdrop").onclick = () => finish(null);
        form.onsubmit = event => { event.preventDefault(); if (!form.reportValidity()) return; const note = form.elements.reason.value.trim(); if (note.length < 5) { form.elements.reason.setCustomValidity("Explain the issue in at least 5 characters."); form.elements.reason.reportValidity(); return; } finish(note); };
        form.elements.reason.oninput = () => form.elements.reason.setCustomValidity("");
        document.body.appendChild(modal); window.lockBodyScroll?.(true); document.addEventListener("keydown", onKey); window.debouncedIcons?.(); form.elements.reason.focus();
    });
}
const paymentReviewsInFlight = new Set();
window.reviewPaymentProof = async function(bookingId, messageId, action) {
    if (!window.auth?.currentUser) return window.showToast?.("Please log in first.", "error");
    if (!["confirm", "resubmit"].includes(action) || paymentReviewsInFlight.has(bookingId)) return;
    paymentReviewsInFlight.add(bookingId);
    try {
        let note = null;
        if (action === "confirm") {
            if (!await window.vConfirm("Accept this payment?", "Check the actual money received, amount and reference in your account. Accepting confirms the payment only; preparation is a separate step.", "Accept payment")) return;
        } else {
            note = await requestPaymentCorrectionNote();
            if (!note) return;
        }
        const patch = { status: action === "confirm" ? "payment_confirmed" : "accepted" };
        if (note) patch.paymentReviewNote = note;
        await window.ViciData.command("booking", { bookingId, patch });
        window.showToast?.(action === "confirm" ? "Payment accepted. You can now start preparation." : "Payment declined. The customer can see your reason and resubmit.", "success");
    } catch (error) { window.showToast?.("Payment review was not saved. " + error.message, "error"); }
    finally { paymentReviewsInFlight.delete(bookingId); }
};

window.updateBookingFromChat = async function(bookingId, messageId, status) {
    const user = window.auth?.currentUser;

    try {
        const msgRef = window.db.collection("messages").doc(messageId);
        // The open thread already rendered this card — reuse its data
        // (requestType/payment/address fields are set at send time).
        const cachedMsg = currentChatDocsCache.find(d => d.id === messageId);
        let msgData;
        if (cachedMsg) {
            msgData = cachedMsg;
        } else {
            const msgDoc = await msgRef.get();
            msgData = msgDoc.exists ? msgDoc.data() : {};
        }
        const requestType = String(msgData.requestType || "booking").toLowerCase();
        const transactionId = msgData.transactionId || bookingId || messageId;

        await window.ViciData.command("booking", { bookingId: bookingId, patch: {
            status,
            transactionId,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        } });


        // 🛵 DELIVERY SMART FLOW:
        // Kapag Delivery Order ang in-accept ng business, automatic lalabas yung delivery-ready card.
        // Customer can submit/confirm address, location, payment, and order details without owner manually clicking Request Requirements.
        if (status === "accepted" && requestType === "delivery_order") {
            const existingDeliveryReq = await window.db.collection("messages").where("placeId", "==", msgData.placeId)
                .where("type", "==", "requirement_request")
                .where("bookingId", "==", bookingId)
                .where("autoGeneratedDelivery", "==", true)
                .limit(1)
                .get();

            if (existingDeliveryReq.empty) {
                const preferredPayment = msgData.paymentMethod || "GCash";
                const paymentOptions = Array.from(new Set([
                    preferredPayment,
                    "GCash",
                    "Maya",
                    "Bank Transfer",
                    "Cash on Delivery if allowed"
                ].filter(Boolean)));

                await window.db.collection("messages").add({
                    placeId: msgData.placeId,
                    placeName: msgData.placeName,
                    userId: msgData.userId,
                    userName: msgData.userName || "Customer",
                    type: "requirement_request",
                    requestType: "delivery_order",
                    transactionId,
                    bookingId,
                    linkedBookingMessageId: messageId,
                    autoGeneratedDelivery: true,
                    requirements: {
                        address: true,
                        location: true,
                        payment: true,
                        orderDetails: true
                    },
                    prefillAddress: msgData.deliveryAddress || "",
                    prefillOrderItems: msgData.orderItems || "",
                    prefillPaymentMethod: preferredPayment,
                    amount: "",
                    acceptedPaymentMethods: paymentOptions,
                    notes: "Delivery accepted. Please submit your complete address, barangay, city, landmark/location notes, current location, payment method, and reference number if you paid online. Online payment is recommended to avoid fake orders.",
                    requirementStatus: "waiting_customer",
                    text: "Delivery order accepted. Customer can now submit delivery details.",
                    senderUid: user?.uid || "business",
                    senderRole: "owner",
                    senderName: msgData.placeName || "Business",
                    createdBy: user?.uid || "business",
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    reply: null
                });
            }
        }

        const systemText = status === "accepted"
            ? (requestType === "delivery_order" ? "Delivery request accepted. Delivery details are ready." : "Request accepted by business.")
            : status === "rejected"
                ? "Request rejected by business."
                : status === "fulfilled"
                    ? "Business marked this request as fulfilled."
                    : "Request status updated: " + status;

        await addSystemUpdate(msgData.placeId, msgData.placeName, msgData.userId, msgData.userName, systemText, status, status === "accepted" ? "✅" : status === "rejected" ? "❌" : "📦", transactionId, bookingId);

        if (status === "accepted" && requestType === "delivery_order") {
            window.alert("Delivery request accepted. Delivery details card is now ready for the customer.");
        } else {
            window.alert("Request " + status + " successfully.");
        }
    } catch (error) {
        window.alert("Error updating request: " + error.message);
    }

};

window.confirmReceivedFromChat = async function(bookingId, messageId, placeId) {
const user = window.auth?.currentUser;
if (!user) return;

const ans = await window.vConfirm(
    "Confirm Received",
    "Confirm that you already received or completed this transaction?",
    "Confirm Received",
    false
);

if (!ans) return;

try {
    const transactionId = bookingId || messageId;

    await window.ViciData.command("booking", { bookingId: bookingId, patch: {
        status: "received",
        customer_confirmed: true,
        customerConfirmedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    } });


    const existingFeedback = await window.db.collection("messages")
        .where("type", "==", "feedback_request")
        .where("bookingId", "==", bookingId)
        .where("userId", "==", user.uid)
        .limit(1)
        .get();

    if (existingFeedback.empty) {
        const placeName = await getPlaceDisplayName(placeId, "Establishment");

        await window.db.collection("messages").add({
            placeId,
            placeName,
            userId: user.uid,
            userName: AppState.userProfile?.fullName || user.displayName || "Customer",
            type: "feedback_request",
            transactionId,
            bookingId,
            feedbackStatus: "feedback_waiting",
            text: "Please rate and send feedback for this completed transaction.",
            senderUid: user.uid,
            senderRole: "customer",
            senderName: "Vicinify",
            createdBy: user.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            reply: null
        });
    }

    await addSystemUpdate(placeId, await getPlaceDisplayName(placeId, "Establishment"), user.uid, AppState.userProfile?.fullName || user.displayName || "Customer", "Customer confirmed the transaction as received/completed.", "received", "📦", transactionId, bookingId);

    window.alert("Transaction confirmed. Please leave a rating and feedback.");
} catch (error) {
    window.alert("Error confirming received: " + error.message);
}

};

window.openRequirementRequestModal = function() {
const user = window.auth?.currentUser;
if (!user) return window.alert("Please log in first.");

const placeId = document.getElementById("chatPlaceId").value;
const placeName = document.getElementById("chatPlaceName").value;
const customerUid = document.getElementById("chatCustomerUid").value;

if (!customerUid || user.uid === customerUid) {
    return window.alert("Only the business owner can request requirements from a customer.");
}

const modalId = "reqRequestModal_" + Date.now();
window.lockBodyScroll(true);

const html = `
    <div id="${modalId}" class="req-modal">
        <div class="modalBackdrop req-backdrop"></div>
        <div class="req-sheet" role="dialog" aria-modal="true" aria-label="Request Requirements">
            <div class="req-head">
                <div class="req-head-icon"><i data-lucide="clipboard-list"></i></div>
                <div class="req-head-text">
                    <h3>Request Requirements</h3>
                    <p>Choose what the customer needs to submit for this transaction.</p>
                </div>
                <button type="button" id="closeX_${modalId}" class="req-close" aria-label="Close"><i data-lucide="x"></i></button>
            </div>

            <div class="req-body">
            <div class="req-options">
                <label class="req-option">
                    <input id="reqAddress_${modalId}" type="checkbox" checked>
                    <span class="req-opt-icon orange"><i data-lucide="home"></i></span>
                    <span class="req-opt-text"><b>Delivery Address</b><small>House no., barangay, city &amp; landmark</small></span>
                    <span class="req-opt-check"><i data-lucide="check"></i></span>
                </label>
                <label class="req-option">
                    <input id="reqLocation_${modalId}" type="checkbox">
                    <span class="req-opt-icon green"><i data-lucide="map-pin"></i></span>
                    <span class="req-opt-text"><b>Current Location</b><small>Customer attaches their current location</small></span>
                    <span class="req-opt-check"><i data-lucide="check"></i></span>
                </label>
                <label class="req-option">
                    <input id="reqPayment_${modalId}" type="checkbox">
                    <span class="req-opt-icon blue"><i data-lucide="credit-card"></i></span>
                    <span class="req-opt-text"><b>Payment Details</b><small>Amount, mode of payment &amp; reference</small></span>
                    <span class="req-opt-check"><i data-lucide="check"></i></span>
                </label>
                <label class="req-option">
                    <input id="reqOrder_${modalId}" type="checkbox">
                    <span class="req-opt-icon purple"><i data-lucide="clipboard-pen"></i></span>
                    <span class="req-opt-text"><b>Order Details</b><small>Items, quantity &amp; special instructions</small></span>
                    <span class="req-opt-check"><i data-lucide="check"></i></span>
                </label>
            </div>

            <p id="reqHint_${modalId}" class="req-hint" hidden>Please select at least one requirement above.</p>

            <div class="req-fields">
                <label class="req-field"><span>Amount to pay <em>optional</em></span>
                    <div class="req-amount-wrap"><span>₱</span><input id="reqAmount_${modalId}" inputmode="decimal" aria-label="Amount to pay" placeholder="e.g. 588"></div>
                </label>
                <label class="req-field"><span>Accepted payment methods <em>optional</em></span>
                    <input id="reqMops_${modalId}" class="req-input" placeholder="e.g. GCash, Maya, Cash, Bank Transfer">
                </label>
                <label class="req-field"><span>Payment instructions / message <em>optional</em></span>
                    <textarea id="reqNotes_${modalId}" class="req-input req-textarea" placeholder="Confirm the total, delivery fee, payment recipient and account details. Never ask for a PIN or OTP."></textarea>
                </label>
            </div>

            </div>
            <div class="req-footer">
                <button type="button" id="cancel_${modalId}" class="req-btn ghost">Cancel</button>
                <button type="button" id="send_${modalId}" class="req-btn primary"><i data-lucide="send"></i> Send Request</button>
            </div>
        </div>
    </div>
`;

document.body.insertAdjacentHTML("beforeend", html);

const modal = document.getElementById(modalId);
const close = () => { window.lockBodyScroll(false); modal.remove(); };

document.getElementById(`cancel_${modalId}`).onclick = close;
const _closeX = document.getElementById(`closeX_${modalId}`); if (_closeX) _closeX.onclick = close;
modal.querySelector(".modalBackdrop").onclick = close;
window.debouncedIcons?.();

document.getElementById(`send_${modalId}`).onclick = async () => {
    const requirements = {
        address: document.getElementById(`reqAddress_${modalId}`).checked,
        location: document.getElementById(`reqLocation_${modalId}`).checked,
        payment: document.getElementById(`reqPayment_${modalId}`).checked,
        orderDetails: document.getElementById(`reqOrder_${modalId}`).checked
    };

    if (!requirements.address && !requirements.location && !requirements.payment && !requirements.orderDetails) {
        const hint = document.getElementById(`reqHint_${modalId}`); if (hint) { hint.hidden = false; hint.scrollIntoView({behavior:"smooth", block:"center"}); }
        return window.alert("Please select at least one requirement.");
    }

    const amount = document.getElementById(`reqAmount_${modalId}`).value.trim();
    if (amount && (!/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0)) {
        return window.alert("Enter a valid amount greater than zero, with up to two decimal places.");
    }
    const mops = document.getElementById(`reqMops_${modalId}`).value.trim();
    const notes = document.getElementById(`reqNotes_${modalId}`).value.trim();

    try {
        await window.db.collection("messages").add({
            placeId,
            placeName,
            userId: customerUid,
            userName: await getCustomerDisplayName(customerUid),
            type: "requirement_request",
            status: "sent",
            requirements,
            amount,
            acceptedPaymentMethods: splitPaymentMethods(mops),
            notes,
            requirementStatus: "waiting_customer",
            text: "Business requested transaction requirements.",
            senderUid: user.uid,
            senderRole: "owner",
            senderName: placeName,
            createdBy: user.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            reply: null
        });

        close();
        window.alert("Requirement request sent.");
    } catch (error) {
        window.alert("Error sending request: " + error.message);
    }
};

};

window.openRequirementResponseModal = async function(requestMessageId) {
const user = window.auth?.currentUser;
if (!user) return window.alert("Please log in first.");

try {
    const requestDoc = await window.db.collection("messages").doc(requestMessageId).get();
    if (!requestDoc.exists) return window.alert("Requirement request no longer exists.");

    const req = requestDoc.data();
    const requirements = req.requirements || {};
    const modalId = "reqResponseModal_" + Date.now();
window.lockBodyScroll(true);

    const paymentMethods = req.acceptedPaymentMethods && req.acceptedPaymentMethods.length
        ? req.acceptedPaymentMethods
        : ["GCash", "Maya", "Cash", "Cash on Delivery", "Bank Transfer", "Pay upon Pickup", "Other"];

    const prefillPaymentOption = req.prefillPaymentMethod
        ? `<option value="${escapeHtml(req.prefillPaymentMethod)}" selected>${escapeHtml(req.prefillPaymentMethod)} (from request)</option>`
        : "";

    const methodOptions = prefillPaymentOption + paymentMethods
        .filter(m => String(m) !== String(req.prefillPaymentMethod || ""))
        .map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`)
        .join("");

    const html = `
        <div id="${modalId}" class="req-modal">
            <div class="modalBackdrop req-backdrop"></div>
            <div class="req-sheet req-sheet-scroll" role="dialog" aria-modal="true" aria-label="Submit Requirements">
                <div class="req-head">
                    <div class="req-head-icon green"><i data-lucide="file-check-2"></i></div>
                    <div class="req-head-text">
                        <h3>Submit Requirements</h3>
                        <p>Fill out the information the business requested.</p>
                    </div>
                    <button type="button" id="closeX_${modalId}" class="req-close" aria-label="Close"><i data-lucide="x"></i></button>
                </div>

                <div class="req-body">
                ${req.notes ? `
                    <div class="req-note"><i data-lucide="message-square-text"></i><span>${escapeHtml(req.notes)}</span></div>
                ` : ""}

                ${requirements.address ? `
                    <div class="req-section">
                        <div class="req-section-head"><span class="req-opt-icon orange"><i data-lucide="home"></i></span><b>Delivery Address</b></div>
                        <label class="req-field"><span>House number, street or subdivision *</span><input id="resHouse_${modalId}" value="${escapeHtml(req.prefillAddress || "")}" placeholder="House no. / Street / Subdivision" class="req-input" style="width:100%; box-sizing:border-box; padding:10px; border:1px solid #cbd5e1; border-radius:10px; margin-top:10px;"></label>
                        <label class="req-field"><span>Barangay *</span><input id="resBarangay_${modalId}" placeholder="Barangay" class="req-input" style="width:100%; box-sizing:border-box; padding:10px; border:1px solid #cbd5e1; border-radius:10px; margin-top:8px;"></label>
                        <label class="req-field"><span>City / municipality *</span><input id="resCity_${modalId}" placeholder="City / Municipality" class="req-input" style="width:100%; box-sizing:border-box; padding:10px; border:1px solid #cbd5e1; border-radius:10px; margin-top:8px;"></label>
                        <label class="req-field"><span>Landmark or location notes *</span><input id="resLandmark_${modalId}" placeholder="Landmark / Location notes e.g., tabi ng red na bahay, malapit sa kanto, blue gate" class="req-input" style="width:100%; box-sizing:border-box; padding:10px; border:1px solid #cbd5e1; border-radius:10px; margin-top:8px;"></label>
                    </div>
                ` : ""}

                ${requirements.location ? `
                    <div class="req-section">
                        <div class="req-section-head"><span class="req-opt-icon green"><i data-lucide="map-pin"></i></span><b>Current Location</b></div>
                        <p id="locStatus_${modalId}" style="font-size:12px; color:#64748b;">Location not attached yet.</p>
                        <input id="resLat_${modalId}" type="hidden">
                        <input id="resLng_${modalId}" type="hidden">
                        <button type="button" id="getLoc_${modalId}" class="req-loc-btn"><i data-lucide="locate-fixed"></i> Attach My Current Location</button>
                    </div>
                ` : ""}

                ${requirements.payment ? `
                    <div class="req-section">
                        <div class="req-section-head"><span class="req-opt-icon blue"><i data-lucide="credit-card"></i></span><b>Payment Details</b></div>

                        ${req.amount ? `<div style="margin-top:8px; font-size:13px;"><b>Amount Requested:</b> ₱${escapeHtml(req.amount)}</div>` : ""}

                        <label class="req-field"><span>Payment method</span><select id="resPaymentMethod_${modalId}" class="req-input" style="width:100%; box-sizing:border-box; padding:10px; border:1px solid #cbd5e1; border-radius:10px; margin-top:10px;">
                            ${methodOptions}
                        </select></label>

                        <label class="req-field" id="customMopField_${modalId}" hidden><span>Other payment method</span><input id="resCustomMop_${modalId}" placeholder="If Other, type mode of payment" class="req-input" style="width:100%; box-sizing:border-box; padding:10px; border:1px solid #cbd5e1; border-radius:10px; margin-top:8px;"></label>
                        <label class="req-field"><span>Amount paid</span><input id="resAmount_${modalId}" inputmode="decimal" placeholder="Amount paid" value="${escapeHtml(req.amount || "")}" class="req-input" style="width:100%; box-sizing:border-box; padding:10px; border:1px solid #cbd5e1; border-radius:10px; margin-top:8px;"></label>
                        <label class="req-field"><span>Reference number / payment notes</span><input id="resRef_${modalId}" placeholder="Reference no. / Notes, optional for Cash/COD" class="req-input" style="width:100%; box-sizing:border-box; padding:10px; border:1px solid #cbd5e1; border-radius:10px; margin-top:8px;"></label>
                    </div>
                ` : ""}

                ${requirements.orderDetails ? `
                    <div class="req-section">
                        <div class="req-section-head"><span class="req-opt-icon purple"><i data-lucide="clipboard-pen"></i></span><b>Additional Details</b></div>
                        <label class="req-field"><span>Items, quantity and instructions *</span><textarea id="resOrder_${modalId}" placeholder="Example: items, quantity, special instructions" class="req-input req-textarea" style="width:100%; box-sizing:border-box; min-height:80px; padding:10px; border:1px solid #cbd5e1; border-radius:10px; resize:none; margin-top:10px;">${escapeHtml(req.prefillOrderItems || "")}</textarea></label>
                    </div>
                ` : ""}

                </div>
                <div class="req-footer">
                    <button type="button" id="cancel_${modalId}" class="req-btn ghost">Cancel</button>
                    <button type="button" id="submit_${modalId}" class="req-btn primary"><i data-lucide="check"></i> Submit</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", html);

    const modal = document.getElementById(modalId);
    const close = () => { window.lockBodyScroll(false); modal.remove(); };

    document.getElementById(`cancel_${modalId}`).onclick = close;
    const _closeX2 = document.getElementById(`closeX_${modalId}`); if (_closeX2) _closeX2.onclick = close;
    modal.querySelector(".modalBackdrop").onclick = close;
    window.debouncedIcons?.();

    if (requirements.payment) {
        const method = document.getElementById(`resPaymentMethod_${modalId}`);
        const customField = document.getElementById(`customMopField_${modalId}`);
        const syncMethod = () => { customField.hidden = method.value !== "Other"; };
        method.addEventListener("change", syncMethod);
        syncMethod();
    }

    if (requirements.location) {
        document.getElementById(`getLoc_${modalId}`).onclick = () => {
            if (!navigator.geolocation) {
                return window.alert("Location sharing is not supported on this device.");
            }

            document.getElementById(`locStatus_${modalId}`).textContent = "Getting location...";

            navigator.geolocation.getCurrentPosition(async position => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                document.getElementById(`resLat_${modalId}`).value = lat;
                document.getElementById(`resLng_${modalId}`).value = lng;
                const statusEl = document.getElementById(`locStatus_${modalId}`);
                statusEl.textContent = "Attached — identifying address...";

                // Identify the readable address and prefill the delivery
                // fields (empty fields only — never overwrite typing).
                const geo = window.reverseGeocode ? await window.reverseGeocode(lat, lng) : null;
                if (geo && geo.label) {
                    statusEl.textContent = `Attached: ${geo.label}`;
                    const fillIfEmpty = (id, val) => {
                        const el = document.getElementById(id);
                        if (el && val && !el.value.trim()) el.value = val;
                    };
                    fillIfEmpty(`resHouse_${modalId}`, geo.road);
                    fillIfEmpty(`resBarangay_${modalId}`, geo.barangay ? `Brgy. ${geo.barangay}` : "");
                    fillIfEmpty(`resCity_${modalId}`, geo.city);
                } else {
                    statusEl.textContent = `Attached: ${lat}, ${lng}`;
                }
            }, () => {
                document.getElementById(`locStatus_${modalId}`).textContent = "Unable to get location.";
                window.alert("Unable to get location. Please allow location permission.");
            }, {
                enableHighAccuracy: true,
                timeout: 10000
            });
        };
    }

    document.getElementById(`submit_${modalId}`).onclick = async () => {
        const payload = {
            placeId: req.placeId,
            placeName: req.placeName,
            userId: user.uid,
            userName: AppState.userProfile?.fullName || user.displayName || "Customer",
            type: "requirement_response",
            requestType: req.requestType || "booking",
            transactionId: req.transactionId || req.bookingId || requestMessageId,
            bookingId: req.bookingId || null,
            requestMessageId,
            requirementStatus: "submitted",
            requirements,
            text: "Customer submitted transaction requirements.",
            senderUid: user.uid,
            senderRole: "customer",
            senderName: AppState.userProfile?.fullName || user.displayName || "Customer",
            createdBy: user.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            reply: null
        };

        if (requirements.address) {
            payload.houseStreet = document.getElementById(`resHouse_${modalId}`).value.trim();
            payload.barangay = document.getElementById(`resBarangay_${modalId}`).value.trim();
            payload.city = document.getElementById(`resCity_${modalId}`).value.trim();
            payload.landmark = document.getElementById(`resLandmark_${modalId}`).value.trim();

            if (!payload.houseStreet || !payload.barangay || !payload.city || !payload.landmark) {
                return window.alert("Please complete the delivery address, city, and landmark/location notes.");
            }
        }

        if (requirements.location) {
            const lat = document.getElementById(`resLat_${modalId}`).value;
            const lng = document.getElementById(`resLng_${modalId}`).value;

            if (!lat || !lng) {
                return window.alert("Please attach your current location.");
            }

            payload.lat = Number(lat);
            payload.lng = Number(lng);
        }

        if (requirements.payment) {
            const selectedMethod = document.getElementById(`resPaymentMethod_${modalId}`).value;
            const customMop = document.getElementById(`resCustomMop_${modalId}`).value.trim();

            payload.paymentMethod = selectedMethod === "Other" ? customMop : selectedMethod;
            payload.paymentAmount = document.getElementById(`resAmount_${modalId}`).value.trim();
            payload.paymentReference = document.getElementById(`resRef_${modalId}`).value.trim();
            payload.paymentStatus = "pending_confirmation";

            if (!payload.paymentMethod) {
                return window.alert("Please select a payment method.");
            }

            if (req.amount && !payload.paymentAmount) {
                return window.alert("Please enter the amount paid.");
            }

            const onlinePayment = window.PaymentPolicy.isOnline({ paymentMethod: payload.paymentMethod });
            if (onlinePayment && !payload.paymentReference) {
                return window.alert("Please enter your online payment reference number so the business can verify it.");
            }
        }

        if (requirements.orderDetails) {
            payload.orderDetails = document.getElementById(`resOrder_${modalId}`).value.trim();

            if (!payload.orderDetails) {
                return window.alert("Please enter additional details.");
            }
        }

        try {
            await window.db.collection("messages").add(payload);

            await window.db.collection("messages").doc(requestMessageId).update({
                requirementStatus: "submitted",
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            await addSystemUpdate(req.placeId, req.placeName, user.uid, AppState.userProfile?.fullName || user.displayName || "Customer", "Customer submitted address, location, payment, and order details.", "submitted", "📍", req.transactionId || req.bookingId || requestMessageId, req.bookingId || null);

            close();
            window.alert("Requirements submitted.");
        } catch (error) {
            window.alert("Error submitting requirements: " + error.message);
        }
    };
} catch (error) {
    window.alert("Error opening requirement form: " + error.message);
}

};

window.confirmRequirementResponse = async function(responseMessageId) {
    const user = window.auth?.currentUser;
    if (!user) return;

    const ans = await window.vConfirm(
        "Confirm Requirements",
        "Confirm that the submitted details are correct? This does not confirm payment or mark the order as fulfilled.",
        "Confirm",
        false
    );

    if (!ans) return;

    try {
        const responseDoc = await window.db.collection("messages").doc(responseMessageId).get();

        if (!responseDoc.exists) {
            return window.alert("Requirement response no longer exists.");
        }

        const responseData = responseDoc.data();
        const transactionId = responseData.transactionId || responseData.bookingId || responseMessageId;
        await window.db.collection("messages").doc(responseMessageId).update({
            requirementStatus: "confirmed",
            confirmedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        await addSystemUpdate(responseData.placeId, responseData.placeName, responseData.userId, responseData.userName,
            "Requirements confirmed. Payment verification and order preparation are separate steps.", "confirmed", "📋", transactionId, responseData.bookingId || null);
        window.alert("Requirements confirmed. Verify online payment proof before starting preparation.");
    } catch (error) {
        window.alert("Error confirming requirements: " + error.message);
    }
};

window.updateTransactionStage = async function(completionMessageId, nextStatus) {
    const user = window.auth?.currentUser;
    if (!user) return;

    const labels = {
        preparing: "Preparing",
        out_for_delivery: "Out for Delivery",
        delivered: "Delivered"
    };

    const ans = await window.vConfirm(
        labels[nextStatus] || "Update Transaction",
        "Update this delivery status to " + (labels[nextStatus] || nextStatus) + "?",
        "Update",
        false
    );

    if (!ans) return;

    try {
        const ref = window.db.collection("messages").doc(completionMessageId);
        const doc = await ref.get();
        const data = doc.exists ? doc.data() : {};

        if (!data.bookingId) throw new Error("No linked booking was found. Open the booking transaction instead.");
        await window.ViciData.command("booking", { bookingId: data.bookingId, patch: { status: nextStatus } });
        await ref.update({ transactionStatus: nextStatus, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });

        const text = nextStatus === "out_for_delivery"
            ? "Order is now out for delivery."
            : nextStatus === "delivered"
                ? "Business marked the order as delivered. Waiting for customer confirmation."
                : "Business is preparing the order.";

        await addSystemUpdate(data.placeId, data.placeName, data.userId, data.userName, text, nextStatus, nextStatus === "out_for_delivery" ? "🛵" : nextStatus === "delivered" ? "📦" : "👨‍🍳", data.transactionId || data.bookingId || completionMessageId, data.bookingId || null);

        window.alert("Delivery status updated.");
    } catch (error) {
        window.alert("Error updating delivery status: " + error.message);
    }
};

window.confirmTransactionReceived = async function(completionMessageId, placeId, bookingId) {
    const user = window.auth?.currentUser;
    if (!user) return;

    const ans = await window.vConfirm(
        "Confirm Received",
        "Confirm that you received the order/service and the transaction is completed?",
        "Confirm Received",
        false
    );

    if (!ans) return;

    try {
        const completionDoc = await window.db.collection("messages").doc(completionMessageId).get();
        const completionData = completionDoc.exists ? completionDoc.data() : {};
        const transactionId = completionData.transactionId || bookingId || completionMessageId;


        if (bookingId && bookingId !== "null" && bookingId !== "undefined") {
            await window.ViciData.command("booking", { bookingId: bookingId, patch: {
                status: "received",
                customer_confirmed: true,
                customerConfirmedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            } });
        }

        await window.db.collection("messages").doc(completionMessageId).update({
            transactionStatus: "received",
            customerConfirmedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        const existingFeedback = await window.db.collection("messages")
            .where("type", "==", "feedback_request")
            .where("completionMessageId", "==", completionMessageId)
            .where("userId", "==", user.uid)
            .limit(1)
            .get();

        let feedbackMessageId = null;

        if (existingFeedback.empty) {
            const placeName = await getPlaceDisplayName(placeId, "Establishment");
            const feedbackRef = window.db.collection("messages").doc();

            await feedbackRef.set({
                placeId,
                placeName,
                userId: user.uid,
                userName: AppState.userProfile?.fullName || user.displayName || "Customer",
                type: "feedback_request",
                transactionId,
                completionMessageId,
                bookingId: bookingId || null,
                feedbackStatus: "feedback_waiting",
                text: "Please rate and send feedback for this completed transaction.",
                senderUid: user.uid,
                senderRole: "customer",
                senderName: "Vicinify",
                createdBy: user.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                reply: null
            });

            feedbackMessageId = feedbackRef.id;
        } else {
            feedbackMessageId = existingFeedback.docs[0].id;
        }

        await addSystemUpdate(placeId, await getPlaceDisplayName(placeId, "Establishment"), user.uid, AppState.userProfile?.fullName || user.displayName || "Customer", "Customer confirmed received. Feedback is now ready.", "received", "📦", transactionId, bookingId || null);

        window.alert("Transaction completed. Please leave a rating and feedback.");

        setTimeout(() => {
            if (window.openFeedbackModal) {
                window.openFeedbackModal(placeId, bookingId || completionMessageId, feedbackMessageId);
            }
        }, 300);
    } catch (error) {
        window.alert("Error confirming received: " + error.message);
    }
};

window.openFeedbackModal = async function(placeId, bookingId, feedbackMessageId) {
const user = window.auth?.currentUser;
if (!user) return window.alert("Please log in first.");

if (feedbackMessageId) {
    try {
        const feedbackDoc = await window.db.collection("messages").doc(feedbackMessageId).get();
        if (feedbackDoc.exists && feedbackDoc.data().feedbackStatus === "feedback_submitted") {
            return window.alert("You already submitted feedback for this transaction.");
        }
    } catch (e) {
        console.warn("Feedback status check failed:", e);
    }
}

const modalId = "feedbackModal_" + Date.now();
window.lockBodyScroll(true);

const html = `
    <div id="${modalId}" style="position:fixed; inset:0; z-index:999999; display:flex; align-items:center; justify-content:center;">
        <div class="modalBackdrop" style="position:absolute; inset:0; background:rgba(15,23,42,0.55);"></div>

        <div style="position:relative; background:white; width:92%; max-width:440px; border-radius:22px; padding:22px; box-shadow:0 24px 60px rgba(15,23,42,0.25);">
            <h3 style="margin:0 0 6px; font-size:20px; color:#0f172a;">Rate Your Experience</h3>
            <p style="margin:0 0 16px; color:#64748b; font-size:13px; line-height:1.5;">
                How was your transaction? Your feedback helps improve local establishments.
            </p>

            <label style="font-size:13px; font-weight:800; color:#334155;">Rating</label>
            <select id="fbRating_${modalId}" style="width:100%; box-sizing:border-box; padding:11px; border:1px solid #cbd5e1; border-radius:12px; margin:8px 0 12px;">
                <option value="5">⭐⭐⭐⭐⭐ 5 - Very Satisfied</option>
                <option value="4">⭐⭐⭐⭐ 4 - Satisfied</option>
                <option value="3">⭐⭐⭐ 3 - Okay</option>
                <option value="2">⭐⭐ 2 - Not Satisfied</option>
                <option value="1">⭐ 1 - Bad Experience</option>
            </select>

            <label style="font-size:13px; font-weight:800; color:#334155;">Satisfaction</label>
            <select id="fbSatisfaction_${modalId}" style="width:100%; box-sizing:border-box; padding:11px; border:1px solid #cbd5e1; border-radius:12px; margin:8px 0 12px;">
                <option value="Very satisfied">Very satisfied</option>
                <option value="Satisfied">Satisfied</option>
                <option value="Neutral">Neutral</option>
                <option value="Not satisfied">Not satisfied</option>
                <option value="Needs improvement">Needs improvement</option>
            </select>

            <label style="font-size:13px; font-weight:800; color:#334155;">Feedback / Comment</label>
            <textarea id="fbComment_${modalId}" placeholder="Write your feedback here, optional but recommended"
                style="width:100%; box-sizing:border-box; min-height:95px; padding:11px; border:1px solid #cbd5e1; border-radius:12px; resize:none; margin-top:8px;"></textarea>

            <label style="display:flex; gap:10px; align-items:flex-start; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:10px; margin-top:12px; font-size:12px; color:#334155; line-height:1.35; cursor:pointer;">
                <input type="checkbox" id="fbPublic_${modalId}" checked style="margin-top:2px;" />
                <span><b>Post publicly as a Verified Review</b><br><span style="color:#64748b;">This helps the business build trust. You can uncheck this to keep the feedback inside the transaction only.</span></span>
            </label>

            <div style="display:flex; gap:10px; margin-top:16px;">
                <button id="cancel_${modalId}" style="flex:1; padding:12px; border:none; border-radius:12px; background:#f1f5f9; color:#475569; font-weight:800; cursor:pointer;">Later</button>
                <button id="submit_${modalId}" style="flex:1; padding:12px; border:none; border-radius:12px; background:#facc15; color:#713f12; font-weight:900; cursor:pointer;">Send Feedback</button>
            </div>
        </div>
    </div>
`;

document.body.insertAdjacentHTML("beforeend", html);

const modal = document.getElementById(modalId);
const close = () => { window.lockBodyScroll(false); modal.remove(); };

document.getElementById(`cancel_${modalId}`).onclick = close;
modal.querySelector(".modalBackdrop").onclick = close;

document.getElementById(`submit_${modalId}`).onclick = async () => {
    const rating = Number(document.getElementById(`fbRating_${modalId}`).value);
    const satisfaction = document.getElementById(`fbSatisfaction_${modalId}`).value;
    const comment = document.getElementById(`fbComment_${modalId}`).value.trim();
    const postPublic = document.getElementById(`fbPublic_${modalId}`)?.checked !== false;

    if (!rating || rating < 1 || rating > 5) {
        return window.alert("Please select a valid rating.");
    }

    try {
        const safeTransactionId = bookingId || feedbackMessageId || "manual";
        const reviewId = `${user.uid}_${placeId}_${safeTransactionId}`;

        const existingReview = await window.db.collection("reviews").doc(reviewId).get();

        if (existingReview.exists) {
            window.alert("You already submitted feedback for this transaction.");
            return;
        }

        let txRequestType = null;
        let txRequestLabel = null;

        try {
            if (bookingId && bookingId !== feedbackMessageId && bookingId !== "manual") {
                const bookingDoc = await window.db.collection("bookings").doc(bookingId).get();
                if (bookingDoc.exists) {
                    const bookingData = bookingDoc.data();
                    txRequestType = bookingData.requestType || null;
                    txRequestLabel = bookingData.requestLabel || null;
                }
            }
        } catch (lookupError) {
            console.warn("Feedback request type lookup skipped:", lookupError);
        }

        const txMeta = getRequestMeta(txRequestType || "table_reservation");

        await window.ViciData.command("review", { placeId, bookingId: bookingId || undefined, rating, satisfaction, feedback: comment, isPublic: postPublic });
        window.invalidatePlacesCache?.();

        if (feedbackMessageId && feedbackMessageId !== "null" && feedbackMessageId !== "undefined") {
            await window.db.collection("messages").doc(feedbackMessageId).update({
                feedbackStatus: "feedback_submitted",
                rating,
                satisfaction,
                feedback: comment,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        const placeName = await getPlaceDisplayName(placeId, "Establishment");

        await window.db.collection("messages").add({
            placeId,
            placeName,
            userId: user.uid,
            userName: AppState.userProfile?.fullName || user.displayName || "Customer",
            type: "feedback_response",
            bookingId,
            transactionId: safeTransactionId,
            requestType: txRequestType || txMeta.key,
            requestLabel: txRequestLabel || txMeta.shortLabel,
            rating,
            satisfaction,
            feedback: comment,
            publicReview: postPublic,
            verifiedTransaction: true,
            text: "Customer submitted feedback.",
            senderUid: user.uid,
            senderRole: "customer",
            senderName: AppState.userProfile?.fullName || user.displayName || "Customer",
            createdBy: user.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            reply: null
        });

        await addSystemUpdate(placeId, placeName, user.uid, AppState.userProfile?.fullName || user.displayName || "Customer", postPublic ? "Feedback submitted and posted as a public verified review." : "Feedback submitted privately for this transaction.", "feedback_submitted", "⭐", safeTransactionId, bookingId || null);

        close();
        window.alert("Thank you! Your rating and feedback were submitted.");

        if (window.MapPage) window.MapPage.refresh();
        if (window.viewPlace) {
            setTimeout(() => window.viewPlace(placeId), 600);
        }
    } catch (error) {
        window.alert("Error submitting feedback: " + error.message);
    }
};

};

window.viewSharedLocation = function(lat, lng) {
window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
};

function renderRequirementList(requirements) {
let items = [];

if (requirements?.address) items.push("🏠 Delivery Address");
if (requirements?.location) items.push("📍 Current Location");
if (requirements?.payment) items.push("💳 Payment Details");
if (requirements?.orderDetails) items.push("📝 Order Details");

if (items.length === 0) return "No requirements specified.";

return items.map(i => `<div style="margin-top:4px;">${i}</div>`).join("");

}

function renderRequirementResponseDetails(d, isOwner, dateStr) {
let html = "";

if (d.requirements?.address) {
    html += `
        <div style="background:#fff7ed; border:1px solid #fed7aa; border-radius:12px; padding:10px; margin-top:10px;">
            <b style="color:#f97316;">🏠 Delivery Address</b>
            <div style="margin-top:6px;"><b>House/Street:</b> ${escapeHtml(d.houseStreet || "N/A")}</div>
            <div><b>Barangay:</b> ${escapeHtml(d.barangay || "N/A")}</div>
            <div><b>City:</b> ${escapeHtml(d.city || "N/A")}</div>
            <div><b>Landmark / Notes:</b> ${escapeHtml(d.landmark || "N/A")}</div>
        </div>
    `;
}

if (d.requirements?.location) {
    html += `
        <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:10px; margin-top:10px;">
            <b style="color:#16a34a;">📍 Shared Location</b>
            <div style="margin-top:6px;"><b>Lat:</b> ${escapeHtml(String(d.lat || "N/A"))}</div>
            <div><b>Lng:</b> ${escapeHtml(String(d.lng || "N/A"))}</div>
            ${d.lat && d.lng ? `
                <button onclick="window.viewSharedLocation(${d.lat}, ${d.lng})"
                    style="margin-top:8px; width:100%; border:none; background:#dcfce7; color:#166534; padding:9px; border-radius:10px; font-weight:800; cursor:pointer;">
                    View on Map
                </button>
            ` : ""}
        </div>
    `;
}

if (d.requirements?.payment) {
    const pStatus = d.paymentStatus || "pending_confirmation";

    html += `
        <div style="background:#eff6ff; border:1px solid #dbeafe; border-radius:12px; padding:10px; margin-top:10px;">
            <b style="color:#1d4ed8;">💳 Payment Details</b>
            <div style="margin-top:6px;"><b>Mode of Payment:</b> ${escapeHtml(d.paymentMethod || "N/A")}</div>
            <div><b>Amount:</b> ₱${escapeHtml(d.paymentAmount || "0")}</div>
            <div><b>Reference / Notes:</b> ${escapeHtml(d.paymentReference || "N/A")}</div>
            <div style="margin-top:6px;"><b>Status:</b> ${makeBadge(pStatus === "confirmed" ? "payment_confirmed" : "pending_confirmation")}</div>
        </div>
    `;
}

if (d.requirements?.orderDetails) {
    html += `
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:10px; margin-top:10px;">
            <b>📝 Order Details</b>
            <div style="margin-top:6px;">${escapeHtml(d.orderDetails || "N/A")}</div>
        </div>
    `;
}

if (isOwner && d.requirementStatus !== "confirmed") {
    html += `
        <button onclick="window.confirmRequirementResponse('${d.id}')"
            style="margin-top:12px; width:100%; border:none; background:#dcfce7; color:#166534; padding:10px; border-radius:10px; font-weight:800; cursor:pointer;">
            Confirm Requirements
        </button>
    `;
}

html += `<div style="font-size:10px; color:#94a3b8; margin-top:10px;">${dateStr}</div>`;

return html;

}

// ---- Message receipts: Sent / Delivered / Seen (v10) ----
// State lives on the message doc: status + deliveredAt + seenAt + seenBy.
function receiptState(d) {
    if (!d) return "sent";
    if (d.seenAt || d.status === "seen") return "seen";
    if (d.deliveredAt || d.status === "delivered") return "delivered";
    return "sent";
}
function receiptHtml(d, currentUid, opts) {
    const mine = d && (d.senderUid === currentUid || d.createdBy === currentUid);
    if (!mine) return "";
    const state = receiptState(d);
    const icon = state === "sent" ? "✓" : "✓✓";
    const label = state === "seen" ? "Seen" : state === "delivered" ? "Delivered" : "Sent";
    const cls = state === "seen" ? "is-seen" : state === "delivered" ? "is-delivered" : "is-sent";
    const time = opts && opts.time ? ` ${opts.time}` : "";
    return `<span class="msg-receipt ${cls}" title="${label}">${icon} ${label}${time}</span>`;
}
// Receipt markers are attempted AT MOST ONCE per doc per page session.
// If a marker write is denied by the live rules (or never persists for
// any reason), the field guards alone would retry on every snapshot for
// the whole session — these sets cap receipt writes at the doc count.
const _deliveredAttempted = new Set();
const _seenAttempted = new Set();

async function markIncomingDelivered(snapDocs, uid) {
    if (!uid || !snapDocs || !snapDocs.length) return;
    try {
        const batch = window.db.batch(); let n = 0;
        snapDocs.forEach(doc => {
            const d = doc.data ? doc.data() : doc;
            const id = doc.id;
            if (!id || !d || d.type !== "text") return;
            const sender = d.senderUid || d.createdBy;
            if (!sender || sender === uid) return;
            if (d.seenAt || d.deliveredAt) return;
            if ((d.deletedBy || []).includes(uid)) return;
            if (_deliveredAttempted.has(id)) return;
            _deliveredAttempted.add(id);
            batch.update(window.db.collection("messages").doc(id), {
                deliveredAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: "delivered"
            }); n++;
        });
        if (n) await batch.commit();
    } catch (e) { /* rules may restrict cross-user updates; receipts stay at Sent */ }
}
async function markIncomingSeen(docs, uid) {
    if (!uid || !docs || !docs.length) return;
    try {
        const batch = window.db.batch(); let n = 0;
        docs.forEach(d => {
            if (!d || !d.id || d.type !== "text" || document.hidden) return;
            const sender = d.senderUid || d.createdBy;
            if (!sender || sender === uid) return;
            if (d.seenAt) return;
            if ((d.deletedBy || []).includes(uid)) return;
            if (_seenAttempted.has(d.id)) return;
            _seenAttempted.add(d.id);
            const upd = {
                seenAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: "seen"
            };
            if (!d.deliveredAt) upd.deliveredAt = firebase.firestore.FieldValue.serverTimestamp();
            batch.update(window.db.collection("messages").doc(d.id), upd); n++;
        });
        if (n) await batch.commit();
    } catch (e) { /* same as delivered: fail silently */ }
}
window.markIncomingDelivered = markIncomingDelivered;
window.markIncomingSeen = markIncomingSeen;

function renderTextBubble(d, currentUid, dateStr, options = {}) {
    const isMine = d.senderUid === currentUid;
    return `<div class="chat-message-row ${isMine ? "is-mine" : "is-other"}${options.grouped ? " is-grouped" : ""}">
        ${!isMine ? `<span class="chat-sender-avatar" aria-hidden="true">${escapeHtml(String(d.senderName || "B").charAt(0).toUpperCase())}</span>` : ""}
        <div class="chat-bubble ${isMine ? "me" : "other"}">
            ${!isMine && !options.grouped && d.senderName ? `<span class="chat-message-sender">${escapeHtml(d.senderName)}</span>` : ""}
            <div class="chat-message-text">${escapeHtml(d.text || "")}</div>
            <div class="chat-message-meta">${isMine ? receiptHtml(d, currentUid, { time: dateStr }) : escapeHtml(dateStr)}</div>
        </div>
    </div>`;
}

function renderLegacyMessage(d, isOwner, dateStr, replyDateStr) {
    let html = "";
    // Legacy customer text and owner reply use the same presentation, without
    // inventing delivery/seen receipts that are absent on these older records.
    const bubble = (text, mine, time) => `<div class="chat-message-row ${mine ? "is-mine" : "is-other"}"><div class="chat-bubble ${mine ? "me" : "other"}"><div class="chat-message-text">${escapeHtml(text)}</div><div class="chat-message-meta">${escapeHtml(time)}</div></div></div>`;
    if (d.text) html += bubble(d.text, !isOwner, dateStr);
    if (d.reply) html += bubble(d.reply, isOwner, replyDateStr);
    return html;
}

function chatDayInfo(message, now = new Date()) {
    const stamp = message.createdAt?.toDate?.();
    const date = stamp instanceof Date && Number.isFinite(stamp.getTime()) ? stamp : now;
    const key = date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();
    const midnight = value => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const label = midnight(date) === midnight(now) ? "Today" : midnight(date) === midnight(yesterday) ? "Yesterday"
        : date.toLocaleDateString([], { month: "short", day: "numeric", ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}) });
    return { key, label };
}

function listenToChatRoom(placeId, targetUid) {
if (currentChatUnsub) currentChatUnsub();

const listWrap = document.getElementById("chatMessageList");
if (!listWrap) return;

const user = window.auth?.currentUser;
const isOwner = user && user.uid !== targetUid;

listWrap.innerHTML = `<div class="muted" style="text-align:center; padding:20px; font-size:12px;" data-i18n="Loading conversation...">Loading conversation...</div>`;

// Coalesce snapshot renders: snapshots arriving back-to-back (e.g. the
// echo of our own seen-marker writes) render ONCE per frame with the
// latest data instead of rebuilding the whole thread every time.
let _pendingChatSnap = null;
let _chatRenderQueued = false;
const queueChatRender = (snap) => {
    _pendingChatSnap = snap;
    if (_chatRenderQueued) return;
    _chatRenderQueued = true;
    requestAnimationFrame(() => {
        _chatRenderQueued = false;
        const s = _pendingChatSnap;
        _pendingChatSnap = null;
        if (!s) return;
        // A different chat may have opened meanwhile; never paint stale.
        if (document.getElementById("chatPlaceId")?.value !== placeId) return;
        if (document.getElementById("chatCustomerUid")?.value !== targetUid) return;
        renderChatSnap(s);
    });
};

currentChatUnsub = window.db.collection("messages")
    .where("placeId", "==", placeId)
    .where("userId", "==", targetUid)
    .orderBy("createdAt", "desc")
    .limit(100)
    .onSnapshot(snap => queueChatRender(snap), err => {
        console.error("Chat listener error:", err);
        if (!window.handleFirestoreError(err)) {
            listWrap.innerHTML = `<div class="muted" style="text-align:center; padding:20px; font-size:12px;">Could not load messages: ${escapeHtml(err.message || String(err))}</div>`;
        }
    });

const renderChatSnap = (snap) => {
        if (snap.empty) {
            listWrap.innerHTML = `<div class="chat-empty"><span class="chat-empty-icon"><i data-lucide="messages-square"></i></span><h4>Start a conversation</h4><p>Ask about the menu, availability, or your request. Choose a quick question below to get started.</p></div>`;
            window.debouncedIcons?.();
            return;
        }

        let docs = snap.docs.map(d => ({
            id: d.id,
            ...d.data()
        })).filter(d => !(d.deletedBy || []).includes(user?.uid));
        currentChatDocsCache = docs;

        if (docs.length === 0) {
            listWrap.innerHTML = `<div class="chat-empty"><span class="chat-empty-icon"><i data-lucide="messages-square"></i></span><h4>Start a conversation</h4><p>Ask about the menu, availability, or your request. Choose a quick question below to get started.</p></div>`;
            window.debouncedIcons?.();
            return;
        }

        // Pending server timestamps are null locally; treat them as "now"
        // so a just-sent message stays at the bottom instead of jumping to the top.
        const msgMillis = d => (d.createdAt && typeof d.createdAt.toMillis === "function") ? d.createdAt.toMillis() : Date.now();
        docs.sort((a, b) => msgMillis(a) - msgMillis(b));

        // I'm viewing this thread: incoming messages become Seen (and Delivered if skipped).
        if (user?.uid && !document.hidden) markIncomingSeen(docs, user.uid);

        const activeTransactionDocs = getActiveTransactionDocs(docs);
        const pendingRequirement = newestDoc(activeTransactionDocs, d => d.type === "requirement_request" && (d.requirementStatus || "waiting_customer") === "waiting_customer");
        currentChatContext.activeTransactionId = getLatestBookingCard(activeTransactionDocs)?.transactionId || getLatestBookingCard(activeTransactionDocs)?.bookingId || pendingRequirement?.transactionId || pendingRequirement?.bookingId || null;
        updateChatQuickActions(isOwner, pendingRequirement);

        let html = "";
        let previousDay = "";
        docs.forEach((d, index) => {
            const day = chatDayInfo(d);
            if (day.key !== previousDay) {
                html += `<div class="chat-date-divider"><span>${escapeHtml(day.label)}</span></div>`;
                previousDay = day.key;
            }
            const dateStr = d.createdAt && d.createdAt.toDate
                ? d.createdAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "Just now";

            const replyDateStr = d.repliedAt && d.repliedAt.toDate
                ? d.repliedAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "Replied";

            if (d.type === "system_update") {
                html += renderSystemUpdate(d, dateStr);
                return;
            }

            if (d.type === "booking_card") {
                const status = d.bookingStatus || d.status || "pending";
                const meta = getRequestMeta(d.requestType || "booking");
                const side = getCardSide(d, user.uid, isOwner, "customer");
                const isActiveBookingCard = activeTransactionDocs.some(x => x.id === d.id || x.bookingId === d.bookingId || x.transactionId === d.transactionId);
                const inlineProgressHtml = isActiveBookingCard ? renderInlineTransactionProgress(activeTransactionDocs) : "";

                html += `
                    <div style="display:flex; justify-content:${side}; width:100%; margin-bottom:14px;">
                        <div class="chat-transaction-card" style="background:#ffffff; border:1px solid ${meta.light}; border-radius:18px; overflow:hidden; max-width:88%; min-width:285px; box-shadow:0 6px 18px rgba(15,23,42,0.08);">
                            <div style="background:${meta.color}; color:white; padding:12px 14px; font-weight:900; display:flex; align-items:center; justify-content:space-between; gap:10px;">
                                <span>${meta.icon} ${escapeHtml(meta.title)}</span>
                                <span style="background:white; color:${meta.color}; border-radius:999px; padding:3px 8px; font-size:10px; white-space:nowrap;">${escapeHtml(meta.shortLabel)}</span>
                            </div>

                            <div style="padding:14px;">
                                <div style="display:grid; gap:8px; font-size:13px; color:#334155;">
                                    ${renderRequestDetailRows(d)}
                                    <div><b>Status:</b> ${makeBadge(status)}</div>
                                </div>

                                ${inlineProgressHtml}

                                ${isOwner && status === "pending" ? `
                                    <div style="display:flex; gap:8px; margin-top:14px;">
                                        <button onclick="window.updateBookingFromChat('${d.bookingId}', '${d.id}', 'rejected')" style="flex:1; border:none; background:#fee2e2; color:#991b1b; padding:9px; border-radius:10px; font-weight:800; cursor:pointer;">Reject</button>
                                        <button onclick="window.updateBookingFromChat('${d.bookingId}', '${d.id}', 'accepted')" style="flex:1; border:none; background:#dcfce7; color:#166534; padding:9px; border-radius:10px; font-weight:800; cursor:pointer;">Accept Request</button>
                                    </div>
                                ` : ""}

                                ${isOwner ? renderBookingNextAction(d) : ""}

                                ${renderPaymentFlowCard(d, isOwner)}

                                ${isOwner && status === "payment_submitted" ? `
                                    <div class="payment-owner-review" style="margin-top:12px; background:#fef3c7; border:1px solid #fde68a; border-radius:12px; padding:12px;">
                                        <div style="font-size:13px; font-weight:900; color:#92400e; margin-bottom:8px;">Payment details submitted — please review</div>
                                        ${(d.paymentProofPath || d.paymentProofUrl) ? `<img ${d.paymentProofPath ? `data-proof-booking="${escapeHtml(d.bookingId || "")}" data-proof-version="${escapeHtml(d.paymentProofPath || "")}"` : `src="${escapeHtml(safeImageUrl(d.paymentProofUrl))}"`} alt="Payment proof" style="width:100%; border-radius:8px; border:1px solid #fde68a; margin-bottom:10px;" loading="lazy" />` : `<div style="font-size:12px; color:#92400e;">Receipt image is optional. Verify the submitted reference against your actual account.</div>`}
                                        <div class="payment-review-actions" style="display:flex; gap:8px;">
                                            <button onclick="window.reviewPaymentProof('${d.bookingId}', '${d.id}', 'resubmit')" style="flex:1; border:1px solid #fca5a5; background:#fff; color:#991b1b; padding:9px; border-radius:10px; font-weight:800; cursor:pointer;">Decline payment</button>
                                            <button onclick="window.reviewPaymentProof('${d.bookingId}', '${d.id}', 'confirm')" style="flex:1; border:none; background:#16a34a; color:#fff; padding:9px; border-radius:10px; font-weight:800; cursor:pointer;">Accept payment</button>
                                        </div>
                                    </div>
                                ` : ""}

                                ${!isOwner && (d.paymentProofPath || d.paymentProofUrl) ? `
                                    <div style="margin-top:10px;">
                                        <img ${d.paymentProofPath ? `data-proof-booking="${escapeHtml(d.bookingId || "")}" data-proof-version="${escapeHtml(d.paymentProofPath || "")}"` : `src="${escapeHtml(safeImageUrl(d.paymentProofUrl))}"`} alt="Payment proof" style="width:100%; border-radius:10px; border:1px solid #e2e8f0;" loading="lazy" />
                                    </div>
                                ` : ""}

                                ${!isOwner && ["fulfilled", "delivered"].includes(status) ? `
                                    <button onclick="window.confirmReceivedFromChat('${d.bookingId}', '${d.id}', '${d.placeId}')" style="margin-top:14px; width:100%; border:none; background:#dcfce7; color:#166534; padding:10px; border-radius:10px; font-weight:900; cursor:pointer;">${escapeHtml(meta.confirmLabel)}</button>
                                ` : ""}

                                ${status === "received" ? `
                                    <div style="margin-top:12px; font-size:12px; color:#5b21b6; font-weight:800;">Transaction completed. Feedback can now be submitted.</div>
                                ` : ""}

                                <div style="font-size:10px; color:#94a3b8; margin-top:10px;">${dateStr}</div>
                            </div>
                        </div>
                    </div>
                `;

                return;
            }

            if (d.type === "requirement_request") {
                const status = d.requirementStatus || "waiting_customer";
                const side = getCardSide(d, user.uid, isOwner, "owner");

                html += `
                    <div style="display:flex; justify-content:${side}; width:100%; margin-bottom:14px;">
                        <div class="chat-transaction-card" style="background:#ffffff; border:1px solid #c7d2fe; border-radius:18px; overflow:hidden; max-width:88%; min-width:280px; box-shadow:0 6px 18px rgba(15,23,42,0.08);">
                            <div style="background:${d.requestType === 'delivery_order' ? '#0ea5e9' : '#4f46e5'}; color:white; padding:12px 14px; font-weight:800;">${d.requestType === 'delivery_order' ? '🛵 Delivery Details Ready' : '📋 Requirements Needed'}</div>

                            <div style="padding:14px; font-size:13px; color:#334155;">
                                <div><b>Status:</b> ${makeBadge(status)}</div>
                                <div style="margin-top:8px;"><b>Business requested:</b></div>
                                ${renderRequirementList(d.requirements)}

                                ${d.amount ? `<div style="margin-top:8px;"><b>Amount:</b> ₱${escapeHtml(d.amount)}</div>` : ""}

                                ${d.acceptedPaymentMethods?.length ? `
                                    <div style="margin-top:8px;"><b>Accepted MOP:</b> ${escapeHtml(d.acceptedPaymentMethods.join(", "))}</div>
                                ` : ""}

                                ${d.notes ? `
                                    <div style="margin-top:8px; background:#f8fafc; padding:8px; border-radius:10px;">${escapeHtml(d.notes)}</div>
                                ` : ""}

                                ${!isOwner && status === "waiting_customer" ? `
                                    <button onclick="window.openRequirementResponseModal('${d.id}')" style="margin-top:12px; width:100%; border:none; background:#e0e7ff; color:#3730a3; padding:10px; border-radius:10px; font-weight:800; cursor:pointer;">Submit Requirements</button>
                                ` : ""}

                                ${!isOwner && status === "submitted" ? `
                                    <div style="margin-top:12px; color:#166534; font-size:12px; font-weight:800;">Submitted. Waiting for business confirmation.</div>
                                ` : ""}

                                ${status === "confirmed" ? `
                                    <div style="margin-top:12px; color:#5b21b6; font-size:12px; font-weight:800;">Requirements confirmed by business.</div>
                                ` : ""}

                                <div style="font-size:10px; color:#94a3b8; margin-top:10px;">${dateStr} ${receiptHtml(d, user.uid, {})}</div>
                            </div>
                        </div>
                    </div>
                `;

                return;
            }

            if (d.type === "requirement_response") {
                const status = d.requirementStatus || "submitted";
                const side = getCardSide(d, user.uid, isOwner, "customer");

                html += `
                    <div style="display:flex; justify-content:${side}; width:100%; margin-bottom:14px;">
                        <div class="chat-transaction-card" style="background:#ffffff; border:1px solid #bbf7d0; border-radius:18px; overflow:hidden; max-width:90%; min-width:290px; box-shadow:0 6px 18px rgba(15,23,42,0.08);">
                            <div style="background:#16a34a; color:white; padding:12px 14px; font-weight:800;">✅ Requirements Submitted</div>
                            <div style="padding:14px; font-size:13px; color:#334155;">
                                <div><b>Status:</b> ${makeBadge(status)}</div>
                                ${renderRequirementResponseDetails(d, isOwner, dateStr)}
                            </div>
                        </div>
                    </div>
                `;

                return;
            }


            if (d.type === "completion_request") {
                const status = d.transactionStatus || "fulfilled_waiting_customer";
                const side = getCardSide(d, user.uid, isOwner, "owner");
                const isDeliveryCompletion = String(d.requestType || "").toLowerCase() === "delivery_order" || ["preparing", "out_for_delivery", "delivered"].includes(status);
                const statusLabel = status === "preparing" ? "Preparing" : status === "out_for_delivery" ? "Out for Delivery" : status === "delivered" ? "Delivered" : status === "received" ? "Received" : "Fulfilled";
                const header = isDeliveryCompletion ? "🛵 Delivery Tracker" : "✅ Transaction Fulfilled";

                html += `
                    <div style="display:flex; justify-content:${side}; width:100%; margin-bottom:14px;">
                        <div class="chat-transaction-card" style="background:#ffffff; border:1px solid #bfdbfe; border-radius:18px; overflow:hidden; max-width:88%; min-width:280px; box-shadow:0 6px 18px rgba(15,23,42,0.08);">
                            <div style="background:${isDeliveryCompletion ? "#0ea5e9" : "#2563eb"}; color:white; padding:12px 14px; font-weight:900;">
                                ${header}
                            </div>

                            <div style="padding:14px; font-size:13px; color:#334155;">
                                <div><b>Status:</b> ${status === "received" ? makeBadge("received") : makeBadge(status === "delivered" ? "fulfilled" : status)}</div>

                                <div style="margin-top:10px; color:#475569;">
                                    ${status === "preparing" ? "Business is preparing the delivery/order." : status === "out_for_delivery" ? "The order is on the way to the customer." : status === "delivered" ? "Business marked this as delivered. Customer can now confirm received." : status === "received" ? "Transaction confirmed received by customer." : "The business marked this transaction as fulfilled. Please confirm once received/completed."}
                                </div>

                                ${isOwner && status === "preparing" ? `
                                    <button onclick="window.updateTransactionStage('${d.id}', 'out_for_delivery')" style="margin-top:12px; width:100%; border:none; background:#e0f2fe; color:#0369a1; padding:10px; border-radius:10px; font-weight:900; cursor:pointer;">Mark Out for Delivery</button>
                                ` : ""}

                                ${isOwner && status === "out_for_delivery" ? `
                                    <button onclick="window.updateTransactionStage('${d.id}', 'delivered')" style="margin-top:12px; width:100%; border:none; background:#dcfce7; color:#166534; padding:10px; border-radius:10px; font-weight:900; cursor:pointer;">Mark Delivered</button>
                                ` : ""}

                                ${!isOwner && (status === "delivered" || status === "fulfilled_waiting_customer") ? `
                                    <button onclick="window.confirmTransactionReceived('${d.id}', '${d.placeId}', '${d.bookingId || ""}')"
                                        style="margin-top:12px; width:100%; border:none; background:#dcfce7; color:#166534; padding:10px; border-radius:10px; font-weight:900; cursor:pointer;">
                                        Confirm Received
                                    </button>
                                ` : ""}

                                <div style="font-size:10px; color:#94a3b8; margin-top:10px;">${dateStr}</div>
                            </div>
                        </div>
                    </div>
                `;

                return;
            }

            if (d.type === "feedback_request") {
                const status = d.feedbackStatus || "feedback_waiting";
                const side = getCardSide(d, user.uid, isOwner, "system");

                html += `
                    <div style="display:flex; justify-content:${side}; width:100%; margin-bottom:14px;">
                        <div class="chat-transaction-card" style="background:#ffffff; border:1px solid #fde68a; border-radius:18px; overflow:hidden; max-width:88%; min-width:280px; box-shadow:0 6px 18px rgba(15,23,42,0.08);">
                            <div style="background:#facc15; color:#713f12; padding:12px 14px; font-weight:900;">⭐ Rate & Feedback</div>

                            <div style="padding:14px; font-size:13px; color:#334155;">
                                <div><b>Status:</b> ${makeBadge(status)}</div>
                                <div style="margin-top:8px;">
                                    Transaction completed. Please rate your experience and send feedback.
                                </div>

                                ${!isOwner && status === "feedback_waiting" ? `
                                    <button onclick="window.openFeedbackModal('${d.placeId}', '${d.bookingId}', '${d.id}')"
                                        style="margin-top:12px; width:100%; border:none; background:#fef3c7; color:#92400e; padding:10px; border-radius:10px; font-weight:900; cursor:pointer;">
                                        Rate & Send Feedback
                                    </button>
                                ` : ""}

                                ${status === "feedback_submitted" ? `
                                    <div style="margin-top:12px; color:#166534; font-size:12px; font-weight:800;">
                                        Feedback already submitted. Thank you!
                                    </div>
                                ` : ""}

                                <div style="font-size:10px; color:#94a3b8; margin-top:10px;">${dateStr}</div>
                            </div>
                        </div>
                    </div>
                `;

                return;
            }

            if (d.type === "feedback_response") {
                const side = getCardSide(d, user.uid, isOwner, "customer");

                const stars = "⭐".repeat(Number(d.rating || 0));

                html += `
                    <div style="display:flex; justify-content:${side}; width:100%; margin-bottom:14px;">
                        <div class="chat-transaction-card" style="background:#ffffff; border:1px solid #fde68a; border-radius:18px; overflow:hidden; max-width:88%; min-width:280px; box-shadow:0 6px 18px rgba(15,23,42,0.08);">
                            <div style="background:#f59e0b; color:white; padding:12px 14px; font-weight:900;">🌟 Customer Feedback</div>

                            <div style="padding:14px; font-size:13px; color:#334155; display:grid; gap:8px;">
                                <div><b>Rating:</b> ${escapeHtml(stars)} (${escapeHtml(String(d.rating || "N/A"))}/5)</div>
                                <div><b>Satisfaction:</b> ${escapeHtml(d.satisfaction || "N/A")}</div>
                                <div><b>Feedback:</b> ${escapeHtml(d.feedback || "No written feedback.")}</div>
                                <div style="font-size:10px; color:#94a3b8; margin-top:4px;">${dateStr}</div>
                            </div>
                        </div>
                    </div>
                `;

                return;
            }

            if (d.type === "text" && d.senderUid) {
                const previous = docs[index - 1];
                const grouped = previous?.type === "text" && previous.senderUid === d.senderUid
                    && chatDayInfo(previous).key === day.key && msgMillis(d) - msgMillis(previous) < 120000;
                html += renderTextBubble(d, user.uid, dateStr, { grouped });
                return;
            }

            html += renderLegacyMessage(d, isOwner, dateStr, replyDateStr);
        });

        const prevTop = listWrap.scrollTop;
        const prevH = listWrap.scrollHeight;
        const wasAtBottom = (prevH - prevTop - listWrap.clientHeight) < 90;

        listWrap.innerHTML = html;

        if (wasAtBottom || prevH === 0) {
            listWrap.scrollTop = listWrap.scrollHeight;
        } else {
            listWrap.scrollTop = prevTop;
        }
};
}


            

// =========================================
// 🚀 SYSTEM PUSH NOTIFICATIONS
// =========================================
window.requestPushPermission = function() {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
        Notification.requestPermission();
    }
};

window.sendSystemNotif = function(title, bodyText) {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, { body: bodyText, icon: "favicon.ico" });
    }
};

// =========================================
// 🔔 REAL-TIME SOUND NOTIFICATION
// =========================================
window.playNotifSound = function () {
    const audio = new Audio('notif.mp3');
    audio.volume = 1.0;
    audio.play().catch(e => console.log("Audio auto-play blocked:", e));
};

// ==========================================
// 🔔 IN-APP NOTIFICATION POPUPS (top-right) + FLOATING ORDER WINDOW
// ==========================================
window.vicinifyNotify = function(title, body) {
    let host = document.getElementById("v-notify-host");
    if (!host) {
        host = document.createElement("div");
        host.id = "v-notify-host";
        document.body.appendChild(host);
    }
    while (host.children.length >= 3) host.firstChild.remove();
    const el = document.createElement("div");
    el.className = "v-notify-card";
    const icon = document.createElement("span");
    icon.className = "v-notify-icon";
    icon.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>';
    const text = document.createElement("span");
    text.className = "v-notify-text";
    const t = document.createElement("b"); t.textContent = title || "Notification";
    const b = document.createElement("span"); b.textContent = body || "";
    text.append(t, b);
    const close = document.createElement("button");
    close.className = "v-notify-close";
    close.type = "button";
    close.setAttribute("aria-label", "Dismiss");
    close.textContent = "×";
    close.onclick = () => el.remove();
    el.append(icon, text, close);
    host.appendChild(el);
    setTimeout(() => { try { el.remove(); } catch (e) {} }, 5000);
};

// Reverse geocoding via OpenStreetMap Nominatim (free, no API key,
// no Firebase cost). User-triggered lookups only (pin drags, button
// taps) — never bulk. Resolves { barangay, city, province, road,
// label } or null on any failure; callers fall back to coordinates.
window.reverseGeocode = async function (lat, lng) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`;
        const res = await fetch(url, { headers: { "Accept": "application/json" } });
        if (!res.ok) return null;
        const data = await res.json();
        const a = data.address || {};
        const cleanBrgy = String(a.village || a.suburb || a.neighbourhood || a.quarter || "").replace(/^Barangay\s+/i, "").trim();
        const city = a.city || a.town || a.municipality || "";
        const province = a.state || "";
        const road = [a.house_number, a.road].filter(Boolean).join(" ").trim();
        const parts = [road, cleanBrgy ? `Brgy. ${cleanBrgy}` : "", city, province].filter(Boolean);
        return { barangay: cleanBrgy, city, province, road, label: parts.join(", ") || data.display_name || "" };
    } catch (e) { return null; }
};

const FLOATING_ORDER_STATES = {
    pending: "Waiting for approval",
    accepted: "Accepted",
    payment_submitted: "Payment sent",
    payment_confirmed: "Payment confirmed",
    preparing: "Preparing your order",
    ready: "Your order is ready",
    ready_for_pickup: "Ready for pickup"
};

const FOW_STATUS_DOTS = {
    pending: "#f97316",
    accepted: "#2563eb",
    payment_submitted: "#d97706",
    payment_confirmed: "#d97706",
    preparing: "#ea580c",
    ready: "#16a34a",
    ready_for_pickup: "#16a34a"
};

window.FloatingOrderWindow = {
    _active: [],
    _open: false,
    render(bookings) {
        let el = document.getElementById("floatingOrderWindow");
        const active = (bookings || [])
            .filter(d => FLOATING_ORDER_STATES[String(d.status || "").toLowerCase()])
            .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        const onDashboard = document.getElementById("page-dashboard")?.classList.contains("active");
        this._active = active;
        if (!active.length || onDashboard || !AppState.user) {
            if (el) el.classList.add("hidden");
            this._open = false;
            this._renderPanel();
            return;
        }
        if (!el) {
            el = document.createElement("button");
            el.id = "floatingOrderWindow";
            el.type = "button";
            el.addEventListener("click", () => window.FloatingOrderWindow.toggle());
            document.body.appendChild(el);
        }
        const latest = active[0];
        el.innerHTML = "";
        const dot = document.createElement("span"); dot.className = "fow-dot";
        const main = document.createElement("span"); main.className = "fow-main";
        const name = document.createElement("b"); name.textContent = latest.placeName || "Your order";
        const sub = document.createElement("span");
        sub.textContent = FLOATING_ORDER_STATES[String(latest.status || "pending").toLowerCase()];
        main.append(name, sub);
        el.append(dot, main);
        if (active.length > 1) {
            const count = document.createElement("span");
            count.className = "fow-count";
            count.textContent = String(active.length);
            el.appendChild(count);
        }
        el.classList.remove("hidden");
        this._renderPanel();
    },
    toggle() {
        this._open = !this._open;
        this._renderPanel();
    },
    _renderPanel() {
        let panel = document.getElementById("floatingOrderPanel");
        if (!this._open || !this._active.length) {
            if (panel) panel.classList.add("hidden");
            return;
        }
        if (!panel) {
            panel = document.createElement("div");
            panel.id = "floatingOrderPanel";
            document.body.appendChild(panel);
            if (!window.__fowOutsideBound) {
                window.__fowOutsideBound = true;
                document.addEventListener("click", (e) => {
                    const p = document.getElementById("floatingOrderPanel");
                    const pill = document.getElementById("floatingOrderWindow");
                    if (p && !p.classList.contains("hidden") && !p.contains(e.target) && !(pill && pill.contains(e.target))) {
                        window.FloatingOrderWindow._open = false;
                        p.classList.add("hidden");
                    }
                });
            }
        }
        panel.innerHTML = "";
        const head = document.createElement("div");
        head.className = "fow-panel-head";
        const title = document.createElement("b");
        title.textContent = `Active Orders (${this._active.length})`;
        const closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.className = "fow-panel-close";
        closeBtn.textContent = "×";
        closeBtn.setAttribute("aria-label", "Close");
        closeBtn.addEventListener("click", () => window.FloatingOrderWindow.toggle());
        head.append(title, closeBtn);
        panel.appendChild(head);
        this._active.forEach(d => {
            const st = String(d.status || "pending").toLowerCase();
            const row = document.createElement("button");
            row.type = "button";
            row.className = "fow-row";
            const dot = document.createElement("span");
            dot.className = "fow-dot";
            dot.style.background = FOW_STATUS_DOTS[st] || "#f97316";
            const main = document.createElement("span");
            main.className = "fow-main";
            const name = document.createElement("b");
            name.textContent = d.placeName || "Your order";
            const sub = document.createElement("span");
            sub.textContent = FLOATING_ORDER_STATES[st] || st;
            main.append(name, sub);
            row.append(dot, main);
            row.addEventListener("click", () => {
                window.FloatingOrderWindow._open = false;
                window.FloatingOrderWindow._renderPanel();
                showPage("page-dashboard");
            });
            panel.appendChild(row);
        });
        const foot = document.createElement("button");
        foot.type = "button";
        foot.className = "fow-panel-foot";
        foot.textContent = "Open My Activity";
        foot.addEventListener("click", () => {
            window.FloatingOrderWindow._open = false;
            window.FloatingOrderWindow._renderPanel();
            showPage("page-dashboard");
        });
        panel.appendChild(foot);
        panel.classList.remove("hidden");
    },
    hide() {
        const el = document.getElementById("floatingOrderWindow");
        if (el) el.classList.add("hidden");
        this._open = false;
        const panel = document.getElementById("floatingOrderPanel");
        if (panel) panel.classList.add("hidden");
    }
};

// ==========================================
// 🔴 REAL-TIME GLOBAL NOTIFICATIONS LOGIC
// ==========================================
window.GlobalNotifier = (() => {
    let unsubs = [];
    // Transition tracking for in-app popups (baselines reset on stop).
    const prevBookingStatus = new Map();
    let prevStampCounts = null;
    // Session cap for customer receipt writes (see markDocsCustomerRead).
    const _customerReadAttempted = new Set();

    function updateBadge(id, count) {
        const badge = document.getElementById(id);
        if (!badge) return;

        const n = Number(count || 0);
        if (n > 0) {
            badge.textContent = n > 9 ? "9+" : String(n);
            badge.classList.remove("hidden");
            badge.style.display = "flex";
        } else {
            badge.textContent = "0";
            badge.classList.add("hidden");
            badge.style.display = "none";
        }
    }

    function hasReadBy(data, fieldName, uid) {
        return Array.isArray(data[fieldName]) && data[fieldName].includes(uid);
    }

    function isOwnerUnreadTransaction(data, uid) {
        if (!uid) return false;
        if (hasReadBy(data, "ownerReadBy", uid)) return false;
        const deletedBy = data.deletedBy || [];
        if (deletedBy.includes(uid) || deletedBy.includes("owner_deleted")) return false;
        return true;
    }

    function isOwnerUnreadMessage(data, uid) {
        if (!uid) return false;
        if (hasReadBy(data, "ownerReadBy", uid)) return false;
        if (data.senderUid === uid || data.createdBy === uid || data.userId === uid) return false;
        const deletedBy = data.deletedBy || [];
        if (deletedBy.includes(uid) || deletedBy.includes("owner_deleted")) return false;
        return true;
    }

    function isCustomerUnreadTransaction(data, uid) {
        if (!uid) return false;
        if (hasReadBy(data, "customerReadBy", uid)) return false;
        const status = String(data.status || data.bookingStatus || "pending").toLowerCase();
        if (status === "pending") return false;
        return true;
    }

    function isCustomerUnreadMessage(data, uid) {
        if (!uid) return false;
        if (hasReadBy(data, "customerReadBy", uid)) return false;
        if (data.senderUid === uid || data.createdBy === uid) return false;
        if (data.reply && String(data.reply).trim() !== "") return true;
        return data.senderUid && data.senderUid !== uid;
    }

    async function markDocsCustomerRead(collectionName, docs) {
        const user = window.auth?.currentUser;
        if (!user || !Array.isArray(docs) || docs.length === 0) return;

        const batch = window.db.batch();
        let writes = 0;
        docs.forEach(doc => {
            if (!doc?.id) return;
            // Guard (mirrors markDocsOwnerRead): never rewrite a doc that
            // already carries this user's read mark — the write carries a
            // fresh serverTimestamp, so an unguarded rewrite re-fires the
            // listener and can feed a write loop.
            if (Array.isArray(doc.customerReadBy) && doc.customerReadBy.includes(user.uid)) return;
            if (_customerReadAttempted.has(collectionName + ":" + doc.id)) return;
            _customerReadAttempted.add(collectionName + ":" + doc.id);
            batch.update(window.db.collection(collectionName).doc(doc.id), {
                customerReadBy: firebase.firestore.FieldValue.arrayUnion(user.uid),
                customerReadAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            writes++;
        });
        if (!writes) return;
        await batch.commit();
    }

    window.setNotifBadge = updateBadge;
    window.isCustomerUnreadTransaction = isCustomerUnreadTransaction;
    window.isCustomerUnreadMessage = isCustomerUnreadMessage;
    window.markDocsCustomerRead = markDocsCustomerRead;

    function refreshDashBadge() {
        const ownerTotal = (window._dashPendingCount || 0) + (window._dashMsgCount || 0);
        const custTotal = (window._settingsTransactionCount || 0) + (window._settingsChatCount || 0);
        // One-tab rule: for standard users, the hub tab carries their counts.
        const total = ownerTotal + (AppState.userProfile?.role === "user" ? custTotal : 0);
        updateBadge("navBadgeDash", total);
    }

    function refreshSettingsBadge() {
        const total = (window._settingsTransactionCount || 0) + (window._settingsChatCount || 0);
        updateBadge("navBadgeSettings", AppState.userProfile?.role === "user" ? 0 : total);
        refreshDashBadge();
    }

    function stop() {
        unsubs.forEach(u => {
            if (typeof u === "function") u();
        });
        unsubs = [];

        window._dashPendingCount = 0;
        window._dashMsgCount = 0;
        window._settingsTransactionCount = 0;
        window._settingsChatCount = 0;

        updateBadge("navBadgeDash", 0);
        updateBadge("navBadgeSettings", 0);
        prevBookingStatus.clear();
        prevStampCounts = null;
        _customerReadAttempted.clear();
        window.FloatingOrderWindow?.hide();
    }

    async function start(user) {
        stop();
        if (!user) return;

        let isCustomerBookingInit = true;
        const custBookUnsub = window.ViciData.customerFeed("bookings", user.uid, snap => {
                let unread = 0;
                let hasNew = false;

                snap.docChanges().forEach(change => {
                    const data = change.doc.data();
                    if (!isCustomerBookingInit && change.type === "added" && isCustomerUnreadTransaction(data, user.uid)) hasNew = true;
                });

                snap.forEach(doc => {
                    if (isCustomerUnreadTransaction(doc.data(), user.uid)) unread++;
                });

                window._settingsTransactionCount = unread;
                refreshSettingsBadge();

                if (hasNew) {
                    window.playNotifSound?.();
                                        window.sendSystemNotif?.("Transaction Update", "A business updated your request.");
                }

                // In-app popups on status transitions + floating order window.
                const docsArr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                window._custBookingDocs = docsArr;
                docsArr.forEach(d => {
                    const prev = prevBookingStatus.get(d.id);
                    if (!isCustomerBookingInit && prev !== undefined && prev !== d.status) {
                        window.vicinifyNotify?.("Order update", `${d.placeName || "Establishment"} — ${String(d.status || "").replace(/_/g, " ").toUpperCase()}`);
                        window.playNotifSound?.();
                    }
                    prevBookingStatus.set(d.id, d.status);
                });
                window.FloatingOrderWindow?.render(docsArr);

                isCustomerBookingInit = false;
            }, err => window.handleFirestoreError(err));
        unsubs.push(custBookUnsub);

        let isCustomerMsgInit = true;
        const custMsgUnsub = window.ViciData.customerFeed("messages", user.uid, snap => {
                let unread = 0;
                let hasNew = false;

                snap.docChanges().forEach(change => {
                    const data = change.doc.data();
                    if (!isCustomerMsgInit && change.type === "added" && isCustomerUnreadMessage(data, user.uid)) hasNew = true;
                });

                snap.forEach(doc => {
                    if (isCustomerUnreadMessage(doc.data(), user.uid)) unread++;
                });
                markIncomingDelivered(snap.docs, user.uid);

                window._settingsChatCount = unread;
                refreshSettingsBadge();

                if (hasNew) {
                    window.playNotifSound?.();
                                        window.sendSystemNotif?.("New Message", "A business sent you a message.");
                }

                // In-app popup when the business replies (unless chat is open).
                snap.docChanges().forEach(change => {
                    const data = change.doc.data();
                    if (!isCustomerMsgInit && change.type === "added" && data.senderRole === "owner") {
                        const chatOpen = !document.getElementById("chatModal")?.classList.contains("hidden");
                        if (!chatOpen) window.vicinifyNotify?.("New message", data.placeName || "Establishment");
                    }
                });

                isCustomerMsgInit = false;
            }, err => window.handleFirestoreError(err));
        unsubs.push(custMsgUnsub);

        // Suki stamp popups: toast when a card's stamp count increases.
        const sukiUnsub = window.db.collection("loyalty_cards")
            .where("customerUid", "==", user.uid)
            .limit(20)
            .onSnapshot(snap => {
                const next = new Map();
                snap.forEach(doc => {
                    const d = doc.data();
                    const stamps = d.stamps ?? d.stampCount ?? 0;
                    next.set(doc.id, stamps);
                    if (prevStampCounts && prevStampCounts.has(doc.id) && stamps > prevStampCounts.get(doc.id)) {
                        const required = d.requiredStamps ?? d.stampsRequired ?? 10;
                        window.vicinifyNotify?.("New stamp", `You now have ${stamps}/${required} stamps.`);
                        window.playNotifSound?.();
                    }
                });
                prevStampCounts = next;
            }, () => {});
        unsubs.push(sukiUnsub);

        // Plain customers own no establishments: skip the owned-places
        // query (and the owner badge listeners) entirely for them.
        if (AppState.userProfile?.role === "user") {
            refreshDashBadge();
            return;
        }

        try {
            const ownedSnap = await window.db.collection("places")
                .where("owner_uid", "==", user.uid)
                .limit(20)
                .get();

            const placeIds = ownedSnap.docs.map(d => d.id);
            if (window.auth?.currentUser?.uid !== user.uid) return;

            const chunks = [];
            for (let i = 0; i < placeIds.length; i += 10) chunks.push(placeIds.slice(i, i + 10));

            const ownerBookingCounts = new Map();
            const ownerMessageCounts = new Map();

            chunks.forEach((chunk, idx) => {
                let isBookInit = true;
                const bookUnsub = window.db.collection("bookings")
                    .where("placeId", "in", chunk)
                    .limit(10)
                    .onSnapshot(snap => {
                        let unread = 0;
                        let hasNew = false;

                        snap.docChanges().forEach(change => {
                            const data = change.doc.data();
                            if (!isBookInit && change.type === "added" && isOwnerUnreadTransaction(data, user.uid)) hasNew = true;
                        });

                        snap.forEach(doc => {
                            if (isOwnerUnreadTransaction(doc.data(), user.uid)) unread++;
                        });

                        ownerBookingCounts.set(idx, unread);
                        window._dashPendingCount = Array.from(ownerBookingCounts.values()).reduce((a, b) => a + b, 0);
                        refreshDashBadge();

                        if (hasNew) {
                            window.vicinifyNotify?.("New transaction", "A customer sent a request.");
                            window.playNotifSound?.();
                                                        window.sendSystemNotif?.("New Transaction", "A customer sent or updated a request.");
                        }

                        isBookInit = false;
                    }, err => window.handleFirestoreError(err));
                unsubs.push(bookUnsub);

                let isMsgInit = true;
                const msgUnsub = window.db.collection("messages")
                    .where("placeId", "in", chunk)
                    .limit(10)
                    .onSnapshot(snap => {
                        let unread = 0;
                        let hasNew = false;

                        snap.docChanges().forEach(change => {
                            const data = change.doc.data();
                            if (!isMsgInit && change.type === "added" && isOwnerUnreadMessage(data, user.uid)) hasNew = true;
                        });

                        snap.forEach(doc => {
                            if (isOwnerUnreadMessage(doc.data(), user.uid)) unread++;
                        });
                        markIncomingDelivered(snap.docs, user.uid);

                        ownerMessageCounts.set(idx, unread);
                        window._dashMsgCount = Array.from(ownerMessageCounts.values()).reduce((a, b) => a + b, 0);
                        refreshDashBadge();

                        if (hasNew) {
                            window.vicinifyNotify?.("New message", "A customer sent you a message.");
                            window.playNotifSound?.();
                                                        window.sendSystemNotif?.("New Customer Message", "A customer sent you a message.");
                        }

                        isMsgInit = false;
                    }, err => window.handleFirestoreError(err));
                unsubs.push(msgUnsub);

                // Owner stamp requests: same global treatment — popup on
                // ANY page, not only while the Business Hub is open.
                let isStampReqInit = true;
                const stampUnsub = window.db.collection("stamp_requests")
                    .where("placeId", "in", chunk)
                    .limit(20)
                    .onSnapshot(snap => {
                        snap.docChanges().forEach(change => {
                            const data = change.doc.data();
                            if (!isStampReqInit && change.type === "added" && (data.status || "pending") === "pending") {
                                window.vicinifyNotify?.("Stamp request", `${data.customerName || "A customer"} is requesting a stamp.`);
                                window.playNotifSound?.();
                                window.sendSystemNotif?.("Stamp request", `${data.customerName || "A customer"} is requesting a stamp.`);
                            }
                        });
                        isStampReqInit = false;
                    }, err => window.handleFirestoreError(err));
                unsubs.push(stampUnsub);
            });
        } catch (e) {
            console.error("Error setting up owner notifications:", e);
        }

        // Admin: live popup when a new establishment is waiting for
        // approval. The first snapshot is the baseline — silent, so old
        // pending places never flood the admin on login.
        if (AppState.userProfile?.role === "admin" || user.uid === "Z45NZhQTgsTUX79WJ5ksCH8N3c02") {
            let isPendingInit = true;
            const pendingUnsub = window.db.collection("places")
                .where("approval_status", "==", "pending")
                .limit(20)
                .onSnapshot(snap => {
                    if (!isPendingInit) {
                        snap.docChanges().forEach(change => {
                            if (change.type === "added") {
                                const d = change.doc.data();
                                const placeName = d.name || "An establishment";
                                window.vicinifyNotify?.("New establishment", `${placeName} is waiting for approval.`);
                                window.playNotifSound?.();
                                window.sendSystemNotif?.("New establishment", `${placeName} is waiting for approval.`);
                            }
                        });
                    }
                    isPendingInit = false;
                }, err => window.handleFirestoreError(err));
            unsubs.push(pendingUnsub);
        }
    }

    return {
        start,
        stop,
        refreshDashBadge,
        refreshSettingsBadge,
        updateBadge,
        isCustomerUnreadTransaction,
        isCustomerUnreadMessage,
        markDocsCustomerRead
    };
})();

// =========================================
// ❤️ GLOBAL FAVORITES LOGIC
// =========================================
window.toggleFavorite = async function (placeId, btn) {
    const user = window.auth?.currentUser;
    if (!user) return window.alert("Please log in to save favorites.");

    if (!user.emailVerified) {
        const ans = await window.vConfirm(
            "Account Not Verified", 
            "You must verify your email address to save favorites. Would you like us to resend the verification link?", 
            "Resend Link", 
            false
        );
        if (ans) window.resendVerificationEmail();
        return;
    }

    const userId = user.uid;
    const favRef = window.db.collection("favorites").doc(`${userId}_${placeId}`);

    try {
        const doc = await favRef.get();
        if (doc.exists) {
            await favRef.delete();
            if (btn) btn.classList.remove("active");
            window.alert("Removed from favorites.");
        } else {
            const placeSnap = await window.db.collection("places").doc(placeId).get();
const placeData = placeSnap.exists ? placeSnap.data() : {};

await favRef.set({
    userId,
    placeId,

    placeName: placeData.name || "Unknown Establishment",
    placeAddress: placeData.address || placeData.addr || placeData.brgy || placeData.barangay || "Lipa City",
    placeCategory: placeData.category || placeData.cat || "default",

    createdAt: firebase.firestore.FieldValue.serverTimestamp()
});
            if (btn) btn.classList.add("active");
            window.alert("Successfully added to favorites!");
        }
    } catch (e) {
        console.error("Favorite Error:", e);
        window.alert("Error updating favorites. Please try again later.");
    }
};

// =========================================
// ⭐ GLOBAL RATING LOGIC (WITH ANTI-SPAM)
// =========================================
let isRatingProcessing = false;

window.submitRating = async function (placeId, score) {
    if (isRatingProcessing) return;
    isRatingProcessing = true;
    try {
        await window.ViciData.command("review", { placeId, rating: score, isPublic: true });
        window.invalidatePlacesCache?.();
        window.showToast?.("Rating saved.", "success");
        await window.viewPlace(placeId);
    } catch (error) { window.showToast?.(error.message, "error"); }
    finally { isRatingProcessing = false; }
};

// =========================================
// 📋 CONNECTED LIST VIEW RENDERER (PREMIUM UI V2)
// =========================================
window.renderListView = function(filteredPlaces) {
    const listContainer = document.getElementById("listViewContainer");
    if (!listContainer) return;

    listContainer._places = new Map((filteredPlaces || []).map(place => [String(place.id), place]));
    if (!filteredPlaces || filteredPlaces.length === 0) {
        listContainer.innerHTML = `<div class="muted" style="text-align:center; padding: 2rem;" data-i18n="No establishments found. Try adjusting the search radius or category.">No establishments found. Try adjusting the search radius or category.</div>`;
        return;
    }

    const fmtDist = (m) => (m == null || isNaN(m)) ? "Nearby" : (m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`);

    let html = '';
    filteredPlaces.forEach(place => {
        let distText = fmtDist(place._distance);
        const freshness = window.getViciFreshnessStatus?.(place) || { className: "freshness-active", label: "Fresh", shortLabel: "Fresh", tone: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" };

        let statusText = "Closed";
        let statusColor = "#475569";
        let statusBorder = "#e2e8f0";
        let statusBg = "#f8fafc";
        let statusDot = "#94a3b8";
        if (place.status === 'open') {
            statusText = "Open"; statusColor = "#16a34a"; statusBorder = "#bbf7d0"; statusBg = "#f0fdf4"; statusDot = "#22c55e";
        } else if (place.status === 'busy') {
            statusText = "Busy"; statusColor = "#b45309"; statusBorder = "#fef08a"; statusBg = "#fefce8"; statusDot = "#eab308";
        }

        let coverImg = place.coverPhoto ? place.coverPhoto : (place.photos && place.photos.length > 0 ? place.photos[0] : null);
        coverImg = safeImageUrl(coverImg);
        let imgHtml = coverImg
            ? `<img src="${escapeHtml(coverImg)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" loading="lazy" onerror="this.remove()" />`
            : `<div style="width: 100%; height: 100%; background: #f1f5f9; border-radius: 8px; display: flex; align-items: center; justify-content: center;"><i data-lucide="map-pin" style="color: #cbd5e1; width: 28px; height: 28px;"></i></div>`;

        let ratingHtml = place.avgRating
            ? `<div style="display: flex; align-items: center; gap: 4px; font-size: 12px; color: #d97706; font-weight: 700;">
                <i data-lucide="star" style="width: 12px; height: 12px; fill: #f59e0b; color:#f59e0b;"></i> ${escapeHtml(String(place.avgRating))} <span style="color: #94a3b8; font-weight: normal;">(${escapeHtml(String(place.reviewCount || 0))})</span>
               </div>`
            : `<div style="font-size: 11px; color: #94a3b8;">No ratings yet</div>`;

        // FIX ONLY: never show a raw ID/number or the literal word "ADDRESS" as the address
        const rawAddr = String(place.address || place.brgy || place.barangay || "").trim();
        const addrLooksId = /^[a-zA-Z0-9_-]{20,}$/.test(rawAddr) && /[0-9_-]/.test(rawAddr);
        const addrText = (!rawAddr || addrLooksId || rawAddr.toLowerCase() === "address") ? "Lipa City" : rawAddr;

        html += `
        <div class="est-card place-list-card ${freshness.className}" style="background: white; border: 1px solid #fde047; border-radius: 12px; padding: 16px; margin: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); display: flex; flex-direction: column; gap: 16px; cursor: pointer;" data-place-card="${escapeHtml(place.id)}">
            <div class="place-list-summary" style="display: flex; gap: 16px; position: relative;">
                <div class="place-list-thumbnail" style="position: relative; width: 72px; height: 72px; flex-shrink: 0; border-radius: 8px; border: 1px solid #f1f5f9;">
                    ${imgHtml}
                    <button type="button" class="place-list-action" data-action="favorite" data-place-id="${escapeHtml(place.id)}" aria-label="Save establishment" style="position: absolute; top: -6px; right: -6px; background: #facc15; border: 2px solid white; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <i data-lucide="star" style="width: 12px; height: 12px; fill: white; color: white;"></i>
                    </button>
                </div>
                <div class="place-list-info" style="flex: 1; min-width: 0;">
                    <div class="place-list-heading" style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${escapeHtml(place.name)} ${place.is_verified ? `<i data-lucide="badge-check" style="width: 16px; height: 16px; color: #3b82f6;"></i>` : ''}
                        </h3>
                        <i data-lucide="chevron-right" style="width: 18px; height: 18px; color: #cbd5e1; flex-shrink: 0;"></i>
                    </div>
                    <div class="place-list-meta" style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                        <div style="font-size: 13px; color: #64748b; text-transform: capitalize;">${escapeHtml(place.category || place.cat || "")}</div>
                        <div style="width: 3px; height: 3px; border-radius: 50%; background: #cbd5e1;"></div>
                        ${ratingHtml}
                        <button type="button" class="place-list-action place-list-menu-trigger" data-action="menu" data-place-id="${escapeHtml(place.id)}"><i data-lucide="book-open"></i> Menu</button>
                    </div>
                    <div class="place-list-badges" style="display: flex; align-items: center; gap: 12px; margin-top: 8px;">
                        <span class="place-list-status is-${place.status === 'open' ? 'open' : place.status === 'busy' ? 'busy' : 'closed'}" style="display: inline-flex; align-items: center; gap: 6px; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 600; border: 1px solid ${statusBorder}; color: ${statusColor}; background: ${statusBg};">
                            <span style="width: 6px; height: 6px; border-radius: 50%; background: ${statusDot};"></span>
                            <span data-i18n="${statusText}">${statusText}</span>
                        </span>
                        <span style="font-size: 12px; color: #64748b; display: flex; align-items: center; gap: 4px;">
                            <i data-lucide="map-pin" style="width: 12px; height: 12px;"></i> ${distText}
                        </span>
                        <span class="vici-freshness-badge ${freshness.className}" title="${escapeHtml(freshness.label)}" style="background:${freshness.bg}; border-color:${freshness.border}; color:${freshness.tone};">
                            <i data-lucide="${freshness.isInactive ? 'pause-circle' : freshness.level === 'active' ? 'check-circle-2' : 'alert-triangle'}"></i>
                            ${escapeHtml(freshness.shortLabel)}
                        </span>
                    </div>
                    <div class="place-list-address" style="font-size: 11px; color: #94a3b8; margin-top: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">
                        ${escapeHtml(addrText)}
                    </div>
                </div>
            </div>
            <div class="place-list-actions" style="display: flex; gap: 8px;">
                <button type="button" class="place-list-action" data-action="chat" data-place-id="${escapeHtml(place.id)}" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border-radius: 8px; background: white; border: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 600; cursor: pointer;">
                    <i data-lucide="message-square" style="width: 14px; height: 14px;"></i> <span data-i18n="Chat">Chat</span>
                </button>
                <button type="button" class="place-list-action" data-action="booking" data-place-id="${escapeHtml(place.id)}" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border-radius: 8px; background: white; border: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 600; cursor: pointer;">
                    <i data-lucide="calendar" style="width: 14px; height: 14px;"></i> <span data-i18n="Request">Request</span>
                </button>
                <button type="button" class="place-list-action" data-action="route" data-place-id="${escapeHtml(place.id)}" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border-radius: 8px; background: #2563eb; border: none; color: white; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 6px rgba(37, 99, 235, 0.2);">
                    <i data-lucide="send" style="width: 14px; height: 14px;"></i> <span data-i18n="Navigate">Navigate</span>
                </button>
            </div>
        </div>
        `;
    });

    listContainer.innerHTML = html;
    window.PlacePreview?.syncSelection?.();
    if (!listContainer.dataset.actionsBound) {
        listContainer.dataset.actionsBound = "true";
        listContainer.addEventListener("click", (event) => {
            const button = event.target.closest(".place-list-action");
            const card = event.target.closest("[data-place-card]");
            const place = listContainer._places.get(button?.dataset.placeId || card?.dataset.placeCard);
            event.stopPropagation();
            if (!place) return;
            if (!button) { window.viewPlace(place.id); return; }
            if (button.dataset.action === "menu") window.PlacePreview?.open(place);
            if (button.dataset.action === "favorite") window.toggleFavorite(place.id, button);
            if (button.dataset.action === "chat") window.openChatModal(place.id, place.name || "Establishment");
            if (button.dataset.action === "booking") window.openBookingModal(place.id, place.name || "Establishment");
            if (button.dataset.action === "route") {
                const latitude = Number(place.lat), longitude = Number(place.lng);
                if (Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) {
                    window.PlacePreview?.close?.();
                    window.toggleView?.("map");
                    window.routeToPlace(latitude, longitude, place.name || "Establishment");
                }
                else window.showToast?.("This establishment has no valid map location.", "error");
            }
        });
    }
    if (window.lucide) window.debouncedIcons?.();
    window.LangManager?.translateDOM?.();
};

// =========================================
// ☁️ FIREBASE STORAGE UPLOADER
// =========================================
window.uploadFileToStorage = async function(file, folderName) {
    if (!file) return null;
    
    try {
        const uniqueFileName = `${folderName}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
        const storageRef = window.storage.ref().child(uniqueFileName);
        
        const snapshot = await storageRef.put(file);
        
        const downloadURL = await snapshot.ref.getDownloadURL();
        return downloadURL;
    } catch (error) {
        console.error("Storage Upload Error: ", error);
        throw error;
    }
};



window.compressImageFile = function(file, maxWidth = 900, quality = 0.8) {
    return new Promise((resolve, reject) => {
        if (!file || !file.type || !file.type.startsWith("image/")) {
            reject(new Error("Only image files are supported."));
            return;
        }

        const reader = new FileReader();
        reader.onerror = () => reject(new Error("File read error."));
        reader.onload = (event) => {
            const img = new Image();
            img.onerror = () => reject(new Error("Image could not be loaded."));
            img.onload = () => {
                const scale = Math.min(1, maxWidth / img.width);
                const canvas = document.createElement("canvas");
                canvas.width = Math.max(1, Math.round(img.width * scale));
                canvas.height = Math.max(1, Math.round(img.height * scale));
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error("Image compression failed."));
                        return;
                    }
                    resolve({ blob, dataUrl: canvas.toDataURL("image/jpeg", quality) });
                }, "image/jpeg", quality);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
};

window.uploadImageFileToStorage = async function(file, folderName, options = {}) {
    const maxWidth = options.maxWidth || 900;
    const quality = options.quality || 0.8;
    const { blob, dataUrl } = await window.compressImageFile(file, maxWidth, quality);

    try {
        const baseName = String(file.name || "image.jpg").replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_") || "image";
        const uniqueFileName = `${folderName}/${Date.now()}_${Math.random().toString(36).slice(2)}_${baseName}.jpg`;
        const storageRef = window.storage.ref().child(uniqueFileName);
        const snapshot = await storageRef.put(blob, {
            contentType: "image/jpeg",
            cacheControl: "public,max-age=31536000"
        });
        return await snapshot.ref.getDownloadURL();
    } catch (error) {
        // Small fallback only. A large base64 string inside a Firestore
        // document bloats every query and can hit the 1MB doc limit.

        throw new Error("Photo upload failed. Please check your connection and try again.");
    }
};



/* ============================================================
   SUKI CARD (loyalty stamp card) — shared module
   One renderer reused by: Business Hub studio preview, the
   place page, and the customer wallet. Card CSS lives in the
   "SUKI CARD" block of css/style.css.

   Flow (Owner-tap, locked design):
   Customer scans the establishment QR with Vicinify Scan
   (live camera only, rotating ~10s token, DEMO-GRADE; location
   verified within 200 m of the store) -> request appears in
   // the owner's Business Hub as "{customer} is requesting a stamp"
   // with [Approve] -> stamp lands on the customer card
   -> full card turns gold -> customer [Claim reward] -> owner
   marks claimed.

   The QR token rotates every ~10s and is validated by
   recomputing the time window in JS (demo-grade, not a server
   check) — see sukiMakeToken / sukiTokenValid.
   ============================================================ */
window.SukiDesign = (() => {
    const TEMPLATES = {
        kraft:    { label: "Kraft",           colorMode: "solid",    color: "#a0714f", gradId: "sunset",   gradFrom: "#a0714f", gradTo: "#c49a6c", pattern: "beans" },
        minimal:  { label: "Minimal White",   colorMode: "solid",    color: "#f8fafc", gradId: "ocean",    gradFrom: "#ffffff", gradTo: "#e2e8f0", pattern: "dots" },
        midnight: { label: "Midnight",        colorMode: "gradient", color: "#0f172a", gradId: "midnight", gradFrom: "#0f172a", gradTo: "#475569", pattern: "lines" },
        pastel:   { label: "Sorbetes Pastel", colorMode: "gradient", color: "#f9a8d4", gradId: "custom",   gradFrom: "#fbcfe8", gradTo: "#bae6fd", pattern: "stars" },
        ginto:    { label: "Ginto",           colorMode: "gradient", color: "#0f172a", gradId: "ginto",    gradFrom: "#0f172a", gradTo: "#d4a017", pattern: "watermark" },
        custom:   { label: "Custom",          colorMode: "solid",    color: "#f59e0b", gradId: "sunset",   gradFrom: "#f97316", gradTo: "#ef4444", pattern: "none" }
    };
    const GRADIENTS = {
        sunset:   { label: "Sunset",   from: "#f97316", to: "#ef4444" },
        ocean:    { label: "Ocean",    from: "#0ea5e9", to: "#2563eb" },
        matcha:   { label: "Matcha",   from: "#84cc16", to: "#16a34a" },
        berry:    { label: "Berry",    from: "#ec4899", to: "#8b5cf6" },
        ginto:    { label: "Ginto",    from: "#0f172a", to: "#d4a017" },
        midnight: { label: "Midnight", from: "#0f172a", to: "#475569" }
    };
    const PATTERNS = {
        none: "None", dots: "Dots", waves: "Waves", lines: "Lines",
        stars: "Stars", beans: "Beans", watermark: "Watermark"
    };
    // Lucide names. "" = auto (category default icon).
    const ICONS = ["", "star", "heart", "gift", "badge-check", "sparkles"];
    return { TEMPLATES, GRADIENTS, PATTERNS, ICONS };
})();

window.Suki = (() => {
    const D = window.SukiDesign;
    const TOKEN_WINDOW_MS = 10000; // ~10s rotating window (demo-grade)

    function sukiEsc(str) {
        if (str == null) return "";
        return String(str).replace(/[&<>"']/g, s => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[s]));
    }

    function catDefault(place) {
        const cat = String(place.category || place.cat || "default").toLowerCase();
        if (typeof window.vicinifyCatConfig === "function") {
            const c = window.vicinifyCatConfig(cat);
            if (c) return c;
        }
        return { color: "#f59e0b", icon: "star" };
    }

    // Normalized design object from a place doc. Owner override wins;
    // falls back to the establishment's category icon/color.
    function designOf(place) {
        const p = place || {};
        const cat = catDefault(p);
        const gradPreset = D.GRADIENTS[p.suki_gradient] || null;
        return {
            enabled: !!p.suki_enabled,
            stampCount: Math.max(2, Math.min(24, parseInt(p.suki_stamp_count, 10) || 8)),
            reward: String(p.suki_reward || "Free reward").slice(0, 120),
            icon: String(p.suki_icon || cat.icon || "star"),
            template: String(p.suki_template || "custom"),
            colorMode: p.suki_color_mode === "gradient" ? "gradient" : "solid",
            color: String(p.suki_color || cat.color || "#f59e0b"),
            gradId: String(p.suki_gradient || "sunset"),
            gradFrom: String(p.suki_gradient_from || (gradPreset && gradPreset.from) || "#f97316"),
            gradTo: String(p.suki_gradient_to || (gradPreset && gradPreset.to) || "#ef4444"),
            pattern: String(p.suki_pattern || "none"),
            placeName: String(p.name || "Establishment")
        };
    }

    // Pick white or near-black text by background lightness. Fixed
    // layout + this auto-switch keeps card text readable on any design.
    function textTone(hex) {
        let h = String(hex || "").replace("#", "").trim();
        if (/^[0-9a-fA-F]{3}$/.test(h)) h = h.split("").map(c => c + c).join("");
        if (!/^[0-9a-fA-F]{6}$/.test(h)) return "#ffffff";
        const r = parseInt(h.slice(0, 2), 16) / 255;
        const g = parseInt(h.slice(2, 4), 16) / 255;
        const b = parseInt(h.slice(4, 6), 16) / 255;
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        return lum > 0.6 ? "#0f172a" : "#ffffff";
    }

    function customerDisplayName() {
        const user = window.auth?.currentUser;
        if (!user) return "Customer";
        return (typeof AppState !== "undefined" && AppState.userProfile?.fullName)
            || user.displayName || "Customer";
    }

    /* ---------- shared 3D card renderer ---------- */
    function renderCard(place, card, opts) {
        opts = opts || {};
        const d = designOf(place);
        const stamps = Math.max(0, parseInt(card && card.stamps, 10) || 0);
        const full = stamps >= d.stampCount;
        const baseForTone = full ? "#d4a017" : (d.colorMode === "gradient" ? d.gradFrom : d.color);
        const tone = textTone(baseForTone);
        const toneCls = tone === "#ffffff" ? "suki-on-dark" : "suki-on-light";
        const bg = full
            ? "linear-gradient(135deg,#7c5a00 0%,#d4a017 22%,#ffedb0 50%,#d4a017 78%,#7c5a00 100%)"
            : (d.colorMode === "gradient"
                ? `linear-gradient(135deg, ${d.gradFrom} 0%, ${d.gradTo} 100%)`
                : d.color);
        const cardId = (card && (card.cardId || card.id)) || "";
        const custName = (card && card.customerName) || "";
        const claimed = !!(card && card.claimed);
        const claimReq = !!(card && card.claimRequested);

        let slots = "";
        for (let i = 0; i < d.stampCount; i++) {
            slots += `<span class="suki-slot ${i < stamps ? "got" : ""}"><i data-lucide="${sukiEsc(d.icon)}"></i></span>`;
        }
        const remaining = d.stampCount - stamps;
        const watermarkFront = d.pattern === "watermark"
            ? `<i data-lucide="${sukiEsc(d.icon)}" class="suki-watermark"></i>` : "";
        // The back face always carries the large faint watermark icon.
        const watermarkBack = `<i data-lucide="${sukiEsc(d.icon)}" class="suki-watermark"></i>`;
        const statusText = claimed ? "Claimed ✔"
            : claimReq ? "Claim pending — waiting for the owner"
            : full ? "Full! Claim it now 🎁" : "Not yet full";
        const claimBtn = (full && !claimed && !claimReq && !opts.hideActions)
            ? `<button type="button" class="suki-claim-btn" data-suki-claim="${sukiEsc(cardId)}"><i data-lucide="gift"></i> Claim reward</button>`
            : "";

        return `
        <div class="suki-3d" data-suki-card>
            <div class="suki-flip">
                <div class="suki-face suki-front ${toneCls}" style="background:${sukiEsc(bg)}; color:${tone};">
                    <div class="suki-pattern suki-pattern-${sukiEsc(d.pattern)}"></div>
                    ${watermarkFront}
                    <div class="suki-shine"></div>
                    <div class="suki-content">
                        <div class="suki-top">
                            <span class="suki-badge-icon"><i data-lucide="${sukiEsc(d.icon)}"></i></span>
                            <span class="suki-name">${sukiEsc(d.placeName)}</span>
                            ${full ? `<span class="suki-gold-tag">GOLD</span>` : ""}
                        </div>
                        <div class="suki-stamps">${slots}</div>
                        <div class="suki-progress"><b>${stamps} / ${d.stampCount}</b> stamps</div>
                        <div class="suki-reward"><span><i data-lucide="gift"></i></span><span>${sukiEsc(d.reward)}</span></div>
                        <div class="suki-remaining">${full ? "Card is full!" : `${remaining} more stamp${remaining === 1 ? "" : "s"} to go`}</div>
                    </div>
                    <button type="button" class="suki-flip-btn" data-suki-flip title="Flip" aria-label="Flip card"><i data-lucide="rotate-3d"></i></button>
                </div>
                <div class="suki-face suki-back ${toneCls}" style="background:${sukiEsc(bg)}; color:${tone};">
                    <div class="suki-pattern suki-pattern-${sukiEsc(d.pattern)}"></div>
                    ${watermarkBack}
                    <div class="suki-shine"></div>
                    <div class="suki-content suki-back-content">
                        <div class="suki-back-title">Suki Card</div>
                        <div class="suki-back-row"><span>Reward</span><b><i data-lucide="gift" style="width:14px;height:14px;vertical-align:-2px;"></i> ${sukiEsc(d.reward)}</b></div>
                        <div class="suki-back-row"><span>Card ID</span><b class="suki-mono">${sukiEsc(cardId || "—")}</b></div>
                        <div class="suki-back-row"><span>Owner</span><b>${sukiEsc(custName || "—")}</b></div>
                        <div class="suki-back-row"><span>Status</span><b>${sukiEsc(statusText)}</b></div>
                        ${claimBtn}
                    </div>
                    <button type="button" class="suki-flip-btn" data-suki-flip title="Back" aria-label="Flip card back"><i data-lucide="rotate-3d"></i></button>
                </div>
            </div>
            <div class="suki-shadow"></div>
        </div>`;
    }

    /* ---------- 3D interaction: pointer-drag rotate (clamped) + flip ---------- */
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

    function attachInteraction(root) {
        if (!root) return;
        // Cute hover feel: idle float is disabled for users who prefer reduced motion.
        const reducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
        root.querySelectorAll("[data-suki-card]").forEach(el => {
            if (el._sukiBound) return;
            el._sukiBound = true;
            const flip = el.querySelector(".suki-flip");
            const shadow = el.querySelector(".suki-shadow");
            if (!flip) return;
            const faceFront = flip.querySelector(".suki-face:not(.suki-back)");
            const faceBack = flip.querySelector(".suki-face.suki-back");
            flip.style.transition = "none"; // all motion is JS-driven now (rAF)
            let dragging = false, sx = 0, sy = 0;
            let baseTarget = 0, baseCur = 0;      // flip state: 0 = front, 180 = back
            let ry = 0, rx = 0;                  // current tilt (deg), clamped
            let vry = 0, vrx = 0;                // release momentum (deg/frame)
            let tRy = 0, tRx = 0;                // drag targets
            let relVry = 0, relVrx = 0;          // smoothed pointer velocity
            let lastTRy = 0, lastTRx = 0;
            let idlePhase = Math.random() * Math.PI * 2; // per-card phase offset
            let idleResumeAt = 0;
            let prevT = 0;
            const paint = (bobY, sway) => {
                const rotY = baseCur + ry + sway;
                flip.style.transform = "translateY(" + bobY.toFixed(2) + "px) rotateY(" + rotY.toFixed(2) + "deg) rotateX(" + rx.toFixed(2) + "deg)";
                // Explicit face visibility: bulletproof on browsers where
                // backface-visibility is ignored (mirrored-card bug).
                const norm = ((rotY % 360) + 360) % 360;
                const showBack = norm > 90 && norm < 270;
                if (faceFront) faceFront.style.visibility = showBack ? "hidden" : "visible";
                if (faceBack) faceBack.style.visibility = showBack ? "visible" : "hidden";
            };
            const tick = (now) => {
                if (!el.isConnected) return; // card was re-rendered away — stop this loop
                requestAnimationFrame(tick);
                const dt = Math.max(0.25, Math.min(3, (now - (prevT || now)) / 16.667));
                prevT = now;
                if (dragging) {
                    // eased chase of the pointer — smooth, no jitter
                    const k = 1 - Math.pow(0.60, dt);
                    ry += (tRy - ry) * k;
                    rx += (tRx - rx) * k;
                } else {
                    // momentum glide, then a gentle spring back to rest
                    ry += vry * dt; rx += vrx * dt;
                    const fr = Math.pow(0.90, dt);
                    vry *= fr; vrx *= fr;
                    const pull = 1 - Math.pow(0.94, dt);
                    ry += (0 - ry) * pull; rx += (0 - rx) * pull;
                    if (Math.abs(vry) < 0.02 && Math.abs(ry) < 0.05) { vry = 0; ry = 0; }
                    if (Math.abs(vrx) < 0.02 && Math.abs(rx) < 0.05) { vrx = 0; rx = 0; }
                }
                // smooth flip animation toward the target face
                const bk = 1 - Math.pow(0.78, dt);
                baseCur += (baseTarget - baseCur) * bk;
                if (Math.abs(baseTarget - baseCur) < 0.1) baseCur = baseTarget;
                // idle hover: soft bob + subtle sway + breathing shadow + drifting shine
                let bobY = 0, sway = 0, bobK = 0.5;
                const settled = !dragging && ry === 0 && rx === 0 && vry === 0 && vrx === 0;
                if (settled && !reducedMotion && now >= idleResumeAt) {
                    idlePhase += 0.022 * dt;
                    const s = Math.sin(idlePhase);
                    bobY = s * 5;
                    sway = 0;
                    bobK = (s + 1) / 2;
                    el.style.setProperty("--sx", (50 + Math.sin(idlePhase * 0.9) * 16).toFixed(1) + "%");
                    el.style.setProperty("--sy", (40 + Math.cos(idlePhase * 0.55) * 12).toFixed(1) + "%");
                }
                if (shadow) {
                    shadow.style.opacity = (0.30 + bobK * 0.22).toFixed(3);
                    shadow.style.transform = "translateX(-50%) scaleX(" + (1 - bobK * 0.14).toFixed(3) + ")";
                }
                paint(bobY, sway);
            };
            requestAnimationFrame(tick);
            el.addEventListener("pointerdown", e => {
                if (e.target.closest("[data-suki-flip],[data-suki-claim],button,a")) return;
                dragging = true; sx = e.clientX; sy = e.clientY;
                lastTRy = tRy = ry; lastTRx = tRx = rx; relVry = 0; relVrx = 0;
                flip.classList.add("suki-dragging");
                try { el.setPointerCapture(e.pointerId); } catch (_) {}
            });
            el.addEventListener("pointermove", e => {
                if (!dragging) return;
                tRy = clamp((e.clientX - sx) / 6, -40, 40);
                tRx = clamp(-(e.clientY - sy) / 6, -25, 25);
                relVry = relVry * 0.65 + (tRy - lastTRy) * 0.35;
                relVrx = relVrx * 0.65 + (tRx - lastTRx) * 0.35;
                lastTRy = tRy; lastTRx = tRx;
                const r = el.getBoundingClientRect();
                el.style.setProperty("--sx", (((e.clientX - r.left) / r.width) * 100).toFixed(1) + "%");
                el.style.setProperty("--sy", (((e.clientY - r.top) / r.height) * 100).toFixed(1) + "%");
            });
            const end = () => {
                if (!dragging) return;
                dragging = false;
                // no fling: stop dead and ease cleanly back to rest
                vry = 0; vrx = 0;
                flip.classList.remove("suki-dragging");
                idleResumeAt = performance.now() + 900; // settle first, then hover resumes
            };
            el.addEventListener("pointerup", end);
            el.addEventListener("pointercancel", end);
            el.querySelectorAll("[data-suki-flip]").forEach(b => {
                b.addEventListener("click", ev => {
                    ev.stopPropagation();
                    el.classList.toggle("is-flipped");
                    baseTarget = el.classList.contains("is-flipped") ? 180 : 0;
                });
            });
        });
        root.querySelectorAll("[data-suki-claim]").forEach(btn => {
            if (btn._sukiBound) return;
            btn._sukiBound = true;
            btn.addEventListener("click", () => requestClaim(btn.getAttribute("data-suki-claim")));
        });
        root.querySelectorAll("[data-suki-cancel-req]").forEach(btn => {
            if (btn._sukiBound) return;
            btn._sukiBound = true;
            btn.addEventListener("click", () => cancelRequest(btn.getAttribute("data-suki-cancel-req")));
        });
        window.debouncedIcons?.();
    }

    /* ---------- rotating QR token (demo-grade) ---------- */
    function tokenWindow(nowMs) { return Math.floor((nowMs || Date.now()) / TOKEN_WINDOW_MS); }
    // Token format: VICINIFY-SUKI|<placeId>|<windowId>
    function makeToken(placeId, nowMs) { return `VICINIFY-SUKI|${placeId}|${tokenWindow(nowMs)}`; }
    function parseToken(str) {
        const m = /^VICINIFY-SUKI\|([^|]+)\|(\d+)$/.exec(String(str || "").trim());
        if (!m) return null;
        return { placeId: m[1], windowId: parseInt(m[2], 10) };
    }
    // DEMO-GRADE validation: recompute the time window in JS (allows
    // the previous window for clock skew). NOT a server-side check.
    function tokenValid(parsed, nowMs) {
        if (!parsed || !parsed.placeId || !Number.isFinite(parsed.windowId)) return false;
        const cur = tokenWindow(nowMs);
        return parsed.windowId === cur || parsed.windowId === cur - 1;
    }

    function loadScriptOnce(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[data-suki-lib="${src}"]`)) return resolve();
            const s = document.createElement("script");
            s.src = src;
            s.async = true;
            s.setAttribute("data-suki-lib", src);
            s.onload = () => resolve();
            s.onerror = () => reject(new Error("Failed to load " + src));
            document.head.appendChild(s);
        });
    }
    const QR_LIB = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    const JSQR_LIB = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";

    // Owner-side: rotating QR display. The timer is module-level, not
    // element-tracked: mountPlaceSection replaces the [data-suki-qr]
    // element via innerHTML on every visit, which orphaned the timer
    // on the destroyed element — one leaked 1s interval per visit,
    // the reported establishment-page lag. (v53 lag fix)
    let ownerQrTimer = null;
    let ownerQrGen = 0;
    async function renderOwnerQr(el, placeId) {
        if (!el || !placeId) return;
        const gen = ++ownerQrGen;
        if (ownerQrTimer) { clearInterval(ownerQrTimer); ownerQrTimer = null; }
        el.innerHTML = `<div class="suki-qr-box">
            <div class="suki-qr-img"><div class="muted" style="padding:30px;">Loading QR…</div></div>
            <div class="suki-qr-token"></div>
            <div class="suki-qr-count muted" style="font-size:12px; margin-top:4px;"></div>
        </div>`;
        try { await loadScriptOnce(QR_LIB); }
        catch (e) {
            el.querySelector(".suki-qr-img").innerHTML = `<div class="muted" style="padding:20px; font-size:13px;">Could not load the QR library.<br>Token: <b>${sukiEsc(makeToken(placeId))}</b></div>`;
            return;
        }
        const box = el.querySelector(".suki-qr-img");
        const paint = () => {
            box.innerHTML = "";
            const token = makeToken(placeId);
            try { new window.QRCode(box, { text: token, width: 180, height: 180, correctLevel: window.QRCode.CorrectLevel.M }); }
            catch (e) { box.textContent = token; }
            el.querySelector(".suki-qr-token").textContent = token;
        };
        let lastWindow = tokenWindow();
        const tick = () => {
            const w = tokenWindow();
            if (w !== lastWindow) { lastWindow = w; paint(); }
            const left = 10 - Math.floor(Date.now() / 1000) % 10;
            const countEl = el.querySelector(".suki-qr-count");
            if (countEl) countEl.textContent = `Token refreshes every 10s • ${left}s left`;
        };
        if (gen !== ownerQrGen) return; // superseded: a newer mount/unmount won the race
        paint();
        ownerQrTimer = setInterval(tick, 1000);
        tick();
    }

    /* ---------- place-page unmount: stop the rotating QR timer ----------
       WHY this exists: the owner-view QR was rendered into a div via innerHTML
       on every place-page visit, and the 1s refresh interval was stored on that
       div (el._sukiQrTimer). When innerHTML destroyed the div, the interval
       survived as an orphan — one leaked timer per visit, each repainting a
       full QRCode into detached DOM every 10s. The timer is now module-scoped
       with a generation counter: re-mounting increments the generation so stale
       async mounts abort, and unmounting clears the interval outright. */
    function unmountPlaceSection() {
        ownerQrGen++;
        if (ownerQrTimer) { clearInterval(ownerQrTimer); ownerQrTimer = null; }
        if (window.SukiPlaceRefresh) window.SukiPlaceRefresh = null;
    }

    /* ---------- stamp request / claim flows ---------- */
    async function createCardDocIfMissing(place) {
        const user = window.auth?.currentUser;
        if (!user || !place || !place.id) return;
        const cardId = `${place.id}_${user.uid}`;
        try {
            // Rules let the customer create their own card doc on first
            // request (deterministic ID). merge:true keeps it idempotent.
            await window.db.collection("loyalty_cards").doc(cardId).set({
                placeId: place.id,
                customerUid: user.uid,
                customerName: customerDisplayName(),
                stamps: 0,
                claimed: false,
                claimRequested: false,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (err) {
            // Non-fatal: the owner approval still creates the card.
            // Swallow permission-denied quietly: on repeat requests the doc
            // already exists and customers may only touch claim fields.
            if (err && err.code !== "permission-denied") window.handleFirestoreError(err);
            else console.warn("[suki] card doc ensure skipped:", (err && err.code) || err);
        }
    }

    async function requestStamp(place) {
        const user = window.auth?.currentUser;
        if (!user) { if (typeof showPage === "function") showPage("page-login"); return; }
        if (!place || !place.id) return;
        if (place.owner_uid && place.owner_uid === user.uid) {
            window.showToast?.("This is your own store — you can't request a stamp from yourself.", "error");
            return;
        }
        try {
            const dup = await window.db.collection("stamp_requests")
                .where("placeId", "==", place.id)
                .where("customerUid", "==", user.uid)
                .where("status", "==", "pending")
                .limit(1).get();
            if (!dup.empty) {
                window.showToast?.("You already have a pending stamp request — waiting for the owner's approval.", "info");
                return;
            }
            await window.db.collection("stamp_requests").add({
                placeId: place.id,
                placeName: place.name || "",
                owner_uid: place.owner_uid || "",
                customerUid: user.uid,
                customerName: customerDisplayName(),
                status: "pending",
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            await createCardDocIfMissing(place);
            window.showToast?.("Stamp request sent! Please wait for the owner's approval.", "success");
        } catch (err) {
            window.handleFirestoreError(err, "Could not send the stamp request.");
        }
        if (typeof window.SukiPlaceRefresh === "function") window.SukiPlaceRefresh();
    }

    async function cancelRequest(requestId) {
        if (!requestId) return;
        const ans = await window.vConfirm("Cancel request", "Cancel this stamp request?", "Cancel", true);
        if (!ans) return;
        try {
            await window.db.collection("stamp_requests").doc(requestId).update({ status: "cancelled" });
            window.showToast?.("Stamp request cancelled.", "info");
        } catch (err) { window.handleFirestoreError(err, "Could not cancel the request."); }
        if (typeof window.SukiPlaceRefresh === "function") window.SukiPlaceRefresh();
    }

    async function requestClaim(cardId) {
        if (!cardId) return;
        const ans = await window.vConfirm("Claim reward", "Claim the reward? Show it to the owner to mark it as claimed.", "Claim", false);
        if (!ans) return;
        try {
            await window.db.collection("loyalty_cards").doc(cardId).update({
                claimRequested: true,
                claimRequestedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            window.showToast?.("Claim request sent! Show the card to the owner.", "success");
        } catch (err) { window.handleFirestoreError(err, "Could not send the claim request."); }
        if (typeof window.SukiPlaceRefresh === "function") window.SukiPlaceRefresh();
    }

    // Owner: approve inside a transaction — request -> approved and the
    // customer's card gains exactly one stamp (deterministic card ID
    // keeps a double-tap from double-stamping).
    async function approveRequest(requestId) {
        if (!requestId) return;
        try {
            await window.db.runTransaction(async t => {
                const reqRef = window.db.collection("stamp_requests").doc(requestId);
                const reqSnap = await t.get(reqRef);
                if (!reqSnap.exists) throw new Error("Request not found.");
                const r = reqSnap.data();
                if (r.status !== "pending") throw new Error("This request has already been handled.");
                const cardId = `${r.placeId}_${r.customerUid}`;
                const cardRef = window.db.collection("loyalty_cards").doc(cardId);
                const cardSnap = await t.get(cardRef);
                t.update(reqRef, {
                    status: "approved",
                    approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                if (cardSnap.exists) {
                    t.update(cardRef, {
                        stamps: (parseInt(cardSnap.data().stamps, 10) || 0) + 1,
                        customerName: r.customerName || cardSnap.data().customerName || "Customer",
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } else {
                    t.set(cardRef, {
                        placeId: r.placeId,
                        customerUid: r.customerUid,
                        customerName: r.customerName || "Customer",
                        stamps: 1,
                        claimed: false,
                        claimRequested: false,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            });
            window.showToast?.("Stamp approved! 🎉", "success");
        } catch (err) { window.handleFirestoreError(err, "Could not approve the request."); }
    }

    async function rejectRequest(requestId) {
        if (!requestId) return;
        try {
            await window.db.collection("stamp_requests").doc(requestId).update({
                status: "rejected",
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            window.showToast?.("Stamp request rejected.", "info");
        } catch (err) { window.handleFirestoreError(err, "Could not reject the request."); }
    }

    async function markClaimed(cardId) {
        if (!cardId) return;
        const ans = await window.vConfirm("Mark as claimed", "Has the reward been given to the customer?", "Given", false);
        if (!ans) return;
        try {
            await window.db.collection("loyalty_cards").doc(cardId).update({
                claimed: true,
                claimRequested: false,
                claimedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            window.showToast?.("Marked as claimed. 🎁", "success");
        } catch (err) { window.handleFirestoreError(err, "Could not mark the claim."); }
    }

    /* ---------- Vicinify Scan: live-camera QR + location verification ---------- */
    // Anti-fraud: stamps are requested ONLY through this built-in live-camera
    // scanner. There is no image-upload / screenshot option and no scan-less
    // request button. After a valid rotating token, the customer's location
    // is verified against the establishment's coordinates (200 m radius).
    // The owner-tap [Approve]/[Reject] inbox stays as the final gate.
    const SUKI_SCAN_RADIUS_M = 200;

    function haversineM(lat1, lon1, lat2, lon2) {
        const R = 6371000;
        const toRad = d => d * Math.PI / 180;
        const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2))
            * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return 2 * R * Math.asin(Math.sqrt(a));
    }

    // Device-side only (zero Firestore cost). Resolves {ok:true} or
    // {ok:false, msg}. Skips the check when the place has no coordinates.
    function verifyScanLocation(place) {
        const plat = parseFloat(place && place.lat);
        const plng = parseFloat(place && place.lng);
        if (!isFinite(plat) || !isFinite(plng)) return Promise.resolve({ ok: true, skipped: true });
        if (!navigator.geolocation) {
            return Promise.resolve({ ok: false, msg: "Location is not available on this device. Please scan from a device with location services." });
        }
        return new Promise(resolve => {
            navigator.geolocation.getCurrentPosition(
                pos => {
                    const d = haversineM(pos.coords.latitude, pos.coords.longitude, plat, plng);
                    if (d <= SUKI_SCAN_RADIUS_M) resolve({ ok: true });
                    else resolve({ ok: false, msg: "You must be at the establishment to scan for a stamp." });
                },
                err => {
                    const denied = err && err.code === 1;
                    resolve({
                        ok: false,
                        msg: denied
                            ? "Location access was denied. Please enable location permissions for this site and try again."
                            : "Could not determine your location. Please enable location services and try again."
                    });
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
            );
        });
    }
    async function openScanner(expectedPlace) {
        const overlay = document.createElement("div");
        overlay.className = "suki-scan-overlay";
        overlay.innerHTML = `
            <div class="suki-scan-box">
                <div style="padding:14px 16px; display:flex; align-items:center; justify-content:space-between;">
                    <b style="color:#fff; font-size:15px;">Vicinify Scan</b>
                    <button type="button" class="suki-scan-close" style="background:rgba(255,255,255,.12); color:#fff; border:none; border-radius:8px; padding:8px 12px; font-weight:700; cursor:pointer;">Close</button>
                </div>
                <video playsinline muted style="width:100%; display:block; background:#000;"></video>
                <canvas style="display:none;"></canvas>
                <div class="suki-scan-hint">Point the camera at the store's Suki QR. You must be at the establishment — your location will be verified.</div>
            </div>`;
        document.body.appendChild(overlay);
        try { await loadScriptOnce(JSQR_LIB); }
        catch (e) {
            overlay.remove();
            window.showToast?.("Could not load the scanner. Please check your connection and try again.", "error");
            return;
        }
        const video = overlay.querySelector("video");
        const canvas = overlay.querySelector("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        let stream = null, raf = 0, done = false;
        const close = () => {
            done = true;
            cancelAnimationFrame(raf);
            if (stream) stream.getTracks().forEach(t => t.stop());
            overlay.remove();
        };
        overlay.querySelector(".suki-scan-close").onclick = close;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        } catch (e) {
            close();
            window.showToast?.("Could not open the camera. Please allow camera access and try again.", "error");
            return;
        }
        video.srcObject = stream;
        try { await video.play(); } catch (e) { close(); return; }
        const loop = () => {
            if (done) return;
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0);
                try {
                    const code = window.jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
                    if (code && code.data) {
                        const parsed = parseToken(String(code.data).trim());
                        if (parsed && tokenValid(parsed) && (!expectedPlace || parsed.placeId === expectedPlace.id)) {
                            close();
                            requestStampForPlaceId(parsed.placeId);
                            return;
                        }
                    }
                } catch (e) { /* keep scanning */ }
            }
            raf = requestAnimationFrame(loop);
        };
        loop();
    }

    async function requestStampForPlaceId(placeId) {
        if (!placeId) return;
        try {
            const snap = await window.db.collection("places").doc(placeId).get();
            if (!snap.exists) { window.showToast?.("Store not found.", "error"); return; }
            const place = { id: snap.id, ...snap.data() };
            if (!place.suki_enabled) { window.showToast?.("This store has no Suki Card.", "info"); return; }
            // Anti-fraud location gate (device-side, zero Firestore cost).
            const loc = await verifyScanLocation(place);
            if (!loc.ok) { window.showToast?.(loc.msg, "error"); return; }
            await requestStamp(place);
        } catch (err) { window.handleFirestoreError(err, "Could not load the store."); }
    }

    /* ---------- place-page mount ---------- */
    async function mountPlaceSection(place, isOwner) {
        const el = document.getElementById("placeSukiSection");
        if (!el) return;
        const d = designOf(place);
        if (!d.enabled) { el.remove(); return; }
        const user = window.auth?.currentUser;

        if (isOwner) {
            el.innerHTML = `
                <div class="suki-place-block">
                    <div class="suki-place-head"><i data-lucide="stamp"></i><h3>Suki Card — Owner view</h3></div>
                    <p class="suki-note">Show this QR to the customer so they can scan it and request a stamp. The token changes every 10 seconds.</p>
                    <div data-suki-qr></div>
                </div>`;
            window.debouncedIcons?.();
            renderOwnerQr(el.querySelector("[data-suki-qr]"), place.id);
            return;
        }

        if (!user) {
            el.innerHTML = `
                <div class="suki-place-block">
                    <div class="suki-place-head"><i data-lucide="stamp"></i><h3>Suki Card</h3></div>
                    <p class="suki-note">This store has a Suki Card! Log in to see your card and request a stamp.</p>
                    <button type="button" class="suki-req-btn" onclick="showPage('page-login')"><i data-lucide="log-in"></i> Log in</button>
                </div>`;
            window.debouncedIcons?.();
            return;
        }

        el.innerHTML = `<div class="suki-place-block"><div class="muted" style="text-align:center; padding:16px;">Loading Suki Card…</div></div>`;
        const cardId = `${place.id}_${user.uid}`;
        try {
            const [cardSnap, reqSnap] = await Promise.all([
                window.db.collection("loyalty_cards").doc(cardId).get(),
                window.db.collection("stamp_requests")
                    .where("placeId", "==", place.id)
                    .where("customerUid", "==", user.uid)
                    .where("status", "==", "pending")
                    .limit(1).get()
            ]);
            const card = cardSnap.exists
                ? { cardId, id: cardSnap.id, ...cardSnap.data() }
                : { cardId, stamps: 0, claimed: false, claimRequested: false, customerName: customerDisplayName() };
            const pendingReq = reqSnap.empty ? null : { id: reqSnap.docs[0].id, ...reqSnap.docs[0].data() };

            el.innerHTML = `
                <div class="suki-place-block">
                    <div class="suki-place-head"><i data-lucide="stamp"></i><h3>Suki Card</h3></div>
                    ${renderCard(place, card)}
                    <div class="suki-place-actions">
                        ${pendingReq ? `
                            <button type="button" class="suki-req-btn suki-req-wait" disabled><i data-lucide="clock"></i> Waiting for the owner's approval…</button>
                            <button type="button" class="suki-plain-btn" data-suki-cancel-req="${sukiEsc(pendingReq.id)}">Cancel request</button>
                        ` : `
                            <button type="button" class="suki-req-btn" data-suki-scan><i data-lucide="qr-code"></i> Scan with Vicinify</button>
                        `}
                    </div>
                </div>`;
            attachInteraction(el);
            el.querySelector("[data-suki-scan]")?.addEventListener("click", () => openScanner(place));
            window.SukiPlaceRefresh = () => mountPlaceSection(place, false);
        } catch (err) {
            el.innerHTML = `<div class="suki-place-block"><div class="muted" style="text-align:center; padding:16px;">Could not load the Suki Card right now.</div></div>`;
            window.handleFirestoreError(err);
        }
    }

    return {
        designOf, textTone, renderCard, attachInteraction,
        makeToken, parseToken, tokenValid, renderOwnerQr, openScanner,
        requestStamp, cancelRequest, requestClaim,
        approveRequest, rejectRequest, markClaimed,
        mountPlaceSection, unmountPlaceSection, requestStampForPlaceId, customerDisplayName
    };
})();
