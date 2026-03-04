/**
 * Warsh QCF4 Service
 * 
 * Provides authentic Warsh (Nafi') text rendering using QCF4 (Quran Complex Font v4)
 * from the King Fahd Complex.
 * 
 * Architecture:
 * - warsh.json: Array[114 surahs] → Array[verses] → Array[words {p, c}]
 *   - p: font page number (1-50), maps to QCF4_Warsh_XX_W.ttf
 *   - c: PUA (Private Use Area) codepoint, rendered by the corresponding font
 * - Each font file covers a range of mushaf pages (not 1:1 with mushaf pages)
 * - Fonts are loaded lazily from jsDelivr CDN
 */

const FONT_CDN_BASE = 'https://cdn.jsdelivr.net/gh/NaifAlsultan/typst-quran-package@main/fonts/warsh';

import { dbGet, dbSet } from './dbService';

const IDB_STORE = 'cache';
const IDB_KEY = 'warsh-json';

// ── State ────────────────────────────────────────────
let warshData = null;       // The full warsh.json parsed
let dataPromise = null;     // Deduplication: only one fetch at a time
const loadedFonts = new Set();  // Which font pages (1-50) are loaded
const fontPromises = new Map(); // In-flight font loads
const failedFonts = new Set();  // Font pages that failed to load
let _fontLoadListeners = [];    // Listeners for font load completions
let _pendingFontCount = 0;      // Number of fonts currently loading

function isValidWarshWord(word) {
  return (
    word &&
    typeof word === 'object' &&
    Number.isFinite(Number(word.p)) &&
    Number.isFinite(Number(word.c))
  );
}

function isValidWarshData(data) {
  if (!Array.isArray(data) || data.length !== 114) return false;
  return data.every(
    (surah) =>
      Array.isArray(surah) &&
      surah.every((verse) => Array.isArray(verse) && verse.every(isValidWarshWord))
  );
}

/**
 * Check if a specific font page is loaded.
 */
export function isFontPageLoaded(pageNum) {
  return loadedFonts.has(pageNum);
}

/**
 * Check if there are fonts currently loading.
 */
export function areFontsLoading() {
  return _pendingFontCount > 0;
}

/**
 * Subscribe to font load state changes.
 * Callback receives { loaded: Set, pending: number, failed: Set }
 * @returns {Function} unsubscribe
 */
export function onFontLoadChange(callback) {
  _fontLoadListeners.push(callback);
  return () => {
    _fontLoadListeners = _fontLoadListeners.filter(fn => fn !== callback);
  };
}

function _notifyFontListeners() {
  const state = { loaded: loadedFonts, pending: _pendingFontCount, failed: failedFonts };
  for (const fn of _fontLoadListeners) {
    try { fn(state); } catch { /* ignore */ }
  }
}

// ── Data Loading ─────────────────────────────────────

/**
 * Lazy-load warsh.json (only once, cached in IndexedDB).
 * @returns {Promise<Array>} The full Warsh Quran data
 */
export async function loadWarshData() {
  if (warshData) return warshData;
  if (dataPromise) return dataPromise;

  dataPromise = (async () => {
    // 1. Try IndexedDB cache first (instant, no network)
    try {
      const cached = await dbGet(IDB_STORE, IDB_KEY);
      if (cached && isValidWarshData(cached.data)) {
        warshData = cached.data;
        return warshData;
      }
    } catch {
      // Cache miss or error — proceed to network
    }

    // 2. Fetch from network
    const res = await fetch('/data/warsh.json');
    if (!res.ok) throw new Error(`Failed to load warsh.json: ${res.status}`);
    const data = await res.json();
    if (!isValidWarshData(data)) {
      throw new Error('Invalid warsh.json format');
    }
    warshData = data;

    // 3. Store in IndexedDB for next time (fire-and-forget)
    dbSet(IDB_STORE, { key: IDB_KEY, data }).catch(() => { });

    return data;
  })().catch(err => {
    dataPromise = null; // Allow retry on error
    throw err;
  });

  return dataPromise;
}

/**
 * Check if Warsh data is already loaded.
 */
export function isWarshDataLoaded() {
  return warshData !== null;
}

// ── Font Loading ─────────────────────────────────────

/**
 * Load a single QCF4 Warsh font by page number.
 * Uses the FontFace API for dynamic loading.
 * @param {number} pageNum - Font page (1-50)
 * @returns {Promise<void>}
 */
