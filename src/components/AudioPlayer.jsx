import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import "../styles/domains/audio-legacy.css";
import "../styles/audio-player-simple.css";
import {
  shallowEqual,
  useAppActions,
  useAppSelector,
} from "../context/AppContext";
import { t } from "../i18n";
import audioService from "../services/audioService";
import { getSurahTimeline, seekSurahProgress } from "./audioPlayer/surahTimeline";
import {
  ensureReciterForRiwaya,
  getReciter,
  getRecitersByRiwaya,
} from "../data/reciters";
import { getSurah, surahName } from "../data/surahs";
import {
  getReciterUnavailableRemainingMs,
  isReciterTemporarilyUnavailable,
  sortRecitersByPreference,
} from "../utils/reciterRanking";
import { cn, toast } from "../lib/utils";
import { formatCooldownLabel } from "../utils/formatUtils";
import AudioOptionsModal from "./audioPlayer/AudioOptionsModal";
import SimpleAudioPlayerView from "./audioPlayer/SimpleAudioPlayerView";
import { useAutoScrollAyah } from "../hooks/useAutoScrollAyah";
import { useMediaSession } from "../hooks/useMediaSession";
import { useDirectionAwareKeys } from "../hooks/useDirectionAwareKeys";
import {
  isMobilePlayerViewport,
  MOBILE_BREAKPOINT,
  getReciterCooldownMs,
} from "./audioPlayer/audioPlayerUtils";
import { AlertCircle } from "lucide-react";

/* Main component */

