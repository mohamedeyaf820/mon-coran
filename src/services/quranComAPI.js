import { dbGet, dbSet } from "./dbService";

const BASE_URL = "https://api.quran.com/api/v4";
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT = 9000;
const IDB_STORE = "cache";
const IDB_PREFIX = "qcom-api:";

const memCache = new Map();
const inflight = new Map();
const WBW_AUDIO_BASE = "https://audio.qurancdn.com/";

const VERSE_FIELDS = [
  "id",
  "chapter_id",
  "verse_key",
  "verse_number",
  "page_number",
  "juz_number",
  "hizb_number",
  "rub_el_hizb_number",
  "ruku_number",
  "manzil_number",
  "text_uthmani",
  "text_uthmani_simple",
  "text_uthmani_tajweed",
  "text_indopak",
  "text_qpc_hafs",
  "text_qpc_nastaleeq_hafs",
  "code_v1",
  "code_v2",
  "v1_page",
  "v2_page",
].join(",");

const WORD_FIELDS = [
  "id",
  "verse_id",
  "chapter_id",
  "verse_key",
  "location",
  "position",
  "line_number",
  "line_v1",
  "line_v2",
  "page_number",
  "text_uthmani",
  "text_uthmani_tajweed",
  "text_indopak",
  "text_qpc_hafs",
  "text_imlaei",
  "code_v1",
  "code_v2",
  "v1_page",
  "v2_page",
  "audio_url",
  "char_type_name",
  "translation",
  "transliteration",
  "root",
  "grammar",
].join(",");

const TRANSLATION_RESOURCE_IDS = {
  en: 131,
  fr: 136,
};

function createTimedSignal(signal, timeoutMs = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timeoutId = globalThis.setTimeout(abort, timeoutMs);

  if (signal) {
    if (signal.aborted) abort();
    else signal.addEventListener("abort", abort, { once: true });
  }

  return {
    signal: controller.signal,
    cleanup() {
      globalThis.clearTimeout(timeoutId);
      signal?.removeEventListener?.("abort", abort);
    },
  };
}

