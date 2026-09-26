/**
 * QuranAPI service – fetches text, translations, search via AlQuran Cloud API.
 * Supports Hafs & Warsh editions.
 * Optimized: AbortController, timeout, request deduplication, IndexedDB persistent cache.
 */

import { preloadWarshSurah } from './warshService';
import {
  WARSH_TRANSLATION_EDITION_ID,
  WARSH_TRANSLATION_EDITION_ID_EN,
  getWarshTranslationEdition,
  isWarshTranslationEdition,
} from './warshTranslationService';
import { shouldAvoidBackgroundWork } from '../utils/networkPolicy.js';
import {
  canLoadFromQuranCom,
  fetchQuranComText,
  fetchQuranComTranslations,
} from './quranComAPI';


// Direct call to AlQuran Cloud public API (supports CORS).
// No backend proxy needed — the app is a pure static SPA.
const BASE = 'https://api.alquran.cloud/v1';
const FETCH_TIMEOUT = 8000; // 8s timeout for API requests
const EDITION_FALLBACK_TIMEOUT = 3000;
const USE_QURAN_COM_TEXT = true;

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

// Ids that double as a translationLangs token but are served from the vendored
// Warsh translation assets (scripts/build-warsh-translation.mjs) instead of a
// remote API. They never reach AlQuran Cloud: fetchTranslations splits them out
// with warshTranslationService.isWarshTranslationEdition().

/**
 * Selectable translations: the six remote language shortcuts plus the
 * Warsh-adapted French edition. `riwaya` marks an edition whose numbering only
 * matches one riwaya's mushaf, so it attaches only in that reading.
 */
export const TRANSLATION_CHOICES = [
  ...Object.keys(TRANSLATION_EDITIONS).map((id) => ({ id, label: id.toUpperCase() })),
  {
    id: WARSH_TRANSLATION_EDITION_ID,
    label: 'FR · Warsh',
    labelKey: 'settings.translationWarshLabel',
    riwaya: 'warsh',
  },
  {
    id: WARSH_TRANSLATION_EDITION_ID_EN,
    label: 'EN · Warsh',
    labelKey: 'settings.translationWarshLabelEn',
    riwaya: 'warsh',
  },
];

const QURAN_COM_TRANSLATION_LANGS = new Set(['fr', 'en']);

// In-memory cache with size limit
const cache = new Map();
const CACHE_MAX_SIZE = 500;

// Shared network fetches are keyed by URL. A screen may stop waiting without
// cancelling a request that can still populate the cache for the next screen.
const inflight = new Map();

// Current AbortController for cancellable navigations
let currentAbort = null;

import { dbGet, dbPruneByPrefix, dbSet, getDB } from './dbService';
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

function waitForSharedRequest(promise, signal) {
  if (!signal) return promise;
  if (signal.aborted) {
    return Promise.reject(new DOMException('Request aborted', 'AbortError'));
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => signal.removeEventListener('abort', onAbort);
    const onAbort = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new DOMException('Request aborted', 'AbortError'));
    };

    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(
      (value) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(value);
      },
      (error) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      },
    );
  });
}

async function fetchJSON(url, signal, timeoutMs = FETCH_TIMEOUT) {
  if (signal?.aborted) {
    throw new DOMException('Request aborted', 'AbortError');
  }

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

  if (signal?.aborted) {
    throw new DOMException('Request aborted', 'AbortError');
  }

  // Reuse prefetches for fast riwaya/page switches.
  const existing = inflight.get(url);
  if (existing) {
    return waitForSharedRequest(existing.promise, signal);
  }

  const entry = {
    promise: _fetchFromNetwork(url, idbKey, null, timeoutMs),
  };
  inflight.set(url, entry);
  const cleanup = () => {
    const current = inflight.get(url);
    if (current === entry) {
      inflight.delete(url);
    }
  };
  entry.promise.then(cleanup, cleanup);
  return waitForSharedRequest(entry.promise, signal);
}

async function _fetchFromNetwork(url, idbKey, signal, timeoutMs = FETCH_TIMEOUT) {
  const timeoutCtrl = new AbortController();
  const timeoutId = setTimeout(() => timeoutCtrl.abort(), timeoutMs);

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
    })
      .then(() =>
        dbPruneByPrefix(IDB_STORE, IDB_API_PREFIX, {
          maxEntries: 900,
          maxAgeMs: SEARCH_INDEX_TTL,
        }),
      )
      .catch(() => { });

    return validatedData;
  } catch (err) {
    clearTimeout(timeoutId);
    if (
      err?.name === 'AbortError' &&
      timeoutCtrl.signal.aborted &&
      !signal?.aborted
    ) {
      throw new Error(`API request timed out after ${timeoutMs}ms: ${url}`);
    }
    throw err;
  }
}

// One background refresh per cache key at a time: N callers hitting the same
// expired entry must not fire N identical network requests.
const _backgroundRefreshInFlight = new Set();

