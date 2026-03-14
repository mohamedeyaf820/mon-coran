import React, { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import audioService from "../services/audioService";
import { ensureReciterForRiwaya, getRecitersByRiwaya } from "../data/reciters";
import { getSurah, surahName } from "../data/surahs";
import { cn } from "../lib/utils";
import AudioLoadingIndicator from "./AudioLoadingIndicator";

/* ─────────────────────────────────────────────
   Drag / position helpers  (desktop card only)
───────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────
   Waveform (desktop card)
───────────────────────────────────────────── */
function Waveform({ isPlaying, progress }) {
  const COUNT = 32;
  return (
    <div className="audio-player__waveform flex items-end justify-center gap-0.5 h-8 w-full">
      {Array.from({ length: COUNT }).map((_, i) => {
        const pct = i / COUNT;
        const filled = pct <= progress;
        const seedIndex = (i * 7 + 3) % 13;
        return (
          <div
            key={i}
            className={cn(
              "audio-player__wave-bar min-w-[2px] flex-1 rounded-full origin-bottom",
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

/* ─────────────────────────────────────────────
   Cover Art (desktop card)
───────────────────────────────────────────── */
function CoverArt({ isPlaying, size = 52 }) {
  return (
    <div
      className={cn(
        "audio-player__cover relative overflow-hidden rounded-xl shrink-0 bg-[linear-gradient(135deg,var(--emerald)_0%,#0e3d26_60%,#0a2d1c_100%)]",
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
        <circle cx="26" cy="26" r="20" stroke="#d4a820" strokeWidth="0.6" />
        <circle cx="26" cy="26" r="12" stroke="#d4a820" strokeWidth="0.5" />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * Math.PI * 2) / 8;
          return (
            <line
              key={i}
              x1={26 + Math.cos(a) * 12}
              y1={26 + Math.sin(a) * 12}
              x2={26 + Math.cos(a) * 20}
              y2={26 + Math.sin(a) * 20}
              stroke="#d4a820"
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

/* ─────────────────────────────────────────────
   Icon button (desktop card)
───────────────────────────────────────────── */
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
        "audio-player__icon-btn",
        "flex items-center justify-center rounded-full cursor-pointer outline-none transition-all duration-150",
        active
          ? "bg-[rgba(212,168,32,0.25)] text-[#f5d785] border border-[rgba(212,168,32,0.45)]"
          : "bg-white/[0.07] text-[rgba(240,234,214,0.75)] border border-white/10",
        "hover:bg-[rgba(212,168,32,0.18)] hover:text-[#f5d785] hover:border-[rgba(212,168,32,0.35)] hover:scale-105",
        "active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(212,168,32,0.5)]",
      )}
    >
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════════════
   Main component
═══════════════════════════════════════════════ */
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

  /* ── Fermeture / refs stables pour callbacks ── */
  const [closed, setClosed] = useState(false);
  const currentSurahRef = useRef(null);
  const karaokeFollowRef = useRef(true);

  /* ── A-B Repeat state ── */
  const [abA, setAbA] = useState(null); // { idx, surah, ayah }
  const [abB, setAbB] = useState(null); // { idx, surah, ayah }

  /* ── EQ preset ── */
  const [eqPreset, setEqPreset] = useState("flat");

  /* ── Tartil progressive ── */
  const [tartilMode, setTartilMode] = useState(false);

  /* ── Recitation mode (Web Speech API) ── */
  const [reciteMode, setReciteMode] = useState(false);
  const [reciteText, setReciteText] = useState("");
  const [reciteResult, setReciteResult] = useState(null); // 'ok'|'partial'|'wrong'|null
  const reciteRecogRef = useRef(null);

  const progressRef = useRef(null);
  const audioErrorTimerRef = useRef(null);

  /* ── Detect mobile ── */
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

  /* ── Wire audio callbacks ── */
  useEffect(() => {
    audioService.onPlay = (item) => {
      setClosed(false); // réouvre si fermé
      setAudioError(null);
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
    audioService.onError = () => {
      set({ isPlaying: false });
      setNetworkState("error");
      if (audioErrorTimerRef.current) {
        clearTimeout(audioErrorTimerRef.current);
      }
      const msg =
        riwaya === "warsh"
          ? lang === "fr"
            ? "Audio Warsh indisponible. Vérifiez votre connexion ou changez de récitateur."
            : lang === "ar"
              ? "الصوت غير متاح. تحقق من الاتصال أو غيّر القارئ."
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
  }, [set, lang, riwaya]);

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

  /* ── Map internal networkState → AudioLoadingIndicator state ── */
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
    if (memMode)
      audioService.enableMemorization(memRepeatCount, memPause * 1000);
    else audioService.disableMemorization();
  }, [memMode, memRepeatCount, memPause]);

  /* ── A-B Repeat handlers ── */
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

  /* ── EQ preset handler ── */
  const handleEq = useCallback((preset) => {
    setEqPreset(preset);
    audioService.applyEqPreset(preset);
  }, []);

  /* ── Tartil toggle ── */
  const toggleTartil = useCallback(() => {
    const next = !tartilMode;
    setTartilMode(next);
    audioService.setTartilMode(next, audioSpeed);
  }, [tartilMode, audioSpeed]);

  /* ── Recitation mode ── */
  const startRecite = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert(
        lang === "fr"
          ? "Reconnaissance vocale non disponible sur ce navigateur."
          : "Speech recognition not available.",
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

  /* ── Controls ── */
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

  /* ── Progress bar drag support ── */
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
    setMinimized((prev) => !prev);
  }, []);

  const closePlayer = useCallback(() => {
    audioService.stop();
    setMinimized(false);
    set({ playerMinimized: false });
    setClosed(true);
  }, [set]);

  const currentReciters = getRecitersByRiwaya(riwaya);
  const isWarshMode = riwaya === "warsh";

  /* ── Reciter search ── */
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

  const { currentSurah } = state;
  currentSurahRef.current = currentSurah;
  karaokeFollowRef.current = karaokeFollow ?? true;
  const surahMeta = getSurah(currentSurah);
  const currentSurahName = surahMeta ? surahName(currentSurah, lang) : "";
  const currentArabicName = surahMeta?.ar || "";

  const reciterObj = currentReciters.find((r) => r.id === reciter);
  const isHomeDesktop = showHome && !isMobile;
  const isContextualDesktop = !isMobile && !showHome;
  const isReadingDesktop = isContextualDesktop && !showDuas;
  const reciterLabel =
    lang === "ar"
      ? reciterObj?.name
      : lang === "fr"
        ? reciterObj?.nameFr
        : reciterObj?.nameEn;

  const titleLabel = currentPlayingAyah
    ? `${t("quran.surah", lang)} ${currentPlayingAyah.surah}:${currentPlayingAyah.ayah}`
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
    if (!currentPlayingAyah) return "";
    const fromPlaylist = audioService.playlist?.find(
      (p) =>
        p.surah === currentPlayingAyah.surah && p.ayah === currentPlayingAyah.ayah,
    )?.text;
    return normalizeAyahText(fromPlaylist);
  })();
  const currentAyahPreview =
    currentAyahText.length > 180
      ? `${currentAyahText.slice(0, 180).trim()}…`
      : currentAyahText;

  // Subtitle shown in the desktop card when nothing is playing
  const idleSubtitle =
    !isPlaying && !currentPlayingAyah
      ? showHome
        ? lang === "ar"
          ? "اضغط ▶ للاستماع"
          : lang === "fr"
            ? "Appuyez ▶ pour écouter"
            : "Press ▶ to listen"
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
      ? "صوت ورش مُتحقق"
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
      label: `${currentPlayingAyah.surah}:${currentPlayingAyah.ayah}`,
    },
    audioSpeed !== 1 && { key: "speed", label: `${audioSpeed}x` },
    memMode && { key: "memorize", label: memorizeShortLabel },
    karaokeFollow && { key: "follow", label: followShortLabel },
  ].filter(Boolean);

  /* ─── Shared button classes (mobile bar) ─── */
  const mBarBtn = cn(
    "w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer outline-none",
    "border border-white/10 bg-white/[0.06] text-[rgba(240,234,214,0.8)] text-[0.85rem]",
    "transition-all duration-150",
    "hover:bg-[rgba(212,168,32,0.18)] hover:text-[#f5d785] hover:border-[rgba(212,168,32,0.35)]",
    "active:scale-95 focus-visible:outline-none",
  );
  const mBarBtnSm = (active = false) =>
    cn(
      "px-[0.55rem] py-[0.24rem] min-h-[28px] flex items-center justify-center",
      "rounded-md border text-[0.71rem] font-semibold cursor-pointer outline-none whitespace-nowrap",
      "transition-all duration-150",
      active
        ? "bg-[rgba(212,168,32,0.28)] text-[#f5d785] border-[rgba(212,168,32,0.5)]"
        : "bg-white/[0.05] text-[rgba(240,234,214,0.7)] border-white/10 hover:bg-[rgba(212,168,32,0.15)] hover:text-[#f5d785] hover:border-[rgba(212,168,32,0.28)]",
      "focus-visible:outline-none",
    );
  const playerBadgeClass =
    "inline-flex items-center gap-1.5 rounded-full border border-[var(--player-chip-border)] bg-[var(--player-chip-bg)] text-[var(--player-chip-text)] [font-family:var(--font-ui)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";
  const playerSectionLabelClass =
    "mb-1.5 text-[0.58rem] font-bold uppercase tracking-widest text-[rgba(212,168,32,0.5)] [font-family:var(--font-ui)]";
  const playerMutedTextClass =
    "text-[rgba(240,234,214,0.7)] [font-family:var(--font-ui)]";
  const playerSearchInputClass =
    "audio-player__search-input w-full rounded-lg border border-white/10 bg-white/[0.06] py-1 pl-6 pr-2 text-[0.62rem] text-[rgba(240,234,214,0.85)] outline-none [font-family:var(--font-ui)]";
  const playerNumberInputClass =
    "audio-player__number-input w-12 rounded-lg border border-[rgba(212,168,32,0.2)] bg-white/[0.07] px-1.5 py-1 text-center text-[0.72rem] text-[rgba(253,243,213,0.9)] outline-none [font-family:var(--font-ui)]";
  const playerCardToggleClass = (active = false) =>
    cn(
      "flex items-center justify-between gap-2 rounded-xl border px-3 py-1.5 text-[0.7rem] font-semibold transition-all duration-150 [font-family:var(--font-ui)]",
      active
        ? "border-[rgba(212,168,32,0.3)] bg-[rgba(212,168,32,0.12)] text-[#f5d785]"
        : "border-white/10 bg-white/[0.05] text-[rgba(240,234,214,0.6)]",
    );
  const playerOptionPillClass = (active = false) =>
    cn(
      "rounded-md border px-1.5 py-0.75 text-[0.6rem] font-semibold transition-all [font-family:var(--font-ui)]",
      active
        ? "border-[rgba(212,168,32,0.45)] bg-[rgba(212,168,32,0.2)] text-[#f5d785]"
        : "border-white/10 bg-white/[0.05] text-[rgba(240,234,214,0.6)]",
    );
  const playerAbButtonClass = (active = false) =>
    cn(
      "rounded-lg border px-2 py-0.75 text-[0.65rem] font-bold transition-all [font-family:var(--font-ui)]",
      active
        ? "border-[rgba(212,168,32,0.45)] bg-[rgba(212,168,32,0.2)] text-[#f5d785]"
        : "border-white/10 bg-white/[0.06] text-[rgba(240,234,214,0.6)]",
    );
  const playerUtilityClass =
    "audio-player__utility flex items-center justify-center rounded-md text-[rgba(240,234,214,0.5)] transition-colors hover:bg-white/10";
  const playerStrongTextClass =
    "text-[var(--player-text-strong)] [font-family:var(--font-ui)]";
  const playerSubtitleTextClass =
    "text-[var(--player-text-soft)] [font-family:var(--font-ui)]";
  const playerGoldMetaClass =
    "text-[rgba(212,168,32,0.55)] [font-family:var(--font-ui)]";
  const playerFadedTextClass =
    "text-[rgba(240,234,214,0.35)] [font-family:var(--font-ui)]";
  const playerSurfaceButtonClass =
    "rounded-xl border border-white/10 bg-white/[0.05] text-[rgba(240,234,214,0.6)] transition-all duration-150 [font-family:var(--font-ui)] hover:border-[rgba(212,168,32,0.2)] hover:text-[#f5d785]";
  const playerReciterButtonClass = (active = false, isLoading = false) =>
    cn(
      "player-reciter-btn",
      active
        ? "border-[rgba(212,168,32,0.38)] bg-[rgba(27,94,59,0.35)] text-[#fbf3d5]"
        : "border-white/7 bg-white/[0.04] text-[rgba(240,234,214,0.65)]",
      isLoading && "animate-pulse",
    );
  const playerReciterAvatarClass = (active = false) =>
    cn(
      "player-reciter-avatar",
      active
        ? "bg-[rgba(212,168,32,0.25)] text-[var(--gold-bright)]"
        : "bg-white/[0.07] text-[rgba(240,234,214,0.4)]",
    );

  /* ── Drag state (desktop card only) ── */
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
        target.closest(".player-expanded-section") ||
        target.closest(".audio-player__details") ||
        target.closest(".player-reciter-scroll")
      )
        return;

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
    ? "shadow-[0_18px_50px_rgba(11,20,15,0.22),0_0_0_1px_rgba(192,154,74,0.18),0_2px_8px_rgba(109,85,26,0.08)]"
    : "shadow-[0_14px_42px_rgba(11,20,15,0.16),0_0_0_1px_rgba(255,255,255,0.05)]";

  if (closed) return null;

  /* ══════════════════════════════════════════
     MOBILE — classic bottom bar
  ══════════════════════════════════════════ */
  if (isMobile) {
    if (minimized) {
      return (
        <div
          className="audio-player audio-player--mobile audio-player--mini !fixed bottom-3 left-3 right-3 z-300 overflow-hidden rounded-2xl border border-[var(--player-border)] bg-[var(--player-glass)] text-[#f0ead6] shadow-[0_14px_34px_rgba(12,18,14,0.2)]"
          role="region"
          aria-label={
            lang === "ar"
              ? "مشغل الصوت المصغر"
              : lang === "fr"
                ? "Lecteur audio reduit"
                : "Minimized audio player"
          }
        >
          <div className="audio-player__mini-progress h-0.75 bg-white/8">
            <ProgressRail progress={progress} />
          </div>
          <div className="audio-player__mini-shell flex items-center gap-3 px-3 py-2.5">
            <CoverArt isPlaying={isPlaying} size={40} />
            <div className="audio-player__status flex-1 min-w-0">
              <div className="audio-player__status-title text-[0.74rem] font-semibold leading-tight truncate text-white/90">
                {titleLabel ||
                  (lang === "fr"
                    ? "Pret a lire"
                    : lang === "ar"
                      ? "جاهز"
                      : "Ready")}
              </div>
              <div className="audio-player__status-subtitle text-[0.6rem] truncate text-white/45">
                {reciterLabel || "-"}
              </div>
            </div>
            <button
              className="audio-player__play audio-player__play--mini w-10 h-10 flex items-center justify-center rounded-full bg-white text-[#0e3d26] text-[0.88rem] border-none cursor-pointer shadow-lg transition-all duration-150"
              onClick={toggle}
              title={isPlaying ? t("audio.pause", lang) : t("audio.play", lang)}
              aria-pressed={isPlaying}
            >
              <i className={`fas ${isPlaying ? "fa-pause" : "fa-play"}`} />
            </button>
            <button
              className={cn(
                "audio-player__utility",
                mBarBtn,
                "w-8 h-8 text-[0.72rem] rounded-lg shrink-0",
              )}
              onClick={toggleMinimized}
              title={
                lang === "fr" ? "Agrandir" : lang === "ar" ? "تكبير" : "Expand"
              }
            >
              <i className="fas fa-up-right-and-down-left-from-center" />
            </button>
            <button
              className={cn(
                "audio-player__utility",
                mBarBtn,
                "w-8 h-8 text-[0.72rem] rounded-lg shrink-0",
              )}
              onClick={closePlayer}
              title={
                lang === "fr" ? "Fermer" : lang === "ar" ? "إغلاق" : "Close"
              }
            >
              <i className="fas fa-xmark" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        className={cn(
          "audio-player audio-player--mobile audio-player--sheet !fixed bottom-0 left-0 right-0 z-300 rounded-t-2xl border-t border-[var(--player-border)] bg-[var(--player-glass)] text-[#f0ead6]",
          expanded ? "is-expanded" : "is-collapsed",
          expanded
            ? "shadow-[0_-18px_50px_rgba(12,18,14,0.2),0_-1px_0_rgba(255,255,255,0.05)]"
            : "shadow-[0_-10px_32px_rgba(12,18,14,0.14),0_-1px_0_rgba(255,255,255,0.04)]",
        )}
        role="region"
        aria-label={
          lang === "ar"
            ? "مشغل الصوت"
            : lang === "fr"
              ? "Lecteur Audio"
              : "Audio Player"
        }
      >
        {networkBadge && (
          <div className="px-3 pt-1.5">
            <div
              className={cn(
                "audio-player__network-badge px-2 py-0.75 text-[0.62rem] font-semibold",
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
          className={`audio-player__progress relative cursor-pointer overflow-visible rounded-t-2xl bg-white/10 h-0.75 hover:h-1.25 transition-[height] duration-150 player-progress${progressDragging ? " dragging" : ""}`}
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
        <div className="audio-player__mobile-bar flex items-center px-3 gap-2 min-h-15.5">
          {/* Left: info block */}
          <div
            className="audio-player__status flex flex-col justify-center gap-[0.15rem] min-w-0 w-22 shrink-0"
            aria-live="polite"
          >
            <span className="audio-player__status-title block text-[0.7rem] text-white/88 whitespace-nowrap overflow-hidden text-ellipsis font-semibold leading-tight">
              {currentPlayingAyah
                ? `${t("quran.surah", lang)} ${currentPlayingAyah.surah}:${currentPlayingAyah.ayah}`
                : lang === "fr"
                  ? "En attente"
                  : lang === "ar"
                      ? "جاهز"
                      : "Ready"}
            </span>
            <span className="audio-player__status-subtitle text-[0.6rem] text-white/40 font-mono tabular-nums leading-none">
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
          <div className="audio-player__cluster flex-1 flex items-center justify-center gap-1">
            <button
              className={cn(
                mBarBtn,
                "w-8 h-8 text-[0.72rem] rounded-lg shrink-0",
              )}
              onClick={prev}
              title={t("audio.prev", lang)}
            >
              <i className="fas fa-backward-step" />
            </button>

            <button
              className="audio-player__play audio-player__play--mobile w-10 h-10 flex items-center justify-center rounded-full bg-white text-[#0e3d26] text-[0.9rem] border-none cursor-pointer shadow-lg transition-all duration-150 hover:scale-[1.06] active:scale-[0.94] shrink-0"
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
                "w-8 h-8 text-[0.72rem] rounded-lg shrink-0",
              )}
              onClick={next}
              title={t("audio.next", lang)}
            >
              <i className="fas fa-forward-step" />
            </button>

            <button
              className={cn(
                mBarBtn,
                "w-8 h-8 text-[0.72rem] rounded-lg shrink-0",
              )}
              onClick={stop}
              title={t("audio.stop", lang)}
            >
              <i className="fas fa-stop" />
            </button>
          </div>

          {/* Right: secondary controls */}
          <div className="audio-player__secondary flex items-center gap-1 shrink-0">
            <button
              className={cn(
                "audio-player__speed",
                mBarBtnSm(),
                "px-[0.4rem] py-[0.22rem] text-[0.64rem] min-h-6.5 min-w-7.5 justify-center",
              )}
              onClick={cycleSpeed}
              title={
                lang === "fr" ? "Vitesse" : lang === "ar" ? "السرعة" : "Speed"
              }
            >
              {audioSpeed}x
            </button>
            <button
              className={cn(
                mBarBtnSm(memMode),
                "px-[0.4rem] py-[0.22rem] text-[0.64rem] min-h-6.5 min-w-6.5 justify-center",
              )}
              onClick={() => set({ memMode: !memMode })}
              title={t("audio.memorization", lang)}
              aria-pressed={memMode}
            >
              <i className="fas fa-repeat" />
            </button>
            <button
              className={cn(
                "audio-player__expand",
                mBarBtnSm(expanded),
                "px-[0.4rem] py-[0.22rem] text-[0.64rem] min-h-6.5 min-w-6.5 justify-center",
              )}
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              title={
                expanded
                  ? lang === "fr"
                    ? "Réduire"
                    : lang === "ar"
                      ? "إغلاق"
                      : "Collapse"
                  : lang === "fr"
                    ? "Plus"
                    : lang === "ar"
                      ? "المزيد"
                      : "More"
              }
            >
              <i className={`fas fa-chevron-${expanded ? "down" : "up"}`} />
            </button>
          </div>
        </div>

        {/* Expanded panel */}
        {expanded && (
          <div
            className="audio-player__details player-expanded-section max-h-[62vh] overflow-y-auto border-t border-white/[0.07] bg-[var(--player-panel-bg)] px-3.5 pt-3 pb-4 animate-[fadeInUp_0.18s_var(--ease,ease)]"
          >
            {/* Inline audio error */}
            {audioError && (
              <div className="player-error-inline mb-3">
                <i className="fas fa-exclamation-circle shrink-0" />
                <span className="truncate">{audioError}</span>
                <button
                  className="player-error-retry-btn"
                  onClick={toggle}
                  title={
                    lang === "fr"
                      ? "Réessayer"
                      : lang === "ar"
                        ? "إعادة المحاولة"
                        : "Retry"
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
                    "inline-flex items-center px-2 py-0.75 rounded-full text-[0.6rem] font-bold border whitespace-nowrap",
                    warshStrictMode
                      ? "bg-[rgba(212,168,32,0.14)] text-[#f5d785] border-[rgba(212,168,32,0.3)]"
                      : "bg-white/[0.07] text-white/50 border-white/10",
                  )}
                >
                  {warshStrictMode ? warshStrictLabel : warshNonStrictLabel}
                </span>
                {warshStrictMode && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.75 rounded-full text-[0.6rem] font-bold border bg-[rgba(212,168,32,0.14)] text-[#f5d785] border-[rgba(212,168,32,0.3)]">
                    <i className="fas fa-check text-[0.48rem]" />
                    {warshVerifiedLabel}
                  </span>
                )}
              </div>
            )}

            {/* Reciter section */}
            <div className="mb-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[0.6rem] font-bold uppercase tracking-widest text-[rgba(240,234,214,0.35)]">
                  {t("audio.reciter", lang)}
                </span>
                <span
                  className="text-[0.56rem] font-semibold tabular-nums text-[rgba(212,168,32,0.55)]"
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
                        ? "بحث…"
                        : lang === "fr"
                          ? "Rechercher…"
                          : "Search…"
                    }
                    className={playerSearchInputClass}
                  />
                  {reciterSearch && (
                    <button
                      onClick={() => setReciterSearch("")}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[0.45rem] text-[rgba(240,234,214,0.35)]"
                    >
                      <i className="fas fa-xmark" />
                    </button>
                  )}
                </div>
              )}
              <div className="player-reciter-scroll">
                {filteredReciters.length === 0 ? (
                  <div
                    className="py-2 text-center text-[0.62rem] text-[rgba(240,234,214,0.35)] [font-family:var(--font-ui)]"
                  >
                    {lang === "fr"
                      ? "Aucun résultat"
                      : lang === "ar"
                        ? "لا نتائج"
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
                      const isLoading = active && networkState === "loading";
                      const initial = (r.nameEn ||
                        r.name ||
                        "?")[0].toUpperCase();
                      return (
                        <button
                          key={r.id}
                          onClick={() => set({ reciter: r.id })}
                          className={cn(
                            `player-reciter-btn${isLoading ? " loading" : ""}`,
                            active
                              ? "border-[rgba(212,168,32,0.45)] bg-[rgba(212,168,32,0.16)] text-[#f5d785]"
                              : "border-white/10 bg-white/[0.04] text-[rgba(240,234,214,0.7)]",
                          )}
                          aria-pressed={active}
                        >
                          <span
                            className={cn(
                              "player-reciter-avatar",
                              active
                                ? "bg-[rgba(212,168,32,0.25)] text-[#d4a820]"
                                : "bg-white/[0.07] text-[rgba(240,234,214,0.45)]",
                            )}
                          >
                            {isLoading ? (
                              <i className="fas fa-spinner fa-spin text-[0.45rem]" />
                            ) : active ? (
                              <i className="fas fa-check text-[0.45rem]" />
                            ) : (
                              initial
                            )}
                          </span>
                          <span className="flex flex-col min-w-0">
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
                              <span
                                className={`reciter-cdn-badge ${r.cdnType}`}
                              >
                                {r.cdnType === "islamic"
                                  ? "Islamic CDN"
                                  : "EveryAyah CDN"}
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
            <div className="audio-player__volume flex items-center gap-2 mt-2.5 px-0.5">
              <button
                onClick={() => handleVolumeChange(volume > 0 ? 0 : 1)}
                className="h-6 w-6 shrink-0 rounded-md text-[0.72rem] text-[rgba(212,168,32,0.6)] transition-colors duration-150"
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
                        ? "تشغيل"
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
                className="audio-player__slider h-0.75 flex-1 cursor-pointer rounded-full"
              />
              <span
                className="w-6 shrink-0 text-right text-[0.58rem] font-semibold tabular-nums text-[rgba(212,168,32,0.45)] [font-family:var(--font-ui)]"
              >
                {Math.round(volume * 100)}%
              </span>
            </div>

            {/* Memorization settings */}
            {memMode && (
              <div className="mt-2.5">
                <span className="text-[0.6rem] font-bold uppercase tracking-widest text-[rgba(240,234,214,0.35)]">
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
            <div className="audio-player__cta-row flex items-center gap-2 mt-2.5">
              <button
                className={cn(
                  mBarBtnSm(karaokeFollow),
                  "flex-1 gap-1.5 justify-center",
                )}
                onClick={() => set({ karaokeFollow: !karaokeFollow })}
                aria-pressed={karaokeFollow}
                title={
                  lang === "fr" ? "Suivre le verset récité" : "Follow verse"
                }
              >
                <i className="fas fa-location-crosshairs text-[0.6rem]" />
                {lang === "fr" ? "Suivre" : lang === "ar" ? "تتبع" : "Follow"}
              </button>
              <button
                className={cn(mBarBtnSm(), "flex-1 gap-1.5 justify-center")}
                onClick={closePlayer}
                title={lang === "fr" ? "Fermer le lecteur" : "Close player"}
              >
                <i className="fas fa-xmark text-[0.6rem]" />
                {lang === "fr" ? "Fermer" : lang === "ar" ? "إغلاق" : "Close"}
              </button>
            </div>

            {/* ── Options avancées toggle (mobile) ── */}
            <div className="mt-2 mb-0.5">
              <button
                onClick={() => setShowAdvanced((v) => !v)}
                className={cn(
                  "audio-player__advanced-toggle flex w-full items-center justify-between rounded-lg py-1 px-2 text-[0.58rem] font-bold uppercase tracking-widest text-[rgba(240,234,214,0.35)] transition-all [font-family:var(--font-ui)]",
                  showAdvanced
                    ? "border border-[rgba(212,168,32,0.18)] bg-[rgba(212,168,32,0.07)]"
                    : "border border-white/[0.07] bg-transparent",
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
                {/* ── A-B Repeat (mobile) ── */}
                <div className="mt-2.5">
                  <div
                    className="mb-1 text-[0.56rem] font-bold uppercase tracking-widest text-[rgba(212,168,32,0.5)]"
                  >
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
                        disabled={!currentPlayingAyah}
                      >
                        {val ? `${lbl}: ${val.surah}:${val.ayah}` : lbl}
                      </button>
                    ))}
                    {(abA || abB) && (
                      <button
                        onClick={clearAb}
                        className={cn(mBarBtnSm(), "px-2 py-1")}
                      >
                        <i className="fas fa-xmark" />
                      </button>
                    )}
                  </div>
                </div>

                {/* ── EQ presets (mobile) ── */}
                <div className="mt-2.5">
                  <div
                    className="mb-1 text-[0.56rem] font-bold uppercase tracking-widest text-[rgba(212,168,32,0.5)]"
                  >
                    {lang === "fr"
                      ? "Acoustique"
                      : lang === "ar"
                        ? "الصوتيات"
                        : "Acoustics"}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { id: "flat", fr: "Plat", ar: "عادي", en: "Flat" },
                      { id: "bass", fr: "Graves", ar: "جهير", en: "Bass" },
                      { id: "treble", fr: "Aigus", ar: "حاد", en: "Treble" },
                      { id: "near", fr: "Proche", ar: "قريب", en: "Near" },
                      { id: "hall", fr: "Salle", ar: "قاعة", en: "Hall" },
                      { id: "vocals", fr: "Voix", ar: "صوتي", en: "Vocals" },
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

                {/* ── Tartil + Récitation (mobile) ── */}
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
                      reciteMode && "border-[rgba(34,197,94,0.4)] text-[#86efac]",
                      "flex-1 gap-1 justify-center",
                    )}
                  >
                    <i
                      className={`fas ${reciteMode ? "fa-stop" : "fa-microphone"} text-[0.6rem]`}
                    />
                    {lang === "fr"
                      ? "Réciter"
                      : lang === "ar"
                        ? "تلاوة"
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
          </div>
        )}
      </div>
    );
  }

  /* ══════════════════════════════════════════
     DESKTOP — floating music card
  ══════════════════════════════════════════ */
  return (
    <>
      {/* Audio error banner */}
      {audioError && (
        <div
          className="pointer-events-none fixed left-1/2 top-[72px] z-400 flex max-w-[340px] -translate-x-1/2 items-center gap-2 rounded-xl bg-[rgba(180,30,30,0.93)] px-[18px] py-[10px] text-center text-[13px] text-white shadow-[0_4px_20px_rgba(0,0,0,0.4)] animate-[slideDownFade_0.25s_var(--ease,ease)]"
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
          "audio-player audio-player--desktop !fixed z-300 flex flex-col overflow-hidden select-none touch-auto border border-[var(--player-border)] bg-[var(--player-glass)]",
          isContextualDesktop &&
            !manualDockPosition &&
            "audio-player--reading-dock",
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
            ? "مشغل الصوت"
            : lang === "fr"
              ? "Lecteur Audio"
              : "Audio Player"
        }
      >
        {minimized && !isHomeDesktop ? (
          <>
            <div
              className="audio-player__mini-shell flex items-center gap-3 px-3.5 pt-3 pb-2.5"
              data-player-drag="true"
            >
              <CoverArt isPlaying={isPlaying} size={42} />
              <div className="audio-player__status flex-1 min-w-0">
                {networkBadge && (
                  <div
                    className={cn(
                      playerBadgeClass,
                      "audio-player__network-badge mb-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[0.54rem] font-bold",
                    )}
                  >
                    <i className={`fas ${networkBadge.icon}`} />
                    <span>{networkBadge.text}</span>
                  </div>
                )}
                <div
                  className={cn(
                    playerStrongTextClass,
                    "audio-player__status-title truncate text-[0.76rem] font-bold leading-tight",
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
                    "audio-player__status-subtitle mt-0.5 truncate text-[0.62rem]",
                  )}
                >
                  {reciterLabel || idleSubtitle || "-"}
                </div>
                {currentAyahPreview && (
                  <div
                    className="audio-player__status-ayah mt-0.75 overflow-hidden text-[0.57rem] leading-relaxed text-[rgba(240,234,214,0.7)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:1]"
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
                className="audio-player__play audio-player__play--mini flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(192,154,74,0.28)] bg-[linear-gradient(135deg,var(--player-accent)_0%,var(--player-accent-deep)_100%)] text-[#fbf7ea] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(212,168,32,0.5)]"
              >
                <i className={`fas ${isPlaying ? "fa-pause" : "fa-play"}`} />
              </button>
              <IconBtn
                onClick={toggleMinimized}
                title={
                  lang === "fr"
                    ? "Agrandir"
                    : lang === "ar"
                      ? "تكبير"
                      : "Expand"
                }
                size="sm"
              >
                <i className="fas fa-up-right-and-down-left-from-center" />
              </IconBtn>
              <IconBtn
                onClick={closePlayer}
                title={
                  lang === "fr" ? "Fermer" : lang === "ar" ? "إغلاق" : "Close"
                }
                size="sm"
              >
                <i className="fas fa-xmark" />
              </IconBtn>
            </div>
            <div className="px-3.5 pb-3">
              <div className="audio-player__mini-progress relative h-0.75 overflow-hidden rounded-full">
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
                    "audio-player__network-badge inline-flex items-center gap-1.5 rounded-full px-2 py-0.75 text-[0.6rem] font-bold",
                  )}
                >
                  <i className={`fas ${networkBadge.icon}`} />
                  <span>{networkBadge.text}</span>
                </div>
              </div>
            )}
            {/* Drag handle + minimize button */}
            <div
              className="audio-player__chrome flex justify-between items-center pt-2.5 pb-1 px-4 shrink-0"
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
              <div className="flex items-center gap-1.5">
                <div className="audio-player__drag-handle h-0.75 w-7 rounded-full bg-white/20" />
                <span className="text-[0.52rem] uppercase tracking-[0.16em] text-white/35 [font-family:var(--font-ui)]">
                  drag
                </span>
              </div>
              <button
                onClick={closePlayer}
                className={cn(playerUtilityClass, "h-6 w-6")}
                title={
                  lang === "fr"
                    ? "Fermer le lecteur"
                    : lang === "ar"
                      ? "إغلاق"
                      : "Close player"
                }
              >
                <i className="fas fa-xmark text-xs" />
              </button>
            </div>

            <div className="audio-player__panel-body px-4 pb-4 pt-1 flex flex-col gap-3">
              {/* Top row: cover + info */}
              <div className="audio-player__hero flex items-center gap-3">
                <CoverArt isPlaying={isPlaying} />
                <div className="audio-player__status flex-1 min-w-0">
                  {/* Arabic surah name — prominent header */}
                  {currentArabicName && (
                    <div
                      className="audio-player__arabic-title mb-0.5 truncate text-[1.05rem] font-bold leading-tight text-[var(--gold-bright,#d4a820)] drop-shadow-[0_1px_6px_rgba(184,134,11,0.3)] [font-family:var(--font-quran,serif)] tracking-[0.02em]"
                      dir="rtl"
                      lang="ar"
                    >
                      {currentArabicName}
                    </div>
                  )}
                  <div
                    className={cn(
                      playerStrongTextClass,
                      "audio-player__title truncate text-[0.82rem] font-bold leading-tight",
                    )}
                  >
                    {titleLabel ||
                      (lang === "fr"
                        ? "Prêt à lire"
                        : lang === "ar"
                          ? "جاهز"
                          : "Ready")}
                  </div>
                  <div
                    className={cn(
                      playerSubtitleTextClass,
                      "audio-player__subtitle mt-0.5 truncate text-[0.67rem]",
                    )}
                  >
                    {idleSubtitle || reciterLabel || "—"}
                  </div>
                  {currentAyahPreview && (
                    <p
                      className={cn(
                        "audio-player__ayah-preview mt-1 overflow-hidden rounded-lg border border-[rgba(212,168,32,0.18)] bg-[rgba(212,168,32,0.08)] px-2 py-1 text-[0.66rem] leading-relaxed text-[rgba(255,244,211,0.92)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]",
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
                      Warsh ✓
                    </span>
                  )}
                  <AudioLoadingIndicator
                    state={audioIndicatorState}
                    isPlaying={isPlaying}
                    errorMessage={audioError}
                  />
                  {isContextualDesktop && dockedMetaChips.length > 0 && (
                    <div className="audio-player__meta-strip">
                      {dockedMetaChips.map((chip) => (
                        <span
                          key={chip.key}
                          className={cn(
                            "audio-player__meta-chip",
                            chip.accent && "audio-player__meta-chip--accent",
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
                    onClick={() => set({ karaokeFollow: !karaokeFollow })}
                    title={
                      karaokeFollow
                        ? lang === "fr"
                          ? "Suivi ON — clic pour désactiver"
                          : "Follow ON"
                        : lang === "fr"
                          ? "Suivi OFF — clic pour activer"
                          : "Follow OFF"
                    }
                    active={karaokeFollow}
                    size="sm"
                  >
                    <i className="fas fa-location-crosshairs" />
                  </IconBtn>
                  {isContextualDesktop && manualDockPosition && (
                    <IconBtn
                      onClick={resetDockPosition}
                      title={
                        lang === "fr"
                          ? "Revenir au dock"
                          : lang === "ar"
                            ? "العودة للمكان الثابت"
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
              <div className="audio-player__timeline flex flex-col gap-1">
                <div
                  ref={progressRef}
                  onClick={handleSeek}
                  onMouseDown={handleProgressMouseDown}
                  className={`audio-player__progress relative h-0.75 cursor-pointer overflow-visible rounded-full group player-progress${progressDragging ? " dragging" : ""}`}
                  role="progressbar"
                  aria-valuenow={Math.round(progress * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <ProgressRail progress={progress} showThumb />
                </div>
                <div
                  className="flex justify-between text-[0.6rem] font-mono text-[rgba(212,168,32,0.55)]"
                >
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Main controls */}
              <div className="audio-player__primary-controls flex items-center justify-between">
                {/* Speed */}
                <button
                  onClick={cycleSpeed}
                  className={cn(
                    playerBadgeClass,
                    "audio-player__speed rounded-md px-2 py-0.75 text-[0.62rem] font-bold transition-all duration-150",
                  )}
                  title="Vitesse"
                >
                  {audioSpeed}x
                </button>

                <IconBtn onClick={prev} title={t("audio.prev", lang)}>
                  <i className="fas fa-backward-step" />
                </IconBtn>

                {/* Play / Pause */}
                <button
                  onClick={toggle}
                  title={
                    isPlaying ? t("audio.pause", lang) : t("audio.play", lang)
                  }
                  aria-pressed={isPlaying}
                  className={cn(
                    "audio-player__play audio-player__play--desktop flex h-12 w-12 items-center justify-center rounded-full border-[1.5px] border-[rgba(192,154,74,0.32)] text-[1.05rem] text-[#fbf7ea] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(212,168,32,0.5)]",
                    isPlaying
                      ? "scale-[1.04] bg-[linear-gradient(135deg,var(--player-accent-strong)_0%,var(--player-accent)_100%)] shadow-[0_10px_26px_rgba(28,76,53,0.28),0_1px_4px_rgba(0,0,0,0.14)]"
                      : "bg-[linear-gradient(135deg,var(--player-accent)_0%,var(--player-accent-deep)_100%)] shadow-[0_6px_16px_rgba(0,0,0,0.18)]",
                  )}
                >
                  <i className={`fas ${isPlaying ? "fa-pause" : "fa-play"}`} />
                </button>

                <IconBtn onClick={next} title={t("audio.next", lang)}>
                  <i className="fas fa-forward-step" />
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
              <div className="audio-player__volume flex items-center gap-2">
                <button
                  onClick={() => handleVolumeChange(volume > 0 ? 0 : 1)}
                  className="shrink-0 text-[0.72rem] text-[rgba(212,168,32,0.6)] transition-colors duration-150"
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
                  className="audio-player__slider flex-1 h-0.75 rounded-full cursor-pointer"
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
                onClick={() => setExpanded((v) => !v)}
                className="audio-player__expand flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/8 bg-[var(--player-panel-bg)] py-1.5 text-[0.63rem] text-[rgba(240,234,214,0.52)] transition-all duration-150 [font-family:var(--font-ui)]"
              >
                <i
                  className={`fas fa-chevron-${expanded ? "up" : "down"} text-[0.55rem]`}
                />
                {expanded
                  ? lang === "fr"
                    ? "Réduire"
                    : lang === "ar"
                      ? "إغلاق"
                      : "Collapse"
                  : lang === "fr"
                    ? "Plus d'options"
                    : lang === "ar"
                      ? "المزيد"
                      : "More"}
              </button>

              {/* Expanded panel */}
              {expanded && (
                <div
                  className="audio-player__details player-expanded-section flex max-h-[calc(100vh-270px)] flex-col gap-3 overflow-y-auto border-t border-[rgba(192,154,74,0.12)] pt-3 pr-[0.15rem] animate-[fadeInUp_0.18s_var(--ease,ease)]"
                >
                  {/* Inline audio error */}
                  {audioError && (
                    <div className="player-error-inline mb-3">
                      <i className="fas fa-exclamation-circle shrink-0" />
                      <span className="truncate">{audioError}</span>
                      <button
                        className="player-error-retry-btn"
                        onClick={toggle}
                        title={
                          lang === "fr"
                            ? "Réessayer"
                            : lang === "ar"
                              ? "إعادة المحاولة"
                              : "Retry"
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
                        className="text-[0.56rem] font-semibold tabular-nums text-[rgba(212,168,32,0.55)]"
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
                              ? "بحث…"
                              : lang === "fr"
                                ? "Rechercher…"
                                : "Search…"
                          }
                          className={playerSearchInputClass}
                        />
                        {reciterSearch && (
                          <button
                            onClick={() => setReciterSearch("")}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[0.45rem] text-[rgba(240,234,214,0.35)]"
                          >
                            <i className="fas fa-xmark" />
                          </button>
                        )}
                      </div>
                    )}
                    <div className="player-reciter-scroll">
                      {filteredReciters.length === 0 ? (
                        <div
                          className={cn(
                            playerFadedTextClass,
                            "py-3 text-center text-[0.62rem]",
                          )}
                        >
                          {lang === "fr"
                            ? "Aucun résultat"
                            : lang === "ar"
                              ? "لا نتائج"
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
                              active && networkState === "loading";
                            const initial = (r.nameEn ||
                              r.name ||
                              "?")[0].toUpperCase();
                            return (
                              <button
                                key={r.id}
                                onClick={() => set({ reciter: r.id })}
                                className={playerReciterButtonClass(active, isLoading)}
                                aria-pressed={active}
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
                                <span className="flex flex-col min-w-0">
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
                                    <span
                                      className={`reciter-cdn-badge ${r.cdnType}`}
                                    >
                                      {r.cdnType === "islamic"
                                        ? "Islamic CDN"
                                        : "EveryAyah CDN"}
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

                  {/* ── Options avancées toggle ── */}
                  <button
                    onClick={() => setShowAdvanced((v) => !v)}
                    className={cn(
                      "audio-player__advanced-toggle flex w-full items-center justify-between rounded-lg border px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-widest text-[rgba(240,234,214,0.35)] transition-all [font-family:var(--font-ui)]",
                      showAdvanced
                        ? "border-[rgba(212,168,32,0.18)] bg-[rgba(212,168,32,0.07)]"
                        : "border-white/7 bg-transparent",
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
                  {showAdvanced && (
                    <>
                      {/* Suivre le verset récité */}
                      <button
                        onClick={() => set({ karaokeFollow: !karaokeFollow })}
                        className={playerCardToggleClass(karaokeFollow)}
                        aria-pressed={karaokeFollow}
                      >
                        <span className="flex items-center gap-2">
                          <i className="fas fa-location-crosshairs text-[0.6rem]" />
                          {lang === "fr"
                            ? "Suivre le verset récité"
                            : lang === "ar"
                              ? "تتبع الآية المقروءة"
                              : "Follow recited verse"}
                        </span>
                        <span
                          className={cn(
                            "text-[0.55rem] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide",
                            karaokeFollow
                              ? "bg-[rgba(212,168,32,0.2)] text-[#f5d785]"
                              : "bg-white/8 text-white/40",
                          )}
                        >
                          {karaokeFollow ? "ON" : "OFF"}
                        </span>
                      </button>

                      {/* ── A-B Repeat ── */}
                      <div>
                        <div className={playerSectionLabelClass}>
                          {lang === "fr"
                            ? "Répétition A-B"
                            : lang === "ar"
                              ? "تكرار أ-ب"
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
                              disabled={!currentPlayingAyah}
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
                              className="rounded-lg border border-white/10 bg-white/[0.05] px-2 py-0.75 text-[0.65rem] text-[rgba(240,234,214,0.45)] transition-all"
                            >
                              <i className="fas fa-xmark" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* ── Equalizer presets ── */}
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
                            { id: "flat", fr: "Plat", ar: "عادي", en: "Flat" },
                            {
                              id: "bass",
                              fr: "Graves",
                              ar: "جهير",
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
                              ar: "قريب",
                              en: "Near",
                            },
                            { id: "hall", fr: "Salle", ar: "قاعة", en: "Hall" },
                            {
                              id: "vocals",
                              fr: "Voix",
                              ar: "صوتي",
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

                      {/* ── Tartil progressif ── */}
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
                              ? "الترتيل التدريجي"
                              : "Progressive Tartil"}
                        </span>
                        <span
                          className={cn(
                            "text-[0.55rem] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide",
                            tartilMode
                              ? "bg-[rgba(212,168,32,0.2)] text-[#f5d785]"
                              : "bg-white/8 text-white/40",
                          )}
                        >
                          {tartilMode ? "ON" : "OFF"}
                        </span>
                      </button>

                      {/* ── Mode récitation (Web Speech API) ── */}
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
                                ? "إيقاف التلاوة"
                                : "وضع التلاوة"
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
                            {reciteResult === "ok" ? "✓" : "~"}
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
    </>
  );
}
