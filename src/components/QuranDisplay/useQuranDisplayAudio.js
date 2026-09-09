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
import { preloadQuranDisplayData } from "./useQuranDisplayData";

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
  const playbackNavigationRef = useRef(null);
  const activePlaylistScopeRef = useRef(null);
  const playlistRiwayaRef = useRef(riwaya);
  const renderedScopeRef = useRef(null);
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
  const scopeChanged = renderedScopeRef.current !== readingScopeKey;
  renderedScopeRef.current = readingScopeKey;
  playbackNavigationRef.current = {
    ...playbackNavigationRef.current,
    continuousPlay,
    ...(scopeChanged ? { currentJuz, currentPage, currentSurah, displayMode, readingScopeKey } : {}),
    dispatch,
    reciter,
    riwaya,
    set,
    warshStrictMode,
  };
  const audioPlaylistKey = useMemo(
    () =>
      ayahs
        .map((ayah) => `${ayah.surah?.number || currentSurah}:${ayah.numberInSurah}:${ayah.number}`)
        .join("|"),
    [ayahs, currentSurah],
  );

  useEffect(() => {
    let disposed = false;
    const unsubscribe = audioService.addEndListener(() => {
      const {
        continuousPlay: shouldContinue,
        currentJuz: activeJuz,
        currentPage: activePage,
        currentSurah: activeSurah,
        dispatch: navigate,
        displayMode: activeMode,
        readingScopeKey: activeScopeKey,
        reciter: activeReciterId,
        riwaya: activeRiwaya,
        warshStrictMode: strictMode,
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
        // Native ended -> next source, without waiting for React/data fetching.
        // This path also runs with the screen locked and RAF suspended.
        const voice = getReciter(ensureReciterForRiwaya(activeReciterId, activeRiwaya), activeRiwaya);
        if (!voice) return;
        if (activeRiwaya === "warsh" && strictMode && !isWarshVerifiedReciter(voice)) return;
        const nextSurah = activeSurah + 1;
        const nextScope = getReadingAudioScopeKey({ displayMode: "surah", currentSurah: nextSurah });
        activePlaylistScopeRef.current = nextScope;
        playbackNavigationRef.current = { ...playbackNavigationRef.current, currentSurah: nextSurah, readingScopeKey: nextScope };
        audioService.loadPlaylist(buildSurahAudioPlaylist(nextSurah), voice.cdn, voice.cdnType || "islamic");
        audioService.play();
        navigate({ type: "NAVIGATE_SURAH", payload: { surah: nextSurah, ayah: 1 } });
      } else if ((activeMode === "juz" && activeJuz < 30) || (activeMode === "page" && activePage < 604)) {
        const voice = getReciter(ensureReciterForRiwaya(activeReciterId, activeRiwaya), activeRiwaya);
        if (!voice) return;
        if (activeRiwaya === "warsh" && strictMode && !isWarshVerifiedReciter(voice)) return;
        const target = {
          displayMode: activeMode, currentSurah: activeSurah,
          currentPage: activeMode === "page" ? activePage + 1 : activePage,
          currentJuz: activeMode === "juz" ? activeJuz + 1 : activeJuz,
          riwaya: activeRiwaya, warshStrictMode: strictMode,
        };
        audioService.continuePlaylist(async () => {
          const result = await preloadQuranDisplayData(target);
          const latest = playbackNavigationRef.current;
          if (disposed || !latest.continuousPlay || latest.readingScopeKey !== activeScopeKey || latest.riwaya !== activeRiwaya || latest.reciter !== activeReciterId) return [];
          return toPlaylistAyahs(result.ayahs, activeSurah);
        }, voice.cdn, voice.cdnType || "islamic").then((started) => {
          if (!started || disposed) return;
          const nextScope = getReadingAudioScopeKey(target);
          activePlaylistScopeRef.current = nextScope;
          playbackNavigationRef.current = { ...playbackNavigationRef.current, ...target, readingScopeKey: nextScope };
          navigate(activeMode === "page"
            ? { type: "NAVIGATE_PAGE", payload: { page: target.currentPage } }
            : { type: "NAVIGATE_JUZ", payload: { juz: target.currentJuz } });
        }).catch(() => { if (!disposed) setError(t("audio.loadError", lang)); });
      }
    });
    return () => { disposed = true; unsubscribe(); };
  }, []);

  useEffect(() => {
    if (ayahs.length === 0 || !reciter) return;

    // Browsing (including surah -> fullscreen page) is not a playback request.
    // Preserve a playing or paused queue until an explicit play or riwaya change.
    if (
      audioService.currentAyah &&
      playlistRiwayaRef.current === riwaya &&
      activePlaylistScopeRef.current !== readingScopeKey
    ) return;
    playlistRiwayaRef.current = riwaya;

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
      toPlaylistAyahs(ayahs, currentSurah, safeTimingMap),
      currentReciter.cdn,
      currentReciter.cdnType || "islamic",
    );
    activePlaylistScopeRef.current = readingScopeKey;

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

  const playAyah = useCallback(async (targetAyah, sourceAyahs = ayahs) => {
    const currentReciter = getReciter(ensureReciterForRiwaya(reciter, riwaya), riwaya);
    if (!currentReciter || !targetAyah) return;
    if (riwaya === "warsh" && warshStrictMode && !isWarshVerifiedReciter(currentReciter)) {
      setError(t("errors.warshStrict", lang));
      return;
    }

    const playlist = toPlaylistAyahs(sourceAyahs, currentSurah, audioTimingMap);
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
      currentReciter.cdnType || "islamic",
    );
    // A streamed page or the left sheet can start its own queue while the
    // reading anchor still points at the right sheet. Continue from that queue.
    const sourcePage = Number(sourceAyahs[0]?.page);
    const sourceScope = displayMode === "page" && sourcePage > 0
      ? getReadingAudioScopeKey({ displayMode: "page", currentPage: sourcePage })
      : readingScopeKey;
    activePlaylistScopeRef.current = sourceScope;
    playbackNavigationRef.current = {
      ...playbackNavigationRef.current,
      readingScopeKey: sourceScope,
      ...(displayMode === "page" && sourcePage > 0 ? { currentPage: sourcePage } : {}),
    };
    try {
      await audioService.loadAndPlay(index);
    } catch {
      setError(
        lang === "fr"
          ? "Impossible de lancer la récitation de ce verset."
          : "Unable to play this verse.",
      );
    }
  }, [
    audioTimingMap,
    ayahs,
    currentSurah,
    displayMode,
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

  return { playAyah, playSpecificSurah, playSurah, preparingSurah };
}
