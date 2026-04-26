/**
 * Warsh Unicode Service
 * 
 * Provides authentic Warsh (Nafi') text rendering using Unicode text.
 * Data is fetched from GitHub.
 */

import { dbGet, dbSet } from './dbService';
import { WARSH_DATA_URL } from '../constants/warshSource';

export const WARSH_URL = WARSH_DATA_URL;
const IDB_STORE = 'cache';
const IDB_KEY = 'warsh-json-unicode-v2';
const WARSH_SOURCE_ID = 'quran_warsh:warshData_v2-1';
const TRAILING_WARSH_AYAH_MARKER_RE = /[\s\u00a0]*[\ufc00-\ufcff]+$/u;

// ── State ────────────────────────────────────────────
let warshData = null;       // Array[114 surahs] -> Array[normalized ayah records]
let dataPromise = null;     // Deduplication: only one fetch at a time

// Font logic is removed since we use standard Unicode
export function isFontPageLoaded() { return true; }
export function areFontsLoading() { return false; }
export function onFontLoadChange() { return () => {}; }
export function loadWarshFont() { return Promise.resolve(); }
export function loadFontsForVerses() { return Promise.resolve(); }
export function isFontLoaded() { return true; }
export function getFontFamily() { return '"Amiri", "Traditional Arabic", serif'; }

function isValidWarshData(data) {
  return (
    Array.isArray(data) &&
    data.length === 114 &&
    data.every((surah) => Array.isArray(surah))
  );
}

