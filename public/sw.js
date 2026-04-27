// ─── MushafPlus Service Worker ──────────────────────────────────────────────
// Stratégies de cache :
//   • /fonts/        → Cache-First  (rarement modifiés)
//   • /assets/       → Cache-First  (hachés à la compilation)
//   • images locales → Stale-While-Revalidate
//   • HTML           → Network-First  (évite les pages blanches avec SW obsolète)
//   • api.alquran.cloud → Stale-While-Revalidate  (texte coranique offline)
//   • Reste          → Network-First avec fallback cache
// ──────────────────────────────────────────────────────────────────────────────

const CACHE_NAME = "mushaf-plus-v5";
const API_CACHE_NAME = "mushaf-plus-api-v2";

// Ressources de l'app shell à pré-cacher à l'installation
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/logo.png",
  "/favicon.svg",
  "/fonts/scheherazade-new-400.woff2",
  "/fonts/scheherazade-new-700.woff2",
];

// Endpoints de l'API Coran à pré-cacher pour le support offline de base.
// Ces appels sont effectués en arrière-plan lors de l'installation du SW.
// En cas d'échec réseau, l'installation continue (pas bloquant).
const QURAN_API_BASE = "https://api.alquran.cloud/v1";
const API_ENDPOINTS_TO_PRECACHE = [
  // Al-Fatiha – texte arabe (Hafs)
  `${QURAN_API_BASE}/surah/1/quran-simple`,
  // Al-Fatiha – traduction française
  `${QURAN_API_BASE}/surah/1/fr.hamidullah`,
  // Al-Fatiha – traduction anglaise
  `${QURAN_API_BASE}/surah/1/en.sahih`,
  // Al-Baqarah partielle (versets fréquemment lus) - surah complète
  `${QURAN_API_BASE}/surah/2/quran-simple`,
  // Al-Kahf – lecture courante du vendredi
  `${QURAN_API_BASE}/surah/18/quran-simple`,
  // Yā-Sīn – sourate très fréquente
  `${QURAN_API_BASE}/surah/36/quran-simple`,
  // Ar-Rahman – sourate très fréquente
  `${QURAN_API_BASE}/surah/55/quran-simple`,
  // Al-Mulk – récitée le soir
  `${QURAN_API_BASE}/surah/67/quran-simple`,
];

// ─── Installation ─────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      // 1. Pré-cache de l'app shell (bloquant)
      caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)),

      // 2. Pré-cache des données coraniques (non bloquant – best effort)
      precacheQuranApi(),
    ]).then(() => self.skipWaiting()),
  );
});

/**
 * Pré-cache les endpoints de l'API Coran de façon silencieuse.
 * Les erreurs réseau sont ignorées afin de ne pas bloquer l'installation du SW.
 */
async function precacheQuranApi() {
  let apiCache;
  try {
    apiCache = await caches.open(API_CACHE_NAME);
  } catch {
    return; // Impossible d'ouvrir le cache – on abandonne silencieusement
  }

  const results = await Promise.allSettled(
    API_ENDPOINTS_TO_PRECACHE.map(async (url) => {
      // Ne pas re-télécharger si déjà en cache
      const existing = await apiCache.match(url);
      if (existing) return;

      const res = await fetch(url, {
        cache: "no-cache",
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        await apiCache.put(url, res);
      }
    }),
  );

  // Log en dev uniquement (supprimé par esbuild en production)
  const failed = results.filter((r) => r.status === "rejected").length;
  if (failed > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      `[SW] ${failed}/${API_ENDPOINTS_TO_PRECACHE.length} endpoints API non mis en cache (réseau indisponible?)`,
    );
  }
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
      await self.clients.claim();
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
    event.respondWith(staleWhileRevalidate(event.request, CACHE_NAME));
    return;
  }

  // ── 4. API Coran (alquran.cloud) – Stale-While-Revalidate ──────────────────
  if (url.hostname === "api.alquran.cloud") {
    event.respondWith(staleWhileRevalidate(event.request, API_CACHE_NAME));
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
      cacheQuranUrls(urls);
      break;
    }

    // L'app demande l'invalidation du cache API (ex : après un repair)
    case "CLEAR_API_CACHE": {
      caches.delete(API_CACHE_NAME).then(() => {
        event.source?.postMessage?.({ type: "API_CACHE_CLEARED" });
      });
      break;
    }

    // L'app demande au SW de skipWaiting (mise à jour immédiate)
    case "SKIP_WAITING":
      self.skipWaiting();
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
            return parsed.hostname === "api.alquran.cloud";
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
          if (res.ok) await apiCache.put(url, res);
        }),
    );
  } catch {
    // Silencieux – le cache API n'est pas critique
  }
}

// ─── Stratégies de cache ──────────────────────────────────────────────────────

/**
 * Cache-First : retourne la réponse en cache si disponible.
 * Sinon, fetch depuis le réseau et met en cache.
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
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
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response && (response.status === 200 || response.type === "opaque")) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  // Retourner le cache immédiatement, ou attendre le réseau si pas de cache
  return cached || (await networkPromise) || Response.error();
}

/**
 * Network-First pour HTML : priorité réseau pour éviter les pages blanches.
 * Fallback sur le cache ou index.html en cas de panne réseau.
 */
async function networkFirstHtml(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    // Ne stocker que les réponses valides
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
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
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
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
  <title>MushafPlus – Hors ligne</title>
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
    button {
      margin-top: 0.5rem;
      padding: 0.75rem 1.75rem;
      background: var(--green);
      color: #fff;
      border: none;
      border-radius: 999px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
    }
    button:hover { opacity: 0.88; }
  </style>
</head>
<body>
  <div class="icon">📖</div>
  <div class="arabic">﷽</div>
  <h1>MushafPlus – Hors ligne</h1>
  <p>Vous n'êtes pas connecté à Internet. Reconnectez-vous pour accéder au Coran complet.</p>
  <p style="margin-top:0.5rem;font-size:0.82rem;color:#9ca3af;">
    Les sourates récemment consultées restent disponibles dans l'application.
  </p>
  <button onclick="window.location.reload()">Réessayer</button>
</body>
</html>`;
}
