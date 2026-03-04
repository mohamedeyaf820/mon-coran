/**
 * QuranAPI service – fetches text, translations, search via AlQuran Cloud API.
 * Supports Hafs & Warsh editions.
 * Optimized: AbortController, timeout, request deduplication, IndexedDB persistent cache.
 */

// Direct call to AlQuran Cloud public API (supports CORS).
// No backend proxy needed — the app is a pure static SPA.
const BASE = 'https://api.alquran.cloud/v1';
const FETCH_TIMEOUT = 8000; // 8s timeout for API requests

const EDITIONS = {
  hafs: ['quran-uthmani', 'quran-uthmani-min', 'quran-simple'],
  // Warsh text is now handled natively via QCF4 fonts (warshService.js).
  // This fallback is only used if the local Warsh data fails to load.
  warsh: ['quran-uthmani', 'quran-uthmani-min'],
};

// Flag to track when Warsh text falls back to Hafs script
let lastWarshFallback = false;
export function wasWarshTextFallback() { return lastWarshFallback; }

const TRANSLATION_EDITIONS = {
  fr: 'fr.hamidullah',
  en: 'en.sahih',
};

// In-memory cache with size limit
const cache = new Map();
const CACHE_MAX_SIZE = 500;

// Request deduplication: pending fetches by URL
const inflight = new Map();

// Current AbortController for cancellable navigations
let currentAbort = null;

import { dbGet, dbSet, getDB } from './dbService';

const IDB_API_PREFIX = 'api:';
const IDB_STORE = 'cache';
const IDB_CACHE_TTL_BY_KIND = {
  audio: 14 * 24 * 60 * 60 * 1000,       // 14 days
  text: 7 * 24 * 60 * 60 * 1000,         // 7 days
  translation: 2 * 24 * 60 * 60 * 1000,  // 2 days
};