function normalizeWhitespace(text) {
  return String(text || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cleanWarshText(text) {
  return normalizeWhitespace(String(text || '').replace(TRAILING_WARSH_AYAH_MARKER_RE, ''));
}

function splitWarshWords(text) {
  return normalizeWhitespace(text).split(/\s+/).filter(Boolean);
}

function parseNumber(value, fallback = null) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function parsePages(value) {
  const matches = String(value || '').match(/\d+/g) || [];
  const rawPages = matches
    .map((page) => Number(page))
    .filter((page) => Number.isFinite(page) && page >= 1 && page <= 604);

  if (rawPages.length === 0) {
    return { page: null, pages: [] };
  }

  const [first, second] = rawPages;
  const last = second || first;
  const from = Math.min(first, last);
  const to = Math.max(first, last);
  const pages = [];
  for (let page = from; page <= to; page += 1) {
    pages.push(page);
  }

  return { page: from, pages };
}

function normalizeWarshRecord(raw, fallbackId) {
  const surahNumber = parseNumber(raw?.sura_no);
  const ayahNumber = parseNumber(raw?.aya_no);
  const text = cleanWarshText(raw?.aya_text);
  const pageInfo = parsePages(raw?.page);

  if (!surahNumber || !ayahNumber || !text) {
    return null;
  }

  return {
    id: parseNumber(raw?.id, fallbackId),
    surahNumber,
    ayahNumber,
    text,
    rawText: normalizeWhitespace(raw?.aya_text),
    words: splitWarshWords(text),
    juz: parseNumber(raw?.jozz),
    page: pageInfo.page,
    pages: pageInfo.pages,
    lineStart: parseNumber(raw?.line_start),
    lineEnd: parseNumber(raw?.line_end),
    surahNameAr: normalizeWhitespace(raw?.sura_name_ar),
    surahNameEn: normalizeWhitespace(raw?.sura_name_en),
  };
}

function groupWarshData(flatData) {
  if (!Array.isArray(flatData)) {
    throw new Error('Invalid warsh data format');
  }

  const grouped = Array.from({ length: 114 }, () => []);
  flatData.forEach((raw, index) => {
    const record = normalizeWarshRecord(raw, index + 1);
    if (!record || record.surahNumber < 1 || record.surahNumber > 114) return;
    grouped[record.surahNumber - 1].push(record);
  });

  grouped.forEach((surah) => {
    surah.sort((a, b) => a.ayahNumber - b.ayahNumber);
  });

  return grouped;
}

function flattenWarshData(data) {
  return data.flatMap((surah) => surah);
}

function toWarshAyah(record) {
  const text = record?.text || '';
  return {
    number: record?.id,
    warshNumber: record?.id,
    numberInSurah: record?.ayahNumber,
    text,
    warshWords: record?.words?.length ? record.words : splitWarshWords(text),
    surah: {
      number: record?.surahNumber,
      name: record?.surahNameAr,
      englishName: record?.surahNameEn,
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
    edition: { identifier: 'warsh-unicode', name: 'Warsh (Unicode)' },
    requestedRiwaya: 'warsh',
    usedEdition: 'warsh-unicode',
    source: WARSH_SOURCE_ID,
    isTextFallback: false,
    isQCF4: false,
  };
}

// ── Data Loading ─────────────────────────────────────

/**
 * Lazy-load warsh data.
 * The raw JSON is a flat array of Warsh ayah records.
 * We parse it into a 2D array: data[surahIndex] = normalized ayah records.
 */
export async function loadWarshData() {
  if (warshData) return warshData;
  if (dataPromise) return dataPromise;

  dataPromise = (async () => {
    // 1. Try IndexedDB cache first
    try {
      const cached = await dbGet(IDB_STORE, IDB_KEY);
      if (cached && isValidWarshData(cached.data)) {
        warshData = cached.data;
        return warshData;
      }
    } catch {
      // Cache miss or error
    }

    // 2. Fetch from network
    const res = await fetch(WARSH_URL);
    if (!res.ok) throw new Error(`Failed to load warsh data: ${res.status}`);
    const flatData = await res.json();

    const grouped = groupWarshData(flatData);

    if (!isValidWarshData(grouped)) {
      throw new Error('Invalid warsh data format after parsing');
    }
    warshData = grouped;

    // 3. Store in IndexedDB for next time
    dbSet(IDB_STORE, { key: IDB_KEY, data: grouped }).catch(() => { });

    return grouped;
  })().catch(err => {
    dataPromise = null;
    throw err;
  });

  return dataPromise;
}

export function isWarshDataLoaded() {
  return warshData !== null;
}

// ── Verse Access ─────────────────────────────────────

export async function getWarshSurahVerses(surahNum) {
  const data = await loadWarshData();
  const idx = surahNum - 1;
  if (idx < 0 || idx >= data.length) {
    throw new Error(`Invalid surah number: ${surahNum}`);
  }
  return data[idx];
}

export async function getWarshVerse(surahNum, verseNum) {
  const surah = await getWarshSurahVerses(surahNum);
  const idx = verseNum - 1;
  if (idx < 0 || idx >= surah.length) {
    throw new Error(`Invalid verse number: ${verseNum} for surah ${surahNum}`);
  }
  return surah[idx];
}

export async function getWarshSurahFormatted(surahNum) {
  const verses = await getWarshSurahVerses(surahNum);
  const surahNumber = Number(surahNum);
  const ayahs = verses.map(toWarshAyah);

  const bismillah = (surahNumber !== 9 && surahNumber !== 1)
    ? {
      text: "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
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

export async function getWarshJuzVerses(juzNum) {
  const data = await loadWarshData();
  const ayahs = flattenWarshData(data)
    .filter((record) => record.juz === Number(juzNum))
    .map(toWarshAyah);

  return buildWarshPayload(ayahs);
}

export async function getWarshPageVerses(pageNum) {
  const data = await loadWarshData();
  const page = Number(pageNum);
  const ayahs = flattenWarshData(data)
    .filter((record) => record.pages?.includes(page))
    .map(toWarshAyah);

  return buildWarshPayload(ayahs);
}

export function preloadWarshSurah(surahNum) {
  getWarshSurahFormatted(surahNum).catch(() => { });
}

export default {
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
