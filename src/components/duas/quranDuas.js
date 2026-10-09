import QURAN_DUAS from "../../data/duas";
import SURAHS from "../../data/surahs";
import { foldSearchText } from "../../utils/searchIntelligence";

/** Only the supplications that quote a verse: each one opens in the reader. */
export const QURAN_SUPPLICATIONS = QURAN_DUAS.filter((dua) => dua.surah && dua.ayah);

const ALL_CATEGORIES = [
  { id: "ibadah", fr: "Adoration", en: "Worship", ar: "العبادة" },
  { id: "tawhid", fr: "Tawhid", en: "Tawhid", ar: "التوحيد" },
  { id: "hidayah", fr: "Guidance", en: "Guidance", ar: "الهداية" },
  { id: "forgiveness", fr: "Pardon", en: "Forgiveness", ar: "المغفرة" },
  { id: "steadfastness", fr: "Fermeté", en: "Steadfastness", ar: "الثبات" },
  { id: "family", fr: "Famille", en: "Family", ar: "الأسرة" },
  { id: "dunya-akhirah", fr: "Ici-bas et au-delà", en: "Dunya & Akhirah", ar: "الدنيا والآخرة" },
  { id: "ummah", fr: "Oumma", en: "Ummah", ar: "الأمة" },
  { id: "rizq", fr: "Rizq", en: "Provision", ar: "الرزق" },
  { id: "shifa", fr: "Guérison", en: "Healing", ar: "الشفاء" },
  { id: "safar", fr: "Voyage", en: "Travel", ar: "السفر" },
  { id: "protection", fr: "Protection", en: "Protection", ar: "التحصين" },
  { id: "daily", fr: "Quotidien", en: "Daily life", ar: "الحياة اليومية" },
];

export const ALL_FILTER = { id: "all", fr: "Toutes", en: "All", ar: "الكل" };

/** Filter chips: only the categories that still hold a Quranic supplication. */
export const QURAN_CATEGORIES = [
  ALL_FILTER,
  ...ALL_CATEGORIES.filter((category) => QURAN_SUPPLICATIONS.some((dua) => dua.category === category.id)),
];

export const QURAN_CATEGORY_MAP = Object.fromEntries(
  QURAN_CATEGORIES.map((category) => [category.id, category]),
);

export const categoryLabel = (category, lang) =>
  lang === "ar" ? category.ar : lang === "fr" ? category.fr : category.en;

// The dataset is static, so fold each record once at import time instead of
// rebuilding normalized strings on every keystroke.
const SEARCH_ROWS = QURAN_SUPPLICATIONS.map((dua) => {
  const category = QURAN_CATEGORY_MAP[dua.category];
  const surah = SURAHS[dua.surah - 1];
  return {
    dua,
    haystack: foldSearchText(
      [
        dua.arabic,
        dua.transliteration,
        dua.fr,
        dua.en,
        dua.title?.fr,
        dua.title?.en,
        dua.title?.ar,
        surah && `${surah.fr} ${surah.en} ${surah.ar}`,
        category && `${category.fr} ${category.en} ${category.ar}`,
      ]
        .filter(Boolean)
        .join(" "),
    ),
  };
});

export function searchQuranSupplications(query, categoryId = "all") {
  const terms = foldSearchText(query).split(" ").filter(Boolean);
  return SEARCH_ROWS.filter(({ dua, haystack }) => {
    if (categoryId !== "all" && dua.category !== categoryId) return false;
    return terms.every((term) => haystack.includes(term));
  }).map(({ dua }) => dua);
}
