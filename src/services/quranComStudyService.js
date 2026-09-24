/**
 * Quran.com Study API Service
 * Fetches tafsir and translations from Quran.com API.
 */

const BASE_URL = "https://api.quran.com/api/v4";
const TAFSIR_CACHE_PREFIX = "mushafplus:tafsir:v2:";

export const TAFSIR_RESOURCES = {
  "ar-muyassar": {
    id: 16,
    name: "Tafsir Al-Muyassar",
    nameFr: "Tafsir Al-Muyassar",
    lang: "ar",
  },
  "ar-wasit": {
    id: 93,
    name: "Tafsir Al-Wasit (Tantawi)",
    nameFr: "Tafsir Al-Wasit (Tantawi)",
    lang: "ar",
  },
  "en-kathir": {
    id: 169,
    name: "Tafsir Ibn Kathir",
    nameFr: "Tafsir Ibn Kathir (anglais)",
    lang: "en",
  },
  "en-maarif": {
    id: 168,
    name: "Ma'arif al-Qur'an",
    nameFr: "Ma'arif al-Qur'an (anglais)",
    lang: "en",
  },
  "en-tazkir": {
    id: 817,
    name: "Tazkirul Quran",
    nameFr: "Tazkirul Quran (anglais)",
    lang: "en",
  },
  "ar-kathir": {
    id: 14,
    name: "Tafsir Ibn Kathir",
    nameFr: "Tafsir Ibn Kathir",
    lang: "ar",
  },
  "ar-tabari": {
    id: 15,
    name: "Tafsir Al-Tabari",
    nameFr: "Tafsir Al-Tabari",
    lang: "ar",
    qiraat: true,
  },
  "ar-qurtubi": {
    id: 90,
    name: "Tafsir Al-Qurtubi",
    nameFr: "Tafsir Al-Qurtubi",
    lang: "ar",
    qiraat: true,
  },
  "ar-baghawi": {
    id: 94,
    name: "Tafsir Al-Baghawi",
    nameFr: "Tafsir Al-Baghawi",
    lang: "ar",
    qiraat: true,
  },
  "ar-saadi": {
    id: 91,
    name: "Tafsir Al-Saadi",
    nameFr: "Tafsir Al-Saadi",
    lang: "ar",
  },
  // There is no French tafsir to declare here. Quran.com's resource index has
  // no French entry at all (20 tafsirs: 7 Arabic, 3 English, Bengali, Urdu,
  // Russian, Kurdish), and the id 816 this app used to advertise as
  // "Al-Mukhtasar (French)" answers HTTP 503 on every verse and is absent from
  // /resources/tafsirs. A French reader therefore gets the source's own
  // language plus the French translation of the verse, and the note below says
  // so instead of a dead request pretending otherwise.
};

function normalizeText(text) {
  return String(text || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function htmlToText(html) {
  if (!html) return "";
  if (typeof document !== "undefined") {
    const doc = new DOMParser().parseFromString(String(html), "text/html");
    return normalizeText(doc.body?.textContent || "");
  }
  return normalizeText(String(html).replace(/<[^>]+>/g, " "));
}

function readCachedTafsir(resourceId, verseKey) {
  if (typeof localStorage === "undefined") return "";
  try {
    const raw = localStorage.getItem(
      `${TAFSIR_CACHE_PREFIX}${resourceId}:${verseKey}`,
    );
    const cached = raw ? JSON.parse(raw) : null;
    return typeof cached?.text === "string" ? cached.text : "";
  } catch {
    return "";
  }
}

/**
 * The tafsir cache is bounded: one entry per verse per author is a few
 * kilobytes, and an unbounded pile of them competes with the storage the
 * user's own notes, bookmarks and reading position live in. The index keeps
 * the cached keys most-recent-first so the oldest go when it is full, without
 * reading the texts back.
 */
const TAFSIR_CACHE_INDEX = `${TAFSIR_CACHE_PREFIX}index`;
const TAFSIR_CACHE_MAX = 240;

function listTafsirCacheKeys() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && key !== TAFSIR_CACHE_INDEX && key.startsWith(TAFSIR_CACHE_PREFIX)) {
      keys.push(key);
    }
  }
  return keys;
}

function readTafsirCacheIndex() {
  let raw;
  try {
    raw = localStorage.getItem(TAFSIR_CACHE_INDEX);
  } catch {
    return [];
  }
  // An absent index is not an empty one: it means verses were cached before
  // the cache was bounded, and they still have to be counted.
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((key) => typeof key === "string")
      : null;
  } catch {
    return null;
  }
}

function removeTafsirCacheKeys(keys) {
  keys.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // A browser that refuses the removal still has the entry counted out.
    }
  });
}

function writeTafsirCacheIndex(index) {
  try {
    localStorage.setItem(TAFSIR_CACHE_INDEX, JSON.stringify(index));
  } catch {
    // The index is a convenience; losing it only means rebuilding it next time.
  }
}

function trackTafsirCacheKey(key) {
  let index = readTafsirCacheIndex();
  if (index === null) {
    const existing = listTafsirCacheKeys();
    // An unbounded cache left by an earlier version is not worth reading
    // through: it is only a copy of what the API already has.
    if (existing.length > TAFSIR_CACHE_MAX) {
      removeTafsirCacheKeys(existing);
      index = [];
    } else {
      index = existing;
    }
  }
  index = [key, ...index.filter((entry) => entry !== key)];
  removeTafsirCacheKeys(index.slice(TAFSIR_CACHE_MAX));
  writeTafsirCacheIndex(index.slice(0, TAFSIR_CACHE_MAX));
}

