import React, { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import audioService from "../services/audioService";
import { ensureReciterForRiwaya, getRecitersByRiwaya } from "../data/reciters";
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
import DesktopPlayer from "./AudioPlayer/DesktopPlayer";
import MobilePlayer from "./AudioPlayer/MobilePlayer";
import OptionsModal from "./AudioPlayer/OptionsModal";

/* Drag / position helpers (desktop card only) */
const CARD_STORAGE_KEY = "mushaf_player_card_pos_v5";
function isValidCardPos(pos) {
  return (
    pos &&
    typeof pos === "object" &&
    Number.isFinite(pos.x) &&
    Number.isFinite(pos.y)
  );
}

function loadCardPos() {
  try {
    const raw = localStorage.getItem(CARD_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (isValidCardPos(parsed)) return parsed;
    localStorage.removeItem(CARD_STORAGE_KEY);
  } catch {}
  return null;
}
function saveCardPos(pos) {
  if (!isValidCardPos(pos)) return;
  try {
    localStorage.setItem(CARD_STORAGE_KEY, JSON.stringify(pos));
  } catch {}
}
function clearCardPos() {
  try {
    localStorage.removeItem(CARD_STORAGE_KEY);
  } catch {}
}
function clamp(x, y, w, h, margin = 12) {
  const fallbackX = window.innerWidth - w - margin;
  const fallbackY = Math.max(88, window.innerHeight - h - 24);
  const safeX = Number.isFinite(x) ? x : fallbackX;
  const safeY = Number.isFinite(y) ? y : fallbackY;
  return {
    x: Math.max(margin, Math.min(window.innerWidth - w - margin, safeX)),
    y: Math.max(margin, Math.min(window.innerHeight - h - margin, safeY)),
  };
}

const MOBILE_BREAKPOINT = 1024;
const RECITER_COOLDOWN_STEPS_MS = [
  90 * 1000,
  8 * 60 * 1000,
  25 * 60 * 1000,
  90 * 1000,
  25 * 60 * 1000,
  90 * 60 * 1000,
  4 * 60 * 60 * 1000,
];

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
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth < MOBILE_BREAKPOINT,
  );
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
    const candidates = rankedReciters.filter(
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
              ? `Récitateur indisponible, bascule vers ${candidate.nameFr || candidate.nameEn || candidate.name}.`
              : lang === "ar"
                ? `تعذر التحميل، تم التحويل إلى ${candidate.name || candidate.nameEn || candidate.id}.`
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
    const onResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
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
      setClosed(false); // réouvre si fermé
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
      // Navigation automatique : toujours suivre la sourate en cours de récitation.
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
      const failoverWorked = await tryAutoReciterFailover();
      if (failoverWorked) {
        setAudioError(
          lang === "fr"
            ? "Bascule automatique vers un autre récitateur..."
            : lang === "ar"
              ? "تم التحويل تلقائيا إلى قارئ آخر..."
              : "Auto-switching to another reciter...",
        );
        audioErrorTimerRef.current = setTimeout(() => {
          setAudioError(null);
          audioErrorTimerRef.current = null;
        }, 3200);
        return;
      }
      const msg =
        riwaya === "warsh"
          ? lang === "fr"
            ? "Audio Warsh indisponible. Vérifiez votre connexion ou changez de récitateur."
            : lang === "ar"
              ? "الصوت غير متاح. تحقق من الاتصال أو غير القارئ."
              : "Warsh audio unavailable. Check your connection or switch reciter."
          : lang === "fr"
            ? "Erreur de chargement audio."
            : lang === "ar"
              ? "خطأ في تحميل الصوت."
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
              ? "جاري تحميل الصوت..."
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
            ? "التعرف الصوتي غير متاح في هذا المتصفح."
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

  const handleSeek = (e) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioService.seekPercent(pct);
  };

  /*Progress bar drag support*/
  const [progressDragging, setProgressDragging] = useState(false);

  const handleProgressMouseDown = (e) => {
    e.preventDefault();
    if (!progressRef.current) return;
    setProgressDragging(true);
    const rect = progressRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioService.seekPercent(pct);

    const onMouseMove = (ev) => {
      if (!progressRef.current) return;
      const r = progressRef.current.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
      audioService.seekPercent(p);
    };
    const onMouseUp = () => {
      setProgressDragging(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

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
  }, []);

  const toggleOptionsModal = useCallback(() => {
    setOptionsModalOpen((prev) => !prev);
  }, []);

  const closePlayer = useCallback(() => {
    audioService.stop();
    setMinimized(false);
    setOptionsModalOpen(false);
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
            ? `Ce recitateur est temporairement indisponible. Reessayez dans ${retryLabel}.`
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
            ? "Le changement instantane du recitateur a echoue."
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
          ? "اضغط تشغيل للاستماع"
          : lang === "fr"
            ? "Appuyez sur Play pour ecouter"
            : "Press Play to listen"
        : null
      : null;

  const warshStrictLabel =
    lang === "ar"
      ? "ورش الصارم"
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
      ? "صوت ورش متحقق"
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
            ? "Sourate ∞"
            : lang === "ar"
              ? "سورة ∞"
              : "Surah ∞"
          : lang === "fr"
            ? `Sourate x${surahRepeatCount}`
            : lang === "ar"
              ? `سورة ×${surahRepeatCount}`
              : `Surah x${surahRepeatCount}`,
    },
    memMode && { key: "memorize", label: memorizeShortLabel },
    isSurahStreamReciter && {
      key: "mode",
      label: lang === "fr" ? "Sourate" : lang === "ar" ? "سورة" : "Surah",
    },
  ].filter(Boolean);

  /* Shared button classes (mobile bar) */
  const playerPanelSurfaceClass =
    "rounded-[26px] border border-[color-mix(in_srgb,var(--theme-border-strong)_34%,transparent_66%)] bg-[linear-gradient(165deg,color-mix(in_srgb,var(--theme-panel-bg-strong)_95%,var(--theme-primary)_5%),color-mix(in_srgb,var(--theme-panel-bg)_93%,var(--theme-bg)_7%))] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.14),0_24px_56px_rgba(2,8,22,0.3)] backdrop-blur-2xl";
  const playerSoftSurfaceClass =
    "rounded-[20px] border border-[color-mix(in_srgb,var(--theme-border)_62%,transparent_38%)] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--theme-panel-bg-strong)_84%,transparent_16%),color-mix(in_srgb,var(--theme-panel-bg)_74%,transparent_26%))] shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]";
  const playerPrimaryBtnClass =
    "audio-player-primary-btn flex items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--theme-primary)_52%,#ffffff_48%)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--theme-primary)_86%,#ffffff_14%),color-mix(in_srgb,var(--theme-primary)_66%,var(--theme-bg)_34%))] text-white shadow-[0_10px_24px_rgba(var(--theme-primary-rgb),0.34)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--theme-primary-rgb),0.44)]";
  const mBarBtn = cn(
    "h-8 w-8 shrink-0 rounded-xl border border-[color-mix(in_srgb,var(--theme-border)_60%,transparent_40%)] bg-[color-mix(in_srgb,var(--theme-panel-bg-strong)_74%,transparent_26%)] text-[0.76rem] text-[color-mix(in_srgb,var(--theme-text)_82%,var(--theme-bg)_18%)]",
    "flex items-center justify-center outline-none transition-all duration-150",
    "hover:border-[color-mix(in_srgb,var(--theme-primary)_42%,transparent_58%)] hover:bg-[rgba(var(--theme-primary-rgb),0.16)] hover:text-white",
    "active:scale-95 focus-visible:ring-2 focus-visible:ring-[rgba(var(--theme-primary-rgb),0.32)]",
  );
  const mBarBtnSm = (active = false) =>
    cn(
      "flex min-h-[1.72rem] items-center justify-center whitespace-nowrap rounded-lg border px-1.5 py-[0.22rem] text-[0.62rem] font-semibold outline-none transition-all duration-150",
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
      "group flex w-full items-start gap-2.5 rounded-2xl border px-2.5 py-2 text-left transition-all duration-150",
      active
        ? "border-[rgba(122,188,210,0.42)] bg-[rgba(122,188,210,0.16)] text-[rgba(249,253,255,0.98)]"
        : "border-white/10 bg-white/[0.04] text-[rgba(232,222,202,0.74)] hover:border-[rgba(122,188,210,0.34)] hover:bg-[rgba(122,188,210,0.1)]",
      isUnavailable &&
        !active &&
        "border-rose-300/30 bg-rose-300/10 text-rose-100 hover:border-rose-300/40 hover:bg-rose-300/16",
      isLoading && "animate-pulse",
    );
  const playerReciterAvatarClass = (active = false) =>
    cn(
      "mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-xl text-[0.62rem] font-black",
      active
        ? "bg-[rgba(122,188,210,0.24)] text-white"
        : "bg-white/[0.08] text-[rgba(233,223,203,0.55)]",
    );

  /* Drag state (desktop card only) */
  const optionsModalTitle =
    lang === "fr"
      ? "Réglages audio"
      : lang === "ar"
        ? "إعدادات الصوت"
        : "Audio settings";
  const optionsModalSubtitle =
    lang === "fr"
      ? "Récitateurs, volume et synchronisation"
      : lang === "ar"
        ? "القراء ومستوى الصوت والمزامنة"
        : "Reciters, volume, and synchronization";
  const isAnyReciterSwitching = Boolean(reciterSwitchingId);

  // OptionsModal logic is now moved to src/components/AudioPlayer/OptionsModal.jsx


  const cardRef = useRef(null);
  const dragState = useRef(null);
  const hasSavedCardPosRef = useRef(Boolean(loadCardPos()));
  const [isDragging, setIsDragging] = useState(false);
  const [cardPos, setCardPos] = useState(() => {
    const saved = loadCardPos();
    if (saved) return saved;
    return {
      x: window.innerWidth - 280 - 16,
      y: Math.max(88, window.innerHeight - 360 - 24),
    };
  });
  const [manualDockPosition, setManualDockPosition] = useState(
    () => hasSavedCardPosRef.current,
  );
  const canFreePosition = !isContextualDesktop || manualDockPosition;
  const canDragDesktopCard = !isMobile;

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
    const root = document.documentElement;

    if (!isMobile || closed) {
      root.style.removeProperty("--player-h");
      return;
    }

    // Reserve enough space for the mobile dock so verses and controls are never hidden behind it.
    const reservedHeight = minimized ? 86 : expanded ? 198 : 136;
    root.style.setProperty("--player-h", `${reservedHeight}px`);

    return () => {
      root.style.removeProperty("--player-h");
    };
  }, [closed, expanded, isMobile, minimized]);

  useEffect(() => {
    const onResize = () => {
      if (!cardRef.current) return;
      const { offsetWidth: w, offsetHeight: h } = cardRef.current;
      setCardPos((prev) => {
        const next = clamp(prev.x, prev.y, w, h);
        if (manualDockPosition || !isContextualDesktop) {
          saveCardPos(next);
        }
        return next;
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [manualDockPosition, isContextualDesktop]);

  useEffect(() => {
    if (isMobile || !cardRef.current) return;
    const { offsetWidth: w, offsetHeight: h } = cardRef.current;
    setCardPos((prev) => {
      const next = clamp(prev.x, prev.y, w, h);
      if (next.x === prev.x && next.y === prev.y) return prev;
      if (manualDockPosition || !isContextualDesktop) {
        saveCardPos(next);
      }
      return next;
    });
  }, [expanded, minimized, isMobile, manualDockPosition, isContextualDesktop]);

  useEffect(() => {
    if (!cardRef.current || isMobile || !canFreePosition) return;
    cardRef.current.style.setProperty("--player-left", `${cardPos.x}px`);
    cardRef.current.style.setProperty("--player-top", `${cardPos.y}px`);
  }, [cardPos, isMobile, canFreePosition]);

  const onPointerDown = useCallback(
    (e) => {
      if (!canDragDesktopCard) return;
      if (!e.isPrimary || e.button !== 0) return;
      const target = e.target instanceof Element ? e.target : null;
      if (!target) return;
      if (
        target.closest("button") ||
        target.closest("input") ||
        target.closest("textarea") ||
        target.closest("select") ||
        target.closest("a") ||
        target.closest("label") ||
        target.closest("[role='button']") ||
        target.closest("[data-no-drag='true']")
      )
        return;
      if (
        target.closest("[data-scroll-panel='true']") ||
        target.closest("[data-player-expanded='true']")
      )
        return;
      // Allow dragging from any non-interactive area of the player.

      const card = cardRef.current;
      const rect = card?.getBoundingClientRect();
      const w = card ? card.offsetWidth : 264;
      const h = card ? card.offsetHeight : 400;
      const startPos = clamp(
        rect?.left ?? cardPos.x,
        rect?.top ?? cardPos.y,
        w,
        h,
      );
      if (!manualDockPosition) {
        setManualDockPosition(true);
      }
      setCardPos(startPos);
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      dragState.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: startPos.x,
        originY: startPos.y,
      };
      setIsDragging(true);
    },
    [canDragDesktopCard, cardPos.x, cardPos.y, manualDockPosition],
  );

  const onPointerMove = useCallback((e) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    const card = cardRef.current;
    const w = card ? card.offsetWidth : 264;
    const h = card ? card.offsetHeight : 400;
    setCardPos(
      clamp(
        dragState.current.originX + dx,
        dragState.current.originY + dy,
        w,
        h,
      ),
    );
  }, []);

  const onPointerUp = useCallback(() => {
    if (!dragState.current) return;
    const card = cardRef.current;
    const w = card ? card.offsetWidth : 264;
    const h = card ? card.offsetHeight : 400;
    const next = clamp(cardPos.x, cardPos.y, w, h);
    setCardPos(next);
    saveCardPos(next);
    setManualDockPosition(true);
    dragState.current = null;
    setIsDragging(false);
  }, [cardPos]);
  const resetDockPosition = useCallback(() => {
    clearCardPos();
    hasSavedCardPosRef.current = false;
    dragState.current = null;
    setIsDragging(false);
    setManualDockPosition(false);
  }, []);

  /* Ne rien afficher si le lecteur est fermé */
  const desktopCardWidthClass = isHomeDesktop
    ? expanded
      ? "w-[320px]"
      : "w-[300px]"
    : minimized
      ? "w-[248px]"
      : expanded
        ? "w-[336px]"
        : "w-[320px]";
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

  /* • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • 
     MOBILE -- classic bottom bar
  • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •  */
  if (isMobile) {
    return (
      <>
        <MobilePlayer
          state={state}
          currentPlayingAyah={currentPlayingAyah}
          isPlaying={isPlaying}
          progress={progress}
          currentTime={currentTime}
          duration={duration}
          titleLabel={titleLabel}
          reciterLabel={reciterLabel}
          onToggle={toggle}
          onNext={next}
          onPrev={prev}
          onStop={stop}
          onSeek={handleSeek}
          onToggleMinimized={toggleMinimized}
          onClose={closePlayer}
          onToggleOptions={toggleOptionsModal}
          formatTime={formatTime}
          minimized={minimized}
          expanded={expanded}
          progressRef={progressRef}
          handleProgressMouseDown={handleProgressMouseDown}
          audioIndicatorState={audioIndicatorState}
          audioError={audioError}
          lang={lang}
          playerPanelSurfaceClass={playerPanelSurfaceClass}
          playerPrimaryBtnClass={playerPrimaryBtnClass}
          playerSoftSurfaceClass={playerSoftSurfaceClass}
          isWarshMode={isWarshMode}
          warshStrictMode={warshStrictMode}
          warshStrictLabel={warshStrictLabel}
          warshNonStrictLabel={warshNonStrictLabel}
          warshVerifiedLabel={warshVerifiedLabel}
          isSurahStreamReciter={isSurahStreamReciter}
          hasAyahContext={hasAyahContext}
          networkBadge={networkBadge}
          audioSpeed={audioSpeed}
          cycleSpeed={cycleSpeed}
        />
        <OptionsModal
          optionsModalOpen={optionsModalOpen}
          closeOptionsModal={closeOptionsModal}
          lang={lang}
          optionsModalTitle={optionsModalTitle}
          optionsModalSubtitle={optionsModalSubtitle}
          optionsCloseButtonRef={optionsCloseButtonRef}
          playerSoftSurfaceClass={playerSoftSurfaceClass}
          playerSectionLabelClass={playerSectionLabelClass}
          filteredReciters={filteredReciters}
          currentReciters={currentReciters}
          playerGoldMetaClass={playerGoldMetaClass}
          reciterSearch={reciterSearch}
          setReciterSearch={setReciterSearch}
          playerSearchInputClass={playerSearchInputClass}
          reciter={reciter}
          reciterSwitchingId={reciterSwitchingId}
          networkState={networkState}
          getReciterUnavailableRemainingMs={getReciterUnavailableRemainingMs}
          reciterAvailabilityById={reciterAvailabilityById}
          getLatencyForReciter={getLatencyForReciter}
          reciterLatencyByKey={reciterLatencyByKey}
          favoriteReciters={favoriteReciters}
          handleReciterSelect={handleReciterSelect}
          playerReciterButtonClass={playerReciterButtonClass}
          playerReciterAvatarClass={playerReciterAvatarClass}
          isAnyReciterSwitching={isAnyReciterSwitching}
          formatCooldownLabel={formatCooldownLabel}
          autoSelectFastestReciter={autoSelectFastestReciter}
          cycleSpeed={cycleSpeed}
          audioSpeed={audioSpeed}
          surahRepeatCount={surahRepeatCount}
          setSurahRepeatSetting={setSurahRepeatSetting}
          playerMutedTextClass={playerMutedTextClass}
          playerNumberInputClass={playerNumberInputClass}
          playerOptionPillClass={playerOptionPillClass}
          playerFadedTextClass={playerFadedTextClass}
          volume={volume}
          handleVolumeChange={handleVolumeChange}
          syncOffsetMs={syncOffsetMs}
          setSyncOffsetMs={setSyncOffsetMs}
          isSurahStreamReciter={isSurahStreamReciter}
          playerCardToggleClass={playerCardToggleClass}
        />
      </>
    );
  }

  /* • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • 
     DESKTOP -- floating music card
  • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •  */
  return (
    <>
      {audioError && (
        <div className="pointer-events-none fixed left-1/2 top-[72px] z-[400] flex max-w-[340px] -translate-x-1/2 items-center gap-2 rounded-xl bg-[rgba(180,30,30,0.93)] px-[18px] py-[10px] text-center text-[13px] text-white shadow-[0_4px_20px_rgba(0,0,0,0.4)] animate-[slideDownFade_0.25s_var(--ease,ease)]">
          <i className="fas fa-exclamation-circle shrink-0" />
          <span>{audioError}</span>
        </div>
      )}

      <DesktopPlayer
        state={state}
        currentPlayingAyah={currentPlayingAyah}
        isPlaying={isPlaying}
        progress={progress}
        currentTime={currentTime}
        duration={duration}
        titleLabel={titleLabel}
        reciterLabel={reciterLabel}
        onToggle={toggle}
        onNext={next}
        onPrev={prev}
        onStop={stop}
        onSeek={handleSeek}
        onToggleMinimized={toggleMinimized}
        onClose={closePlayer}
        onToggleOptions={toggleOptionsModal}
        formatTime={formatTime}
        minimized={minimized}
        expanded={expanded}
        progressRef={progressRef}
        handleProgressMouseDown={handleProgressMouseDown}
        audioIndicatorState={audioIndicatorState}
        audioError={audioError}
        lang={lang}
        playerPanelSurfaceClass={playerPanelSurfaceClass}
        playerPrimaryBtnClass={playerPrimaryBtnClass}
        playerSoftSurfaceClass={playerSoftSurfaceClass}
        isWarshMode={isWarshMode}
        warshStrictMode={warshStrictMode}
        warshStrictLabel={warshStrictLabel}
        warshNonStrictLabel={warshNonStrictLabel}
        warshVerifiedLabel={warshVerifiedLabel}
        isSurahStreamReciter={isSurahStreamReciter}
        hasAyahContext={hasAyahContext}
        resetDockPosition={resetDockPosition}
        playerUtilityClass={playerUtilityClass}
        cardRef={cardRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        manualDockPosition={manualDockPosition}
        isContextualDesktop={isContextualDesktop}
        isReadingDesktop={isReadingDesktop}
        isDragging={isDragging}
        canDragDesktopCard={canDragDesktopCard}
        desktopCardWidthClass={desktopCardWidthClass}
        desktopCardPositionClass={desktopCardPositionClass}
        desktopCardShadowClass={desktopCardShadowClass}
        isHomeDesktop={isHomeDesktop}
        currentArabicName={currentArabicName}
        idleSubtitle={idleSubtitle}
        currentAyahPreview={currentAyahPreview}
        dockedMetaChips={dockedMetaChips}
        networkBadge={networkBadge}
        audioSpeed={audioSpeed}
        cycleSpeed={cycleSpeed}
      />
      <OptionsModal
        optionsModalOpen={optionsModalOpen}
        closeOptionsModal={closeOptionsModal}
        lang={lang}
        optionsModalTitle={optionsModalTitle}
        optionsModalSubtitle={optionsModalSubtitle}
        optionsCloseButtonRef={optionsCloseButtonRef}
        playerSoftSurfaceClass={playerSoftSurfaceClass}
        playerSectionLabelClass={playerSectionLabelClass}
        filteredReciters={filteredReciters}
        currentReciters={currentReciters}
        playerGoldMetaClass={playerGoldMetaClass}
        reciterSearch={reciterSearch}
        setReciterSearch={setReciterSearch}
        playerSearchInputClass={playerSearchInputClass}
        reciter={reciter}
        reciterSwitchingId={reciterSwitchingId}
        networkState={networkState}
        getReciterUnavailableRemainingMs={getReciterUnavailableRemainingMs}
        reciterAvailabilityById={reciterAvailabilityById}
        getLatencyForReciter={getLatencyForReciter}
        reciterLatencyByKey={reciterLatencyByKey}
        favoriteReciters={favoriteReciters}
        handleReciterSelect={handleReciterSelect}
        playerReciterButtonClass={playerReciterButtonClass}
        playerReciterAvatarClass={playerReciterAvatarClass}
        isAnyReciterSwitching={isAnyReciterSwitching}
        formatCooldownLabel={formatCooldownLabel}
        autoSelectFastestReciter={autoSelectFastestReciter}
        cycleSpeed={cycleSpeed}
        audioSpeed={audioSpeed}
        surahRepeatCount={surahRepeatCount}
        setSurahRepeatSetting={setSurahRepeatSetting}
        playerMutedTextClass={playerMutedTextClass}
        playerNumberInputClass={playerNumberInputClass}
        playerOptionPillClass={playerOptionPillClass}
        playerFadedTextClass={playerFadedTextClass}
        volume={volume}
        handleVolumeChange={handleVolumeChange}
        syncOffsetMs={syncOffsetMs}
        setSyncOffsetMs={setSyncOffsetMs}
        isSurahStreamReciter={isSurahStreamReciter}
        playerCardToggleClass={playerCardToggleClass}
      />
    </>
  );
}
