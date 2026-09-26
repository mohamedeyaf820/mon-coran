/**
 * Warsh Unicode Service
 *
 * Provides authentic Warsh (Nafi') text rendering using Unicode text.
 * Both datasets are third-party mirrors pinned to immutable commit SHAs and the
 * legacy payload is SHA-256 verified before it is cached - see
 * src/constants/warshSource.js for the provenance and the refresh procedure.
 */

import { dbGet, dbSet, dbDelete } from './dbService.js';
import { JUZ_DATA } from '../data/juz.js';
import {
  WARSH_DATA_BASE_URL,
  WARSH_LEGACY_JSON_URL,
  WARSH_LOCAL_JSON_URL,
  WARSH_LEGACY_JSON_SHA256,
  getWarshPageStart,
  getWarshSurahAyahCount,
} from '../constants/warshSource.js';
import { fetchWithTimeout } from './fetchWithTimeout.js';
import { stripEmbeddedAyahMarkers } from '../data/fonts.js';
import { WARSH_BASMALA } from '../data/basmala.js';
import { warshToHafsNumbers } from '../data/warshHafsNumbering.js';

const IDB_STORE = 'cache';
const IDB_KEY_PREFIX = 'warsh-unicode-v6-s-';
const WARSH_SOURCE_ID = 'warsh-unicode-v6';
const LEGACY_CACHE_KEY = 'warsh-unicode-v5-s-';

// Logger utilitaire - uniquement en dev
const log = import.meta.env?.DEV ? console.log : () => {};
const logError = import.meta.env?.DEV ? console.error : () => {};


// Clear old cache format once per browser, not on every module import.
// Re-clearing the current Warsh JSON cache on startup makes Hafs/Warsh switches
// feel network-bound and can force the app to re-download the large source.
(async function clearOldCacheOnce() {
  const migrationKey = 'mushaf-warsh-cache-migration-v5';
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(migrationKey) === 'done') {
      return;
    }

    // Clear old v4 cache keys
    for (let i = 1; i <= 114; i++) {
      dbDelete(IDB_STORE, `${LEGACY_CACHE_KEY}${i}`).catch(() => {});
    }
    dbDelete(IDB_STORE, `${LEGACY_CACHE_KEY}legacy-all`).catch(() => {});

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(migrationKey, 'done');
    }
  } catch {
    // Cache migration is best-effort.
  }
})();

// ── State ────────────────────────────────────────────
// In-memory cache for surahs: Map[surahNum] -> Array[normalized ayah records]
const cachedSurahs = new Map();
const pendingSurahs = new Map(); // deduplication
let legacyWarshDataPromise = null;
let legacyIndex = null;
const cachedPagePayloads = new Map();
const cachedJuzPayloads = new Map();
const cachedSurahPayloads = new Map();

// ── Bounded memory caches ────────────────────────────
// These four Maps used to grow for the lifetime of the tab, and they hold the
// same normalised Arabic text in different shapes: a full read-through of the
// mushaf kept ~5.5 MB of Quran text alive per cache. Measured from the shipped
// dataset (public/data/warsh-page-source.json: 6214 ayahs, 737 012 characters,
// UTF-16 in memory plus one duplicated word array per ayah), one entry costs
// about as much as its printed scope:
//   surah rows      avg 49 kB, Al-Baqara 412 kB   -> cap 4  ≈ 1.11 MB worst
//   surah payload   derived from the rows above, sharing their word arrays
//                   (toWarshAyah reuses record.words) -> cap 4 ≈ 0.7 MB marginal
//   page payload    avg 9.2 kB, max 13 kB          -> cap 32 ≈ 0.37 MB worst
//   juz payload     avg 186 kB, max 222 kB         -> cap 2  ≈ 0.43 MB worst
// Worst case residency is therefore ≈ 2.6 MB, against the ~19 MB the four Maps
// could reach unbounded (each holds up to a full copy of the mushaf text), and
// a realistic single-surah session stays under 100 kB. The caps are LRU-bounded
// rather than cleared so a returning reader keeps the page they are on: a miss
// costs one IndexedDB read of text that is already offline, or a re-fetch of
// the pinned source only after the reader cleared the cache deliberately.
// Same shape as quranComAPI.js (MEM_CACHE_MAX_SIZE) and useQuranDisplayData.js
// (rememberLimited).
const SURAH_CACHE_MAX = 4;
const SURAH_PAYLOAD_CACHE_MAX = 4;
const PAGE_PAYLOAD_CACHE_MAX = 32;
const JUZ_PAYLOAD_CACHE_MAX = 2;