export async function loadWarshFont(pageNum, retries = 2) {
  if (loadedFonts.has(pageNum)) return;
  if (fontPromises.has(pageNum)) return fontPromises.get(pageNum);

  const padded = String(pageNum).padStart(2, '0');
  const fontFamily = `QCF4_Warsh_${padded}`;
  const url = `${FONT_CDN_BASE}/QCF4_Warsh_${padded}_W.ttf`;

  _pendingFontCount++;
  failedFonts.delete(pageNum);
  _notifyFontListeners();

  const promise = (async () => {
    let lastErr;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          // Exponential backoff: 500ms, 1500ms
          await new Promise(r => setTimeout(r, 500 * attempt));
        }
        const font = new FontFace(fontFamily, `url(${url})`, {
          style: 'normal',
          weight: 'normal',
          display: 'swap',
        });
        await font.load();
        document.fonts.add(font);
        loadedFonts.add(pageNum);
        failedFonts.delete(pageNum);
        _pendingFontCount = Math.max(0, _pendingFontCount - 1);
        _notifyFontListeners();
        return;
      } catch (err) {
        lastErr = err;
        if (attempt < retries) {
          console.warn(`Warsh font page ${pageNum} load failed, retrying (${attempt + 1}/${retries})...`);
        }
      }
    }
    // All retries exhausted
    console.error(`Failed to load Warsh font page ${pageNum} after ${retries + 1} attempts:`, lastErr);
    failedFonts.add(pageNum);
    fontPromises.delete(pageNum);
    _pendingFontCount = Math.max(0, _pendingFontCount - 1);
    _notifyFontListeners();
  })();

  fontPromises.set(pageNum, promise);
  return promise;
}

/**
 * Load all fonts needed for a set of verses.
 * Deduplicates and loads in parallel.
 * @param {Array} verses - Array of verse word arrays [{p, c}]
 * @returns {Promise<void>}
 */
export async function loadFontsForVerses(verses) {
  if (!Array.isArray(verses) || verses.length === 0) return;

  const neededPages = new Set();
  for (const verse of verses) {
    if (!Array.isArray(verse)) continue;
    for (const word of verse) {
      if (!isValidWarshWord(word)) continue;
      const page = Number(word.p);
      if (!loadedFonts.has(page)) {
        neededPages.add(page);
      }
    }
  }

  if (neededPages.size === 0) return;

  // Load all needed fonts in parallel with retry
  const promises = [...neededPages].map(p => loadWarshFont(p));
  await Promise.allSettled(promises);

  // Check for failures and report
  const failed = [...neededPages].filter(p => failedFonts.has(p));
  if (failed.length > 0) {
    console.warn(`Warsh fonts failed to load for pages: ${failed.join(', ')}`);
  }
}

/**
 * Check if a specific font page is loaded.
 */
export function isFontLoaded(pageNum) {
  return loadedFonts.has(pageNum);
}

/**
 * Get the CSS font-family name for a given page number.
 */
export function getFontFamily(pageNum) {
  const padded = String(pageNum).padStart(2, '0');
  return `QCF4_Warsh_${padded}`;
}

// ── Verse Access ─────────────────────────────────────

/**
 * Get all verses for a surah (0-indexed internally, 1-indexed externally).
 * @param {number} surahNum - Surah number (1-114)
 * @returns {Promise<Array>} Array of verse word arrays
 */
export async function getWarshSurahVerses(surahNum) {
  const data = await loadWarshData();
  const idx = surahNum - 1;
  if (idx < 0 || idx >= data.length) {
    throw new Error(`Invalid surah number: ${surahNum}`);
  }
  return data[idx];
}

/**
 * Get a single verse's words.
 * @param {number} surahNum - Surah number (1-114)
 * @param {number} verseNum - Verse number (1-based)
 * @returns {Promise<Array<{p: number, c: number}>>}
 */
export async function getWarshVerse(surahNum, verseNum) {
  const surah = await getWarshSurahVerses(surahNum);
  const idx = verseNum - 1;
  if (idx < 0 || idx >= surah.length) {
    throw new Error(`Invalid verse number: ${verseNum} for surah ${surahNum}`);
  }
  return surah[idx];
}

/**
 * Get Warsh surah data formatted like the AlQuran Cloud API response.
 * This allows seamless integration with the existing display logic.
 * 
 * @param {number} surahNum - Surah number (1-114)
 * @returns {Promise<Object>} API-compatible ayah data
 */
