/**
 * QuranAPI service – fetches text, translations, search via AlQuran Cloud API.
 * Supports Hafs & Warsh editions.
 * Optimized: AbortController, timeout, request deduplication, IndexedDB persistent cache.
 */

import { WARSH_DATA_BASE_URL } from '../constants/warshSource';
import { preloadWarshSurah } from './warshService';


// Direct call to AlQuran Cloud public API (supports CORS).
// No backend proxy needed — the app is a pure static SPA.
const BASE = 'https://api.alquran.cloud/v1';
const FETCH_TIMEOUT = 8000; // 8s timeout for API requests

const EDITIONS = {
  hafs: ['quran-uthmani', 'quran-uthmani-min', 'quran-simple'],
  // Warsh text is handled by warshService.js from the shared JSON source.
  // This fallback is only used if the local Warsh data fails to load.
  warsh: ['quran-uthmani', 'quran-uthmani-min'],
};

// Flag to track when Warsh text falls back to Hafs script
let lastWarshFallback = false;
export function wasWarshTextFallback() { return lastWarshFallback; }

const TRANSLATION_EDITIONS = {
  fr: 'fr.hamidullah',
  en: 'en.sahih',
  es: 'es.cortes',
  de: 'de.aburida',
  tr: 'tr.diyanet',
  ur: 'ur.junagarhi',
};

// In-memory cache with size limit
const cache = new Map();
const CACHE_MAX_SIZE = 500;

// Request deduplication: pending fetches by URL + abort signal identity.
const inflight = new Map();

// Current AbortController for cancellable navigations
let currentAbort = null;

import { dbGet, dbSet, getDB } from './dbService';
import { normalizeArabicSearchText } from '../utils/searchIntelligence';

const IDB_API_PREFIX = 'api:';
const IDB_STORE = 'cache';
const SEARCH_INDEX_IDB_KEY = `${IDB_API_PREFIX}search-index-v1`;
const SEARCH_INDEX_TTL = 30 * 24 * 60 * 60 * 1000;
const IDB_CACHE_TTL_BY_KIND = {
  audio: 14 * 24 * 60 * 60 * 1000,       // 14 days
  text: 7 * 24 * 60 * 60 * 1000,         // 7 days
  translation: 2 * 24 * 60 * 60 * 1000,  // 2 days
};

function getCacheKindByUrl(url) {
  const u = String(url || '').toLowerCase();
  if (u.includes('/audio/')) return 'audio';
  if (
    Object.values(TRANSLATION_EDITIONS).some((edition) => u.includes(String(edition).toLowerCase())) ||
    /\/search\//.test(u)
  ) return 'translation';
  return 'text';
}

function getCacheTtlByUrl(url) {
  const kind = getCacheKindByUrl(url);
  return IDB_CACHE_TTL_BY_KIND[kind] || IDB_CACHE_TTL_BY_KIND.text;
}

function isObjectLike(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isAyahLike(value) {
  return (
    isObjectLike(value) &&
    Number.isFinite(Number(value.numberInSurah)) &&
    Number.isFinite(Number(value.number || 0)) &&
    typeof value.text === 'string'
  );
}

function isSurahLike(value) {
  return (
    isObjectLike(value) &&
    Number.isFinite(Number(value.number || 0)) &&
    Array.isArray(value.ayahs)
  );
}

function validateApiDataShape(url, data) {
  const u = String(url || '').toLowerCase();

  if (/\/search\//.test(u)) {
    if (!isObjectLike(data) || !Array.isArray(data.matches)) {
      throw new Error('Invalid API schema: search.matches[] expected');
    }
    return data;
  }

  if (/\/quran\//.test(u)) {
    if (!isObjectLike(data) || !Array.isArray(data.surahs) || !data.surahs.every(isSurahLike)) {
      throw new Error('Invalid API schema: quran.surahs[] expected');
    }
    return data;
  }

  if (/\/(surah|juz|page|ayah)\//.test(u)) {
    if (Array.isArray(data)) {
      const allObjects = data.every(isObjectLike);
      if (!allObjects) {
        throw new Error('Invalid API schema: editions[] objects expected');
      }
      return data;
    }

    if (!isObjectLike(data)) {
      throw new Error('Invalid API schema: object payload expected');
    }

    const hasAyahs = Array.isArray(data.ayahs) && data.ayahs.every(isAyahLike);
    const hasSurahs = Array.isArray(data.surahs) && data.surahs.every(isSurahLike);
    if (!hasAyahs && !hasSurahs) {
      throw new Error('Invalid API schema: ayahs[] or surahs[] expected');
    }
    return data;
  }

  return data;
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
    const active = inflight.get(url);
    if (active && active.signal === (signal || null)) {
      return active.promise;
    }
  }

  const entry = {
    signal: signal || null,
    promise: _fetchFromNetwork(url, idbKey, signal),
  };
  inflight.set(url, entry);
  entry.promise.finally(() => {
    const current = inflight.get(url);
    if (current === entry) {
      inflight.delete(url);
    }
  });
  return entry.promise;
}

