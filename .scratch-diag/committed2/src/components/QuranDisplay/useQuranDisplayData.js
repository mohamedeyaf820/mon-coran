import { useCallback, useEffect, useRef, useState } from "react";
import { savePosition } from "../../services/storageService";
import {
  assertWarshStrict,
  describeArabicDataSource,
  ensureRequestedRiwaya,
  loadArabicData,
  loadHafsSupportData,
} from "./quranDisplayDataApi";

const DISPLAY_DATA_CACHE = new Map();
const DISPLAY_DATA_CACHE_MAX = 120;
const DISPLAY_DATA_PREFETCHES = new Map();
const EMPTY_AYAHS = Object.freeze([]);

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
  mushafLayout,
  showHome,
  riwaya,
  showTransliteration,
  warshStrictMode,
}) {
  const needsHafsSupport =
    riwaya === "warsh" &&
    (displayMode === "page" ||
      (displayMode === "surah" && mushafLayout === "mushaf") ||
      (mushafLayout !== "mushaf" && showTransliteration));
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
  const [dataSource, setDataSource] = useState(() => initialCachedData?.dataSource || null);
  const requestSeqRef = useRef(0);
  const requestAbortRef = useRef(null);
  const persistRef = useRef(null);

  const persistReadingPosition = useCallback(
    (allAyahs) => {
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
    },
    [currentAyah, currentPage, currentSurah, displayMode],
  );
  useEffect(() => { persistRef.current = persistReadingPosition; }, [persistReadingPosition]);

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
    if (cachedData && (!needsHafsSupport || cachedData.hafsSupportReady)) {
      setAyahs(cachedData.ayahs);
      setResolvedCacheKey(cacheKey);
      setSettledCacheKey(cacheKey);
      setIsWarshFallback(Boolean(cachedData.isWarshFallback));
      setDataSource(cachedData.dataSource || null);
      dispatch({ type: "SET", payload: { loadedAyahCount: cachedData.ayahs.length } });
      dispatch({ type: "SET_LOADING", payload: false });
      persistRef.current(cachedData.ayahs);
      return;
    }

    dispatch({ type: "SET_LOADING", payload: true });

    const pendingPrefetch = DISPLAY_DATA_PREFETCHES.get(cacheKey);
    if (pendingPrefetch) {
      try {
        const prefetchedData = await pendingPrefetch;
        if (signal.aborted || requestSeqRef.current !== requestId) return;
        setAyahs(prefetchedData.ayahs);
        setResolvedCacheKey(cacheKey);
        setSettledCacheKey(cacheKey);
        setIsWarshFallback(Boolean(prefetchedData.isWarshFallback));
        setDataSource(prefetchedData.dataSource || null);
        dispatch({
          type: "SET",
          payload: { loadedAyahCount: prefetchedData.ayahs.length },
        });
        dispatch({ type: "SET_LOADING", payload: false });
        persistRef.current(prefetchedData.ayahs);
        return;
      } catch {
        // A failed background warmup must not prevent the foreground retry.
      }
    }

    const fetchPromise = (async () => {
      const hafsPromise = needsHafsSupport
        ? loadHafsSupportData({ currentJuz, currentPage, currentSurah, displayMode, signal }).catch(() => null)
        : Promise.resolve(null);

      const arabicData = cachedData
        ? null
        : await loadArabicData({
            currentJuz,
            currentPage,
            currentSurah,
            displayMode,
            riwaya,
            signal,
          });
      const fetchedAyahs = cachedData?.ayahs || ensureRequestedRiwaya(arabicData.ayahs || [], riwaya);
      const fallback = cachedData
        ? Boolean(cachedData.isWarshFallback)
        : Boolean(arabicData?.isTextFallback);
      return {
        arabicData,
        ayahs: fetchedAyahs,
        dataSource: cachedData?.dataSource || describeArabicDataSource(arabicData, riwaya),
        isWarshFallback: fallback,
        hafsPromise,
      };
    })();

    try {
      const { arabicData, ayahs: fetchedAyahs, dataSource: resolvedSource, isWarshFallback: fallback, hafsPromise } = await fetchPromise;

      if (signal.aborted || requestSeqRef.current !== requestId) return;
      if (arabicData) {
        assertWarshStrict({ arabicData, displayMode, lang, riwaya, warshStrictMode });
      }

      let resolvedAyahs = fetchedAyahs;
      let hafsSupportReady = !needsHafsSupport;
      if (hafsPromise) {
        const hafsData = await hafsPromise;
        if (signal.aborted || requestSeqRef.current !== requestId) return;
        if (hafsData) {
          const hafsAyahs = ensureRequestedRiwaya(hafsData.ayahs || [], "hafs");
          const hafsCacheKey = displayCacheKey(
            displayMode,
            currentSurah,
            currentPage,
            currentJuz,
            "hafs",
            false,
          );
          rememberLimited(
            DISPLAY_DATA_CACHE,
            hafsCacheKey,
            { ayahs: hafsAyahs, dataSource: describeArabicDataSource(hafsData, "hafs"), isWarshFallback: false },
            DISPLAY_DATA_CACHE_MAX,
          );
          const hafsMap = new Map(
            hafsAyahs.map((ayah) => [
              `${ayah.surah?.number}:${ayah.numberInSurah}`,
              ayah,
            ]),
          );
          resolvedAyahs = mergeHafsSupport(fetchedAyahs, hafsMap);
          hafsSupportReady = true;
        }
      }

      rememberLimited(
        DISPLAY_DATA_CACHE,
        cacheKey,
        { ayahs: resolvedAyahs, dataSource: resolvedSource, isWarshFallback: fallback, hafsSupportReady },
        DISPLAY_DATA_CACHE_MAX,
      );
      setAyahs(resolvedAyahs);
      setResolvedCacheKey(cacheKey);
      setSettledCacheKey(cacheKey);
      setIsWarshFallback(fallback);
      setDataSource(resolvedSource);
      dispatch({ type: "SET", payload: { loadedAyahCount: resolvedAyahs.length } });
      dispatch({ type: "SET_LOADING", payload: false });
      persistRef.current(resolvedAyahs);
    } catch (err) {
      if (err?.name === "AbortError" || requestSeqRef.current !== requestId) return;
      if (import.meta.env.DEV) console.warn("Fetch error:", err);
      setSettledCacheKey(cacheKey);
      setError("reader-load-failed");
      dispatch({ type: "SET_ERROR", payload: "reader-load-failed" });
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
    needsHafsSupport,
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

  const prefetchedCurrentData = DISPLAY_DATA_CACHE.get(currentCacheKey);
  const dataTransitioning =
    !showHome &&
    !prefetchedCurrentData &&
    settledCacheKey !== currentCacheKey;
  const visibleAyahs =
    resolvedCacheKey === currentCacheKey
      ? ayahs
      : prefetchedCurrentData?.ayahs || EMPTY_AYAHS;
  const visibleWarshFallback =
    resolvedCacheKey === currentCacheKey
      ? isWarshFallback
      : Boolean(prefetchedCurrentData?.isWarshFallback);
  const visibleDataSource =
    resolvedCacheKey === currentCacheKey
      ? dataSource
      : prefetchedCurrentData?.dataSource || null;

  return {
    ayahs: visibleAyahs,
    dataTransitioning,
    dataSource: visibleDataSource,
    error,
    fetchData,
    isWarshFallback: visibleWarshFallback,
    setError,
  };
}

export function preloadQuranDisplayData({
  currentJuz,
  currentPage,
  currentSurah,
  displayMode,
  lang = "fr",
  riwaya,
  warshStrictMode = true,
}) {
  const cacheKey = displayCacheKey(
    displayMode,
    currentSurah,
    currentPage,
    currentJuz,
    riwaya,
    warshStrictMode,
  );
  const cachedData = DISPLAY_DATA_CACHE.get(cacheKey);
  if (cachedData) return Promise.resolve(cachedData);

  const pending = DISPLAY_DATA_PREFETCHES.get(cacheKey);
  if (pending) return pending;

  const prefetch = (async () => {
    const arabicData = await loadArabicData({
      currentJuz,
      currentPage,
      currentSurah,
      displayMode,
      riwaya,
      signal: undefined,
    });
    const fetchedAyahs = ensureRequestedRiwaya(arabicData.ayahs || [], riwaya);
    assertWarshStrict({
      arabicData,
      displayMode,
      lang,
      riwaya,
      warshStrictMode,
    });
    const value = {
      ayahs: fetchedAyahs,
      dataSource: describeArabicDataSource(arabicData, riwaya),
      isWarshFallback: Boolean(arabicData?.isTextFallback),
    };
    rememberLimited(DISPLAY_DATA_CACHE, cacheKey, value, DISPLAY_DATA_CACHE_MAX);

    return value;
  })().finally(() => {
    DISPLAY_DATA_PREFETCHES.delete(cacheKey);
  });

  DISPLAY_DATA_PREFETCHES.set(cacheKey, prefetch);
  return prefetch;
}
