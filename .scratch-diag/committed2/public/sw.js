// ─── MushafPlus Service Worker ──────────────────────────────────────────────
// Stratégies de cache :
//   • /fonts/        → Cache-First  (fichiers versionnés, immuables)
//   • verses.quran.foundation/fonts/ → Cache-First (polices de page QCF, cache dédié)
//   • /assets/       → Cache-First  (hachés à la compilation)
//   • images locales → Stale-While-Revalidate
//   • HTML           → Network-First  (évite les pages blanches avec SW obsolète)
//   • api.alquran.cloud & api.quran.com → Stale-While-Revalidate (le cache répond
//     instantanément, le réseau rafraîchit les traductions révisées en arrière-plan)
//   • Reste          → Network-First avec fallback cache
// ──────────────────────────────────────────────────────────────────────────────

const CACHE_NAME = "mushaf-plus-v20";
const API_CACHE_NAME = "mushaf-plus-api-v6";
const QCF_FONT_CACHE_NAME = "mushaf-plus-qcf-fonts-v1";
const AUDIO_CACHE_NAME = "mushafplus-audio-v2";
const CACHE_LIMITS = {
  [CACHE_NAME]: 300,
  [API_CACHE_NAME]: 200,
  [QCF_FONT_CACHE_NAME]: 100,
};
// Revalidation throttle for the Quran API cache: a cached payload older than
// this delay is refetched in the background. It keeps instant offline/return
// navigation without re-downloading the same surah on every page change.
const API_REVALIDATE_MIN_INTERVAL_MS = 5 * 60 * 1000;
const apiRevalidatedAt = new Map();
let claimClientsOnActivate = true;

// Ressources de l'app shell à pré-cacher à l'installation
const ASSETS_TO_CACHE = [
  "/boot-recovery.js",
  "/manifest.json",
  "/logo-ui.webp",
  "/favicon.png",
  "/data/reciter-profiles.json",
  "/data/editorial-copy.json",
  // The reading faces are needed on every route once offline.
  "/fonts/uthmanic-hafs-v18.woff2",
  "/fonts/kfgqpc-warsh-21.woff2",
  "/fonts/scheherazade-new-400.woff2",
  "/fonts/sura_names.woff2",
];

// ─── Installation ─────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(precacheAppShell());
});

async function precacheAppShell() {
  const cache = await caches.open(CACHE_NAME);
  await precacheUrls(cache, ASSETS_TO_CACHE);

  // The entry document is parsed to discover the hashed chunks it loads. A
  // failure must not abort the install: the shell manifest below, the
  // CACHE_SHELL_URLS message from the page, and the runtime strategies all
  // refill those entries on the next online visit.
  const indexAssetUrls = [];
  try {
    const indexResponse = await fetch("/index.html", { cache: "reload" });
    if (indexResponse.ok) {
      const html = await indexResponse.clone().text();
      await cache.put("/index.html", indexResponse);
      indexAssetUrls.push(
        ...Array.from(
          html.matchAll(/(?:src|href)=["'](\/assets\/[^"']+)["']/g),
          (match) => match[1],
        ),
      );
    } else {
      console.warn(
        `[sw] /index.html precache skipped: ${indexResponse.status}`,
      );
    }
  } catch (error) {
    console.warn(
      `[sw] /index.html precache skipped: ${error?.name || "network error"}`,
    );
  }

  let shellAssetUrls = [];
  try {
    const shellManifestResponse = await fetch("/shell-assets.json", {
      cache: "reload",
    });
    if (shellManifestResponse.ok) {
      const manifest = await shellManifestResponse.clone().json();
      shellAssetUrls = (Array.isArray(manifest) ? manifest : []).filter(
        (assetUrl) =>
          typeof assetUrl === "string" && assetUrl.startsWith("/assets/"),
      );
      await cache.put("/shell-assets.json", shellManifestResponse);
    }
  } catch {
    // The entry assets parsed from index.html still provide a usable shell.
  }
  await precacheUrls(
    cache,
    [...new Set([...indexAssetUrls, ...shellAssetUrls])],
  );
  await trimCache(cache, CACHE_LIMITS[CACHE_NAME]);
}

