/**
 * Warsh Unicode Service
 * 
 * Provides authentic Warsh (Nafi') text rendering using Unicode text.
 * Data is fetched from the new warsh-quran-audio repository.
 */

import { dbGet, dbSet } from './dbService';
import { WARSH_DATA_BASE_URL } from '../constants/warshSource';

const IDB_STORE = 'cache';
const IDB_KEY_PREFIX = 'warsh-unicode-s-';
const WARSH_SOURCE_ID = 'warsh-audio-repo-v1';

// ── State ────────────────────────────────────────────
// In-memory cache for surahs: Map[surahNum] -> Array[normalized ayah records]
const cachedSurahs = new Map();
const pendingSurahs = new Map(); // deduplication

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
    .replace(/\s+/g, ' ')
    .trim();
}

function splitWarshWords(text) {
  return normalizeWhitespace(text).split(/\s+/).filter(Boolean);
}

/**
 * Normalizes a single ayah record from the new JSON format.
 */
function normalizeWarshRecord(raw, surahNumber) {
  const ayahNumber = Number(raw?.ayah_number);
  const text = normalizeWhitespace(raw?.text);

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

    // 2. Fetch from network
    const url = `${WARSH_DATA_BASE_URL}${String(n).padStart(3, '0')}.json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load warsh surah ${n}: ${res.status}`);
    
    const data = await res.json();
    const normalized = (data.ayahs || [])
      .map(raw => normalizeWarshRecord(raw, n))
      .filter(Boolean);

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
  // For now, return empty or handle specifically if needed.
  return buildWarshPayload([]);
}

export async function getWarshPageVerses(pageNum) {
  // For now, return empty.
  return buildWarshPayload([]);
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