/** Read a bounded cache and mark the entry as the most recently used. */
function recallBounded(map, key) {
  if (!map.has(key)) return undefined;
  const value = map.get(key);
  map.delete(key);
  map.set(key, value);
  return value;
}

/**
 * Insert into a bounded cache, evicting least-recently-used entries over the
 * cap. `onEvict` lets a derived cache drop what it built from the evicted
 * entry, so the pair cannot drift to double the budget.
 */
function rememberBounded(map, key, value, max, onEvict) {
  if (map.has(key)) map.delete(key);
  map.set(key, value);
  while (map.size > max) {
    const oldest = map.keys().next().value;
    map.delete(oldest);
    onEvict?.(oldest);
  }
  return value;
}

function rememberSurahRows(surahNumber, records) {
  return rememberBounded(cachedSurahs, surahNumber, records, SURAH_CACHE_MAX, (evicted) =>
    cachedSurahPayloads.delete(evicted),
  );
}

function rememberSurahPayload(surahNumber, payload) {
  return rememberBounded(cachedSurahPayloads, surahNumber, payload, SURAH_PAYLOAD_CACHE_MAX);
}

/** Memory-cache sizes and caps, for the contract test and for diagnostics. */
export function getWarshMemoryCacheStats() {
  return {
    surahs: cachedSurahs.size,
    surahPayloads: cachedSurahPayloads.size,
    pages: cachedPagePayloads.size,
    juz: cachedJuzPayloads.size,
    caps: {
      surahs: SURAH_CACHE_MAX,
      surahPayloads: SURAH_PAYLOAD_CACHE_MAX,
      pages: PAGE_PAYLOAD_CACHE_MAX,
      juz: JUZ_PAYLOAD_CACHE_MAX,
    },
  };
}

function normalizeWhitespace(text) {
  if (!text) return '';
  
  // Normalize to NFC to ensure consistent combining character order
  let normalized = String(text).normalize('NFC');
  
  // Replace non-breaking space with regular space
  normalized = normalized.replace(/\u00a0/g, ' ');
  
  // Keep Arabic presentation forms: Warsh sources may contain sacred ligatures
  // such as Allah and salawat symbols that are real reader-visible content.
  
  // Collapse multiple spaces
  normalized = normalized.replace(/\s+/g, ' ');
  
  return normalized.trim();
}

function splitWarshWords(text, ayahNumber = null) {
  const normalized = normalizeWarshAyahText(text, ayahNumber);
  // Split on whitespace but preserve the diacritics attached to words
  return normalized.split(/\s+/).filter(word => word.length > 0);
}

function normalizeWarshAyahText(text, ayahNumber = null) {
  return stripEmbeddedAyahMarkers(normalizeWhitespace(text), { ayahNumber });
}

function getSurahNumberFromRaw(raw) {
  return Number(
    raw?.sura_no ??
      raw?.surah_number ??
      raw?.sura ??
      raw?.surah ??
      raw?.chapter_id ??
      raw?.chapter,
  );
}

/**
 * Hex SHA-256 of a fetched payload, or null when WebCrypto is not exposed
 * (insecure contexts). Callers must treat null as "unverifiable": the payload
 * may serve the current session but never gets persisted as offline Quran text.
 */
async function sha256Hex(bytes) {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle || !bytes) return null;
  try {
    const digest = await subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  } catch {
    return null;
  }
}

function unwrapLegacyArray(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.verses)) return data.verses;
  if (Array.isArray(data.ayahs)) return data.ayahs;
  return [];
}

