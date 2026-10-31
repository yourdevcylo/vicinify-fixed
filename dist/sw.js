const CACHE_NAME = "vicinify-ui-VICI_9dae683e6acbd0ee";
const APP_SHELL = [
    "./",
    "./index.html",
    "./reset-password.html",
    "./css/password-reset.css?v=VICI_9dae683e6acbd0ee",
    "./js/password-policy.js?v=VICI_9dae683e6acbd0ee",
    "./js/reset-password.js?v=VICI_9dae683e6acbd0ee",
    "./css/style.css?v=VICI_9dae683e6acbd0ee",
    "./css/ui.css?v=VICI_9dae683e6acbd0ee",
    "./css/reference.css?v=VICI_9dae683e6acbd0ee",
    "./css/place-preview.css?v=VICI_9dae683e6acbd0ee",
    "./css/suki-polish.css?v=VICI_9dae683e6acbd0ee",
    "./css/vici-chat.css?v=VICI_9dae683e6acbd0ee",
    "./css/mobile.css?v=VICI_9dae683e6acbd0ee",
    "./css/components.css?v=VICI_9dae683e6acbd0ee",
    "./js/ui.js?v=VICI_9dae683e6acbd0ee",
    "./js/payment-policy.js?v=VICI_9dae683e6acbd0ee",
    "./js/place-features.js?v=VICI_9dae683e6acbd0ee",
    "./js/business-hours.js?v=VICI_9dae683e6acbd0ee",
    "./js/place-preview.js?v=VICI_9dae683e6acbd0ee",
    "./js/content-policy.js?v=VICI_9dae683e6acbd0ee",
    "./js/common.js?v=VICI_9dae683e6acbd0ee",
    "./js/demo-switcher.js?v=VICI_9dae683e6acbd0ee",
    "./css/demo-switcher.css?v=VICI_9dae683e6acbd0ee",
    "./js/data.js?v=VICI_9dae683e6acbd0ee",
    "./js/vici-request.js?v=VICI_9dae683e6acbd0ee",
    "./js/vici-commerce.js?v=VICI_9dae683e6acbd0ee",
    "./js/vici-chat.js?v=VICI_9dae683e6acbd0ee",
    "./js/map.js?v=VICI_9dae683e6acbd0ee",
    "./js/add.js?v=VICI_9dae683e6acbd0ee",
    "./js/buzz.js?v=VICI_9dae683e6acbd0ee",
    "./js/dashboard.js?v=VICI_9dae683e6acbd0ee",
    "./js/settings.js?v=VICI_9dae683e6acbd0ee",
    "./js/account-deletion.js?v=VICI_9dae683e6acbd0ee",
    "./js/ownership-transfer.js?v=VICI_9dae683e6acbd0ee",
    "./js/vendor/qrcode.min.js",
    "./js/vendor/jsQR.js",
    "./manifest.json",
    "./css/brand-icon.css?v=VICI_9dae683e6acbd0ee",
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