export async function getWarshSurahFormatted(surahNum) {
  const verses = await getWarshSurahVerses(surahNum);

  // Start loading fonts in background (don't block data return!)
  // WarshWordText handles loading state per-word with shimmer placeholders.
  loadFontsForVerses(verses).catch(() => {});

  // Calculate global ayah number offset
  const data = await loadWarshData();
  let globalOffset = 0;
  for (let i = 0; i < surahNum - 1; i++) {
    globalOffset += data[i].length;
  }

  const ayahs = verses.map((words, idx) => ({
    number: globalOffset + idx + 1,         // Global ayah number
    numberInSurah: idx + 1,                 // Verse number within surah
    text: (Array.isArray(words) ? words : [])
      .filter(isValidWarshWord)
      .map(w => String.fromCodePoint(Number(w.c)))
      .join(' '),
    warshWords: (Array.isArray(words) ? words : []).filter(isValidWarshWord),
    surah: { number: surahNum },
    juz: null,                               // Could compute if needed
  }));

  return {
    ayahs,
    edition: { identifier: 'warsh-qcf4', name: 'Warsh (QCF4 Mushaf)' },
    requestedRiwaya: 'warsh',
    usedEdition: 'warsh-qcf4',
    isTextFallback: false,                   // This IS authentic Warsh text!
    isQCF4: true,                            // Flag for rendering
  };
}

/**
 * Get Warsh verses for a given juz using real juz boundaries from JUZ_DATA.
 * Each juz has a defined start (surah:ayah) and ends just before the next juz starts.
 */
export async function getWarshJuzVerses(juzNum) {
  const data = await loadWarshData();

  // Real juz boundaries (1-indexed surah/ayah)
  const JUZ_STARTS = [
    { s: 1, a: 1 }, { s: 2, a: 142 }, { s: 2, a: 253 }, { s: 3, a: 93 }, { s: 4, a: 24 },
    { s: 4, a: 148 }, { s: 5, a: 82 }, { s: 6, a: 111 }, { s: 7, a: 88 }, { s: 8, a: 41 },
    { s: 9, a: 93 }, { s: 11, a: 6 }, { s: 12, a: 53 }, { s: 15, a: 1 }, { s: 17, a: 1 },
    { s: 18, a: 75 }, { s: 21, a: 1 }, { s: 23, a: 1 }, { s: 25, a: 21 }, { s: 27, a: 56 },
    { s: 29, a: 46 }, { s: 33, a: 31 }, { s: 36, a: 28 }, { s: 39, a: 32 }, { s: 41, a: 47 },
    { s: 46, a: 1 }, { s: 51, a: 31 }, { s: 58, a: 1 }, { s: 67, a: 1 }, { s: 78, a: 1 },
  ];

  const start = JUZ_STARTS[juzNum - 1]; // {s, a} — 1-indexed
  // End = start of next juz, or end of Quran for juz 30
  const hasNext = juzNum < 30;
  const end = hasNext ? JUZ_STARTS[juzNum] : null;

  const ayahs = [];
  let globalNumber = 0;

  // Calculate global number offset up to the start surah
  for (let s = 0; s < start.s - 1; s++) {
    globalNumber += data[s].length;
  }
  globalNumber += start.a - 1; // add verses before the start ayah

  // Iterate from start surah to the end of the juz
  for (let s = start.s - 1; s < data.length; s++) {
    const surahVerseCount = data[s].length;
    const firstVerse = (s === start.s - 1) ? start.a - 1 : 0; // 0-indexed

    for (let v = firstVerse; v < surahVerseCount; v++) {
      // Check if we've reached the next juz boundary
      if (end && (s + 1 > end.s || (s + 1 === end.s && v + 1 >= end.a))) {
        break;
      }

      const words = data[s][v];
      const validWords = (Array.isArray(words) ? words : []).filter(isValidWarshWord);
      globalNumber++;
      ayahs.push({
        number: globalNumber,
        numberInSurah: v + 1,
        text: validWords.map(w => String.fromCodePoint(Number(w.c))).join(' '),
        warshWords: validWords,
        surah: { number: s + 1 },
        juz: juzNum,
      });
    }

    // Check if next surah is beyond the juz boundary
    if (end && s + 2 > end.s) {
      // We may still need partial next surah — only break if current surah >= end surah
      if (s + 1 >= end.s) break;
    }
  }

  // Start loading fonts in background (don't block data return!)
  const allWords = ayahs.map(a => a.warshWords);
  loadFontsForVerses(allWords).catch(() => {});

  return {
    ayahs,
    edition: { identifier: 'warsh-qcf4', name: 'Warsh (QCF4 Mushaf)' },
    requestedRiwaya: 'warsh',
    usedEdition: 'warsh-qcf4',
    isTextFallback: false,
    isQCF4: true,
  };
}

/**
 * Preload Warsh data + fonts for a given surah.
 * Call this when user hovers over a surah link or similar.
 */
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
  preloadWarshSurah,
};
