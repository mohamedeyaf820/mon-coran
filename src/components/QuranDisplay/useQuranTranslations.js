import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getJuzTranslation,
  getPageTranslation,
  getSurahTranslation,
} from "../../services/quranAPI";
import { getTranslationKeyForAyah } from "./displayHelpers";

function scheduleIdle(callback) {
  if (typeof window === "undefined") {
    callback();
    return () => {};
  }

  if ("requestIdleCallback" in window) {
    const idleId = window.requestIdleCallback(callback, { timeout: 1800 });
    return () => window.cancelIdleCallback?.(idleId);
  }

  const timeoutId = window.setTimeout(callback, 0);
  return () => window.clearTimeout(timeoutId);
}

export default function useQuranTranslations({
  currentJuz,
  currentPage,
  currentSurah,
  displayMode,
  showTranslation,
  translationLangs,
}) {
  const [translations, setTranslations] = useState([]);

  useEffect(() => {
    if (!showTranslation) {
      setTranslations([]);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;
    let cancelIdle = () => {};
    setTranslations([]);

    const loadTranslations = async () => {
      try {
        const result =
          displayMode === "page"
            ? await getPageTranslation(currentPage, translationLangs, signal)
            : displayMode === "juz"
              ? await getJuzTranslation(currentJuz, translationLangs, signal)
              : await getSurahTranslation(currentSurah, translationLangs, signal);
        if (!signal.aborted) {
          cancelIdle = scheduleIdle(() => {
            if (!signal.aborted) setTranslations(result || []);
          });
        }
      } catch (error) {
        if (error?.name !== "AbortError") setTranslations([]);
      }
    };

    loadTranslations();
    return () => {
      controller.abort();
      cancelIdle();
    };
  }, [
    currentJuz,
    currentPage,
    currentSurah,
    displayMode,
    showTranslation,
    translationLangs,
  ]);

  const translationMap = useMemo(() => {
    const map = new Map();

    translations.forEach((edition) => {
      const editionAyahs = edition.ayahs || [];
      const inferredSurah =
        editionAyahs[0]?.surah?.number != null ? null : currentSurah;

      editionAyahs.forEach((translation) => {
        const surahNumber = translation.surah?.number ?? inferredSurah;
        const ayahKey = getTranslationKeyForAyah(
          surahNumber,
          translation.numberInSurah,
        );
        const globalKey =
          typeof translation.number === "number"
            ? `global:${translation.number}`
            : null;

        if (ayahKey) map.set(ayahKey, [...(map.get(ayahKey) || []), translation]);
        if (globalKey) {
          map.set(globalKey, [...(map.get(globalKey) || []), translation]);
        }
      });
    });

    return map;
  }, [currentSurah, translations]);

  const getTranslationForAyah = useCallback(
    (ayah) =>
      translationMap.get(`global:${ayah.number}`) ||
      translationMap.get(
        getTranslationKeyForAyah(
          ayah.surah?.number || currentSurah,
          ayah.numberInSurah,
        ),
      ) ||
      null,
    [currentSurah, translationMap],
  );

  return { getTranslationForAyah, translations };
}