export default function AudioPlayer() {
  const { dispatch, set } = useAppActions();
  const state = useAppSelector(
    (current) => ({
      lang: current.lang,
      reciter: current.reciter,
      isPlaying: current.isPlaying,
      currentPlayingAyah: current.currentPlayingAyah,
      riwaya: current.riwaya,
      audioSpeed: current.audioSpeed,
      surahRepeatCount: current.surahRepeatCount,
      volume: current.volume,
      showHome: current.showHome,
      playerMinimized: current.playerMinimized,
      syncOffsetsMs: current.syncOffsetsMs,
      favoriteReciters: current.favoriteReciters,
      autoSelectFastestReciter: current.autoSelectFastestReciter,
      reciterLatencyByKey: current.reciterLatencyByKey,
      reciterAvailabilityById: current.reciterAvailabilityById,
      currentSurah: current.currentSurah,
    }),
    shallowEqual,
  );
  const {
    lang,
    reciter,
    isPlaying,
    currentPlayingAyah,
    riwaya,
    audioSpeed,
    surahRepeatCount,
    volume: savedVolume,
    showHome,
    playerMinimized,
    syncOffsetsMs,
    favoriteReciters,
    autoSelectFastestReciter,
    reciterLatencyByKey,
    reciterAvailabilityById,
  } = state;

  const [progress, setProgress] = useState(0);
  const [currentTime, setCurTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [minimized, setMinimized] = useState(
    () => Boolean(playerMinimized) || !currentPlayingAyah,
  );
  const [volume, setVolume] = useState(savedVolume ?? 1);
  const [isMobile, setIsMobile] = useState(() => {
    return isMobilePlayerViewport();
  });
  const [audioError, setAudioError] = useState(null);
  const [audioFailed, setAudioFailed] = useState(false);
  const [networkState, setNetworkState] = useState("idle");
  const networkStateTimerRef = useRef(null);
  const [optionsModalOpen, setOptionsModalOpen] = useState(false);
  const [reciterSwitchingId, setReciterSwitchingId] = useState(null);
  const [eqPreset, setEqPreset] = useState("flat");
  const [tartilMode, setTartilMode] = useState(false);
  const [abRepeatActive, setAbRepeatActive] = useState(false);

  /* Fermeture / refs stables pour callbacks */
  const [closed, setClosed] = useState(false);
  const currentSurahRef = useRef(null);
  const currentPlayingAyahRef = useRef(currentPlayingAyah);
  const skipInitialExpandedPreferenceRef = useRef(!currentPlayingAyah);

  const optionsCloseButtonRef = useRef(null);
  const progressRef = useRef(null);
  const audioErrorTimerRef = useRef(null);
  const autoFailoverBusyRef = useRef(false);
  const reciterSwitchingIdRef = useRef(null);
  const failedRecitersRef = useRef(new Set());
  const reciterAvailabilityRef = useRef(reciterAvailabilityById || {});
  const autoIdleMinimizeArmedRef = useRef(false);

  useEffect(() => {
    reciterAvailabilityRef.current = reciterAvailabilityById || {};
  }, [reciterAvailabilityById]);

  useEffect(() => {
    currentPlayingAyahRef.current = currentPlayingAyah;
  }, [currentPlayingAyah]);

  const markReciterUnavailable = useCallback(
    (reciterId, errorLike = null) => {
      if (typeof reciterId !== "string" || !reciterId) return;
      const now = Date.now();
      const currentMap = reciterAvailabilityRef.current || {};
      const previous = currentMap[reciterId] || {};
      const nextFailCount = Math.max(1, Number(previous.failCount || 0) + 1);
      const cooldownMs = getReciterCooldownMs(nextFailCount);
      const nextEntry = {
        failCount: nextFailCount,
        lastFailAt: now,
        lastSuccessAt: Number(previous.lastSuccessAt) || 0,
        cooldownUntil: now + cooldownMs,
        lastError: String(errorLike?.message || errorLike || "")
          .trim()
          .slice(0, 160),
      };
      const nextMap = { ...currentMap, [reciterId]: nextEntry };
      reciterAvailabilityRef.current = nextMap;
      set({ reciterAvailabilityById: nextMap });
    },
    [set],
  );

  const markReciterAvailable = useCallback(
    (reciterId) => {
      if (typeof reciterId !== "string" || !reciterId) return;
      const currentMap = reciterAvailabilityRef.current || {};
      if (!currentMap[reciterId]) return;
      const nextMap = { ...currentMap };
      delete nextMap[reciterId];
      reciterAvailabilityRef.current = nextMap;
      set({ reciterAvailabilityById: nextMap });
    },
    [set],
  );

  const tryAutoReciterFailover = useCallback(async () => {
    if (!autoSelectFastestReciter) return false;
    if (autoFailoverBusyRef.current || reciterSwitchingIdRef.current) return false;

    const rankedReciters = sortRecitersByPreference(
      getRecitersByRiwaya(riwaya),
      {
        currentReciterId: reciter,
        favoriteReciters,
        latencyByKey: reciterLatencyByKey,
        availabilityById: reciterAvailabilityRef.current,
      },
    );
    if (!rankedReciters.length) return false;

    const currentIdx = rankedReciters.findIndex((item) => item.id === reciter);
    const rotated =
      currentIdx >= 0
        ? [
            ...rankedReciters.slice(currentIdx + 1),
            ...rankedReciters.slice(0, currentIdx),
          ]
        : rankedReciters;
    const candidates = rotated.filter(
      (item) => item.id !== reciter && !failedRecitersRef.current.has(item.id),
    );
    if (!candidates.length) return false;
    const availableCandidates = candidates.filter(
      (item) =>
        !isReciterTemporarilyUnavailable(
          item.id,
          reciterAvailabilityRef.current,
        ),
    );
    const finalCandidates =
      availableCandidates.length > 0 ? availableCandidates : candidates;

    autoFailoverBusyRef.current = true;
    try {
      for (const candidate of finalCandidates) {
        failedRecitersRef.current.add(candidate.id);
        reciterSwitchingIdRef.current = candidate.id;
        setReciterSwitchingId(candidate.id);
        try {
          const switched = await audioService.switchReciter(
            candidate.cdn,
            candidate.cdnType || "everyayah",
          );
          if (!switched) continue;
          markReciterAvailable(candidate.id);
          set({ reciter: candidate.id });
          const switchedName =
            lang === "fr"
              ? candidate.nameFr || candidate.nameEn || candidate.name
              : lang === "ar"
                ? candidate.name || candidate.nameEn || candidate.id
                : candidate.nameEn || candidate.nameFr || candidate.name;
          toast(
            t("audio.reciterSwitched", lang).replace("{name}", switchedName),
            "warning",
          );
          return true;
        } catch (error) {
          markReciterUnavailable(candidate.id, error);
          console.warn("Auto reciter failover failed:", error);
        } finally {
          if (reciterSwitchingIdRef.current === candidate.id) {
            reciterSwitchingIdRef.current = null;
            setReciterSwitchingId(null);
          }
        }
      }
      return false;
    } finally {
      autoFailoverBusyRef.current = false;
    }
  }, [
    autoSelectFastestReciter,
    favoriteReciters,
    lang,
    markReciterAvailable,
    markReciterUnavailable,
    reciter,
    reciterLatencyByKey,
    riwaya,
    set,
  ]);

  /* Detect mobile */
  useEffect(() => {
    const onResize = () => {
      setIsMobile(isMobilePlayerViewport());
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (skipInitialExpandedPreferenceRef.current) {
      skipInitialExpandedPreferenceRef.current = false;
      return;
    }
    setMinimized(Boolean(playerMinimized));
  }, [playerMinimized]);

  useEffect(() => {
    if (Boolean(playerMinimized) === minimized) return;
    set({ playerMinimized: minimized });
  }, [minimized, playerMinimized, set]);

  useEffect(() => {
    const openImmersiveOptions = () => {
      setClosed(false);
      setMinimized(true);
      setOptionsModalOpen(true);
    };
    window.addEventListener("mushafplus-open-audio-options", openImmersiveOptions);
    return () =>
      window.removeEventListener(
        "mushafplus-open-audio-options",
        openImmersiveOptions,
      );
  }, []);

  /* Wire audio callbacks */
  useEffect(() => {
    audioService.onPlay = (item) => {
      setClosed(false); // rouvre le lecteur s'il etait ferme
      setAudioError(null);
      setAudioFailed(false);
      markReciterAvailable(reciter);
      failedRecitersRef.current.clear();
      const nextPlayingAyah = item
        ? {
            surah: item.surah,
            ayah: item.ayah,
            globalNumber: item.globalNumber,
          }
        : null;
      currentPlayingAyahRef.current = nextPlayingAyah;
      set({
        isPlaying: true,
        currentPlayingAyah: nextPlayingAyah,
      });
    };
    audioService.onPause = () => set({ isPlaying: false });
    audioService.onEnd = () => {
      currentPlayingAyahRef.current = null;
      set({ isPlaying: false, currentPlayingAyah: null });
      setCurTime(0);
      setDuration(0);
      setProgress(0);
    };
    audioService.onAyahChange = (item) => {
      // Navigation automatique : toujours suivre la sourate en cours de recitation.
      if (item.surah && item.surah !== currentSurahRef.current) {
        dispatch({
          type: "NAVIGATE_SURAH",
          payload: { surah: item.surah, ayah: item.ayah || 1 },
        });
      }
      const previous = currentPlayingAyahRef.current;
      if (
        previous?.surah === item.surah &&
        previous?.ayah === item.ayah &&
        previous?.globalNumber === item.globalNumber
      ) {
        return;
      }
      const nextPlayingAyah = {
        surah: item.surah,
        ayah: item.ayah,
        globalNumber: item.globalNumber,
      };
      currentPlayingAyahRef.current = nextPlayingAyah;
      set({ currentPlayingAyah: nextPlayingAyah });
    };
    audioService.onTimeUpdate = (ct, dur) => {
      const { elapsed, total } = getSurahTimeline(ct, dur);
      setCurTime(elapsed);
      setDuration(total);
      setProgress(total ? elapsed / total : 0);
    };
    audioService.onError = async (error) => {
      try {
      set({ isPlaying: false });
      setNetworkState("error");
      setAudioFailed(true);
      if (audioErrorTimerRef.current) {
        clearTimeout(audioErrorTimerRef.current);
      }
      if (error?.name === "NotAllowedError") {
        setAudioError(t("audio.playbackBlocked", lang));
        return;
      }
      markReciterUnavailable(reciter, error);
      failedRecitersRef.current.add(reciter);
      const switched = await tryAutoReciterFailover();
      if (switched) {
        setNetworkState("loading");
        setAudioError(t("audio.reciterFailover", lang));
        audioErrorTimerRef.current = setTimeout(() => {
          setAudioError(null);
          audioErrorTimerRef.current = null;
        }, 2600);
        return;
      }
      const msg =
        riwaya === "warsh"
          ? t("audio.reciterLoadErrorWarsh", lang)
          : t("audio.reciterLoadError", lang);
      setAudioError(msg);
      audioErrorTimerRef.current = setTimeout(() => {
        setAudioError(null);
        audioErrorTimerRef.current = null;
      }, 5000);
      } catch (e) {
        autoFailoverBusyRef.current = false;
        console.warn("onError handler threw:", e);
      }
    };
    audioService.onNetworkState = (st) => {
      const next = st || "idle";
      clearTimeout(networkStateTimerRef.current);
      if (next === "loading" || next === "buffering") {
        // Between two ayahs the next file usually arrives within a few
        // frames: a spinner for that would only blink. Show it when the
        // wait actually lasts.
        networkStateTimerRef.current = setTimeout(() => setNetworkState(next), 450);
        return;
      }
      setNetworkState(next);
    };
    return () => {
      if (audioErrorTimerRef.current) {
        clearTimeout(audioErrorTimerRef.current);
        audioErrorTimerRef.current = null;
      }
      audioService.onPlay = null;
      audioService.onPause = null;
      audioService.onEnd = null;
      audioService.onAyahChange = null;
      audioService.onTimeUpdate = null;
      audioService.onError = null;
      audioService.onNetworkState = null;
      clearTimeout(networkStateTimerRef.current);
    };
  }, [
    dispatch,
    lang,
    markReciterAvailable,
    markReciterUnavailable,
    reciter,
    riwaya,
    set,
    tryAutoReciterFailover,
  ]);

  const networkBadge = (() => {
    if (networkState === "loading" || networkState === "buffering") {
      return {
        text: t("audio.networkLoading", lang),
      };
    }
    if (networkState === "stalled") {
      return {
        text: t("audio.networkStalled", lang),
      };
    }
    return null;
  })();

  /* Map internal networkState to AudioLoadingIndicator state */
  const audioIndicatorState = (() => {
    if (networkState === "error") return "error";
    if (networkState === "loading") return "loading";
    if (networkState === "buffering" || networkState === "stalled")
      return "buffering";
    if (isPlaying) return "playing";
    return "ready";
  })();

  useEffect(() => {
    audioService.setSpeed(audioSpeed);
  }, [audioSpeed]);

  useEffect(() => {
    const v = savedVolume ?? 1;
    setVolume(v);
    audioService.setVolume(v);
  }, [savedVolume]);

  useEffect(() => {
    const safe = ensureReciterForRiwaya(reciter, riwaya);
    if (safe !== reciter) set({ reciter: safe });
  }, [reciter, riwaya, set]);

  // Synchronize audioService with active reciter/riwaya from global state
  useEffect(() => {
    if (!reciter) return;
    const currentReciter = getReciter(reciter, riwaya);
    if (!currentReciter) return;

    const activeCdn = currentReciter.cdn;
    const activeCdnType = currentReciter.cdnType || "everyayah";

    if (
      audioService._currentReciterCdn !== activeCdn ||
      audioService._currentCdnType !== activeCdnType
    ) {
      audioService.switchReciter(activeCdn, activeCdnType).catch((err) => {
        console.warn("Global reciter synchronization failed:", err);
      });
    }
  }, [reciter, riwaya]);

  useEffect(() => {
    failedRecitersRef.current.clear();
  }, [reciter, riwaya]);

  useEffect(() => {
    audioService.setSurahRepeatCount(surahRepeatCount);
  }, [surahRepeatCount]);

  /* Controls */
  const toggle = useCallback(() => audioService.toggle(), []);
  const stop = useCallback(() => audioService.stop(), []);
  const next = useCallback(() => audioService.next(), []);
  const prev = useCallback(() => audioService.prev(), []);

  const retryPlayback = useCallback(() => {
    setAudioFailed(false);
    setNetworkState("loading");
    Promise.resolve(audioService.play()).catch(() => {
      setAudioFailed(true);
      setNetworkState("error");
    });
  }, []);

  const seekFromClientX = useCallback((clientX) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    seekSurahProgress(pct);
  }, []);

  const handleSeek = useCallback(
    (e) => {
      seekFromClientX(e.clientX);
    },
    [seekFromClientX],
  );

  const handleProgressKeyDown = useDirectionAwareKeys({
    lang,
    value: progress,
    onSeek: seekSurahProgress,
  });

  /*Progress bar drag support*/
  const [progressDragging, setProgressDragging] = useState(false);

  const handleProgressPointerDown = useCallback(
    (e) => {
      if (!progressRef.current) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      setProgressDragging(true);
      seekFromClientX(e.clientX);

      const pointerId = e.pointerId;
      e.currentTarget.setPointerCapture?.(pointerId);

      const onPointerMove = (ev) => {
        if (ev.pointerId !== pointerId) return;
        seekFromClientX(ev.clientX);
      };

      const cleanup = (ev) => {
        if (ev && ev.pointerId !== pointerId) return;
        setProgressDragging(false);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", cleanup);
        window.removeEventListener("pointercancel", cleanup);
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", cleanup);
      window.addEventListener("pointercancel", cleanup);
    },
    [seekFromClientX],
  );

  const formatTime = (s) => {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60)
      .toString()
      .padStart(2, "0")}`;
  };

  const handleVolumeChange = (v) => {
    setVolume(v);
    audioService.setVolume(v);
    set({ volume: v });
  };

  const setSurahRepeatSetting = useCallback(
    (value) => {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) {
        set({ surahRepeatCount: 1 });
        return;
      }
      if (parsed <= 0) {
        set({ surahRepeatCount: 0 }); // 0 => infinite
        return;
      }
      const safe = Math.max(1, Math.min(999, Math.floor(parsed)));
      set({ surahRepeatCount: safe });
    },
    [set],
  );

  const cycleSpeed = () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const idx = speeds.indexOf(audioSpeed);
    set({ audioSpeed: speeds[(idx + 1) % speeds.length] });
  };

  const handleApplyEqPreset = useCallback((preset) => {
    setEqPreset(preset);
    audioService.applyEqPreset(preset);
  }, []);

  const handleSetTartilMode = useCallback((enabled) => {
    setTartilMode(enabled);
    audioService.setTartilMode(enabled, audioSpeed);
  }, [audioSpeed]);

  useEffect(() => {
    return () => { audioService.setTartilMode(false, 1); };
  }, []);

  const handleClearAbRepeat = useCallback(() => {
    audioService.clearAbRepeat();
    setAbRepeatActive(false);
  }, []);

  const toggleMinimized = useCallback(() => {
    setOptionsModalOpen(false);
    setMinimized((prev) => !prev);
  }, []);

  const closeOptionsModal = useCallback(() => {
    setOptionsModalOpen(false);
    setReciterSearch("");
  }, []);

  useEffect(() => {
    const root = document.querySelector(".app-root");
    if (!root) return;
    if (optionsModalOpen) {
      root.setAttribute("inert", "");
      root.setAttribute("aria-hidden", "true");
    } else {
      root.removeAttribute("inert");
      root.removeAttribute("aria-hidden");
    }
    return () => {
      root.removeAttribute("inert");
      root.removeAttribute("aria-hidden");
    };
  }, [optionsModalOpen]);

  useEffect(() => {
    if (!optionsModalOpen) return;
    const rafId = window.requestAnimationFrame(() => {
      optionsCloseButtonRef.current?.focus();
    });
    const handleKeyDown = (e) => {
      if (e.key === "Escape") { setOptionsModalOpen(false); return; }
      if (e.key !== "Tab") return;
      const modalEl = optionsCloseButtonRef.current?.closest('[role="dialog"]');
      if (!modalEl) return;
      const focusable = modalEl.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(rafId);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [optionsModalOpen]);

  const toggleOptionsModal = useCallback(() => {
    setOptionsModalOpen((prev) => !prev);
  }, []);

  const closePlayer = useCallback(() => {
    audioService.stop();
    setMinimized(false);
    setOptionsModalOpen(false);
    setAudioError(null);
    setAudioFailed(false);
    setNetworkState("idle");
    set({ playerMinimized: false });
    setClosed(true);
  }, [set]);

  const currentReciters = useMemo(
    () =>
      sortRecitersByPreference(getRecitersByRiwaya(riwaya), {
        currentReciterId: reciter,
        favoriteReciters,
        latencyByKey: reciterLatencyByKey,
        availabilityById: reciterAvailabilityById,
      }),
    [
      favoriteReciters,
      reciter,
      reciterAvailabilityById,
      reciterLatencyByKey,
      riwaya,
    ],
  );
  /* Reciter search */
  const [reciterSearch, setReciterSearch] = useState("");
  const filteredReciters = useMemo(() => {
    const q = reciterSearch.trim().toLowerCase();
    if (!q) return currentReciters;
    return currentReciters.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.nameEn.toLowerCase().includes(q) ||
        r.nameFr.toLowerCase().includes(q) ||
        (r.searchAliases || []).some((alias) =>
          String(alias).toLowerCase().includes(q),
        ),
    );
  }, [currentReciters, reciterSearch]);

  const syncKey = `${riwaya}:${reciter}`;
  const syncOffsetMs = Math.max(
    -500,
    Math.min(500, Number(syncOffsetsMs?.[syncKey] ?? 0)),
  );
  const setSyncOffsetMs = useCallback(
    (value) => {
      const next = Math.max(
        -500,
        Math.min(500, Math.round(Number(value) || 0)),
      );
      set({
        syncOffsetsMs: {
          ...(syncOffsetsMs || {}),
          [syncKey]: next,
        },
      });
    },
    [set, syncKey, syncOffsetsMs],
  );


  const handleReciterSelect = useCallback(
    async (nextReciterId) => {
      if (!nextReciterId || nextReciterId === reciter) return;
      // Block user switches during auto-failover
      if (autoFailoverBusyRef.current) return;
      const target = currentReciters.find((r) => r.id === nextReciterId);
      if (!target) return;

      const remainingMs = getReciterUnavailableRemainingMs(
        nextReciterId,
        reciterAvailabilityRef.current,
      );
      if (remainingMs > 0) {
        const retryLabel = formatCooldownLabel(remainingMs, lang);
        toast(
          t("audio.reciterCooldown", lang).replace("{time}", retryLabel),
          "warning",
        );
        return;
      }

      reciterSwitchingIdRef.current = nextReciterId;
      setReciterSwitchingId(nextReciterId);
      try {
        const switched = await audioService.switchReciter(
          target.cdn,
          target.cdnType || "everyayah",
        );
        if (!switched) {
          // Superseded by a newer click — that call handles cleanup.
          return;
        }
        markReciterAvailable(nextReciterId);
        set({ reciter: nextReciterId });
      } catch (error) {
        markReciterUnavailable(nextReciterId, error);
        console.error("Instant reciter switch failed:", error);
        toast(
          t("audio.reciterSwitchFailed", lang),
          "warning",
        );
      } finally {
        if (reciterSwitchingIdRef.current === nextReciterId) {
          reciterSwitchingIdRef.current = null;
          setReciterSwitchingId(null);
        }
      }
    },
    [
      currentReciters,
      lang,
      markReciterAvailable,
      markReciterUnavailable,
      reciter,
      set,
    ],
  );

  const { currentSurah } = state;
  currentSurahRef.current = currentSurah;
  const surahMeta = getSurah(currentSurah);
  const currentSurahName = surahMeta ? surahName(currentSurah, lang) : "";
  const currentArabicName = surahMeta?.ar || "";

  const reciterObj =
    currentReciters.find((r) => r.id === reciter) ?? getReciter(reciter, riwaya);
  const isSurahStreamReciter = reciterObj?.audioMode === "surah";
  const hasAyahContext = Boolean(currentPlayingAyah?.ayah);
  const isContextualDesktop = !isMobile && !showHome;
  const reciterLabel =
    lang === "ar"
      ? reciterObj?.name
      : lang === "fr"
        ? reciterObj?.nameFr
        : reciterObj?.nameEn;

  const titleLabel = hasAyahContext
    ? `${t("quran.surah", lang)} ${currentPlayingAyah.surah}:${currentPlayingAyah.ayah}`
    : currentPlayingAyah?.surah
      ? lang === "ar"
        ? currentArabicName ||
          `${t("quran.surah", lang)} ${currentPlayingAyah.surah}`
        : currentSurahName ||
          `${t("quran.surah", lang)} ${currentPlayingAyah.surah}`
      : lang === "ar"
        ? currentArabicName
        : currentSurahName;

  const mediaSessionTitle = hasAyahContext
    ? `${currentSurahName || titleLabel} · ${t("quran.ayah", lang)} ${currentPlayingAyah.ayah}`
    : titleLabel || currentSurahName;

  useMediaSession({
    title: mediaSessionTitle,
    artist: reciterLabel,
    album: "MushafPlus",
    artwork: "/logo-512.png",
    isPlaying,
    onPlay: () => audioService.resume(),
    onPause: () => audioService.pause(),
    onNext: next,
    onPrev: prev,
    onStop: () => audioService.stop(),
    onSeekTo: (time, fastSeek) => {
      if (fastSeek && typeof audioService.audio?.fastSeek === "function") {
        audioService.audio.fastSeek(time);
        return;
      }
      audioService.seek(time);
    },
    onSeekBackward: (offset) =>
      audioService.seek(Math.max(0, audioService.currentTime - offset)),
    onSeekForward: (offset) =>
      audioService.seek(
        Math.min(audioService.duration || Infinity, audioService.currentTime + offset),
      ),
    currentTime,
    duration,
    playbackRate: audioSpeed,
  });

  useAutoScrollAyah({
    currentAyah: currentPlayingAyah,
    currentSurah,
    isPlaying,
  });

  const normalizeAyahText = (value) =>
    typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  const currentAyahText = (() => {
    if (!currentPlayingAyah) return "";
    const liveText = audioService.currentAyah?.text;
    const normalizedLiveText = normalizeAyahText(liveText);
    if (normalizedLiveText) {
      return normalizedLiveText;
    }
    if (!hasAyahContext || !currentPlayingAyah) return "";
    const fromPlaylist = audioService.playlist?.find(
      (p) =>
        p.surah === currentPlayingAyah.surah &&
        p.ayah === currentPlayingAyah.ayah,
    )?.text;
    return normalizeAyahText(fromPlaylist);
  })();
  const currentAyahPreview =
    currentAyahText.length > 180
      ? `${currentAyahText.slice(0, 180).trim()}...`
      : currentAyahText;

  const audioRegionLabel = t("audio.region", lang);
  const minimizedAudioRegionLabel = t("audio.regionMinimized", lang);
  const readyLabel = t("audio.readyToPlay", lang);
  const closeLabel = t("common.close", lang);
  const expandLabel = t("audio.expand", lang);
  const minimizeLabel = t("audio.minimize", lang);
  const optionsLabel = t("audio.optionsAndReciters", lang);
  const playPauseLabel = isPlaying ? t("audio.pause", lang) : t("audio.play", lang);
  const speedLabel = t("audio.speed", lang);
  const progressLabel = t("audio.progressLabel", lang);

  /* Shared button classes (mobile bar) */
  const playerSoftSurfaceClass =
    "rounded-[20px] border border-[color-mix(in_srgb,var(--theme-border)_62%,transparent_38%)] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--theme-panel-bg-strong)_84%,transparent_16%),color-mix(in_srgb,var(--theme-panel-bg)_74%,transparent_26%))] shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]";
  const playerSectionLabelClass =
    "mb-2 text-[max(0.7rem,11px)] font-bold uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--theme-primary)_68%,var(--theme-text)_32%)] [font-family:var(--font-ui)]";
  const playerMutedTextClass =
    "text-[color-mix(in_srgb,var(--theme-text-inverse)_90%,transparent_10%)] [font-family:var(--font-ui)]";
  const playerSearchInputClass =
    "audio-reciter-options__search-input w-full rounded-xl border border-white/12 bg-[rgba(6,13,24,0.78)] py-1.5 ps-11 pe-10 text-base text-[color-mix(in_srgb,var(--theme-text-inverse)_90%,transparent_10%)] outline-none [font-family:var(--font-ui)] focus:border-[rgba(var(--theme-primary-rgb),0.4)] focus:ring-2 focus:ring-[rgba(var(--theme-primary-rgb),0.18)]";
  const playerNumberInputClass =
    "w-12 rounded-xl border border-white/12 bg-[rgba(6,13,24,0.78)] px-1.5 py-1 text-center text-base text-[color-mix(in_srgb,var(--theme-text-inverse)_95%,transparent_5%)] outline-none [font-family:var(--font-ui)] focus:border-[rgba(var(--theme-primary-rgb),0.42)] focus:ring-2 focus:ring-[rgba(var(--theme-primary-rgb),0.18)]";
  const playerCardToggleClass = (active = false) =>
    cn(
      "flex items-center justify-between gap-2 rounded-2xl border px-3 py-1.5 text-[0.7rem] font-semibold transition-all duration-150 [font-family:var(--font-ui)]",
      active
        ? "border-[rgba(var(--theme-primary-rgb),0.42)] bg-[rgba(var(--theme-primary-rgb),0.16)] text-[color-mix(in_srgb,var(--theme-text-inverse)_98%,transparent_2%)]"
        : "border-white/12 bg-white/[0.045] text-[color-mix(in_srgb,var(--theme-text-inverse)_72%,transparent_28%)] hover:border-[rgba(var(--theme-primary-rgb),0.34)] hover:bg-[rgba(var(--theme-primary-rgb),0.1)]",
    );
  const playerOptionPillClass = (active = false) =>
    cn(
      "rounded-xl border px-2 py-1 text-[0.6rem] font-semibold transition-all [font-family:var(--font-ui)]",
      active
        ? "border-[rgba(var(--theme-primary-rgb),0.42)] bg-[rgba(var(--theme-primary-rgb),0.18)] text-white"
        : "border-white/12 bg-white/[0.045] text-[color-mix(in_srgb,var(--theme-text-inverse)_72%,transparent_28%)] hover:border-[rgba(var(--theme-primary-rgb),0.34)] hover:bg-[rgba(var(--theme-primary-rgb),0.1)]",
    );
  const playerGoldMetaClass =
    "text-[color-mix(in_srgb,var(--theme-primary)_72%,var(--theme-text)_28%)] [font-family:var(--font-ui)]";
  const playerFadedTextClass =
    "text-[color-mix(in_srgb,var(--theme-text-inverse)_82%,transparent_18%)] [font-family:var(--font-ui)]";
  const playerSurfaceButtonClass =
    "rounded-2xl border border-white/12 bg-white/[0.045] text-[color-mix(in_srgb,var(--theme-text-inverse)_74%,transparent_26%)] transition-all duration-150 [font-family:var(--font-ui)] hover:border-[rgba(var(--theme-primary-rgb),0.34)] hover:bg-[rgba(var(--theme-primary-rgb),0.1)] hover:text-white";
  const playerReciterButtonClass = (
    active = false,
    isLoading = false,
    isUnavailable = false,
  ) =>
    cn(
      "group flex min-h-[3.8rem] w-full items-start gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all duration-150",
      active
        ? "border-[rgba(var(--theme-primary-rgb),0.42)] bg-[rgba(var(--theme-primary-rgb),0.16)] text-[color-mix(in_srgb,var(--theme-text-inverse)_98%,transparent_2%)]"
        : "border-white/10 bg-white/[0.04] text-[color-mix(in_srgb,var(--theme-text-inverse)_74%,transparent_26%)] hover:border-[rgba(var(--theme-primary-rgb),0.34)] hover:bg-[rgba(var(--theme-primary-rgb),0.1)]",
      isUnavailable &&
        !active &&
        "border-rose-300/30 bg-rose-300/10 text-rose-100 hover:border-rose-300/40 hover:bg-rose-300/16",
      isLoading && "animate-pulse",
    );
  const audioOptionsModal = (
    <AudioOptionsModal
      abRepeatActive={abRepeatActive}
      audioSpeed={audioSpeed}
      closeOptionsModal={closeOptionsModal}
      currentReciters={currentReciters}
      cycleSpeed={cycleSpeed}
      eqPreset={eqPreset}
      handleApplyEqPreset={handleApplyEqPreset}
      handleClearAbRepeat={handleClearAbRepeat}
      handleSetTartilMode={handleSetTartilMode}
      tartilMode={tartilMode}
      filteredReciters={filteredReciters}
      favoriteReciters={favoriteReciters}
      handleReciterSelect={handleReciterSelect}
      handleVolumeChange={handleVolumeChange}
      isMobile={isMobile}
      isSurahStreamReciter={isSurahStreamReciter}
      lang={lang}
      networkState={networkState}
      optionsCloseButtonRef={optionsCloseButtonRef}
      optionsModalOpen={optionsModalOpen}
      playerCardToggleClass={playerCardToggleClass}
      playerFadedTextClass={playerFadedTextClass}
      playerGoldMetaClass={playerGoldMetaClass}
      playerMutedTextClass={playerMutedTextClass}
      playerNumberInputClass={playerNumberInputClass}
      playerOptionPillClass={playerOptionPillClass}
      playerReciterButtonClass={playerReciterButtonClass}
      playerSearchInputClass={playerSearchInputClass}
      playerSectionLabelClass={playerSectionLabelClass}
      playerSoftSurfaceClass={playerSoftSurfaceClass}
      playerSurfaceButtonClass={playerSurfaceButtonClass}
      reciter={reciter}
      reciterAvailabilityById={reciterAvailabilityById}
      reciterLatencyByKey={reciterLatencyByKey}
      reciterSearch={reciterSearch}
      reciterSwitchingId={reciterSwitchingId}
      setReciterSearch={setReciterSearch}
      setSurahRepeatSetting={setSurahRepeatSetting}
      setSyncOffsetMs={setSyncOffsetMs}
      stop={stop}
      surahRepeatCount={surahRepeatCount}
      syncOffsetMs={syncOffsetMs}
      volume={volume}
    />
  );

  useEffect(() => {
    if (isPlaying || currentPlayingAyah) {
      autoIdleMinimizeArmedRef.current = true;
      return;
    }
    if (!isContextualDesktop || isMobile) return;
    if (autoIdleMinimizeArmedRef.current && !minimized) {
      setMinimized(true);
      autoIdleMinimizeArmedRef.current = false;
    }
  }, [
    currentPlayingAyah,
    isContextualDesktop,
    isMobile,
    isPlaying,
    minimized,
  ]);

  useEffect(() => {
    const root = document.documentElement;
    if (isSurahStreamReciter && (isPlaying || currentPlayingAyah)) {
      root.setAttribute("data-audio-mode", "surah");
    } else {
      root.removeAttribute("data-audio-mode");
    }
    return () => root.removeAttribute("data-audio-mode");
  }, [isSurahStreamReciter, isPlaying, currentPlayingAyah]);

  useEffect(() => {
    const root = document.documentElement;

    if (!isMobile || closed) {
      root.style.removeProperty("--player-h");
      root.style.removeProperty("--desktop-player-reserved-h");
      return;
    }

    // Match the reserved space to the responsive dock: one row on wide screens,
    // two rows on narrow phones, and a compact row when minimized.
    const updateReservedHeight = () => {
      const usesWideDock =
        window.innerWidth >= 600 && window.innerWidth <= MOBILE_BREAKPOINT;
      const reservedHeight = minimized ? 70 : usesWideDock ? 64 : 122;
      root.style.setProperty("--player-h", `${reservedHeight}px`);
    };
    updateReservedHeight();
    window.addEventListener("resize", updateReservedHeight, { passive: true });
    root.style.removeProperty("--desktop-player-reserved-h");

    return () => {
      window.removeEventListener("resize", updateReservedHeight);
      root.style.removeProperty("--player-h");
      root.style.removeProperty("--desktop-player-reserved-h");
    };
  }, [closed, isMobile, minimized]);

  useEffect(() => {
    const root = document.documentElement;

    if (isMobile || closed || !isContextualDesktop) {
      root.style.removeProperty("--desktop-player-reserved-h");
      return;
    }

    const reservedHeight = minimized ? 84 : 280;
    root.style.setProperty("--desktop-player-reserved-h", `${reservedHeight}px`);

    return () => {
      root.style.removeProperty("--desktop-player-reserved-h");
    };
  }, [
    closed,
    isContextualDesktop,
    isMobile,
    minimized,
  ]);

  if (closed) return null;

  return (
    <>
      {/* Screen-reader live region: announces the active ayah in every playback mode. */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {currentPlayingAyah?.ayah
          ? `${currentSurahName || `${t("quran.surah", lang)} ${currentPlayingAyah.surah}`} · ${t("quran.ayah", lang)} ${currentPlayingAyah.ayah}`
          : ""}
      </div>
      {audioError && (
        <div
          className="pointer-events-none fixed left-1/2 z-[430] flex max-w-[min(90vw,360px)] -translate-x-1/2 items-center gap-2 rounded-xl border border-rose-200/20 bg-rose-700/95 px-4 py-2.5 text-center text-xs font-semibold text-white shadow-xl"
          style={{ top: "calc(var(--header-h, 72px) + 0.5rem)" }}
          role="alert"
        >
          <AlertCircle size={15} className="shrink-0" aria-hidden="true" />
          <span>{audioError}</span>
        </div>
      )}

      <SimpleAudioPlayerView
        audioError={audioError}
        audioFailed={audioFailed}
        audioIndicatorState={audioIndicatorState}
        audioSpeed={audioSpeed}
        closeLabel={closeLabel}
        currentArabicName={currentArabicName}
        currentAyahPreview={currentAyahPreview}
        currentTime={currentTime}
        duration={duration}
        errorLabel={t("audio.error", lang)}
        expandLabel={expandLabel}
        isMobile={isMobile}
        isPlaying={isPlaying}
        minimized={minimized}
        minimizeLabel={minimizeLabel}
        networkBadge={networkBadge}
        networkState={networkState}
        nextLabel={t("audio.next", lang)}
        onClose={closePlayer}
        onCycleSpeed={cycleSpeed}
        onDismissError={() => setAudioFailed(false)}
        onExpand={toggleMinimized}
        onMinimize={toggleMinimized}
        onNext={next}
        onOptions={toggleOptionsModal}
        onPrevious={prev}
        onProgressClick={handleSeek}
        onProgressKeyDown={handleProgressKeyDown}
        onProgressPointerDown={handleProgressPointerDown}
        onRetryAudio={retryPlayback}
        onToggle={toggle}
        optionsLabel={optionsLabel}
        optionsOpen={optionsModalOpen}
        playPauseLabel={playPauseLabel}
        previousLabel={t("audio.prev", lang)}
        progress={progress}
        progressDragging={progressDragging}
        progressLabel={progressLabel}
        progressRef={progressRef}
        reciter={reciterObj}
        reciterLabel={reciterLabel}
        regionLabel={minimized ? minimizedAudioRegionLabel : audioRegionLabel}
        retryLabel={t("actions.retry", lang)}
        riwaya={riwaya}
        surahNum={currentSurah}
        speedLabel={speedLabel}
        title={titleLabel || readyLabel}
      />

      {audioOptionsModal}
    </>
  );
}