function _refreshInBackground(url, idbKey) {
  const key = idbKey || (IDB_API_PREFIX + url);
  if (_backgroundRefreshInFlight.has(key)) return;
  _backgroundRefreshInFlight.add(key);
  _fetchFromNetwork(url, idbKey, null)
    .catch(() => { })
    .finally(() => _backgroundRefreshInFlight.delete(key));
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
      // continue
    }

    // Performance Optimization: Disable full Quran network download (5MB+) on client side.
    // Instead, rely on online API search and fall back gracefully if offline.
    throw new Error('Local search index unavailable');
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
  if (USE_QURAN_COM_TEXT && canLoadFromQuranCom(pathPrefix, riwaya)) {
    try {
      lastWarshFallback = false;
      const data = await fetchQuranComText(pathPrefix, signal);
      if (!Array.isArray(data?.ayahs) || data.ayahs.length) return data;
      throw new Error('Empty Quran.com text payload');
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      console.warn('Primary text API fallback to AlQuran.cloud:', err);
    }
  }

  const editions = EDITIONS[riwaya] || EDITIONS.hafs;
  let lastError = null;

  // Track Warsh fallback (text is always Hafs orthography for Warsh)
  lastWarshFallback = (riwaya === 'warsh');

  for (const edition of editions) {
    try {
      const data = await fetchJSON(
        `${BASE}/${pathPrefix}/${edition}`,
        signal,
        EDITION_FALLBACK_TIMEOUT,
      );
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

/** surah/N, juz/N, page/N: the scopes a translation is requested for. */
function parseTranslationScope(pathPrefix) {
  const [type, value] = String(pathPrefix || '').split('/');
  if (!['surah', 'juz', 'page'].includes(type)) return null;
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? { type, value: number } : null;
}

async function fetchRemoteTranslations(pathPrefix, langArray, signal) {
  const canUseQuranCom = langArray.every((lang) => QURAN_COM_TRANSLATION_LANGS.has(lang));

  const editions = langArray.map(l => TRANSLATION_EDITIONS[l] || TRANSLATION_EDITIONS.fr).join(',');
  try {
    // AlQuran Cloud returns a complete surah/juz/page and several editions in
    // one response. Using it first avoids up to six paginated requests during
    // the initial reader paint.
    const data = await fetchJSON(`${BASE}/${pathPrefix}/${editions}`, signal);
    return Array.isArray(data) ? data : [data];
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    if (!canUseQuranCom) throw err;
    console.warn('AlQuran.cloud translation fallback to Quran.com:', err);
    return fetchQuranComTranslations(pathPrefix, langArray, signal);
  }
}

async function fetchTranslations(pathPrefix, langs = ['fr'], signal) {
  const langArray = Array.isArray(langs) ? langs : [langs];
  const localLangs = langArray.filter(isWarshTranslationEdition);
  const remoteLangs = langArray.filter((lang) => !isWarshTranslationEdition(lang));

  if (!localLangs.length) return fetchRemoteTranslations(pathPrefix, remoteLangs, signal);

  // Vendored editions answer from the local assets, so they also work offline.
  // A scope they cannot place returns nothing rather than Hafs-keyed verses.
  const scope = parseTranslationScope(pathPrefix);
  const [localEditions, remoteEditions] = await Promise.all([
    scope
      ? Promise.all(
          localLangs.map((editionId) => getWarshTranslationEdition(scope.type, scope.value, editionId)),
        )
      : Promise.resolve([]),
    remoteLangs.length
      ? fetchRemoteTranslations(pathPrefix, remoteLangs, signal).catch((err) => {
          if (err.name === 'AbortError') throw err;
          // A failed edition is not an absent one: rethrow so the reader sees
          // the error state instead of a silently missing translation.
          console.warn('Remote translation editions unavailable:', err);
          throw err;
        })
      : Promise.resolve([]),
  ]);

  return [...localEditions, ...remoteEditions].filter(Boolean);
}

/* ── Surah Text ──────────────────────────────── */

export async function getSurahText(surahNum, riwaya = 'hafs', signal) {
  return fetchWithEditionFallback(`surah/${surahNum}`, riwaya, signal);
}

export async function getSurahTranslation(surahNum, langs = ['fr'], signal) {
  return fetchTranslations(`surah/${surahNum}`, langs, signal);
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
      const hafsByKey = new Map(
        hafs.ayahs.map((ayah) => [
          `${ayah.surah?.number}:${ayah.numberInSurah}`,
          ayah,
        ]),
      );
      arabic.ayahs = arabic.ayahs.map((a) => {
        const hafsAyah = hafsByKey.get(`${a.surah?.number}:${a.numberInSurah}`);
        return {
          ...a,
          hafsText: hafsAyah?.text || null
        };
      });
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
  return fetchTranslations(`juz/${juzNum}`, langs, signal);
}

/* ── Page (Mushaf page 1-604) ────────────────── */

export async function getPage(pageNum, riwaya = 'hafs', signal) {
  return fetchWithEditionFallback(`page/${pageNum}`, riwaya, signal);
}

export async function getPageTranslation(pageNum, langs = ['fr'], signal) {
  return fetchTranslations(`page/${pageNum}`, langs, signal);
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
      const hafsByKey = new Map(
        hafs.ayahs.map((ayah) => [
          `${ayah.surah?.number}:${ayah.numberInSurah}`,
          ayah,
        ]),
      );
      arabic.ayahs = arabic.ayahs.map((a) => {
        const hafsAyah = hafsByKey.get(`${a.surah?.number}:${a.numberInSurah}`);
        return {
          ...a,
          hafsText: hafsAyah?.text || null
        };
      });
    }
  }

  return { arabic, translations };
}

