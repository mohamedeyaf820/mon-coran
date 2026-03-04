const CACHE_NAME = 'mushaf-plus-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => key !== CACHE_NAME ? caches.delete(key) : Promise.resolve()));
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const accept = event.request.headers.get('accept') || '';
    const isHtml = accept.includes('text/html');

    // Network-first for HTML to avoid stale app shell and blank-screen mismatches
    if (isHtml) {
        event.respondWith((async () => {
            try {
                const networkResponse = await fetch(event.request);
                const cache = await caches.open(CACHE_NAME);
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
            } catch {
                const cached = await caches.match(event.request);
                return cached || caches.match('/index.html');
            }
        })());
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
