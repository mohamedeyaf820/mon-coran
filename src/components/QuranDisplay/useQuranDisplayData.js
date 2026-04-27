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

  useEffect(() => {
    if (showHome || !currentSurah || !currentAyah || displayMode !== "surah") return;
    return runWhenIdle(() => {
      markRead(currentSurah, currentAyah);
      const meta = getSurah(currentSurah);
      addRecentVisit(currentSurah, currentAyah, meta?.fr || meta?.en || "");
    });
  }, [currentAyah, currentSurah, displayMode, showHome]);

  const fetchData = useCallback(async () => {
    const signal = abortPendingRequests();
    dispatch({ type: "SET_LOADING", payload: true });
    setError(null);

    try {
      const arabicData = await loadArabicData({
        currentJuz,
        currentPage,
        currentSurah,
        displayMode,
        riwaya,
        signal,
      });

      if (signal.aborted) return;
      assertWarshStrict({ arabicData, displayMode, lang, riwaya, warshStrictMode });

      const fetchedAyahs = ensureRequestedRiwaya(arabicData.ayahs || [], riwaya);
      setAyahs(fetchedAyahs);
      setIsWarshFallback(Boolean(arabicData?.isTextFallback));
      dispatch({ type: "SET", payload: { loadedAyahCount: fetchedAyahs.length } });
      dispatch({ type: "SET_LOADING", payload: false });

      if (riwaya === "warsh") {
        loadHafsSupportData({ currentJuz, currentPage, currentSurah, displayMode, signal })
          .then((hafsData) => {
            if (signal.aborted) return;
            const hafsMap = new Map(
              (hafsData?.ayahs || []).map((ayah) => [
                `${ayah.surah?.number}:${ayah.numberInSurah}`,
                ayah.text,
              ]),
            );
            setAyahs((previous) =>
              previous.map((ayah) => {
                const hafsText = hafsMap.get(
                  `${ayah.surah?.number}:${ayah.numberInSurah}`,
                );
                return hafsText ? { ...ayah, hafsText } : ayah;
              }),
            );
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
      if (err?.name === "AbortError") return;
      console.error("Fetch error:", err);
      setError(err.message);
      dispatch({ type: "SET_ERROR", payload: err.message });
    } finally {
      if (!signal.aborted) dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [
    currentJuz,
    currentPage,
    currentSurah,
    dispatch,
    displayMode,
    lang,
    riwaya,
    warshStrictMode,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
