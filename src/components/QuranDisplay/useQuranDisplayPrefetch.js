import { useEffect } from "react";
import {
  getJuz,
  getJuzTranslation,
  getPage,
  getPageTranslation,
  getSurahText,
  getSurahTranslation,
} from "../../services/quranAPI";
import { getWarshJuzVerses, preloadWarshSurah } from "../../services/warshService";

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
      connection?.saveData === true || /2g/.test(connection?.effectiveType || "");
    if (constrained) return;

    const translationLang = translationLangs[0] || "fr";
    const runPrefetch = () => {
      if (displayMode === "surah") {
        const next = currentSurah + 1;
        const previous = currentSurah - 1;
        if (riwaya === "warsh") {
          if (next <= 114) preloadWarshSurah(next);
          if (previous >= 1) preloadWarshSurah(previous);
        } else {
          if (next <= 114) getSurahText(next, riwaya).catch(() => {});
          if (previous >= 1) getSurahText(previous, riwaya).catch(() => {});
        }
        if (showTranslation && next <= 114) getSurahTranslation(next, translationLang).catch(() => {});
        if (showTranslation && previous >= 1) getSurahTranslation(previous, translationLang).catch(() => {});
      }

      if (displayMode === "page") {
        [currentPage - 1, currentPage + 1].forEach((page) => {
          if (page < 1 || page > 604) return;
          getPage(page, "hafs").catch(() => {});
          if (showTranslation) getPageTranslation(page, translationLang).catch(() => {});
        });
      }

      if (displayMode === "juz") {
        [currentJuz - 1, currentJuz + 1].forEach((juz) => {
          if (juz < 1 || juz > 30) return;
          (riwaya === "warsh" ? getWarshJuzVerses(juz) : getJuz(juz, riwaya)).catch(() => {});
          if (showTranslation) getJuzTranslation(juz, translationLang).catch(() => {});
        });
      }
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(runPrefetch, { timeout: 1200 });
      return () => window.cancelIdleCallback?.(idleId);
    }

    const timer = window.setTimeout(runPrefetch, 350);
    return () => window.clearTimeout(timer);
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
