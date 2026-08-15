/**
 * Download Service — offline caching for surah audio via Cache API.
 * Stores progress by riwaya + reciter + surah so multiple readers can coexist.
 */

import { AudioService } from "./audioService.js";
import SURAHS from "../data/surahs.js";
import { buildAudioPlaylistForSurah } from "../utils/audioPlaylist.js";
import {
  downloadProgressMapSchema,
  readLocalStorageWithSchema,
  writeLocalStorageJson,
} from "./storageValidation.js";
import {
  ensureStorageCapacity,
  estimateAudioDownloadBytes,
  requestPersistentStorage,
} from "./storageQuotaService.js";
import { startPerformanceTimer } from "./performanceMetrics.js";

export const OFFLINE_AUDIO_CACHE_NAME = "mushafplus-audio-v2";
const PROGRESS_KEY = "mushaf_offline_progress_v2";
export const OFFLINE_DOWNLOADS_CHANGED_EVENT = "mushafplus-offline-downloads-changed";
export const OFFLINE_FULL_QURAN_PROGRESS_EVENT = "mushafplus-full-quran-download-progress";
const activeDownloads = new Map();
const activeFullQuranDownloads = new Map();

function loadProgress() {
  return readLocalStorageWithSchema(PROGRESS_KEY, downloadProgressMapSchema, {});
}

function saveProgress(progress) {
  const saved = writeLocalStorageJson(PROGRESS_KEY, progress);
  if (saved && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OFFLINE_DOWNLOADS_CHANGED_EVENT));
  }
  return saved;
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

function saveProgressEntry(key, entry) {
  const latestProgress = loadProgress();
  latestProgress[key] = entry;
  return saveProgress(latestProgress);
}

function buildFullQuranKey(reciterId = "unknown", riwaya = "hafs") {
  return `${riwaya}:${reciterId || "unknown"}`;
}

function expectedItemCountForSurah(surahMeta, isSurahStream) {
  return isSurahStream ? 1 : surahAyahCount(surahMeta);
}

function dispatchFullQuranProgress(detail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(OFFLINE_FULL_QURAN_PROGRESS_EVENT, { detail }),
  );
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

async function buildDownloadAudioItems(normalized) {
  if (AudioService.isSurahStreamCdn(normalized.cdnType)) {
    const globalBase =
      normalized.surahMeta?.globalStart || getSurahGlobalStart(normalized.surahNum);
    return [
      {
        surah: normalized.surahNum,
        surahNumber: normalized.surahNum,
        ayah: 1,
        numberInSurah: 1,
        number: globalBase,
      },
    ];
  }

  const playlist = await buildAudioPlaylistForSurah(
    normalized.surahNum,
    normalized.riwaya,
  );
  if (playlist.length) return playlist;

  const total = surahAyahCount(normalized.surahMeta);
  const globalBase =
    normalized.surahMeta?.globalStart || getSurahGlobalStart(normalized.surahNum);
  return Array.from({ length: total }, (_, index) => ({
    surah: normalized.surahNum,
    surahNumber: normalized.surahNum,
    ayah: index + 1,
    numberInSurah: index + 1,
    number: globalBase + index,
  }));
}

