/**
 * Warsh Unicode Service
 * 
 * Provides authentic Warsh (Nafi') text rendering using Unicode text.
 * Data is fetched from the new warsh-quran-audio repository.
 */

import { dbGet, dbSet, dbDelete } from './dbService';
import { WARSH_DATA_BASE_URL, WARSH_LEGACY_JSON_URL } from '../constants/warshSource';
import { getSurah } from '../data/surahs';
import { fetchQuranComText } from './quranComAPI';
import { fetchWithTimeout } from './fetchWithTimeout';

const IDB_STORE = 'cache';
const IDB_KEY_PREFIX = 'warsh-unicode-v5-s-';
const WARSH_SOURCE_ID = 'warsh-unicode-v5';
const LEGACY_CACHE_KEY = 'warsh-unicode-v4-s-';

// Logger utilitaire - uniquement en dev
const log = import.meta.env.DEV ? console.log : () => {};
const logError = import.meta.env.DEV ? console.error : () => {};


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

// Font logic is removed since we use standard Unicode
export function isFontPageLoaded() { return true; }
export function areFontsLoading() { return false; }
export function onFontLoadChange() { return () => {}; }
export function loadWarshFont() { return Promise.resolve(); }
export function loadFontsForVerses() { return Promise.resolve(); }
export function isFontLoaded() { return true; }
export function getFontFamily() {
  return '"QPC Warsh", "KFGQPC Uthmanic Script WARSH", serif';
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

function splitWarshWords(text) {
  const normalized = normalizeWhitespace(text);
  // Split on whitespace but preserve the diacritics attached to words
  return normalized.split(/\s+/).filter(word => word.length > 0);
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
    const page = Number(item?.page ?? item?.page_number ?? item?.pageNo);
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
  const expected = Number(getSurah(surahNumber)?.ayahs || 0);
  if (!Array.isArray(records) || records.length === 0) return false;
  
  // More permissive validation - allow some margin of error
  // Surahs should have at least 80% of expected verses to be considered valid
  if (expected && records.length < expected * 0.8) {
    logError(`Warsh validation: expected ${expected} verses, got ${records.length} for surah ${surahNumber}`);
    return false;
  }
  
  // Check that verse numbers are sequential (with possible gaps)
  let prevAyah = 0;
  for (const record of records) {
    const ayahNum = Number(record.ayahNumber);
    if (!ayahNum || ayahNum <= prevAyah) {
      logError(`Warsh validation: invalid verse sequence at ${surahNumber}:${ayahNum}`);
      return false;
    }
    prevAyah = ayahNum;
  }
  
  return true;
}

/**
 * Normalizes a single ayah record from the new JSON format.
 */
function normalizeWarshRecord(raw, surahNumber, fallbackAyahNumber = null) {
  const ayahNumber = Number(raw?.aya_no ?? raw?.ayah_number ?? raw?.ayah ?? raw?.verse ?? fallbackAyahNumber);
  const text = normalizeWhitespace(raw?.aya_text ?? raw?.text ?? raw?.ayah_text ?? raw?.verse_text ?? raw);

  if (!ayahNumber || !text) {
    return null;
  }

  return {
    id: null, // Global ID not provided in this source
    surahNumber,
    ayahNumber,
    text,
    rawText: text,
    words: splitWarshWords(text),
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
  const text = record?.text || '';
  return {
    number: null, // Global number fallback
    warshNumber: null,
    numberInSurah: record?.ayahNumber,
    text,
    warshWords: record?.words?.length ? record.words : splitWarshWords(text),
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

  if (cachedSurahs.has(n)) return cachedSurahs.get(n);
  if (pendingSurahs.has(n)) return pendingSurahs.get(n);

  const promise = (async () => {
    const idbKey = `${IDB_KEY_PREFIX}${n}`;
    
    // 1. Try memory cache first
    if (cachedSurahs.has(n)) {
      return cachedSurahs.get(n);
    }
    
    // 2. Try IndexedDB cache
    try {
      const cached = await dbGet(IDB_STORE, idbKey);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        // Validate cached data
        if (validateWarshRows(cached, n)) {
          cachedSurahs.set(n, cached);
          return cached;
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
        throw new Error(`Failed to load warsh surah ${n}: ${fallbackErr.message || err.message}`);
      }
    }

    cachedSurahs.set(n, normalized);

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

      log(`[WarshService] Fetching Warsh JSON from: ${WARSH_LEGACY_JSON_URL}`);
      const res = await fetchWithTimeout(WARSH_LEGACY_JSON_URL, {}, 20000);
      if (!res.ok) throw new Error(`Failed to load legacy Warsh JSON: ${res.status}`);
      const rawData = await res.json();
      
      // Normalize: unwrap {data: [...]} wrapper
      const arrayData = Array.isArray(rawData) ? rawData : (rawData?.data || rawData?.verses || []);
      log(`[WarshService] Loaded legacy data, ${arrayData.length} items`);
      getLegacyIndex(arrayData);
      
      dbSet(IDB_STORE, { key: idbKey, data: arrayData }).catch(() => { });
      return arrayData;
    })();
  }
  return legacyWarshDataPromise;
}

function toWarshAyahWithHafsMeta(record, hafsAyah) {
  const ayah = toWarshAyah(record);
  return {
    ...ayah,
    number: hafsAyah?.number ?? ayah.number,
    juz: hafsAyah?.juz ?? ayah.juz,
    page: hafsAyah?.page ?? ayah.page,
    hizb: hafsAyah?.hizb ?? null,
    rubElHizb: hafsAyah?.rubElHizb ?? null,
    ruku: hafsAyah?.ruku ?? null,
    manzil: hafsAyah?.manzil ?? null,
    hafsText: hafsAyah?.text || hafsAyah?.quranCom?.textUthmani || null,
    hafsSupport: hafsAyah
      ? {
          text: hafsAyah.text || hafsAyah.quranCom?.textUthmani || null,
          quranCom: hafsAyah.quranCom || null,
          words: Array.isArray(hafsAyah.words) ? hafsAyah.words : [],
        }
      : null,
  };
}

async function getWarshVersesByHafsScope(pathPrefix) {
  const hafsData = await fetchQuranComText(pathPrefix);
  const hafsAyahs = Array.isArray(hafsData?.ayahs) ? hafsData.ayahs : [];
  const groupedRecords = new Map();
  const result = [];

  for (const hafsAyah of hafsAyahs) {
    const surahNumber = Number(hafsAyah?.surah?.number);
    const ayahNumber = Number(hafsAyah?.numberInSurah);
    if (!surahNumber || !ayahNumber) continue;

    if (!groupedRecords.has(surahNumber)) {
      groupedRecords.set(surahNumber, await getWarshSurahVerses(surahNumber));
    }

    const record = groupedRecords
      .get(surahNumber)
      .find((item) => Number(item.ayahNumber) === ayahNumber);

    if (record) result.push(toWarshAyahWithHafsMeta(record, hafsAyah));
  }

  return {
    ...buildWarshPayload(result),
    number: Number(pathPrefix.split('/')[1]) || null,
  };
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
  if (cachedSurahPayloads.has(cacheKey)) return cachedSurahPayloads.get(cacheKey);

  const verses = await getWarshSurahVerses(surahNum);
  const surahNumber = Number(surahNum);
  const ayahs = verses.map(toWarshAyah);

  const bismillah = (surahNumber !== 9 && surahNumber !== 1)
    ? {
      text: "بِسْمِ اِ۬للَّهِ اِ۬لرَّحْمَٰنِ اِ۬لرَّحِيمِ", // Warsh orthography for bismillah
      numberInSurah: 0,
      riwaya: 'warsh'
    }
    : null;

  const payload = {
    ayahs,
    bismillah,
    ...buildWarshPayload(ayahs),
  };
  cachedSurahPayloads.set(cacheKey, payload);
  return payload;
}

/**
 * Juz/Page access is now limited to what's currently loaded.
 * If we need full Juz support, we'd need to load multiple surahs.
 */
export async function getWarshJuzVerses(juzNum) {
  const cacheKey = Number(juzNum);
  if (cachedJuzPayloads.has(cacheKey)) return cachedJuzPayloads.get(cacheKey);

  const indexed = getLegacyIndex(await loadLegacyWarshData());
  const rows = indexed?.byJuz?.get(cacheKey) || [];
  if (rows.length > 0) {
    const ayahs = rows.map((ayah) => {
      const text = normalizeWhitespace(ayah.aya_text || ayah.text || '');
      const words = splitWarshWords(text);
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
    cachedJuzPayloads.set(cacheKey, payload);
    return payload;
  }

  const payload = await getWarshVersesByHafsScope(`juz/${juzNum}`);
  cachedJuzPayloads.set(cacheKey, payload);
  return payload;
}

export async function getWarshPageVerses(pageNum) {
  const cacheKey = Number(pageNum);
  if (cachedPagePayloads.has(cacheKey)) return cachedPagePayloads.get(cacheKey);

  try {
    const scoped = await getWarshVersesByHafsScope(`page/${pageNum}`);
    if (scoped?.ayahs?.length) {
      cachedPagePayloads.set(cacheKey, scoped);
      return scoped;
    }
  } catch {}

  const raw = await loadLegacyWarshData();
  const indexed = getLegacyIndex(raw);
  if (!indexed) {
    return { ayahs: [], number: pageNum };
  }
  const pageAyahs = indexed.byPage.get(cacheKey) || [];
  
  // Format compatible avec QuranMushafPage
  const formattedAyahs = pageAyahs.map(ayah => {
    const text = normalizeWhitespace(ayah.aya_text || ayah.text || '');
    const words = splitWarshWords(text);
    
    return {
      text: text,
      warshWords: words,
      surah: { number: Number(ayah.sura_no) },
      numberInSurah: Number(ayah.aya_no),
      number: Number(ayah.id),
      page: Number(ayah.page),
      juz: Number(ayah.jozz),
      lineStart: Number(ayah.line_start) || null,
      lineEnd: Number(ayah.line_end) || null,
      // Ajouter hafsSupport avec words pour compatibilité avec groupWarshPageLines
      hafsSupport: {
        words: words.map((word, idx) => ({
          text: word,
          lineV2: Number(ayah.line_start) || 1,
          charType: 'word',
          surah: Number(ayah.sura_no),
          ayah: Number(ayah.aya_no),
        }))
      }
    };
  });
  
  const payload = {
    ayahs: formattedAyahs,
    number: pageNum,
  };
  cachedPagePayloads.set(cacheKey, payload);
  return payload;
}

export function preloadWarshSurah(surahNum) {
  loadWarshSurah(surahNum).catch(() => { });
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
  loadWarshFont,
  loadFontsForVerses,
  isFontLoaded,
  isFontPageLoaded,
  areFontsLoading,
  onFontLoadChange,
  getFontFamily,
  getWarshSurahVerses,
  getWarshVerse,
  getWarshSurahFormatted,
  getWarshJuzVerses,
  getWarshPageVerses,
  preloadWarshSurah,
  clearWarshCache,
};