function getLegacyIndex(data) {
  const actualData = unwrapLegacyArray(data);
  if (!Array.isArray(actualData) || actualData.length === 0) return null;
  if (legacyIndex?.source === actualData) return legacyIndex;

  const bySurah = new Map();
  const byPage = new Map();
  const byJuz = new Map();

  actualData.forEach((item) => {
    const surah = getSurahNumberFromRaw(item);
    const page = getWarshPageStart(item?.page ?? item?.page_number ?? item?.pageNo);
    const juz = Number(item?.jozz ?? item?.juz ?? item?.juz_number);

    if (surah) {
      if (!bySurah.has(surah)) bySurah.set(surah, []);
      bySurah.get(surah).push(item);
    }
    if (page) {
      if (!byPage.has(page)) byPage.set(page, []);
      byPage.get(page).push(item);
    }
    if (juz) {
      if (!byJuz.has(juz)) byJuz.set(juz, []);
      byJuz.get(juz).push(item);
    }
  });

  const sortRows = (rows) =>
    rows.sort((a, b) => {
      const surahA = getSurahNumberFromRaw(a);
      const surahB = getSurahNumberFromRaw(b);
      if (surahA !== surahB) return surahA - surahB;
      const ayahA = Number(a.aya_no ?? a.ayah_number ?? a.ayah ?? a.verse);
      const ayahB = Number(b.aya_no ?? b.ayah_number ?? b.ayah ?? b.verse);
      return ayahA - ayahB;
    });

  bySurah.forEach(sortRows);
  byPage.forEach(sortRows);
  byJuz.forEach(sortRows);

  legacyIndex = { source: actualData, bySurah, byPage, byJuz };
  return legacyIndex;
}

function rowsFromLegacyData(data, surahNumber) {
  const n = Number(surahNumber);
  const indexed = getLegacyIndex(data);
  if (indexed?.bySurah?.has(n)) {
    return indexed.bySurah.get(n) || [];
  }
  
  log(`[WarshService] rowsFromLegacyData called for surah ${n}, data type: ${typeof data}, isArray: ${Array.isArray(data)}`);
  
  if (!data) {
    logError(`[WarshService] Data is null/undefined for surah ${n}`);
    return [];
  }

  // Handle case where data is wrapped in a response object
  let actualData = data;
  if (typeof data === 'object' && !Array.isArray(data)) {
    // Check common wrapper properties
    if (data.data && Array.isArray(data.data)) {
      actualData = data.data;
      log(`[WarshService] Unwrapped data from 'data' property, length: ${actualData.length}`);
    } else if (data.verses && Array.isArray(data.verses)) {
      actualData = data.verses;
      log(`[WarshService] Unwrapped data from 'verses' property, length: ${actualData.length}`);
    } else if (data.ayahs && Array.isArray(data.ayahs)) {
      actualData = data.ayahs;
      log(`[WarshService] Unwrapped data from 'ayahs' property, length: ${actualData.length}`);
    } else {
      logError(`[WarshService] Data is object but has no array property for surah ${n}`);
      return [];
    }
  }
  
  if (!Array.isArray(actualData)) {
    logError(`[WarshService] Data is not an array for surah ${n}, type: ${typeof actualData}`);
    return [];
  }
  
  log(`[WarshService] Data is array with ${actualData.length} items`);
  
  if (actualData.length === 0) {
    logError(`[WarshService] Data array is empty for surah ${n}`);
    return [];
  }
  
  // Log first item structure (for debugging)
  if (actualData.length > 0) {
    const first = actualData[0];
    log(`[WarshService] First item sample:`, {
      sura_no: first.sura_no,
      aya_no: first.aya_no,
      text_preview: first.aya_text?.substring(0, 30)
    });
  }
  
  // Filter by surah number
  const rows = actualData.filter(item => getSurahNumberFromRaw(item) === n);
  log(`[WarshService] Filtered ${rows.length} rows for surah ${n}`);
  
  // Sort by ayah number
  rows.sort((a, b) => {
    const aNum = Number(a.aya_no ?? a.ayah_number ?? a.ayah ?? a.verse);
    const bNum = Number(b.aya_no ?? b.ayah_number ?? b.ayah ?? b.verse);
    return aNum - bNum;
  });
  
  return rows;
}

