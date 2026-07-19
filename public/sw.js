// ─── MushafPlus Service Worker ──────────────────────────────────────────────
// Stratégies de cache :
//   • /fonts/        → Cache-First  (rarement modifiés)
//   • /assets/       → Cache-First  (hachés à la compilation)
//   • images locales → Stale-While-Revalidate
//   • HTML           → Network-First  (évite les pages blanches avec SW obsolète)
//   • api.alquran.cloud & api.quran.com → Stale-While-Revalidate  (texte coranique offline)
//   • Reste          → Network-First avec fallback cache
// ──────────────────────────────────────────────────────────────────────────────

const CACHE_NAME = "mushaf-plus-v12";
const API_CACHE_NAME = "mushaf-plus-api-v3";
const CACHE_LIMITS = {
  [CACHE_NAME]: 180,
  [API_CACHE_NAME]: 160,
};
let claimClientsOnActivate = false;

// Ressources de l'app shell à pré-cacher à l'installation
const ASSETS_TO_CACHE = [
  "/boot-recovery.js",
  "/manifest.json",
  "/logo-ui.webp",
  "/favicon.png",
  "/pwa-home-wide.png",
  "/pwa-home-mobile.png",
  "/data/reciter-profiles.json",
];

// ─── Installation ─────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(precacheAppShell());
});

async function precacheAppShell() {
  const cache = await caches.open(CACHE_NAME);
  await precacheUrls(cache, ASSETS_TO_CACHE);

  const indexResponse = await fetch("/index.html", { cache: "reload" });
  if (!indexResponse.ok) {
    throw new Error(`Unable to precache app shell: ${indexResponse.status}`);
  }

  const html = await indexResponse.clone().text();
  await cache.put("/index.html", indexResponse);

  const indexAssetUrls = Array.from(
    html.matchAll(/(?:src|href)=["'](\/assets\/[^"']+)["']/g),
    (match) => match[1],
  );
  const shellManifestResponse = await fetch("/shell-assets.json", {
    cache: "reload",
  });
  if (!shellManifestResponse.ok) {
    throw new Error(
      `Unable to load app-shell manifest: ${shellManifestResponse.status}`,
    );
  }

  const shellAssetUrls = (await shellManifestResponse.clone().json()).filter(
    (assetUrl) =>
      typeof assetUrl === "string" && assetUrl.startsWith("/assets/"),
  );
  await cache.put("/shell-assets.json", shellManifestResponse);
  await precacheUrls(
    cache,
    [...new Set([...indexAssetUrls, ...shellAssetUrls])],
  );
  await trimCache(cache, CACHE_LIMITS[CACHE_NAME]);
}

async function precacheUrls(cache, urls, concurrency = 4) {
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, urls.length) },
    async () => {
      while (cursor < urls.length) {
        const url = urls[cursor];
        cursor += 1;
        const response = await fetch(url, { cache: "reload" });
        if (!response.ok) {
          throw new Error(`Unable to precache ${url}: ${response.status}`);
        }
        await cache.put(url, response);
      }
    },
  );
  await Promise.all(workers);
}

// ─── Activation ───────────────────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      // Supprimer les anciens caches (app shell et API)
      await Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith("mushaf-plus") &&
              key !== CACHE_NAME &&
              key !== API_CACHE_NAME,
          )
          .map((key) => caches.delete(key)),
      );
      if (claimClientsOnActivate) {
        await self.clients.claim();
      }
    })(),
  );
});

// ─── Interception des requêtes ────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  // Ignorer les méthodes non-GET
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  // ── 1. Polices – Cache-First ────────────────────────────────────────────────
  if (isSameOrigin && url.pathname.startsWith("/fonts/")) {
    event.respondWith(cacheFirst(event.request, CACHE_NAME));
    return;
  }

  // ── 2. Assets hachés (/assets/) – Cache-First à longue durée ───────────────
  if (isSameOrigin && url.pathname.startsWith("/assets/")) {
    event.respondWith(cacheFirst(event.request, CACHE_NAME));
    return;
  }

  // ── 3. Images locales – Stale-While-Revalidate ─────────────────────────────
  if (
    isSameOrigin &&
    /\.(png|jpe?g|webp|avif|svg|gif|ico)$/i.test(url.pathname)
  ) {
    event.respondWith(staleWhileRevalidate(event.request, CACHE_NAME, event));
    return;
  }

  // ── 4. API Coran (alquran.cloud & quran.com) – Stale-While-Revalidate ──────
  if (url.hostname === "api.alquran.cloud" || url.hostname === "api.quran.com") {
    event.respondWith(staleWhileRevalidate(event.request, API_CACHE_NAME, event));
    return;
  }

  // ── 5. HTML – Network-First (évite les pages blanches) ─────────────────────
  const accept = event.request.headers.get("accept") || "";
  if (accept.includes("text/html")) {
    event.respondWith(networkFirstHtml(event.request));
    return;
  }

  // ── 6. Autres requêtes same-origin – Network-First avec fallback cache ──────
  if (isSameOrigin) {
    event.respondWith(networkFirstWithFallback(event.request, CACHE_NAME));
    return;
  }

  // ── 7. Cross-origin restant – tentative réseau directe ─────────────────────
  // (audio mp3, images récitateurs, etc. — trop volumineux pour le cache SW)
});

