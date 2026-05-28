/**
 * Quran.com Study API Service
 * Fetches tafsir and translations from Quran.com API
 */

const BASE_URL = 'https://api.quran.com/api/v4';

// Tafsir resource mappings
const TAFSIR_RESOURCES = {
  "ar-muyassar": { id: 16, name: "Tafsir Al-Muyassar", nameFr: "Tafsir Al-Muyassar", lang: "ar" },
  "ar-wasit": { id: 93, name: "Tafsir Al-Wasit (Tantawi)", nameFr: "Tafsir Al-Wasit (Tantawi)", lang: "ar" },
  "en-kathir": { id: 169, name: "Tafsir Ibn Kathir (English)", nameFr: "Tafsir Ibn Kathir (Anglais)", lang: "en" },
  "fr-kathir": { id: 169, name: "Tafsir Ibn Kathir (English)", nameFr: "Tafsir Ibn Kathir (Trad. Anglais)", lang: "fr" },
  "ar-kathir": { id: 14, name: "Tafsir Ibn Kathir", nameFr: "Tafsir Ibn Kathir", lang: "ar" },
  "ar-tabari": { id: 15, name: "Tafsir Al-Tabari", nameFr: "Tafsir Al-Tabari", lang: "ar" },
  "ar-qurtubi": { id: 90, name: "Tafsir Al-Qurtubi", nameFr: "Tafsir Al-Qurtubi", lang: "ar" },
  "ar-baghawi": { id: 94, name: "Tafsir Al-Baghawi", nameFr: "Tafsir Al-Baghawi", lang: "ar" },
  "ar-saadi": { id: 91, name: "Tafsir Al-Saadi", nameFr: "Tafsir Al-Saadi", lang: "ar" },
};

function htmlToText(html) {
  if (!html) return "";
  if (typeof document !== "undefined") {
    const doc = new DOMParser().parseFromString(String(html), "text/html");
    return doc.body?.textContent || "";
  }
  return String(html).replace(/<[^>]+>/g, " ").trim();
}

export function getAvailableTafsirs() {
  return Object.entries(TAFSIR_RESOURCES).map(([id, data]) => ({
    id,
    ...data,
  }));
}

export async function getVerseTafsir({ surah, ayah, lang = "en", tafsirId, signal } = {}) {
  const verseKey = `${Number(surah)}:${Number(ayah)}`;
  const requestedTafsir = tafsirId || (lang === "ar" ? "ar-muyassar" : lang === "fr" ? "fr-kathir" : "en-kathir");
  const resource = TAFSIR_RESOURCES[requestedTafsir] || TAFSIR_RESOURCES["ar-muyassar"];
  
  const response = await fetch(`${BASE_URL}/tafsirs/${resource.id}/by_ayah/${verseKey}`, { signal });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch tafsir: ${response.status}`);
  }
  
  const json = await response.json();
  const tafsir = json?.tafsir || null;
  const text = htmlToText(tafsir?.text || tafsir?.body || "");
  
  if (!text) {
    throw new Error("No tafsir text found");
  }
  
  return {
    source: resource.name,
    sourceFr: resource.nameFr,
    language: resource.lang,
    text,
    tafsirId: requestedTafsir,
    note: lang === "fr" 
      ? "Le tafsir est basé sur le sens du verset, commun aux deux riwayat."
      : null,
  };
}

// Translation resources
const TRANSLATION_RESOURCES = {
  fr: 136,
  en: 131,
  es: 141,
  de: 46,
  tr: 77,
  ru: 120,
  id: 127,
  ur: 135,
  zh: 206,
  it: 153,
  pt: 44,
  nl: 209,
};

export function getQuranComVerseUrl(surah, ayah) {
  return `https://quran.com/${Number(surah)}/${Number(ayah)}`;
}

export async function getVerseTranslation({ surah, ayah, lang = "fr", signal } = {}) {
  const verseKey = `${Number(surah)}:${Number(ayah)}`;
  const resourceId = TRANSLATION_RESOURCES[lang] || TRANSLATION_RESOURCES.fr;
  
  const params = new URLSearchParams({
    translations: String(resourceId),
    fields: "verse_key",
    translation_fields: "text,resource_name,language_name",
  });
  
  const response = await fetch(`${BASE_URL}/verses/by_key/${verseKey}?${params.toString()}`, { signal });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch translation: ${response.status}`);
  }
  
  const json = await response.json();
  const translation = json?.verse?.translations?.[0] || null;
  const text = htmlToText(translation?.text || "");
  
  if (!text) {
    throw new Error("No translation text found");
  }
  
  return {
    text,
    language: lang,
    resourceName: translation?.resource_name || "Translation",
  };
}
