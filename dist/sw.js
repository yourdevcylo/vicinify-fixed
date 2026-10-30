const CACHE_NAME = "vicinify-ui-VICI_6c0734b6980760da";
const APP_SHELL = [
    "./",
    "./index.html",
    "./reset-password.html",
    "./css/password-reset.css?v=VICI_6c0734b6980760da",
    "./js/password-policy.js?v=VICI_6c0734b6980760da",
    "./js/reset-password.js?v=VICI_6c0734b6980760da",
    "./css/style.css?v=VICI_6c0734b6980760da",
    "./css/ui.css?v=VICI_6c0734b6980760da",
    "./css/reference.css?v=VICI_6c0734b6980760da",
    "./css/place-preview.css?v=VICI_6c0734b6980760da",
    "./css/suki-polish.css?v=VICI_6c0734b6980760da",
    "./css/vici-chat.css?v=VICI_6c0734b6980760da",
    "./css/mobile.css?v=VICI_6c0734b6980760da",
    "./css/components.css?v=VICI_6c0734b6980760da",
    "./js/ui.js?v=VICI_6c0734b6980760da",
    "./js/payment-policy.js?v=VICI_6c0734b6980760da",
    "./js/place-features.js?v=VICI_6c0734b6980760da",
    "./js/place-preview.js?v=VICI_6c0734b6980760da",
    "./js/content-policy.js?v=VICI_6c0734b6980760da",
    "./js/common.js?v=VICI_6c0734b6980760da",
    "./js/demo-switcher.js?v=VICI_6c0734b6980760da",
    "./css/demo-switcher.css?v=VICI_6c0734b6980760da",
    "./js/data.js?v=VICI_6c0734b6980760da",
    "./js/vici-request.js?v=VICI_6c0734b6980760da",
    "./js/vici-commerce.js?v=VICI_6c0734b6980760da",
    "./js/vici-chat.js?v=VICI_6c0734b6980760da",
    "./js/map.js?v=VICI_6c0734b6980760da",
    "./js/add.js?v=VICI_6c0734b6980760da",
    "./js/buzz.js?v=VICI_6c0734b6980760da",
    "./js/dashboard.js?v=VICI_6c0734b6980760da",
    "./js/settings.js?v=VICI_6c0734b6980760da",
    "./js/account-deletion.js?v=VICI_6c0734b6980760da",
    "./js/ownership-transfer.js?v=VICI_6c0734b6980760da",
    "./js/vendor/qrcode.min.js",
    "./js/vendor/jsQR.js",
    "./manifest.json",
    "./css/brand-icon.css?v=VICI_6c0734b6980760da",
    "./icons/vicinify-mark.png",
    "./icons/icon-32.png",
    "./icons/icon-180.png",
    "./icons/icon-512-maskable.png",
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

