import React, { useState, useEffect, useRef, useCallback } from "react";
import "../styles/domains/audio-legacy.css";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import audioService from "../services/audioService";
import {
  ensureReciterForRiwaya,
  getReciter,
  getRecitersByRiwaya,
} from "../data/reciters";
import { getSurah, surahName } from "../data/surahs";
import {
  getLatencyForReciter,
  getReciterUnavailableRemainingMs,
  isReciterTemporarilyUnavailable,
  sortRecitersByPreference,
} from "../utils/reciterRanking";
import { cn, toast } from "../lib/utils";
import { formatCooldownLabel } from "../utils/formatUtils";
import AudioLoadingIndicator from "./AudioLoadingIndicator";
import AudioOptionsModal from "./audioPlayer/AudioOptionsModal";
import {
  CoverArt,
  IconBtn,
  ProgressRail,
  ReciterAvatar,
  Waveform,
} from "./audioPlayer/AudioPlayerPrimitives";
import {
  MOBILE_BREAKPOINT,
  getReciterCooldownMs,
} from "./audioPlayer/audioPlayerUtils";
import { usePlayerDragPosition } from "./audioPlayer/usePlayerDragPosition";

/* Main component */
export default function AudioPlayer() {
  const { state, dispatch, set } = useApp();
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
    warshStrictMode,
    volume: savedVolume,
    showHome,
    showDuas,
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
  const [expanded, setExpanded] = useState(false);
  const [minimized, setMinimized] = useState(Boolean(playerMinimized));
  const [volume, setVolume] = useState(savedVolume ?? 1);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    const isTouch = window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
    return window.innerWidth < MOBILE_BREAKPOINT || isTouch;
  });
  const [audioError, setAudioError] = useState(null);
  const [networkState, setNetworkState] = useState("idle");
  const [optionsModalOpen, setOptionsModalOpen] = useState(false);
  const [reciterSwitchingId, setReciterSwitchingId] = useState(null);

  /* Fermeture / refs stables pour callbacks */
  const [closed, setClosed] = useState(false);
  const currentSurahRef = useRef(null);
  const karaokeFollowRef = useRef(true);

  /* A-B Repeat state */
  const [abA, setAbA] = useState(null); // { idx, surah, ayah }
  const [abB, setAbB] = useState(null); // { idx, surah, ayah }

  /* EQ preset */
  const [eqPreset, setEqPreset] = useState("flat");

  /* Tartil progressive */
  const [tartilMode, setTartilMode] = useState(false);

  /* Recitation mode (Web Speech API) */
  const [reciteMode, setReciteMode] = useState(false);
  const [reciteText, setReciteText] = useState("");
  const [reciteResult, setReciteResult] = useState(null); // 'ok'|'partial'|'wrong'|null
  const reciteRecogRef = useRef(null);
  const optionsCloseButtonRef = useRef(null);

  const progressRef = useRef(null);
  const audioErrorTimerRef = useRef(null);
  const autoFailoverBusyRef = useRef(false);
  const failedRecitersRef = useRef(new Set());
  const reciterAvailabilityRef = useRef(reciterAvailabilityById || {});
  const autoIdleMinimizeArmedRef = useRef(false);

  useEffect(() => {
    reciterAvailabilityRef.current = reciterAvailabilityById || {};
  }, [reciterAvailabilityById]);

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
      const isTouch = window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT || isTouch);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    setMinimized(Boolean(playerMinimized));
  }, [playerMinimized]);

  useEffect(() => {
    if (Boolean(playerMinimized) === minimized) return;
    set({ playerMinimized: minimized });
  }, [minimized, playerMinimized, set]);

  useEffect(() => {
    if (isMobile || !showHome || isPlaying || currentPlayingAyah) return;
    setMinimized(true);
  }, [currentPlayingAyah, isMobile, isPlaying, showHome]);

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
      set({
        isPlaying: true,
        currentPlayingAyah: item
          ? {
              surah: item.surah,
              ayah: item.ayah,
              globalNumber: item.globalNumber,
            }
          : null,
      });
    };
    audioService.onPause = () => set({ isPlaying: false });
    audioService.onEnd = () => {
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
      set({
        currentPlayingAyah: {
          surah: item.surah,
          ayah: item.ayah,
          globalNumber: item.globalNumber,
        },
      });
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

  /* A-B Repeat handlers */
  const markAbA = useCallback(() => {
    const idx = audioService.playlistIndex;
    const item = audioService.currentAyah;
    if (idx < 0 || !item) return;
    setAbA({ idx, surah: item.surah, ayah: item.ayah });
    audioService.setAbRepeat(idx, abB?.idx ?? -1);
  }, [abB]);

  const markAbB = useCallback(() => {
    const idx = audioService.playlistIndex;
    const item = audioService.currentAyah;
    if (idx < 0 || !item) return;
    setAbB({ idx, surah: item.surah, ayah: item.ayah });
    audioService.setAbRepeat(abA?.idx ?? -1, idx);
  }, [abA]);

  const clearAb = useCallback(() => {
    setAbA(null);
    setAbB(null);
    audioService.clearAbRepeat();
  }, []);

  /* EQ preset handler */
  const handleEq = useCallback((preset) => {
    setEqPreset(preset);
    audioService.applyEqPreset(preset);
  }, []);

  /* Tartil toggle */
  const toggleTartil = useCallback(() => {
    const next = !tartilMode;
    setTartilMode(next);
    audioService.setTartilMode(next, audioSpeed);
  }, [tartilMode, audioSpeed]);

  /* Recitation mode */
  const startRecite = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      toast(
        lang === "fr"
          ? "Reconnaissance vocale non disponible sur ce navigateur."
          : lang === "ar"
            ? "القارئ الصوتي غير متاح في هذا المصحف."
            : "Speech recognition is not available in this browser.",
        "warning",
      );
      return;
    }
    setReciteMode(true);
    setReciteResult(null);
    setReciteText("");
    const r = new SR();
    r.lang = "ar-SA";
    r.continuous = false;
    r.interimResults = true;
    r.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((x) => x[0].transcript)
        .join(" ");
      setReciteText(transcript);
      if (e.results[0].isFinal) {
        const ayahText = audioService.currentAyah?.text || "";
        const match =
          ayahText && transcript && ayahText.includes(transcript.slice(0, 8));
        setReciteResult(match ? "ok" : "partial");
      }
    };
    r.onerror = () => {
      setReciteResult("wrong");
    };
    r.onend = () => {
      setReciteMode(false);
    };
    r.start();
    reciteRecogRef.current = r;
  }, [lang]);

  const stopRecite = useCallback(() => {
    reciteRecogRef.current?.stop();
    setReciteMode(false);
  }, []);

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
    setExpanded(false);
    setOptionsModalOpen(false);
    setMinimized((prev) => !prev);
  }, []);

  const closeOptionsModal = useCallback(() => {
    setOptionsModalOpen(false);
    setExpanded(false);
  }, []);

  const toggleOptionsModal = useCallback(() => {
    setOptionsModalOpen((prev) => {
      if (prev) setExpanded(false);
      return !prev;
    });
  }, []);

  const closePlayer = useCallback(() => {
    audioService.stop();
    setMinimized(false);
    setExpanded(false);
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
  const isWarshMode = riwaya === "warsh";

  /* Reciter search */
  const [reciterSearch, setReciterSearch] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const essentialPlayerMode = true;
  const showMemorizationControls = !essentialPlayerMode;
  const showAdvancedControls = !essentialPlayerMode;
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

  useEffect(() => {
    if (essentialPlayerMode && memMode) {
      set({ memMode: false });
    }
  }, [essentialPlayerMode, memMode, set]);

  useEffect(() => {
    set({ karaokeFollow: true });
  }, [set]);

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
  karaokeFollowRef.current = true;
  const surahMeta = getSurah(currentSurah);
  const currentSurahName = surahMeta ? surahName(currentSurah, lang) : "";
  const currentArabicName = surahMeta?.ar || "";

  const reciterObj = currentReciters.find((r) => r.id === reciter);
  const isSurahStreamReciter = reciterObj?.audioMode === "surah";
  const hasAyahContext = Boolean(currentPlayingAyah?.ayah);
  const isHomeDesktop = showHome && !isMobile;
  const isContextualDesktop = !isMobile && !showHome;
  const isReadingDesktop = isContextualDesktop && !showDuas;
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

  // Subtitle shown in the desktop card when nothing is playing
  const idleSubtitle =
    !isPlaying && !currentPlayingAyah
      ? showHome
        ? lang === "ar"
          ? "اضغط للتشغيل"
          : lang === "fr"
            ? "Appuyez sur Play pour ecouter"
            : "Press Play to listen"
        : null
      : null;

  const warshStrictLabel =
    lang === "ar"
      ? "وضع ورش صارم"
      : lang === "fr"
        ? "Warsh strict"
        : "Warsh strict";
  const warshNonStrictLabel =
    lang === "ar"
      ? "وضع ورش عادي"
      : lang === "fr"
        ? "Warsh standard"
        : "Warsh standard";
  const warshVerifiedLabel =
    lang === "ar"
      ? "صوت ورش موثق"
      : lang === "fr"
        ? "Audio Warsh vérifié"
        : "Warsh verified";
  const memorizeShortLabel =
    lang === "ar" ? "حفظ" : lang === "fr" ? "Memo" : "Mem";
  const dockedMetaChips = [
    { key: "riwaya", label: isWarshMode ? "Warsh" : "Hafs", accent: true },
    currentPlayingAyah && {
      key: "ayah",
      label: hasAyahContext
        ? `${currentPlayingAyah.surah}:${currentPlayingAyah.ayah}`
        : `S.${currentPlayingAyah.surah}`,
    },
    audioSpeed !== 1 && { key: "speed", label: `${audioSpeed}x` },
    (surahRepeatCount === 0 || surahRepeatCount > 1) && {
      key: "surah-repeat",
      label:
        surahRepeatCount === 0
          ? lang === "fr"
            ? "Sourate infinie"
            : lang === "ar"
              ? "سورة بلا نهاية"
              : "Surah infinite"
          : lang === "fr"
            ? `Sourate x${surahRepeatCount}`
            : lang === "ar"
              ? `سورة x${surahRepeatCount}`
              : `Surah x${surahRepeatCount}`,
    },
    memMode && { key: "memorize", label: memorizeShortLabel },
    isSurahStreamReciter && {
      key: "mode",
      label: lang === "fr" ? "Sourate" : lang === "ar" ? "سورة" : "Surah",
    },
  ].filter(Boolean);
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
  const searchPlaceholder =
    lang === "ar" ? "\u0627\u0628\u062d\u062b..." : lang === "fr" ? "Rechercher..." : "Search...";
  const openPlayerLabel =
    lang === "ar" ? "\u0641\u062a\u062d \u0627\u0644\u0645\u0634\u063a\u0644" : lang === "fr" ? "Ouvrir le lecteur" : "Open player";
  const audioBrandLabel =
    lang === "ar" ? "\u0635\u0648\u062a" : lang === "fr" ? "Audio" : "Audio";
  const dragPlayerLabel =
    lang === "ar"
      ? "\u0627\u0633\u062d\u0628 \u0644\u062a\u062d\u0631\u064a\u0643 \u0627\u0644\u0645\u0634\u063a\u0644"
      : lang === "fr"
        ? "Maintenir et déplacer le lecteur"
        : "Hold and drag the player";
  const playPauseLabel = isPlaying ? t("audio.pause", lang) : t("audio.play", lang);
  const speedLabel =
    lang === "ar" ? "\u0627\u0644\u0633\u0631\u0639\u0629" : lang === "fr" ? "Vitesse" : "Speed";
  const progressLabel =
    lang === "ar"
      ? "\u062a\u0642\u062f\u0645 \u0627\u0644\u062a\u0634\u063a\u064a\u0644"
      : lang === "fr"
        ? "Progression audio"
        : "Audio progress";
  const volumeLabel = t("audio.volume", lang);

  /* Shared button classes (mobile bar) */
  const playerPanelSurfaceClass =
    "rounded-[26px] border border-[color-mix(in_srgb,var(--theme-border-strong)_34%,transparent_66%)] bg-[linear-gradient(165deg,color-mix(in_srgb,var(--theme-panel-bg-strong)_95%,var(--theme-primary)_5%),color-mix(in_srgb,var(--theme-panel-bg)_93%,var(--theme-bg)_7%))] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.14),0_24px_56px_rgba(2,8,22,0.3)] backdrop-blur-2xl";
  const playerSoftSurfaceClass =
    "rounded-[20px] border border-[color-mix(in_srgb,var(--theme-border)_62%,transparent_38%)] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--theme-panel-bg-strong)_84%,transparent_16%),color-mix(in_srgb,var(--theme-panel-bg)_74%,transparent_26%))] shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]";
  const playerPrimaryBtnClass =
    "audio-player-primary-btn flex items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--theme-primary)_52%,#ffffff_48%)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--theme-primary)_86%,#ffffff_14%),color-mix(in_srgb,var(--theme-primary)_66%,var(--theme-bg)_34%))] text-white shadow-[0_10px_24px_rgba(var(--theme-primary-rgb),0.34)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--theme-primary-rgb),0.44)]";
  const mBarBtn = cn(
    "h-10 w-10 shrink-0 rounded-xl border border-[color-mix(in_srgb,var(--theme-border)_60%,transparent_40%)] bg-[color-mix(in_srgb,var(--theme-panel-bg-strong)_74%,transparent_26%)] text-[0.76rem] text-[color-mix(in_srgb,var(--theme-text)_82%,var(--theme-bg)_18%)]",
    "flex items-center justify-center outline-none transition-all duration-150",
    "hover:border-[color-mix(in_srgb,var(--theme-primary)_42%,transparent_58%)] hover:bg-[rgba(var(--theme-primary-rgb),0.16)] hover:text-white",
    "active:scale-95 focus-visible:ring-2 focus-visible:ring-[rgba(var(--theme-primary-rgb),0.32)]",
  );
  const mBarBtnSm = (active = false) =>
    cn(
      "flex min-h-10 min-w-10 items-center justify-center whitespace-nowrap rounded-lg border px-2 py-1 text-[0.68rem] font-semibold outline-none transition-all duration-150",
      active
        ? "border-[color-mix(in_srgb,var(--theme-primary)_42%,transparent_58%)] bg-[rgba(var(--theme-primary-rgb),0.18)] text-white"
        : "border-[color-mix(in_srgb,var(--theme-border)_60%,transparent_40%)] bg-[color-mix(in_srgb,var(--theme-panel-bg-strong)_74%,transparent_26%)] text-[color-mix(in_srgb,var(--theme-text)_76%,var(--theme-bg)_24%)] hover:border-[color-mix(in_srgb,var(--theme-primary)_36%,transparent_64%)] hover:bg-[rgba(var(--theme-primary-rgb),0.12)] hover:text-white",
      "focus-visible:ring-2 focus-visible:ring-[rgba(var(--theme-primary-rgb),0.28)]",
    );
  const playerBadgeClass =
    "inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--theme-border)_56%,transparent_44%)] bg-[color-mix(in_srgb,var(--theme-panel-bg-strong)_78%,transparent_22%)] px-2 py-0.5 text-[0.6rem] font-semibold text-[color-mix(in_srgb,var(--theme-text)_84%,var(--theme-bg)_16%)] [font-family:var(--font-ui)]";
  const playerSectionLabelClass =
    "mb-2 text-[0.56rem] font-bold uppercase tracking-[0.18em] text-[color-mix(in_srgb,var(--theme-primary)_68%,var(--theme-text)_32%)] [font-family:var(--font-ui)]";
  const playerMutedTextClass =
    "text-[rgba(233,223,202,0.74)] [font-family:var(--font-ui)]";
  const playerSearchInputClass =
    "w-full rounded-xl border border-white/12 bg-[rgba(6,13,24,0.78)] py-1.5 pl-7 pr-6 text-[0.64rem] text-[rgba(245,236,217,0.9)] outline-none [font-family:var(--font-ui)] focus:border-[rgba(122,188,210,0.4)] focus:ring-2 focus:ring-[rgba(122,188,210,0.18)]";
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
  const playerAbButtonClass = (active = false) =>
    cn(
      "rounded-xl border px-2 py-1 text-[0.64rem] font-bold transition-all [font-family:var(--font-ui)]",
      active
        ? "border-[rgba(122,188,210,0.42)] bg-[rgba(122,188,210,0.18)] text-[rgba(245,250,255,0.98)]"
        : "border-white/12 bg-white/[0.045] text-[rgba(236,227,208,0.72)] hover:border-[rgba(122,188,210,0.34)] hover:bg-[rgba(122,188,210,0.1)]",
    );
  const playerUtilityClass =
    "flex items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--theme-border)_60%,transparent_40%)] bg-[color-mix(in_srgb,var(--theme-panel-bg-strong)_76%,transparent_24%)] text-[color-mix(in_srgb,var(--theme-text)_86%,var(--theme-bg)_14%)] transition-all duration-150 hover:border-[rgba(122,188,210,0.34)] hover:bg-[rgba(122,188,210,0.12)] hover:text-white";
  const playerStrongTextClass =
    "text-[rgba(246,238,222,0.98)] [font-family:var(--font-ui)]";
  const playerSubtitleTextClass =
    "text-[color-mix(in_srgb,var(--theme-text-muted)_88%,var(--theme-bg)_12%)] [font-family:var(--font-ui)]";
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

  const cardRef = useRef(null);
  const {
    canDragDesktopCard,
    canFreePosition,
    finishPointerDrag,
    isDragging,
    manualDockPosition,
    onPointerDown,
    onPointerLostCapture,
    onPointerMove,
    resetDockPosition,
  } = usePlayerDragPosition({
    cardRef,
    expanded,
    isContextualDesktop,
    isMobile,
    minimized,
  });

  useEffect(() => {
    if (isPlaying || currentPlayingAyah) {
      autoIdleMinimizeArmedRef.current = true;
      return;
    }
    if (!isContextualDesktop || isMobile) return;
    if (manualDockPosition) return;
    if (autoIdleMinimizeArmedRef.current && !minimized) {
      setMinimized(true);
      autoIdleMinimizeArmedRef.current = false;
    }
  }, [
    currentPlayingAyah,
    isContextualDesktop,
    isMobile,
    isPlaying,
    manualDockPosition,
    minimized,
  ]);

  useEffect(() => {
    if (!showWordByWord) return;
    if (!isContextualDesktop || isMobile || manualDockPosition || minimized) {
      return;
    }
    setExpanded(false);
    setOptionsModalOpen(false);
    setMinimized(true);
  }, [
    isContextualDesktop,
    isMobile,
    manualDockPosition,
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

    // Reserve enough space for the mobile dock so verses and controls are never hidden behind it.
    const reservedHeight = minimized ? 56 : expanded ? 170 : 96;
    root.style.setProperty("--player-h", `${reservedHeight}px`);
    root.style.removeProperty("--desktop-player-reserved-h");

    return () => {
      root.style.removeProperty("--player-h");
      root.style.removeProperty("--desktop-player-reserved-h");
    };
  }, [closed, expanded, isMobile, minimized]);

  useEffect(() => {
    const root = document.documentElement;

    if (isMobile || closed || !isContextualDesktop || manualDockPosition) {
      root.style.removeProperty("--desktop-player-reserved-h");
      return;
    }

    const reservedHeight = minimized ? 132 : expanded ? 390 : 320;
    root.style.setProperty("--desktop-player-reserved-h", `${reservedHeight}px`);

    return () => {
      root.style.removeProperty("--desktop-player-reserved-h");
    };
  }, [
    closed,
    expanded,
    isContextualDesktop,
    isMobile,
    manualDockPosition,
    minimized,
  ]);

  /* Ne rien afficher si le lecteur est ferme */
  const desktopCardWidthClass = isHomeDesktop
    ? "w-[320px]"
    : minimized
      ? "w-[272px]"
      : "w-[336px]";
  const desktopCardPositionClass =
    !manualDockPosition && isHomeDesktop
      ? "right-6 bottom-6 left-auto top-auto"
      : isContextualDesktop && !manualDockPosition
        ? "right-4 bottom-6 left-auto top-auto xl:right-5"
        : "left-[var(--player-left)] top-[var(--player-top)] right-auto bottom-auto";
  const desktopCardShadowClass = isPlaying
    ? "shadow-[0_26px_62px_rgba(2,8,18,0.54),0_0_0_1px_rgba(122,188,210,0.2)]"
    : "shadow-[0_18px_46px_rgba(2,8,18,0.48),0_0_0_1px_rgba(255,255,255,0.08)]";

  if (closed) return null;

  /* Mobile dock */

  if (isMobile) {
    if (minimized) {
      return (
        <div
          className={cn(
            "mp-audio-player mp-audio-player--mobile !fixed bottom-3 left-3 right-3 z-[300] overflow-hidden rounded-2xl text-[color-mix(in_srgb,var(--theme-text)_90%,var(--theme-bg)_10%)]",
            playerPanelSurfaceClass,
            "shadow-[0_20px_44px_rgba(3,8,15,0.48)]",
          )}
          role="region"
          aria-label={minimizedAudioRegionLabel}
        >
          <div className="h-1 bg-white/10">
            <ProgressRail progress={progress} />
          </div>
          <div className="mp-player-minimized-row flex items-center gap-2.5 px-3 py-2.5">
            <CoverArt isPlaying={isPlaying} size={40} reciter={reciterObj} />
            <button
              type="button"
              className="mp-player-minimized-meta mp-player-minimized-open min-w-0 flex-1 text-left"
              onClick={toggleMinimized}
              title={openPlayerLabel}
            >
              <div className="mp-player-minimized-title truncate text-[0.82rem] font-bold leading-tight text-[color-mix(in_srgb,var(--theme-text)_94%,#ffffff_6%)]">
                {titleLabel ||
                  (lang === "fr"
                    ? "Pret a lire"
                    : lang === "ar"
                      ? "جاهز"
                      : "Ready")}
              </div>
              <div className="mp-player-minimized-reciter truncate text-[0.68rem] text-[color-mix(in_srgb,var(--theme-text-muted)_90%,var(--theme-bg)_10%)]">
                {reciterLabel || "-"}
              </div>
            </button>
            <button
              className={cn(playerPrimaryBtnClass, "h-9 w-9 text-[0.8rem]")}
              onClick={toggle}
              title={playPauseLabel}
              aria-label={playPauseLabel}
              aria-pressed={isPlaying}
            >
              <i className={`fas ${isPlaying ? "fa-pause" : "fa-play"}`} />
            </button>
            <button
              className={cn(
                mBarBtn,
                "mp-player-options-trigger h-10 w-10 text-[0.72rem] rounded-xl shrink-0",
              )}
              onClick={toggleOptionsModal}
              aria-controls="audio-options-modal-title"
              aria-expanded={optionsModalOpen}
              title={optionsLabel}
              aria-label={optionsLabel}
            >
              <i className="fas fa-sliders" />
            </button>
            <button
              className={cn(
                mBarBtn,
                "h-10 w-10 text-[0.72rem] rounded-xl shrink-0",
              )}
              onClick={toggleMinimized}
              title={expandLabel}
              aria-label={expandLabel}
            >
              <i className="fas fa-expand-alt" />
            </button>
            <button
              className={cn(
                mBarBtn,
                "h-10 w-10 text-[0.72rem] rounded-xl shrink-0",
              )}
              onClick={closePlayer}
              title={closeLabel}
              aria-label={closeLabel}
            >
              <i className="fas fa-times" />
            </button>
          </div>
          {audioOptionsModal}
        </div>
      );
    }

    return (
      <div
        className={cn(
          "mp-audio-player mp-audio-player--mobile mp-audio-player--dock !fixed bottom-0 left-0 right-0 z-[300] rounded-t-3xl border-t text-[color-mix(in_srgb,var(--theme-text)_92%,var(--theme-bg)_8%)]",
          playerPanelSurfaceClass,
          "rounded-b-none rounded-t-3xl",
          expanded ? "is-expanded" : "is-collapsed",
          expanded
            ? "shadow-[0_-18px_50px_rgba(3,8,15,0.45)]"
            : "shadow-[0_-10px_32px_rgba(3,8,15,0.36)]",
        )}
        role="region"
        aria-label={audioRegionLabel}
      >
          <div className="mp-player-mobile-head flex items-center justify-between px-3.5 pb-1.5 pt-2">
          <button
            className={cn(mBarBtn, "h-9 w-9 rounded-full")}
            onClick={toggleMinimized}
            title={minimizeLabel}
            aria-label={minimizeLabel}
          >
            <i className="fas fa-chevron-down" />
          </button>
          <div className="mp-player-mobile-brand flex min-w-0 items-center gap-2 px-2">
            <div className="h-1 w-9 rounded-full bg-[linear-gradient(90deg,rgba(var(--theme-primary-rgb),0.18),rgba(var(--theme-primary-rgb),0.95),rgba(var(--theme-primary-rgb),0.18))]" />
            <span className="text-[0.62rem] uppercase tracking-[0.14em] text-[color-mix(in_srgb,var(--theme-text-muted)_92%,var(--theme-bg)_8%)] [font-family:var(--font-ui)]">
              {audioBrandLabel}
            </span>
          </div>
          <button
            className={cn(mBarBtn, "h-9 w-9 rounded-full")}
            onClick={closePlayer}
            title={closeLabel}
            aria-label={closeLabel}
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {networkBadge && (
          <div className="px-3 pb-1">
            <div
              className={cn(
                "px-2 py-[0.1875rem] text-[0.62rem] font-semibold",
                playerBadgeClass,
              )}
            >
              <i className={`fas ${networkBadge.icon}`} />
              <span>{networkBadge.text}</span>
            </div>
          </div>
        )}
        {/* Progress bar */}
        <div
          className={cn(
            "relative h-1 cursor-pointer overflow-visible rounded-t-2xl bg-white/12 transition-[height] duration-150 hover:h-1.5",
            "mp-player-progress",
            progressDragging && "ring-2 ring-[rgba(110,204,233,0.4)]",
          )}
          ref={progressRef}
          onClick={handleSeek}
          onPointerDown={handleProgressPointerDown}
          role="progressbar"
          aria-label={progressLabel}
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <ProgressRail progress={progress} showThumb />
        </div>

        {/* Controls row */}
        <div className="mp-player-controls-strip mp-player-mobile-controls flex min-h-[3.55rem] items-center gap-2 px-2.5 pb-1.5">
          {/* Left: info block */}
          <div
            className="mp-player-mobile-meta flex w-[5.1rem] shrink-0 flex-col justify-center gap-[0.16rem] min-w-0"
            aria-live="polite"
          >
            <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-[0.7rem] font-semibold leading-tight text-[color-mix(in_srgb,var(--theme-text)_90%,#ffffff_10%)]">
              {currentPlayingAyah
                ? hasAyahContext
                  ? `${t("quran.surah", lang)} ${currentPlayingAyah.surah}:${currentPlayingAyah.ayah}`
                  : titleLabel
                : lang === "fr"
                  ? "En attente"
                  : lang === "ar"
                    ? "في الانتظار"
                    : "Ready"}
            </span>
            <span className="text-[0.6rem] leading-none text-[color-mix(in_srgb,var(--theme-text-muted)_86%,var(--theme-bg)_14%)] font-mono tabular-nums">
              {formatTime(currentTime)}
              <span className="opacity-50 mx-0.5">/</span>
              {formatTime(duration)}
            </span>
            <AudioLoadingIndicator
              state={audioIndicatorState}
              isPlaying={isPlaying}
              errorMessage={audioError}
            />
          </div>

          {/* Center: main playback controls */}
          <div
            className={cn(
              "mp-player-controls-strip mp-player-mobile-main-controls flex flex-1 items-center justify-center gap-1.5 rounded-xl px-1.5 py-1",
              playerSoftSurfaceClass,
            )}
          >
            <button
              className={cn(
                mBarBtn,
                "h-10 w-10 rounded-lg text-[0.68rem] shrink-0",
              )}
              onClick={prev}
              title={t("audio.prev", lang)}
              aria-label={t("audio.prev", lang)}
            >
              <i className="fas fa-step-backward" />
            </button>

            <button
              className={cn(
                playerPrimaryBtnClass,
                "mp-player-play-btn h-9 w-9 shrink-0 text-[0.82rem] hover:scale-[1.04] active:scale-[0.94]",
              )}
              onClick={toggle}
              title={playPauseLabel}
              aria-label={playPauseLabel}
              aria-pressed={isPlaying}
            >
              <i
                className={`fas ${isPlaying ? "fa-pause" : "fa-play"} ${isPlaying ? "" : "translate-x-px"}`}
              />
            </button>

            <button
              className={cn(
                mBarBtn,
                "h-10 w-10 rounded-lg text-[0.68rem] shrink-0",
              )}
              onClick={next}
              title={t("audio.next", lang)}
              aria-label={t("audio.next", lang)}
            >
              <i className="fas fa-step-forward" />
            </button>

            <button
              className={cn(
                mBarBtn,
                "h-10 w-10 rounded-lg text-[0.68rem] shrink-0",
              )}
              onClick={stop}
              title={t("audio.stop", lang)}
              aria-label={t("audio.stop", lang)}
            >
              <i className="fas fa-stop" />
            </button>
          </div>

          {/* Right: secondary controls */}
          <div className="mp-player-mobile-secondary flex shrink-0 items-center gap-1">
            <button
              className={cn(
                mBarBtnSm(),
                "justify-center rounded-full",
              )}
              onClick={cycleSpeed}
              title={speedLabel}
              aria-label={`${speedLabel} ${audioSpeed}x`}
            >
              {audioSpeed}x
            </button>
            <button
              className={cn(
                mBarBtnSm(optionsModalOpen),
                "mp-player-options-trigger justify-center rounded-full",
              )}
              onClick={toggleOptionsModal}
              aria-expanded={optionsModalOpen}
              aria-controls="audio-options-modal-title"
              aria-label={optionsLabel}
              title={
                optionsModalOpen
                  ? lang === "fr"
                    ? "Réduire"
                    : lang === "ar"
                      ? "الخيارات مفتوحة"
                      : "Options opened"
                  : lang === "fr"
                    ? "Plus d'options"
                    : lang === "ar"
                      ? "خيارات أكثر"
                      : "More options"
              }
            >
              <i className="fas fa-sliders" />
            </button>
          </div>
        </div>

        {/* Expanded panel */}
        {expanded && (
          <div
              className="mp-player-mobile-expanded max-h-[42vh] overflow-y-auto border-t border-[color-mix(in_srgb,var(--theme-border)_58%,transparent_42%)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--theme-panel-bg-strong)_82%,transparent_18%),color-mix(in_srgb,var(--theme-panel-bg)_72%,transparent_28%))] px-3 pb-3.5 pt-2.5 animate-[fadeInUp_0.18s_var(--ease,ease)]"
            data-player-expanded="true"
            data-scroll-panel="true"
            data-no-drag="true"
          >
            {/* Inline audio error */}
            {audioError && (
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-[0.66rem] text-rose-100">
                <i className="fas fa-exclamation-circle shrink-0" />
                <span className="truncate">{audioError}</span>
                <button
                  className="ml-auto rounded-full border border-rose-200/35 bg-white/10 px-2 py-0.5 text-[0.6rem] font-semibold text-rose-50 transition-colors hover:bg-white/20"
                  onClick={toggle}
                  title={
                    lang === "fr"
                      ? "Reessayer"
                      : lang === "ar"
                        ? "إعادة المحاولة"
                        : "Retry"
                  }
                >
                  {lang === "fr"
                    ? "Reessayer"
                    : lang === "ar"
                       ? "إعادة"
                      : "Retry"}
                </button>
              </div>
            )}
            {/* Warsh badge */}
            {isWarshMode && (
              <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2 py-[0.1875rem] text-[0.6rem] font-bold whitespace-nowrap",
                    warshStrictMode
                      ? "bg-[rgba(212,168,32,0.14)] text-[#f5d785] border-[rgba(212,168,32,0.3)]"
                      : "bg-white/[0.07] text-white/50 border-white/10",
                  )}
                >
                  {warshStrictMode ? warshStrictLabel : warshNonStrictLabel}
                </span>
                {warshStrictMode && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(212,168,32,0.3)] bg-[rgba(212,168,32,0.14)] px-2 py-[0.1875rem] text-[0.6rem] font-bold text-[#f5d785]">
                    <i className="fas fa-check text-[0.48rem]" />
                    {warshVerifiedLabel}
                  </span>
                )}
                {isSurahStreamReciter && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-fuchsia-300/30 bg-fuchsia-300/12 px-2 py-[0.1875rem] text-[0.6rem] font-bold text-fuchsia-100">
                    <i className="fas fa-compact-disc text-[0.48rem]" />
                    {lang === "fr"
                      ? "Lecture sourate complète"
                      : lang === "ar"
                         ? "قراءة السورة كاملة"
                        : "Full-surah playback"}
                  </span>
                )}
              </div>
            )}

            {/* Reciter section */}
            <div className="mb-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className={playerSectionLabelClass}>
                  {t("audio.reciter", lang)}
                </span>
                <span
                  className={cn(
                    playerGoldMetaClass,
                    "text-[0.56rem] font-semibold tabular-nums",
                  )}
                >
                  {filteredReciters.length !== currentReciters.length
                    ? `${filteredReciters.length} / ${currentReciters.length}`
                    : currentReciters.length}
                </span>
              </div>
              {/* Search box */}
              {currentReciters.length > 4 && (
                <div className="relative mb-1.5">
                  <i className="fas fa-search pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[0.5rem] text-[rgba(240,234,214,0.3)]" />
                  <input
                    type="text"
                    value={reciterSearch}
                    onChange={(e) => setReciterSearch(e.target.value)}
                    placeholder={
                      searchPlaceholder
                    }
                    className={playerSearchInputClass}
                  />
                  {reciterSearch && (
                    <button
                      onClick={() => setReciterSearch("")}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[0.45rem] text-[rgba(240,234,214,0.35)]"
                    >
                      <i className="fas fa-times" />
                    </button>
                  )}
                </div>
              )}
              <div
                className="max-h-52 overflow-y-auto pr-1"
                data-scroll-panel="true"
                data-no-drag="true"
              >
                {filteredReciters.length === 0 ? (
                  <div
                    className={cn(
                      playerFadedTextClass,
                      "py-2 text-center text-[0.62rem]",
                    )}
                  >
                    {lang === "fr"
                      ? "Aucun resultat"
                      : lang === "ar"
                         ? "لا توجد نتائج"
                        : "No results"}
                  </div>
                ) : (
                  <div
                    className={cn(
                      "grid gap-1",
                      isReadingDesktop ? "grid-cols-1" : "grid-cols-2",
                    )}
                  >
                    {filteredReciters.map((r) => {
                      const active = reciter === r.id;
                      const isLoading =
                        reciterSwitchingId === r.id ||
                        (active && networkState === "loading");
                      const initial = (r.nameEn ||
                        r.name ||
                        "?")[0].toUpperCase();
                      return (
                        <button
                          key={r.id}
                          onClick={() => handleReciterSelect(r.id)}
                          className={playerReciterButtonClass(
                            active,
                            isLoading,
                          )}
                          aria-pressed={active}
                          disabled={Boolean(reciterSwitchingId)}
                        >
                          <ReciterAvatar
                            reciter={r}
                            active={active}
                            loading={isLoading}
                          />
                          <span className="flex min-w-0 flex-col">
                            <span className="text-[0.68rem] font-semibold leading-tight truncate">
                              {lang === "ar"
                                ? r.name
                                : lang === "fr"
                                  ? r.nameFr
                                  : r.nameEn}
                            </span>
                            {r.style && (
                              <span className="truncate text-[0.52rem] uppercase leading-tight tracking-wide text-[rgba(240,234,214,0.35)]">
                                {r.style}
                              </span>
                            )}
                            {r.cdnType && (
                              <span className="mt-1 inline-flex items-center rounded-full border border-white/12 bg-white/[0.06] px-1.5 py-0.5 text-[0.5rem] font-semibold tracking-wide text-[rgba(225,214,194,0.7)]">
                                {r.cdnType === "islamic"
                                  ? "Islamic CDN"
                                  : r.cdnType === "mp3quran-surah"
                                    ? "MP3Quran"
                                    : "EveryAyah CDN"}
                              </span>
                            )}
                            {r.audioMode === "surah" && (
                              <span className="mt-1 inline-flex items-center rounded-full border border-fuchsia-300/30 bg-fuchsia-300/10 px-1.5 py-0.5 text-[0.5rem] font-semibold tracking-wide text-fuchsia-100">
                                {lang === "fr"
                                  ? "Sourate complète"
                                  : lang === "ar"
                                     ? "سورة كاملة"
                                    : "Full surah"}
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Volume */}
            <div
              className={cn(
                "mt-2.5 flex items-center gap-2 px-2 py-2",
                playerSoftSurfaceClass,
              )}
            >
              <button
                onClick={() => handleVolumeChange(volume > 0 ? 0 : 1)}
                className="h-7 w-7 shrink-0 rounded-lg border border-white/12 bg-white/[0.06] text-[0.72rem] text-[rgba(132,205,228,0.9)] transition-colors duration-150 hover:bg-[rgba(110,204,233,0.14)]"
                title={
                  volume > 0
                    ? lang === "fr"
                      ? "Muet"
                      : lang === "ar"
                         ? "كتم"
                        : "Mute"
                    : lang === "fr"
                      ? "Activer"
                      : lang === "ar"
                         ? "رفع الصوت"
                        : "Unmute"
                }
              >
                <i
                  className={`fas ${volume === 0 ? "fa-volume-xmark" : volume < 0.5 ? "fa-volume-low" : "fa-volume-high"}`}
                />
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="h-1 flex-1 cursor-pointer rounded-full accent-[rgb(110,204,233)]"
              />
              <span
                className={cn(
                  playerGoldMetaClass,
                  "w-8 shrink-0 text-right text-[0.58rem] font-semibold tabular-nums",
                )}
              >
                {Math.round(volume * 100)}%
              </span>
            </div>

            {/* Memorization settings */}
            {showMemorizationControls && memMode && (
              <div className="mt-2.5">
                <span className={playerSectionLabelClass}>
                  {t("audio.memorization", lang)}
                </span>
                <div className="flex gap-3 flex-wrap mt-1.5">
                  {[
                    {
                      label: t("audio.repeat", lang),
                      val: memRepeatCount,
                      key: "memRepeatCount",
                      min: 1,
                      max: 100,
                    },
                    {
                      label: `${t("audio.pause", lang)} (s)`,
                      val: memPause,
                      key: "memPause",
                      min: 0,
                      max: 60,
                    },
                  ].map(({ label, val, key, min, max }) => (
                    <div
                      key={key}
                      className="flex items-center gap-1.5 text-[0.7rem] text-[rgba(240,234,214,0.75)]"
                    >
                      <span>{label}</span>
                      <input
                        type="number"
                        min={min}
                        max={max}
                        value={val}
                        onChange={(e) =>
                          set({ [key]: parseInt(e.target.value) || min })
                        }
                        className={playerNumberInputClass}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fermer */}
            <div
              className={cn(
                "mt-2.5 flex items-center gap-2 p-2",
                playerSoftSurfaceClass,
              )}
            >
              <button
                className={cn(mBarBtnSm(), "w-full gap-1.5 justify-center")}
                onClick={closePlayer}
                title={lang === "fr" ? "Fermer le lecteur" : "Close player"}
              >
                <i className="fas fa-times text-[0.6rem]" />
                {lang === "fr" ? "Fermer" : lang === "ar" ? "إغلاق" : "Close"}
              </button>
            </div>

            {/* -- Options avancees toggle (mobile) -- */}
            {showAdvancedControls && (
              <>
                <div className="mt-2 mb-0.5">
                  <button
                    onClick={() => setShowAdvanced((v) => !v)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg border px-2 py-1 text-[0.58rem] font-bold uppercase tracking-widest transition-all [font-family:var(--font-ui)]",
                      showAdvanced
                        ? "border-[rgba(110,204,233,0.35)] bg-[rgba(110,204,233,0.12)] text-[rgba(240,250,255,0.95)]"
                        : "border-white/10 bg-transparent text-[rgba(230,219,198,0.58)]",
                    )}
                  >
                    <span className="flex items-center gap-1">
                      <i className="fas fa-sliders text-[0.48rem]" />
                      {lang === "fr"
                        ? "Options"
                        : lang === "ar"
                          ? "خيارات"
                          : "Options"}
                    </span>
                    <i
                      className={`fas fa-chevron-${showAdvanced ? "up" : "down"} text-[0.48rem]`}
                    />
                  </button>
                </div>
                {showAdvanced && (
                  <>
                    {/* -- A-B Repeat (mobile) -- */}
                    <div className="mt-2.5">
                      <div className={cn(playerSectionLabelClass, "mb-1")}>
                        A-B Repeat
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {[
                          { mark: markAbA, val: abA, lbl: "A" },
                          { mark: markAbB, val: abB, lbl: "B" },
                        ].map(({ mark, val, lbl }) => (
                          <button
                            key={lbl}
                            onClick={mark}
                            className={cn(mBarBtnSm(!!val), "px-2 py-1")}
                            disabled={!hasAyahContext}
                          >
                            {val ? `${lbl}: ${val.surah}:${val.ayah}` : lbl}
                          </button>
                        ))}
                        {(abA || abB) && (
                          <button
                            onClick={clearAb}
                            className={cn(mBarBtnSm(), "px-2 py-1")}
                          >
                            <i className="fas fa-times" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* -- EQ presets (mobile) -- */}
                    <div className="mt-2.5">
                      <div className={cn(playerSectionLabelClass, "mb-1")}>
                        {lang === "fr"
                          ? "Acoustique"
                          : lang === "ar"
                            ? "الصوتيات"
                            : "Acoustics"}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {[
                          { id: "flat", fr: "Plat", ar: "Flat", en: "Flat" },
                          { id: "bass", fr: "Graves", ar: "Bass", en: "Bass" },
                          {
                            id: "treble",
                            fr: "Aigus",
                            ar: "حاد",
                            en: "Treble",
                          },
                          { id: "near", fr: "Proche", ar: "Near", en: "Near" },
                          { id: "hall", fr: "Salle", ar: "Hall", en: "Hall" },
                          {
                            id: "vocals",
                            fr: "Voix",
                            ar: "Vocals",
                            en: "Vocals",
                          },
                        ].map((p) => (
                          <button
                            key={p.id}
                            onClick={() => handleEq(p.id)}
                            className={cn(
                              mBarBtnSm(eqPreset === p.id),
                              "px-1.5",
                            )}
                          >
                            {lang === "ar" ? p.ar : lang === "fr" ? p.fr : p.en}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* -- Tartil + recitation (mobile) -- */}
                    <div className="flex gap-1.5 mt-2">
                      <button
                        onClick={toggleTartil}
                        className={cn(
                          mBarBtnSm(tartilMode),
                          "flex-1 gap-1 justify-center",
                        )}
                        aria-pressed={tartilMode}
                      >
                        <i className="fas fa-wave-square text-[0.6rem]" />
                        {lang === "fr"
                          ? "Tartil"
                          : lang === "ar"
                          ? "ترتيل"
                            : "Tartil"}
                      </button>
                      <button
                        onClick={reciteMode ? stopRecite : startRecite}
                        className={cn(
                          mBarBtnSm(reciteMode),
                          reciteMode &&
                            "border-[rgba(34,197,94,0.4)] text-[#86efac]",
                          "flex-1 gap-1 justify-center",
                        )}
                      >
                        <i
                          className={`fas ${reciteMode ? "fa-stop" : "fa-microphone"} text-[0.6rem]`}
                        />
                        {lang === "fr"
                        ? "Réciter"
                          : lang === "ar"
                             ? "التلاوة"
                            : "Recite"}
                      </button>
                    </div>
                    {reciteMode && reciteText && (
                      <div
                        className="mt-1.5 rounded-lg border border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.08)] px-2 py-1.5 text-right text-[0.65rem] text-[#86efac]"
                        dir="rtl"
                      >
                        {reciteText}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}
        {audioOptionsModal}
      </div>
    );
  }

  /* Desktop card */

  return (
    <>
      {/* Audio error banner */}
      {audioError && (
        <div className="pointer-events-none fixed left-1/2 top-[72px] z-[400] flex max-w-[340px] -translate-x-1/2 items-center gap-2 rounded-xl bg-[rgba(180,30,30,0.93)] px-[18px] py-[10px] text-center text-[13px] text-white shadow-[0_4px_20px_rgba(0,0,0,0.4)] animate-[slideDownFade_0.25s_var(--ease,ease)]">
          <i className="fas fa-exclamation-circle shrink-0" />
          <span>{audioError}</span>
        </div>
      )}

      <div
        ref={cardRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishPointerDrag}
        onPointerCancel={finishPointerDrag}
        onLostPointerCapture={onPointerLostCapture}
        data-dragging={isDragging ? "true" : undefined}
        className={cn(
          "mp-audio-player mp-audio-player--desktop !fixed z-[410] flex flex-col overflow-hidden select-none touch-auto text-[color-mix(in_srgb,var(--theme-text)_92%,var(--theme-bg)_8%)]",
          playerPanelSurfaceClass,
          isContextualDesktop &&
            !manualDockPosition &&
            "mp-audio-player--reading-dock",
          isReadingDesktop && "max-h-[calc(100vh-var(--header-h)-1.6rem)]",
          minimized
            ? "is-minimized rounded-[20px]"
            : "is-maximized rounded-[24px]",
          expanded ? "is-expanded" : "is-collapsed",
          desktopCardWidthClass,
          desktopCardPositionClass,
          desktopCardShadowClass,
          !isDragging &&
            "transition-[box-shadow,transform] duration-300 ease-[var(--ease,ease)]",
          !canDragDesktopCard
            ? "cursor-default"
            : isDragging
              ? "cursor-grabbing"
              : "cursor-grab",
        )}
        role="region"
        aria-label={audioRegionLabel}
      >
        {minimized ? (
          <>
            <div
              className="flex items-center gap-3 px-3.5 pb-2.5 pt-3"
              data-player-drag="true"
            >
              <CoverArt isPlaying={isPlaying} size={42} reciter={reciterObj} />
              <button
                type="button"
                className="mp-player-minimized-open min-w-0 flex-1 text-left"
                onClick={toggleMinimized}
                title={lang === "fr" ? "Ouvrir le lecteur" : "Open player"}
              >
                {networkBadge && (
                  <div
                    className={cn(
                      playerBadgeClass,
                      "mb-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[0.54rem] font-bold",
                    )}
                  >
                    <i className={`fas ${networkBadge.icon}`} />
                    <span>{networkBadge.text}</span>
                  </div>
                )}
                <div
                  className={cn(
                    playerStrongTextClass,
                    "truncate text-[0.76rem] font-bold leading-tight",
                  )}
                >
                  {titleLabel ||
                    (lang === "fr"
                      ? "Pret a lire"
                      : lang === "ar"
                         ? "جاهز"
                        : "Ready")}
                </div>
                <div
                  className={cn(
                    playerSubtitleTextClass,
                    "mt-0.5 truncate text-[0.62rem]",
                  )}
                >
                  {reciterLabel || idleSubtitle || "-"}
                </div>
                {currentAyahPreview && (
                  <div
                    className="mt-[0.1875rem] overflow-hidden text-[0.61rem] leading-relaxed text-[color-mix(in_srgb,var(--theme-text-muted)_86%,var(--theme-bg)_14%)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:1]"
                    dir="rtl"
                    lang="ar"
                  >
                    {currentAyahPreview}
                  </div>
                )}
              </button>
              <button
                onClick={toggle}
                title={
                  isPlaying ? t("audio.pause", lang) : t("audio.play", lang)
                }
                aria-pressed={isPlaying}
                className={cn(playerPrimaryBtnClass, "h-9 w-9")}
              >
                <i className={`fas ${isPlaying ? "fa-pause" : "fa-play"}`} />
              </button>
              <IconBtn
                className="mp-player-options-trigger"
                onClick={toggleOptionsModal}
                title={
                  lang === "fr"
                    ? "Options et récitateurs"
                    : lang === "ar"
                      ? "الخيارات والقراء"
                      : "Options and reciters"
                }
                size="sm"
              >
                <i className="fas fa-sliders" />
              </IconBtn>
              <IconBtn
                onClick={toggleMinimized}
                title={
                  lang === "fr"
                    ? "Agrandir"
                    : lang === "ar"
                       ? "توسيع"
                      : "Expand"
                }
                size="sm"
              >
                <i className="fas fa-expand-alt" />
              </IconBtn>
              <IconBtn
                onClick={closePlayer}
                title={
                  lang === "fr" ? "Fermer" : lang === "ar" ? "إغلاق" : "Close"
                }
                size="sm"
              >
                <i className="fas fa-times" />
              </IconBtn>
            </div>
            <div className="px-3.5 pb-3">
              <div className="mp-player-progress relative h-1 overflow-hidden rounded-full bg-white/10">
                <ProgressRail progress={progress} />
              </div>
            </div>
          </>
        ) : (
          <>
            {networkBadge && (
              <div className="px-4 pt-1">
                <div
                  className={cn(
                    playerBadgeClass,
                    "inline-flex items-center gap-1.5 rounded-full px-2 py-[0.1875rem] text-[0.6rem] font-bold",
                  )}
                >
                  <i className={`fas ${networkBadge.icon}`} />
                  <span>{networkBadge.text}</span>
                </div>
              </div>
            )}
            {/* Drag handle + minimize button */}
            <div
              className={cn(
                "mp-player-drag-zone flex shrink-0 items-center justify-between px-4 pb-1 pt-2.5",
                playerSoftSurfaceClass,
              )}
              data-player-drag="true"
              title={canDragDesktopCard ? dragPlayerLabel : undefined}
            >
              <button
                onClick={toggleMinimized}
                className={cn(playerUtilityClass, "h-6 w-6")}
                title={minimizeLabel}
                aria-label={minimizeLabel}
              >
                <i className="fas fa-chevron-down text-xs" />
              </button>
              <button
                className={cn(playerUtilityClass, " h-6 w-6")}
                onClick={toggleOptionsModal}
                title={optionsLabel}
                aria-label={optionsLabel}
                aria-controls="audio-options-modal-title"
                aria-expanded={optionsModalOpen}
              >
                <i className="fas fa-sliders text-xs" />
              </button>
              <div className="flex items-center gap-1.5">
                <div className="h-1 w-8 rounded-full bg-[linear-gradient(90deg,rgba(var(--theme-primary-rgb),0.18),rgba(var(--theme-primary-rgb),0.95),rgba(var(--theme-primary-rgb),0.18))]" />
                <span className="text-[0.62rem] uppercase tracking-[0.14em] text-[color-mix(in_srgb,var(--theme-text-muted)_92%,var(--theme-bg)_8%)] [font-family:var(--font-ui)]">
                  DRAG
                </span>
              </div>
              <button
                onClick={closePlayer}
                className={cn(playerUtilityClass, "h-6 w-6")}
                title={closeLabel}
                aria-label={closeLabel}
              >
                <i className="fas fa-times text-xs" />
              </button>
            </div>

            <div className="flex flex-col gap-3 px-3.5 pb-3.5 pt-1.5">
              {/* Top row: cover + info */}
              <div
                className={cn(
                  "flex items-center gap-2.5 p-2.5",
                  playerSoftSurfaceClass,
                )}
              >
                <CoverArt isPlaying={isPlaying} reciter={reciterObj} />
                <div className="min-w-0 flex-1">
                  {/* Arabic surah name -- prominent header */}
                  {currentArabicName && (
                    <div
                      className="mb-0.5 truncate text-[0.92rem] font-bold leading-tight text-[color-mix(in_srgb,var(--theme-primary)_82%,#ffffff_18%)] drop-shadow-[0_1px_6px_rgba(var(--theme-primary-rgb),0.32)] [font-family:var(--font-quran,serif)] tracking-[0.01em]"
                      dir="rtl"
                      lang="ar"
                    >
                      {currentArabicName}
                    </div>
                  )}
                  <div
                    className={cn(
                      playerStrongTextClass,
                      "truncate text-[0.74rem] font-bold leading-tight",
                    )}
                  >
                    {titleLabel ||
                      (lang === "fr"
                        ? "Pret a lire"
                        : lang === "ar"
                           ? "جاهز"
                          : "Ready")}
                  </div>
                  <div
                    className={cn(
                      playerSubtitleTextClass,
                      "mt-0.5 truncate text-[0.61rem]",
                    )}
                  >
                    {idleSubtitle || reciterLabel || "--"}
                  </div>
                  {currentAyahPreview && (
                    <p
                      className={cn(
                        "mt-1 overflow-hidden rounded-lg border border-[color-mix(in_srgb,var(--theme-primary)_34%,transparent_66%)] bg-[color-mix(in_srgb,var(--theme-panel-bg-strong)_86%,var(--theme-bg)_14%)] px-2 py-1 text-[0.67rem] leading-relaxed text-[color-mix(in_srgb,var(--theme-text)_92%,#ffffff_8%)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]",
                      )}
                      dir="rtl"
                      lang="ar"
                    >
                      {currentAyahPreview}
                    </p>
                  )}
                  {isWarshMode && warshStrictMode && (
                    <span
                      className={cn(
                        playerBadgeClass,
                        "mt-0.5 inline-block rounded-full border px-1.5 py-px text-[0.55rem] font-bold tracking-wide",
                      )}
                    >
                    Warsh OK
                    </span>
                  )}
                  <AudioLoadingIndicator
                    state={audioIndicatorState}
                    isPlaying={isPlaying}
                    errorMessage={audioError}
                  />
                  {isContextualDesktop && dockedMetaChips.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {dockedMetaChips.map((chip) => (
                        <span
                          key={chip.key}
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-[0.56rem] font-semibold uppercase tracking-wide",
                            chip.accent
                              ? "border-[color-mix(in_srgb,var(--theme-primary)_42%,transparent_58%)] bg-[rgba(var(--theme-primary-rgb),0.16)] text-[color-mix(in_srgb,var(--theme-text)_92%,#ffffff_8%)]"
                              : "border-[color-mix(in_srgb,var(--theme-border)_58%,transparent_42%)] bg-[color-mix(in_srgb,var(--theme-panel-bg-strong)_78%,transparent_22%)] text-[color-mix(in_srgb,var(--theme-text-muted)_84%,var(--theme-bg)_16%)]",
                          )}
                        >
                          {chip.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {manualDockPosition && (
                    <IconBtn
                      onClick={resetDockPosition}
                      title={
                        lang === "fr"
                          ? "Replacer le lecteur"
                          : lang === "ar"
                             ? "إعادة موضع القارئ"
                            : "Reset dock position"
                      }
                      size="sm"
                    >
                      <i className="fas fa-map-pin" />
                    </IconBtn>
                  )}
                  <IconBtn
                    onClick={toggleMinimized}
                    title={
                      lang === "fr"
                        ? "Réduire"
                        : lang === "ar"
                           ? "تصغير"
                          : "Minimize"
                    }
                    size="sm"
                  >
                    <i className="fas fa-window-minimize" />
                  </IconBtn>
                </div>
              </div>

              {/* Waveform */}
              <Waveform isPlaying={isPlaying} progress={progress} />

              {/* Seek bar + times */}
              <div
                className={cn(
                  "flex flex-col gap-1 rounded-xl px-2 py-1.5",
                  playerSoftSurfaceClass,
                )}
              >
                <div
                  ref={progressRef}
                  onClick={handleSeek}
                  onPointerDown={handleProgressPointerDown}
                  className={cn(
                    "mp-player-progress relative h-1 cursor-pointer overflow-visible rounded-full bg-white/12",
                    progressDragging && "ring-2 ring-[rgba(110,204,233,0.4)]",
                  )}
                  role="progressbar"
                  aria-valuenow={Math.round(progress * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <ProgressRail progress={progress} showThumb />
                </div>
                <div
                  className={cn(
                    playerGoldMetaClass,
                    "flex justify-between text-[0.6rem] font-mono",
                  )}
                >
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Main controls */}
              <div
                className={cn(
                  "mp-player-controls-strip flex items-center justify-between px-2 py-2",
                  playerSoftSurfaceClass,
                )}
              >
                {/* Speed */}
                <button
                  onClick={cycleSpeed}
                  className={cn(
                    playerBadgeClass,
                    "rounded-md px-2 py-[0.1875rem] text-[0.62rem] font-bold transition-all duration-150",
                  )}
                  title={speedLabel}
                  aria-label={`${speedLabel} ${audioSpeed}x`}
                >
                  {audioSpeed}x
                </button>

                <IconBtn onClick={prev} title={t("audio.prev", lang)}>
                  <i className="fas fa-step-backward" />
                </IconBtn>

                {/* Play / Pause */}
                <button
                  onClick={toggle}
                  title={
                    playPauseLabel
                  }
                  aria-label={playPauseLabel}
                  aria-pressed={isPlaying}
                  className={cn(
                    playerPrimaryBtnClass,
                    "mp-player-play-btn",
                    "h-12 w-12 border-[1.5px] text-[1.05rem]",
                    isPlaying
                      ? "scale-[1.04] shadow-[0_12px_28px_rgba(var(--theme-primary-rgb),0.36),0_1px_4px_rgba(0,0,0,0.16)]"
                      : "shadow-[0_6px_16px_rgba(0,0,0,0.24)]",
                  )}
                >
                  <i className={`fas ${isPlaying ? "fa-pause" : "fa-play"}`} />
                </button>

                <IconBtn onClick={next} title={t("audio.next", lang)}>
                  <i className="fas fa-step-forward" />
                </IconBtn>

                <IconBtn onClick={stop} title={t("audio.stop", lang)}>
                  <i className="fas fa-stop" />
                </IconBtn>
              </div>

              {/* Volume */}
              <div
                className={cn(
                  "flex items-center gap-2 px-2 py-2",
                  playerSoftSurfaceClass,
                )}
              >
                <button
                  onClick={() => handleVolumeChange(volume > 0 ? 0 : 1)}
                  className="h-7 w-7 shrink-0 rounded-lg border border-[color-mix(in_srgb,var(--theme-border)_60%,transparent_40%)] bg-[color-mix(in_srgb,var(--theme-panel-bg-strong)_78%,transparent_22%)] text-[0.72rem] text-[color-mix(in_srgb,var(--theme-primary)_72%,var(--theme-text)_28%)] transition-colors duration-150 hover:bg-[rgba(var(--theme-primary-rgb),0.14)]"
                  title={volumeLabel}
                  aria-label={volumeLabel}
                >
                  <i
                    className={`fas ${volume === 0 ? "fa-volume-xmark" : volume < 0.5 ? "fa-volume-low" : "fa-volume-high"}`}
                  />
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) =>
                    handleVolumeChange(parseFloat(e.target.value))
                  }
                  className="h-1 flex-1 cursor-pointer rounded-full accent-[rgb(110,204,233)]"
                  aria-label={volumeLabel}
                />
                <span
                  className={cn(
                    playerGoldMetaClass,
                    "w-6 shrink-0 text-right text-[0.58rem] tabular-nums",
                  )}
                >
                  {Math.round(volume * 100)}%
                </span>
              </div>

              {/* Expand toggle */}
              <button
                onClick={toggleOptionsModal}
                aria-controls="audio-options-modal-title"
                aria-expanded={optionsModalOpen}
                className="mp-player-options-trigger flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.05] py-1.5 text-[0.63rem] text-[rgba(230,219,198,0.62)] transition-all duration-150 [font-family:var(--font-ui)] hover:border-[rgba(110,204,233,0.38)] hover:bg-[rgba(110,204,233,0.1)] hover:text-[rgba(240,250,255,0.95)]"
              >
                <i className="fas fa-sliders text-[0.55rem]" />
                {optionsModalOpen
                  ? lang === "fr"
                    ? "Fermer les options"
                    : lang === "ar"
                       ? "إغلاق الخيارات"
                      : "Close options"
                  : lang === "fr"
                    ? "Plus d'options"
                    : lang === "ar"
                       ? "خيارات أكثر"
                      : "More options"}
              </button>

              {/* Expanded panel */}
              {expanded && (
                <div
                  className="flex max-h-[calc(100vh-270px)] flex-col gap-3 overflow-y-auto border-t border-white/10 pt-3 pr-[0.15rem] animate-[fadeInUp_0.18s_var(--ease,ease)]"
                  data-player-expanded="true"
                  data-scroll-panel="true"
                  data-no-drag="true"
                >
                  {/* Inline audio error */}
                  {audioError && (
                    <div className="mb-3 flex items-center gap-2 rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-[0.66rem] text-rose-100">
                      <i className="fas fa-exclamation-circle shrink-0" />
                      <span className="truncate">{audioError}</span>
                      <button
                        className="ml-auto rounded-full border border-rose-200/35 bg-white/10 px-2 py-0.5 text-[0.6rem] font-semibold text-rose-50 transition-colors hover:bg-white/20"
                        onClick={toggle}
                        title={
                          lang === "fr"
                            ? "Reessayer"
                            : lang === "ar"
                               ? "إعادة المحاولة"
                              : "Retry"
                        }
                      >
                        {lang === "fr"
                          ? "Reessayer"
                          : lang === "ar"
                             ? "إعادة"
                            : "Retry"}
                      </button>
                    </div>
                  )}
                  {/* Reciter grid */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className={playerSectionLabelClass}>
                        {t("audio.reciter", lang)}
                      </div>
                      <span
                        className={cn(
                          playerGoldMetaClass,
                          "text-[0.56rem] font-semibold tabular-nums",
                        )}
                      >
                        {filteredReciters.length !== currentReciters.length
                          ? `${filteredReciters.length} / ${currentReciters.length}`
                          : currentReciters.length}
                      </span>
                    </div>
                    {/* Search */}
                    {currentReciters.length > 4 && (
                      <div className="relative mb-1.5">
                        <i className="fas fa-magnifying-glass pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[0.5rem] text-[rgba(240,234,214,0.3)]" />
                        <input
                          type="text"
                          value={reciterSearch}
                          onChange={(e) => setReciterSearch(e.target.value)}
                          placeholder={
                            searchPlaceholder
                          }
                          className={playerSearchInputClass}
                        />
                        {reciterSearch && (
                          <button
                            onClick={() => setReciterSearch("")}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[0.45rem] text-[rgba(240,234,214,0.35)]"
                          >
                            <i className="fas fa-times" />
                          </button>
                        )}
                      </div>
                    )}
                    <div
                      className="max-h-60 overflow-y-auto pr-1.5"
                      data-scroll-panel="true"
                      data-no-drag="true"
                    >
                      {filteredReciters.length === 0 ? (
                        <div
                          className={cn(
                            playerFadedTextClass,
                            "py-3 text-center text-[0.62rem]",
                          )}
                        >
                          {lang === "fr"
                            ? "Aucun resultat"
                            : lang === "ar"
                               ? "لا توجد نتائج"
                              : "No results"}
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "grid gap-1",
                            isReadingDesktop ? "grid-cols-1" : "grid-cols-2",
                          )}
                        >
                          {filteredReciters.map((r) => {
                            const active = reciter === r.id;
                            const isLoading =
                              reciterSwitchingId === r.id ||
                              (active && networkState === "loading");
                            const unavailableMs =
                              getReciterUnavailableRemainingMs(
                                r.id,
                                reciterAvailabilityById,
                              );
                            const isUnavailable = unavailableMs > 0;
                            const initial = (r.nameEn ||
                              r.name ||
                              "?")[0].toUpperCase();
                            return (
                              <button
                                key={r.id}
                                onClick={() => handleReciterSelect(r.id)}
                                className={playerReciterButtonClass(
                                  active,
                                  isLoading,
                                  isUnavailable,
                                )}
                                aria-pressed={active}
                                disabled={
                                  Boolean(reciterSwitchingId) ||
                                  (isUnavailable && !active)
                                }
                              >
                                <ReciterAvatar
                                  reciter={r}
                                  active={active}
                                  loading={isLoading}
                                />
                                <span className="flex min-w-0 flex-col">
                                  <span className="[font-family:var(--font-ui)] truncate text-[0.68rem] font-semibold leading-tight">
                                    {lang === "ar"
                                      ? r.name
                                      : lang === "fr"
                                        ? r.nameFr
                                        : r.nameEn}
                                  </span>
                                  {r.style && (
                                    <span className="[font-family:var(--font-ui)] truncate text-[0.52rem] uppercase leading-tight tracking-wide text-[rgba(240,234,214,0.35)]">
                                      {r.style}
                                    </span>
                                  )}
                                  {r.cdnType && (
                                    <span className="mt-1 inline-flex items-center rounded-full border border-white/12 bg-white/[0.06] px-1.5 py-0.5 text-[0.5rem] font-semibold tracking-wide text-[rgba(225,214,194,0.7)]">
                                      {r.cdnType === "islamic"
                                        ? "Islamic CDN"
                                        : r.cdnType === "mp3quran-surah"
                                          ? "MP3Quran"
                                          : "EveryAyah CDN"}
                                    </span>
                                  )}
                                  {isUnavailable && (
                                    <span className="mt-1 inline-flex items-center rounded-full border border-rose-300/40 bg-rose-300/16 px-1.5 py-0.5 text-[0.5rem] font-semibold tracking-wide text-rose-100">
                                      {lang === "fr"
                                        ? `Indisponible ${formatCooldownLabel(unavailableMs, lang)}`
                                        : lang === "ar"
                                          ? `Unavailable ${formatCooldownLabel(unavailableMs, lang)}`
                                          : `Unavailable ${formatCooldownLabel(unavailableMs, lang)}`}
                                    </span>
                                  )}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Memorization settings */}
                  {showMemorizationControls && memMode && (
                    <div>
                      <div className={playerSectionLabelClass}>
                        {t("audio.memorization", lang)}
                      </div>
                      <div className="flex gap-3 flex-wrap">
                        {[
                          {
                            label: t("audio.repeat", lang),
                            val: memRepeatCount,
                            key: "memRepeatCount",
                            min: 1,
                            max: 100,
                          },
                          {
                            label: `${t("audio.pause", lang)} (s)`,
                            val: memPause,
                            key: "memPause",
                            min: 0,
                            max: 60,
                          },
                        ].map(({ label, val, key, min, max }) => (
                          <div key={key} className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                playerMutedTextClass,
                                "text-[0.68rem]",
                              )}
                            >
                              {label}
                            </span>
                            <input
                              type="number"
                              min={min}
                              max={max}
                              value={val}
                              onChange={(e) =>
                                set({ [key]: parseInt(e.target.value) || min })
                              }
                              className={playerNumberInputClass}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* -- Options avancees toggle -- */}
                  {showAdvancedControls && (
                    <button
                      onClick={() => setShowAdvanced((v) => !v)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg border px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-widest transition-all [font-family:var(--font-ui)]",
                        showAdvanced
                          ? "border-[rgba(110,204,233,0.35)] bg-[rgba(110,204,233,0.12)] text-[rgba(240,250,255,0.95)]"
                          : "border-white/10 bg-transparent text-[rgba(230,219,198,0.58)]",
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        <i className="fas fa-sliders text-[0.5rem]" />
                        {lang === "fr"
                          ? "Options"
                          : lang === "ar"
                             ? "خيارات"
                            : "Options"}
                      </span>
                      <i
                        className={`fas fa-chevron-${showAdvanced ? "up" : "down"} text-[0.5rem]`}
                      />
                    </button>
                  )}
                  {showAdvancedControls && showAdvanced && (
                    <>
                      {/* -- A-B Repeat -- */}
                      <div>
                        <div className={playerSectionLabelClass}>
                          {lang === "fr"
                            ? "Répétition A-B"
                            : lang === "ar"
                               ? "تكرار A-B"
                              : "A-B Repeat"}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[
                            {
                              mark: markAbA,
                              val: abA,
                              label: "A",
                              titleFr: "Marquer début A",
                              titleEn: "Set A point",
                            },
                            {
                              mark: markAbB,
                              val: abB,
                              label: "B",
                              titleFr: "Marquer fin B",
                              titleEn: "Set B point",
                            },
                          ].map(({ mark, val, label, titleFr, titleEn }) => (
                            <button
                              key={label}
                              onClick={mark}
                              className={playerAbButtonClass(Boolean(val))}
                              title={lang === "fr" ? titleFr : titleEn}
                              disabled={!hasAyahContext}
                            >
                              <i
                                className={`fas fa-flag${label === "A" ? "-checkered" : ""} mr-0.5 text-[0.5rem]`}
                              />
                              {val
                                ? `${label}: ${val.surah}:${val.ayah}`
                                : label}
                            </button>
                          ))}
                          {(abA || abB) && (
                            <button
                              onClick={clearAb}
                              className="rounded-lg border border-white/12 bg-white/[0.05] px-2 py-[0.1875rem] text-[0.65rem] text-[rgba(228,218,197,0.62)] transition-all hover:border-[rgba(110,204,233,0.4)] hover:bg-[rgba(110,204,233,0.1)]"
                            >
                              <i className="fas fa-times" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* -- Equalizer presets -- */}
                      <div>
                        <div className={playerSectionLabelClass}>
                          {lang === "fr"
                            ? "Acoustique"
                            : lang === "ar"
                              ? "الصوتيات"
                              : "Acoustics"}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {[
                            { id: "flat", fr: "Plat", ar: "Flat", en: "Flat" },
                            {
                              id: "bass",
                              fr: "Graves",
                              ar: "Bass",
                              en: "Bass",
                            },
                            {
                              id: "treble",
                              fr: "Aigus",
                              ar: "حاد",
                              en: "Treble",
                            },
                            {
                              id: "near",
                              fr: "Proche",
                              ar: "Near",
                              en: "Near",
                            },
                            { id: "hall", fr: "Salle", ar: "Hall", en: "Hall" },
                            {
                              id: "vocals",
                              fr: "Voix",
                              ar: "Vocals",
                              en: "Vocals",
                            },
                          ].map((p) => (
                            <button
                              key={p.id}
                              onClick={() => handleEq(p.id)}
                              className={playerOptionPillClass(
                                eqPreset === p.id,
                              )}
                              aria-pressed={eqPreset === p.id}
                            >
                              {lang === "ar"
                                ? p.ar
                                : lang === "fr"
                                  ? p.fr
                                  : p.en}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* -- Tartil progressif -- */}
                      <button
                        onClick={toggleTartil}
                        className={playerCardToggleClass(tartilMode)}
                        aria-pressed={tartilMode}
                      >
                        <span className="flex items-center gap-2">
                          <i className="fas fa-wave-square text-[0.6rem]" />
                          {lang === "fr"
                            ? "Tartil progressif"
                            : lang === "ar"
                              ? "ترتيل تدريجي"
                              : "Progressive Tartil"}
                        </span>
                        <span
                          className={cn(
                            "text-[0.55rem] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide",
                            tartilMode
                              ? "bg-[rgba(110,204,233,0.24)] text-[rgba(240,250,255,0.95)]"
                              : "bg-white/8 text-white/40",
                          )}
                        >
                          {tartilMode ? "ON" : "OFF"}
                        </span>
                      </button>

                      {/* -- Mode recitation (Web Speech API) -- */}
                      <button
                        onClick={reciteMode ? stopRecite : startRecite}
                        className={cn(
                          playerCardToggleClass(false),
                          reciteMode &&
                            "border-[rgba(34,197,94,0.4)] bg-[rgba(34,197,94,0.15)] text-[#86efac]",
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <i
                            className={`fas ${reciteMode ? "fa-stop" : "fa-microphone"} text-[0.6rem]`}
                          />
                          {lang === "fr"
                            ? reciteMode
                              ? "Arrêter la récitation"
                              : "Mode récitation"
                            : lang === "ar"
                              ? reciteMode
                                ? "Stop reciting"
                                : "Recitation mode"
                              : reciteMode
                                ? "Stop reciting"
                                : "Recitation mode"}
                        </span>
                        {reciteResult && (
                          <span
                            className={cn(
                              "text-[0.9rem]",
                              reciteResult === "ok"
                                ? "text-[#86efac]"
                                : "text-[#fbbf24]",
                            )}
                          >
                            {reciteResult === "ok" ? "OK" : "~"}
                          </span>
                        )}
                      </button>
                      {reciteMode && reciteText && (
                        <div
                          className="rounded-xl border border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.08)] px-3 py-2 text-right text-[0.65rem] text-[#86efac] [font-family:var(--font-arabic,serif)]"
                          dir="rtl"
                        >
                          {reciteText}
                        </div>
                      )}
                    </>
                  )}
                  {/* Stop */}
                  <button
                    onClick={stop}
                    className={cn(
                      playerSurfaceButtonClass,
                      "flex items-center justify-center gap-2 py-1.5 text-[0.7rem] font-semibold",
                    )}
                    title={t("audio.stop", lang)}
                  >
                    <i className="fas fa-stop text-[0.6rem]" />
                    {t("audio.stop", lang)}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {audioOptionsModal}
    </>
  );
}