function normalizeWarshRows(rows, surahNumber) {
  const seen = new Set();
  return (Array.isArray(rows) ? rows : [])
    .map((raw, index) => normalizeWarshRecord(raw, surahNumber, index + 1))
    .filter(Boolean)
    .filter((record) => {
      if (seen.has(record.ayahNumber)) return false;
      seen.add(record.ayahNumber);
      return true;
    })
    .sort((a, b) => a.ayahNumber - b.ayahNumber);
}

function validateWarshRows(records, surahNumber) {
  if (!Array.isArray(records) || records.length === 0) return false;

  // Exact completeness, not a percentage. A surah that is 80-99% present used
  // to pass here, ship to the reader and then be cached in IndexedDB as if it
  // were the Quran text. The expectation is the surah's Warsh total (6214 ayahs
  // across the mushaf - e.g. 285 in Al-Baqara against 286 in Hafs), derived from
  // the canonical Warsh/Hafs numbering, never from the Hafs metadata.
  const expected = getWarshSurahAyahCount(surahNumber);
  if (!expected) {
    logError(`Warsh validation: no Warsh verse total for surah ${surahNumber}, refusing source`);
    return false;
  }
  if (records.length !== expected) {
    logError(`Warsh validation: expected exactly ${expected} Warsh verses, got ${records.length} for surah ${surahNumber}`);
    return false;
  }

  // Sequential and dense: the Warsh mushaf numbers each surah from 1 to its
  // total, so gaps or a shifted start mean a damaged source even when the
  // record count happens to match.
  let prevAyah = 0;
  for (const record of records) {
    const ayahNum = Number(record.ayahNumber);
    if (!ayahNum || ayahNum <= prevAyah) {
      logError(`Warsh validation: invalid verse sequence at ${surahNumber}:${ayahNum}`);
      return false;
    }
    prevAyah = ayahNum;
  }
  if (Number(records[0]?.ayahNumber) !== 1 || prevAyah !== expected) {
    logError(`Warsh validation: surah ${surahNumber} does not cover Warsh verses 1..${expected}`);
    return false;
  }

  return true;
}

/**
 * Normalizes a single ayah record from the new JSON format.
 */
function normalizeWarshRecord(raw, surahNumber, fallbackAyahNumber = null) {
  const ayahNumber = Number(raw?.aya_no ?? raw?.ayah_number ?? raw?.ayah ?? raw?.verse ?? fallbackAyahNumber);
  const text = normalizeWarshAyahText(raw?.aya_text ?? raw?.text ?? raw?.ayah_text ?? raw?.verse_text ?? raw, ayahNumber);

  if (!ayahNumber || !text) {
    return null;
  }

  return {
    id: null, // Global ID not provided in this source
    surahNumber,
    ayahNumber,
    text,
    rawText: text,
    words: splitWarshWords(text, ayahNumber),
    juz: null, // Not in source
    page: null, // Not in source
    pages: [],
    lineStart: null,
    lineEnd: null,
    surahNameAr: null,
  };
}

async function fetchWarshSurahRows(surahNumber) {
  const padded = String(surahNumber).padStart(3, '0');
  const response = await fetchWithTimeout(`${WARSH_DATA_BASE_URL}${padded}.json`, {}, 8000);
  if (!response.ok) throw new Error(`Failed to load Warsh surah JSON: ${response.status}`);
  const json = await response.json();
  const rows = unwrapLegacyArray(json);
  return rows.length ? rows : unwrapLegacyArray(json?.ayahs);
}

/**
 * Converts a normalized record to the final Ayah object.
 */
function toWarshAyah(record) {
  const text = normalizeWarshAyahText(record?.text || '', record?.ayahNumber);
  const hafsNumbers = warshToHafsNumbers(record?.surahNumber, record?.ayahNumber);
  return {
    number: null, // Global number fallback
    warshNumber: record?.ayahNumber ?? null,
    numberInSurah: record?.ayahNumber,
    // Hafs (quran.com) numbering this Warsh ayah recites; never equal to
    // numberInSurah by assumption — see data/warshHafsNumbering.js.
    hafsNumbers: hafsNumbers?.length ? hafsNumbers : null,
    hafsNumber: hafsNumbers?.[0] ?? null,
    text,
    warshWords: record?.words?.length ? record.words : splitWarshWords(text, record?.ayahNumber),
    surah: {
      number: record?.surahNumber,
      name: record?.surahNameAr,
    },
    juz: record?.juz ?? null,
    page: record?.page ?? null,
    pages: record?.pages || [],
    lineStart: record?.lineStart ?? null,
    lineEnd: record?.lineEnd ?? null,
    requestedRiwaya: 'warsh',
    source: WARSH_SOURCE_ID,
  };
}

