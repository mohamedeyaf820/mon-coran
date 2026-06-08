import { useEffect } from "react";
import {
  getJuz,
  getJuzTranslation,
  getPage,
  getPageTranslation,
  getSurahText,
  getSurahTranslation,
} from "../../services/quranAPI";
import { getWarshJuzVerses, getWarshPageVerses, preloadWarshSurah } from "../../services/warshService";

export default function useQuranDisplayPrefetch({
  currentJuz,
  currentPage,
  currentSurah,
  displayMode,
  loading,
  riwaya,
  showTranslation,
  translationLangs,
}) {
  useEffect(() => {
    if (loading) return;

    const connection = navigator.connection;
    const constrained =
      connection?.saveData === true || /2g|3g/.test(connection?.effectiveType || "");
    if (constrained) return;

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
      const alternateRiwaya = riwaya === "warsh" ? "hafs" : "warsh";
      prefetchText(
        displayMode,
        displayMode === "page" ? currentPage : displayMode === "juz" ? currentJuz : currentSurah,
        alternateRiwaya,
      );
    };

    const runNearbyPrefetch = () => {
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
      const alternateRiwaya = riwaya === "warsh" ? "hafs" : "warsh";

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
    const alternateTimer = window.setTimeout(runCurrentAlternatePrefetch, 240);
    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(runNearbyPrefetch, { timeout: 2400 });
      secondaryTimer = window.setTimeout(() => {
        window.requestIdleCallback(runSecondaryPrefetch, { timeout: 3600 });
      }, 1800);
      return () => {
        window.clearTimeout(alternateTimer);
        window.cancelIdleCallback?.(idleId);
        if (secondaryTimer) window.clearTimeout(secondaryTimer);
      };
    }

    const timer = window.setTimeout(runNearbyPrefetch, 1200);
    secondaryTimer = window.setTimeout(runSecondaryPrefetch, 3200);
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
