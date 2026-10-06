import { useEffect } from "react";
import { runWhenIdle } from "../../utils/idleUtils";
import {
  isLowPerformanceDevice,
  shouldSkipSpeculativePrefetch,
} from "../../utils/networkPolicy";
import { preloadQuranDisplayData } from "./useQuranDisplayData";

// Warming a neighbour parses and stores up to a few megabytes of JSON, so it
// only starts once the reader has settled and the main thread is idle: on a
// phone it otherwise lands in the middle of the first scroll.
const NEIGHBOUR_PREFETCH_DELAY_MS = 1500;
const NEIGHBOUR_PREFETCH_IDLE_TIMEOUT_MS = 5000;

/** Warm the bounded set of destinations exposed by the reader controls. */
export default function useQuranDisplayPrefetch({
  currentJuz,
  currentPage,
  currentSurah,
  displayMode,
  lang,
  loading,
  riwaya,
  warshStrictMode,
}) {
  useEffect(() => {
    if (loading || shouldSkipSpeculativePrefetch()) return undefined;

    const prefetchText = (mode, value) => {
      preloadQuranDisplayData({
        currentJuz: mode === "juz" ? value : currentJuz,
        currentPage: mode === "page" ? value : currentPage,
        currentSurah: mode === "surah" ? value : currentSurah,
        displayMode: mode,
        lang,
        riwaya,
        warshStrictMode,
      }).catch(() => null);
    };

    const canPrefetch = () => {
      if (
        document.visibilityState !== "visible" ||
        shouldSkipSpeculativePrefetch()
      ) {
        return false;
      }
      return true;
    };

    const runNeighbourPrefetch = () => {
      if (!canPrefetch()) return;
      // Reading goes forward far more often than back: a constrained device
      // keeps only the next destination warm.
      const forwardOnly = isLowPerformanceDevice();
      if (displayMode === "surah") {
        if (currentSurah < 114) prefetchText("surah", currentSurah + 1);
        if (!forwardOnly && currentSurah > 1) prefetchText("surah", currentSurah - 1);
      } else if (displayMode === "page") {
        if (currentPage < 604) prefetchText("page", currentPage + 1);
        if (!forwardOnly && currentPage > 1) prefetchText("page", currentPage - 1);
      } else if (displayMode === "juz") {
        if (currentJuz < 30) prefetchText("juz", currentJuz + 1);
        if (!forwardOnly && currentJuz > 1) prefetchText("juz", currentJuz - 1);
      }
    };

    let cancelIdle = () => {};
    const neighbourTimer = window.setTimeout(() => {
      cancelIdle = runWhenIdle(runNeighbourPrefetch, NEIGHBOUR_PREFETCH_IDLE_TIMEOUT_MS);
    }, NEIGHBOUR_PREFETCH_DELAY_MS);

    return () => {
      window.clearTimeout(neighbourTimer);
      cancelIdle();
    };
  }, [
    currentJuz,
    currentPage,
    currentSurah,
    displayMode,
    lang,
    loading,
    riwaya,
    warshStrictMode,
  ]);
}
