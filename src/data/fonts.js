/**
 * Quran font map.
 *
 * The app intentionally exposes only riwaya-safe Quran fonts.
 * Public choices are scoped by riwaya. QCF page fonts stay internal for
 * page/Mushaf rendering, so users cannot accidentally mix Hafs glyphs into Warsh.
 *
 * Hafs text canonicalization (single source of truth):
 *  - `text_uthmani` is the canonical Unicode text. It is what the API layer
 *    stores in `ayah.text`/`word.text` and what storage, search and every
 *    non-QPC font render.
 *  - `text_qpc_hafs` is a Mushaf-print variant consumed only through the
 *    `qpc-hafs` branches below. It must never leak into generic fallback
 *    chains or into the shared `.text` fields.
 *  - Font-locked payloads (code_v1/code_v2 for QCF page fonts, indopak,
 *    nastaleeq) are only valid inside their own branch.
 *  - getAyahTextForFont/getQuranWordTextForFont are the only entry points
 *    for picking display text; components must not hand-roll fallback
 *    chains over the raw fields.
 */

import { applyFontSigns, comparableArabicText, getFontSignVariant, normalizeQuranGlyphText } from "../utils/quranUtils.js";

export const HAFS_FONT_IDS = [
  "qpc-hafs",
  "qpc-madani-page",
  "qpc-indopak",
  "scheherazade-new",
  "amiri-quran",
  "noto-naskh-arabic",
];

export const WARSH_FONT_IDS = [
  "qpc-warsh",
  "kfgqpc-warsh",
  "scheherazade-new-warsh",
];

export const QURAN_COM_FONT_IDS = [...HAFS_FONT_IDS, ...WARSH_FONT_IDS];
export const INTERNAL_QURAN_FONT_IDS = ["qcf-v2", "qcf-v4-tajweed"];

export const QURAN_FONT_OPTIONS = [
  {
    id: "qpc-hafs",
    label: "QPC Uthmani Hafs",
    hintKey: "settings.qpcHafsHint",
    riwaya: "hafs",
  },
  {
    id: "qpc-madani-page",
    label: "QPC Uthmani Hafs — Madani page",
    hintKey: "settings.qpcMadaniPageHint",
    riwaya: "hafs",
  },
  {
    id: "qpc-indopak",
    label: "IndoPak Nastaleeq (Hafs)",
    hintKey: "settings.qpcIndopakHint",
    riwaya: "hafs",
  },
  {
    id: "scheherazade-new",
    label: "Scheherazade New (Hafs)",
    hintKey: "settings.scheherazadeHint",
    riwaya: "hafs",
  },
  {
    id: "amiri-quran",
    label: "Amiri Quran (Hafs)",
    hintKey: "settings.amiriQuranHint",
    riwaya: "hafs",
  },
  {
    id: "noto-naskh-arabic",
    label: "Noto Naskh (Hafs)",
    hintKey: "settings.notoNaskhHint",
    riwaya: "hafs",
  },
  {
    id: "qpc-warsh",
    label: "Uthmani Warsh (Madinah)",
    hintKey: "settings.qpcWarshHint",
    riwaya: "warsh",
  },
  {
    id: "kfgqpc-warsh",
    label: "KFGQPC Warsh 10",
    hintKey: "settings.kfgqpcWarshHint",
    riwaya: "warsh",
  },
  {
    id: "scheherazade-new-warsh",
    label: "Scheherazade New (Warsh)",
    hintKey: "settings.scheherazadeWarshHint",
    riwaya: "warsh",
  },
];

// One family name per woff2: the long KFGQPC names were aliases of the same
// file, so a stack listing both registered two FontFaces for it.
// Scheherazade New + Noto Naskh Arabic (self-hosted, full Warsh coverage) keep
// the page readable if the Warsh woff2 fails on WebKit. Geeza Pro used to sit
// here: an Apple-only system font, so the same failure rendered a different
// typeface on iPhone and Android.
const WARSH_UTHMANIC_STACK =
  "'KFGQPC Warsh','Scheherazade New','Noto Naskh Arabic',serif";

