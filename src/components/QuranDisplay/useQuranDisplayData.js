import { useCallback, useEffect, useRef, useState } from "react";
import { addRecentVisit } from "../../services/recentHistoryService";
import { logSession } from "../../services/historyService";
import { logWirdProgress } from "../../services/wirdService";
import { markRead } from "../../services/readingProgressService";
import { savePosition } from "../../services/storageService";
import { getSurah } from "../../data/surahs";
import {
  assertWarshStrict,
  ensureRequestedRiwaya,
  loadArabicData,
  loadHafsSupportData,
} from "./quranDisplayDataApi";

function runWhenIdle(callback, timeout = 1600) {
  if (typeof window === "undefined") {
    callback();
    return () => {};
  }

  if ("requestIdleCallback" in window) {
    const idleId = window.requestIdleCallback(callback, { timeout });
    return () => window.cancelIdleCallback?.(idleId);
  }

  const timeoutId = window.setTimeout(callback, 0);
  return () => window.clearTimeout(timeoutId);
}

const DISPLAY_DATA_CACHE = new Map();
const DISPLAY_DATA_CACHE_MAX = 120;

function displayCacheKey(displayMode, currentSurah, currentPage, currentJuz, riwaya, warshStrictMode) {
  const scope = displayMode === "page" ? `p:${currentPage}` : displayMode === "juz" ? `j:${currentJuz}` : `s:${currentSurah}`;
  return `${riwaya}:${scope}:${riwaya === "warsh" && warshStrictMode ? 1 : 0}`;
}

function rememberLimited(map, key, value, maxSize) {
  if (map.has(key)) map.delete(key);
  map.set(key, value);
  if (map.size > maxSize) map.delete(map.keys().next().value);
}

function mergeHafsSupport(ayahs, hafsMap) {
  if (!hafsMap?.size) return ayahs;
  return ayahs.map((ayah) => {
    const hafsAyah = hafsMap.get(`${ayah.surah?.number}:${ayah.numberInSurah}`);
    return hafsAyah
      ? {
          ...ayah,
          number: ayah.number ?? hafsAyah.number,
          page: ayah.page ?? hafsAyah.page,
          juz: ayah.juz ?? hafsAyah.juz,
          hafsText: hafsAyah.text,
          hafsSupport: {
            text: hafsAyah.text,
            quranCom: hafsAyah.quranCom || null,
            words: Array.isArray(hafsAyah.words) ? hafsAyah.words : [],
          },
        }
      : ayah;
  });
}