function buildWarshPayload(ayahs) {
  return {
    ayahs,
    edition: { identifier: 'warsh-unicode-v2', name: 'Warsh (Unicode v2)' },
    requestedRiwaya: 'warsh',
    usedEdition: 'warsh-unicode-v2',
    source: WARSH_SOURCE_ID,
    isTextFallback: false,
    isQCF4: false,
  };
}

// ── Data Loading ─────────────────────────────────────

/**
 * Lazy-load a single surah's warsh data.
 */
export async function loadWarshSurah(surahNum) {
  const n = Number(surahNum);
  if (n < 1 || n > 114) throw new Error(`Invalid surah: ${surahNum}`);

  const warm = recallBounded(cachedSurahs, n);
  if (warm) return warm;
  if (pendingSurahs.has(n)) return pendingSurahs.get(n);

  const promise = (async () => {
    const idbKey = `${IDB_KEY_PREFIX}${n}`;
    
    // 1. Try memory cache first
    const remembered = recallBounded(cachedSurahs, n);
    if (remembered) {
      return remembered;
    }
    
    // 2. Try IndexedDB cache
    try {
      const cached = await dbGet(IDB_STORE, idbKey);
      const cachedRows = Array.isArray(cached) ? cached : cached?.data;
      if (Array.isArray(cachedRows) && cachedRows.length > 0) {
        // Validate cached data
        if (validateWarshRows(cachedRows, n)) {
          rememberSurahRows(n, cachedRows);
          return cachedRows;
        } else {
          logError(`[WarshService] Cached data for surah ${n} is invalid, clearing...`);
          await dbDelete(IDB_STORE, idbKey).catch(() => {});
        }
      }
    } catch { }

    let normalized = [];
    try {
      const rows = await fetchWarshSurahRows(n);
      normalized = normalizeWarshRows(rows, n);

      if (!validateWarshRows(normalized, n)) {
        throw new Error(`Invalid per-surah Warsh source (got ${normalized.length} verses)`);
      }
    } catch (err) {
      try {
        const legacy = await loadLegacyWarshData();
        const rows = rowsFromLegacyData(legacy, n);
        normalized = normalizeWarshRows(rows, n);
        if (!validateWarshRows(normalized, n)) {
          throw new Error(`invalid or incomplete source (got ${normalized.length} verses)`);
        }
      } catch (fallbackErr) {
        logError(`[WarshService] Loading error for surah ${n}:`, fallbackErr);
        throw new Error("WARSH_SOURCE_UNAVAILABLE");
      }
    }

    rememberSurahRows(n, normalized);

    // 4. Store in IndexedDB
    dbSet(IDB_STORE, { key: idbKey, data: normalized }).catch(() => { });

    return normalized;
  })().finally(() => {
    pendingSurahs.delete(n);
  });

  pendingSurahs.set(n, promise);
  return promise;
}