export const FONT_MAP = {
  "qpc-hafs": "'QPC Hafs',serif",
  // Same Uthmanic face and the same print text; this id only differs in that
  // the Mushaf page keeps the fifteen-line Madani cut instead of flowing.
  "qpc-madani-page": "'QPC Hafs',serif",
  // IndoPak lacks U+0660-U+0669 (standard Arabic-Indic digits); QPC Hafs provides the rosette fallback.
  "qpc-indopak": "'IndoPak','QPC Hafs',serif",
  // QPC Hafs added as fallback so its rosette ligatures render Arabic-Indic verse markers
  // for fonts that do not have those digits or lack the OpenType rosette feature.
  "scheherazade-new":
    "'Scheherazade New','Scheherazade','QPC Hafs',serif",
  "amiri-quran": "'Amiri Quran','Amiri','QPC Hafs',serif",
  "noto-naskh-arabic":
    "'Noto Naskh Arabic','Noto Naskh','Amiri Quran','QPC Hafs',serif",
  "qcf-v2": "'QCF V2','QCF_V2','QPC Hafs',serif",
  "qcf-v4-tajweed":
    "'QCF V4 Tajweed','QCF_V4_Tajweed','QCF V2','QPC Hafs',serif",
  // "qpc-warsh" and "kfgqpc-warsh" are stored ids for one face, so they share it.
  "qpc-warsh": WARSH_UTHMANIC_STACK,
  "kfgqpc-warsh": WARSH_UTHMANIC_STACK,
  "scheherazade-new-warsh":
    "'Scheherazade New','Scheherazade','KFGQPC Warsh',serif",
};

export const DEFAULT_FONT_ID = "qpc-hafs";
export const DEFAULT_WARSH_FONT_ID = "qpc-warsh";

const ARABIC_INDIC_DIGITS = [
  "\u0660",
  "\u0661",
  "\u0662",
  "\u0663",
  "\u0664",
  "\u0665",
  "\u0666",
  "\u0667",
  "\u0668",
  "\u0669",
];

const EXTENDED_ARABIC_INDIC_DIGITS = [
  "\u06f0",
  "\u06f1",
  "\u06f2",
  "\u06f3",
  "\u06f4",
  "\u06f5",
  "\u06f6",
  "\u06f7",
  "\u06f8",
  "\u06f9",
];

const AYAH_MARKER_BY_FONT = {
  // UthmanicHafs1Ver18 shapes the complete digit sequence as one rosette via OpenType calt.
  // Prefixing U+06DD produces a SECOND empty rosette beside the number \u2014 must NOT add it.
  "qpc-hafs": { marker: "", digits: ARABIC_INDIC_DIGITS },
  // IndoPak: use U+06DD prefix with Extended Arabic-Indic digits (U+06F0–U+06F9).
  "qpc-indopak": { marker: "۝", digits: EXTENDED_ARABIC_INDIC_DIGITS },
  // Scheherazade and other Naskh fonts: U+06DD prefix with standard Arabic-Indic digits.
  "scheherazade-new": { marker: "۝", digits: ARABIC_INDIC_DIGITS },
  // Amiri Quran and Noto Naskh draw U+06DD as an empty or broken rosette that never
  // composes the digits. Their markers are digits-only and shaped by the QPC Hafs calt
  // rosette, forced on .native-ayah-marker via [data-quran-font] in riwaya-fonts.css.
  "amiri-quran": { marker: "", digits: ARABIC_INDIC_DIGITS },
  "noto-naskh-arabic": { marker: "", digits: ARABIC_INDIC_DIGITS },
  // The locally hosted Warsh 10 face shapes the digit sequence as a rosette.
  "qpc-warsh": { marker: "", digits: ARABIC_INDIC_DIGITS },
  // Warsh 10 also turns the digit sequence itself into the complete rosette.
  "kfgqpc-warsh": { marker: "", digits: ARABIC_INDIC_DIGITS },
  // Scheherazade Warsh: same U+06DD prefix as its Hafs variant.
  "scheherazade-new-warsh": { marker: "\u06dd", digits: ARABIC_INDIC_DIGITS },
  // QCF page fonts: QCF v4 Tajweed uses U+06DD as the base character for verse-end markers.
  "qcf-v2": { marker: "", digits: ARABIC_INDIC_DIGITS },
  "qcf-v4-tajweed": { marker: "۝", digits: ARABIC_INDIC_DIGITS },
};

