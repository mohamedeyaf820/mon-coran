import { useEffect, useRef } from "react";
import { getJuz, getPage, getSurahText } from "../../services/quranAPI";
import {
  getWarshJuzVerses,
  getWarshPageVerses,
  preloadWarshSurah,
} from "../../services/warshService";
import { shouldAvoidBackgroundWork } from "../../utils/networkPolicy";

/**
 * Warm a single likely forward navigation after the reader is fully settled.
 *
 * Loading the alternate riwaya, both neighbours and their translations during
 * the first seconds produced dozens of requests and competed with audio. The
 * active screen remains the only priority during startup.
 */
export default function useQuranDisplayPrefetch({
  currentJuz,
  currentPage,
  currentSurah,
  displayMode,
  isPlaying,
  loading,
  riwaya,
}) {
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    if (loading || shouldAvoidBackgroundWork()) return undefined;

    const prefetchText = (mode, value) => {
      if (mode === "surah") {
        if (riwaya === "warsh") preloadWarshSurah(value);
        else getSurahText(value, riwaya).catch(() => {});
        return;
      }
      if (mode === "page") {
        (riwaya === "warsh"
          ? getWarshPageVerses(value)
          : getPage(value, riwaya)
        ).catch(() => {});
        return;
      }
      if (mode === "juz") {
        (riwaya === "warsh"
          ? getWarshJuzVerses(value)
          : getJuz(value, riwaya)
        ).catch(() => {});
      }
    };

    const runNextPrefetch = () => {
      if (
        isPlayingRef.current ||
        document.visibilityState !== "visible" ||
        shouldAvoidBackgroundWork()
      ) {
        return;
      }

      if (displayMode === "surah" && currentSurah < 114) {
        prefetchText("surah", currentSurah + 1);
      } else if (displayMode === "page" && currentPage < 604) {
        prefetchText("page", currentPage + 1);
      } else if (displayMode === "juz" && currentJuz < 30) {
        prefetchText("juz", currentJuz + 1);
      }
    };

    let idleId = null;
    const timer = window.setTimeout(() => {
      if (isPlayingRef.current) return;
      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(runNextPrefetch, { timeout: 3000 });
      } else {
        runNextPrefetch();
      }
    }, 8000);

    return () => {
      window.clearTimeout(timer);
      if (idleId !== null) window.cancelIdleCallback?.(idleId);
    };
  }, [
    currentJuz,
    currentPage,
    currentSurah,
    displayMode,
    loading,
    riwaya,
  ]);
}
