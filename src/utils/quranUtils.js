/**
 * Quran Utilities
 */

const BASMALA_CACHE = new Map();
const CACHE_MAX = 800;

// Diacritics character class: covers all Arabic combining marks + tatweel
const D = '[\\u0640\\u064B-\\u065F\\u0670\\u06D6-\\u06ED]*';

const BASMALA_PATTERNS = [
    // ROBUST: letter-skeleton with any diacritics in any order between base letters
    // Matches: بسم + (ا|ٱ)لله + (ا|ٱ)لرحمٰن + (ا|ٱ)لرحيم
    new RegExp(
        `^[\\u200F\\u200E\\s]*` +
        `\\u0628${D}\\u0633${D}\\u0645${D}` +      // بسم
        `\\s+` +
        `[\\u0627\\u0671]${D}\\u0644${D}\\u0644${D}\\u0647${D}` + // (ا|ٱ)لله
        `\\s+` +
        `[\\u0627\\u0671]${D}\\u0644${D}\\u0631${D}\\u062D${D}\\u0645${D}[\\u0640\\u0670]*\\u0646${D}` + // (ا|ٱ)لرحمٰن
        `\\s+` +
        `[\\u0627\\u0671]${D}\\u0644${D}\\u0631${D}\\u062D${D}\\u064A\\u0645${D}` + // (ا|ٱ)لرحيم
        `\\s*`
    ),
    // Simple (no diacritics at all)
    /^بسم الله الرحمن الرحيم\s*/,
];

export function startsWithBasmala(text) {
    const input = String(text || '').replace(/[\u200F\u200E]/g, '');
    return BASMALA_PATTERNS.some((pattern) => pattern.test(input));
}

export function shouldShowStandaloneBasmala(surahNum, riwaya = 'hafs', firstAyahText = '') {
    const surahNumber = Number(surahNum);
    if (!surahNumber || surahNumber === 9) return false;
    if (surahNumber !== 1) return true;
    return riwaya === 'warsh' && !startsWithBasmala(firstAyahText);
}

/**
 * Strips the Basmala from the beginning of a verse text.
 */
export function stripBasmala(text, surahNum, ayahNumInSurah) {
    if (ayahNumInSurah !== 1 || surahNum === 1 || surahNum === 9) return text;
    const input = text || '';
    const key = `${surahNum}:${ayahNumInSurah}:${input}`;

    if (BASMALA_CACHE.has(key)) return BASMALA_CACHE.get(key);

    let cleaned = input.replace(/[\u200F\u200E]/g, '');
    for (const pat of BASMALA_PATTERNS) {
        const before = cleaned;
        cleaned = cleaned.replace(pat, '');
        if (cleaned !== before) break;
    }

    if (/^\s*ب/.test(cleaned) && /[\u0627\u0671]لرح/.test(cleaned)) {
        const fallback = cleaned.replace(/^[\s۝﴿﴾]*(?:ب[\s\S]{0,90}?[\u0627\u0671]لرح[^\s]{0,10}يم)[\s۝﴿﴾]*/u, '');
        if (fallback.length > 0 && fallback.length < cleaned.length) {
            cleaned = fallback;
        }
    }

    const result = cleaned.trim();
    if (BASMALA_CACHE.size > CACHE_MAX) BASMALA_CACHE.clear();
    BASMALA_CACHE.set(key, result);
    return result;
}