export const NATIVE_AYAH_MARKER_RE = /[\u06dd\u06de][\u0660-\u0669\u06f0-\u06f9\d]*/u;

// The legacy Warsh page source stores ayah numbers as single presentation-
// form glyphs: U+FC00 for ayah 1 through U+FD1C for ayah 285. Verified on the
// full source: every ayah ends with exactly 0xFC00 + (numberInSurah - 1) and
// the range never appears inside real words. That same range also hosts
// genuine sacred ligatures, so a bare glyph is only ever removed when it is
// proven to be the expected number for the ayah being cleaned.
export const LEGACY_WARSH_MARKER_BASE = 0xfc00;
export const LEGACY_WARSH_MAX_AYAH_NUMBER = 285;

export function legacyWarshMarkerGlyph(ayahNumber) {
  const value = Number(ayahNumber);
  if (!Number.isInteger(value) || value < 1 || value > LEGACY_WARSH_MAX_AYAH_NUMBER) {
    return null;
  }
  return String.fromCodePoint(LEGACY_WARSH_MARKER_BASE + value - 1);
}

const MARKER_DIGITS = "[\\u0660-\\u0669\\u06F0-\\u06F9\\d]";
const INVISIBLE_SUFFIX = "[\\u061C\\u200B-\\u200F\\u202A-\\u202E\\u2066-\\u2069\\uFEFF]*";

