export const THEME_ORDER = ["light", "sepia", "dark"];
export const DAY_THEME_IDS = ["light", "sepia"];
export const NIGHT_THEME_IDS = ["dark"];

export const LEGACY_THEME_MAP = {
  "premium-beige": "sepia",
  ocean: "dark",
  "night-blue": "dark",
  "quran-night": "dark",
  forest: "dark",
  oled: "dark",
};

export const THEMES = [
  {
    id: "light",
    fr: "Lueur du Fajr",
    ar: "نور الفجر",
    en: "Fajr Glow",
    descriptionFr: "Blanc doux, contraste net et turquoise discret.",
    descriptionAr: "إضاءة بيضاء هادئة مع تباين واضح ولمسة تركواز خفيفة.",
    descriptionEn: "Soft white clarity with crisp contrast and subtle turquoise.",
    period: "day",
    palette: {
      bg: "#fcfdfd",
      ink: "#1f2832",
      accent: "#2f9ea7",
    },
  },
  {
    id: "sepia",
    fr: "Parchemin du Mushaf",
    ar: "رق المصحف",
    en: "Mushaf Parchment",
    descriptionFr: "Parchemin plus chaud, texture manuscrit et brun confortable.",
    descriptionAr: "رق أكثر دفئاً بإحساس مخطوط وتباين بني مريح للعين.",
    descriptionEn: "Warmer parchment feel with manuscript depth and readable brown contrast.",
    period: "day",
    palette: {
      bg: "#f4ead7",
      ink: "#483723",
      accent: "#8b6b3e",
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
