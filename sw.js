const CACHE_NAME = "vicinify-ui-20261030-suki-editor-1";
const APP_SHELL = [
    "./",
    "./index.html",
    "./reset-password.html",
    "./css/password-reset.css?v=VICINIFY_SUKI_EDITOR_FIX_20261030",
    "./js/password-policy.js?v=VICINIFY_SUKI_EDITOR_FIX_20261030",
    "./js/reset-password.js?v=VICINIFY_SUKI_EDITOR_FIX_20261030",
    "./css/style.css?v=VICINIFY_SUKI_EDITOR_FIX_20261030",
    "./css/ui.css?v=VICINIFY_SUKI_EDITOR_FIX_20261030",
    "./css/reference.css?v=VICINIFY_SUKI_EDITOR_FIX_20261030",
    "./css/place-preview.css?v=VICINIFY_SUKI_EDITOR_FIX_20261030",
    "./css/suki-polish.css?v=VICINIFY_SUKI_EDITOR_FIX_20261030",
    "./css/vici-chat.css?v=VICINIFY_SUKI_EDITOR_FIX_20261030",
    "./css/mobile.css?v=VICINIFY_SUKI_EDITOR_FIX_20261030",
    "./css/components.css?v=VICINIFY_SUKI_EDITOR_FIX_20261030",
    "./js/ui.js?v=VICINIFY_SUKI_EDITOR_FIX_20261030",
    "./js/payment-policy.js?v=VICINIFY_SUKI_EDITOR_FIX_20261030",
    "./js/place-features.js?v=VICINIFY_SUKI_EDITOR_FIX_20261030",
    "./js/place-preview.js?v=VICINIFY_SUKI_EDITOR_FIX_20261030",
    "./js/content-policy.js?v=VICINIFY_SUKI_EDITOR_FIX_20261030",
    "./js/common.js?v=VICINIFY_SUKI_EDITOR_FIX_20261030",
    "./js/data.js?v=VICINIFY_SUKI_EDITOR_FIX_20261030",
    "./js/vici-request.js?v=VICINIFY_SUKI_EDITOR_FIX_20261030",
    "./js/vici-commerce.js?v=VICINIFY_SUKI_EDITOR_FIX_20261030",
    "./js/vici-chat.js?v=VICINIFY_SUKI_EDITOR_FIX_20261030",
    "./js/vici-launcher.js?v=VICINIFY_SUKI_EDITOR_FIX_20261030",
    "./js/map.js?v=VICINIFY_SUKI_EDITOR_FIX_20261030",
    "./js/add.js?v=VICINIFY_SUKI_EDITOR_FIX_20261030",
    "./js/buzz.js?v=VICINIFY_SUKI_EDITOR_FIX_20261030",
    "./js/dashboard.js?v=VICINIFY_SUKI_EDITOR_FIX_20261030",
    "./js/settings.js?v=VICINIFY_SUKI_EDITOR_FIX_20261030",
    "./js/account-deletion.js?v=VICINIFY_SUKI_EDITOR_FIX_20261030",
    "./js/ownership-transfer.js?v=VICINIFY_SUKI_EDITOR_FIX_20261030",
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

