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
import { hafsNumbersForAyah } from "../../constants/warshSource";
import { toast } from "../../lib/utils";

function toPlaylistAyahs(ayahs, currentSurah, timingMap = new Map(), riwaya = "hafs") {
  return (Array.isArray(ayahs) ? ayahs : []).map((ayah) => {
    const surahNumber = ayah.surah?.number || currentSurah;
    const hafsNumbers = hafsNumbersForAyah(ayah, riwaya) ?? [];
    const hafsNumber = hafsNumbers[0] ?? null;
    return {
      surah: surahNumber,
      numberInSurah: ayah.numberInSurah,
      hafsNumber,
      hafsNumbers,
      riwaya,
      number: ayah.number,
      text: ayah.text,
      quranComAudioTiming:
        timingMap.get(`${surahNumber}:${hafsNumber ?? ayah.numberInSurah}`) || null,
    };
  });
}

export default function useQuranDisplayAudio({
  ayahs,
  currentJuz,
  currentPage,
  currentSurah,
  continuousPlay,
  displayMode,
  dispatch,
  isPlaying,
  lang,
  reciter,
  riwaya,
  set,
  setError,
  warshStrictMode,
}) {
  const [preparingSurah, setPreparingSurah] = useState(null);
  const [audioTimingMap, setAudioTimingMap] = useState(new Map());
  const timingReciterRef = useRef(null);
  const continuousAutoPlayRef = useRef(false);
  const playbackNavigationRef = useRef(null);
  const activePlaylistScopeRef = useRef(null);
  const gapsAnnouncedRef = useRef("");

  // QuranPedia does not serve every verse of every set, and the missing files
  // are dropped so recitation keeps flowing. Without a word about it the
  // recitation simply stops short, so say it once per loaded list.
  const announcePlaylistGaps = useCallback(
    (reciterCdn) => {
      const count = audioService.playlistGapCount;
      if (count <= 0) {
        gapsAnnouncedRef.current = "";
        return;
      }
      const key = `${reciterCdn}:${count}`;
      if (gapsAnnouncedRef.current === key) return;
      gapsAnnouncedRef.current = key;
      toast(t("audio.gapSkipped", lang, count), "warning");
    },
    [lang],
  );
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

    const safeTimingMap =
      timingReciterRef.current === safeReciterId ? audioTimingMap : new Map();
    audioService.loadPlaylist(
      toPlaylistAyahs(ayahs, currentSurah, safeTimingMap, riwaya),
      currentReciter.cdn,
      currentReciter.cdnType || "everyayah",
    );
    announcePlaylistGaps(currentReciter.cdn);
    activePlaylistScopeRef.current = readingScopeKey;

    if (continuousAutoPlayRef.current && continuousPlay) {
      continuousAutoPlayRef.current = false;
      audioService.play();
    }
  }, [
    announcePlaylistGaps,
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

    // Segment timings are useful only once playback begins. Loading them while
    // someone is simply reading previously added several paginated requests to
    // every cold reader visit.
    if (!isPlaying) return undefined;

    getAudioTimingsForAyahs(safeReciterId, ayahs)
      .then((map) => {
        if (!cancelled) {
          timingReciterRef.current = safeReciterId;
          setAudioTimingMap(map);
        }
      })
      .catch(() => {
        if (!cancelled) setAudioTimingMap(new Map());
      });

    return () => {
      cancelled = true;
    };
  }, [audioPlaylistKey, ayahs, isPlaying, reciter, riwaya]);

  const playSurah = useCallback(() => {
    const currentReciter = getReciter(ensureReciterForRiwaya(reciter, riwaya), riwaya);
    if (!currentReciter || ayahs.length === 0) return;
    if (riwaya === "warsh" && warshStrictMode && !isWarshVerifiedReciter(currentReciter)) {
      setError(t("errors.warshStrict", lang));
      return;
    }
    audioService.loadPlaylist(
      toPlaylistAyahs(ayahs, currentSurah, audioTimingMap, riwaya),
      currentReciter.cdn,
      currentReciter.cdnType || "everyayah",
    );
    announcePlaylistGaps(currentReciter.cdn);
    activePlaylistScopeRef.current = readingScopeKey;
    audioService.play();
  }, [
    announcePlaylistGaps,
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

  const playAyah = useCallback(async (targetAyah, sourceAyahs = ayahs) => {
    const currentReciter = getReciter(ensureReciterForRiwaya(reciter, riwaya), riwaya);
    if (!currentReciter || !targetAyah) return;
    if (riwaya === "warsh" && warshStrictMode && !isWarshVerifiedReciter(currentReciter)) {
      setError(t("errors.warshStrict", lang));
      return;
    }

    const playlist = toPlaylistAyahs(sourceAyahs, currentSurah, audioTimingMap, riwaya);
    const ayahSurah = Number(targetAyah?.surah?.number || targetAyah?.surah || currentSurah);
    const index = playlist.findIndex(
      (entry) =>
        Number(entry.surah) === ayahSurah &&
        Number(entry.numberInSurah) === Number(targetAyah.numberInSurah),
    );
    if (index < 0) return;

    audioService.loadPlaylist(
      playlist,
      currentReciter.cdn,
      currentReciter.cdnType || "everyayah",
    );
    announcePlaylistGaps(currentReciter.cdn);
    activePlaylistScopeRef.current = readingScopeKey;
    // Filtering moves verses up: re-resolve the tapped one inside the loaded list.
    const targetIndex =
      audioService.playlistGapCount > 0
        ? audioService.indexOfAyah(ayahSurah, Number(targetAyah.numberInSurah))
        : index;
    if (targetIndex < 0) {
      setError(t("audio.verseUnavailable", lang));
      return;
    }
    try {
      await audioService.loadAndPlay(targetIndex);
    } catch {
      setError(
        lang === "fr"
          ? "Impossible de lancer la récitation de ce verset."
          : "Unable to play this verse.",
      );
    }
  }, [
    announcePlaylistGaps,
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
        currentReciter.cdnType || "everyayah",
      );
      announcePlaylistGaps(currentReciter.cdn);
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
    announcePlaylistGaps,
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

  return { playAyah, playSpecificSurah, playSurah, preparingSurah };
}
