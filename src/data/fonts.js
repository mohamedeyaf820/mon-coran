/**
 * Quran font map.
 *
 * The app intentionally exposes only Quran.com/Quran Foundation style fonts:
 * QPC Hafs for simple Unicode reading, QCF V2 for page-style Mushaf rendering,
 * QCF V4 for Tajweed rendering, and QPC Warsh for the Warsh riwaya.
 */

export const QURAN_COM_FONT_IDS = [
  "qpc-hafs",
  "amiri-quran",
  "scheherazade-new",
  "noto-naskh-arabic",
  "qpc-indopak",
  "qpc-nastaleeq",
  "qcf-v1",
  "qcf-v2",
  "qcf-v4-tajweed",
  "qpc-warsh",
];

export const FONT_MAP = {
  "qpc-hafs":
    "'QPC Hafs','KFGQPC Uthmanic Script HAFS','UthmanicHafs','ME Quran',serif",
  "amiri-quran":
    "'Amiri Quran','Amiri','Scheherazade New','Noto Naskh Arabic',serif",
  "scheherazade-new":
    "'Scheherazade New','Amiri Quran','Noto Naskh Arabic',serif",
  "noto-naskh-arabic":
    "'Noto Naskh Arabic','Scheherazade New','Amiri Quran',serif",
  "qpc-indopak":
    "'QPC IndoPak','IndoPak','Noto Nastaliq Urdu','Scheherazade New',serif",
  "qpc-nastaleeq":
    "'QPC Nastaleeq','KFGQPC Nastaleeq','Noto Nastaliq Urdu','Scheherazade New',serif",
  "qcf-v1":
    "'QCF V1','QCF_V1','KFGQPC Uthmanic Script HAFS','QPC Hafs',serif",
  "qcf-v2":
    "'QCF V2','QCF_V2','KFGQPC Uthmanic Script HAFS','QPC Hafs',serif",
  "qcf-v4-tajweed":
    "'QCF V4 Tajweed','QCF_V4_Tajweed','QCF V2','KFGQPC Uthmanic Script HAFS',serif",
  "qpc-warsh":
    "'QPC Warsh','KFGQPC Uthmanic Script WARSH','QPC Hafs','ME Quran',serif",
};

export const DEFAULT_FONT_ID = "qpc-hafs";
export const DEFAULT_WARSH_FONT_ID = "qpc-warsh";

const LEGACY_FONT_ALIASES = {
  "mushaf-kfgqpc": "qpc-hafs",
  "mushaf-1441h": "qpc-hafs",
  "indopak": "qpc-indopak",
  "indopak-nastaleeq": "qpc-nastaleeq",
  "mushaf-tajweed": "qcf-v4-tajweed",
  "mushaf-warsh": "qpc-warsh",
  "digital-khatt-v1": "qcf-v1",
  "uthmanic-digital": "qcf-v2",
  "uthmanic-bold": "qcf-v2",
  "kfgqpc-uthman-taha-naskh": "qcf-v2",
  "uthman-taha": "qcf-v2",
  "me-quran": "qpc-hafs",
  "scheherazade": "scheherazade-new",
  "amiri": "amiri-quran",
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
  ...Object.keys(LEGACY_FONT_ALIASES),
];

export function normalizeFontId(id, riwaya = "hafs") {
  if (QURAN_COM_FONT_IDS.includes(id)) return id;
  if (LEGACY_FONT_ALIASES[id]) return LEGACY_FONT_ALIASES[id];
  return riwaya === "warsh" ? DEFAULT_WARSH_FONT_ID : DEFAULT_FONT_ID;
}

export function resolveFontFamily(id, riwaya = "hafs") {
  const normalizedId = normalizeFontId(id, riwaya);
  return FONT_MAP[normalizedId] || FONT_MAP[DEFAULT_FONT_ID];
}