function getCacheKindByUrl(url) {
  const u = String(url || '').toLowerCase();
  if (u.includes('/audio/')) return 'audio';
  if (u.includes('fr.hamidullah') || u.includes('en.sahih') || /\/search\//.test(u)) return 'translation';
  return 'text';
}

function getCacheTtlByUrl(url) {
  const kind = getCacheKindByUrl(url);
  return IDB_CACHE_TTL_BY_KIND[kind] || IDB_CACHE_TTL_BY_KIND.text;
}

/**
 * Create a new AbortController, cancelling the previous one.
 * This prevents stale requests from slower navigations.
 */
export function abortPendingRequests() {
  if (currentAbort) {
    currentAbort.abort();
  }
  currentAbort = new AbortController();
  return currentAbort.signal;
}

function pruneCache() {
  if (cache.size > CACHE_MAX_SIZE) {
    const keysToDelete = [...cache.keys()].slice(0, cache.size - CACHE_MAX_SIZE + 20);
    keysToDelete.forEach(k => cache.delete(k));
  }
}

async function fetchJSON(url, signal) {
  // 1. Check in-memory cache (instant, ~0ms)
  const cached = cache.get(url);
  if (cached) return cached;

  // 2. Check IndexedDB persistent cache
  const idbKey = IDB_API_PREFIX + url;
  try {
    const persisted = await dbGet(IDB_STORE, idbKey);
    if (persisted && persisted.data) {
      const expiry = persisted.expiryAt || (persisted.ts ? persisted.ts + getCacheTtlByUrl(url) : 0);
      // If not expired, use it directly
      if (expiry > Date.now()) {
        cache.set(url, persisted.data);
        pruneCache();
        return persisted.data;
      }
      // If expired but we have data, use stale data AND refresh in background
      if (persisted.data) {
        cache.set(url, persisted.data);
        pruneCache();
        // Refresh in background (fire-and-forget)
        _refreshInBackground(url, idbKey, signal);
        return persisted.data;
      }
    }
  } catch { /* IDB read failure — continue to network */ }

  // 3. Deduplicate: if same URL is already being fetched, reuse its promise
  if (inflight.has(url)) {
    return inflight.get(url);
  }

  const promise = _fetchFromNetwork(url, idbKey, signal);
  inflight.set(url, promise);
  return promise;
}

async function _fetchFromNetwork(url, idbKey, signal) {
  const timeoutCtrl = new AbortController();
  const timeoutId = setTimeout(() => timeoutCtrl.abort(), FETCH_TIMEOUT);

  try {
    // Combine the navigation signal with the timeout signal
    const combinedSignal = signal
      ? AbortSignal.any ? AbortSignal.any([signal, timeoutCtrl.signal]) : signal
      : timeoutCtrl.signal;

    const res = await fetch(url, { signal: combinedSignal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`API error ${res.status}: ${url}`);
    let json;
    try {
      json = await res.json();
    } catch {
      throw new Error('Invalid API JSON response');
    }

    if (!json || typeof json !== 'object') {
      throw new Error('Malformed API response');
    }

    if (json.code !== 200 || json.status !== 'OK') {
      const msg = typeof json.data === 'string' ? json.data : JSON.stringify(json.data) || 'Unknown API error';
      throw new Error(msg);
    }

    cache.set(url, json.data);
    pruneCache();

    // Persist to IndexedDB in the background (non-blocking)
    const now = Date.now();
    dbSet(IDB_STORE, {
      key: idbKey || (IDB_API_PREFIX + url),
      data: json.data,
      ts: now,
      kind: getCacheKindByUrl(url),
      expiryAt: now + getCacheTtlByUrl(url),
    }).catch(() => { });

    return json.data;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  } finally {
    inflight.delete(url);
  }
}

function _refreshInBackground(url, idbKey) {
  // Don't deduplicate background refreshes — they're best-effort
  _fetchFromNetwork(url, idbKey, null).catch(() => { });
}

function sanitizeText(text) {
  if (typeof text !== 'string') return text;
  return text.replace(/^\uFEFF/, '');
}

function normalizeQuranPayload(data) {
  if (!data) return data;

  if (Array.isArray(data.ayahs)) {
    return {
      ...data,
      ayahs: data.ayahs.map(a => ({ ...a, text: sanitizeText(a.text) })),
    };
  }

  if (data.text) {
    return { ...data, text: sanitizeText(data.text) };
  }

  return data;
}

async function fetchWithEditionFallback(pathPrefix, riwaya = 'hafs', signal) {
  const editions = EDITIONS[riwaya] || EDITIONS.hafs;
  let lastError = null;

  // Track Warsh fallback (text is always Hafs orthography for Warsh)
  lastWarshFallback = (riwaya === 'warsh');

  for (const edition of editions) {
    try {
      const data = await fetchJSON(`${BASE}/${pathPrefix}/${edition}`, signal);
      const normalized = normalizeQuranPayload(data);
      return {
        ...normalized,
        requestedRiwaya: riwaya,
        usedEdition: normalized?.edition?.identifier || edition,
        isTextFallback: riwaya === 'warsh',
      };
    } catch (err) {
      // If aborted, throw immediately — don't try next edition
      if (err.name === 'AbortError') throw err;
      lastError = err;
    }
  }

  throw lastError || new Error(`No edition available for riwaya: ${riwaya}`);
}

/* ── Surah Text ──────────────────────────────── */

export async function getSurahText(surahNum, riwaya = 'hafs', signal) {
  return fetchWithEditionFallback(`surah/${surahNum}`, riwaya, signal);
}

export async function getSurahTranslation(surahNum, lang = 'fr', signal) {
  const edition = TRANSLATION_EDITIONS[lang] || TRANSLATION_EDITIONS.fr;
  return fetchJSON(`${BASE}/surah/${surahNum}/${edition}`, signal);
}

/**
 * Fetch surah text + translation in parallel
 */
export async function getSurahFull(surahNum, riwaya = 'hafs', transLang = 'fr', signal) {
  const [arabicResult, translationResult] = await Promise.allSettled([
    getSurahText(surahNum, riwaya, signal),
    getSurahTranslation(surahNum, transLang, signal),
  ]);

  if (arabicResult.status !== 'fulfilled') {
    throw arabicResult.reason || new Error('Arabic text fetch failed');
  }

  const translation = translationResult.status === 'fulfilled'
    ? translationResult.value
    : { ayahs: [] };

  const arabic = arabicResult.value;
  return { arabic, translation };
}

/* ── Single Ayah ─────────────────────────────── */

export async function getAyah(surahNum, ayahNum, riwaya = 'hafs', signal) {
  return fetchWithEditionFallback(`ayah/${surahNum}:${ayahNum}`, riwaya, signal);
}

/* ── Juz ─────────────────────────────────────── */

export async function getJuz(juzNum, riwaya = 'hafs', signal) {
  return fetchWithEditionFallback(`juz/${juzNum}`, riwaya, signal);
}

export async function getJuzTranslation(juzNum, lang = 'fr', signal) {
  const edition = TRANSLATION_EDITIONS[lang] || TRANSLATION_EDITIONS.fr;
  return fetchJSON(`${BASE}/juz/${juzNum}/${edition}`, signal);
}

/* ── Page (Mushaf page 1-604) ────────────────── */

export async function getPage(pageNum, riwaya = 'hafs', signal) {
  return fetchWithEditionFallback(`page/${pageNum}`, riwaya, signal);
}

export async function getPageTranslation(pageNum, lang = 'fr', signal) {
  const edition = TRANSLATION_EDITIONS[lang] || TRANSLATION_EDITIONS.fr;
  return fetchJSON(`${BASE}/page/${pageNum}/${edition}`, signal);
}

export async function getPageFull(pageNum, riwaya = 'hafs', transLang = 'fr', signal) {
  const [arabicResult, translationResult] = await Promise.allSettled([
    getPage(pageNum, riwaya, signal),
    getPageTranslation(pageNum, transLang, signal),
  ]);

  if (arabicResult.status !== 'fulfilled') {
    throw arabicResult.reason || new Error('Arabic page fetch failed');
  }

  const translation = translationResult.status === 'fulfilled'
    ? translationResult.value
    : { ayahs: [] };

  const arabic = arabicResult.value;
  return { arabic, translation };
}

/* ── Search ──────────────────────────────────── */

export async function search(query, riwaya = 'hafs', surahNum = null, signal) {
  const scope = surahNum ? `/${surahNum}` : '';
  const editions = EDITIONS[riwaya] || EDITIONS.hafs;
  let lastError = null;

  for (const edition of editions) {
    try {
      return await fetchJSON(`${BASE}/search/${encodeURIComponent(query)}/all/${edition}${scope}`, signal);
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      lastError = err;
    }
  }

  throw lastError || new Error('Search failed');
}

/* ── Helpers ─────────────────────────────────── */

export async function clearCache() {
  cache.clear();
  try {
    const db = await getDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    let cursor = await store.openCursor();
    while (cursor) {
      if (typeof cursor.key === 'string' && cursor.key.startsWith(IDB_API_PREFIX)) {
        await cursor.delete();
      }
      cursor = await cursor.continue();
    }
  } catch (err) {
    console.warn('Cache clear error:', err);
  }
}

/**
 * Build audio URL for a specific ayah.
 * Uses the Islamic.network CDN structure — requires the global ayah number (1-6236).
 * @param {string} reciterCdn - reciter CDN folder name
 * @param {number} globalAyahNumber - global ayah number in the whole Quran (1-6236)
 */
export function getAudioUrl(reciterCdn, globalAyahNumber) {
  return `https://cdn.islamic.network/quran/audio/128/${reciterCdn}/${globalAyahNumber}.mp3`;
}

/**
 * Alternative: use ayah reference from API which includes audioUrl
 */
export function getAudioUrlFromAyah(ayahData) {
  return ayahData?.audio || ayahData?.audioSecondary?.[0] || null;
}

/**
 * Prefetch initial data during splash screen so it's cached when the app mounts.
 * Fire-and-forget — errors are silently ignored.
 */
export function prefetchInitialData(surahNum, riwaya, translationLang = 'fr') {
  try {
    const transEdition = TRANSLATION_EDITIONS[translationLang] || TRANSLATION_EDITIONS.fr;
    const transUrl = `${BASE}/surah/${surahNum}/${transEdition}`;

    if (riwaya === 'warsh') {
      // Prefetch warsh.json (local, fast) + Hafs text (for karaoke) + translation
      fetch('/data/warsh.json', { priority: 'high' }).catch(() => { });
      // Also warm the Hafs text cache for karaoke word weighting
      const editions = EDITIONS.hafs;
      fetchJSON(`${BASE}/surah/${surahNum}/${editions[0]}`).catch(() => { });
      fetchJSON(transUrl).catch(() => { });
    } else {
      // Prefetch Hafs text + translation into the in-memory cache
      const editions = EDITIONS[riwaya] || EDITIONS.hafs;
      fetchJSON(`${BASE}/surah/${surahNum}/${editions[0]}`).catch(() => { });
      fetchJSON(transUrl).catch(() => { });
      // Also prefetch next surah for instant navigation
      if (surahNum < 114) {
        fetchJSON(`${BASE}/surah/${surahNum + 1}/${editions[0]}`).catch(() => { });
        fetchJSON(`${BASE}/surah/${surahNum + 1}/${transEdition}`).catch(() => { });
      }
    }
  } catch {
    // Prefetch is best-effort
  }
}