async function _fetchFromNetwork(url, idbKey, signal) {
  const timeoutCtrl = new AbortController();
  const timeoutId = setTimeout(() => timeoutCtrl.abort(), FETCH_TIMEOUT);

  try {
    // Combine the navigation signal with the timeout signal
    const combinedSignal = signal
      ? createMergedAbortSignal([signal, timeoutCtrl.signal])
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

    const validatedData = validateApiDataShape(url, json.data);
    cache.set(url, validatedData);
    pruneCache();

    // Persist to IndexedDB in the background (non-blocking)
    const now = Date.now();
    dbSet(IDB_STORE, {
      key: idbKey || (IDB_API_PREFIX + url),
      data: validatedData,
      ts: now,
      kind: getCacheKindByUrl(url),
      expiryAt: now + getCacheTtlByUrl(url),
    }).catch(() => { });

    return validatedData;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

function _refreshInBackground(url, idbKey) {
  // Don't deduplicate background refreshes — they're best-effort
  _fetchFromNetwork(url, idbKey, null).catch(() => { });
}

async function fetchJSONWithCustomTimeout(url, signal, timeoutMs = FETCH_TIMEOUT) {
  const timeoutCtrl = new AbortController();
  const timeoutId = setTimeout(() => timeoutCtrl.abort(), timeoutMs);

  try {
    const combinedSignal = signal
      ? createMergedAbortSignal([signal, timeoutCtrl.signal])
      : timeoutCtrl.signal;

    const res = await fetch(url, { signal: combinedSignal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`API error ${res.status}: ${url}`);
    const json = await res.json();

    if (!json || typeof json !== 'object') {
      throw new Error('Malformed API response');
    }

    if (json.code !== 200 || json.status !== 'OK') {
      const msg = typeof json.data === 'string' ? json.data : JSON.stringify(json.data) || 'Unknown API error';
      throw new Error(msg);
    }

    return validateApiDataShape(url, json.data);
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

function sanitizeText(text) {
  if (typeof text !== 'string') return text;
  return text.replace(/^\uFEFF/, '');
}

let arabicSearchIndex = null;
let arabicSearchIndexPromise = null;

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

function isValidSearchIndex(index) {
  return (
    Array.isArray(index) &&
    index.every(
      (item) =>
        item &&
        Number.isFinite(Number(item.surah)) &&
        Number.isFinite(Number(item.numberInSurah)) &&
        typeof item.text === 'string' &&
        typeof item.normalized === 'string'
    )
  );
}

function buildArabicSearchIndexFromQuran(quranData) {
  const surahs = Array.isArray(quranData?.surahs) ? quranData.surahs : [];
  return surahs.flatMap((surah) =>
    (Array.isArray(surah?.ayahs) ? surah.ayahs : [])
      .map((ayah) => {
        const text = sanitizeText(ayah?.text || '');
        return {
          surah: surah?.number || ayah?.surah?.number || 0,
          numberInSurah: ayah?.numberInSurah || 0,
          number: ayah?.number || 0,
          text,
          normalized: normalizeArabicSearchText(text),
        };
      })
      .filter((ayah) => ayah.surah > 0 && ayah.numberInSurah > 0 && ayah.normalized)
  );
}

async function loadArabicSearchIndex(signal) {
  if (arabicSearchIndex) return arabicSearchIndex;
  if (arabicSearchIndexPromise) return arabicSearchIndexPromise;

  arabicSearchIndexPromise = (async () => {
    try {
      const cached = await dbGet(IDB_STORE, SEARCH_INDEX_IDB_KEY);
      if (
        cached?.data &&
        isValidSearchIndex(cached.data) &&
        (cached.expiryAt || 0) > Date.now()
      ) {
        arabicSearchIndex = cached.data;
        return arabicSearchIndex;
      }
    } catch {
      // continue to network/index build
    }

    const editions = ['quran-uthmani', 'quran-simple', 'quran-uthmani-min'];
    let index = null;
    let lastError = null;

    for (const edition of editions) {
      try {
        const data = await fetchJSONWithCustomTimeout(
          `${BASE}/quran/${edition}`,
          signal,
          25000,
        );
        index = buildArabicSearchIndexFromQuran(data);
        if (index.length > 0) break;
      } catch (err) {
        if (err.name === 'AbortError') throw err;
        lastError = err;
      }
    }

    if (!index || index.length === 0) {
      try {
        const surahPayloads = await Promise.all(
          Array.from({ length: 114 }, (_, idx) =>
            fetchWithEditionFallback(`surah/${idx + 1}`, 'hafs', signal)
          )
        );
        index = surahPayloads.flatMap((surahPayload) =>
          (Array.isArray(surahPayload?.ayahs) ? surahPayload.ayahs : [])
            .map((ayah) => {
              const text = sanitizeText(ayah?.text || '');
              return {
                surah: ayah?.surah?.number || 0,
                numberInSurah: ayah?.numberInSurah || 0,
                number: ayah?.number || 0,
                text,
                normalized: normalizeArabicSearchText(text),
              };
            })
            .filter((ayah) => ayah.surah > 0 && ayah.numberInSurah > 0 && ayah.normalized)
        );
      } catch (err) {
        if (err.name === 'AbortError') throw err;
        lastError = err;
      }
    }

    if (!index || index.length === 0) {
      throw lastError || new Error('Arabic search index unavailable');
    }

    arabicSearchIndex = index;
    const now = Date.now();
    dbSet(IDB_STORE, {
      key: SEARCH_INDEX_IDB_KEY,
      data: index,
      ts: now,
      kind: 'text',
      expiryAt: now + SEARCH_INDEX_TTL,
    }).catch(() => {});

    return arabicSearchIndex;
  })().catch((err) => {
    arabicSearchIndexPromise = null;
    throw err;
  });

  return arabicSearchIndexPromise;
}

async function searchArabicLocally(query, surahNum = null, signal) {
  const normalizedQuery = normalizeArabicSearchText(query);
  if (!normalizedQuery) return { matches: [] };

  const queryWords = normalizedQuery.split(' ').filter(Boolean);
  const index = await loadArabicSearchIndex(signal);
  const matches = [];

  for (const ayah of index) {
    if (surahNum && Number(ayah.surah) !== Number(surahNum)) continue;
    if (!ayah.normalized) continue;

    const startsWith = ayah.normalized.startsWith(normalizedQuery);
    const includes = startsWith ? true : ayah.normalized.includes(normalizedQuery);
    if (!includes) continue;

    let score = startsWith ? 1000 : 620;
    if (queryWords.length > 1 && ayah.normalized.startsWith(queryWords[0])) score += 90;
    if (ayah.normalized.length < normalizedQuery.length + 18) score += 45;
    score -= ayah.numberInSurah * 0.01;
    score -= ayah.surah * 0.001;

    matches.push({
      surah: { number: ayah.surah },
      numberInSurah: ayah.numberInSurah,
      number: ayah.number,
      text: ayah.text,
      _score: score,
    });
  }

  matches.sort((a, b) => b._score - a._score);
  return {
    matches: matches.slice(0, 40).map(({ _score, ...rest }) => rest),
  };
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

export async function getSurahTranslation(surahNum, langs = ['fr'], signal) {
  const langArray = Array.isArray(langs) ? langs : [langs];
  const editions = langArray.map(l => TRANSLATION_EDITIONS[l] || TRANSLATION_EDITIONS.fr).join(',');
  const data = await fetchJSON(`${BASE}/surah/${surahNum}/${editions}`, signal);
  // AlQuran Cloud returns an array if multiple editions are requested, otherwise a single object
  return Array.isArray(data) ? data : [data];
}

/**
 * Fetch surah text + multiple translations in parallel
 */
export async function getSurahFull(surahNum, riwaya = 'hafs', transLangs = ['fr'], signal) {
  const needsHafsForTranslit = riwaya === 'warsh';

  const promises = [
    getSurahText(surahNum, riwaya, signal),
    getSurahTranslation(surahNum, transLangs, signal),
  ];

  if (needsHafsForTranslit) {
    promises.push(getSurahText(surahNum, 'hafs', signal));
  }

  const results = await Promise.allSettled(promises);

  if (results[0].status !== 'fulfilled') {
    throw results[0].reason || new Error('Arabic text fetch failed');
  }

  const arabic = results[0].value;
  const translations = results[1].status === 'fulfilled' ? results[1].value : [];

  if (needsHafsForTranslit && results[2].status === 'fulfilled') {
    const hafs = results[2].value;
    if (arabic.ayahs && hafs.ayahs) {
      arabic.ayahs = arabic.ayahs.map((a, i) => ({
        ...a,
        hafsText: hafs.ayahs[i]?.text || null
      }));
    }
  }

  return { arabic, translations };
}

/* ── Single Ayah ─────────────────────────────── */

export async function getAyah(surahNum, ayahNum, riwaya = 'hafs', signal) {
  return fetchWithEditionFallback(`ayah/${surahNum}:${ayahNum}`, riwaya, signal);
}

/* ── Juz ─────────────────────────────────────── */

export async function getJuz(juzNum, riwaya = 'hafs', signal) {
  return fetchWithEditionFallback(`juz/${juzNum}`, riwaya, signal);
}

export async function getJuzTranslation(juzNum, langs = ['fr'], signal) {
  const langArray = Array.isArray(langs) ? langs : [langs];
  const editions = langArray.map(l => TRANSLATION_EDITIONS[l] || TRANSLATION_EDITIONS.fr).join(',');
  const data = await fetchJSON(`${BASE}/juz/${juzNum}/${editions}`, signal);
  return Array.isArray(data) ? data : [data];
}

/* ── Page (Mushaf page 1-604) ────────────────── */

export async function getPage(pageNum, riwaya = 'hafs', signal) {
  return fetchWithEditionFallback(`page/${pageNum}`, riwaya, signal);
}

export async function getPageTranslation(pageNum, langs = ['fr'], signal) {
  const langArray = Array.isArray(langs) ? langs : [langs];
  const editions = langArray.map(l => TRANSLATION_EDITIONS[l] || TRANSLATION_EDITIONS.fr).join(',');
  const data = await fetchJSON(`${BASE}/page/${pageNum}/${editions}`, signal);
  return Array.isArray(data) ? data : [data];
}

export async function getPageFull(pageNum, riwaya = 'hafs', transLangs = ['fr'], signal) {
  const needsHafsForTranslit = riwaya === 'warsh';

  const promises = [
    getPage(pageNum, riwaya, signal),
    getPageTranslation(pageNum, transLangs, signal),
  ];

  if (needsHafsForTranslit) {
    promises.push(getPage(pageNum, 'hafs', signal));
  }

  const results = await Promise.allSettled(promises);

  if (results[0].status !== 'fulfilled') {
    throw results[0].reason || new Error('Arabic page fetch failed');
  }

  const arabic = results[0].value;
  const translations = results[1].status === 'fulfilled' ? results[1].value : [];

  if (needsHafsForTranslit && results[2].status === 'fulfilled') {
    const hafs = results[2].value;
    if (arabic.ayahs && hafs.ayahs) {
      arabic.ayahs = arabic.ayahs.map((a, i) => ({
        ...a,
        hafsText: hafs.ayahs[i]?.text || null
      }));
    }
  }

  return { arabic, translations };
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

  try {
    return await searchArabicLocally(query, surahNum, signal);
  } catch (fallbackError) {
    if (fallbackError.name === 'AbortError') throw fallbackError;
  }

  throw lastError || new Error('Search failed');
}

/**
 * Search inside a translation edition (fr/en/…).
 * Returns { matches: [{ surah, numberInSurah, text, translationText }] }
 */
export async function searchTranslation(query, lang = 'fr', surahNum = null, signal) {
  const edition = TRANSLATION_EDITIONS[lang] || TRANSLATION_EDITIONS.fr;
  const scope = surahNum ? `/${surahNum}` : '';
  const data = await fetchJSON(
    `${BASE}/search/${encodeURIComponent(query)}/all/${edition}${scope}`,
    signal,
  );
  // data.matches items have { surah, numberInSurah, text } where text is the translation
  return data;
}

/* ── Helpers ─────────────────────────────────── */

export async function clearCache() {
  cache.clear();
  arabicSearchIndex = null;
  arabicSearchIndexPromise = null;
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
      // Prefetch the Warsh dataset from the shared remote source + Hafs text (for karaoke) + translation
      preloadWarshSurah(surahNum);
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

// Polyfill pour AbortSignal.any (Edge < 125, Safari < 17.4)
function createMergedAbortSignal(signals) {
  const validSignals = (signals || []).filter(Boolean);
  if (!validSignals.length) {
    return new AbortController().signal;
  }

  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.any === 'function') {
    return AbortSignal.any(validSignals);
  }

  // Fallback: merge manuel avec gestion des signaux deja abortes + cleanup listeners.
  const controller = new AbortController();
  if (validSignals.some((signal) => signal.aborted)) {
    controller.abort();
    return controller.signal;
  }

  const listeners = [];
  const cleanup = () => {
    listeners.forEach(({ signal, onAbort }) => {
      signal.removeEventListener('abort', onAbort);
    });
    listeners.length = 0;
  };

  const abortMerged = () => {
    if (!controller.signal.aborted) {
      controller.abort();
    }
    cleanup();
  };

  validSignals.forEach((signal) => {
    const onAbort = () => abortMerged();
    listeners.push({ signal, onAbort });
    signal.addEventListener('abort', onAbort, { once: true });
  });

  return controller.signal;
}
