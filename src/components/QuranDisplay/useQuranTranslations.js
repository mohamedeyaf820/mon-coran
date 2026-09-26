import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import {
  getJuzTranslation,
  getPageTranslation,
  getSurahTranslation,
} from "../../services/quranAPI";
import {
  getTranslationKeyForAyah,
  getWarshTranslationKeyForAyah,
  isWarshNumberedAyah,
} from "./displayHelpers";

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
  // Bumped by the strip's retry control: the effect below owns the request
  // lifecycle (abort on unmount, ignore late answers), so a retry is a new
  // pass through it rather than a second unguarded fetch.
  const [retryToken, setRetryToken] = useState(0);
  const retryTranslations = useCallback(() => {
    startTransition(() => setRetryToken((token) => token + 1));
  }, []);

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
    retryToken,
    showTranslation,
    translationLangs,
  ]);

  const translationMap = useMemo(() => {
    const map = new Map();

    translations.forEach((edition) => {
      const editionAyahs = edition.ayahs || [];
      const inferredSurah =
        editionAyahs[0]?.surah?.number ?? currentSurah;
      // A Warsh-adapted edition is numbered by the Warsh mushaf: its verse 253
      // is not Hafs 253. It therefore lives in its own key namespace.
      const isWarshEdition = edition.riwaya === "warsh" || edition.edition?.riwaya === "warsh";

      editionAyahs.forEach((translation) => {
        const surahNumber = translation.surah?.number ?? inferredSurah;
        const ayahKey = isWarshEdition
          ? getWarshTranslationKeyForAyah(surahNumber, translation.numberInSurah)
          : getTranslationKeyForAyah(surahNumber, translation.numberInSurah);
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
    (ayah) => {
      const surahNumber = ayah.surah?.number || currentSurah;
      const matched = [];

      if (isWarshNumberedAyah(ayah)) {
        const warshEditions = translationMap.get(
          getWarshTranslationKeyForAyah(surahNumber, ayah.numberInSurah),
        );
        if (warshEditions) matched.push(...warshEditions);
      }

      const hafsNumbers = ayah?.hafsNumbers;
      if (Array.isArray(hafsNumbers) && hafsNumbers.length > 0) {
        for (const hafsNumber of hafsNumbers) {
          const found = translationMap.get(
            getTranslationKeyForAyah(surahNumber, hafsNumber),
          );
          if (found) matched.push(...found);
        }
        return matched.length ? matched : null;
      }

      const direct =
        translationMap.get(`global:${ayah.number}`) ||
        translationMap.get(getTranslationKeyForAyah(surahNumber, ayah.numberInSurah));

      if (direct) return [...matched, ...direct];
      return matched.length ? matched : null;
    },
    [currentSurah, translationMap],
  );

  return {
    getTranslationForAyah,
    retryTranslations,
    translations,
    translationSource,
    translationState,
  };
}