/* ── Search ──────────────────────────────────── */

// AlQuran Cloud answers a query with no match with HTTP 404, so a 404 on a
// search route means "nothing found", not "the index is down". Reporting it as
// an outage sends the reader to retry a query that can never match.
const SEARCH_NO_MATCH_RE = /^API error 404\b/;
function isSearchNoMatch(error) {
  return SEARCH_NO_MATCH_RE.test(String(error?.message || ''));
}

// A no-match search returns HTTP 404 from api.alquran.cloud, which fetchJSON
// throws on before it can cache (only 2xx payloads are stored). So repeating an
// exhausted query — back/forward, re-opening a term, a debounced re-run of the
// same candidates — re-fires the whole edition × language fan-out every time.
// A short, search-only in-memory memo collapses those repeats to one round
// trip. It is deliberately tiny-lived (never persisted) so a phrase that only
// matches later is not stale-suppressed, and it caches only resolved values.
const SEARCH_MEMO = new Map();
const SEARCH_MEMO_TTL_MS = 60 * 1000;
function searchMemoGet(key) {
  const hit = SEARCH_MEMO.get(key);
  if (!hit) return undefined;
  if (hit.expiry <= Date.now()) {
    SEARCH_MEMO.delete(key);
    return undefined;
  }
  return hit.value;
}
function searchMemoSet(key, value) {
  if (SEARCH_MEMO.size >= 120) {
    SEARCH_MEMO.delete(SEARCH_MEMO.keys().next().value);
  }
  SEARCH_MEMO.set(key, { value, expiry: Date.now() + SEARCH_MEMO_TTL_MS });
}

export async function search(query, riwaya = 'hafs', surahNum = null, signal) {
  const memoKey = `${riwaya}|${surahNum ?? ''}|${query}`;
  const memoized = searchMemoGet(memoKey);
  if (memoized !== undefined) return memoized;

  const scope = surahNum ? `/${surahNum}` : '';
  const editions = EDITIONS[riwaya] || EDITIONS.hafs;
  let lastError = null;
  let everyEditionMissed = true;

  for (const edition of editions) {
    try {
      const result = await fetchJSON(`${BASE}/search/${encodeURIComponent(query)}/all/${edition}${scope}`, signal);
      searchMemoSet(memoKey, result);
      return result;
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      lastError = err;
      // Keep trying the other editions: their orthography differs, so a miss in
      // one script can still be a hit in another.
      if (!isSearchNoMatch(err)) everyEditionMissed = false;
    }
  }

  if (everyEditionMissed) {
    const empty = { matches: [] };
    searchMemoSet(memoKey, empty);
    return empty;
  }

  try {
    const local = await searchArabicLocally(query, surahNum, signal);
    searchMemoSet(memoKey, local);
    return local;
  } catch (fallbackError) {
    if (fallbackError.name === 'AbortError') throw fallbackError;
  }

  // A genuine network/server failure (not a 404 miss) is never memoized, so a
  // retry hits the network again instead of replaying the error for a minute.
  throw lastError || new Error('Search failed');
}

/**
 * Search inside a translation edition (fr/en/…).
 * Returns { matches: [{ surah, numberInSurah, text, translationText }] }
 */
export async function searchTranslation(query, lang = 'fr', surahNum = null, signal) {
  // The vendored Warsh edition has no search index yet: selecting it searches
  // the remote Hafs 'fr' edition, whose hits are Hafs-numbered.
  const edition = TRANSLATION_EDITIONS[lang] || TRANSLATION_EDITIONS.fr;
  const scope = surahNum ? `/${surahNum}` : '';
  try {
    const data = await fetchJSON(
      `${BASE}/search/${encodeURIComponent(query)}/all/${edition}${scope}`,
      signal,
    );
    // data.matches items have { surah, numberInSurah, text } where text is the translation
    return data;
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    if (isSearchNoMatch(err)) return { matches: [] };
    throw err;
  }
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
 * Warm only the current Arabic text during the splash screen.
 * Secondary text, translations and audio stay deferred until they are useful.
 */
export function prefetchInitialData(surahNum, riwaya) {
  try {
    if (shouldAvoidBackgroundWork()) return Promise.resolve();

    if (riwaya === 'warsh') {
      return preloadWarshSurah(surahNum);
    }

    return getSurahText(surahNum, riwaya).catch(() => null);
  } catch {
    return Promise.resolve();
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