async function loadLegacyWarshData() {
  if (!legacyWarshDataPromise) {
    legacyWarshDataPromise = (async () => {
      const idbKey = `${IDB_KEY_PREFIX}legacy-all`;
      try {
        const cached = await dbGet(IDB_STORE, idbKey);
        if (cached && typeof cached === 'object') {
          // Normalize: unwrap nested {data: {data: [...]}} from IndexedDB
          const inner = cached.data || cached;
          const arrayData = Array.isArray(inner) ? inner : (inner?.data || inner?.verses || null);
          if (Array.isArray(arrayData) && arrayData.length > 0) {
            log(`[WarshService] Loaded legacy data from cache, ${arrayData.length} items`);
            getLegacyIndex(arrayData);
            return arrayData;
          }
        }
      } catch { }

      // Serve the reviewed, pinned bytes with the app. The remote mirror is a
      // recovery path for an older deployment missing the local asset.
      let res;
      try {
        res = await fetchWithTimeout(WARSH_LOCAL_JSON_URL, {}, 8000);
        if (!res.ok) throw new Error(`Local Warsh source: ${res.status}`);
      } catch (error) {
        logError('[WarshService] Local Warsh source unavailable:', error);
        res = await fetchWithTimeout(WARSH_LEGACY_JSON_URL, {}, 20000);
      }
      if (!res.ok) throw new Error(`Failed to load legacy Warsh JSON: ${res.status}`);

      // Integrity gate: the URL is pinned to a commit, but the mirror is still
      // third-party content and an intermediate (cache, proxy, offline worker)
      // can hand back anything. Hash the exact bytes and refuse a payload that
      // does not match the reviewed digest, so a substituted Quran text can
      // never reach the reader or the durable offline cache.
      const rawBytes = await res.arrayBuffer();
      const digest = await sha256Hex(rawBytes);
      if (digest && digest !== WARSH_LEGACY_JSON_SHA256) {
        logError(`[WarshService] Legacy Warsh digest mismatch, rejecting payload: ${digest}`);
        throw new Error(`Legacy Warsh checksum mismatch: ${digest}`);
      }
      if (!digest) {
        logError('[WarshService] WebCrypto unavailable: legacy Warsh data stays in memory only.');
      }

      const rawData = JSON.parse(new TextDecoder().decode(rawBytes));

      // Normalize: unwrap {data: [...]} wrapper
      const arrayData = Array.isArray(rawData) ? rawData : (rawData?.data || rawData?.verses || []);
      log(`[WarshService] Loaded legacy data, ${arrayData.length} items`);
      getLegacyIndex(arrayData);

      if (digest === WARSH_LEGACY_JSON_SHA256) {
        dbSet(IDB_STORE, { key: idbKey, data: arrayData }).catch(() => { });
      }
      return arrayData;
    })();
    legacyWarshDataPromise.catch(() => {
      legacyWarshDataPromise = null;
    });
  }
  return legacyWarshDataPromise;
}

/**
 * Backward compatibility: returns a promise that resolves when a surah is loaded.
 * Note: this used to load ALL surahs. Now it's a dummy or surah-specific.
 */
export async function loadWarshData() {
  // We no longer load all 114 surahs at once.
  // This function is now mostly for backward compatibility.
  return Promise.resolve();
}

/**
 * True only while the rows are warm in this tab's memory cache. The cache is
 * LRU-bounded, so a surah that was evicted (but is still in IndexedDB, ready
 * for one local read) answers false: that is the honest answer for a "is this
 * cheap right now?" probe, and it must never be read as "the reader does not
 * have this surah offline". Nothing in src/ or tests/ calls it today.
 */
export function isWarshDataLoaded(surahNum) {
  return cachedSurahs.has(Number(surahNum));
}

// ── Verse Access ─────────────────────────────────────

export async function getWarshSurahVerses(surahNum) {
  return loadWarshSurah(surahNum);
}

export async function getWarshVerse(surahNum, verseNum) {
  const surah = await getWarshSurahVerses(surahNum);
  const vNum = Number(verseNum);
  const found = surah.find(v => v.ayahNumber === vNum);
  if (!found) {
    throw new Error(`Invalid verse number: ${verseNum} for surah ${surahNum}`);
  }
  return found;
}

export async function getWarshSurahFormatted(surahNum) {
  const cacheKey = Number(surahNum);
  const warm = recallBounded(cachedSurahPayloads, cacheKey);
  if (warm) return warm;

  const verses = await getWarshSurahVerses(surahNum);
  const surahNumber = Number(surahNum);
  const ayahs = verses.map(toWarshAyah);

  const bismillah = (surahNumber !== 9 && surahNumber !== 1)
    ? {
      text: WARSH_BASMALA,
      numberInSurah: 0,
      riwaya: 'warsh'
    }
    : null;

  const payload = {
    ayahs,
    bismillah,
    ...buildWarshPayload(ayahs),
  };
  rememberSurahPayload(cacheKey, payload);
  return payload;
}

