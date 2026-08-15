import { useEffect } from "react";
import { shouldAvoidBackgroundWork } from "../../utils/networkPolicy";
import { preloadQuranDisplayData } from "./useQuranDisplayData";

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
    if (loading || shouldAvoidBackgroundWork()) return undefined;

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
        shouldAvoidBackgroundWork()
      ) {
        return false;
      }
      return true;
    };

    const runNeighbourPrefetch = () => {
      if (!canPrefetch()) return;
      if (displayMode === "surah") {
        if (currentSurah < 114) prefetchText("surah", currentSurah + 1);
        if (currentSurah > 1) prefetchText("surah", currentSurah - 1);
      } else if (displayMode === "page") {
        if (currentPage < 604) prefetchText("page", currentPage + 1);
        if (currentPage > 1) prefetchText("page", currentPage - 1);
      } else if (displayMode === "juz") {
        if (currentJuz < 30) prefetchText("juz", currentJuz + 1);
        if (currentJuz > 1) prefetchText("juz", currentJuz - 1);
      }
    };

    const neighbourTimer = window.setTimeout(runNeighbourPrefetch, 150);

    return () => {
      window.clearTimeout(neighbourTimer);
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
