import { dbGet, dbSet } from "./dbService.js";
import { fetchWithTimeout } from "./fetchWithTimeout.js";

const BASE_URL = "https://api.quran.com/api/v4";
const AUDIO_BASE_URL = "https://verses.quran.com/";
const CACHE_TTL = 14 * 24 * 60 * 60 * 1000;
// Timing metadata is a non-blocking enrichment: 8 s matches the study
// service and guarantees the inflight dedupe entry is released long before
// the reader gives up on the request.
const FETCH_TIMEOUT_MS = 8000;
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
};

const memCache = new Map();
const inflight = new Map();

function normalizeAudioUrl(url) {
  if (typeof url !== "string" || !url) return null;
  if (/^https:\/\//i.test(url)) return url;
  if (url.startsWith("//")) return `https:${url}`;
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

  const request = fetchWithTimeout(
    url,
    { headers: { Accept: "application/json" } },
    FETCH_TIMEOUT_MS,
  )
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

/**
 * One recording for a whole surah, with the position of every verse in it.
 *
 * GET /chapter_recitations/{reciter}/{surah}?segments=true answers with the file
 * (download.quranicaudio.com) and, per verse, `timestamp_from` / `timestamp_to` in
 * milliseconds from the start of that file plus the word segments. Those ids are the
 * ones of the "chapter reciters", not of the per-verse recitations used above.
 *
 * Returned in seconds, verses in order and contiguous; word segments are relative to
 * the start of their verse, as the per-verse files give them, so the word highlight
 * reads the same data in both modes. Anything that does not look like a complete
 * surah (missing file, a verse that goes backwards) is refused: the caller then
 * plays verse by verse instead of trusting a broken map.
 */
export async function getChapterAudioTimeline(recitationId, surahNumber, expectedVerses = 0) {
  const surah = Number(surahNumber);
  const reciter = Number(recitationId);
  if (!reciter || !surah) throw new Error("Chapter audio: missing reciter or surah");
  const params = new URLSearchParams({ segments: "true" });
  const json = await fetchJson(`${BASE_URL}/chapter_recitations/${reciter}/${surah}?${params.toString()}`);
  const file = json?.audio_file;
  const url = normalizeAudioUrl(file?.audio_url);
  const stamps = Array.isArray(file?.timestamps) ? file.timestamps : [];
  if (!url || !url.startsWith("https://") || stamps.length === 0) {
    throw new Error("Chapter audio: no file or no verse timing");
  }

  const verses = [];
  for (const stamp of stamps) {
    const parts = String(stamp?.verse_key || "").split(":").map(Number);
    const key = parts.length === 2 && parts.every(Number.isInteger) ? [null, ...parts] : null;
    const fromMs = Number(stamp?.timestamp_from);
    const toMs = Number(stamp?.timestamp_to);
    if (!key || Number(key[1]) !== surah || !Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs <= fromMs) {
      throw new Error("Chapter audio: unusable verse timing");
    }
    const previous = verses[verses.length - 1];
    const ayah = Number(key[2]);
    if (previous && (ayah !== previous.ayah + 1 || fromMs < previous.to * 1000 - 1)) {
      throw new Error("Chapter audio: verses are not in order");
    }
    verses.push({
      ayah,
      from: fromMs / 1000,
      to: toMs / 1000,
      segments: (Array.isArray(stamp.segments) ? stamp.segments : [])
        .map(normalizeSegment)
        .filter(Boolean)
        .map((segment) => ({
          ...segment,
          startMs: Math.max(0, segment.startMs - fromMs),
          endMs: Math.max(0, segment.endMs - fromMs),
        })),
    });
  }
  if (verses[0].ayah !== 1 || (expectedVerses > 0 && verses.length !== expectedVerses)) {
    throw new Error("Chapter audio: verse count does not match the surah");
  }
  return { url, verses };
}