/**
 * Juz/Page access is now limited to what's currently loaded.
 * If we need full Juz support, we'd need to load multiple surahs.
 */
// A juz spans one to several surahs: it is assembled from the scoped
// per-surah files (cached, validated) so that the legacy full-Quran JSON is
// only fetched when a scoped file is unavailable.
function getJuzRange(juzNum) {
  const index = JUZ_DATA.findIndex((entry) => entry.juz === Number(juzNum));
  if (index < 0) return null;
  const start = JUZ_DATA[index].start;
  const next = JUZ_DATA[index + 1]?.start || null;
  const isBefore = (surah, ayah, bound) =>
    !bound || surah < bound.s || (surah === bound.s && ayah < bound.a);
  const lastSurah = next ? (next.a > 1 ? next.s : next.s - 1) : 114;
  return {
    surahs: Array.from({ length: lastSurah - start.s + 1 }, (_, i) => start.s + i),
    includes: (surah, ayah) =>
      (surah > start.s || (surah === start.s && ayah >= start.a)) && isBefore(surah, ayah, next),
  };
}

async function getScopedWarshJuzAyahs(juzNum) {
  const range = getJuzRange(juzNum);
  if (!range) throw new Error(`Invalid juz: ${juzNum}`);
  const surahs = await Promise.all(
    range.surahs.map(async (surah) => (await getWarshSurahVerses(surah)).map(toWarshAyah)),
  );
  return surahs.flat().filter((ayah) => {
    const surah = Number(ayah?.surah?.number ?? ayah?.surah);
    const number = Number(ayah?.numberInSurah);
    return surah > 0 && number > 0 && range.includes(surah, number);
  });
}

export async function getWarshJuzVerses(juzNum) {
  const cacheKey = Number(juzNum);
  const warm = recallBounded(cachedJuzPayloads, cacheKey);
  if (warm) return warm;

  try {
    const scoped = await getScopedWarshJuzAyahs(cacheKey);
    if (scoped.length > 0) {
      const payload = {
        ...buildWarshPayload(scoped.map((ayah) => ({ ...ayah, juz: ayah.juz || cacheKey }))),
        number: cacheKey,
      };
      rememberBounded(cachedJuzPayloads, cacheKey, payload, JUZ_PAYLOAD_CACHE_MAX);
      return payload;
    }
  } catch (err) {
    logError(`[WarshService] Scoped juz ${cacheKey} unavailable, using legacy data:`, err);
  }

  const indexed = getLegacyIndex(await loadLegacyWarshData());
  const rows = indexed?.byJuz?.get(cacheKey) || [];
  if (rows.length > 0) {
    const ayahs = rows.map((ayah) => {
      const ayahNumber = Number(ayah.aya_no) || null;
      const text = normalizeWarshAyahText(ayah.aya_text || ayah.text || '', ayahNumber);
      const words = splitWarshWords(text, ayahNumber);
      return {
        text,
        warshWords: words,
        surah: { number: Number(ayah.sura_no) },
        numberInSurah: Number(ayah.aya_no),
        number: Number(ayah.id) || null,
        page: Number(ayah.page) || null,
        juz: Number(ayah.jozz ?? ayah.juz) || cacheKey,
        lineStart: Number(ayah.line_start) || null,
        lineEnd: Number(ayah.line_end) || null,
        requestedRiwaya: 'warsh',
        source: WARSH_SOURCE_ID,
      };
    });
    const payload = { ...buildWarshPayload(ayahs), number: cacheKey };
    rememberBounded(cachedJuzPayloads, cacheKey, payload, JUZ_PAYLOAD_CACHE_MAX);
    return payload;
  }

  const payload = { ayahs: [], number: cacheKey };
  rememberBounded(cachedJuzPayloads, cacheKey, payload, JUZ_PAYLOAD_CACHE_MAX);
  return payload;
}

