export const messages = {
  fr: { read: "Lire", listen: "Ecouter", library: "Bibliotheque", study: "Etudier", tools: "Outils", subtitle: "Lecture et recitation", search: "Rechercher", settings: "Ouvrir les reglages" },
  en: { read: "Read", listen: "Listen", library: "Library", study: "Study", tools: "Tools", subtitle: "Reading and recitation", search: "Search", settings: "Open settings" },
  ar: { read: "اقرأ", listen: "استمع", library: "المكتبة", study: "ادرس", tools: "الأدوات", subtitle: "قراءة وتلاوة", search: "بحث", settings: "فتح الإعدادات" },
};
export const translate = (lang, key) => messages[lang]?.[key] || messages.fr[key] || key;
