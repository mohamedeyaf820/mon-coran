import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

import {
  ensureReciterForRiwaya,
  getReciter,
  getRecitersByRiwaya,
} from "../../data/reciters";
import audioService from "../../services/audioService";
import { clearAudioPosition, getSavedAudioPosition, saveAudioPosition } from "../../services/audioResumeService";
import { getSettings, updateSetting } from "../../services/storageService";
import { getQueueState, setQueueState } from "../../stores/AudioQueueStore";
import { buildAudioPlaylistForSurah, normalizeAyahsForAudioPlaylist } from "../../utils/audioPlaylist";
import { buildAudioQueueState, normalizeAudioResume } from "./audioModel";

const ModernAudioContext = createContext(null);

export function ModernAudioProvider({ children }) {
  const settings = useMemo(() => getSettings(), []);
  const [riwaya, setRiwaya] = useState(() => settings.riwaya || "hafs");
  const [reciterId, setReciterId] = useState(() => ensureReciterForRiwaya(settings.reciter, riwaya));
  const initialQueue = useMemo(() => getQueueState(), []);
  const initialResume = useMemo(() => normalizeAudioResume(getSavedAudioPosition()), []);
  const [player, setPlayer] = useState({
    status: initialResume && initialQueue.items.length ? "paused" : "idle",
    current: initialResume
      ? initialQueue.items.find((item) => item.surah === initialResume.surah && item.ayah === initialResume.ayah) || null
      : null,
    currentTime: 0,
    duration: 0,
    network: "idle",
    error: null,
    queue: initialQueue.items,
    index: initialQueue.items.length ? Math.min(initialQueue.index, initialQueue.items.length - 1) : -1,
  });
  const lastSaveRef = useRef(0);
  const reciter = getReciter(reciterId, riwaya);
  const savedResume = normalizeAudioResume(getSavedAudioPosition());

  useEffect(() => {
    const applyPreferences = (event) => {
      const next = event.detail || getSettings();
      const nextRiwaya = next.riwaya || "hafs";
      const nextReciter = ensureReciterForRiwaya(next.reciter, nextRiwaya);
      setRiwaya(nextRiwaya);
      setReciterId(nextReciter);
    };
    window.addEventListener("modern-preferences-change", applyPreferences);
    return () => window.removeEventListener("modern-preferences-change", applyPreferences);
  }, []);

  useEffect(() => {
    const previous = {
      onPlay: audioService.onPlay,
      onPause: audioService.onPause,
      onError: audioService.onError,
      onNetworkState: audioService.onNetworkState,
    };
    audioService.currentReciterId = reciterId;
    audioService.riwaya = riwaya;
    audioService.onPlay = (current) => setPlayer((state) => ({ ...state, status: "playing", current, error: null }));
    audioService.onPause = () => setPlayer((state) => ({ ...state, status: "paused" }));
    audioService.onError = () => setPlayer((state) => ({ ...state, status: "error", network: "error", error: "La recitation ne peut pas etre chargee." }));
    audioService.onNetworkState = (network) => setPlayer((state) => ({ ...state, network }));
    const offTime = audioService.addTimeUpdateListener((currentTime, duration) => {
      setPlayer((state) => ({ ...state, currentTime, duration }));
      if (Date.now() - lastSaveRef.current > 5000 && audioService.currentAyah) {
        lastSaveRef.current = Date.now();
        saveAudioPosition({
          surah: audioService.currentAyah.surah,
          ayah: audioService.currentAyah.ayah || 1,
          currentTime,
          duration,
          reciter: reciterId,
          riwaya,
        });
      }
    });
    const offAyah = audioService.addAyahChangeListener((current) => {
      setPlayer((state) => ({ ...state, current, index: audioService.currentIndex }));
    });
    const offEnd = audioService.addEndListener(() => setPlayer((state) => ({ ...state, status: "idle", current: null, index: -1 })));
    return () => {
      offTime(); offAyah(); offEnd();
      Object.assign(audioService, previous);
    };
  }, [reciterId, riwaya]);

  async function playQueue(items, start = {}, reciterOverride = reciter) {
    const queue = normalizeAyahsForAudioPlaylist(items, start.surah);
    if (!queue.length || !reciterOverride) return;
    audioService.currentReciterId = reciterId;
    audioService.riwaya = riwaya;
    audioService.loadPlaylist(queue, reciterOverride.cdn, reciterOverride.cdnType || "islamic");
    const target = queue.findIndex((item) =>
      Number(item.surah) === Number(start.surah) && Number(item.ayah) === Number(start.ayah),
    );
    audioService.playlistIndex = target >= 0 ? target : 0;
    const queueState = buildAudioQueueState(queue, queue[audioService.playlistIndex]?.number);
    setQueueState(queueState);
    setPlayer((state) => ({ ...state, status: "loading", network: "loading", queue, index: audioService.playlistIndex, error: null }));
    await audioService.play();
  }

  async function playSurah(surah, ayah = 1) {
    return playQueue(await buildAudioPlaylistForSurah(surah, riwaya), { surah, ayah });
  }

  async function resumeSaved() {
    const saved = normalizeAudioResume(getSavedAudioPosition());
    if (!saved) return false;
    const resumeReciter = getReciter(ensureReciterForRiwaya(saved.reciter, riwaya), riwaya) || reciter;
    if (resumeReciter.id !== reciterId) {
      updateSetting("reciter", resumeReciter.id);
      audioService.currentReciterId = resumeReciter.id;
      setReciterId(resumeReciter.id);
    }
    const queue = await buildAudioPlaylistForSurah(saved.surah, riwaya);
    await playQueue(queue, { surah: saved.surah, ayah: saved.ayah }, resumeReciter);
    if (saved.currentTime > 0) audioService.seek(saved.currentTime);
    return true;
  }

  async function changeReciter(nextId) {
    const safeId = ensureReciterForRiwaya(nextId, riwaya);
    const next = getReciter(safeId, riwaya);
    if (!next) return;
    updateSetting("reciter", safeId);
    audioService.currentReciterId = safeId;
    if (audioService.playlist.length) await audioService.switchReciter(next.cdn, next.cdnType || "islamic");
    setReciterId(safeId);
  }

  function stop() {
    audioService.stop();
    clearAudioPosition();
    setQueueState({ items: [], index: 0 });
    setPlayer({
      status: "idle",
      current: null,
      currentTime: 0,
      duration: 0,
      network: "idle",
      error: null,
      queue: [],
      index: -1,
    });
  }

  const value = {
    ...player,
    reciter,
    reciterId,
    reciters: getRecitersByRiwaya(riwaya),
    riwaya,
    savedResume,
    playQueue,
    playSurah,
    resumeSaved,
    changeReciter,
    toggle: () => audioService.playlist.length ? audioService.toggle() : resumeSaved(),
    next: () => audioService.next(),
    previous: () => audioService.prev(),
    stop,
    seekPercent: (value) => audioService.seekPercent(value),
    setSpeed: (value) => { audioService.setSpeed(value); updateSetting("audioSpeed", value); },
  };

  return <ModernAudioContext.Provider value={value}>{children}</ModernAudioContext.Provider>;
}

export function useModernAudio() {
  const value = useContext(ModernAudioContext);
  if (!value) throw new Error("useModernAudio must be used inside ModernAudioProvider");
  return value;
}
