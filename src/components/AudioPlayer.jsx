import React, { useState, useEffect, useRef, useCallback } from "react";
import "../styles/domains/audio-legacy.css";
import "../styles/audio-player-simple.css";
import {
  shallowEqual,
  useAppActions,
  useAppSelector,
} from "../context/AppContext";
import { t } from "../i18n";
import audioService from "../services/audioService";
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
import {
  clampCardPosition,
  isMobilePlayerViewport,
  loadCardPos,
  MOBILE_BREAKPOINT,
  getReciterCooldownMs,
  saveCardPos,
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
      memMode: current.memMode,
      memRepeatCount: current.memRepeatCount,
      memPause: current.memPause,
      surahRepeatCount: current.surahRepeatCount,
      volume: current.volume,
      showHome: current.showHome,
      showWordByWord: current.showWordByWord,
      playerMinimized: current.playerMinimized,
      syncOffsetsMs: current.syncOffsetsMs,
      favoriteReciters: current.favoriteReciters,
      autoSelectFastestReciter: current.autoSelectFastestReciter,
      reciterLatencyByKey: current.reciterLatencyByKey,
      reciterAvailabilityById: current.reciterAvailabilityById,
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
    memMode,
    memRepeatCount,
    memPause,
    surahRepeatCount,
    volume: savedVolume,
    showHome,
    showWordByWord,
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
  const [minimized, setMinimized] = useState(Boolean(playerMinimized));
  const [volume, setVolume] = useState(savedVolume ?? 1);
  const [isMobile, setIsMobile] = useState(() => {
    return isMobilePlayerViewport();
  });
  const [audioError, setAudioError] = useState(null);
  const [networkState, setNetworkState] = useState("idle");
  const [optionsModalOpen, setOptionsModalOpen] = useState(false);
  const [reciterSwitchingId, setReciterSwitchingId] = useState(null);
  const [playerPosition, setPlayerPosition] = useState(() =>
    typeof window === "undefined" ? null : loadCardPos(),
  );
  const [playerDragging, setPlayerDragging] = useState(false);

  /* Fermeture / refs stables pour callbacks */
  const [closed, setClosed] = useState(false);
  const currentSurahRef = useRef(null);
  const currentPlayingAyahRef = useRef(currentPlayingAyah);

  const optionsCloseButtonRef = useRef(null);
  const progressRef = useRef(null);
  const playerRef = useRef(null);
  const playerPositionRef = useRef(playerPosition);
  const audioErrorTimerRef = useRef(null);
  const autoFailoverBusyRef = useRef(false);
  const failedRecitersRef = useRef(new Set());
  const reciterAvailabilityRef = useRef(reciterAvailabilityById || {});
  const autoIdleMinimizeArmedRef = useRef(false);

  useEffect(() => {
    reciterAvailabilityRef.current = reciterAvailabilityById || {};
  }, [reciterAvailabilityById]);

  useEffect(() => {
    currentPlayingAyahRef.current = currentPlayingAyah;
  }, [currentPlayingAyah]);

  useEffect(() => {
    playerPositionRef.current = playerPosition;
  }, [playerPosition]);

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
    if (autoFailoverBusyRef.current || reciterSwitchingId) return false;

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
        setReciterSwitchingId(candidate.id);
        try {
          await audioService.switchReciter(
            candidate.cdn,
            candidate.cdnType || "islamic",
          );
          markReciterAvailable(candidate.id);
          set({ reciter: candidate.id });
          toast(
            lang === "fr"
              ? `Recitateur indisponible, bascule vers ${candidate.nameFr || candidate.nameEn || candidate.name}.`
              : lang === "ar"
                ? `القارئ غير متاح، تم التبديل إلى ${candidate.name || candidate.nameEn || candidate.id}.`
                : `Reciter unavailable, switched to ${candidate.nameEn || candidate.nameFr || candidate.name}.`,
            "warning",
          );
          return true;
        } catch (error) {
          markReciterUnavailable(candidate.id, error);
          console.warn("Auto reciter failover failed:", error);
        } finally {
          setReciterSwitchingId(null);
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
    reciterSwitchingId,
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

  const handlePlayerDragPointerDown = useCallback(
    (event) => {
      if (isMobile || (event.pointerType === "mouse" && event.button !== 0)) {
        return;
      }
      if (event.target.closest?.("button, a, input, select, textarea, [role='slider']")) {
        return;
      }

      const player = playerRef.current;
      if (!player) return;

      const rect = player.getBoundingClientRect();
      const pointerId = event.pointerId;
      const dragTarget = event.currentTarget;
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;

      event.preventDefault();
      dragTarget.setPointerCapture?.(pointerId);
      setPlayerDragging(true);

      const onPointerMove = (moveEvent) => {
        if (moveEvent.pointerId !== pointerId) return;
        const nextPosition = clampCardPosition(
          moveEvent.clientX - offsetX,
          moveEvent.clientY - offsetY,
          rect.width,
          rect.height,
        );
        playerPositionRef.current = nextPosition;
        setPlayerPosition(nextPosition);
      };

      const finishDrag = (endEvent) => {
        if (endEvent?.pointerId !== undefined && endEvent.pointerId !== pointerId) {
          return;
        }
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", finishDrag);
        window.removeEventListener("pointercancel", finishDrag);
        dragTarget.releasePointerCapture?.(pointerId);
        setPlayerDragging(false);
        if (playerPositionRef.current) saveCardPos(playerPositionRef.current);
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", finishDrag);
      window.addEventListener("pointercancel", finishDrag);
    },
    [isMobile],
  );

  useEffect(() => {
    if (isMobile) return undefined;

    let frameId;
    const keepPlayerInViewport = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        const savedPosition = playerPositionRef.current;
        const player = playerRef.current;
        if (!savedPosition || !player) return;
        const rect = player.getBoundingClientRect();
        const nextPosition = clampCardPosition(
          savedPosition.x,
          savedPosition.y,
          rect.width,
          rect.height,
        );
        playerPositionRef.current = nextPosition;
        setPlayerPosition(nextPosition);
        saveCardPos(nextPosition);
      });
    };

    keepPlayerInViewport();
    window.addEventListener("resize", keepPlayerInViewport, { passive: true });
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", keepPlayerInViewport);
    };
  }, [isMobile, minimized]);

  useEffect(() => {
    setMinimized(Boolean(playerMinimized));
  }, [playerMinimized]);

  useEffect(() => {
    if (Boolean(playerMinimized) === minimized) return;
    set({ playerMinimized: minimized });
  }, [minimized, playerMinimized, set]);

  useEffect(() => {
    if (isPlaying) return;
    setMinimized(true);
  }, [isPlaying]);

  useEffect(() => {
    if (!optionsModalOpen) return;
    const onEscape = (event) => {
      if (event.key === "Escape") {
        setOptionsModalOpen(false);
      }
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [optionsModalOpen]);

  useEffect(() => {
    if (!optionsModalOpen) return;
    window.requestAnimationFrame(() => {
      optionsCloseButtonRef.current?.focus();
    });
  }, [optionsModalOpen]);

  /* Wire audio callbacks */
  useEffect(() => {
    audioService.onPlay = (item) => {
      setClosed(false); // rouvre le lecteur s'il etait ferme
      setMinimized(false);
      setAudioError(null);
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
      setCurTime(ct);
      setDuration(dur);
      setProgress(dur ? ct / dur : 0);
    };
    audioService.onError = async (error) => {
      set({ isPlaying: false });
      setNetworkState("error");
      if (audioErrorTimerRef.current) {
        clearTimeout(audioErrorTimerRef.current);
      }
      markReciterUnavailable(reciter, error);
      failedRecitersRef.current.add(reciter);
      const switched = await tryAutoReciterFailover();
      if (switched) {
        setNetworkState("loading");
        setAudioError(
          lang === "fr"
            ? "Le r\u00e9citateur ne chargeait pas. Bascule automatique vers une voix disponible..."
            : lang === "ar"
              ? "\u062a\u0639\u0630\u0631 \u062a\u062d\u0645\u064a\u0644 \u0647\u0630\u0627 \u0627\u0644\u0642\u0627\u0631\u0626. \u064a\u062a\u0645 \u0627\u0644\u062a\u0628\u062f\u064a\u0644 \u062a\u0644\u0642\u0627\u0626\u064a\u0627..."
              : "The reciter failed to load. Switching to an available voice...",
        );
        audioErrorTimerRef.current = setTimeout(() => {
          setAudioError(null);
          audioErrorTimerRef.current = null;
        }, 2600);
        return;
      }
      const msg =
        riwaya === "warsh"
          ? lang === "fr"
            ? "Ce r\u00e9citateur Warsh ne charge pas pour le moment. R\u00e9essayez ou choisissez un autre r\u00e9citateur."
            : lang === "ar"
              ? "صوت ورش غير متاح الآن. تحقق من الاتصال أو اختر قارئا آخر."
              : "Warsh audio unavailable. Check your connection or switch reciter."
          : lang === "fr"
            ? "Ce r\u00e9citateur ne charge pas pour le moment. R\u00e9essayez ou choisissez un autre r\u00e9citateur."
            : lang === "ar"
              ? "تعذر تحميل الصوت."
              : "Audio load error.";
      setAudioError(msg);
      audioErrorTimerRef.current = setTimeout(() => {
        setAudioError(null);
        audioErrorTimerRef.current = null;
      }, 5000);
    };
    audioService.onNetworkState = (st) => {
      setNetworkState(st || "idle");
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
        icon: "fa-spinner fa-spin",
        text:
          lang === "fr"
            ? "Chargement audio..."
            : lang === "ar"
              ? "جار تحميل الصوت..."
              : "Loading audio...",
      };
    }
    if (networkState === "stalled") {
      return {
        icon: "fa-wifi",
        text:
          lang === "fr"
            ? "Connexion instable"
            : lang === "ar"
              ? "اتصال غير مستقر"
              : "Unstable connection",
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
    const activeCdnType = currentReciter.cdnType || "islamic";

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
    if (memMode)
      audioService.enableMemorization(memRepeatCount, memPause * 1000);
    else audioService.disableMemorization();
  }, [memMode, memRepeatCount, memPause]);

  useEffect(() => {
    audioService.setSurahRepeatCount(surahRepeatCount);
  }, [surahRepeatCount]);

  /* Controls */
  const toggle = useCallback(() => audioService.toggle(), []);
  const stop = useCallback(() => audioService.stop(), []);
  const next = useCallback(() => audioService.next(), []);
  const prev = useCallback(() => audioService.prev(), []);

  const seekFromClientX = useCallback((clientX) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    audioService.seekPercent(pct);
  }, []);

  const handleSeek = useCallback(
    (e) => {
      seekFromClientX(e.clientX);
    },
    [seekFromClientX],
  );

  const handleProgressKeyDown = useCallback(
    (event) => {
      let nextProgress = progress;
      if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
        nextProgress = progress - 0.05;
      } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
        nextProgress = progress + 0.05;
      } else if (event.key === "Home") {
        nextProgress = 0;
      } else if (event.key === "End") {
        nextProgress = 1;
      } else {
        return;
      }
      event.preventDefault();
      audioService.seekPercent(Math.max(0, Math.min(1, nextProgress)));
    },
    [progress],
  );

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

  const toggleMinimized = useCallback(() => {
    setOptionsModalOpen(false);
    setMinimized((prev) => !prev);
  }, []);

  const closeOptionsModal = useCallback(() => {
    setOptionsModalOpen(false);
  }, []);

  const toggleOptionsModal = useCallback(() => {
    setOptionsModalOpen((prev) => !prev);
  }, []);

  const closePlayer = useCallback(() => {
    audioService.stop();
    setMinimized(false);
    setOptionsModalOpen(false);
    setAudioError(null);
    setNetworkState("idle");
    set({ playerMinimized: false });
    setClosed(true);
  }, [set]);

  const currentReciters = sortRecitersByPreference(
    getRecitersByRiwaya(riwaya),
    {
      currentReciterId: reciter,
      favoriteReciters,
      latencyByKey: reciterLatencyByKey,
      availabilityById: reciterAvailabilityById,
    },
  );
  /* Reciter search */
  const [reciterSearch, setReciterSearch] = useState("");
  const showMemorizationControls = true;
  const filteredReciters = React.useMemo(() => {
    const q = reciterSearch.trim().toLowerCase();
    if (!q) return currentReciters;
    return currentReciters.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.nameEn.toLowerCase().includes(q) ||
        r.nameFr.toLowerCase().includes(q),
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
      if (!nextReciterId || nextReciterId === reciter || reciterSwitchingId)
        return;
      const target = currentReciters.find((r) => r.id === nextReciterId);
      if (!target) return;

      const remainingMs = getReciterUnavailableRemainingMs(
        nextReciterId,
        reciterAvailabilityRef.current,
      );
      if (remainingMs > 0) {
        const retryLabel = formatCooldownLabel(remainingMs, lang);
        toast(
          lang === "fr"
            ? `Ce r\u00e9citateur est temporairement indisponible. R\u00e9essayez dans ${retryLabel}.`
            : lang === "ar"
              ? `هذا القارئ غير متاح مؤقتا. حاول بعد ${retryLabel}.`
              : `This reciter is temporarily unavailable. Try again in ${retryLabel}.`,
          "warning",
        );
        return;
      }

      setReciterSwitchingId(nextReciterId);
      try {
        await audioService.switchReciter(
          target.cdn,
          target.cdnType || "islamic",
        );
        markReciterAvailable(nextReciterId);
        set({ reciter: nextReciterId });
      } catch (error) {
        markReciterUnavailable(nextReciterId, error);
        console.error("Instant reciter switch failed:", error);
        toast(
          lang === "fr"
            ? "Le changement instantan\u00e9 du r\u00e9citateur a \u00e9chou\u00e9."
            : lang === "ar"
              ? "تعذر تبديل القارئ فوريا."
              : "Instant reciter switch failed.",
          "warning",
        );
      } finally {
        setReciterSwitchingId(null);
      }
    },
    [
      currentReciters,
      lang,
      markReciterAvailable,
      markReciterUnavailable,
      reciter,
      reciterSwitchingId,
      set,
    ],
  );

  const { currentSurah } = state;
  currentSurahRef.current = currentSurah;
  const surahMeta = getSurah(currentSurah);
  const currentSurahName = surahMeta ? surahName(currentSurah, lang) : "";
  const currentArabicName = surahMeta?.ar || "";

  const reciterObj = currentReciters.find((r) => r.id === reciter);
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
    artwork: null,
    isPlaying,
    onPlay: () => audioService.resume(),
    onPause: () => audioService.pause(),
    onNext: next,
    onPrev: prev,
  });

  useAutoScrollAyah({
    currentAyah: currentPlayingAyah,
    currentSurah,
    isPlaying,
  });

  const normalizeAyahText = (value) =>
    typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  const currentAyahText = (() => {
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

  const audioRegionLabel =
    lang === "ar" ? "\u0645\u0634\u063a\u0644 \u0627\u0644\u0635\u0648\u062a" : lang === "fr" ? "Lecteur audio" : "Audio player";
  const minimizedAudioRegionLabel =
    lang === "ar" ? "\u0645\u0634\u063a\u0644 \u0627\u0644\u0635\u0648\u062a \u0627\u0644\u0645\u0635\u063a\u0631" : lang === "fr" ? "Lecteur audio r\u00e9duit" : "Minimized audio player";
  const readyLabel =
    lang === "ar" ? "\u062c\u0627\u0647\u0632" : lang === "fr" ? "Pr\u00eat \u00e0 lire" : "Ready";
  const closeLabel =
    lang === "ar" ? "\u0627\u063a\u0644\u0627\u0642" : lang === "fr" ? "Fermer" : "Close";
  const expandLabel =
    lang === "ar" ? "\u062a\u0648\u0633\u064a\u0639" : lang === "fr" ? "Agrandir" : "Expand";
  const minimizeLabel =
    lang === "ar" ? "\u062a\u0635\u063a\u064a\u0631" : lang === "fr" ? "R\u00e9duire" : "Minimize";
  const optionsLabel =
    lang === "ar" ? "\u0627\u0644\u062e\u064a\u0627\u0631\u0627\u062a \u0648\u0627\u0644\u0642\u0631\u0627\u0621" : lang === "fr" ? "Options et r\u00e9citateurs" : "Options and reciters";
  const playPauseLabel = isPlaying ? t("audio.pause", lang) : t("audio.play", lang);
  const speedLabel =
    lang === "ar" ? "\u0627\u0644\u0633\u0631\u0639\u0629" : lang === "fr" ? "Vitesse" : "Speed";
  const progressLabel =
    lang === "ar"
      ? "\u062a\u0642\u062f\u0645 \u0627\u0644\u062a\u0634\u063a\u064a\u0644"
      : lang === "fr"
        ? "Progression audio"
        : "Audio progress";

  /* Shared button classes (mobile bar) */
  const playerSoftSurfaceClass =
    "rounded-[20px] border border-[color-mix(in_srgb,var(--theme-border)_62%,transparent_38%)] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--theme-panel-bg-strong)_84%,transparent_16%),color-mix(in_srgb,var(--theme-panel-bg)_74%,transparent_26%))] shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]";
  const playerSectionLabelClass =
    "mb-2 text-[0.56rem] font-bold uppercase tracking-[0.18em] text-[color-mix(in_srgb,var(--theme-primary)_68%,var(--theme-text)_32%)] [font-family:var(--font-ui)]";
  const playerMutedTextClass =
    "text-[rgba(233,223,202,0.74)] [font-family:var(--font-ui)]";
  const playerSearchInputClass =
    "audio-reciter-options__search-input w-full rounded-xl border border-white/12 bg-[rgba(6,13,24,0.78)] py-1.5 ps-11 pe-10 text-[0.64rem] text-[rgba(245,236,217,0.9)] outline-none [font-family:var(--font-ui)] focus:border-[rgba(122,188,210,0.4)] focus:ring-2 focus:ring-[rgba(122,188,210,0.18)]";
  const playerNumberInputClass =
    "w-12 rounded-xl border border-white/12 bg-[rgba(6,13,24,0.78)] px-1.5 py-1 text-center text-[0.72rem] text-[rgba(250,240,220,0.95)] outline-none [font-family:var(--font-ui)] focus:border-[rgba(122,188,210,0.42)] focus:ring-2 focus:ring-[rgba(122,188,210,0.18)]";
  const playerCardToggleClass = (active = false) =>
    cn(
      "flex items-center justify-between gap-2 rounded-2xl border px-3 py-1.5 text-[0.7rem] font-semibold transition-all duration-150 [font-family:var(--font-ui)]",
      active
        ? "border-[rgba(122,188,210,0.42)] bg-[rgba(122,188,210,0.16)] text-[rgba(245,250,255,0.98)]"
        : "border-white/12 bg-white/[0.045] text-[rgba(236,227,208,0.72)] hover:border-[rgba(122,188,210,0.34)] hover:bg-[rgba(122,188,210,0.1)]",
    );
  const playerOptionPillClass = (active = false) =>
    cn(
      "rounded-xl border px-2 py-1 text-[0.6rem] font-semibold transition-all [font-family:var(--font-ui)]",
      active
        ? "border-[rgba(122,188,210,0.42)] bg-[rgba(122,188,210,0.18)] text-white"
        : "border-white/12 bg-white/[0.045] text-[rgba(236,227,208,0.72)] hover:border-[rgba(122,188,210,0.34)] hover:bg-[rgba(122,188,210,0.1)]",
    );
  const playerGoldMetaClass =
    "text-[color-mix(in_srgb,var(--theme-primary)_72%,var(--theme-text)_28%)] [font-family:var(--font-ui)]";
  const playerFadedTextClass =
    "text-[rgba(195,186,167,0.56)] [font-family:var(--font-ui)]";
  const playerSurfaceButtonClass =
    "rounded-2xl border border-white/12 bg-white/[0.045] text-[rgba(234,224,205,0.74)] transition-all duration-150 [font-family:var(--font-ui)] hover:border-[rgba(122,188,210,0.34)] hover:bg-[rgba(122,188,210,0.1)] hover:text-white";
  const playerReciterButtonClass = (
    active = false,
    isLoading = false,
    isUnavailable = false,
  ) =>
    cn(
      "group flex min-h-[3.8rem] w-full items-start gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all duration-150",
      active
        ? "border-[rgba(122,188,210,0.42)] bg-[rgba(122,188,210,0.16)] text-[rgba(249,253,255,0.98)]"
        : "border-white/10 bg-white/[0.04] text-[rgba(232,222,202,0.74)] hover:border-[rgba(122,188,210,0.34)] hover:bg-[rgba(122,188,210,0.1)]",
      isUnavailable &&
        !active &&
        "border-rose-300/30 bg-rose-300/10 text-rose-100 hover:border-rose-300/40 hover:bg-rose-300/16",
      isLoading && "animate-pulse",
    );
  const audioOptionsModal = (
    <AudioOptionsModal
      audioSpeed={audioSpeed}
      autoSelectFastestReciter={autoSelectFastestReciter}
      closeOptionsModal={closeOptionsModal}
      currentReciters={currentReciters}
      cycleSpeed={cycleSpeed}
      filteredReciters={filteredReciters}
      favoriteReciters={favoriteReciters}
      handleReciterSelect={handleReciterSelect}
      handleVolumeChange={handleVolumeChange}
      isSurahStreamReciter={isSurahStreamReciter}
      lang={lang}
      memMode={memMode}
      memPause={memPause}
      memRepeatCount={memRepeatCount}
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
      set={set}
      setReciterSearch={setReciterSearch}
      setSurahRepeatSetting={setSurahRepeatSetting}
      setSyncOffsetMs={setSyncOffsetMs}
      showMemorizationControls={showMemorizationControls}
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
    if (!showWordByWord) return;
    if (!isContextualDesktop || isMobile || minimized) {
      return;
    }
    setOptionsModalOpen(false);
    setMinimized(true);
  }, [
    isContextualDesktop,
    isMobile,
    minimized,
    showWordByWord,
  ]);

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
      const reservedHeight = minimized ? 76 : usesWideDock ? 64 : 108;
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

    const reservedHeight = minimized ? 108 : 360;
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
      {/* Screen-reader live region: announces ayah changes during memorization mode */}
      {memMode && (
        <div
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {currentPlayingAyah?.ayah
            ? `${t("quran.surah", lang)} ${currentPlayingAyah.surah} · ${t("quran.ayah", lang)} ${currentPlayingAyah.ayah}`
            : ""}
        </div>
      )}
      {audioError && (
        <div
          className="pointer-events-none fixed left-1/2 z-[430] flex max-w-[min(90vw,360px)] -translate-x-1/2 items-center gap-2 rounded-xl border border-rose-200/20 bg-rose-700/95 px-4 py-2.5 text-center text-xs font-semibold text-white shadow-xl"
          style={{ top: "calc(var(--header-h, 72px) + 0.5rem)" }}
          role="alert"
        >
          <AlertCircle size={15} className="shrink-0" />
          <span>{audioError}</span>
        </div>
      )}

      <SimpleAudioPlayerView
        audioError={audioError}
        audioIndicatorState={audioIndicatorState}
        audioSpeed={audioSpeed}
        closeLabel={closeLabel}
        currentArabicName={currentArabicName}
        currentAyahPreview={currentAyahPreview}
        currentTime={currentTime}
        duration={duration}
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
        onDragPointerDown={handlePlayerDragPointerDown}
        onExpand={toggleMinimized}
        onMinimize={toggleMinimized}
        onNext={next}
        onOptions={toggleOptionsModal}
        onPrevious={prev}
        onProgressClick={handleSeek}
        onProgressKeyDown={handleProgressKeyDown}
        onProgressPointerDown={handleProgressPointerDown}
        onToggle={toggle}
        optionsLabel={optionsLabel}
        optionsOpen={optionsModalOpen}
        playPauseLabel={playPauseLabel}
        playerDragging={playerDragging}
        playerPosition={playerPosition}
        playerRef={playerRef}
        previousLabel={t("audio.prev", lang)}
        progress={progress}
        progressDragging={progressDragging}
        progressLabel={progressLabel}
        progressRef={progressRef}
        reciter={reciterObj}
        reciterLabel={reciterLabel}
        regionLabel={minimized ? minimizedAudioRegionLabel : audioRegionLabel}
        riwaya={riwaya}
        speedLabel={speedLabel}
        title={titleLabel || readyLabel}
      />

      {audioOptionsModal}
    </>
  );
}