export async function getWarshPageVerses(pageNum) {
  const cacheKey = Number(pageNum);
  const warm = recallBounded(cachedPagePayloads, cacheKey);
  if (warm) return warm;

  const raw = await loadLegacyWarshData();
  const indexed = getLegacyIndex(raw);
  if (!indexed) {
    return { ayahs: [], number: pageNum };
  }
  let pageAyahs = indexed.byPage.get(cacheKey) || [];

  // The legacy JSON puts the closing guidance phrase of the illuminated
  // Al-Baqara opening leaf at the bottom of page 2. In the Warsh page model
  // used by the reader it is the opening line of page 3. Keep the source text
  // and ayah identity untouched; only correct its printed-page placement.
  const openingCarry = (indexed.byPage.get(2) || []).find((ayah) =>
    getSurahNumberFromRaw(ayah) === 2
      && Number(ayah?.aya_no ?? ayah?.ayah_number ?? ayah?.ayah) === 4,
  );
  if (openingCarry && cacheKey === 2) {
    pageAyahs = pageAyahs.filter((ayah) => ayah !== openingCarry);
  } else if (openingCarry && cacheKey === 3) {
    pageAyahs = [{
      ...openingCarry,
      page: 3,
      line_start: 1,
      line_end: 1,
    }, ...pageAyahs];
  }
  
  // Format compatible avec QuranMushafPage
  const formattedAyahs = pageAyahs.map(ayah => {
    const ayahNumber = Number(ayah.aya_no) || null;
    const text = normalizeWarshAyahText(ayah.aya_text || ayah.text || '', ayahNumber);
    const words = splitWarshWords(text, ayahNumber);
    
    return {
      text: text,
      warshWords: words,
      surah: { number: Number(ayah.sura_no) },
      numberInSurah: Number(ayah.aya_no),
      number: Number(ayah.id),
      page: getWarshPageStart(ayah.page),
      juz: Number(ayah.jozz),
      lineStart: Number(ayah.line_start) || null,
      lineEnd: Number(ayah.line_end) || null,
      requestedRiwaya: 'warsh',
      source: WARSH_SOURCE_ID,
    };
  });
  
  const payload = {
    ayahs: formattedAyahs,
    number: pageNum,
  };
  rememberBounded(cachedPagePayloads, cacheKey, payload, PAGE_PAYLOAD_CACHE_MAX);
  return payload;
}

export function preloadWarshSurah(surahNum) {
  return loadWarshSurah(surahNum).catch(() => null);
}

/**
 * Clear Warsh cache from IndexedDB and memory.
 * Use this when data seems corrupted or after updates.
 */
export async function clearWarshCache() {
  // Clear memory cache
  cachedSurahs.clear();
  pendingSurahs.clear();
  legacyWarshDataPromise = null;
  legacyIndex = null;
  cachedPagePayloads.clear();
  cachedJuzPayloads.clear();
  cachedSurahPayloads.clear();
  
  // Clear IndexedDB cache
  try {
    const promises = [];
    
    // Clear all surah caches
    for (let i = 1; i <= 114; i++) {
      promises.push(dbDelete(IDB_STORE, `${IDB_KEY_PREFIX}${i}`).catch(() => {}));
    }
    
    // Clear legacy caches (both v4 and v5)
    promises.push(dbDelete(IDB_STORE, `${IDB_KEY_PREFIX}legacy-all`).catch(() => {}));
    for (let i = 1; i <= 114; i++) {
      promises.push(dbDelete(IDB_STORE, `${LEGACY_CACHE_KEY}${i}`).catch(() => {}));
    }
    promises.push(dbDelete(IDB_STORE, `${LEGACY_CACHE_KEY}legacy-all`).catch(() => {}));
    
    await Promise.all(promises);
    log('[WarshService] Cache cleared successfully');
    return true;
  } catch (err) {
    logError('[WarshService] Failed to clear cache:', err);
    return false;
  }
}

export default {
  loadWarshSurah,
  loadWarshData,
  isWarshDataLoaded,
  getWarshSurahVerses,
  getWarshVerse,
  getWarshSurahFormatted,
  getWarshJuzVerses,
  getWarshPageVerses,
  preloadWarshSurah,
  clearWarshCache,
  getWarshMemoryCacheStats,
};