function buildAyahMarkerSuffixRe(legacyGlyph) {
  const branches = [
    `[\\u06DD\\u06DE\\u06E9]?${MARKER_DIGITS}+`,
    `[\\uFD3E\\uFD3F]${MARKER_DIGITS}+[\\uFD3E\\uFD3F]`,
    `[\\u06DD\\u06DE]`,
  ];
  if (legacyGlyph) branches.push(legacyGlyph.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(
    `(?:(?:\\s|&nbsp;)*(?:${branches.join("|")}))+${INVISIBLE_SUFFIX}\\s*$`,
    "u",
  );
}

export const UI_AYAH_MARKER_FONT_ID = "qpc-hafs";

const LEGACY_FONT_ALIASES = {
  "mushaf-kfgqpc": "qpc-hafs",
  "mushaf-1441h": "qpc-hafs",
  "indopak": "qpc-indopak",
  "indopak-nastaleeq": "qpc-indopak",
  "qpc-nastaleeq": "qpc-indopak",
  "mushaf-tajweed": "qcf-v4-tajweed",
  "mushaf-warsh": "qpc-warsh",
  "aal-maghribi-warsh": "kfgqpc-warsh",
  "maghribi-warsh": "kfgqpc-warsh",
  "digital-khatt-v1": "qcf-v2",
  "uthmanic-digital": "qcf-v2",
  "uthmanic-bold": "qcf-v2",
  "kfgqpc-uthman-taha-naskh": "qcf-v2",
  "uthman-taha": "qcf-v2",
  "me-quran": "qpc-hafs",
  "scheherazade": "scheherazade-new",
  "amiri": "amiri-quran",
  "noto-naskh": "noto-naskh-arabic",
  "markazi-text": "qpc-hafs",
  "qalam-madinah": "qpc-hafs",
  "qalam-hanafi": "qpc-hafs",
  cairo: "qpc-hafs",
  harmattan: "qpc-hafs",
  tajawal: "qpc-hafs",
  lateef: "qpc-hafs",
  "el-messiri": "qpc-hafs",
  "reem-kufi": "qpc-hafs",
  "aref-ruqaa": "qpc-hafs",
  mada: "qpc-hafs",
  lemonada: "qpc-hafs",
  jomhuria: "qpc-hafs",
  rakkas: "qpc-hafs",
  marhey: "qpc-hafs",
  mirza: "qpc-hafs",
};

export const ACCEPTED_FONT_IDS = [
  ...QURAN_COM_FONT_IDS,
  ...INTERNAL_QURAN_FONT_IDS,
  ...Object.keys(LEGACY_FONT_ALIASES),
];

export function normalizeFontId(id, riwaya = "hafs") {
  const aliasedId = LEGACY_FONT_ALIASES[id] || id;
  if (riwaya === "warsh") {
    // scheherazade-new used for Hafs maps to its Warsh variant when switching
    if (aliasedId === "scheherazade-new") return "scheherazade-new-warsh";
    return WARSH_FONT_IDS.includes(aliasedId) ? aliasedId : DEFAULT_WARSH_FONT_ID;
  }
  if (HAFS_FONT_IDS.includes(aliasedId)) return aliasedId;
  if (INTERNAL_QURAN_FONT_IDS.includes(aliasedId)) return aliasedId;
  return DEFAULT_FONT_ID;
}

export function resolveFontFamily(id, riwaya = "hafs") {
  const normalizedId = normalizeFontId(id, riwaya);
  return FONT_MAP[normalizedId] || FONT_MAP[DEFAULT_FONT_ID];
}

// The family that actually shapes the verse-end marker. Amiri Quran and Noto
// Naskh carry no composing rosette, so their digits-only markers are shaped by
// the QPC Hafs calt rosette (mirrors the [data-quran-font] rule in riwaya-fonts.css).
const QPC_SHAPED_MARKER_FONT_IDS = new Set(["amiri-quran", "noto-naskh-arabic"]);

export function getAyahMarkerFontFamily(id, riwaya = "hafs") {
  const normalizedId = normalizeFontId(id, riwaya);
  if (riwaya !== "warsh" && QPC_SHAPED_MARKER_FONT_IDS.has(normalizedId)) {
    return FONT_MAP[DEFAULT_FONT_ID];
  }
  return FONT_MAP[normalizedId] || FONT_MAP[DEFAULT_FONT_ID];
}

export function getFontOptionsForRiwaya(riwaya = "hafs") {
  const targetRiwaya = riwaya === "warsh" ? "warsh" : "hafs";
  return QURAN_FONT_OPTIONS.filter((font) => font.riwaya === targetRiwaya);
}

function joinWordField(words, field) {
  return (Array.isArray(words) ? words : [])
    .filter((word) => !word?.charType || word.charType === "word")
    .map((word) => word?.[field])
    .filter(Boolean)
    .join(" ");
}

// A verse-level field can carry the exact letters of the verse while losing a
// word boundary: quran.com's text_qpc_hafs for 15:7 renders "لَّوۡمَا" where
// every other source, and its own word list, have لَّوْ + مَا. The word-by-word
// division is the authoritative one, so when both sides carry the same letters
// and only the word list has the fuller segmentation, paint the word list.
// A real wording difference changes the letters, so it never triggers here.
function restoreWordDivisionBoundaries(verseLevelText, joinedWords) {
  if (!verseLevelText || !joinedWords) return "";
  const painted = stripEmbeddedAyahMarkers(verseLevelText);
  const paintedTokens = painted.split(/\s+/u).filter(Boolean).length;
  const wordTokens = joinedWords.split(/\s+/u).filter(Boolean).length;
  if (wordTokens <= paintedTokens) return "";
  const letters = (value) => comparableArabicText(value).replace(/\s+/g, "");
  return letters(painted) === letters(joinedWords) ? joinedWords : "";
}

export function getQuranWordTextForFont(word, fontId, riwaya = "hafs") {
  if (!word) return "";
  const normalizedId = normalizeFontId(fontId, riwaya);
  const signVariant = getFontSignVariant(normalizedId);
  if (riwaya === "warsh") {
    return applyFontSigns(
      normalizeQuranGlyphText(word.text || word.textUthmani || ""),
      signVariant,
    );
  }

  if (normalizedId === "qpc-indopak") {
    return normalizeQuranGlyphText(
      word.textIndopak || word.textUthmani || word.text || "",
    );
  }
  if (normalizedId === "qpc-hafs") {
    return applyFontSigns(
      normalizeQuranGlyphText(
        word.textQpcHafs || word.textUthmani || word.text || "",
      ),
      signVariant,
    );
  }
  if (normalizedId === "qcf-v4-tajweed") {
    return normalizeQuranGlyphText(
      word.codeV2 || word.textUthmani || word.text || "",
    );
  }
  return normalizeQuranGlyphText(word.textUthmani || word.text || "");
}

export function getAyahTextForFont(ayah, fontId, riwaya = "hafs") {
  if (!ayah) return "";
  const normalizedId = normalizeFontId(fontId, riwaya);
  const signVariant = getFontSignVariant(normalizedId);
  if (riwaya === "warsh") {
    return applyFontSigns(normalizeQuranGlyphText(ayah.text), signVariant);
  }

  const quranCom = ayah.quranCom || {};
  if (normalizedId === "qpc-indopak") {
    const verseLevel = quranCom.textIndopak || "";
    const joined = joinWordField(ayah.words, "textIndopak");
    return normalizeQuranGlyphText(
      restoreWordDivisionBoundaries(verseLevel, joined) ||
      verseLevel ||
      joined ||
      quranCom.textUthmani ||
      ayah.text ||
      "",
    );
  }
  if (normalizedId === "qpc-hafs") {
    const verseLevel = quranCom.textQpcHafs || "";
    const joined = joinWordField(ayah.words, "textQpcHafs");
    return applyFontSigns(
      normalizeQuranGlyphText(
        restoreWordDivisionBoundaries(verseLevel, joined) ||
        verseLevel ||
        joined ||
        quranCom.textUthmani ||
        ayah.text ||
        "",
      ),
      signVariant,
    );
  }
  const verseLevel = quranCom.textUthmani || "";
  const joined = joinWordField(ayah.words, "textUthmani");
  return normalizeQuranGlyphText(
    restoreWordDivisionBoundaries(verseLevel, joined) ||
    verseLevel ||
    joined ||
    ayah.text ||
    "",
  );
}

export function hasNativeAyahMarker(text) {
  return NATIVE_AYAH_MARKER_RE.test(String(text || ""));
}

export function formatAyahMarkerNumber(value, fontId, riwaya = "hafs") {
  const normalizedId = normalizeFontId(fontId, riwaya);
  const config = AYAH_MARKER_BY_FONT[normalizedId] || AYAH_MARKER_BY_FONT[DEFAULT_FONT_ID];
  return String(value ?? "")
    .split("")
    .map((digit) => config.digits[Number.parseInt(digit, 10)] ?? digit)
    .join("");
}

export function getNativeAyahMarker(value, fontId, riwaya = "hafs") {
  if (value == null) return "";
  const normalizedId = normalizeFontId(fontId, riwaya);
  const config = AYAH_MARKER_BY_FONT[normalizedId] || AYAH_MARKER_BY_FONT[DEFAULT_FONT_ID];
  return `${config.marker}${formatAyahMarkerNumber(value, normalizedId, riwaya)}`;
}

/**
 * Marker used by the standalone AyahMarker component.
 *
 * Its CSS intentionally uses the QPC Hafs rosette for a consistent medallion
 * in every reading font. Generating the text with another font configuration
 * (for example Scheherazade's U+06DD prefix) and then shaping it as QPC Hafs
 * creates two adjacent rosettes. Keep glyph and font source inseparable.
 */
export function getUiAyahMarker(value, fontId = UI_AYAH_MARKER_FONT_ID, riwaya = "hafs") {
  return getNativeAyahMarker(value, fontId, riwaya);
}

export function stripEmbeddedAyahMarkers(text, options = {}) {
  const value = normalizeQuranGlyphText(text).trim();
  if (!value) return value;
  const legacyGlyph = legacyWarshMarkerGlyph(options.ayahNumber);
  return value.replace(buildAyahMarkerSuffixRe(legacyGlyph), "").trim();
}

export function appendNativeAyahMarker(
  text,
  ayahNumber,
  fontId,
  riwaya = "hafs",
  includeMarker = true,
) {
  const normalizedValue = normalizeQuranGlyphText(text).trim();
  if (!normalizedValue) return normalizedValue;
  const cleanedValue = stripEmbeddedAyahMarkers(normalizedValue, { ayahNumber });
  if (!cleanedValue) {
    return includeMarker
      ? getNativeAyahMarker(ayahNumber, fontId, riwaya)
      : cleanedValue;
  }
  if (!includeMarker) return cleanedValue;
  const marker = getNativeAyahMarker(ayahNumber, fontId, riwaya);
  return `${cleanedValue}\u202F${marker}`;
}


