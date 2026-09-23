import { dbGet, dbSet } from "./dbService";

const BASE_URL = "https://api.quran.com/api/v4";
const AUDIO_BASE_URL = "https://verses.quran.com/";
const CACHE_TTL = 14 * 24 * 60 * 60 * 1000;
const IDB_STORE = "cache";
const IDB_PREFIX = "qcom-audio-timing:";

const RECITER_TO_QURAN_COM_RECITATION = {
  "ar.alafasy": 7,
  "ar.abdulbasitmurattal": 2,
  "ar.abdulbasitmujawwad": 1,
  "ar.husary": 6,
  "ar.minshawi": 9,
  "ar.minshawimujawwad": 8,
  "ar.saoodshuraym": 10,
  "ar.abdurrahmaansudais": 3,
  hani_rifai: 5,
  muhammad_tablawi: 11,
};

const memCache = new Map();
const inflight = new Map();

function normalizeAudioUrl(url) {
  if (typeof url !== "string" || !url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${AUDIO_BASE_URL}${url.replace(/^\/+/, "")}`;
}

function normalizeSegment(segment) {
  if (!Array.isArray(segment)) return null;
  const wordPosition = Number(segment.length >= 4 ? segment[1] : segment[0]);
  const startMs = Number(segment.length >= 4 ? segment[2] : segment[1]);
  const endMs = Number(segment.length >= 4 ? segment[3] : segment[2]);

  if (!Number.isFinite(wordPosition) || !Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    return null;
  }

  return {
    wordPosition,
    wordIndex: Math.max(0, wordPosition - 1),
    startMs,
    endMs,
  };
}

function normalizeAudioFile(file) {
  const segments = (Array.isArray(file?.segments) ? file.segments : [])
    .map(normalizeSegment)
    .filter(Boolean);

  return {
    verseKey: file?.verse_key,
    url: normalizeAudioUrl(file?.url),
    durationSec: Number(file?.duration) || null,
    segments,
  };
}

async function fetchJson(url) {
  if (memCache.has(url)) return memCache.get(url);

  try {
    const cached = await dbGet(IDB_STORE, IDB_PREFIX + url);
    if (cached?.data && cached?.ts && Date.now() - cached.ts < CACHE_TTL) {
      memCache.set(url, cached.data);
      return cached.data;
    }
  } catch {
    // Continue to network.
  }

  if (inflight.has(url)) return inflight.get(url);

  const request = fetch(url, { headers: { Accept: "application/json" } })
    .then((response) => {
      if (!response.ok) throw new Error(`Quran.com audio timing ${response.status}`);
      return response.json();
    })
    .then((json) => {
      memCache.set(url, json);
      dbSet(IDB_STORE, {
        key: IDB_PREFIX + url,
        data: json,
        ts: Date.now(),
      }).catch(() => {});
      return json;
    })
    .finally(() => inflight.delete(url));

  inflight.set(url, request);
  return request;
}

export function getQuranComRecitationId(appReciterId) {
  return RECITER_TO_QURAN_COM_RECITATION[appReciterId] || null;
}

export async function getSurahAudioTimings(appReciterId, surahNumber) {
  const recitationId = getQuranComRecitationId(appReciterId);
  if (!recitationId || !surahNumber) return new Map();

  const buildTimingUrl = (page = 1) => {
    const params = new URLSearchParams({
      fields: "segments,duration,verse_key,url",
      per_page: "50",
      page: String(page),
    });
    return `${BASE_URL}/recitations/${recitationId}/by_chapter/${Number(surahNumber)}?${params.toString()}`;
  };

  const first = await fetchJson(buildTimingUrl(1));
  const files = [...(Array.isArray(first.audio_files) ? first.audio_files : [])];
  const totalPages = Number(first.pagination?.total_pages || 1);

  if (totalPages > 1) {
    const remainingPages = Array.from({ length: totalPages - 1 }, (_, index) => index + 2);
    const chunks = await Promise.all(remainingPages.map((page) => fetchJson(buildTimingUrl(page))));
    chunks.forEach((chunk) => {
      if (Array.isArray(chunk.audio_files)) files.push(...chunk.audio_files);
    });
  }

  return new Map(
    files
      .map(normalizeAudioFile)
      .filter((file) => file.verseKey)
      .map((file) => [file.verseKey, file]),
  );
}

export async function getAudioTimingsForAyahs(appReciterId, ayahs = []) {
  const uniqueSurahs = [
    ...new Set(
      (Array.isArray(ayahs) ? ayahs : [])
        .map((ayah) => Number(ayah?.surah?.number || ayah?.surah || ayah?.surahNumber))
        .filter(Boolean),
    ),
  ];

  if (!getQuranComRecitationId(appReciterId) || uniqueSurahs.length === 0) {
    return new Map();
  }

  const maps = await Promise.all(
    uniqueSurahs.map((surah) => getSurahAudioTimings(appReciterId, surah)),
  );
  const merged = new Map();
  maps.forEach((map) => {
    map.forEach((value, key) => merged.set(key, value));
  });
  return merged;
}
