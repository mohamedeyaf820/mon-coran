import React, { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import audioService from "../services/audioService";
import {
  ensureReciterForRiwaya,
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
import "../styles/audio-player.css";

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

const COVER_SIZE_CLASSES = {
  40: "w-10 h-10",
  42: "w-[42px] h-[42px]",
  52: "w-[52px] h-[52px]",
};

const WAVE_HEIGHT_CLASSES = [
  "h-[22%]",
  "h-[26.62%]",
  "h-[31.23%]",
  "h-[35.85%]",
  "h-[40.46%]",
  "h-[45.08%]",
  "h-[49.69%]",
  "h-[54.31%]",
  "h-[58.92%]",
  "h-[63.54%]",
  "h-[68.15%]",
  "h-[72.77%]",
  "h-[77.38%]",
];

const MOBILE_BREAKPOINT = 1024;
const RECITER_COOLDOWN_STEPS_MS = [
  90 * 1000,
  8 * 60 * 1000,
  25 * 60 * 1000,
  90 * 60 * 1000,
  4 * 60 * 60 * 1000,
];

function getReciterCooldownMs(failCount) {
  const safeFails = Math.max(1, Number(failCount) || 1);
  const idx = Math.min(RECITER_COOLDOWN_STEPS_MS.length - 1, safeFails - 1);
  return RECITER_COOLDOWN_STEPS_MS[idx];
}


function ProgressRail({ progress, className = "", showThumb = false }) {
  const pct = Math.max(0, Math.min(100, progress * 100));

  return (
    <div className={cn("h-full w-full", className)}>
      <svg
        viewBox="0 0 100 4"
        preserveAspectRatio="none"
        className="block h-full w-full overflow-visible"
      >
        <defs>
          <linearGradient id="audio-progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--gold)" />
            <stop offset="100%" stopColor="var(--gold-bright)" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="100" height="4" rx="2" className="fill-white/10" />
        <rect
          x="0"
          y="0"
          width={pct}
          height="4"
          rx="2"
          fill="url(#audio-progress-gradient)"
        />
        {showThumb && (
          <circle
            cx={pct}
            cy="2"
            r="1.7"
            fill="#fff7da"
            stroke="rgba(18,31,25,0.32)"
            strokeWidth="0.8"
          />
        )}
      </svg>
    </div>
  );
}

/* Waveform (desktop card) */
function Waveform({ isPlaying, progress }) {
  const COUNT = 32;
  return (
    <div className="flex h-8 w-full items-end justify-center gap-0.5 rounded-xl border border-white/10 bg-white/[0.05] px-2 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      {Array.from({ length: COUNT }).map((_, i) => {
        const pct = i / COUNT;
        const filled = pct <= progress;
        const seedIndex = (i * 7 + 3) % 13;
        return (
          <div
            key={i}
            className={cn(
              "min-w-[2px] flex-1 rounded-full origin-bottom",
              WAVE_HEIGHT_CLASSES[seedIndex],
              filled
                ? "bg-gradient-to-b from-[var(--gold-bright)] to-[var(--gold)]"
                : "bg-white/12",
              isPlaying && "animate-pulse",
            )}
          />
        );
      })}
    </div>
  );
}

/* Cover Art (desktop card) */
function CoverArt({ isPlaying, size = 52 }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl shrink-0 bg-[linear-gradient(135deg,var(--theme-primary)_0%,color-mix(in_srgb,var(--theme-primary)_78%,var(--theme-bg)_22%)_58%,color-mix(in_srgb,var(--theme-primary)_62%,var(--theme-bg)_38%)_100%)]",
        COVER_SIZE_CLASSES[size] || COVER_SIZE_CLASSES[52],
        isPlaying
          ? "shadow-[0_2px_12px_rgba(184,134,11,0.35)]"
          : "shadow-[0_2px_8px_rgba(0,0,0,0.3)]",
      )}
    >
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_35%_40%,rgba(212,168,32,0.5)_0%,transparent_60%)]" />
      <svg
        className="absolute inset-0 w-full h-full opacity-25"
        viewBox="0 0 52 52"
        fill="none"
      >
        <circle cx="26" cy="26" r="20" stroke="var(--gold, #d4a820)" strokeWidth="0.6" />
        <circle cx="26" cy="26" r="12" stroke="var(--gold, #d4a820)" strokeWidth="0.5" />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * Math.PI * 2) / 8;
          return (
            <line
              key={i}
              x1={26 + Math.cos(a) * 12}
              y1={26 + Math.sin(a) * 12}
              x2={26 + Math.cos(a) * 20}
              y2={26 + Math.sin(a) * 20}
              stroke="var(--gold, #d4a820)"
              strokeWidth="0.5"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <i className="fas fa-quran text-xl text-[rgba(253,243,213,0.9)] drop-shadow-[0_1px_4px_rgba(184,134,11,0.5)]" />
      </div>
      {isPlaying && (
        <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[var(--gold-bright)] shadow-[0_0_6px_var(--gold)] animate-pulse" />
      )}
    </div>
  );
}

