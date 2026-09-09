/**
 * Download Service — offline caching for surah audio via Cache API.
 * Stores progress by riwaya + reciter + surah so multiple readers can coexist.
 */

import { AudioService } from "./audioService.js";
import { fetchVerifiedAudio, isVerifiedAudioResponse, verifyAudioResponse } from "./offlineAudioResponse.js";
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
const pendingDownloads = new Map();
const activeFullQuranDownloads = new Map();
const pendingFullQuranDownloads = new Map();
const removingReciters = new Set();
let clearingAudio = false;

function notifyDownloadActivity() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OFFLINE_DOWNLOADS_CHANGED_EVENT));
  }
}

function loadProgress() {
  const entries = readLocalStorageWithSchema(PROGRESS_KEY, downloadProgressMapSchema, {});
  for (const entry of Object.values(entries)) {
    if (entry.status === "done" && !Array.isArray(entry.verifiedUrls)) {
      entry.status = "partial";
      entry.downloaded = 0;
    }
  }
  return entries;
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

/** Reconcile the registry with cached media after reload or storage eviction. */
export async function reconcileOfflineAudio() {
  if (typeof caches === "undefined") return;
  try {
    const cache = await caches.open(OFFLINE_AUDIO_CACHE_NAME);
    for (const [key, entry] of Object.entries(loadProgress())) {
      if (activeDownloads.has(key) || !Array.isArray(entry.verifiedUrls)) continue;
      const present = [];
      for (const url of entry.verifiedUrls) {
        if (isVerifiedAudioResponse(await cache.match(url))) present.push(url);
      }
      const latest = loadProgress()[key];
      if (!latest || activeDownloads.has(key) || latest.updatedAt !== entry.updatedAt) continue;
      if (present.length !== entry.verifiedUrls.length) {
        saveProgressEntry(key, {
          ...entry,
          status: present.length > 0 ? "partial" : "error",
          verifiedUrls: present,
          downloaded: present.length,
          updatedAt: Date.now(),
        });
      }
    }
  } catch {
    // Best effort
  }
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
  const candidates =
    typeof AudioService.buildUrlCandidates === "function"
      ? AudioService.buildUrlCandidates(
          normalized.reciterCdn,
          item,
          normalized.cdnType,
        )
      : [
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

  // For Cache Storage verification via fetch(..., {mode: "cors"}), sort so that
  // CORS-enabled mirrors (everyayah, qurancdn, mp3quran) are tried first
  return [...candidates].sort((a, b) => {
    const aNoCors = a.includes("cdn.islamic.network");
    const bNoCors = b.includes("cdn.islamic.network");
    if (aNoCors && !bNoCors) return 1;
    if (!aNoCors && bNoCors) return -1;
    return 0;
  });
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
  if (clearingAudio || removingReciters.has(buildFullQuranKey(normalized.reciterId, riwaya))) return "cancelled";
  if (activeDownloads.has(normalized.key)) return "partial";

  const controller = new AbortController();
  if (parentSignal?.aborted) return "cancelled";
  const abortFromParent = () => controller.abort();
  parentSignal?.addEventListener?.("abort", abortFromParent, { once: true });
  activeDownloads.set(normalized.key, controller);
  let settleDownload;
  pendingDownloads.set(normalized.key, new Promise(resolve => { settleDownload = resolve; }));
  notifyDownloadActivity();
  let done = 0;
  let successCount = 0;
  let failedCount = 0;
  const progress = loadProgress();
  const finishMetric = startPerformanceTimer("offline_download_ms");

  try {
    const audioItems = await buildDownloadAudioItems(normalized);
    controller.signal.throwIfAborted();
    const total = audioItems.length;
    if (total === 0) return "error";
    await requestPersistentStorage();
    controller.signal.throwIfAborted();
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
    controller.signal.throwIfAborted();
    if (!capacity.allowed) return "storage-full";
    const cache = await caches.open(OFFLINE_AUDIO_CACHE_NAME);
    const retainedUrls = [];
    for (const url of progress[normalized.key]?.verifiedUrls || []) {
      if (isVerifiedAudioResponse(await cache.match(url))) retainedUrls.push(url);
    }
    controller.signal.throwIfAborted();
    const initialEntry = {
      ...progress[normalized.key],
      key: normalized.key,
      status: "partial",
      surahNum: normalized.surahNum,
      reciterId: normalized.reciterId,
      reciterName: reciter?.nameFr || reciter?.nameEn || reciter?.name || normalized.reciterId,
      riwaya: normalized.riwaya,
      total,
      verifiedUrls: retainedUrls,
      downloaded: retainedUrls.length,
      updatedAt: Date.now(),
    };
    if (!saveProgressEntry(normalized.key, initialEntry)) throw new Error("Unable to store download progress");

    for (const item of audioItems) {
      if (controller.signal.aborted) throw new Error("Download cancelled");
      const urlCandidates = getAudioUrlCandidates({ item, normalized });
      let downloaded = false;
      for (const url of urlCandidates) {
        if (controller.signal.aborted) throw new Error("Download cancelled");
        try {
          let cached = await cache.match(url);
          if (cached && !isVerifiedAudioResponse(cached)) {
            cached = await verifyAudioResponse(cached);
            if (cached) await cache.put(url, cached.clone());
            else await cache.delete(url);
          }
          const response = cached || await fetchVerifiedAudio(url, controller.signal);
          if (!response) continue;
          if (!cached) await cache.put(url, response);
          if (controller.signal.aborted) throw new Error("Download cancelled");
          if (!initialEntry.verifiedUrls.includes(url)) initialEntry.verifiedUrls.push(url);
          downloaded = true;
          break;
        } catch (error) {
          if (controller.signal.aborted || error?.name === "QuotaExceededError") throw error;
          // An inaccessible CDN is a failure, never an opaque offline success.
        }
      }

      if (downloaded) successCount += 1;
      else failedCount += 1;

      done += 1;
      if (!saveProgressEntry(normalized.key, { ...initialEntry, downloaded: initialEntry.verifiedUrls.length, failedCount, updatedAt: Date.now() })) {
        throw new Error("Unable to store download progress");
      }
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
      downloaded: initialEntry.verifiedUrls.length,
      failedCount,
      updatedAt: Date.now(),
    };
    if (!saveProgressEntry(normalized.key, completedEntry)) throw new Error("Unable to store download completion");
    finishMetric();
    return status;
  } catch (error) {
    const cancelled = controller.signal.aborted;
    const storageFull = error?.name === "QuotaExceededError";
    if (!cancelled) console.error("Download error:", error);
    const latestEntry = loadProgress()[normalized.key] || progress[normalized.key];
    const total = latestEntry?.total || surahAyahCount(normalized.surahMeta);
    const failedEntry = {
      ...latestEntry,
      key: normalized.key,
      status: cancelled ? "cancelled" : latestEntry?.verifiedUrls?.length ? "partial" : "error",
      downloaded: latestEntry?.verifiedUrls?.length || 0,
      failedCount: cancelled
        ? failedCount
        : Math.max(failedCount, total - successCount),
      updatedAt: Date.now(),
    };
    if (latestEntry) saveProgressEntry(normalized.key, failedEntry);
    finishMetric();
    return cancelled ? "cancelled" : storageFull ? "storage-full" : "error";
  } finally {
    finishMetric();
    activeDownloads.delete(normalized.key);
    pendingDownloads.delete(normalized.key);
    settleDownload();
    notifyDownloadActivity();
    parentSignal?.removeEventListener?.("abort", abortFromParent);
  }
}

export async function downloadFullQuranForReciter(
  { reciter, riwaya = "hafs" },
  onProgress,
) {
  if (!reciter?.id || !reciter?.cdn || !("caches" in window)) return "error";
  const fullKey = buildFullQuranKey(reciter.id, riwaya);
  if (clearingAudio || removingReciters.has(fullKey)) return "cancelled";
  if (activeFullQuranDownloads.has(fullKey)) return "partial";

  const controller = new AbortController();
  activeFullQuranDownloads.set(fullKey, controller);
  let settleFullDownload;
  pendingFullQuranDownloads.set(fullKey, new Promise(resolve => { settleFullDownload = resolve; }));
  let terminalResult = null;
  try {
  dispatchFullQuranProgress({ ...getFullQuranDownloadSummary(reciter, riwaya), reciterId: reciter.id, riwaya, status: "downloading" });
  await reconcileOfflineAudio();
  controller.signal.throwIfAborted();
  const initialSummary = getFullQuranDownloadSummary(reciter, riwaya);
  if (initialSummary.status === "done") return "done";

  await requestPersistentStorage();
  controller.signal.throwIfAborted();
  const capacity = await ensureStorageCapacity({
    estimatedAdditionalBytes: initialSummary.estimatedRemainingBytes,
  });
  controller.signal.throwIfAborted();
  if (!capacity.allowed) {
    terminalResult = "storage-full";
    return terminalResult;
  }
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
  } catch (error) {
    terminalResult = controller.signal.aborted ? "cancelled" : error?.name === "QuotaExceededError" ? "storage-full" : "error";
    return terminalResult;
  } finally {
    activeFullQuranDownloads.delete(fullKey);
    pendingFullQuranDownloads.delete(fullKey);
    settleFullDownload();
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
  const fullKey = buildFullQuranKey(reciter.id, riwaya);
  if (removingReciters.has(fullKey)) return false;
  removingReciters.add(fullKey);
  try {
  cancelFullQuranDownload(reciter.id, riwaya);
  const removingPrefix = `${riwaya}:${reciter.id}:`;
  activeDownloads.forEach((controller, key) => {
    if (key.startsWith(removingPrefix)) controller.abort();
  });
  await pendingFullQuranDownloads.get(fullKey);
  await Promise.all([...pendingDownloads].filter(([key]) => key.startsWith(removingPrefix)).map(([, pending]) => pending));

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
  } finally {
    removingReciters.delete(fullKey);
  }
}

export async function removeSurahCacheForReciter({
  surahMeta,
  reciter,
  riwaya = "hafs",
}) {
  if (!("caches" in window)) return;
  const normalized = normalizeDownloadOptions({ surahMeta, reciter, riwaya });
  cancelOfflineDownload(normalized.key);
  await pendingDownloads.get(normalized.key);

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
  clearingAudio = true;
  try {
  activeFullQuranDownloads.forEach((controller) => controller.abort());
  activeDownloads.forEach((controller) => controller.abort());
  await Promise.all([...pendingFullQuranDownloads.values()]);
  await Promise.all([...pendingDownloads.values()]);
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
  } finally {
    clearingAudio = false;
  }
}

export async function getCacheSize() {
  if (!("caches" in window)) return 0;
  try {
    const cache = await caches.open(OFFLINE_AUDIO_CACHE_NAME);
    const keys = await cache.keys();
    let totalBytes = 0;
    for (const request of keys) {
      const response = await cache.match(request);
      const blob = await response?.blob();
      if (blob) totalBytes += blob.size;
    }
    return Math.round((totalBytes / 1_048_576) * 10) / 10;
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