/**
 * Precaches a batch of URLs without letting a single missing asset cost the
 * whole installation. Every failure is collected and reported, the remaining
 * URLs keep being cached, and the worker still reaches `activated` so the
 * reader keeps the offline shell instead of silently staying on an old worker.
 */
async function precacheUrls(cache, urls, concurrency = 4) {
  let cursor = 0;
  const failures = [];
  const workers = Array.from(
    { length: Math.min(concurrency, urls.length) },
    async () => {
      while (cursor < urls.length) {
        const url = urls[cursor];
        cursor += 1;
        try {
          const response = await fetch(url, { cache: "reload" });
          if (!response.ok) {
            failures.push(`${url} (${response.status})`);
            continue;
          }
          await cache.put(url, response);
        } catch (error) {
          failures.push(`${url} (${error?.name || "network error"})`);
        }
      }
    },
  );
  await Promise.all(workers);
  if (failures.length) {
    console.warn(
      `[sw] ${failures.length} precache miss(es), install continues:`,
      failures.slice(0, 10).join(", "),
    );
  }
  return failures;
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
              key !== API_CACHE_NAME &&
              key !== QCF_FONT_CACHE_NAME,
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

  // Explicitly downloaded recitations live in Cache Storage. Serving them
  // here lets the native audio element keep the same URL online and offline.
  if (isTrustedAudioRequest(event.request, url)) {
    event.respondWith(audioCacheFirst(event.request));
    return;
  }

  // ── 1. Polices – Cache-First ────────────────────────────────────────────────
  if (isSameOrigin && url.pathname.startsWith("/fonts/")) {
    event.respondWith(cacheFirst(event.request, CACHE_NAME));
    return;
  }
  // Les polices de page QCF (Hafs) viennent du CDN verses.quran.foundation.
  // Une fois une page ouverte, son glyphe reste disponible hors ligne.
  if (
    url.hostname === "verses.quran.foundation" &&
    url.pathname.startsWith("/fonts/")
  ) {
    event.respondWith(cacheFirst(event.request, QCF_FONT_CACHE_NAME));
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

  // ── 4. API Coran – Stale-While-Revalidate ──────────────────────────────────
  // Le texte coranique est immuable, mais les traductions et tafsirs servis par
  // ces hôtes sont révisés en amont : le cache-first les épinglait pour toujours.
  // Le JSON en cache répond toujours instantanément (retour en arrière, hors
  // ligne) pendant que le réseau le rafraîchit en arrière-plan, au plus une
  // fois par API_REVALIDATE_MIN_INTERVAL_MS pour une même URL.
  if (url.hostname === "api.alquran.cloud" || url.hostname === "api.quran.com") {
    event.respondWith(
      staleWhileRevalidate(
        event.request,
        API_CACHE_NAME,
        event,
        API_REVALIDATE_MIN_INTERVAL_MS,
      ),
    );
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

function isTrustedAudioRequest(request, url) {
  if (request.destination && request.destination !== "audio") return false;
  if (!/\.mp3$/i.test(url.pathname)) return false;
  const host = url.hostname.toLowerCase();
  return (
    host === "cdn.islamic.network" ||
    host === "everyayah.com" ||
    host === "www.everyayah.com" ||
    host === "download.quranicaudio.com" ||
    host === "audio.qurancdn.com" ||
    host === "verses.quran.com" ||
    /^server\d+\.mp3quran\.net$/i.test(host)
  );
}

async function createPartialResponse(response, rangeHeader) {
  // Opaque cross-origin responses cannot be sliced. Preserve their body.
  if (response.type === "opaque" || response.status !== 200) return response;
  const matches = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  // Ignore unsupported/malformed ranges without consuming the full response.
  if (!matches || (!matches[1] && !matches[2])) return response;
  try {
    const buffer = await response.clone().arrayBuffer();
    const total = buffer.byteLength;
    const suffix = !matches[1];
    const start = suffix ? Math.max(0, total - Number(matches[2])) : Number(matches[1]);
    const end = suffix || !matches[2] ? total - 1 : Math.min(Number(matches[2]), total - 1);
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= total || start > end) {
      return new Response(null, {
        status: 416,
        statusText: "Range Not Satisfiable",
        headers: {
          "Content-Range": `bytes */${total}`,
          "Accept-Ranges": "bytes",
        },
      });
    }
    const sliced = buffer.slice(start, end + 1);
    return new Response(sliced, {
      status: 206,
      statusText: "Partial Content",
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "audio/mpeg",
        "Content-Range": `bytes ${start}-${end}/${total}`,
        "Content-Length": String(sliced.byteLength),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch {
    return response;
  }
}

async function audioCacheFirst(request) {
  try {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    const cached = await cache.match(request, { ignoreVary: true });
    if (cached) {
      const rangeHeader = request.headers.get("range");
      return rangeHeader ? createPartialResponse(cached, rangeHeader) : cached;
    }
  } catch { /* Storage unavailable must not prevent online streaming. */ }

  try {
    // Streaming stays network-only until the user explicitly downloads it.
    return await fetch(request);
  } catch {
    return Response.error();
  }
}

function isTrustedClientMessage(event) {
  const senderUrl = event.source?.url;
  if (!senderUrl) return false;
  try {
    const sender = new URL(senderUrl);
    const scope = new URL(self.registration.scope);
    return (
      sender.origin === self.location.origin &&
      sender.href.startsWith(scope.href)
    );
  } catch {
    return false;
  }
}

self.addEventListener("message", (event) => {
  if (!isTrustedClientMessage(event)) return;
  if (!event.data || typeof event.data !== "object") return;

  switch (event.data.type) {
    // The page lists the same-origin assets and fonts it loaded before this
    // worker took control (the first visit): they must be in the shell cache
    // for an offline reload.
    case "CACHE_SHELL_URLS": {
      const urls = (Array.isArray(event.data.urls) ? event.data.urls : [])
        .filter(
          (value) =>
            typeof value === "string" &&
            (value.startsWith("/assets/") || value.startsWith("/fonts/")),
        )
        .slice(0, 200);
      event.waitUntil(
        caches
          .open(CACHE_NAME)
          .then(async (cache) => {
            const missing = [];
            for (const url of urls) {
              if (!(await cache.match(url))) missing.push(url);
            }
            if (missing.length) await precacheUrls(cache, missing);
            await trimCache(cache, CACHE_LIMITS[CACHE_NAME]);
          })
          .catch(() => {}),
      );
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
    case "SKIP_WAITING": {
      claimClientsOnActivate = true;
      event.waitUntil(self.skipWaiting());
      break;
    }

    default:
      break;
  }
});

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
  // Static shell files are identical with or without the Origin header.
  // Vary: Origin must not hide files fetched during worker installation.
  const url = new URL(request.url);
  const immutableShell = cacheName === CACHE_NAME &&
    url.origin === self.location.origin && /^\/(assets|fonts)\//.test(url.pathname);
  const cached = await cache.match(request, { ignoreVary: immutableShell });
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
 *
 * `revalidateAfterMs` borne la cadence de revalidation par URL : sans lui, un
 * changement de sourate ou de page relancerait chaque requête déjà vue. Une
 * entrée absente du cache interroge toujours le réseau.
 */
async function staleWhileRevalidate(
  request,
  cacheName,
  event,
  revalidateAfterMs = 0,
) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const now = Date.now();
  const lastRevalidation = apiRevalidatedAt.get(request.url) || 0;
  const throttled =
    !!cached && revalidateAfterMs > 0 && now - lastRevalidation < revalidateAfterMs;

  let networkPromise = null;
  if (!throttled) {
    if (revalidateAfterMs > 0) {
      apiRevalidatedAt.set(request.url, now);
      if (apiRevalidatedAt.size > 300) {
        for (const [url, at] of apiRevalidatedAt) {
          if (now - at >= revalidateAfterMs) apiRevalidatedAt.delete(url);
        }
      }
    }
    networkPromise = fetchWithTimeout(request)
      .then(async (response) => {
        if (response?.ok) {
          await putBounded(cache, request, response.clone(), cacheName);
        }
        return response;
      })
      .catch(() => null);
  }

  if (cached) {
    if (networkPromise) {
      event?.waitUntil(networkPromise.then(() => undefined));
    }
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
