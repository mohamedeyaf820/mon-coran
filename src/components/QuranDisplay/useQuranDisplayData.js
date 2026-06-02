import { useCallback, useEffect, useRef, useState } from "react";
import { addRecentVisit } from "../../services/recentHistoryService";
import { logSession } from "../../services/historyService";
import { logWirdProgress } from "../../services/wirdService";
import { markRead } from "../../services/readingProgressService";
import { savePosition } from "../../services/storageService";
import { abortPendingRequests } from "../../services/quranAPI";
import { getSurah } from "../../data/surahs";
import {
  assertWarshStrict,
  ensureRequestedRiwaya,
  loadArabicData,
  loadHafsSupportData,
} from "./quranDisplayDataApi";

function runWhenIdle(callback) {
  if (typeof window === "undefined") {
    callback();
    return () => {};
  }

  if ("requestIdleCallback" in window) {
    const idleId = window.requestIdleCallback(callback, { timeout: 1600 });
    return () => window.cancelIdleCallback?.(idleId);
  }

  const timeoutId = window.setTimeout(callback, 0);
  return () => window.clearTimeout(timeoutId);
}

const DISPLAY_DATA_CACHE = new Map();
const DISPLAY_DATA_CACHE_MAX = 56;

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
  const [ayahs, setAyahs] = useState([]);
  const [error, setError] = useState(null);
  const [isWarshFallback, setIsWarshFallback] = useState(false);
  const readingStartRef = useRef(Date.now());
  const requestSeqRef = useRef(0);

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
      dispatch({ type: "SET_LOADING", payload: false });
      return;
    }

    const requestId = requestSeqRef.current + 1;
    requestSeqRef.current = requestId;
    const signal = abortPendingRequests();
    const cacheKey = displayCacheKey(displayMode, currentSurah, currentPage, currentJuz, riwaya, warshStrictMode);
    const cachedData = DISPLAY_DATA_CACHE.get(cacheKey);

    setError(null);
    if (cachedData) {
      setAyahs(cachedData.ayahs);
      setIsWarshFallback(Boolean(cachedData.isWarshFallback));
      dispatch({ type: "SET", payload: { loadedAyahCount: cachedData.ayahs.length } });
      dispatch({ type: "SET_LOADING", payload: false });
      return;
    }

    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const arabicData = await loadArabicData({
        currentJuz,
        currentPage,
        currentSurah,
        displayMode,
        riwaya,
        signal,
      });

      if (signal.aborted || requestSeqRef.current !== requestId) return;
      assertWarshStrict({ arabicData, displayMode, lang, riwaya, warshStrictMode });

      const fetchedAyahs = ensureRequestedRiwaya(arabicData.ayahs || [], riwaya);
      const fallback = Boolean(arabicData?.isTextFallback);
      rememberLimited(
        DISPLAY_DATA_CACHE,
        cacheKey,
        { ayahs: fetchedAyahs, isWarshFallback: fallback },
        DISPLAY_DATA_CACHE_MAX,
      );
      setAyahs(fetchedAyahs);
      setIsWarshFallback(fallback);
      dispatch({ type: "SET", payload: { loadedAyahCount: fetchedAyahs.length } });
      dispatch({ type: "SET_LOADING", payload: false });

      if (riwaya === "warsh") {
        loadHafsSupportData({ currentJuz, currentPage, currentSurah, displayMode, signal })
          .then((hafsData) => {
            if (signal.aborted || requestSeqRef.current !== requestId) return;
            const hafsMap = new Map(
              (hafsData?.ayahs || []).map((ayah) => [
                `${ayah.surah?.number}:${ayah.numberInSurah}`,
                ayah,
              ]),
            );
            setAyahs((previous) => {
              const merged = mergeHafsSupport(previous, hafsMap);
              rememberLimited(
                DISPLAY_DATA_CACHE,
                cacheKey,
                { ayahs: merged, isWarshFallback: fallback },
                DISPLAY_DATA_CACHE_MAX,
              );
              return merged;
            });
          })
          .catch(() => {});
      }

      const allAyahs = arabicData.ayahs || [];
      runWhenIdle(() => {
        const firstAyah = allAyahs[0];
        if (displayMode === "page") {
          savePosition(firstAyah?.surah?.number || currentSurah, firstAyah?.numberInSurah || 1, currentPage);
        } else if (firstAyah) {
          savePosition(firstAyah.surah?.number || currentSurah, 1, firstAyah.page);
        }

        if (allAyahs.length > 0) {
          const lastAyah = allAyahs[allAyahs.length - 1];
          const elapsed = Date.now() - readingStartRef.current;
          readingStartRef.current = Date.now();
          logSession({
            surah: firstAyah.surah?.number || currentSurah,
            ayahFrom: firstAyah.numberInSurah || 1,
            ayahTo: lastAyah.numberInSurah || firstAyah.numberInSurah || 1,
            page: currentPage,
            durationMs: elapsed,
          }).catch(() => {});
          logWirdProgress({
            surah: firstAyah.surah?.number || currentSurah,
            fromAyah: firstAyah.numberInSurah || 1,
            toAyah: lastAyah.numberInSurah || firstAyah.numberInSurah || 1,
            pagesCount: displayMode === "page" ? 1 : Math.ceil(allAyahs.length / 15),
          }).catch(() => {});
        }
      });
    } catch (err) {
      if (err?.name === "AbortError" || requestSeqRef.current !== requestId) return;
      console.error("Fetch error:", err);
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

  return { ayahs, error, fetchData, isWarshFallback, setError };
}
