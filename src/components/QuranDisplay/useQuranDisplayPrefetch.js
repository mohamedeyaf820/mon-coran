import { useEffect, useRef } from "react";
import { shouldAvoidBackgroundWork } from "../../utils/networkPolicy";
import { preloadQuranDisplayData } from "./useQuranDisplayData";

/** Warm the bounded set of destinations exposed by the reader controls. */
export default function useQuranDisplayPrefetch({
  currentJuz,
  currentPage,
  currentSurah,
  displayMode,
  isPlaying,
  lang,
  loading,
  riwaya,
  warshStrictMode,
}) {
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

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
        isPlayingRef.current ||
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
        prefetchText("surah", currentSurah < 114 ? currentSurah + 1 : currentSurah - 1);
      } else if (displayMode === "page") {
        prefetchText("page", currentPage < 604 ? currentPage + 1 : currentPage - 1);
      } else if (displayMode === "juz") {
        prefetchText("juz", currentJuz < 30 ? currentJuz + 1 : currentJuz - 1);
      }
    };

    const neighbourTimer = window.setTimeout(runNeighbourPrefetch, 420);

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