/* Icon button (desktop card) */
function IconBtn({ onClick, title, active, children, size = "md" }) {
  const base =
    size === "sm"
      ? "w-7 h-7 text-[0.72rem]"
      : size === "lg"
        ? "w-12 h-12 text-base"
        : "w-9 h-9 text-[0.82rem]";
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        base,
        "flex items-center justify-center rounded-full cursor-pointer outline-none transition-all duration-150",
        active
          ? "bg-[rgba(212,168,32,0.25)] text-[color-mix(in_srgb,var(--gold-bright,#f5d785)_88%,#ffffff_12%)] border border-[rgba(212,168,32,0.45)]"
          : "bg-[color-mix(in_srgb,var(--theme-panel-bg-strong)_78%,transparent_22%)] text-[color-mix(in_srgb,var(--theme-text)_88%,var(--theme-bg)_12%)] border border-[color-mix(in_srgb,var(--theme-border)_62%,transparent_38%)]",
        "hover:bg-[rgba(212,168,32,0.18)] hover:text-[color-mix(in_srgb,var(--gold-bright,#f5d785)_90%,#ffffff_10%)] hover:border-[rgba(212,168,32,0.35)] hover:scale-105",
        "active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(212,168,32,0.5)]",
      )}
    >
      {children}
    </button>
  );
}

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
    warshStrictMode,
    volume: savedVolume,
    showHome,
    showDuas,
    playerMinimized,
    karaokeFollow,
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

    const rankedReciters = sortRecitersByPreference(getRecitersByRiwaya(riwaya), {
      currentReciterId: reciter,
      favoriteReciters,
      latencyByKey: reciterLatencyByKey,
      availabilityById: reciterAvailabilityRef.current,
    });
    if (!rankedReciters.length) return false;

    const currentIdx = rankedReciters.findIndex((item) => item.id === reciter);
    const rotated =
      currentIdx >= 0
        ? [...rankedReciters.slice(currentIdx + 1), ...rankedReciters.slice(0, currentIdx)]
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
    if (karaokeFollow) return;
    set({ karaokeFollow: true });
  }, [karaokeFollow, set]);

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
      // Navigation automatique karaoke : suivre la sourate
      if (
        karaokeFollowRef.current &&
        item.surah &&
        item.surah !== currentSurahRef.current
      ) {
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

  const closePlayer = useCallback(() => {
    audioService.stop();
    setMinimized(false);
    setOptionsModalOpen(false);
    set({ playerMinimized: false });
    setClosed(true);
  }, [set]);

  const currentReciters = sortRecitersByPreference(getRecitersByRiwaya(riwaya), {
    currentReciterId: reciter,
    favoriteReciters,
    latencyByKey: reciterLatencyByKey,
    availabilityById: reciterAvailabilityById,
  });
  const isWarshMode = riwaya === "warsh";

  /* Reciter search */
  const [reciterSearch, setReciterSearch] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
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
      const next = Math.max(-500, Math.min(500, Math.round(Number(value) || 0)));
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
      if (!nextReciterId || nextReciterId === reciter || reciterSwitchingId) return;
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
        await audioService.switchReciter(target.cdn, target.cdnType || "islamic");
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
        ? currentArabicName || `${t("quran.surah", lang)} ${currentPlayingAyah.surah}`
        : currentSurahName || `${t("quran.surah", lang)} ${currentPlayingAyah.surah}`
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
        p.surah === currentPlayingAyah.surah && p.ayah === currentPlayingAyah.ayah,
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
  const followShortLabel =
    lang === "ar" ? "تتبع" : lang === "fr" ? "Suivi" : "Follow";
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
    memMode && { key: "memorize", label: memorizeShortLabel },
    karaokeFollow && { key: "follow", label: followShortLabel },
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
    "h-9 w-9 shrink-0 rounded-xl border border-[color-mix(in_srgb,var(--theme-border)_60%,transparent_40%)] bg-[color-mix(in_srgb,var(--theme-panel-bg-strong)_74%,transparent_26%)] text-[0.84rem] text-[color-mix(in_srgb,var(--theme-text)_82%,var(--theme-bg)_18%)]",
    "flex items-center justify-center outline-none transition-all duration-150",
    "hover:border-[color-mix(in_srgb,var(--theme-primary)_42%,transparent_58%)] hover:bg-[rgba(var(--theme-primary-rgb),0.16)] hover:text-white",
    "active:scale-95 focus-visible:ring-2 focus-visible:ring-[rgba(var(--theme-primary-rgb),0.32)]",
  );
  const mBarBtnSm = (active = false) =>
    cn(
      "flex min-h-[1.875rem] items-center justify-center whitespace-nowrap rounded-lg border px-2 py-1 text-[0.68rem] font-semibold outline-none transition-all duration-150",
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
      ? "Options audio avancées"
      : lang === "ar"
        ? "خيارات الصوت المتقدمة"
        : "Advanced audio options";
  const optionsModalSubtitle =
    lang === "fr"
      ? "Récitateurs, synchronisation, mémorisation et qualité audio"
      : lang === "ar"
        ? "القراء والمزامنة والحفظ وجودة الصوت"
        : "Reciters, synchronization, memorization and audio quality";
  const isAnyReciterSwitching = Boolean(reciterSwitchingId);
  const renderOptionsModal = () =>
    optionsModalOpen ? (
      <div
        className="audio-player-modal fixed inset-0 z-[420] flex items-center justify-center p-2 sm:p-4"
        data-no-drag="true"
      >
        <button
          type="button"
          className="audio-player-modal__backdrop absolute inset-0 bg-[color-mix(in_srgb,var(--theme-bg)_68%,#040810_32%)] backdrop-blur-sm"
          onClick={() => setOptionsModalOpen(false)}
          aria-label={lang === "fr" ? "Fermer les options" : "Close options"}
        />
        <div
          className="audio-player-modal__surface relative z-[421] flex h-[min(92vh,860px)] w-[min(96vw,1180px)] min-w-0 flex-col overflow-hidden rounded-3xl border border-[color-mix(in_srgb,var(--theme-border-strong)_30%,transparent_70%)] bg-[linear-gradient(165deg,color-mix(in_srgb,var(--theme-panel-bg-strong)_95%,var(--theme-primary)_5%),color-mix(in_srgb,var(--theme-panel-bg)_94%,var(--theme-bg)_6%))] shadow-[0_40px_90px_rgba(2,8,18,0.56)] backdrop-blur-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="audio-options-modal-title"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5 sm:py-4">
            <div className="min-w-0">
              <h3
                id="audio-options-modal-title"
                className="truncate text-sm font-bold text-[color-mix(in_srgb,var(--theme-text)_92%,#ffffff_8%)] sm:text-base"
              >
                {optionsModalTitle}
              </h3>
              <p className="mt-1 truncate text-[0.66rem] text-[color-mix(in_srgb,var(--theme-text-muted)_88%,var(--theme-bg)_12%)] sm:text-xs">
                {optionsModalSubtitle}
              </p>
            </div>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--theme-border)_60%,transparent_40%)] bg-[color-mix(in_srgb,var(--theme-panel-bg-strong)_74%,transparent_26%)] text-[0.78rem] text-[color-mix(in_srgb,var(--theme-text)_84%,var(--theme-bg)_16%)] transition-all duration-150 hover:border-[color-mix(in_srgb,var(--theme-primary)_44%,transparent_56%)] hover:bg-[rgba(var(--theme-primary-rgb),0.14)] hover:text-white"
              onClick={() => setOptionsModalOpen(false)}
              aria-label={lang === "fr" ? "Fermer" : "Close"}
              ref={optionsCloseButtonRef}
            >
              <i className="fas fa-times" />
            </button>
          </div>

          <div className="audio-player-modal__grid grid min-h-0 flex-1 gap-4 overflow-hidden p-3 sm:p-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <section className={cn("flex min-h-0 flex-col p-3 sm:p-3.5", playerSoftSurfaceClass)}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className={playerSectionLabelClass}>{t("audio.reciter", lang)}</span>
                <span className={cn(playerGoldMetaClass, "text-[0.6rem] font-semibold tabular-nums")}>
                  {filteredReciters.length !== currentReciters.length
                    ? `${filteredReciters.length} / ${currentReciters.length}`
                    : currentReciters.length}
                </span>
              </div>

              {currentReciters.length > 4 && (
                <div className="relative mb-2">
                  <i className="fas fa-magnifying-glass pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[0.6rem] text-[rgba(241,230,209,0.35)]" />
                  <input
                    type="text"
                    value={reciterSearch}
                    onChange={(e) => setReciterSearch(e.target.value)}
                    placeholder={
                      lang === "fr"
                        ? "Rechercher un récitateur..."
                        : lang === "ar"
                          ? "ابحث عن قارئ..."
                          : "Search reciter..."
                    }
                    className={playerSearchInputClass}
                  />
                  {reciterSearch && (
                    <button
                      type="button"
                      onClick={() => setReciterSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[0.58rem] text-[rgba(241,230,209,0.42)]"
                    >
                      <i className="fas fa-times" />
                    </button>
                  )}
                </div>
              )}

              <div className="min-h-0 flex-1 overflow-y-auto pr-1" data-scroll-panel="true">
                {filteredReciters.length === 0 ? (
                  <div className={cn(playerFadedTextClass, "py-6 text-center text-xs")}>
                    {lang === "fr"
                      ? "Aucun récitateur trouvé"
                      : lang === "ar"
                        ? "لا يوجد قارئ"
                        : "No reciter found"}
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {filteredReciters.map((r) => {
                      const active = reciter === r.id;
                      const isLoading =
                        reciterSwitchingId === r.id || (active && networkState === "loading");
                      const unavailableMs = getReciterUnavailableRemainingMs(
                        r.id,
                        reciterAvailabilityById,
                      );
                      const isUnavailable = unavailableMs > 0;
                      const initial = (r.nameEn || r.name || "?")[0].toUpperCase();
                      const isFavorite = (favoriteReciters || []).includes(r.id);
                      const latency = getLatencyForReciter(r, reciterLatencyByKey);
                      return (
                        <button
                          key={`modal-${r.id}`}
                          onClick={() => handleReciterSelect(r.id)}
                          className={playerReciterButtonClass(
                            active,
                            isLoading,
                            isUnavailable,
                          )}
                          aria-pressed={active}
                          disabled={isAnyReciterSwitching || (isUnavailable && !active)}
                        >
                          <span className={playerReciterAvatarClass(active)}>
                            {isLoading ? (
                              <i className="fas fa-spinner fa-spin text-[0.48rem]" />
                            ) : active ? (
                              <i className="fas fa-check text-[0.48rem]" />
                            ) : (
                              initial
                            )}
                          </span>
                          <span className="flex min-w-0 flex-col">
                            <span className="truncate text-[0.7rem] font-semibold leading-tight">
                              {lang === "ar" ? r.name : lang === "fr" ? r.nameFr : r.nameEn}
                            </span>
                              <span className="mt-1 flex flex-wrap gap-1">
                                <span className="inline-flex w-fit items-center rounded-full border border-white/12 bg-white/[0.06] px-1.5 py-0.5 text-[0.52rem] font-semibold tracking-wide text-[rgba(225,214,194,0.72)]">
                                  {r.cdnType === "everyayah"
                                    ? "EveryAyah CDN"
                                    : r.cdnType === "mp3quran-surah"
                                      ? "MP3Quran"
                                      : "Islamic CDN"}
                                </span>
                                {r.audioMode === "surah" && (
                                  <span className="inline-flex w-fit items-center rounded-full border border-fuchsia-300/30 bg-fuchsia-300/10 px-1.5 py-0.5 text-[0.52rem] font-semibold tracking-wide text-fuchsia-100">
                                    {lang === "fr"
                                      ? "Sourate complete"
                                      : lang === "ar"
                                        ? "سورة كاملة"
                                        : "Full surah"}
                                  </span>
                                )}
                                {isFavorite && (
                                <span className="inline-flex w-fit items-center rounded-full border border-amber-300/35 bg-amber-300/10 px-1.5 py-0.5 text-[0.52rem] font-semibold tracking-wide text-amber-200">
                                  <i className="fas fa-star mr-1 text-[0.44rem]" />
                                  {lang === "fr" ? "Favori" : lang === "ar" ? "مفضل" : "Favorite"}
                                </span>
                              )}
                              {latency && (
                                <span className="inline-flex w-fit items-center rounded-full border border-sky-300/30 bg-sky-300/10 px-1.5 py-0.5 text-[0.52rem] font-semibold tracking-wide text-sky-100">
                                  {Math.round(latency * 1000)}ms
                                </span>
                              )}
                              {autoSelectFastestReciter && filteredReciters[0]?.id === r.id && (
                                <span className="inline-flex w-fit items-center rounded-full border border-emerald-300/30 bg-emerald-300/10 px-1.5 py-0.5 text-[0.52rem] font-semibold tracking-wide text-emerald-100">
                                  {lang === "fr" ? "Rapide" : lang === "ar" ? "سريع" : "Fast"}
                                </span>
                              )}
                              {isUnavailable && (
                                <span className="inline-flex w-fit items-center rounded-full border border-rose-300/40 bg-rose-300/16 px-1.5 py-0.5 text-[0.52rem] font-semibold tracking-wide text-rose-100">
                                  {lang === "fr"
                                    ? `Indisponible ${formatCooldownLabel(unavailableMs, lang)}`
                                    : lang === "ar"
                                      ? `غير متاح ${formatCooldownLabel(unavailableMs, lang)}`
                                      : `Unavailable ${formatCooldownLabel(unavailableMs, lang)}`}
                                </span>
                              )}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            <section className="min-h-0 overflow-y-auto pr-1" data-scroll-panel="true">
              <div className={cn("mb-3 p-3", playerSoftSurfaceClass)}>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={cycleSpeed}
                    className={cn(playerCardToggleClass(false), "min-w-[7.5rem]")}
                  >
                    <span className="flex items-center gap-2">
                      <i className="fas fa-gauge-high text-[0.62rem]" />
                      {lang === "fr" ? "Vitesse" : lang === "ar" ? "السرعة" : "Speed"}
                    </span>
                    <span>{audioSpeed}x</span>
                  </button>
                  <button
                    onClick={() => set({ memMode: !memMode })}
                    className={playerCardToggleClass(memMode)}
                    aria-pressed={memMode}
                  >
                    <span className="flex items-center gap-2">
                      <i className="fas fa-repeat text-[0.62rem]" />
                      {t("audio.memorization", lang)}
                    </span>
                    <span>{memMode ? "ON" : "OFF"}</span>
                  </button>
                  <button
                    onClick={toggleTartil}
                    className={playerCardToggleClass(tartilMode)}
                    aria-pressed={tartilMode}
                  >
                    <span className="flex items-center gap-2">
                      <i className="fas fa-wave-square text-[0.62rem]" />
                      {lang === "fr" ? "Tartil" : lang === "ar" ? "ترتيل" : "Tartil"}
                    </span>
                    <span>{tartilMode ? "ON" : "OFF"}</span>
                  </button>
                </div>
              </div>

              <div className={cn("mb-3 p-3", playerSoftSurfaceClass)}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className={playerSectionLabelClass}>
                    {lang === "fr" ? "Volume" : lang === "ar" ? "مستوى الصوت" : "Volume"}
                  </span>
                  <span className={cn(playerGoldMetaClass, "text-[0.64rem] tabular-nums")}>
                    {Math.round(volume * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleVolumeChange(volume > 0 ? 0 : 1)}
                    className="h-8 w-8 shrink-0 rounded-lg border border-white/12 bg-white/[0.06] text-[0.8rem] text-[rgba(132,205,228,0.9)] transition-colors duration-150 hover:bg-[rgba(110,204,233,0.14)]"
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
                    className="h-1.5 flex-1 cursor-pointer rounded-full accent-[rgb(110,204,233)]"
                  />
                </div>
              </div>

              <div className={cn("mb-3 p-3", playerSoftSurfaceClass)}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className={playerSectionLabelClass}>
                    {lang === "fr" ? "Synchronisation mot a mot" : lang === "ar" ? "مزامنة كلمة بكلمة" : "Word sync"}
                  </span>
                  <span className={cn(playerGoldMetaClass, "text-[0.64rem] tabular-nums")}>
                    {syncOffsetMs > 0 ? `+${syncOffsetMs}` : syncOffsetMs}ms
                  </span>
                </div>
                <input
                  type="range"
                  min="-500"
                  max="500"
                  step="10"
                  value={syncOffsetMs}
                  disabled={isSurahStreamReciter}
                  onChange={(e) => setSyncOffsetMs(e.target.value)}
                  className="h-1.5 w-full cursor-pointer rounded-full accent-[rgb(110,204,233)]"
                />
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <button onClick={() => setSyncOffsetMs(syncOffsetMs - 40)} className={playerOptionPillClass(false)}>
                    -40ms
                  </button>
                  <button onClick={() => setSyncOffsetMs(syncOffsetMs + 40)} className={playerOptionPillClass(false)}>
                    +40ms
                  </button>
                  <button onClick={() => setSyncOffsetMs(0)} className={playerOptionPillClass(syncOffsetMs === 0)}>
                    {lang === "fr" ? "Reset" : lang === "ar" ? "إعادة" : "Reset"}
                  </button>
                </div>
                <p className={cn(playerFadedTextClass, "mt-2 text-[0.62rem] leading-relaxed")}>
                  {isSurahStreamReciter
                    ? lang === "fr"
                      ? "Ce recitateur lit la sourate complete, donc la synchro mot a mot n'est pas utilisee."
                      : lang === "ar"
                        ? "هذا القارئ يقرأ السورة كاملة، لذلك لا تستخدم مزامنة كلمة بكلمة."
                        : "This reciter plays the full surah, so word-by-word sync is not used."
                    : lang === "fr"
                      ? "Le suivi des versets est verrouillé en automatique. La calibration se mémorise par récitateur."
                      : lang === "ar"
                        ? "متابعة الآيات مفعلة تلقائيا دائما. تتم معايرة التزامن لكل قارئ."
                        : "Verse follow is locked to automatic. Sync calibration is saved per reciter."}
                </p>
              </div>

              {memMode && (
                <div className={cn("mb-3 p-3", playerSoftSurfaceClass)}>
                  <div className={playerSectionLabelClass}>{t("audio.memorization", lang)}</div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className={cn(playerMutedTextClass, "text-[0.68rem]")}>{t("audio.repeat", lang)}</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={memRepeatCount}
                        onChange={(e) => set({ memRepeatCount: parseInt(e.target.value, 10) || 1 })}
                        className={playerNumberInputClass}
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn(playerMutedTextClass, "text-[0.68rem]")}>{`${t("audio.pause", lang)} (s)`}</span>
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={memPause}
                        onChange={(e) => set({ memPause: parseInt(e.target.value, 10) || 0 })}
                        className={playerNumberInputClass}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className={cn("mb-3 p-3", playerSoftSurfaceClass)}>
                <div className={cn(playerSectionLabelClass, "mb-2")}>A-B Repeat</div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button onClick={markAbA} className={playerAbButtonClass(Boolean(abA))} disabled={!hasAyahContext}>
                    {abA ? `A: ${abA.surah}:${abA.ayah}` : "A"}
                  </button>
                  <button onClick={markAbB} className={playerAbButtonClass(Boolean(abB))} disabled={!hasAyahContext}>
                    {abB ? `B: ${abB.surah}:${abB.ayah}` : "B"}
                  </button>
                  {(abA || abB) && (
                    <button
                      onClick={clearAb}
                      className="rounded-lg border border-white/12 bg-white/[0.05] px-2 py-1 text-[0.62rem] text-[rgba(228,218,197,0.68)] transition-all hover:border-[rgba(110,204,233,0.4)] hover:bg-[rgba(110,204,233,0.1)]"
                    >
                      <i className="fas fa-times" />
                    </button>
                  )}
                </div>
              </div>

              <div className={cn("mb-3 p-3", playerSoftSurfaceClass)}>
                <div className={cn(playerSectionLabelClass, "mb-2")}>
                  {lang === "fr" ? "Acoustique" : lang === "ar" ? "الصوتيات" : "Acoustics"}
                </div>
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: "flat", fr: "Plat", ar: "Flat", en: "Flat" },
                    { id: "bass", fr: "Graves", ar: "Bass", en: "Bass" },
                    { id: "treble", fr: "Aigus", ar: "حاد", en: "Treble" },
                    { id: "near", fr: "Proche", ar: "Near", en: "Near" },
                    { id: "hall", fr: "Salle", ar: "Hall", en: "Hall" },
                    { id: "vocals", fr: "Voix", ar: "Vocals", en: "Vocals" },
                  ].map((preset) => (
                    <button
                      key={`modal-eq-${preset.id}`}
                      onClick={() => handleEq(preset.id)}
                      className={playerOptionPillClass(eqPreset === preset.id)}
                    >
                      {lang === "ar" ? preset.ar : lang === "fr" ? preset.fr : preset.en}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pb-1">
                <button
                  onClick={reciteMode ? stopRecite : startRecite}
                  className={cn(
                    playerCardToggleClass(reciteMode),
                    "min-w-[9rem]",
                    reciteMode && "border-[rgba(34,197,94,0.4)] text-[#86efac]",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <i className={`fas ${reciteMode ? "fa-stop" : "fa-microphone"} text-[0.62rem]`} />
                    {lang === "fr" ? "Récitation guidée" : lang === "ar" ? "Guided recitation" : "Guided recitation"}
                  </span>
                  <span>{reciteMode ? "ON" : "OFF"}</span>
                </button>
                <button
                  onClick={stop}
                  className={cn(playerSurfaceButtonClass, "px-4 py-2 text-[0.68rem] font-semibold")}
                >
                  <i className="fas fa-stop mr-1" />
                  {t("audio.stop", lang)}
                </button>
                <button
                  onClick={() => setOptionsModalOpen(false)}
                  className={cn(playerSurfaceButtonClass, "px-4 py-2 text-[0.68rem] font-semibold")}
                >
                  {lang === "fr" ? "Terminer" : lang === "ar" ? "Done" : "Done"}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    ) : null;

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
    [
      canDragDesktopCard,
      cardPos.x,
      cardPos.y,
      manualDockPosition,
    ],
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

  const onPointerUp = useCallback(
    () => {
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
    },
    [cardPos],
  );
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
        ? "right-4 top-[calc(var(--header-h)+1rem)] left-auto bottom-auto xl:right-5"
        : "left-[var(--player-left)] top-[var(--player-top)] right-auto bottom-auto";
  const desktopCardShadowClass = isPlaying
    ? "shadow-[0_26px_62px_rgba(2,8,18,0.54),0_0_0_1px_rgba(122,188,210,0.2)]"
    : "shadow-[0_18px_46px_rgba(2,8,18,0.48),0_0_0_1px_rgba(255,255,255,0.08)]";

  if (closed) return null;

  /* ••••••••••••••••••••••••••••••••••••••••••
     MOBILE -- classic bottom bar
  •••••••••••••••••••••••••••••••••••••••••• */
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
          aria-label={
            lang === "ar"
              ? "Minimized audio player"
              : lang === "fr"
                ? "Lecteur audio reduit"
                : "Minimized audio player"
          }
        >
          <div className="h-1 bg-white/10">
            <ProgressRail progress={progress} />
          </div>
          <div className="mp-player-minimized-row flex items-center gap-2.5 px-3 py-2.5">
            <CoverArt isPlaying={isPlaying} size={40} />
            <div className="mp-player-minimized-meta min-w-0 flex-1">
              <div className="mp-player-minimized-title truncate text-[0.82rem] font-bold leading-tight text-[color-mix(in_srgb,var(--theme-text)_94%,#ffffff_6%)]">
                {titleLabel ||
                  (lang === "fr" ? "Prêt à lire" : lang === "ar" ? "Ready" : "Ready")}
              </div>
              <div className="mp-player-minimized-reciter truncate text-[0.68rem] text-[color-mix(in_srgb,var(--theme-text-muted)_90%,var(--theme-bg)_10%)]">
                {reciterLabel || "-"}
              </div>
            </div>
            <button
              className={cn(playerPrimaryBtnClass, "h-10 w-10 text-[0.88rem]")}
              onClick={toggle}
              title={isPlaying ? t("audio.pause", lang) : t("audio.play", lang)}
              aria-pressed={isPlaying}
            >
              <i className={`fas ${isPlaying ? "fa-pause" : "fa-play"}`} />
            </button>
            <button
              className={cn(
                mBarBtn,
                "mp-player-options-trigger w-8 h-8 text-[0.72rem] rounded-lg shrink-0",
              )}
              onClick={() => setOptionsModalOpen(true)}
              aria-controls="audio-options-modal-title"
              aria-expanded={optionsModalOpen}
              title={
                lang === "fr"
                  ? "Options et récitateurs"
                  : lang === "ar"
                    ? "Options and reciters"
                    : "Options and reciters"
              }
            >
              <i className="fas fa-sliders" />
            </button>
            <button
              className={cn(
                mBarBtn,
                "w-8 h-8 text-[0.72rem] rounded-lg shrink-0",
              )}
              onClick={toggleMinimized}
              title={
                lang === "fr" ? "Agrandir" : lang === "ar" ? "Expand" : "Expand"
              }
            >
              <i className="fas fa-expand-alt" />
            </button>
            <button
              className={cn(
                mBarBtn,
                "w-8 h-8 text-[0.72rem] rounded-lg shrink-0",
              )}
              onClick={closePlayer}
              title={
                lang === "fr" ? "Fermer" : lang === "ar" ? "Close" : "Close"
              }
            >
              <i className="fas fa-times" />
            </button>
          </div>
          {renderOptionsModal()}
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
        aria-label={
          lang === "ar"
            ? "Audio Player"
            : lang === "fr"
              ? "Lecteur Audio"
              : "Audio Player"
        }
      >
        <div className="mp-player-mobile-head flex items-center justify-between px-3.5 pb-1.5 pt-2">
          <button
            className={cn(mBarBtn, "h-10 w-10 rounded-full")}
            onClick={toggleMinimized}
            title={
              lang === "fr"
                ? "Réduire"
                : lang === "ar"
                  ? "تصغير"
                  : "Minimize"
            }
          >
            <i className="fas fa-chevron-down" />
          </button>
          <div className="flex min-w-0 items-center gap-2 px-2">
            <div className="h-1 w-9 rounded-full bg-[linear-gradient(90deg,rgba(var(--theme-primary-rgb),0.18),rgba(var(--theme-primary-rgb),0.95),rgba(var(--theme-primary-rgb),0.18))]" />
            <span className="text-[0.62rem] uppercase tracking-[0.14em] text-[color-mix(in_srgb,var(--theme-text-muted)_92%,var(--theme-bg)_8%)] [font-family:var(--font-ui)]">
              DRAG
            </span>
          </div>
          <button
            className={cn(mBarBtn, "h-10 w-10 rounded-full")}
            onClick={closePlayer}
            title={
              lang === "fr" ? "Fermer" : lang === "ar" ? "Close" : "Close"
            }
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
          onMouseDown={handleProgressMouseDown}
          role="progressbar"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <ProgressRail progress={progress} showThumb />
        </div>

        {/* Controls row */}
        <div className="mp-player-controls-strip mp-player-mobile-controls flex min-h-[4.1rem] items-center gap-2.5 px-3 pb-1.5">
          {/* Left: info block */}
          <div
            className="mp-player-mobile-meta flex w-[5.8rem] shrink-0 flex-col justify-center gap-[0.2rem] min-w-0"
            aria-live="polite"
          >
            <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-[0.7rem] font-semibold leading-tight text-[color-mix(in_srgb,var(--theme-text)_90%,#ffffff_10%)]">
              {currentPlayingAyah
                ? hasAyahContext
                  ? `${t("quran.surah", lang)} ${currentPlayingAyah.surah}:${currentPlayingAyah.ayah}`
                  : titleLabel
                : lang === "fr" ? "En attente" : lang === "ar" ? "Ready" : "Ready"}
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
          <div className={cn("mp-player-controls-strip mp-player-mobile-main-controls flex flex-1 items-center justify-center gap-1.5 rounded-xl px-1.5 py-1", playerSoftSurfaceClass)}>
            <button
              className={cn(
                mBarBtn,
                "h-9 w-9 rounded-lg text-[0.74rem] shrink-0",
              )}
              onClick={prev}
              title={t("audio.prev", lang)}
            >
              <i className="fas fa-step-backward" />
            </button>

            <button
              className={cn(playerPrimaryBtnClass, "mp-player-play-btn h-11 w-11 shrink-0 text-[0.94rem] hover:scale-[1.06] active:scale-[0.94]")}
              onClick={toggle}
              title={isPlaying ? t("audio.pause", lang) : t("audio.play", lang)}
              aria-pressed={isPlaying}
            >
              <i
                className={`fas ${isPlaying ? "fa-pause" : "fa-play"} ${isPlaying ? "" : "translate-x-px"}`}
              />
            </button>

            <button
              className={cn(
                mBarBtn,
                "h-9 w-9 rounded-lg text-[0.74rem] shrink-0",
              )}
              onClick={next}
              title={t("audio.next", lang)}
            >
              <i className="fas fa-step-forward" />
            </button>

            <button
              className={cn(
                mBarBtn,
                "h-9 w-9 rounded-lg text-[0.74rem] shrink-0",
              )}
              onClick={stop}
              title={t("audio.stop", lang)}
            >
              <i className="fas fa-stop" />
            </button>
          </div>

          {/* Right: secondary controls */}
          <div className="mp-player-mobile-secondary flex shrink-0 items-center gap-1">
            <button
                className={cn(
                  mBarBtnSm(),
                  "px-[0.46rem] py-[0.24rem] text-[0.64rem] min-h-[1.875rem] min-w-[1.95rem] justify-center rounded-full",
                )}
              onClick={cycleSpeed}
              title={
                lang === "fr" ? "Vitesse" : lang === "ar" ? "Speed" : "Speed"
              }
            >
              {audioSpeed}x
            </button>
            <button
                className={cn(
                  mBarBtnSm(memMode),
                  "px-[0.46rem] py-[0.24rem] text-[0.64rem] min-h-[1.875rem] min-w-[1.875rem] justify-center rounded-full",
                )}
              onClick={() => set({ memMode: !memMode })}
              title={t("audio.memorization", lang)}
              aria-pressed={memMode}
            >
              <i className="fas fa-repeat" />
            </button>
            <button
                className={cn(
                  mBarBtnSm(optionsModalOpen),
                  "mp-player-options-trigger px-[0.46rem] py-[0.24rem] text-[0.64rem] min-h-[1.875rem] min-w-[1.875rem] justify-center rounded-full",
                )}
              onClick={() => setOptionsModalOpen(true)}
              aria-expanded={optionsModalOpen}
              aria-controls="audio-options-modal-title"
              title={
                optionsModalOpen
                  ? lang === "fr" ? "Réduire" : lang === "ar" ? "Options opened" : "Options opened"
                  : lang === "fr" ? "Plus d'options" : lang === "ar" ? "More options" : "More options"
              }
            >
              <i className="fas fa-sliders" />
            </button>
          </div>
        </div>

        {/* Expanded panel */}
        {expanded && (
          <div
            className="mp-player-mobile-expanded max-h-[62vh] overflow-y-auto border-t border-[color-mix(in_srgb,var(--theme-border)_58%,transparent_42%)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--theme-panel-bg-strong)_82%,transparent_18%),color-mix(in_srgb,var(--theme-panel-bg)_72%,transparent_28%))] px-3.5 pb-4 pt-3 animate-[fadeInUp_0.18s_var(--ease,ease)]"
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
                    lang === "fr" ? "Réessayer" : lang === "ar" ? "Retry" : "Retry"
                  }
                >
                  {lang === "fr"
                    ? "Réessayer"
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
                    {lang === "fr" ? "Lecture sourate complete" : lang === "ar" ? "Full-surah playback" : "Full-surah playback"}
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
                  <i
                    className="fas fa-search pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[0.5rem] text-[rgba(240,234,214,0.3)]"
                  />
                  <input
                    type="text"
                    value={reciterSearch}
                    onChange={(e) => setReciterSearch(e.target.value)}
                    placeholder={
                      lang === "ar"
                        ? "Search..."
                        : lang === "fr"
                          ? "Rechercher..."
                          : "Search..."
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
                    className={cn(playerFadedTextClass, "py-2 text-center text-[0.62rem]")}
                  >
                    {lang === "fr" ? "Aucun résultat" : lang === "ar" ? "No results" : "No results"}
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
                          className={playerReciterButtonClass(active, isLoading)}
                          aria-pressed={active}
                          disabled={Boolean(reciterSwitchingId)}
                        >
                          <span className={playerReciterAvatarClass(active)}>
                            {isLoading ? (
                              <i className="fas fa-spinner fa-spin text-[0.45rem]" />
                            ) : active ? (
                              <i className="fas fa-check text-[0.45rem]" />
                            ) : (
                              initial
                            )}
                          </span>
                          <span className="flex min-w-0 flex-col">
                            <span className="text-[0.68rem] font-semibold leading-tight truncate">
                              {lang === "ar"
                                ? r.name
                                : lang === "fr"
                                  ? r.nameFr
                                  : r.nameEn}
                            </span>
                            {r.style && (
                              <span
                                className="truncate text-[0.52rem] uppercase leading-tight tracking-wide text-[rgba(240,234,214,0.35)]"
                              >
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
                                {lang === "fr" ? "Sourate complete" : lang === "ar" ? "Full surah" : "Full surah"}
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
            <div className={cn("mt-2.5 flex items-center gap-2 px-2 py-2", playerSoftSurfaceClass)}>
              <button
                onClick={() => handleVolumeChange(volume > 0 ? 0 : 1)}
                className="h-7 w-7 shrink-0 rounded-lg border border-white/12 bg-white/[0.06] text-[0.72rem] text-[rgba(132,205,228,0.9)] transition-colors duration-150 hover:bg-[rgba(110,204,233,0.14)]"
                title={
                  volume > 0
                    ? lang === "fr" ? "Muet" : lang === "ar" ? "Mute" : "Mute"
                    : lang === "fr" ? "Activer" : lang === "ar" ? "Unmute" : "Unmute"
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
            {memMode && (
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

            {/* Karaoke + Fermer */}
            <div className={cn("mt-2.5 flex items-center gap-2 p-2", playerSoftSurfaceClass)}>
              <button
                className={cn(
                  mBarBtnSm(karaokeFollow),
                  "flex-1 gap-1.5 justify-center",
                )}
                onClick={() => set({ karaokeFollow: true })}
                aria-pressed={karaokeFollow}
                disabled
                title={
                  lang === "fr" ? "Suivre le verset récité" : "Follow verse"
                }
              >
                <i className="fas fa-crosshairs text-[0.6rem]" />
                {lang === "fr" ? "Suivre" : lang === "ar" ? "تتبع" : "Follow"}
              </button>
              <button
                className={cn(mBarBtnSm(), "flex-1 gap-1.5 justify-center")}
                onClick={closePlayer}
                title={lang === "fr" ? "Fermer le lecteur" : "Close player"}
              >
                <i className="fas fa-times text-[0.6rem]" />
                {lang === "fr" ? "Fermer" : lang === "ar" ? "Close" : "Close"}
              </button>
            </div>

            {/* -- Options avancées toggle (mobile) -- */}
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
                  {lang === "fr" ? "Options" : lang === "ar" ? "Options" : "Options"}
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
                    {lang === "fr" ? "Acoustique" : lang === "ar" ? "Acoustics" : "Acoustics"}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { id: "flat", fr: "Plat", ar: "Flat", en: "Flat" },
                      { id: "bass", fr: "Graves", ar: "Bass", en: "Bass" },
                      { id: "treble", fr: "Aigus", ar: "حاد", en: "Treble" },
                      { id: "near", fr: "Proche", ar: "Near", en: "Near" },
                      { id: "hall", fr: "Salle", ar: "Hall", en: "Hall" },
                      { id: "vocals", fr: "Voix", ar: "Vocals", en: "Vocals" },
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleEq(p.id)}
                        className={cn(mBarBtnSm(eqPreset === p.id), "px-1.5")}
                      >
                        {lang === "ar" ? p.ar : lang === "fr" ? p.fr : p.en}
                      </button>
                    ))}
                  </div>
                </div>

                {/* -- Tartil + Récitation (mobile) -- */}
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
                    {lang === "fr" ? "Tartil" : lang === "ar" ? "Tartil" : "Tartil"}
                  </button>
                  <button
                    onClick={reciteMode ? stopRecite : startRecite}
                    className={cn(
                      mBarBtnSm(reciteMode),
                      reciteMode && "border-[rgba(34,197,94,0.4)] text-[#86efac]",
                      "flex-1 gap-1 justify-center",
                    )}
                  >
                    <i
                      className={`fas ${reciteMode ? "fa-stop" : "fa-microphone"} text-[0.6rem]`}
                    />
                    {lang === "fr" ? "Réciter" : lang === "ar" ? "Recite" : "Recite"}
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
          </div>
        )}
        {renderOptionsModal()}
      </div>
    );
  }

  /* ••••••••••••••••••••••••••••••••••••••••••
     DESKTOP -- floating music card
  •••••••••••••••••••••••••••••••••••••••••• */
  return (
    <>
      {/* Audio error banner */}
      {audioError && (
        <div
          className="pointer-events-none fixed left-1/2 top-[72px] z-[400] flex max-w-[340px] -translate-x-1/2 items-center gap-2 rounded-xl bg-[rgba(180,30,30,0.93)] px-[18px] py-[10px] text-center text-[13px] text-white shadow-[0_4px_20px_rgba(0,0,0,0.4)] animate-[slideDownFade_0.25s_var(--ease,ease)]"
        >
          <i className="fas fa-exclamation-circle shrink-0" />
          <span>{audioError}</span>
        </div>
      )}

      <div
        ref={cardRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={cn(
          "mp-audio-player mp-audio-player--desktop !fixed z-[300] flex flex-col overflow-hidden select-none touch-auto text-[color-mix(in_srgb,var(--theme-text)_92%,var(--theme-bg)_8%)]",
          playerPanelSurfaceClass,
          isContextualDesktop &&
            !manualDockPosition &&
            "mp-audio-player--reading-dock",
          isReadingDesktop &&
            "max-h-[calc(100vh-var(--header-h)-1.6rem)]",
          minimized ? "is-minimized rounded-[20px]" : "is-maximized rounded-[24px]",
          expanded ? "is-expanded" : "is-collapsed",
          desktopCardWidthClass,
          desktopCardPositionClass,
          desktopCardShadowClass,
          !isDragging && "transition-[box-shadow,width] duration-300 ease-[var(--ease,ease)]",
          !canDragDesktopCard
            ? "cursor-default"
            : isDragging
              ? "cursor-grabbing"
              : "cursor-grab",
        )}
        role="region"
        aria-label={
          lang === "ar"
            ? "Audio Player"
            : lang === "fr"
              ? "Lecteur Audio"
              : "Audio Player"
        }
      >
        {minimized && !isHomeDesktop ? (
          <>
            <div
              className="flex items-center gap-3 px-3.5 pb-2.5 pt-3"
              data-player-drag="true"
            >
              <CoverArt isPlaying={isPlaying} size={42} />
              <div className="min-w-0 flex-1">
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
                    (lang === "fr" ? "Prêt à lire" : lang === "ar" ? "Ready" : "Ready")}
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
              </div>
              <button
                onClick={toggle}
                title={
                  isPlaying ? t("audio.pause", lang) : t("audio.play", lang)
                }
                aria-pressed={isPlaying}
                className={cn(playerPrimaryBtnClass, "h-10 w-10")}
              >
                <i className={`fas ${isPlaying ? "fa-pause" : "fa-play"}`} />
              </button>
              <IconBtn
                className="mp-player-options-trigger"
                onClick={() => setOptionsModalOpen(true)}
                title={
                  lang === "fr"
                    ? "Options et récitateurs"
                    : lang === "ar"
                      ? "Options and reciters"
                      : "Options and reciters"
                }
                size="sm"
              >
                <i className="fas fa-sliders" />
              </IconBtn>
              <IconBtn
                onClick={toggleMinimized}
                title={
                  lang === "fr" ? "Agrandir" : lang === "ar" ? "Expand" : "Expand"
                }
                size="sm"
              >
                <i className="fas fa-expand-alt" />
              </IconBtn>
              <IconBtn
                onClick={closePlayer}
                title={
                  lang === "fr" ? "Fermer" : lang === "ar" ? "Close" : "Close"
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
              className={cn("flex shrink-0 items-center justify-between px-4 pb-1 pt-2.5", playerSoftSurfaceClass)}
              data-player-drag="true"
            >
              <button
                onClick={toggleMinimized}
                className={cn(playerUtilityClass, "h-6 w-6")}
                title={
                  lang === "fr"
                    ? "Minimiser"
                    : lang === "ar"
                      ? "تصغير"
                      : "Minimize"
                }
                disabled={isHomeDesktop}
              >
                <i className="fas fa-chevron-down text-xs" />
              </button>
              <button
                className={cn(playerUtilityClass, "mp-player-options-trigger h-6 w-6")}
                onClick={() => setOptionsModalOpen(true)}
                title={
                  lang === "fr"
                    ? "Options et récitateurs"
                    : lang === "ar"
                      ? "Options and reciters"
                      : "Options and reciters"
                }
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
                title={
                  lang === "fr" ? "Fermer le lecteur" : lang === "ar" ? "Close player" : "Close player"
                }
              >
                <i className="fas fa-times text-xs" />
              </button>
            </div>

            <div className="flex flex-col gap-3 px-3.5 pb-3.5 pt-1.5">
              {/* Top row: cover + info */}
              <div className={cn("flex items-center gap-2.5 p-2.5", playerSoftSurfaceClass)}>
                <CoverArt isPlaying={isPlaying} />
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
                      (lang === "fr" ? "Prêt à lire" : lang === "ar" ? "Ready" : "Ready")}
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
                      Warsh “
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
                  <IconBtn
                    onClick={() => set({ karaokeFollow: true })}
                    title={
                      karaokeFollow
                        ? lang === "fr"
                          ? "Suivi ON -- clic pour désactiver"
                          : "Follow ON"
                        : lang === "fr"
                          ? "Suivi OFF -- clic pour activer"
                          : "Follow OFF"
                    }
                    active={karaokeFollow}
                    size="sm"
                  >
                    <i className="fas fa-crosshairs" />
                  </IconBtn>
                  {isContextualDesktop && manualDockPosition && (
                    <IconBtn
                      onClick={resetDockPosition}
                      title={
                        lang === "fr" ? "Revenir au dock" : lang === "ar" ? "Reset dock position" : "Reset dock position"
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
              <div className={cn("flex flex-col gap-1 rounded-xl px-2 py-1.5", playerSoftSurfaceClass)}>
                <div
                  ref={progressRef}
                  onClick={handleSeek}
                  onMouseDown={handleProgressMouseDown}
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
              <div className={cn("mp-player-controls-strip flex items-center justify-between px-2 py-2", playerSoftSurfaceClass)}>
                {/* Speed */}
                <button
                  onClick={cycleSpeed}
                  className={cn(
                    playerBadgeClass,
                    "rounded-md px-2 py-[0.1875rem] text-[0.62rem] font-bold transition-all duration-150",
                  )}
                  title="Vitesse"
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
                    isPlaying ? t("audio.pause", lang) : t("audio.play", lang)
                  }
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

                <IconBtn
                  onClick={() => set({ memMode: !memMode })}
                  title={t("audio.memorization", lang)}
                  active={memMode}
                >
                  <i className="fas fa-repeat" />
                </IconBtn>
              </div>

              {/* Volume */}
              <div className={cn("flex items-center gap-2 px-2 py-2", playerSoftSurfaceClass)}>
                <button
                  onClick={() => handleVolumeChange(volume > 0 ? 0 : 1)}
                  className="h-7 w-7 shrink-0 rounded-lg border border-[color-mix(in_srgb,var(--theme-border)_60%,transparent_40%)] bg-[color-mix(in_srgb,var(--theme-panel-bg-strong)_78%,transparent_22%)] text-[0.72rem] text-[color-mix(in_srgb,var(--theme-primary)_72%,var(--theme-text)_28%)] transition-colors duration-150 hover:bg-[rgba(var(--theme-primary-rgb),0.14)]"
                  title={t("audio.volume", lang)}
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
                  aria-label="Volume"
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
                onClick={() => setOptionsModalOpen(true)}
                aria-controls="audio-options-modal-title"
                className="mp-player-options-trigger flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.05] py-1.5 text-[0.63rem] text-[rgba(230,219,198,0.62)] transition-all duration-150 [font-family:var(--font-ui)] hover:border-[rgba(110,204,233,0.38)] hover:bg-[rgba(110,204,233,0.1)] hover:text-[rgba(240,250,255,0.95)]"
              >
                <i className="fas fa-sliders text-[0.55rem]" />
                {expanded
                  ? lang === "fr" ? "Réduire" : lang === "ar" ? "Collapse" : "Collapse"
                  : lang === "fr" ? "Plus d'options" : lang === "ar" ? "More" : "More"}
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
                          lang === "fr" ? "Réessayer" : lang === "ar" ? "Retry" : "Retry"
                        }
                      >
                        {lang === "fr"
                          ? "Réessayer"
                          : lang === "ar"
                            ? "إعادة"
                            : "Retry"}
                      </button>
                    </div>
                  )}
                  {/* Reciter grid */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div
                        className={playerSectionLabelClass}
                      >
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
                        <i
                          className="fas fa-magnifying-glass pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[0.5rem] text-[rgba(240,234,214,0.3)]"
                        />
                        <input
                          type="text"
                          value={reciterSearch}
                          onChange={(e) => setReciterSearch(e.target.value)}
                          placeholder={
                            lang === "ar"
                                ? "Search..."
                              : lang === "fr"
                                ? "Rechercher..."
                                : "Search..."
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
                          {lang === "fr" ? "Aucun résultat" : lang === "ar" ? "No results" : "No results"}
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
                            const unavailableMs = getReciterUnavailableRemainingMs(
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
                                disabled={Boolean(reciterSwitchingId) || (isUnavailable && !active)}
                              >
                                <span
                                  className={playerReciterAvatarClass(active)}
                                >
                                  {isLoading ? (
                                    <i className="fas fa-spinner fa-spin text-[0.45rem]" />
                                  ) : active ? (
                                    <i className="fas fa-check text-[0.45rem]" />
                                  ) : (
                                    initial
                                  )}
                                </span>
                                <span className="flex min-w-0 flex-col">
                                  <span
                                    className="[font-family:var(--font-ui)] truncate text-[0.68rem] font-semibold leading-tight"
                                  >
                                    {lang === "ar"
                                      ? r.name
                                      : lang === "fr"
                                        ? r.nameFr
                                        : r.nameEn}
                                  </span>
                                  {r.style && (
                                    <span
                                      className="[font-family:var(--font-ui)] truncate text-[0.52rem] uppercase leading-tight tracking-wide text-[rgba(240,234,214,0.35)]"
                                    >
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
                  {memMode && (
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
                              className={cn(playerMutedTextClass, "text-[0.68rem]")}
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

                  {/* -- Options avancées toggle -- */}
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
                      {lang === "fr" ? "Options" : lang === "ar" ? "Options" : "Options"}
                    </span>
                    <i
                      className={`fas fa-chevron-${showAdvanced ? "up" : "down"} text-[0.5rem]`}
                    />
                  </button>
                  {showAdvanced && (
                    <>
                      {/* Suivre le verset récité */}
                      <button
                    onClick={() => set({ karaokeFollow: true })}
                        className={playerCardToggleClass(karaokeFollow)}
                        aria-pressed={karaokeFollow}
                        disabled
                      >
                        <span className="flex items-center gap-2">
                          <i className="fas fa-crosshairs text-[0.6rem]" />
                          {lang === "fr" ? "Suivre le verset récité" : lang === "ar" ? "Follow recited verse" : "Follow recited verse"}
                        </span>
                        <span
                          className={cn(
                            "text-[0.55rem] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide",
                            karaokeFollow
                              ? "bg-[rgba(110,204,233,0.24)] text-[rgba(240,250,255,0.95)]"
                              : "bg-white/8 text-white/40",
                          )}
                        >
                          {karaokeFollow ? "ON" : "OFF"}
                        </span>
                      </button>

                      {/* -- A-B Repeat -- */}
                      <div>
                        <div className={playerSectionLabelClass}>
                          {lang === "fr"
                            ? "Répétition A-B"
                            : lang === "ar"
                              ? "تْرار أ-ب"
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
                          {lang === "fr" ? "Acoustique" : lang === "ar" ? "Acoustics" : "Acoustics"}
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
                              className={playerOptionPillClass(eqPreset === p.id)}
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
                          {lang === "fr" ? "Tartil progressif" : lang === "ar" ? "Progressive Tartil" : "Progressive Tartil"}
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

                      {/* -- Mode récitation (Web Speech API) -- */}
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
                            {reciteResult === "ok" ? "“" : "~"}
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
      {renderOptionsModal()}
    </>
  );
}


