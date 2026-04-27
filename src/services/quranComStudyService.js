import { dbGet, dbSet } from "./dbService";

const BASE_URL = "https://api.quran.com/api/v4";
const TAFSIR_RESOURCE_ID = 169;
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
const IDB_STORE = "cache";
const IDB_PREFIX = "qcom-study:";

const memCache = new Map();
const inflight = new Map();

function normalizeVerseKey(surah, ayah) {
  return `${Number(surah)}:${Number(ayah)}`;
}

function decodeHtmlEntities(value) {
  if (!value) return "";
  if (typeof document !== "undefined") {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = value;
    return textarea.value;
  }

  return String(value)
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function htmlToText(html) {
  if (!html) return "";

  if (typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(String(html), "text/html");
    doc.querySelectorAll("script,style,noscript,iframe").forEach((node) => node.remove());
    return decodeHtmlEntities(doc.body?.textContent || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  return decodeHtmlEntities(String(html).replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function createTimedSignal(signal, timeoutMs = 9000) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timeoutId = globalThis.setTimeout(abort, timeoutMs);

  if (signal) {
    if (signal.aborted) {
      abort();
    } else {
      signal.addEventListener("abort", abort, { once: true });
    }
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
  const timed = createTimedSignal(signal);
  try {
    const response = await fetch(url, {
      signal: timed.signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Quran.com API error ${response.status}`);
    }

    return response.json();
  } finally {
    timed.cleanup();
  }
}

function extractTafsir(json) {
  const tafsir =
    json?.verse?.tafsirs?.[0] ||
    json?.tafsirs?.[0] ||
    json?.tafsir ||
    null;

  const rawText = tafsir?.text || tafsir?.body || "";
  const text = htmlToText(rawText);

  return {
    source:
      tafsir?.resource_name ||
      tafsir?.name ||
      tafsir?.translated_name?.name ||
      "Tafsir Ibn Kathir",
    language: tafsir?.language_name || "english",
    text,
  };
}

export async function getVerseTafsir({ surah, ayah, signal } = {}) {
  const verseKey = normalizeVerseKey(surah, ayah);
  const cacheKey = `${IDB_PREFIX}tafsir:${verseKey}:${TAFSIR_RESOURCE_ID}`;

  if (memCache.has(cacheKey)) {
    return memCache.get(cacheKey);
  }

  try {
    const cached = await dbGet(IDB_STORE, cacheKey);
    if (cached?.data && cached?.ts && Date.now() - cached.ts < CACHE_TTL) {
      memCache.set(cacheKey, cached.data);
      return cached.data;
    }
  } catch (error) {
    console.warn("Quran.com study cache read failed:", error);
  }

  if (inflight.has(cacheKey)) {
    return inflight.get(cacheKey);
  }

  const request = (async () => {
    try {
      const params = new URLSearchParams({
        tafsirs: String(TAFSIR_RESOURCE_ID),
        fields: "verse_key",
        tafsir_fields: "text,resource_name,language_name",
      });
      const json = await fetchJson(
        `${BASE_URL}/verses/by_key/${verseKey}?${params.toString()}`,
        signal,
      );
      const result = extractTafsir(json);

      if (!result.text) {
        throw new Error("No tafsir found for this verse");
      }

      memCache.set(cacheKey, result);
      try {
        await dbSet(IDB_STORE, { key: cacheKey, data: result, ts: Date.now() });
      } catch (error) {
        console.warn("Quran.com study cache write failed:", error);
      }

      return result;
    } finally {
      inflight.delete(cacheKey);
    }
  })();

  inflight.set(cacheKey, request);
  return request;
}

export function getQuranComVerseUrl(surah, ayah) {
  return `https://quran.com/${Number(surah)}/${Number(ayah)}`;
}
