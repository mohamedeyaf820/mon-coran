import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ensureReciterForRiwaya,
  getReciter,
  isWarshVerifiedReciter,
} from "../../data/reciters";
import { t } from "../../i18n";
import audioService from "../../services/audioService";
import { getAudioTimingsForAyahs } from "../../services/quranComAudioTimingService";
import { getSurahText } from "../../services/quranAPI";
import { getWarshSurahFormatted } from "../../services/warshService";

function toPlaylistAyahs(ayahs, currentSurah, timingMap = new Map()) {
  return (Array.isArray(ayahs) ? ayahs : []).map((ayah) => ({
    surah: ayah.surah?.number || currentSurah,
    numberInSurah: ayah.numberInSurah,
    number: ayah.number,
    text: ayah.text,
    quranComAudioTiming: timingMap.get(`${ayah.surah?.number || currentSurah}:${ayah.numberInSurah}`) || null,
  }));
}

function extractAyahs(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.ayahs)) return payload.ayahs;
  if (Array.isArray(payload?.data?.ayahs)) return payload.data.ayahs;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export default function useQuranDisplayAudio({
  ayahs,
  currentJuz,
  currentPage,
  currentSurah,
  continuousPlay,
  displayMode,
  dispatch,
  lang,
  reciter,
  riwaya,
  set,
  setError,
  warshStrictMode,
}) {
  const [preparingSurah, setPreparingSurah] = useState(null);
  const [audioTimingMap, setAudioTimingMap] = useState(new Map());
  const continuousAutoPlayRef = useRef(false);
  const audioPlaylistKey = useMemo(
    () =>
      ayahs
        .map((ayah) => `${ayah.surah?.number || currentSurah}:${ayah.numberInSurah}:${ayah.number}`)
        .join("|"),
    [ayahs, currentSurah],
  );

  useEffect(() => {
    if (!continuousPlay) return;
    return audioService.addEndListener(() => {
      if (displayMode === "surah" && currentSurah < 114) {
        continuousAutoPlayRef.current = true;
        dispatch({ type: "NAVIGATE_SURAH", payload: { surah: currentSurah + 1, ayah: 1 } });
      } else if (displayMode === "juz" && currentJuz < 30) {
        continuousAutoPlayRef.current = true;
        dispatch({ type: "NAVIGATE_JUZ", payload: { juz: currentJuz + 1 } });
      } else if (displayMode === "page" && currentPage < 604) {
        continuousAutoPlayRef.current = true;
        set({ currentPage: currentPage + 1 });
      }
    });
  }, [continuousPlay, currentJuz, currentPage, currentSurah, dispatch, displayMode, set]);

  useEffect(() => {
    if (!continuousPlay) continuousAutoPlayRef.current = false;
  }, [continuousPlay]);

  useEffect(() => {
    if (ayahs.length === 0 || !reciter) return;

    const safeReciterId = ensureReciterForRiwaya(reciter, riwaya);
    const currentReciter = getReciter(safeReciterId, riwaya);
    if (!currentReciter) return;
    if (riwaya === "warsh" && warshStrictMode && !isWarshVerifiedReciter(currentReciter)) {
      setError(t("errors.warshStrict", lang));
      return;
    }

    audioService.loadPlaylist(
      toPlaylistAyahs(ayahs, currentSurah, audioTimingMap),
      currentReciter.cdn,
      currentReciter.cdnType || "islamic",
    );

    if (continuousAutoPlayRef.current && continuousPlay) {
      continuousAutoPlayRef.current = false;
      audioService.play();
    }
  }, [
    audioPlaylistKey,
    audioTimingMap,
    ayahs,
    continuousPlay,
    currentSurah,
    lang,
    reciter,
    riwaya,
    setError,
    warshStrictMode,
  ]);

  useEffect(() => {
    let cancelled = false;
    const safeReciterId = ensureReciterForRiwaya(reciter, riwaya);

    if (riwaya !== "hafs" || ayahs.length === 0) {
      setAudioTimingMap(new Map());
      return () => {
        cancelled = true;
      };
    }

    getAudioTimingsForAyahs(safeReciterId, ayahs)
      .then((map) => {
        if (!cancelled) setAudioTimingMap(map);
      })
      .catch(() => {
        if (!cancelled) setAudioTimingMap(new Map());
      });

    return () => {
      cancelled = true;
    };
  }, [audioPlaylistKey, ayahs, reciter, riwaya]);

  const playSurah = useCallback(() => {
    const currentReciter = getReciter(ensureReciterForRiwaya(reciter, riwaya), riwaya);
    if (!currentReciter || ayahs.length === 0) return;
    if (riwaya === "warsh" && warshStrictMode && !isWarshVerifiedReciter(currentReciter)) {
      setError(t("errors.warshStrict", lang));
      return;
    }
    audioService.loadPlaylist(
      toPlaylistAyahs(ayahs, currentSurah, audioTimingMap),
      currentReciter.cdn,
      currentReciter.cdnType || "islamic",
    );
    audioService.play();
  }, [audioTimingMap, ayahs, currentSurah, lang, reciter, riwaya, setError, warshStrictMode]);

  const playSpecificSurah = useCallback(async (surahNumber) => {
    if (!surahNumber || preparingSurah === surahNumber) return;

    const currentReciter = getReciter(ensureReciterForRiwaya(reciter, riwaya), riwaya);
    if (!currentReciter) return;
    if (riwaya === "warsh" && warshStrictMode && !isWarshVerifiedReciter(currentReciter)) {
      setError(t("errors.warshStrict", lang));
      return;
    }

    setPreparingSurah(surahNumber);
    setError(null);

    try {
      let surahData;
      if (riwaya === "warsh") {
        surahData = await getWarshSurahFormatted(surahNumber).catch(() =>
          getSurahText(surahNumber, "hafs"),
        );
      } else {
        surahData = await getSurahText(surahNumber, riwaya);
      }

      const sourceAyahs = extractAyahs(surahData);
      const timingMap =
        riwaya === "hafs"
          ? await getAudioTimingsForAyahs(currentReciter.id || ensureReciterForRiwaya(reciter, riwaya), sourceAyahs)
          : new Map();
      const playlistAyahs = toPlaylistAyahs(sourceAyahs, surahNumber, timingMap);
      if (playlistAyahs.length === 0) {
        setError(
          lang === "fr"
            ? "Impossible de preparer la sourate pour la recitation."
            : "Unable to prepare this surah for playback.",
        );
        return;
      }

      audioService.loadPlaylist(
        playlistAyahs,
        currentReciter.cdn,
        currentReciter.cdnType || "islamic",
      );
      audioService.play();
    } catch {
      setError(
        lang === "fr"
          ? "Une erreur est survenue pendant la preparation audio."
          : "An error occurred while preparing audio playback.",
      );
    } finally {
      setPreparingSurah(null);
    }
  }, [lang, preparingSurah, reciter, riwaya, setError, warshStrictMode]);

  useEffect(() => {
    const handler = () => playSurah();
    window.addEventListener("mushaf:play-surah", handler);
    return () => window.removeEventListener("mushaf:play-surah", handler);
  }, [playSurah]);

  return { playSpecificSurah, playSurah, preparingSurah };
}