export default function useQuranDisplayData({
  currentAyah,
  currentJuz,
  currentPage,
  currentSurah,
  dispatch,
  displayMode,
  lang,
  showHome,
  riwaya,
  warshStrictMode,
}) {
  const currentCacheKey = displayCacheKey(
    displayMode,
    currentSurah,
    currentPage,
    currentJuz,
    riwaya,
    warshStrictMode,
  );
  const initialCachedData = DISPLAY_DATA_CACHE.get(currentCacheKey);
  const [ayahs, setAyahs] = useState(() => initialCachedData?.ayahs || []);
  const [resolvedCacheKey, setResolvedCacheKey] = useState(() =>
    initialCachedData ? currentCacheKey : null,
  );
  const [settledCacheKey, setSettledCacheKey] = useState(() =>
    initialCachedData ? currentCacheKey : null,
  );
  const [error, setError] = useState(null);
  const [isWarshFallback, setIsWarshFallback] = useState(() =>
    Boolean(initialCachedData?.isWarshFallback),
  );
  const readingStartRef = useRef(Date.now());
  const requestSeqRef = useRef(0);
  const requestAbortRef = useRef(null);
  const persistRef = useRef(null);

  const persistReadingSideEffects = useCallback(
    (allAyahs) =>
      runWhenIdle(() => {
        const firstAyah = allAyahs?.[0];
        if (!firstAyah) return;

        const firstSurah = firstAyah?.surah?.number || currentSurah;
        const firstAyahNumber = firstAyah?.numberInSurah || 1;
        const positionAyah =
          displayMode === "surah" ? currentAyah || firstAyahNumber : firstAyahNumber;

        if (displayMode === "page") {
          savePosition(firstSurah, firstAyahNumber, currentPage);
        } else {
          savePosition(firstSurah, positionAyah, firstAyah.page || currentPage);
        }

        const lastAyah = allAyahs[allAyahs.length - 1];
        const elapsed = Date.now() - readingStartRef.current;
        readingStartRef.current = Date.now();
        logSession({
          surah: firstSurah,
          ayahFrom: firstAyahNumber,
          ayahTo: lastAyah.numberInSurah || firstAyahNumber,
          page: displayMode === "page" ? currentPage : firstAyah.page || currentPage,
          durationMs: elapsed,
        }).catch(() => {});
        logWirdProgress({
          surah: firstSurah,
          fromAyah: firstAyahNumber,
          toAyah: lastAyah.numberInSurah || firstAyahNumber,
          pagesCount: displayMode === "page" ? 1 : Math.ceil(allAyahs.length / 15),
        }).catch(() => {});
      }),
    [currentAyah, currentPage, currentSurah, displayMode],
  );
  useEffect(() => { persistRef.current = persistReadingSideEffects; }, [persistReadingSideEffects]);

  useEffect(() => {
    if (showHome || !currentSurah || !currentAyah || displayMode !== "surah") return;
    return runWhenIdle(() => {
      markRead(currentSurah, currentAyah);
      const meta = getSurah(currentSurah);
      addRecentVisit(currentSurah, currentAyah, meta?.fr || meta?.en || "");
    });
  }, [currentAyah, currentSurah, displayMode, showHome]);

  const fetchData = useCallback(async () => {
    if (showHome) {
      requestAbortRef.current?.abort();
      dispatch({ type: "SET_LOADING", payload: false });
      return;
    }

    const requestId = requestSeqRef.current + 1;
    requestSeqRef.current = requestId;
    requestAbortRef.current?.abort();
    const controller = new AbortController();
    requestAbortRef.current = controller;
    const signal = controller.signal;
    const cacheKey = currentCacheKey;
    const cachedData = DISPLAY_DATA_CACHE.get(cacheKey);

    setError(null);
    if (cachedData) {
      setAyahs(cachedData.ayahs);
      setResolvedCacheKey(cacheKey);
      setSettledCacheKey(cacheKey);
      setIsWarshFallback(Boolean(cachedData.isWarshFallback));
      dispatch({ type: "SET", payload: { loadedAyahCount: cachedData.ayahs.length } });
      dispatch({ type: "SET_LOADING", payload: false });
      persistRef.current(cachedData.ayahs);
      return;
    }

    dispatch({ type: "SET_LOADING", payload: true });

    const fetchPromise = (async () => {
      const hafsPromise = riwaya === "warsh"
        ? loadHafsSupportData({ currentJuz, currentPage, currentSurah, displayMode, signal }).catch(() => null)
        : Promise.resolve(null);

      const arabicData = await loadArabicData({
        currentJuz,
        currentPage,
        currentSurah,
        displayMode,
        riwaya,
        signal,
      });
      const fetchedAyahs = ensureRequestedRiwaya(arabicData.ayahs || [], riwaya);
      const fallback = Boolean(arabicData?.isTextFallback);
      return { arabicData, ayahs: fetchedAyahs, isWarshFallback: fallback, hafsPromise };
    })();

    try {
      const { arabicData, ayahs: fetchedAyahs, isWarshFallback: fallback, hafsPromise } = await fetchPromise;

      if (signal.aborted || requestSeqRef.current !== requestId) return;
      assertWarshStrict({ arabicData, displayMode, lang, riwaya, warshStrictMode });

      rememberLimited(
        DISPLAY_DATA_CACHE,
        cacheKey,
        { ayahs: fetchedAyahs, isWarshFallback: fallback },
        DISPLAY_DATA_CACHE_MAX,
      );
      setAyahs(fetchedAyahs);
      setResolvedCacheKey(cacheKey);
      setSettledCacheKey(cacheKey);
      setIsWarshFallback(fallback);
      dispatch({ type: "SET", payload: { loadedAyahCount: fetchedAyahs.length } });
      dispatch({ type: "SET_LOADING", payload: false });

      if (hafsPromise) {
        hafsPromise.then((hafsData) => {
          if (signal.aborted || requestSeqRef.current !== requestId || !hafsData) return;
          const hafsMap = new Map(
            (hafsData?.ayahs || []).map((ayah) => [
              `${ayah.surah?.number}:${ayah.numberInSurah}`,
              ayah,
            ]),
          );
          setAyahs((previous) => {
            if (requestSeqRef.current !== requestId) return previous;
            const merged = mergeHafsSupport(previous, hafsMap);
            rememberLimited(
              DISPLAY_DATA_CACHE,
              cacheKey,
              { ayahs: merged, isWarshFallback: fallback },
              DISPLAY_DATA_CACHE_MAX,
            );
            return merged;
          });
        });
      }

      persistRef.current(fetchedAyahs);
    } catch (err) {
      if (err?.name === "AbortError" || requestSeqRef.current !== requestId) return;
      if (import.meta.env.DEV) console.warn("Fetch error:", err);
      setSettledCacheKey(cacheKey);
      setError(err.message);
      dispatch({ type: "SET_ERROR", payload: err.message });
    } finally {
      if (!signal.aborted && requestSeqRef.current === requestId) {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    }
  }, [
    currentJuz,
    currentPage,
    currentSurah,
    currentCacheKey,
    dispatch,
    displayMode,
    lang,
    riwaya,
    showHome,
    warshStrictMode,
  ]);

  useEffect(() => {
    if (showHome) return;
    fetchData();
    return () => {
      requestAbortRef.current?.abort();
    };
  }, [fetchData, showHome]);

  useEffect(
    () => () => {
      const elapsed = Date.now() - readingStartRef.current;
      if (elapsed > 3000) {
        logSession({
          surah: null,
          ayahFrom: null,
          ayahTo: null,
          page: null,
          durationMs: elapsed,
        }).catch(() => {});
      }
    },
    [],
  );

  const dataTransitioning = !showHome && settledCacheKey !== currentCacheKey;
  const visibleAyahs = resolvedCacheKey === currentCacheKey ? ayahs : [];

  return {
    ayahs: visibleAyahs,
    dataTransitioning,
    error,
    fetchData,
    isWarshFallback,
    setError,
  };
}