function getAudioUrlCandidates({ item, normalized }) {
  if (typeof AudioService.buildUrlCandidates === "function") {
    return AudioService.buildUrlCandidates(
      normalized.reciterCdn,
      item,
      normalized.cdnType,
    );
  }

  return [
    getAyahAudioUrl({
      surahNum: item.surah || item.surahNumber || normalized.surahNum,
      ayahIndex: item.ayah || item.numberInSurah || 1,
      globalBase:
        normalized.surahMeta?.globalStart ||
        getSurahGlobalStart(normalized.surahNum),
      reciterCdn: normalized.reciterCdn,
      cdnType: normalized.cdnType,
    }),
  ];
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

export function isOfflineDownloadActive(key) {
  return activeDownloads.has(key);
}

export function cancelOfflineDownload(key) {
  const controller = activeDownloads.get(key);
  if (!controller) return false;
  controller.abort();
  return true;
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

export function getSurahDownloadEntry(surahNum, reciterId, riwaya) {
  if (!reciterId || !riwaya) return null;
  const progress = loadProgress();
  return (
    progress[buildProgressKey({ surahNum, reciterId, riwaya })] || null
  );
}

export function getFullQuranDownloadSummary(reciter, riwaya = "hafs") {
  const reciterId = reciter?.id || "unknown";
  const isSurahStream = AudioService.isSurahStreamCdn(reciter?.cdnType);
  const progress = loadProgress();
  let completedSurahs = 0;
  let downloadedItems = 0;
  let failedItems = 0;

  for (const surah of SURAHS) {
    const expectedItems = expectedItemCountForSurah(surah, isSurahStream);
    const entry = progress[buildProgressKey({
      surahNum: surah.n,
      reciterId,
      riwaya,
    })];
    if (!entry) continue;
    if (entry.status === "done") completedSurahs += 1;
    downloadedItems += Math.min(
      expectedItems,
      Math.max(0, Number(entry.downloaded || 0)),
    );
    failedItems += Math.max(0, Number(entry.failedCount || 0));
  }

  const totalItems = SURAHS.reduce(
    (total, surah) => total + expectedItemCountForSurah(surah, isSurahStream),
    0,
  );
  const remainingItems = Math.max(0, totalItems - downloadedItems);
  const status =
    completedSurahs === SURAHS.length
      ? "done"
      : downloadedItems > 0
        ? "partial"
        : "idle";

  return {
    key: buildFullQuranKey(reciterId, riwaya),
    status,
    completedSurahs,
    totalSurahs: SURAHS.length,
    downloadedItems,
    totalItems,
    failedItems,
    percent: totalItems > 0
      ? Math.min(100, Math.round((downloadedItems / totalItems) * 100))
      : 0,
    estimatedBytes: estimateAudioDownloadBytes(totalItems, isSurahStream),
    estimatedRemainingBytes: remainingItems > 0
      ? estimateAudioDownloadBytes(remainingItems, isSurahStream)
      : 0,
    isSurahStream,
  };
}

export function isFullQuranDownloadActive(reciterId, riwaya = "hafs") {
  return activeFullQuranDownloads.has(buildFullQuranKey(reciterId, riwaya));
}

export function cancelFullQuranDownload(reciterId, riwaya = "hafs") {
  const fullKey = buildFullQuranKey(reciterId, riwaya);
  const controller = activeFullQuranDownloads.get(fullKey);
  if (!controller) return false;
  controller.abort();
  const prefix = `${riwaya}:${reciterId}:`;
  activeDownloads.forEach((surahController, key) => {
    if (key.startsWith(prefix)) surahController.abort();
  });
  return true;
}

export async function downloadSurahForReciter(
  { surahMeta, reciter, riwaya = "hafs", signal: parentSignal = null },
  onProgress,
) {
  if (!("caches" in window)) {
    console.warn("Cache API not available");
    return "error";
  }

  const normalized = normalizeDownloadOptions({ surahMeta, reciter, riwaya });
  if (activeDownloads.has(normalized.key)) return "partial";

  const controller = new AbortController();
  if (parentSignal?.aborted) return "cancelled";
  const abortFromParent = () => controller.abort();
  parentSignal?.addEventListener?.("abort", abortFromParent, { once: true });
  activeDownloads.set(normalized.key, controller);
  let done = 0;
  let successCount = 0;
  let failedCount = 0;
  const progress = loadProgress();
  const finishMetric = startPerformanceTimer("offline_download_ms");

  try {
    const audioItems = await buildDownloadAudioItems(normalized);
    const total = audioItems.length;
    if (total === 0) return "error";
    await requestPersistentStorage();
    const alreadyDownloaded = Math.max(
      0,
      Number(progress[normalized.key]?.downloaded || 0),
    );
    const remainingItems = Math.max(1, total - alreadyDownloaded);
    const capacity = await ensureStorageCapacity({
      estimatedAdditionalBytes: estimateAudioDownloadBytes(
        remainingItems,
        AudioService.isSurahStreamCdn(normalized.cdnType),
      ),
    });
    if (!capacity.allowed) return "storage-full";
    const initialEntry = {
      ...progress[normalized.key],
      key: normalized.key,
      status: "partial",
      surahNum: normalized.surahNum,
      reciterId: normalized.reciterId,
      reciterName: reciter?.nameFr || reciter?.nameEn || reciter?.name || normalized.reciterId,
      riwaya: normalized.riwaya,
      total,
      updatedAt: Date.now(),
    };
    saveProgressEntry(normalized.key, initialEntry);

    const cache = await caches.open(OFFLINE_AUDIO_CACHE_NAME);

    for (const item of audioItems) {
      if (controller.signal.aborted) throw new Error("Download cancelled");
      const urlCandidates = getAudioUrlCandidates({ item, normalized });
      let existing = null;
      for (const url of urlCandidates) {
        existing = await cache.match(url);
        if (existing) break;
      }
      let downloaded = Boolean(existing);
      if (!existing) {
        for (const url of urlCandidates) {
          try {
            const response = await fetch(url, {
              mode: "no-cors",
              signal: controller.signal,
            });
            if (response.ok || response.type === "opaque") {
              await cache.put(url, response.clone());
              downloaded = true;
              break;
            }
          } catch {
            // Try the next URL candidate, then continue with the rest of the surah.
          }
        }
      } else if (AudioService.isSurahStreamCdn(normalized.cdnType)) {
        for (const url of urlCandidates) {
          const hasCandidate = await cache.match(url);
          if (!hasCandidate) {
            try {
              const response = await fetch(url, {
                mode: "no-cors",
                signal: controller.signal,
              });
              if (response.ok || response.type === "opaque") {
                await cache.put(url, response.clone());
              }
            } catch {
              // The primary cached URL is enough for offline status.
            }
          }
        }
      }

      if (!downloaded && urlCandidates.length > 1) {
        for (const url of urlCandidates) {
          const retryExisting = await cache.match(url);
          if (retryExisting) {
            downloaded = true;
            break;
          }
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

    const completedEntry = {
      ...initialEntry,
      status,
      downloaded: successCount,
      failedCount,
      updatedAt: Date.now(),
    };
    saveProgressEntry(normalized.key, completedEntry);
    finishMetric();
    return status;
  } catch (error) {
    const cancelled = controller.signal.aborted;
    if (!cancelled) console.error("Download error:", error);
    const latestEntry = loadProgress()[normalized.key] || progress[normalized.key];
    const total = latestEntry?.total || surahAyahCount(normalized.surahMeta);
    const failedEntry = {
      ...latestEntry,
      key: normalized.key,
      status: cancelled ? "cancelled" : "error",
      downloaded: successCount,
      failedCount: cancelled
        ? failedCount
        : Math.max(failedCount, total - successCount),
      updatedAt: Date.now(),
    };
    saveProgressEntry(normalized.key, failedEntry);
    finishMetric();
    return cancelled ? "cancelled" : "error";
  } finally {
    finishMetric();
    activeDownloads.delete(normalized.key);
    parentSignal?.removeEventListener?.("abort", abortFromParent);
  }
}

export async function downloadFullQuranForReciter(
  { reciter, riwaya = "hafs" },
  onProgress,
) {
  if (!reciter?.id || !reciter?.cdn || !("caches" in window)) return "error";
  const fullKey = buildFullQuranKey(reciter.id, riwaya);
  if (activeFullQuranDownloads.has(fullKey)) return "partial";

  const initialSummary = getFullQuranDownloadSummary(reciter, riwaya);
  if (initialSummary.status === "done") return "done";

  await requestPersistentStorage();
  const capacity = await ensureStorageCapacity({
    estimatedAdditionalBytes: initialSummary.estimatedRemainingBytes,
  });
  if (!capacity.allowed) return "storage-full";

  const controller = new AbortController();
  activeFullQuranDownloads.set(fullKey, controller);
  const progressRegistry = loadProgress();
  const isSurahStream = initialSummary.isSurahStream;
  const downloadedBySurah = new Map();
  const completedSurahNumbers = new Set();
  const failedBySurah = new Map();
  let lastReportedPercent = -1;

  for (const surah of SURAHS) {
    const entry = progressRegistry[buildProgressKey({
      surahNum: surah.n,
      reciterId: reciter.id,
      riwaya,
    })];
    const expected = expectedItemCountForSurah(surah, isSurahStream);
    downloadedBySurah.set(
      surah.n,
      entry?.status === "done"
        ? expected
        : Math.min(expected, Math.max(0, Number(entry?.downloaded || 0))),
    );
    if (entry?.status === "done") completedSurahNumbers.add(surah.n);
    failedBySurah.set(surah.n, Math.max(0, Number(entry?.failedCount || 0)));
  }

  const notify = (surahNum = null, force = false) => {
    const downloadedItems = [...downloadedBySurah.values()].reduce(
      (total, value) => total + value,
      0,
    );
    const completedSurahs = completedSurahNumbers.size;
    const percent = initialSummary.totalItems > 0
      ? Math.min(100, Math.round((downloadedItems / initialSummary.totalItems) * 100))
      : 0;
    if (!force && percent === lastReportedPercent) return;
    lastReportedPercent = percent;
    const detail = {
      key: fullKey,
      status: controller.signal.aborted ? "cancelled" : "downloading",
      reciterId: reciter.id,
      riwaya,
      surahNum,
      completedSurahs,
      totalSurahs: SURAHS.length,
      downloadedItems,
      totalItems: initialSummary.totalItems,
      failedItems: [...failedBySurah.values()].reduce(
        (total, value) => total + value,
        0,
      ),
      percent,
    };
    onProgress?.(detail);
    dispatchFullQuranProgress(detail);
  };

  const pendingSurahs = SURAHS.filter(
    (surah) => !completedSurahNumbers.has(surah.n),
  );
  let nextIndex = 0;
  let terminalResult = null;

  const connection = typeof navigator !== "undefined" ? navigator.connection : null;
  const workerCount = connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || "")
    ? 1
    : 2;

  const worker = async () => {
    while (!controller.signal.aborted) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= pendingSurahs.length) return;
      const surah = pendingSurahs[index];
      const expected = expectedItemCountForSurah(surah, isSurahStream);
      const result = await downloadSurahForReciter(
        { surahMeta: surah, reciter, riwaya, signal: controller.signal },
        (done, total, meta) => {
          downloadedBySurah.set(
            surah.n,
            Math.min(expected, Math.max(0, Number(meta?.successCount ?? done))),
          );
          failedBySurah.set(surah.n, Math.max(0, Number(meta?.failedCount || 0)));
          notify(surah.n);
        },
      );
      if (result === "done") {
        downloadedBySurah.set(surah.n, expected);
        completedSurahNumbers.add(surah.n);
      }
      if (result === "storage-full") {
        terminalResult = "storage-full";
        controller.abort();
      }
      notify(surah.n, true);
    }
  };

  try {
    notify(null, true);
    await Promise.all(
      Array.from({ length: Math.min(workerCount, pendingSurahs.length) }, worker),
    );
    if (terminalResult) return terminalResult;
    if (controller.signal.aborted) return "cancelled";
    const finalSummary = getFullQuranDownloadSummary(reciter, riwaya);
    return finalSummary.status === "done"
      ? "done"
      : finalSummary.downloadedItems > 0
        ? "partial"
        : "error";
  } finally {
    activeFullQuranDownloads.delete(fullKey);
    const summary = getFullQuranDownloadSummary(reciter, riwaya);
    const detail = {
      ...summary,
      key: fullKey,
      reciterId: reciter.id,
      riwaya,
      status: terminalResult || (controller.signal.aborted ? "cancelled" : summary.status),
    };
    onProgress?.(detail);
    dispatchFullQuranProgress(detail);
  }
}

export async function removeFullQuranCacheForReciter({
  reciter,
  riwaya = "hafs",
}) {
  if (!reciter?.id) return false;
  cancelFullQuranDownload(reciter.id, riwaya);

  if ("caches" in window) {
    try {
      const cache = await caches.open(OFFLINE_AUDIO_CACHE_NAME);
      let nextIndex = 0;
      const workers = Array.from({ length: 3 }, async () => {
        while (nextIndex < SURAHS.length) {
          const surah = SURAHS[nextIndex];
          nextIndex += 1;
          const normalized = normalizeDownloadOptions({
            surahMeta: surah,
            reciter,
            riwaya,
          });
          const audioItems = await buildDownloadAudioItems(normalized);
          for (const item of audioItems) {
            const candidates = getAudioUrlCandidates({ item, normalized });
            for (const url of candidates) await cache.delete(url);
          }
        }
      });
      await Promise.all(workers);
    } catch {
      // Continue cleaning the registry even if the browser already evicted files.
    }
  }

  const progress = loadProgress();
  const prefix = `${riwaya}:${reciter.id}:`;
  Object.keys(progress).forEach((key) => {
    if (key.startsWith(prefix)) delete progress[key];
  });
  saveProgress(progress);
  dispatchFullQuranProgress({
    ...getFullQuranDownloadSummary(reciter, riwaya),
    reciterId: reciter.id,
    riwaya,
  });
  return true;
}

export async function removeSurahCacheForReciter({
  surahMeta,
  reciter,
  riwaya = "hafs",
}) {
  if (!("caches" in window)) return;
  const normalized = normalizeDownloadOptions({ surahMeta, reciter, riwaya });

  try {
    const cache = await caches.open(OFFLINE_AUDIO_CACHE_NAME);
    const audioItems = await buildDownloadAudioItems(normalized);
    for (const item of audioItems) {
      const urlCandidates = getAudioUrlCandidates({ item, normalized });
      for (const url of urlCandidates) {
        await cache.delete(url);
      }
    }
  } catch {}

  const progress = loadProgress();
  delete progress[normalized.key];
  saveProgress(progress);
}

export async function clearAllOfflineAudio() {
  activeFullQuranDownloads.forEach((controller) => controller.abort());
  activeFullQuranDownloads.clear();
  activeDownloads.forEach((controller) => controller.abort());
  activeDownloads.clear();
  if (typeof caches !== "undefined") {
    try {
      await caches.delete(OFFLINE_AUDIO_CACHE_NAME);
    } catch {
      // The progress registry is still cleared when Cache API cleanup fails.
    }
  }
  try {
    localStorage.removeItem(PROGRESS_KEY);
  } catch {
    // Storage may be unavailable in a private browsing context.
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OFFLINE_DOWNLOADS_CHANGED_EVENT));
  }
}

export async function getCacheSize() {
  if (!("caches" in window)) return 0;
  try {
    const cache = await caches.open(OFFLINE_AUDIO_CACHE_NAME);
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
