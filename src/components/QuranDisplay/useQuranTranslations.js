import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import {
  getJuzTranslation,
  getPageTranslation,
  getSurahTranslation,
} from "../../services/quranAPI";
import { getTranslationKeyForAyah } from "./displayHelpers";

export default function useQuranTranslations({
  arabicReady = true,
  currentJuz,
  currentPage,
  currentSurah,
  displayMode,
  showTranslation,
  translationLangs,
}) {
  const [translations, setTranslations] = useState([]);
  const [translationState, setTranslationState] = useState("idle");
  const [translationSource, setTranslationSource] = useState(null);

  useEffect(() => {
    if (!showTranslation) {
      setTranslations([]);
      setTranslationState("idle");
      setTranslationSource(null);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;
    setTranslations([]);
    setTranslationState("loading");

    const loadTranslations = async () => {
      try {
        const result =
          displayMode === "page"
            ? await getPageTranslation(currentPage, translationLangs, signal)
            : displayMode === "juz"
              ? await getJuzTranslation(currentJuz, translationLangs, signal)
              : await getSurahTranslation(currentSurah, translationLangs, signal);
        if (!signal.aborted) {
          const source = result?.some?.((edition) => edition?.source === "quran.com")
            ? "Quran.com API"
            : "AlQuran Cloud";
          startTransition(() => {
            if (!signal.aborted) {
              setTranslations(result || []);
              setTranslationSource(source);
              setTranslationState(result?.length ? "ready" : "error");
            }
          });
        }
      } catch (error) {
        if (error?.name !== "AbortError") {
          setTranslations([]);
          setTranslationSource("AlQuran Cloud / Quran.com API");
          setTranslationState("error");
        }
      }
    };

    loadTranslations();
    return () => {
      controller.abort();
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
        editionAyahs[0]?.surah?.number ?? currentSurah;

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

  return { getTranslationForAyah, translations, translationSource, translationState };
}
