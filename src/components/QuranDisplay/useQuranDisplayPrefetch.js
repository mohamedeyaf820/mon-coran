import { useEffect, useRef } from "react";
import {
  getJuz,
  getJuzTranslation,
  getPage,
  getPageTranslation,
  getSurahText,
  getSurahTranslation,
} from "../../services/quranAPI";
import { getWarshJuzVerses, getWarshPageVerses, preloadWarshSurah } from "../../services/warshService";
import { shouldAvoidBackgroundWork } from "../../utils/networkPolicy";

export default function useQuranDisplayPrefetch({
  currentJuz,
  currentPage,
  currentSurah,
  displayMode,
  isPlaying,
  loading,
  riwaya,
  showTranslation,
  translationLangs,
}) {
  // Keep isPlaying in a ref so the guard stays fresh without restarting all prefetch
  // timers on every play/pause event (would spam requests on rapid toggle).
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  useEffect(() => {
    if (loading) return;

    if (shouldAvoidBackgroundWork()) return;

    // Skip all prefetching during audio playback to avoid competing with streaming.
    // Read from ref so this guard stays current even after play/pause without restarting timers.
    if (isPlayingRef.current) return;

    const translationLang = translationLangs[0] || "fr";
    const prefetchText = (mode, value, targetRiwaya) => {
      if (mode === "surah") {
        if (targetRiwaya === "warsh") preloadWarshSurah(value);
        else getSurahText(value, targetRiwaya).catch(() => {});
        return;
      }
      if (mode === "page") {
        (targetRiwaya === "warsh" ? getWarshPageVerses(value) : getPage(value, targetRiwaya)).catch(() => {});
        return;
      }
      if (mode === "juz") {
        (targetRiwaya === "warsh" ? getWarshJuzVerses(value) : getJuz(value, targetRiwaya)).catch(() => {});
      }
    };

    const runCurrentAlternatePrefetch = () => {
      if (isPlayingRef.current) return;
      const alternateRiwaya = riwaya === "warsh" ? "hafs" : "warsh";
      prefetchText(
        displayMode,
        displayMode === "page" ? currentPage : displayMode === "juz" ? currentJuz : currentSurah,
        alternateRiwaya,
      );
    };

    const runNearbyPrefetch = () => {
      if (isPlayingRef.current) return;
      if (displayMode === "surah") {
        [currentSurah - 1, currentSurah + 1].forEach((surah) => {
          if (surah < 1 || surah > 114) return;
          prefetchText("surah", surah, riwaya);
        });
      }

      if (displayMode === "page") {
        [currentPage - 1, currentPage + 1].forEach((page) => {
          if (page < 1 || page > 604) return;
          prefetchText("page", page, riwaya);
        });
      }

      if (displayMode === "juz") {
        [currentJuz - 1, currentJuz + 1].forEach((juz) => {
          if (juz < 1 || juz > 30) return;
          prefetchText("juz", juz, riwaya);
        });
      }
    };

    const runSecondaryPrefetch = () => {
      if (isPlayingRef.current) return;

      if (displayMode === "surah") {
        const next = currentSurah + 1;
        const previous = currentSurah - 1;
        if (showTranslation && next <= 114) getSurahTranslation(next, translationLang).catch(() => {});
        if (showTranslation && previous >= 1) getSurahTranslation(previous, translationLang).catch(() => {});
      }

      if (displayMode === "page") {
        [currentPage - 1, currentPage + 1].forEach((page) => {
          if (page < 1 || page > 604) return;
          if (showTranslation) getPageTranslation(page, translationLang).catch(() => {});
        });
      }

      if (displayMode === "juz") {
        [currentJuz - 1, currentJuz + 1].forEach((juz) => {
          if (juz < 1 || juz > 30) return;
          if (showTranslation) getJuzTranslation(juz, translationLang).catch(() => {});
        });
      }
    };

    let secondaryTimer = null;
    let secondaryIdleId = null;
    // Alternate riwaya is intentionally last so adjacent navigation wins.
    const alternateTimer = window.setTimeout(runCurrentAlternatePrefetch, 1800);
    if (typeof window.requestIdleCallback === "function") {
      // Warm the most likely previous/next navigation during the first idle slot.
      const idleId = window.requestIdleCallback(runNearbyPrefetch, { timeout: 1200 });
      secondaryTimer = window.setTimeout(() => {
        secondaryIdleId = window.requestIdleCallback(runSecondaryPrefetch, {
          timeout: 2600,
        });
      }, 1400);
      return () => {
        window.clearTimeout(alternateTimer);
        window.cancelIdleCallback?.(idleId);
        if (secondaryIdleId) window.cancelIdleCallback?.(secondaryIdleId);
        if (secondaryTimer) window.clearTimeout(secondaryTimer);
      };
    }

    const timer = window.setTimeout(runNearbyPrefetch, 900);
    secondaryTimer = window.setTimeout(runSecondaryPrefetch, 2200);
    return () => {
      window.clearTimeout(alternateTimer);
      window.clearTimeout(timer);
      if (secondaryTimer) window.clearTimeout(secondaryTimer);
    };
  }, [
    currentJuz,
    currentPage,
    currentSurah,
    displayMode,
    loading,
    riwaya,
    showTranslation,
    translationLangs,
  ]);
}
