/**
 * fonts.js – Canonical font-id → CSS font-family map.
 *
 * Used by QuranDisplay (to set the active Quranic font) and SettingsModal
 * (to preview each font option).  Single source of truth.
 */

/** @type {Record<string, string>} */
export const FONT_MAP = {
  /* ── Recommended (High-quality Unicode) ─────────────────────────── */
  "mushaf-kfgqpc":
    "'KFGQPC Uthmanic Script HAFS','ME Quran','Amiri Quran',serif",
  "mushaf-warsh":
    "'KFGQPC Uthmanic Script WARSH','Amiri Quran','Amiri',serif",
  "amiri-quran": "'Amiri Quran','Scheherazade New','Noto Naskh Arabic',serif",
  "scheherazade-new":
    "'Scheherazade New','Amiri Quran','Noto Naskh Arabic',serif",
  "noto-naskh-arabic":
    "'Noto Naskh Arabic','Scheherazade New','Amiri Quran',serif",
  "markazi-text": "'Markazi Text','Amiri Quran','Scheherazade New',serif",

  /* ── Digital Fonts ──────────────────────────────────────────── */
  "uthmanic-digital": "'ME Quran','Scheherazade New','Amiri Quran',serif",
  "uthmanic-bold": "'ME Quran Bold','ME Quran','Scheherazade New',serif",
  "kfgqpc-uthman-taha-naskh":
    "'KFGQPC Uthman Taha Naskh','Uthman Taha Hafs','ME Quran',serif",

  /* ── Indopak / Nastaleeq ──────────────────────────────────────────── */
  "qalam-madinah":
    "'Qalam Madinah','Scheherazade New','Noto Naskh Arabic',serif",
  "qalam-hanafi": "'Qalam Hanafi','Scheherazade New','Noto Naskh Arabic',serif",

  /* ── Modern UI / Sans-serif ───────────────────────────────────────── */
  cairo: "'Cairo','Noto Naskh Arabic',sans-serif",
  harmattan: "'Harmattan','Cairo',sans-serif",
  tajawal: "'Tajawal','Cairo',sans-serif",

  /* ── Display / Headlines ─────────────────────────────────────────── */
  jomhuria: "'Jomhuria','Cairo',sans-serif",
  rakkas: "'Rakkas','Cairo',sans-serif",

  /* ── Legacy aliases ────────────── */
  amiri: "'Amiri','Amiri Quran','Scheherazade New',serif",
};

/** Default font fallback (always safe to render). */
export const DEFAULT_FONT_ID = "mushaf-kfgqpc";

/**
 * Resolve a font-id to its CSS font-family string.
 *
 * @param {string} id
 * @param {"hafs"|"warsh"} [riwaya="hafs"]
 * @returns {string}
 */
export function resolveFontFamily(id, riwaya = "hafs") {
  // If we are in Warsh mode, we prioritize the Warsh font stack
  if (riwaya === "warsh") {
    return FONT_MAP["mushaf-warsh"];
  }

  return FONT_MAP[id] ?? FONT_MAP[DEFAULT_FONT_ID];
}
