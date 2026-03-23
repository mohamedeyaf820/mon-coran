/**
 * fonts.js – Canonical font-id → CSS font-family map.
 *
 * Used by QuranDisplay (to set the active Quranic font) and SettingsModal
 * (to preview each font option).  Single source of truth.
 */

/** @type {Record<string, string>} */
export const FONT_MAP = {
  /* ── Recommended (no rendering artifacts) ─────────────────────────── */
  "scheherazade-new":
    "'Scheherazade New','Amiri Quran','Noto Naskh Arabic',serif",
  "amiri-quran": "'Amiri Quran','Scheherazade New','Noto Naskh Arabic',serif",
  "noto-naskh-arabic":
    "'Noto Naskh Arabic','Scheherazade New','Amiri Quran',serif",
  "markazi-text": "'Markazi Text','Amiri Quran','Scheherazade New',serif",
  "el-messiri": "'El Messiri','Noto Naskh Arabic','Scheherazade New',serif",

  /* ── Uthmanic / KFGQPC (may show rendering artifacts in some browsers) */
  "mushaf-1441h":
    "'KFGQPC Uthmanic Script HAFS','ME Quran','Scheherazade New','Amiri Quran',serif",
  "mushaf-tajweed":
    "'KFGQPC Uthmanic Script HAFS','ME Quran','Scheherazade New','Amiri Quran',serif",
  "uthmanic-digital": "'ME Quran','Scheherazade New','Amiri Quran',serif",
  "uthmanic-bold": "'ME Quran Bold','ME Quran','Scheherazade New',serif",

  /* ── Indopak / Nastaleeq ──────────────────────────────────────────── */
  "qalam-madinah":
    "'Qalam Madinah','Scheherazade New','Noto Naskh Arabic',serif",
  "qalam-hanafi": "'Qalam Hanafi','Scheherazade New','Noto Naskh Arabic',serif",
  "uthman-taha":
    "'Uthman Taha Hafs','KFGQPC Uthmanic Script HAFS','Scheherazade New',serif",
  "kfgqpc-uthman-taha-naskh":
    "'KFGQPC Uthman Taha Naskh','Uthman Taha Hafs','ME Quran',serif",

  /* ── Kufi & Diwani ─────────────────────────────────────────────────── */
  "reem-kufi": "'Reem Kufi','Cairo','Noto Naskh Arabic',sans-serif",
  "aref-ruqaa": "'Aref Ruqaa','Scheherazade New','Amiri Quran',serif",

  /* ── Modern UI / Sans-serif ───────────────────────────────────────── */
  cairo: "'Cairo','Noto Naskh Arabic',sans-serif",
  harmattan: "'Harmattan','Cairo',sans-serif",
  mada: "'Mada','Cairo',sans-serif",
  tajawal: "'Tajawal','Cairo',sans-serif",
  lemonada: "'Lemonada','Cairo',sans-serif",

  /* ── Display / Headlines ─────────────────────────────────────────── */
  jomhuria: "'Jomhuria','Cairo',sans-serif",
  rakkas: "'Rakkas','Cairo',sans-serif",
  marhey: "'Marhey','Cairo',sans-serif",

  /* ── Nastaliq / Literary ─────────────────────────────────────────── */
  lateef: "'Lateef','Scheherazade New','Amiri',serif",
  mirza: "'Mirza','Lateef',serif",

  /* ── Legacy aliases (kept for backwards compatibility) ────────────── */
  "me-quran": "'ME Quran','Scheherazade New','Amiri Quran',serif",
  scheherazade: "'Scheherazade New','Amiri Quran','Noto Naskh Arabic',serif",
  amiri: "'Amiri','Amiri Quran','Scheherazade New',serif",
  "noto-naskh": "'Noto Naskh Arabic','Scheherazade New','Amiri Quran',serif",
};

/** Default font fallback (always safe to render). */
export const DEFAULT_FONT_ID = "scheherazade-new";

/**
 * Resolve a font-id to its CSS font-family string.
 * Falls back to the default if the id is unknown.
 *
 * @param {string} id
 * @returns {string}
 */
export function resolveFontFamily(id) {
  return FONT_MAP[id] ?? FONT_MAP[DEFAULT_FONT_ID];
}
