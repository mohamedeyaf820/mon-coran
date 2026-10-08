/**
 * The six hadith collections searched by scripts/build-hisn-data.mjs, with the
 * name shown to the reader and the sunnah.com address of a numbered hadith.
 * Numbering is the one of sunnah.com (Muslim: Abd al-Baqi, with a letter for
 * hadiths that share a number, "713a").
 */
export const HADITH_COLLECTIONS = {
  bukhari: { fr: "Sahih al-Bukhari", en: "Sahih al-Bukhari", ar: "صحيح البخاري" },
  muslim: { fr: "Sahih Muslim", en: "Sahih Muslim", ar: "صحيح مسلم" },
  abudawud: { fr: "Sunan Abi Dawud", en: "Sunan Abi Dawud", ar: "سنن أبي داود" },
  tirmidhi: { fr: "Jami‘ at-Tirmidhi", en: "Jami‘ at-Tirmidhi", ar: "جامع الترمذي" },
  nasai: { fr: "Sunan an-Nasa’i", en: "Sunan an-Nasa’i", ar: "سنن النسائي" },
  ibnmajah: { fr: "Sunan Ibn Majah", en: "Sunan Ibn Majah", ar: "سنن ابن ماجه" },
};

export function hadithCollectionName(collection, lang) {
  const entry = HADITH_COLLECTIONS[collection];
  if (!entry) return String(collection || "");
  return entry[lang] || entry.fr;
}

/** Public page of one hadith, or null for a collection or number that does not exist here. */
export function hadithUrl(collection, number) {
  if (!HADITH_COLLECTIONS[collection]) return null;
  const clean = String(number ?? "").trim();
  if (!/^\d+[a-z]?$/.test(clean)) return null;
  return `https://sunnah.com/${collection}:${clean}`;
}
