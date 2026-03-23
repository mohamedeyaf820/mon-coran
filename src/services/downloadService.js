/**
 * Download Service — offline caching for surah audio via Cache API.
 * Stores progress by riwaya + reciter + surah so multiple readers can coexist.
 */

import { AudioService } from "./audioService";
import { getRecentVisits } from "./recentHistoryService";
import SURAHS from "../data/surahs";
import {
  downloadProgressMapSchema,
  readLocalStorageWithSchema,
  writeLocalStorageJson,
} from "./storageValidation";

const CACHE_NAME = "mushafplus-audio-v2";
const PROGRESS_KEY = "mushaf_offline_progress_v2";

function loadProgress() {
  return readLocalStorageWithSchema(PROGRESS_KEY, downloadProgressMapSchema, {});
}

function saveProgress(progress) {
  writeLocalStorageJson(PROGRESS_KEY, progress);
}

function surahAyahCount(surahMeta) {
  return surahMeta?.ayahs || 7;
}

function getSurahGlobalStart(surahNum) {
  let offset = 1;
  for (const surahItem of SURAHS) {
    if (surahItem.n === surahNum) return offset;
    offset += surahItem.ayahs || 0;
  }
  return 1;
}

function buildProgressKey({ surahNum, reciterId = "", riwaya = "hafs" }) {
  return `${riwaya}:${reciterId || "unknown"}:${surahNum}`;
}

function normalizeDownloadOptions({
  surahMeta,
  reciter,
  riwaya = "hafs",
  reciterId,
  reciterCdn,
  cdnType = "islamic",
}) {
  const resolvedReciterId = reciter?.id || reciterId || "unknown";
  const resolvedCdn = reciter?.cdn || reciterCdn || "";
  const resolvedCdnType = reciter?.cdnType || cdnType || "islamic";
  const surahNum = Number(surahMeta?.n || surahMeta?.number || 0);
  return {
    surahMeta,
    surahNum,
    riwaya,
    reciterId: resolvedReciterId,
    reciterCdn: resolvedCdn,
    cdnType: resolvedCdnType,
    key: buildProgressKey({
      surahNum,
      reciterId: resolvedReciterId,
      riwaya,
    }),
  };
}

function getAyahAudioUrl({ surahNum, ayahIndex, globalBase, reciterCdn, cdnType }) {
  return AudioService.buildUrl(
    reciterCdn,
    {
      surah: surahNum,
      numberInSurah: ayahIndex,
      number: globalBase + ayahIndex - 1,
    },
    cdnType,
  );
}

export function getDownloadedSurahs(reciterId = null, riwaya = null) {
  const progress = loadProgress();
  return Object.entries(progress)
    .filter(([key, value]) => {
      if (value?.status !== "done") return false;
      const [entryRiwaya, entryReciterId] = key.split(":");
      if (riwaya && entryRiwaya !== riwaya) return false;
      if (reciterId && entryReciterId !== reciterId) return false;
      return true;
    })
    .map(([, value]) => value.surahNum)
    .filter((value, index, all) => all.indexOf(value) === index);
}

