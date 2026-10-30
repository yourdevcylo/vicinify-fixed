const CACHE_NAME = "vicinify-ui-VICI_39ffe5dc4c3f20cf";
const APP_SHELL = [
    "./",
    "./index.html",
    "./reset-password.html",
    "./css/password-reset.css?v=VICI_39ffe5dc4c3f20cf",
    "./js/password-policy.js?v=VICI_39ffe5dc4c3f20cf",
    "./js/reset-password.js?v=VICI_39ffe5dc4c3f20cf",
    "./css/style.css?v=VICI_39ffe5dc4c3f20cf",
    "./css/ui.css?v=VICI_39ffe5dc4c3f20cf",
    "./css/reference.css?v=VICI_39ffe5dc4c3f20cf",
    "./css/place-preview.css?v=VICI_39ffe5dc4c3f20cf",
    "./css/suki-polish.css?v=VICI_39ffe5dc4c3f20cf",
    "./css/vici-chat.css?v=VICI_39ffe5dc4c3f20cf",
    "./css/mobile.css?v=VICI_39ffe5dc4c3f20cf",
    "./css/components.css?v=VICI_39ffe5dc4c3f20cf",
    "./js/ui.js?v=VICI_39ffe5dc4c3f20cf",
    "./js/payment-policy.js?v=VICI_39ffe5dc4c3f20cf",
    "./js/place-features.js?v=VICI_39ffe5dc4c3f20cf",
    "./js/place-preview.js?v=VICI_39ffe5dc4c3f20cf",
    "./js/content-policy.js?v=VICI_39ffe5dc4c3f20cf",
    "./js/common.js?v=VICI_39ffe5dc4c3f20cf",
    "./js/data.js?v=VICI_39ffe5dc4c3f20cf",
    "./js/vici-request.js?v=VICI_39ffe5dc4c3f20cf",
    "./js/vici-commerce.js?v=VICI_39ffe5dc4c3f20cf",
    "./js/vici-chat.js?v=VICI_39ffe5dc4c3f20cf",
    "./js/map.js?v=VICI_39ffe5dc4c3f20cf",
    "./js/add.js?v=VICI_39ffe5dc4c3f20cf",
    "./js/buzz.js?v=VICI_39ffe5dc4c3f20cf",
    "./js/dashboard.js?v=VICI_39ffe5dc4c3f20cf",
    "./js/settings.js?v=VICI_39ffe5dc4c3f20cf",
    "./js/account-deletion.js?v=VICI_39ffe5dc4c3f20cf",
    "./js/ownership-transfer.js?v=VICI_39ffe5dc4c3f20cf",
    "./js/vendor/qrcode.min.js",
    "./js/vendor/jsQR.js",
    "./manifest.json",
    "./icons/icon-192.png",
    "./icons/icon-512.png",
    "./notif.mp3"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys
                .filter(key => key.startsWith("vicinify-ui-") && key !== CACHE_NAME)
                .map(key => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;
    if (url.pathname.startsWith("/.netlify/functions/")) return;
    if (url.pathname.endsWith('/update.html')) {
        event.respondWith(fetch(event.request, {cache:'no-store'}));
        return;
    }

    const wantsFresh =
        event.request.mode === "navigate" ||
        ["script", "style", "worker"].includes(event.request.destination) ||
        /\.(?:html|js|css)$/i.test(url.pathname);

    if (wantsFresh) {
        event.respondWith(
            fetch(event.request, {cache:'no-store'}).then(response => {
                const copy = response.clone();
                caches.open(CACHE_NAME).then(cache => response.ok && cache.put(event.request, copy));
                return response;
            }).catch(() => caches.match(event.request).then(cached => cached || (event.request.mode === "navigate" ? caches.match("./index.html") : Response.error())))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).then(response => {
                const copy = response.clone();
                caches.open(CACHE_NAME).then(cache => response.ok && cache.put(event.request, copy));
                return response;
            });
        })
    );
});

