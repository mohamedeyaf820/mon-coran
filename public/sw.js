const CACHE_NAME = "mushaf-plus-v4";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/logo.png",
  "/favicon.svg",
  "/fonts/scheherazade-new-400.woff2",
  "/fonts/scheherazade-new-700.woff2",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) =>
          key !== CACHE_NAME ? caches.delete(key) : Promise.resolve(),
        ),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  // Cache-first for fonts (they rarely change)
  if (url.pathname.startsWith("/fonts/")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, copy));
          }
          return response;
        });
      }),
    );
    return;
  }

  // Stale-while-revalidate for same-origin images/logo/icons.
  if (
    isSameOrigin &&
    /\.(png|jpe?g|webp|avif|svg|gif|ico)$/i.test(url.pathname)
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(event.request);
        const networkPromise = fetch(event.request)
          .then((response) => {
            if (
              response &&
              (response.status === 200 || response.type === "opaque")
            ) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => null);
        return cached || (await networkPromise) || Response.error();
      })(),
    );
    return;
  }

  const accept = event.request.headers.get("accept") || "";
  const isHtml = accept.includes("text/html");

  // Network-first for HTML to avoid stale app shell and blank-screen mismatches
  if (isHtml) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(event.request);
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        } catch {
          const cached = await caches.match(event.request);
          return cached || caches.match("/index.html");
        }
      })(),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});