export function getOfflineAudioEntries() {
  return Object.values(loadProgress())
    .filter((entry) => entry && typeof entry === "object")
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export function getSurahDownloadStatus(surahNum, reciterId = null, riwaya = null) {
  const progress = loadProgress();
  if (reciterId && riwaya) {
    return progress[buildProgressKey({ surahNum, reciterId, riwaya })]?.status || null;
  }
  const statuses = Object.values(progress).filter(
    (entry) => Number(entry?.surahNum) === Number(surahNum),
  );
  return statuses[0]?.status || null;
}

export async function downloadSurahForReciter(
  { surahMeta, reciter, riwaya = "hafs" },
  onProgress,
) {
  if (!("caches" in window)) {
    console.warn("Cache API not available");
    return "error";
  }

  const normalized = normalizeDownloadOptions({ surahMeta, reciter, riwaya });
  const total = surahAyahCount(normalized.surahMeta);
  let done = 0;
  let successCount = 0;
  let failedCount = 0;
  const progress = loadProgress();
  progress[normalized.key] = {
    status: "partial",
    surahNum: normalized.surahNum,
    reciterId: normalized.reciterId,
    reciterName: reciter?.nameFr || reciter?.nameEn || reciter?.name || normalized.reciterId,
    riwaya: normalized.riwaya,
    total,
    updatedAt: Date.now(),
  };
  saveProgress(progress);

  try {
    const cache = await caches.open(CACHE_NAME);
    const globalBase =
      normalized.surahMeta?.globalStart || getSurahGlobalStart(normalized.surahNum);

    for (let ayahIndex = 1; ayahIndex <= total; ayahIndex += 1) {
      const url = getAyahAudioUrl({
        surahNum: normalized.surahNum,
        ayahIndex,
        globalBase,
        reciterCdn: normalized.reciterCdn,
        cdnType: normalized.cdnType,
      });

      const existing = await cache.match(url);
      let downloaded = Boolean(existing);
      if (!existing) {
        try {
          const response = await fetch(url, { mode: "cors" });
          if (response.ok) {
            await cache.put(url, response);
            downloaded = true;
          }
        } catch {
          // Best effort: continue with the rest of the surah.
        }
      }

      if (downloaded) successCount += 1;
      else failedCount += 1;

      done += 1;
      onProgress?.(done, total, {
        ...normalized,
        successCount,
        failedCount,
      });
      if (done % 5 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    const status =
      failedCount === 0 ? "done" : successCount > 0 ? "partial" : "error";

    progress[normalized.key] = {
      ...progress[normalized.key],
      status,
      downloaded: successCount,
      failedCount,
      updatedAt: Date.now(),
    };
    saveProgress(progress);
    return status;
  } catch (error) {
    console.error("Download error:", error);
    progress[normalized.key] = {
      ...progress[normalized.key],
      status: "error",
      downloaded: successCount,
      failedCount: Math.max(failedCount, total - successCount),
      updatedAt: Date.now(),
    };
    saveProgress(progress);
    return "error";
  }
}

export async function downloadRecentSurahsForReciter(
  { reciter, riwaya = "hafs", recentVisits = getRecentVisits(), resolveSurahMeta },
  onBatchProgress,
) {
  const visits = Array.isArray(recentVisits) ? recentVisits.filter(Boolean) : [];
  if (visits.length === 0) return [];

  const results = [];
  for (let index = 0; index < visits.length; index += 1) {
    const visit = visits[index];
    const surahMeta = resolveSurahMeta?.(visit.surah);
    if (!surahMeta) continue;
    const status = await downloadSurahForReciter(
      { surahMeta, reciter, riwaya },
      (done, total, normalized) =>
        onBatchProgress?.({
          mode: "surah",
          done,
          total,
          currentIndex: index + 1,
          totalSurahs: visits.length,
          visit,
          normalized,
        }),
    );
    results.push({ surah: visit.surah, status });
  }
  return results;
}

export async function removeSurahCacheForReciter({
  surahMeta,
  reciter,
  riwaya = "hafs",
}) {
  if (!("caches" in window)) return;
  const normalized = normalizeDownloadOptions({ surahMeta, reciter, riwaya });
  const total = surahAyahCount(normalized.surahMeta);
  const globalBase =
    normalized.surahMeta?.globalStart || getSurahGlobalStart(normalized.surahNum);

  try {
    const cache = await caches.open(CACHE_NAME);
    for (let ayahIndex = 1; ayahIndex <= total; ayahIndex += 1) {
      const url = getAyahAudioUrl({
        surahNum: normalized.surahNum,
        ayahIndex,
        globalBase,
        reciterCdn: normalized.reciterCdn,
        cdnType: normalized.cdnType,
      });
      await cache.delete(url);
    }
  } catch {}

  const progress = loadProgress();
  delete progress[normalized.key];
  saveProgress(progress);
}

export async function getCacheSize() {
  if (!("caches" in window)) return 0;
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    let totalBytes = 0;
    for (const request of keys.slice(0, 20)) {
      const response = await cache.match(request);
      const blob = await response?.blob();
      if (blob) totalBytes += blob.size;
    }
    const avgPerFile = keys.length > 0 ? totalBytes / Math.min(20, keys.length) : 0;
    return Math.round(((avgPerFile * keys.length) / 1_048_576) * 10) / 10;
  } catch {
    return 0;
  }
}

export async function downloadSurah(surahMeta, reciterCdn, cdnType = "islamic", onProgress) {
  return downloadSurahForReciter(
    {
      surahMeta,
      riwaya: "hafs",
      reciter: {
        id: reciterCdn,
        cdn: reciterCdn,
        cdnType,
        nameEn: reciterCdn,
      },
    },
    onProgress,
  );
}

export async function removeSurahCache(
  surahMeta,
  reciterCdn,
  cdnType = "islamic",
) {
  return removeSurahCacheForReciter({
    surahMeta,
    riwaya: "hafs",
    reciter: {
      id: reciterCdn,
      cdn: reciterCdn,
      cdnType,
      nameEn: reciterCdn,
    },
  });
}