function trimTafsirCache(keep) {
  const index = readTafsirCacheIndex() ?? listTafsirCacheKeys();
  removeTafsirCacheKeys(index.slice(keep));
  writeTafsirCacheIndex(index.slice(0, keep));
}

function cacheTafsir(resourceId, verseKey, text) {
  if (typeof localStorage === "undefined" || !text) return;
  const key = `${TAFSIR_CACHE_PREFIX}${resourceId}:${verseKey}`;
  const savedAt = Date.now();
  const write = () =>
    localStorage.setItem(key, JSON.stringify({ text, savedAt }));
  try {
    write();
  } catch {
    // A full cache must not cost the rest of the app its storage: drop the
    // oldest half of it and retry once.
    trimTafsirCache(TAFSIR_CACHE_MAX / 2);
    try {
      write();
    } catch {
      // Storage can be disabled entirely in private browsing; live loading
      // still works.
    }
    return;
  }
  trackTafsirCacheKey(key);
}

export function getAvailableTafsirs() {
  return Object.entries(TAFSIR_RESOURCES).map(([key, data]) => ({
    ...data,
    key,
  }));
}

const FALLBACK_TAFSIRS_BY_LANG = {
  ar: ["ar-muyassar", "ar-kathir", "en-kathir"],
  en: ["en-kathir", "en-maarif", "en-tazkir", "ar-muyassar"],
  fr: ["en-kathir", "en-maarif", "ar-muyassar"],
  wo: ["en-kathir", "en-maarif", "en-tazkir", "ar-muyassar"],
};

function resolveTafsirKey(value, lang = "en") {
  if (value && TAFSIR_RESOURCES[value]) return value;
  const numericId = Number(value);
  if (Number.isFinite(numericId)) {
    const found = Object.entries(TAFSIR_RESOURCES).find(
      ([, resource]) => Number(resource.id) === numericId,
    );
    if (found) return found[0];
  }
  return lang === "ar" ? "ar-muyassar" : "en-kathir";
}

async function fetchTafsirText(resource, verseKey, signal) {
  const encodedVerseKey = encodeURIComponent(verseKey);
  const response = await fetch(
    `${BASE_URL}/tafsirs/${resource.id}/by_ayah/${encodedVerseKey}`,
    { signal, headers: { Accept: "application/json" } },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch tafsir: ${response.status}`);
  }

  const json = await response.json();
  const tafsir = json?.tafsir || null;
  const text = htmlToText(tafsir?.text || tafsir?.body || "");

  if (!text) {
    throw new Error("No tafsir text found");
  }

  cacheTafsir(resource.id, verseKey, text);
  return text;
}

export async function getVerseTafsir({
  surah,
  ayah,
  lang = "en",
  tafsirId,
  signal,
} = {}) {
  const verseKey = `${Number(surah)}:${Number(ayah)}`;
  const normalizedLang = ["ar", "fr", "wo"].includes(lang) ? lang : "en";
  const requestedKey = resolveTafsirKey(
    tafsirId === "fr-kathir" ? "en-kathir" : tafsirId,
    normalizedLang,
  );
  const candidates = [
    requestedKey,
    ...(FALLBACK_TAFSIRS_BY_LANG[normalizedLang] || FALLBACK_TAFSIRS_BY_LANG.en),
  ].filter((key, index, list) => key && list.indexOf(key) === index);

  let lastError = null;
  let cachedFallback = null;
  for (const key of candidates) {
    const resource = TAFSIR_RESOURCES[key];
    if (!resource) continue;
    const cachedText = readCachedTafsir(resource.id, verseKey);
    if (cachedText && !cachedFallback) {
      cachedFallback = { key, resource, text: cachedText };
    }
    try {
      const text = await fetchTafsirText(resource, verseKey, signal);
      const langMismatch = resource.lang !== normalizedLang;
      return {
        source: resource.name,
        sourceFr: resource.nameFr,
        language: resource.lang,
        text,
        tafsirId: key,
        note:
          normalizedLang === "fr" && langMismatch
            ? "Aucun tafsir français vérifié n'est disponible dans Quran.com pour cette source. Le commentaire est affiché dans sa langue d'origine."
            : normalizedLang === "wo" && langMismatch
              ? "Aucun tafsir wolof vérifié n'est disponible dans Quran.com pour cette source. Le commentaire est affiché dans sa langue d'origine."
              : null,
      };
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      lastError = error;
    }
  }

  if (cachedFallback) {
    return {
      source: cachedFallback.resource.name,
      sourceFr: cachedFallback.resource.nameFr,
      language: cachedFallback.resource.lang,
      text: cachedFallback.text,
      tafsirId: cachedFallback.key,
      cached: true,
      note:
        normalizedLang === "fr" && cachedFallback.resource.lang !== "fr"
          ? "Le commentaire conserv\u00e9 hors connexion est affich\u00e9 dans sa langue d'origine."
          : null,
    };
  }

  throw lastError || new Error("No tafsir text found");
}

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

export async function getVerseTranslation({
  surah,
  ayah,
  lang = "fr",
  signal,
} = {}) {
  const verseKey = `${Number(surah)}:${Number(ayah)}`;
  const resourceId = TRANSLATION_RESOURCES[lang] || TRANSLATION_RESOURCES.fr;

  const params = new URLSearchParams({
    translations: String(resourceId),
    fields: "verse_key",
    translation_fields: "text,resource_name,language_name",
  });

  const response = await fetch(
    `${BASE_URL}/verses/by_key/${verseKey}?${params.toString()}`,
    { signal },
  );

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
