/**
 * Quran font map.
 *
 * The app intentionally exposes only riwaya-safe Quran fonts.
 * Public choices are scoped by riwaya. QCF page fonts stay internal for
 * page/Mushaf rendering, so users cannot accidentally mix Hafs glyphs into Warsh.
 */

export const HAFS_FONT_IDS = [
  "qpc-hafs",
  "qpc-indopak",
];

export const WARSH_FONT_IDS = [
  "qpc-warsh",
  "kfgqpc-warsh",
];

export const QURAN_COM_FONT_IDS = [...HAFS_FONT_IDS, ...WARSH_FONT_IDS];
export const INTERNAL_QURAN_FONT_IDS = ["qcf-v2", "qcf-v4-tajweed"];

export const QURAN_FONT_OPTIONS = [
  {
    id: "qpc-hafs",
    label: "Quran.com Hafs",
    hintKey: "settings.qpcHafsHint",
    riwaya: "hafs",
  },
  {
    id: "qpc-indopak",
    label: "Quran.com IndoPak",
    hintKey: "settings.qpcIndopakHint",
    riwaya: "hafs",
  },
  {
    id: "qpc-warsh",
    label: "QPC Warsh",
    hintKey: "settings.qpcWarshHint",
    riwaya: "warsh",
  },
  {
    id: "kfgqpc-warsh",
    label: "KFGQPC Warsh",
    hintKey: "settings.kfgqpcWarshHint",
    riwaya: "warsh",
  },
];

export const FONT_MAP = {
  "qpc-hafs":
    "'QPC Hafs','KFGQPC Uthmanic Script HAFS','UthmanicHafs',serif",
  "qpc-indopak":
    "'IndoPak','QPC IndoPak','QPC Hafs','KFGQPC Uthmanic Script HAFS',serif",
  "qcf-v2":
    "'QCF V2','QCF_V2','QPC Hafs','KFGQPC Uthmanic Script HAFS',serif",
  "qcf-v4-tajweed":
    "'QCF V4 Tajweed','QCF_V4_Tajweed','QCF V2','QPC Hafs',serif",
  "qpc-warsh":
    "'QPC Warsh','KFGQPC Uthmanic Script WARSH',serif",
  "kfgqpc-warsh":
    "'KFGQPC Warsh','warsh10','QPC Warsh','KFGQPC Uthmanic Script WARSH',serif",
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
  "qpc-hafs": { marker: "\u06dd", digits: ARABIC_INDIC_DIGITS },
  "qpc-indopak": { marker: "\u06dd", digits: EXTENDED_ARABIC_INDIC_DIGITS },
  "qpc-warsh": { marker: "\u06dd", digits: ARABIC_INDIC_DIGITS },
  "kfgqpc-warsh": { marker: "\u06dd", digits: ARABIC_INDIC_DIGITS },
  "qcf-v2": { marker: "\u06dd", digits: ARABIC_INDIC_DIGITS },
  "qcf-v4-tajweed": { marker: "\u06dd", digits: ARABIC_INDIC_DIGITS },
};

export const NATIVE_AYAH_MARKER_RE = /[\u06dd\u06de][\u0660-\u0669\u06f0-\u06f9\d]*/u;
const AYAH_MARKER_SUFFIX_RE = /(?:\s|&nbsp;)*(?:[\u06dd\u06de]?[\u0660-\u0669\u06f0-\u06f9\d]+)\s*$/u;

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
  "scheherazade": "qpc-hafs",
  "scheherazade-new": "qpc-hafs",
  "amiri": "qpc-hafs",
  "amiri-quran": "qpc-hafs",
  "noto-naskh": "qpc-hafs",
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

export function getFontOptionsForRiwaya(riwaya = "hafs") {
  const targetRiwaya = riwaya === "warsh" ? "warsh" : "hafs";
  return QURAN_FONT_OPTIONS.filter((font) => font.riwaya === targetRiwaya);
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

export function appendNativeAyahMarker(text, ayahNumber, fontId, riwaya = "hafs") {
  const value = String(text || "").trim();
  if (!value) return value;
  const marker = getNativeAyahMarker(ayahNumber, fontId, riwaya);
  const cleanedValue = value.replace(AYAH_MARKER_SUFFIX_RE, "").trim();
  if (!cleanedValue) return marker;
  return `${cleanedValue} ${marker}`;
}