async function fetchJson(url, signal) {
  const cacheKey = IDB_PREFIX + url;

  if (memCache.has(cacheKey)) return memCache.get(cacheKey);

  try {
    const cached = await dbGet(IDB_STORE, cacheKey);
    if (cached?.data && cached?.ts && Date.now() - cached.ts < CACHE_TTL) {
      memCache.set(cacheKey, cached.data);
      return cached.data;
    }
  } catch {
    // Network fetch below remains the source of truth.
  }

  if (inflight.has(cacheKey)) return inflight.get(cacheKey);

  const request = (async () => {
    const timed = createTimedSignal(signal);
    try {
      const response = await fetch(url, {
        signal: timed.signal,
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Quran.com API error ${response.status}: ${url}`);
      }

      const json = await response.json();
      if (!json || typeof json !== "object") {
        throw new Error("Malformed Quran.com API response");
      }

      memCache.set(cacheKey, json);
      dbSet(IDB_STORE, { key: cacheKey, data: json, ts: Date.now() }).catch(() => {});
      return json;
    } finally {
      timed.cleanup();
      inflight.delete(cacheKey);
    }
  })();

  inflight.set(cacheKey, request);
  return request;
}

function buildVerseParams(extra = {}) {
  const params = new URLSearchParams({
    fields: VERSE_FIELDS,
    word_fields: WORD_FIELDS,
    words: "true",
    mushaf: "1",
    per_page: "50",
    ...extra,
  });
  return params;
}

function buildUrl(path, extraParams) {
  const params = buildVerseParams(extraParams);
  return `${BASE_URL}${path}?${params.toString()}`;
}

function parseVerseKey(verseKey) {
  const [surah, ayah] = String(verseKey || "").split(":").map(Number);
  return { surah, ayah };
}

function normalizeWordAudioUrl(audioPath) {
  if (typeof audioPath !== "string" || audioPath.trim() === "") return null;
  if (/^https?:\/\//i.test(audioPath)) return audioPath;
  return `${WBW_AUDIO_BASE}${audioPath.replace(/^\/+/, "")}`;
}

function htmlToPlainText(value) {
  return String(value || "")
    .replace(/<sup[^>]*>.*?<\/sup>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function stripVerseEndGlyphs(value) {
  return String(value || "")
    .replace(/<span[^>]*(?:class|data-type)=["'][^"']*(?:end|ayah|verse)[^"']*["'][^>]*>.*?<\/span>/gi, "")
    .replace(/[\u06DD\u06DE\uFC00-\uFCFF\uFDF0-\uFDFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeWord(word = {}, verse = {}) {
  const { surah, ayah } = parseVerseKey(word.verse_key || verse.verse_key);
  const locationParts = String(word.location || "").split(":").map(Number);
  const position = Number(word.position || locationParts[2] || 0) || null;

  return {
    id: word.id,
    surah: Number(word.chapter_id || surah || verse.chapter_id) || null,
    ayah: ayah || Number(verse.verse_number) || null,
    position,
    location: word.location || null,
    lineNumber: Number(word.line_number || word.line_v2 || word.line_v1) || null,
    lineV1: Number(word.line_v1) || null,
    lineV2: Number(word.line_v2) || null,
    page: Number(word.page_number || verse.page_number) || null,
    text: word.text_qpc_hafs || word.text_uthmani || word.text_indopak || word.text,
    textUthmani: word.text_uthmani || "",
    textTajweed: word.text_uthmani_tajweed || "",
    textIndopak: word.text_indopak || "",
    textQpcHafs: word.text_qpc_hafs || "",
    textImlaei: word.text_imlaei || "",
    codeV1: word.code_v1 || "",
    codeV2: word.code_v2 || "",
    v1Page: Number(word.v1_page || verse.v1_page) || null,
    v2Page: Number(word.v2_page || verse.v2_page) || null,
    audioUrl: normalizeWordAudioUrl(word.audio_url),
    charType: word.char_type_name || "word",
    translation: word.translation?.text || word.translation || "",
    transliteration: word.transliteration?.text || word.transliteration || "",
    root: word.root?.text || word.root || null,
    grammar: word.grammar?.text || word.grammar || null,
  };
}

function normalizeVerse(verse = {}) {
  const { surah, ayah } = parseVerseKey(verse.verse_key);
  const chapterId = Number(verse.chapter_id || surah) || null;
  const verseNumber = Number(verse.verse_number || ayah) || null;
  const normalizedWords = Array.isArray(verse.words)
    ? verse.words.map((word) => normalizeWord(word, verse))
    : [];
  const wordText = normalizedWords
    .filter((word) => word.charType === "word")
    .map((word) => word.textQpcHafs || word.textUthmani || word.text)
    .filter(Boolean)
    .join(" ");
  const text =
    stripVerseEndGlyphs(verse.text_uthmani) ||
    wordText ||
    stripVerseEndGlyphs(verse.text_qpc_hafs) ||
    stripVerseEndGlyphs(verse.text_indopak) ||
    stripVerseEndGlyphs(verse.text_uthmani_simple) ||
    "";

  return {
    number: Number(verse.id) || null,
    numberInSurah: verseNumber,
    text,
    surah: { number: chapterId },
    juz: Number(verse.juz_number) || null,
    page: Number(verse.page_number) || null,
    hizb: Number(verse.hizb_number) || null,
    rubElHizb: Number(verse.rub_el_hizb_number) || null,
    ruku: Number(verse.ruku_number) || null,
    manzil: Number(verse.manzil_number) || null,
    requestedRiwaya: "hafs",
    usedEdition: "quran.com-v4",
    quranCom: {
      id: Number(verse.id) || null,
      verseKey: verse.verse_key || `${chapterId}:${verseNumber}`,
      textUthmani: stripVerseEndGlyphs(verse.text_uthmani) || "",
      textUthmaniSimple: verse.text_uthmani_simple || "",
      textTajweed: stripVerseEndGlyphs(verse.text_uthmani_tajweed) || "",
      textIndopak: verse.text_indopak || "",
      textQpcHafs: verse.text_qpc_hafs || "",
      textQpcNastaleeqHafs: verse.text_qpc_nastaleeq_hafs || "",
      codeV1: verse.code_v1 || "",
      codeV2: verse.code_v2 || "",
      v1Page: Number(verse.v1_page) || null,
      v2Page: Number(verse.v2_page) || null,
    },
    words: normalizedWords,
  };
}

function normalizeTranslationVerse(verse = {}, lang = "fr") {
  const { surah, ayah } = parseVerseKey(verse.verse_key);
  const translation = Array.isArray(verse.translations)
    ? verse.translations[0]
    : null;

  return {
    number: Number(verse.id) || null,
    numberInSurah: Number(verse.verse_number || ayah) || null,
    text: htmlToPlainText(translation?.text),
    surah: { number: Number(verse.chapter_id || surah) || null },
    edition: {
      identifier: `quran-com-${lang}`,
      name: translation?.resource_name || (lang === "fr" ? "Quran.com Français" : "Quran.com English"),
      language: lang,
    },
  };
}

function normalizeTranslationCollection(verses, lang = "fr") {
  return {
    ayahs: (Array.isArray(verses) ? verses : [])
      .map((verse) => normalizeTranslationVerse(verse, lang))
      .filter((verse) => verse.numberInSurah && verse.text),
    edition: {
      identifier: `quran-com-${lang}`,
      name: lang === "fr" ? "Quran.com Français" : "Quran.com English",
      language: lang,
    },
    source: "quran.com",
  };
}

function normalizeVerseCollection(verses, meta = {}) {
  return {
    number: Number(meta.number) || null,
    ayahs: (Array.isArray(verses) ? verses : [])
      .map(normalizeVerse)
      .sort((a, b) => {
        const aGlobal = Number(a.number) || 0;
        const bGlobal = Number(b.number) || 0;
        if (aGlobal && bGlobal && aGlobal !== bGlobal) return aGlobal - bGlobal;
        return (
          (Number(a.surah?.number) || 0) - (Number(b.surah?.number) || 0) ||
          (Number(a.numberInSurah) || 0) - (Number(b.numberInSurah) || 0)
        );
      }),
    edition: {
      identifier: "quran.com-v4",
      englishName: "Quran.com API V4",
      format: "text",
      type: "quran",
    },
    source: "quran.com",
    requestedRiwaya: "hafs",
    usedEdition: "quran.com-v4",
    isTextFallback: false,
  };
}

async function fetchPaginated(path, meta, signal) {
  const first = await fetchJson(buildUrl(path, { page: "1" }), signal);
  const verses = [...(first.verses || [])];
  const totalPages = Number(first.pagination?.total_pages || 1);

  if (totalPages > 1) {
    const remainingPages = Array.from({ length: totalPages - 1 }, (_, index) => index + 2);
    const chunks = await Promise.all(
      remainingPages.map((page) => fetchJson(buildUrl(path, { page: String(page) }), signal)),
    );
    chunks.forEach((chunk) => verses.push(...(chunk.verses || [])));
  }

  return normalizeVerseCollection(verses, meta);
}

export function canLoadFromQuranCom(pathPrefix, riwaya = "hafs") {
  if (riwaya !== "hafs") return false;
  return /^(surah|page|juz)\/\d+$/.test(pathPrefix) || /^ayah\/\d+:\d+$/.test(pathPrefix);
}

export async function fetchQuranComText(pathPrefix, signal) {
  let match = /^surah\/(\d+)$/.exec(pathPrefix);
  if (match) {
    const number = Number(match[1]);
    return fetchPaginated(`/verses/by_chapter/${number}`, { number }, signal);
  }

  match = /^page\/(\d+)$/.exec(pathPrefix);
  if (match) {
    const number = Number(match[1]);
    return fetchPaginated(`/verses/by_page/${number}`, { number }, signal);
  }

  match = /^juz\/(\d+)$/.exec(pathPrefix);
  if (match) {
    const number = Number(match[1]);
    return fetchPaginated(`/verses/by_juz/${number}`, { number }, signal);
  }

  match = /^ayah\/(\d+):(\d+)$/.exec(pathPrefix);
  if (match) {
    const verseKey = `${Number(match[1])}:${Number(match[2])}`;
    const json = await fetchJson(buildUrl(`/verses/by_key/${verseKey}`), signal);
    return normalizeVerse(json.verse || {});
  }

  throw new Error(`Unsupported Quran.com text path: ${pathPrefix}`);
}

async function fetchQuranComTranslationPath(path, resourceId, lang, meta, signal) {
  const params = new URLSearchParams({
    fields: "chapter_id,verse_key,verse_number",
    translations: String(resourceId),
    translation_fields: "resource_name,language_name,text",
    per_page: "50",
    page: "1",
  });
  const first = await fetchJson(`${BASE_URL}${path}?${params.toString()}`, signal);
  const verses = [...(first.verses || [])];
  const totalPages = Number(first.pagination?.total_pages || 1);

  if (totalPages > 1) {
    const chunks = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) => {
        const pageParams = new URLSearchParams(params);
        pageParams.set("page", String(index + 2));
        return fetchJson(`${BASE_URL}${path}?${pageParams.toString()}`, signal);
      }),
    );
    chunks.forEach((chunk) => verses.push(...(chunk.verses || [])));
  }

  return { ...normalizeTranslationCollection(verses, lang), number: meta?.number || null };
}

export async function fetchQuranComTranslations(pathPrefix, langs = ["fr"], signal) {
  const langArray = (Array.isArray(langs) ? langs : [langs])
    .map((lang) => (TRANSLATION_RESOURCE_IDS[lang] ? lang : "fr"));

  let path = null;
  let meta = {};
  let match = /^surah\/(\d+)$/.exec(pathPrefix);
  if (match) {
    meta.number = Number(match[1]);
    path = `/verses/by_chapter/${meta.number}`;
  }

  match = /^page\/(\d+)$/.exec(pathPrefix);
  if (!path && match) {
    meta.number = Number(match[1]);
    path = `/verses/by_page/${meta.number}`;
  }

  match = /^juz\/(\d+)$/.exec(pathPrefix);
  if (!path && match) {
    meta.number = Number(match[1]);
    path = `/verses/by_juz/${meta.number}`;
  }

  if (!path) throw new Error(`Unsupported Quran.com translation path: ${pathPrefix}`);

  return Promise.all(
    langArray.map((lang) =>
      fetchQuranComTranslationPath(path, TRANSLATION_RESOURCE_IDS[lang], lang, meta, signal),
    ),
  );
}

export function getQuranComPageFontFamily(page, version = "v2") {
  const normalizedVersion = version === "v1" ? "v1" : version === "v4" ? "v4" : "v2";
  return `qcf-${normalizedVersion}-p${Number(page) || 1}`;
}
