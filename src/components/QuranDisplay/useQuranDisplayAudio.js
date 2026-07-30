import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ensureReciterForRiwaya,
  getReciter,
  isWarshVerifiedReciter,
} from "../../data/reciters";
import { t } from "../../i18n";
import audioService from "../../services/audioService";
import { getAudioTimingsForAyahs } from "../../services/quranComAudioTimingService";
import {
  getReadingAudioScopeKey,
  isPlaylistEndForActiveScope,
} from "../../utils/audioNavigationScope";
import { buildSurahAudioPlaylist } from "../../utils/audioPlaylist";

function toPlaylistAyahs(ayahs, currentSurah, timingMap = new Map()) {
  return (Array.isArray(ayahs) ? ayahs : []).map((ayah) => ({
    surah: ayah.surah?.number || currentSurah,
    numberInSurah: ayah.numberInSurah,
    number: ayah.number,
    text: ayah.text,
    quranComAudioTiming: timingMap.get(`${ayah.surah?.number || currentSurah}:${ayah.numberInSurah}`) || null,
  }));
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
  const playbackNavigationRef = useRef(null);
  const activePlaylistScopeRef = useRef(null);
  const readingScopeKey = useMemo(
    () =>
      getReadingAudioScopeKey({
        currentJuz,
        currentPage,
        currentSurah,
        displayMode,
      }),
    [currentJuz, currentPage, currentSurah, displayMode],
  );
  playbackNavigationRef.current = {
    continuousPlay,
    currentJuz,
    currentPage,
    currentSurah,
    dispatch,
    displayMode,
    readingScopeKey,
    set,
  };
  const audioPlaylistKey = useMemo(
    () =>
      ayahs
        .map((ayah) => `${ayah.surah?.number || currentSurah}:${ayah.numberInSurah}:${ayah.number}`)
        .join("|"),
    [ayahs, currentSurah],
  );

  useEffect(() => {
    return audioService.addEndListener(() => {
      const {
        continuousPlay: shouldContinue,
        currentJuz: activeJuz,
        currentPage: activePage,
        currentSurah: activeSurah,
        dispatch: navigate,
        displayMode: activeMode,
        readingScopeKey: activeScopeKey,
        set: update,
      } = playbackNavigationRef.current;
      if (!shouldContinue) return;
      if (
        !isPlaylistEndForActiveScope(
          activePlaylistScopeRef.current,
          activeScopeKey,
        )
      ) {
        return;
      }

      if (activeMode === "surah" && activeSurah < 114) {
        continuousAutoPlayRef.current = true;
        navigate({ type: "NAVIGATE_SURAH", payload: { surah: activeSurah + 1, ayah: 1 } });
      } else if (activeMode === "juz" && activeJuz < 30) {
        continuousAutoPlayRef.current = true;
        navigate({ type: "NAVIGATE_JUZ", payload: { juz: activeJuz + 1 } });
      } else if (activeMode === "page" && activePage < 604) {
        continuousAutoPlayRef.current = true;
        update({ currentPage: activePage + 1 });
      }
    });
  }, []);

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
    activePlaylistScopeRef.current = readingScopeKey;

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
    readingScopeKey,
    riwaya,
    setError,
    warshStrictMode,
  ]);

  useEffect(() => {
    let cancelled = false;
    const safeReciterId = ensureReciterForRiwaya(reciter, riwaya);

    if (riwaya !== "hafs" || ayahs.length === 0) {
      setAudioTimingMap((current) =>
        current.size === 0 ? current : new Map(),
      );
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
    activePlaylistScopeRef.current = readingScopeKey;
    audioService.play();
  }, [
    audioTimingMap,
    ayahs,
    currentSurah,
    lang,
    readingScopeKey,
    reciter,
    riwaya,
    setError,
    warshStrictMode,
  ]);

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
      // Starting a recitation only requires canonical verse coordinates. The
      // previous path waited for Quran text and timing APIs before requesting
      // audio, which was especially noticeable for Warsh and page/juz jumps.
      const playlistAyahs = buildSurahAudioPlaylist(surahNumber);
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
      activePlaylistScopeRef.current =
        displayMode === "surah" && surahNumber === currentSurah
          ? readingScopeKey
          : null;
      await audioService.play();
    } catch {
      setError(
        lang === "fr"
          ? "Une erreur est survenue pendant la preparation audio."
          : "An error occurred while preparing audio playback.",
      );
    } finally {
      setPreparingSurah(null);
    }
  }, [
    currentSurah,
    displayMode,
    lang,
    preparingSurah,
    readingScopeKey,
    reciter,
    riwaya,
    setError,
    warshStrictMode,
  ]);

  useEffect(() => {
    const handler = () => playSurah();
    window.addEventListener("mushaf:play-surah", handler);
    return () => window.removeEventListener("mushaf:play-surah", handler);
  }, [playSurah]);

  return { playSpecificSurah, playSurah, preparingSurah };
}
