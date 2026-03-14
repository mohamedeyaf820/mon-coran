export const THEME_ORDER = ["light", "sepia", "dark", "quran-night"];
export const DAY_THEME_IDS = ["light", "sepia"];
export const NIGHT_THEME_IDS = ["dark", "quran-night"];

export const LEGACY_THEME_MAP = {
  "premium-beige": "sepia",
  ocean: "quran-night",
  "night-blue": "quran-night",
  forest: "dark",
  oled: "dark",
};

export const THEMES = [
  {
    id: "light",
    fr: "Lueur du Fajr",
    ar: "نور الفجر",
    en: "Fajr Glow",
    descriptionFr: "Ivoire lumineux, bleu mineral et calme du matin.",
    descriptionAr: "عاج مضيء ولمسة زرقاء هادئة توحي بفجر جديد.",
    descriptionEn: "Luminous ivory, mineral blue and a calm dawn mood.",
    period: "day",
    palette: {
      bg: "#f7f4ea",
      ink: "#1f2c3a",
      accent: "#199b90",
    },
  },
  {
    id: "sepia",
    fr: "Parchemin du Mushaf",
    ar: "رق المصحف",
    en: "Mushaf Parchment",
    descriptionFr: "Beige manuscrit, ombres chaudes et or discret.",
    descriptionAr: "دفء المخطوط وظلال ذهبية هادئة.",
    descriptionEn: "Manuscript beige, warm shadows and restrained gold.",
    period: "day",
    palette: {
      bg: "#efe2c9",
      ink: "#4b3420",
      accent: "#b4883c",
    },
  },
  {
    id: "dark",
    fr: "Nuit de Medine",
    ar: "ليل المدينة",
    en: "Madinah Night",
    descriptionFr: "Indigo profond, contraste net et accents celestes.",
    descriptionAr: "نيلي عميق وتباين واضح مع لمعة سماوية.",
    descriptionEn: "Deep indigo, crisp contrast and celestial accents.",
    period: "night",
    palette: {
      bg: "#111827",
      ink: "#e6eaf0",
      accent: "#2bb6c7",
    },
  },
  {
    id: "quran-night",
    fr: "Jardin de la Recitation",
    ar: "روضة التلاوة",
    en: "Recitation Garden",
    descriptionFr: "Vert emeraude, penombre douce et ambiance contemplative.",
    descriptionAr: "أخضر زمردي وهدوء ليلي مناسب للتلاوة.",
    descriptionEn: "Emerald tones, soft darkness and a contemplative mood.",
    period: "night",
    palette: {
      bg: "#0c1622",
      ink: "#e8edf7",
      accent: "#3ca675",
    },
  },
];

const THEME_IDS = new Set(THEME_ORDER);

export function getThemeMeta(themeId) {
  return THEMES.find((theme) => theme.id === themeId) || THEMES[0];
}

export function normalizeThemeId(value, fallback = "light") {
  if (typeof value !== "string") return fallback;
  if (THEME_IDS.has(value)) return value;
  return LEGACY_THEME_MAP[value] || fallback;
}

export function normalizeDayTheme(value) {
  const normalized = normalizeThemeId(value, "light");
  return DAY_THEME_IDS.includes(normalized) ? normalized : "light";
}

export function normalizeNightTheme(value) {
  const normalized = normalizeThemeId(value, "dark");
  return NIGHT_THEME_IDS.includes(normalized) ? normalized : "dark";
}
