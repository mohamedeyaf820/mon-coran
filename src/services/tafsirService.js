/**
 * Legacy Tafsir service.
 * Kept for older components, backed by the same verified Quran.com resource
 * list used by quranComStudyService.
 */

import {
  TAFSIR_RESOURCES,
  getVerseTafsir,
} from "./quranComStudyService";

export const TAFSIR_SOURCES = Object.entries(TAFSIR_RESOURCES).reduce(
  (acc, [key, value]) => {
    acc[key] = {
      key,
      id: value.id,
      name: value.name,
      nameFr: value.nameFr,
      lang: value.lang,
    };
    return acc;
  },
  {},
);

const DEFAULT_TAFSIR_KEY = {
  // Quran.com publishes no French tafsir, so a French reader opens the English
  // Ibn Kathir (with the French translation of the verse alongside) rather than
  // a French source that does not exist.
  fr: "en-kathir",
  en: "en-kathir",
  ar: "ar-muyassar",
  wo: "en-kathir",
};

function getDocumentLang() {
  if (typeof document === "undefined") return "fr";
  return document.documentElement.lang || "fr";
}

function getSourceByIdOrKey(value, lang = "fr") {
  if (value && TAFSIR_SOURCES[value]) return TAFSIR_SOURCES[value];
  const numericId = Number(value);
  if (Number.isFinite(numericId)) {
    const found = Object.values(TAFSIR_SOURCES).find(
      (source) => Number(source.id) === numericId,
    );
    if (found) return found;
  }
  return TAFSIR_SOURCES[DEFAULT_TAFSIR_KEY[lang] || DEFAULT_TAFSIR_KEY.en];
}

export async function fetchTafsir(surah, ayah, tafsirId = null) {
  if (!surah || !ayah) {
    throw new Error("Surah and ayah are required");
  }

  const lang = getDocumentLang();
  const source = getSourceByIdOrKey(tafsirId, lang);
  const result = await getVerseTafsir({
    surah,
    ayah,
    lang,
    tafsirId: source.key,
  });

  return {
    text: result.text,
    tafsirId: source.id,
    source: lang === "fr" ? source.nameFr || source.name : source.name,
    language: result.language,
    note: result.note,
    surah,
    ayah,
  };
}

/**
 * Runs an async mapper over a range with a bounded concurrency, so a whole
 * surah's worth of tafsir requests cannot fan out into hundreds of parallel
 * network calls and exhaust connections or the upstream API.
 */
async function mapWithConcurrency(count, concurrency, mapper) {
  const results = new Array(count);
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, count) },
    async () => {
      while (cursor < count) {
        const index = cursor;
        cursor += 1;
        results[index] = await mapper(index);
      }
    },
  );
  await Promise.all(workers);
  return results;
}

export async function fetchTafsirRange(surah, fromAyah, toAyah, tafsirId = null) {
  const ayahs = [];
  for (let ayah = fromAyah; ayah <= toAyah; ayah += 1) ayahs.push(ayah);
  return mapWithConcurrency(ayahs.length, 4, async (index) => {
    const ayah = ayahs[index];
    try {
      return await fetchTafsir(surah, ayah, tafsirId);
    } catch (error) {
      return { text: null, error: error.message, ayah };
    }
  });
}

export function getAvailableTafsirs(lang = "fr") {
  const allowedLangs = lang === "fr"
    ? ["fr", "en", "ar"]
    : lang === "ar"
      ? ["ar"]
      : ["en", "ar"];
  return Object.values(TAFSIR_SOURCES)
    .filter((source) => allowedLangs.includes(source.lang))
    .map((source) => ({
      id: source.id,
      key: source.key,
      name: lang === "fr" ? source.nameFr || source.name : source.name,
      lang: source.lang,
    }));
}

export function getTafsirName(tafsirId, lang = "fr") {
  const source = getSourceByIdOrKey(tafsirId, lang);
  return lang === "fr" ? source.nameFr || source.name : source.name;
}

export default {
  fetchTafsir,
  fetchTafsirRange,
  getAvailableTafsirs,
  getTafsirName,
  TAFSIR_SOURCES,
};