// ─── Messages (communication avec l'app) ─────────────────────────────────────

self.addEventListener("message", (event) => {
  if (!event.data || typeof event.data !== "object") return;

  switch (event.data.type) {
    // L'app demande au SW de mettre en cache des URLs supplémentaires
    // (ex : sourates récemment lues)
    case "CACHE_QURAN_URLS": {
      const urls = Array.isArray(event.data.urls) ? event.data.urls : [];
      event.waitUntil(cacheQuranUrls(urls));
      break;
    }

    // L'app demande l'invalidation du cache API (ex : après un repair)
    case "CLEAR_API_CACHE": {
      event.waitUntil(
        caches.delete(API_CACHE_NAME).then(() => {
          event.source?.postMessage?.({ type: "API_CACHE_CLEARED" });
        }),
      );
      break;
    }

    // L'app demande au SW de skipWaiting (mise à jour immédiate)
    case "SKIP_WAITING":
      claimClientsOnActivate = true;
      event.waitUntil(self.skipWaiting());
      break;

    default:
      break;
  }
});

/**
 * Met en cache une liste d'URLs API de façon asynchrone (best effort).
 * Utilisée par l'app pour mettre en cache les sourates récemment visitées.
 */
async function cacheQuranUrls(urls) {
  if (!urls.length) return;
  try {
    const apiCache = await caches.open(API_CACHE_NAME);
    await Promise.allSettled(
      urls
        .filter((u) => {
          try {
            const parsed = new URL(u);
            return parsed.hostname === "api.alquran.cloud" || parsed.hostname === "api.quran.com";
          } catch {
            return false;
          }
        })
        .map(async (url) => {
          const existing = await apiCache.match(url);
          if (existing) return; // Déjà en cache, inutile de re-télécharger
          const res = await fetch(url, {
            headers: { Accept: "application/json" },
          });
          if (res.ok) await putBounded(apiCache, url, res, API_CACHE_NAME);
        }),
    );
    await trimCache(apiCache, CACHE_LIMITS[API_CACHE_NAME]);
  } catch {
    // Silencieux – le cache API n'est pas critique
  }
}

// ─── Stratégies de cache ──────────────────────────────────────────────────────

/**
 * Fetch with AbortController timeout (default 8s).
 */
