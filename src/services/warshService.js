/**
 * Warsh Unicode Service
 * 
 * Provides authentic Warsh (Nafi') text rendering using Unicode text.
 * Data is fetched from the new warsh-quran-audio repository.
 */

import { dbGet, dbSet } from './dbService';
import { WARSH_DATA_BASE_URL, WARSH_LEGACY_JSON_URL } from '../constants/warshSource';
import { fetchQuranComText } from './quranComAPI';
import { getSurah } from '../data/surahs';

const IDB_STORE = 'cache';
const IDB_KEY_PREFIX = 'warsh-unicode-v4-s-';
const WARSH_SOURCE_ID = 'warsh-unicode-v4';

// ── State ────────────────────────────────────────────
// In-memory cache for surahs: Map[surahNum] -> Array[normalized ayah records]
const cachedSurahs = new Map();
const pendingSurahs = new Map(); // deduplication
let legacyWarshDataPromise = null;

// Font logic is removed since we use standard Unicode
export function isFontPageLoaded() { return true; }
export function areFontsLoading() { return false; }
export function onFontLoadChange() { return () => {}; }
export function loadWarshFont() { return Promise.resolve(); }
export function loadFontsForVerses() { return Promise.resolve(); }
export function isFontLoaded() { return true; }
export function getFontFamily() { return '"KFGQPC Uthmanic Script Warsh", "Amiri", serif'; }

function normalizeWhitespace(text) {
  return String(text || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[\uFC00-\uFCFF\uFDF0-\uFDFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitWarshWords(text) {
  return normalizeWhitespace(text).split(/\s+/).filter(Boolean);
}

function getSurahNumberFromRaw(raw) {
  return Number(
    raw?.surah_number ??
      raw?.sura_no ??
      raw?.sura ??
      raw?.surah ??
      raw?.chapter_id ??
      raw?.chapter,
  );
}

function rowsFromLegacyData(data, surahNumber) {
  const n = Number(surahNumber);

  if (Array.isArray(data)) {
    const flatRows = data.filter((item) => getSurahNumberFromRaw(item) === n);
    if (flatRows.length > 0) return flatRows;

    const nested = data[n - 1] || data[n];
    if (Array.isArray(nested)) return nested;
    if (nested && typeof nested === 'object') {
      return Object.entries(nested).map(([ayahNumber, text]) => ({
        ayah_number: ayahNumber,
        text,
      }));
    }
    return [];
  }

  if (!data || typeof data !== 'object') return [];

  const nested =
    data[n] ||
    data[String(n)] ||
    data?.surahs?.[n] ||
    data?.surahs?.[String(n)] ||
    data?.chapters?.[n] ||
    data?.chapters?.[String(n)];

  if (Array.isArray(nested)) return nested;
  if (nested && typeof nested === 'object') {
    const ayahs = nested.ayahs || nested.verses;
    if (Array.isArray(ayahs)) return ayahs;
    return Object.entries(nested).map(([ayahNumber, text]) => ({
      ayah_number: ayahNumber,
      text,
    }));
  }

  return [];
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
  if (expected && records.length !== expected) return false;
  return records.every((record, index) => Number(record.ayahNumber) === index + 1);
}

/**
 * Normalizes a single ayah record from the new JSON format.
 */
function normalizeWarshRecord(raw, surahNumber, fallbackAyahNumber = null) {
  const ayahNumber = Number(raw?.ayah_number ?? raw?.aya_no ?? raw?.ayah ?? raw?.verse ?? fallbackAyahNumber);
  const text = normalizeWhitespace(raw?.text ?? raw?.aya_text ?? raw?.ayah_text ?? raw?.verse_text ?? raw);

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
    // 1. Try IndexedDB cache
    const idbKey = `${IDB_KEY_PREFIX}${n}`;
    try {
      const cached = await dbGet(IDB_STORE, idbKey);
      if (cached && Array.isArray(cached)) {
        cachedSurahs.set(n, cached);
        return cached;
      }
    } catch { }

    // 2. Fetch from the per-surah source first, then fall back to the shared JSON.
    let normalized = [];
    try {
      const url = `${WARSH_DATA_BASE_URL}${String(n).padStart(3, '0')}.json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load warsh surah ${n}: ${res.status}`);
      const data = await res.json();
      const rows = Array.isArray(data) ? data : (data.ayahs || data.verses || []);
      normalized = normalizeWarshRows(rows, n);
      if (!validateWarshRows(normalized, n)) {
        throw new Error(`Invalid per-surah Warsh source for ${n}`);
      }
    } catch {
      const legacy = await loadLegacyWarshData();
      normalized = normalizeWarshRows(rowsFromLegacyData(legacy, n), n);
    }

    if (!validateWarshRows(normalized, n)) {
      throw new Error(`Failed to load warsh surah ${n}: invalid or incomplete source`);
    }

    cachedSurahs.set(n, normalized);

    // 3. Store in IndexedDB
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
        if (cached && typeof cached === 'object') return cached;
      } catch { }

      const res = await fetch(WARSH_LEGACY_JSON_URL);
      if (!res.ok) throw new Error(`Failed to load legacy Warsh JSON: ${res.status}`);
      const data = await res.json();
      dbSet(IDB_STORE, { key: idbKey, data }).catch(() => { });
      return data;
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

  return {
    ayahs,
    bismillah,
    ...buildWarshPayload(ayahs),
  };
}

/**
 * Juz/Page access is now limited to what's currently loaded.
 * If we need full Juz support, we'd need to load multiple surahs.
 */
export async function getWarshJuzVerses(juzNum) {
  return getWarshVersesByHafsScope(`juz/${juzNum}`);
}

export async function getWarshPageVerses(pageNum) {
  return getWarshVersesByHafsScope(`page/${pageNum}`);
}

export function preloadWarshSurah(surahNum) {
  loadWarshSurah(surahNum).catch(() => { });
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
};
