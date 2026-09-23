import { useCallback, useEffect, useRef, useState } from "react";
import { savePosition } from "../../services/storageService";
import { hafsNumbersForAyah } from "../../constants/warshSource";
import { isWarshNumberedAyah } from "./displayHelpers";
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

function attachWarshHafsMapping(ayahs, riwaya) {
  if (riwaya !== "warsh") return ayahs;
  // Tafsir, bookmarks and notes are Hafs-keyed, so every Warsh verse object
  // must carry its mapping — including on layouts that skip the Hafs support
  // payload below (needsHafsSupport is false there).
  return ayahs.map((ayah) => {
    if (Array.isArray(ayah?.hafsNumbers)) return ayah;
    if (!isWarshNumberedAyah(ayah)) return ayah;
    const hafsNumbers = hafsNumbersForAyah(ayah, riwaya);
    if (!hafsNumbers?.length) return ayah;
    return { ...ayah, hafsNumbers, hafsNumber: hafsNumbers[0] };
  });
}

function mergeHafsSupport(ayahs, hafsMap, riwaya) {
  if (!hafsMap?.size) return ayahs;
  const isWarsh = riwaya === "warsh";
  return ayahs.map((ayah) => {
    // The Hafs support payload (quran.com text, word-by-word, transliteration)
    // is keyed on Hafs numbers, while a Warsh reader shows Madinah-mushaf
    // numbers: 6214 ayahs against 6236 Hafs, with 50 surahs split differently.
    // Joining on the raw numberInSurah therefore attaches the neighbouring
    // verse from the first divergence point on (Warsh 2:2 recites Hafs 3).
    // A verse the mapping cannot place stays un-enriched rather than showing
    // another verse's data. See src/data/warshHafsNumbering.js.
    const hafsNumbers = hafsNumbersForAyah(ayah, riwaya);
    const surahNumber = ayah.surah?.number;
    const hafsAyah =
      hafsNumbers?.length && surahNumber != null
        ? hafsMap.get(`${surahNumber}:${hafsNumbers[0]}`)
        : null;

    if (!hafsAyah) return ayah;

    return {
      ...ayah,
      number: ayah.number ?? hafsAyah.number,
      page: ayah.page ?? hafsAyah.page,
      juz: ayah.juz ?? hafsAyah.juz,
      hafsText: hafsAyah.text,
      ...(isWarsh
        ? {
            hafsNumbers,
            hafsNumber: hafsNumbers[0],
          }
        : {}),
      hafsSupport: {
        text: hafsAyah.text,
        quranCom: hafsAyah.quranCom || null,
        words: Array.isArray(hafsAyah.words) ? hafsAyah.words : [],
      },
    };
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
    let cachedData = DISPLAY_DATA_CACHE.get(cacheKey);

    setError(null);
    if (cachedData) {
      setAyahs(cachedData.ayahs);
      setResolvedCacheKey(cacheKey);
      setSettledCacheKey(cacheKey);
      setIsWarshFallback(Boolean(cachedData.isWarshFallback));
      setDataSource(cachedData.dataSource || null);
      dispatch({ type: "SET", payload: { loadedAyahCount: cachedData.ayahs.length } });
      dispatch({ type: "SET_LOADING", payload: false });
      persistRef.current(cachedData.ayahs);
      if (!needsHafsSupport || cachedData.hafsSupportReady) return;
    }

    if (!cachedData) dispatch({ type: "SET_LOADING", payload: true });

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
        if (!needsHafsSupport || prefetchedData.hafsSupportReady) return;
        cachedData = prefetchedData;
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
      const fetchedAyahs = attachWarshHafsMapping(
        cachedData?.ayahs || ensureRequestedRiwaya(arabicData.ayahs || [], riwaya),
        riwaya,
      );
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

      // The requested Quran text is already verified. Optional Hafs metadata
      // (translations, word support) can arrive later without holding it back.
      rememberLimited(
        DISPLAY_DATA_CACHE,
        cacheKey,
        { ayahs: fetchedAyahs, dataSource: resolvedSource, isWarshFallback: fallback, hafsSupportReady: !needsHafsSupport },
        DISPLAY_DATA_CACHE_MAX,
      );
      setAyahs(fetchedAyahs);
      setResolvedCacheKey(cacheKey);
      setSettledCacheKey(cacheKey);
      setIsWarshFallback(fallback);
      setDataSource(resolvedSource);
      dispatch({ type: "SET", payload: { loadedAyahCount: fetchedAyahs.length } });
      dispatch({ type: "SET_LOADING", payload: false });
      persistRef.current(fetchedAyahs);

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
          const resolvedAyahs = mergeHafsSupport(fetchedAyahs, hafsMap, riwaya);
          rememberLimited(
            DISPLAY_DATA_CACHE,
            cacheKey,
            { ayahs: resolvedAyahs, dataSource: resolvedSource, isWarshFallback: fallback, hafsSupportReady: true },
            DISPLAY_DATA_CACHE_MAX,
          );
          setAyahs(resolvedAyahs);
        }
      }
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
    const fetchedAyahs = attachWarshHafsMapping(
      ensureRequestedRiwaya(arabicData.ayahs || [], riwaya),
      riwaya,
    );
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