function fetchWithTimeout(request, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(request, { signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  );
}

async function trimCache(cache, maxEntries) {
  if (!Number.isFinite(maxEntries) || maxEntries < 1) return;
  const keys = await cache.keys();
  const overflow = keys.length - maxEntries;
  if (overflow <= 0) return;
  await Promise.all(keys.slice(0, overflow).map((key) => cache.delete(key)));
}

async function putBounded(cache, request, response, cacheName) {
  await cache.put(request, response);
  await trimCache(cache, CACHE_LIMITS[cacheName]);
}

/**
 * Cache-First : retourne la réponse en cache si disponible.
 * Sinon, fetch depuis le réseau et met en cache.
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetchWithTimeout(request);
    if (response && response.status === 200) {
      await putBounded(cache, request, response.clone(), cacheName);
    }
    return response;
  } catch {
    return Response.error();
  }
}

/**
 * Stale-While-Revalidate : retourne le cache immédiatement (si dispo)
 * et met à jour le cache en arrière-plan depuis le réseau.
 */
async function staleWhileRevalidate(request, cacheName, event) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetchWithTimeout(request)
    .then(async (response) => {
      if (response && (response.status === 200 || response.type === "opaque")) {
        await putBounded(cache, request, response.clone(), cacheName);
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    event?.waitUntil(networkPromise.then(() => undefined));
    return cached;
  }
  return (await networkPromise) || Response.error();
}

/**
 * Network-First pour HTML : priorité réseau pour éviter les pages blanches.
 * Fallback sur le cache ou index.html en cas de panne réseau.
 */
async function networkFirstHtml(request) {
  try {
    const networkResponse = await fetchWithTimeout(request, 6000);
    const cache = await caches.open(CACHE_NAME);
    // Ne stocker que les réponses valides
    if (networkResponse.status === 200) {
      await putBounded(cache, request, networkResponse.clone(), CACHE_NAME);
    }
    return networkResponse;
  } catch {
    // Pas de réseau : servir depuis le cache
    const cache = await caches.open(CACHE_NAME);
    const cached =
      (await cache.match(request)) || (await cache.match("/index.html"));
    if (cached) return cached;

    // Dernier recours : page d'erreur offline minimaliste
    return new Response(offlineFallbackHtml(), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

/**
 * Network-First générique avec fallback cache.
 */
async function networkFirstWithFallback(request, cacheName) {
  try {
    const response = await fetchWithTimeout(request);
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      await putBounded(cache, request, response.clone(), cacheName);
    }
    return response;
  } catch {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    return cached || Response.error();
  }
}

// ─── Page de secours offline ──────────────────────────────────────────────────

function offlineFallbackHtml() {
  return `<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MushafPlus – Offline</title>
  <style>
    :root { --green: #1b5e3a; --bg: #fefaf3; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: #1f2832;
      min-height: 100svh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
      gap: 1.25rem;
    }
    .icon { font-size: 3rem; }
    h1 { font-size: 1.4rem; font-weight: 700; color: var(--green); }
    p { font-size: 0.95rem; color: #4b5563; max-width: 36ch; line-height: 1.6; }
    .arabic {
      font-size: 2rem;
      direction: rtl;
      color: var(--green);
      opacity: 0.75;
      margin: 0.5rem 0;
    }
    .retry {
      margin-top: 0.5rem;
      padding: 0.75rem 1.75rem;
      background: var(--green);
      color: #fff;
      border: none;
      border-radius: 999px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
    }
    .retry:hover { opacity: 0.88; }
    .lang-block { display: none; }
    :lang(ar) { direction: rtl; }
  </style>
</head>
<body>
  <div class="icon">📖</div>
  <div class="arabic">﷽</div>
  <div class="lang-block" lang="fr">
    <h1>MushafPlus – Hors ligne</h1>
    <p>Vous n'êtes pas connecté à Internet. Reconnectez-vous pour accéder au Coran complet.</p>
    <p style="margin-top:0.5rem;font-size:0.82rem;color:#9ca3af;">Les sourates récemment consultées restent disponibles dans l'application.</p>
    <a class="retry" href="/">Réessayer</a>
  </div>
  <div class="lang-block" lang="en">
    <h1>MushafPlus – Offline</h1>
    <p>You are not connected to the Internet. Reconnect to access the full Quran.</p>
    <p style="margin-top:0.5rem;font-size:0.82rem;color:#9ca3af;">Recently visited surahs remain available in the app.</p>
    <a class="retry" href="/">Retry</a>
  </div>
  <div class="lang-block" lang="ar">
    <h1>مصحف بلس – غير متصل</h1>
    <p>أنت غير متصل بالإنترنت. أعد الاتصال للوصول إلى القرآن الكريم كاملاً.</p>
    <p style="margin-top:0.5rem;font-size:0.82rem;color:#9ca3af;">السور التي زرتها مؤخراً لا تزال متاحة في التطبيق.</p>
    <a class="retry" href="/">إعادة المحاولة</a>
  </div>
  <noscript>
    <h1>MushafPlus – Offline</h1>
    <p>No internet connection. Reconnect to access the full Quran.</p>
    <a class="retry" href="/">Retry</a>
  </noscript>
  <script>
    (function() {
      var lang = (navigator.language || 'fr').split('-')[0];
      var supported = ['fr', 'en', 'ar'];
      var display = supported.indexOf(lang) !== -1 ? lang : 'en';
      var blocks = document.querySelectorAll('.lang-block');
      var matched = false;
      for (var i = 0; i < blocks.length; i++) {
        if (blocks[i].lang === display) {
          blocks[i].style.display = 'block';
          matched = true;
        } else {
          blocks[i].style.display = 'none';
        }
      }
      if (!matched) {
        for (var j = 0; j < blocks.length; j++) {
          if (blocks[j].lang === 'en') { blocks[j].style.display = 'block'; break; }
        }
      }
      if (lang === 'ar') {
        document.documentElement.lang = 'ar';
        document.documentElement.dir = 'rtl';
      }
    })();
  </script>
</body>
</html>`;
}
