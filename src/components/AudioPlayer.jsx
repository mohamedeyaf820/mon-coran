import React, { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import audioService from "../services/audioService";
import { ensureReciterForRiwaya, getRecitersByRiwaya } from "../data/reciters";
import { getSurah, surahName } from "../data/surahs";
import { cn } from "../lib/utils";

/* ─────────────────────────────────────────────
   Drag / position helpers  (desktop card only)
───────────────────────────────────────────── */
const CARD_STORAGE_KEY = "mushaf_player_card_pos_v4";

function loadCardPos() {
  try {
    const raw = localStorage.getItem(CARD_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}
function saveCardPos(pos) {
  try {
    localStorage.setItem(CARD_STORAGE_KEY, JSON.stringify(pos));
  } catch {}
}
function clamp(x, y, w, h, margin = 12) {
  return {
    x: Math.max(margin, Math.min(window.innerWidth - w - margin, x)),
    y: Math.max(margin, Math.min(window.innerHeight - h - margin, y)),
  };
}

/* ─────────────────────────────────────────────
   Waveform (desktop card)
───────────────────────────────────────────── */
function Waveform({ isPlaying, progress }) {
  const COUNT = 32;
  return (
    <div className="flex items-end justify-center gap-0.5 h-8 w-full">
      {Array.from({ length: COUNT }).map((_, i) => {
        const pct = i / COUNT;
        const filled = pct <= progress;
        const seed = ((i * 7 + 3) % 13) / 13;
        const baseH = 22 + seed * 60;
        return (
          <div
            key={i}
            className="rounded-full flex-1"
            style={{
              height: `${baseH}%`,
              minWidth: 2,
              background: filled
                ? "linear-gradient(180deg, var(--gold-bright), var(--gold))"
                : "rgba(255,255,255,0.12)",
              transformOrigin: "bottom",
              animation: isPlaying
                ? `waveBar ${0.5 + seed * 0.65}s ease-in-out ${(i * 28) % 280}ms infinite alternate`
                : "none",
            }}
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
      className="relative rounded-xl overflow-hidden shrink-0"
      style={{
        width: size,
        height: size,
        background:
          "linear-gradient(135deg, var(--emerald) 0%, #0e3d26 60%, #0a2d1c 100%)",
        boxShadow: isPlaying
          ? "0 2px 12px rgba(184,134,11,0.35)"
          : "0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(circle at 35% 40%, rgba(212,168,32,0.5) 0%, transparent 60%)",
        }}
      />
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
        <i
          className="fas fa-quran text-xl"
          style={{
            color: "rgba(253,243,213,0.9)",
            filter: "drop-shadow(0 1px 4px rgba(184,134,11,0.5))",
          }}
        />
      </div>
      {isPlaying && (
        <div
          className="absolute top-1 right-1 w-2 h-2 rounded-full"
          style={{
            background: "var(--gold-bright)",
            boxShadow: "0 0 6px var(--gold)",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
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
  const { state, set } = useApp();
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
  } = state;

  const [progress, setProgress] = useState(0);
  const [currentTime, setCurTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [volume, setVolume] = useState(savedVolume ?? 1);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [audioError, setAudioError] = useState(null);
  const [networkState, setNetworkState] = useState("idle");

  const progressRef = useRef(null);
  const audioErrorTimerRef = useRef(null);

  /* ── Detect mobile ── */
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ── Wire audio callbacks ── */
  useEffect(() => {
    audioService.onPlay = (item) => {
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
      const msg = riwaya === 'warsh'
        ? (lang === 'fr'
            ? 'Audio Warsh indisponible. Vérifiez votre connexion ou changez de récitateur.'
            : lang === 'ar'
              ? 'الصوت غير متاح. تحقق من الاتصال أو غيّر القارئ.'
              : 'Warsh audio unavailable. Check your connection or switch reciter.')
        : (lang === 'fr' ? 'Erreur de chargement audio.' : lang === 'ar' ? 'خطأ في تحميل الصوت.' : 'Audio load error.');
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

  const currentReciters = getRecitersByRiwaya(riwaya);
  const isWarshMode = riwaya === "warsh";

  const { currentSurah } = state;
  const surahMeta = getSurah(currentSurah);
  const currentSurahName = surahMeta ? surahName(currentSurah, lang) : "";
  const currentArabicName = surahMeta?.ar || "";

  const reciterObj = currentReciters.find((r) => r.id === reciter);
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

  // Subtitle shown in the desktop card when nothing is playing
  const idleSubtitle = !isPlaying && !currentPlayingAyah
    ? (showHome
      ? (lang === "ar" ? "اضغط ▶ للاستماع" : lang === "fr" ? "Appuyez ▶ pour écouter" : "Press ▶ to listen")
      : null)
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

  /* ── Drag state (desktop card only) ── */
  const cardRef = useRef(null);
  const dragState = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [cardPos, setCardPos] = useState(() => {
    const saved = loadCardPos();
    if (saved) return saved;
    return {
      x: window.innerWidth - 280 - 16,
      y: Math.max(88, window.innerHeight - 360 - 24),
    };
  });

  useEffect(() => {
    const onResize = () => {
      if (!cardRef.current) return;
      const { offsetWidth: w, offsetHeight: h } = cardRef.current;
      setCardPos((prev) => {
        const next = clamp(prev.x, prev.y, w, h);
        saveCardPos(next);
        return next;
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (isMobile || !cardRef.current) return;
    const { offsetWidth: w, offsetHeight: h } = cardRef.current;
    setCardPos((prev) => {
      const next = clamp(prev.x, prev.y, w, h);
      if (next.x === prev.x && next.y === prev.y) return prev;
      saveCardPos(next);
      return next;
    });
  }, [expanded, minimized, isMobile]);

  const onPointerDown = useCallback(
    (e) => {
      if (e.target.closest("button") || e.target.closest("input")) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      dragState.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: cardPos.x,
        originY: cardPos.y,
      };
      setIsDragging(true);
    },
    [cardPos],
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
    (e) => {
      if (!dragState.current) return;
      const card = cardRef.current;
      const w = card ? card.offsetWidth : 264;
      const h = card ? card.offsetHeight : 400;
      const next = clamp(cardPos.x, cardPos.y, w, h);
      setCardPos(next);
      saveCardPos(next);
      dragState.current = null;
      setIsDragging(false);
    },
    [cardPos],
  );

  /* ══════════════════════════════════════════
     MOBILE — classic bottom bar
  ══════════════════════════════════════════ */
  if (isMobile) {
    if (minimized) {
      return (
        <div
          className="fixed bottom-3 left-3 right-3 z-[300] overflow-hidden rounded-2xl text-[#f0ead6]"
          style={{
            background: "var(--player-glass)",
            border: "1px solid var(--player-border)",
            boxShadow: "0 14px 34px rgba(12,18,14,0.2)",
          }}
          role="region"
          aria-label={
            lang === "ar"
              ? "مشغل الصوت المصغر"
              : lang === "fr"
                ? "Lecteur audio reduit"
                : "Minimized audio player"
          }
        >
          <div className="h-0.75 bg-white/8">
            <div
              className="h-full"
              style={{
                width: `${progress * 100}%`,
                background: "linear-gradient(90deg, var(--gold), var(--gold-bright))",
              }}
            />
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5">
            <CoverArt isPlaying={isPlaying} size={40} />
            <div className="flex-1 min-w-0">
              <div className="text-[0.74rem] font-semibold leading-tight truncate text-white/90">
                {titleLabel || (lang === "fr" ? "Pret a lire" : lang === "ar" ? "جاهز" : "Ready")}
              </div>
              <div className="text-[0.6rem] truncate text-white/45">
                {reciterLabel || "-"}
              </div>
            </div>
            <button
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-[#0e3d26] text-[0.88rem] border-none cursor-pointer shadow-lg transition-all duration-150"
              onClick={toggle}
              title={isPlaying ? t("audio.pause", lang) : t("audio.play", lang)}
              aria-pressed={isPlaying}
            >
              <i className={`fas ${isPlaying ? "fa-pause" : "fa-play"}`} />
            </button>
            <button
              className={cn(mBarBtn, "w-8 h-8 text-[0.72rem] rounded-lg shrink-0")}
              onClick={toggleMinimized}
              title={lang === "fr" ? "Agrandir" : lang === "ar" ? "تكبير" : "Expand"}
            >
              <i className="fas fa-up-right-and-down-left-from-center" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-[300] text-[#f0ead6] rounded-t-2xl"
        style={{
          background: "var(--player-glass)",
          borderTop: "1px solid var(--player-border)",
          boxShadow: expanded
            ? "0 -18px 50px rgba(12,18,14,0.2), 0 -1px 0 rgba(255,255,255,0.05)"
            : "0 -10px 32px rgba(12,18,14,0.14), 0 -1px 0 rgba(255,255,255,0.04)",
        }}
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
              className="inline-flex items-center gap-1.5 px-2 py-0.75 rounded-full text-[0.62rem] font-semibold"
              style={{
                background: "var(--player-chip-bg)",
                border: "1px solid var(--player-chip-border)",
                color: "var(--player-chip-text)",
                fontFamily: "var(--font-ui)",
              }}
            >
              <i className={`fas ${networkBadge.icon}`} />
              <span>{networkBadge.text}</span>
            </div>
          </div>
        )}
        {/* Progress bar */}
        <div
          className="relative cursor-pointer overflow-visible rounded-t-2xl bg-white/10 h-0.75 hover:h-1.25 transition-[height] duration-150"
          ref={progressRef}
          onClick={handleSeek}
          role="progressbar"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-[inherit] relative transition-[width] duration-100 ease-linear"
            style={{
              width: `${progress * 100}%`,
              background:
                "linear-gradient(90deg, var(--gold), var(--gold-bright))",
              boxShadow: "0 0 8px rgba(184,134,11,0.45)",
            }}
          >
            <div className="absolute -right-1.25 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white scale-0 hover:scale-100 transition-transform duration-150 shadow-md" />
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center px-3 gap-2 min-h-15.5">
          {/* Left: info block */}
          <div
            className="flex flex-col justify-center gap-[0.15rem] min-w-0 w-22 shrink-0"
            aria-live="polite"
          >
            <span className="block text-[0.7rem] text-white/88 whitespace-nowrap overflow-hidden text-ellipsis font-semibold leading-tight">
              {currentPlayingAyah
                ? `${t("quran.surah", lang)} ${currentPlayingAyah.surah}:${currentPlayingAyah.ayah}`
                : lang === "fr"
                  ? "En attente"
                  : lang === "ar"
                    ? "جاهز"
                    : "Ready"}
            </span>
            <span className="text-[0.6rem] text-white/40 font-mono tabular-nums leading-none">
              {formatTime(currentTime)}
              <span className="opacity-50 mx-0.5">/</span>
              {formatTime(duration)}
            </span>
          </div>

          {/* Center: main playback controls */}
          <div className="flex-1 flex items-center justify-center gap-1">
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
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-[#0e3d26] text-[0.9rem] border-none cursor-pointer shadow-lg transition-all duration-150 hover:scale-[1.06] active:scale-[0.94] shrink-0"
              onClick={toggle}
              title={isPlaying ? t("audio.pause", lang) : t("audio.play", lang)}
              aria-pressed={isPlaying}
              style={{
                boxShadow: isPlaying
                  ? "0 0 0 3px rgba(212,168,32,0.25), 0 4px 12px rgba(0,0,0,0.35)"
                  : "0 4px 12px rgba(0,0,0,0.3)",
              }}
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
          <div className="flex items-center gap-1 shrink-0">
            <button
              className={cn(
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
            <button
              className={cn(
                mBarBtnSm(),
                "px-[0.4rem] py-[0.22rem] text-[0.64rem] min-h-6.5 min-w-6.5 justify-center",
              )}
              onClick={toggleMinimized}
              title={lang === "fr" ? "Reduire" : lang === "ar" ? "تصغير" : "Minimize"}
            >
              <i className="fas fa-window-minimize" />
            </button>
          </div>
        </div>

        {/* Expanded panel */}
        {expanded && (
          <div
            className="px-3.5 pt-3 pb-4 border-t border-white/[0.07]"
            style={{
              background: "var(--player-panel-bg)",
              animation: "fadeInUp 0.18s var(--ease, ease)",
            }}
          >
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

            {/* Reciter label */}
            <div className="mb-2.5">
              <span className="text-[0.6rem] font-bold uppercase tracking-widest text-[rgba(240,234,214,0.35)]">
                {t("audio.reciter", lang)}
              </span>
              <div className="grid grid-cols-2 gap-1 mt-1.5">
                {currentReciters.map((r) => {
                  const active = reciter === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => set({ reciter: r.id })}
                      className="flex items-center gap-1 px-1.5 py-1.5 rounded-lg text-left transition-all duration-150"
                      style={{
                        background: active
                          ? "rgba(212,168,32,0.16)"
                          : "rgba(255,255,255,0.04)",
                        border: active
                          ? "1px solid rgba(212,168,32,0.45)"
                          : "1px solid rgba(255,255,255,0.08)",
                        color: active ? "#f5d785" : "rgba(240,234,214,0.7)",
                      }}
                      aria-pressed={active}
                    >
                      {active && (
                        <i
                          className="fas fa-check text-[0.48rem] shrink-0"
                          style={{ color: "var(--gold-bright)" }}
                        />
                      )}
                      <span className="text-[0.6rem] font-semibold leading-tight truncate">
                        {lang === "ar"
                          ? r.name
                          : lang === "fr"
                            ? r.nameFr
                            : r.nameEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2 mt-2.5 px-0.5">
              <button
                onClick={() => handleVolumeChange(volume > 0 ? 0 : 1)}
                className="w-6 h-6 flex items-center justify-center text-[0.72rem] shrink-0 rounded-md transition-colors duration-150"
                style={{ color: "rgba(212,168,32,0.6)" }}
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
                className="flex-1 h-0.75 rounded-full cursor-pointer"
                style={{ accentColor: "var(--gold-bright, #d4a820)" }}
              />
              <span
                className="text-[0.58rem] tabular-nums shrink-0 w-6 text-right font-semibold"
                style={{
                  color: "rgba(212,168,32,0.45)",
                  fontFamily: "var(--font-ui)",
                }}
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
                        className="w-12 px-1.5 py-1 text-center text-[0.72rem] rounded-lg outline-none"
                        style={{
                          background: "rgba(255,255,255,0.07)",
                          border: "1px solid rgba(212,168,32,0.2)",
                          color: "rgba(240,234,214,0.95)",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
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
      {/* CSS keyframes */}
      <style>{`
        @keyframes waveBar {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.75); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Audio error banner */}
      {audioError && (
        <div
          style={{
            position: "fixed",
            top: 72,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 400,
            background: "rgba(180,30,30,0.93)",
            color: "#fff",
            borderRadius: 12,
            padding: "10px 18px",
            fontSize: 13,
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            animation: "slideDown 0.25s ease",
            maxWidth: 340,
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <i className="fas fa-exclamation-circle" style={{ flexShrink: 0 }} />
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
          "fixed z-[300] flex flex-col overflow-hidden select-none touch-none",
          isDragging ? "cursor-grabbing" : "cursor-grab",
        )}
        style={{
          left: cardPos.x,
          top: cardPos.y,
          width: minimized ? 228 : expanded ? 286 : 272,
          background: "var(--player-glass)",
          border: "1px solid var(--player-border)",
          borderRadius: minimized ? 20 : 24,
          boxShadow: isPlaying
            ? "0 18px 50px rgba(11,20,15,0.22), 0 0 0 1px rgba(192,154,74,0.18), 0 2px 8px rgba(109,85,26,0.08)"
            : "0 14px 42px rgba(11,20,15,0.16), 0 0 0 1px rgba(255,255,255,0.05)",
          transition: isDragging ? "none" : "box-shadow 0.3s ease, width 0.2s ease",
        }}
        role="region"
        aria-label={
          lang === "ar"
            ? "مشغل الصوت"
            : lang === "fr"
              ? "Lecteur Audio"
              : "Audio Player"
        }
      >
        {minimized ? (
          <>
            <div className="flex items-center gap-3 px-3.5 pt-3 pb-2.5">
              <CoverArt isPlaying={isPlaying} size={42} />
              <div className="flex-1 min-w-0">
                {networkBadge && (
                  <div
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[0.54rem] font-bold mb-1"
                    style={{
                      background: "var(--player-chip-bg)",
                      border: "1px solid var(--player-chip-border)",
                      color: "var(--player-chip-text)",
                      fontFamily: "var(--font-ui)",
                    }}
                  >
                    <i className={`fas ${networkBadge.icon}`} />
                    <span>{networkBadge.text}</span>
                  </div>
                )}
                <div
                  className="text-[0.76rem] font-bold leading-tight truncate"
                  style={{ color: "var(--player-text-strong)", fontFamily: "var(--font-ui)" }}
                >
                  {titleLabel ||
                    (lang === "fr"
                      ? "Pret a lire"
                      : lang === "ar"
                        ? "جاهز"
                        : "Ready")}
                </div>
                <div
                  className="text-[0.62rem] mt-0.5 truncate"
                  style={{ color: "var(--player-text-soft)", fontFamily: "var(--font-ui)" }}
                >
                  {reciterLabel || idleSubtitle || "-"}
                </div>
              </div>
              <button
                onClick={toggle}
                title={isPlaying ? t("audio.pause", lang) : t("audio.play", lang)}
                aria-pressed={isPlaying}
                className="w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(212,168,32,0.5)]"
                style={{
                  background: "linear-gradient(135deg, var(--player-accent) 0%, var(--player-accent-deep) 100%)",
                  border: "1px solid rgba(192,154,74,0.28)",
                  color: "#fbf7ea",
                }}
              >
                <i className={`fas ${isPlaying ? "fa-pause" : "fa-play"}`} />
              </button>
              <IconBtn
                onClick={toggleMinimized}
                title={lang === "fr" ? "Agrandir" : lang === "ar" ? "تكبير" : "Expand"}
                size="sm"
              >
                <i className="fas fa-up-right-and-down-left-from-center" />
              </IconBtn>
            </div>
            <div className="px-3.5 pb-3">
              <div className="relative h-0.75 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${progress * 100}%`,
                    background: "linear-gradient(90deg, var(--gold), var(--gold-bright))",
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          <>
        {networkBadge && (
          <div className="px-4 pt-1">
            <div
              className="inline-flex items-center gap-1.5 px-2 py-0.75 rounded-full text-[0.6rem] font-bold"
              style={{
                background: "var(--player-chip-bg)",
                border: "1px solid var(--player-chip-border)",
                color: "var(--player-chip-text)",
                fontFamily: "var(--font-ui)",
              }}
            >
              <i className={`fas ${networkBadge.icon}`} />
              <span>{networkBadge.text}</span>
            </div>
          </div>
        )}
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-7 h-0.75 rounded-full bg-white/20" />
        </div>

        <div className="px-4 pb-4 pt-1 flex flex-col gap-3">
          {/* Top row: cover + info */}
          <div className="flex items-center gap-3">
            <CoverArt isPlaying={isPlaying} />
            <div className="flex-1 min-w-0">
              <div
                className="text-[0.82rem] font-bold leading-tight truncate"
                style={{
                    color: "var(--player-text-strong)",
                  fontFamily: "var(--font-ui)",
                }}
              >
                {titleLabel ||
                  (lang === "fr"
                    ? "Prêt à lire"
                    : lang === "ar"
                      ? "جاهز"
                      : "Ready")}
              </div>
              <div
                className="text-[0.67rem] mt-0.5 truncate"
                style={{
                    color: "var(--player-text-soft)",
                  fontFamily: "var(--font-ui)",
                }}
              >
                {idleSubtitle || reciterLabel || "—"}
              </div>
              {isWarshMode && warshStrictMode && (
                <span
                  className="inline-block mt-0.5 px-1.5 py-px rounded-full text-[0.55rem] font-bold tracking-wide border"
                  style={{
                    background: "var(--player-chip-bg)",
                    color: "var(--player-chip-text)",
                    borderColor: "var(--player-chip-border)",
                  }}
                >
                  Warsh ✓
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <IconBtn
                onClick={toggleMinimized}
                title={lang === "fr" ? "Reduire" : lang === "ar" ? "تصغير" : "Minimize"}
                size="sm"
              >
                <i className="fas fa-window-minimize" />
              </IconBtn>
            </div>
          </div>

          {/* Waveform */}
          <Waveform isPlaying={isPlaying} progress={progress} />

          {/* Seek bar + times */}
          <div className="flex flex-col gap-1">
            <div
              ref={progressRef}
              onClick={handleSeek}
              className="relative h-0.75 rounded-full cursor-pointer group"
              style={{ background: "rgba(255,255,255,0.12)" }}
              role="progressbar"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${progress * 100}%`,
                  background:
                    "linear-gradient(90deg, var(--gold), var(--gold-bright))",
                  boxShadow: "0 0 6px rgba(184,134,11,0.4)",
                  transition: "width 0.1s linear",
                }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-md" />
              </div>
            </div>
            <div
              className="flex justify-between text-[0.6rem] font-mono"
              style={{ color: "rgba(212,168,32,0.55)" }}
            >
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main controls */}
          <div className="flex items-center justify-between">
            {/* Speed */}
            <button
              onClick={cycleSpeed}
              className="px-2 py-0.75 rounded-md text-[0.62rem] font-bold transition-all duration-150"
              style={{
                background: "var(--player-chip-bg)",
                border: "1px solid var(--player-chip-border)",
                color: "var(--player-chip-text)",
                fontFamily: "var(--font-ui)",
              }}
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
              title={isPlaying ? t("audio.pause", lang) : t("audio.play", lang)}
              aria-pressed={isPlaying}
              className="w-12 h-12 flex items-center justify-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(212,168,32,0.5)]"
              style={{
                background: isPlaying
                  ? "linear-gradient(135deg, var(--player-accent-strong) 0%, var(--player-accent) 100%)"
                  : "linear-gradient(135deg, var(--player-accent) 0%, var(--player-accent-deep) 100%)",
                border: "1.5px solid rgba(192,154,74,0.32)",
                color: "#fbf7ea",
                fontSize: "1.05rem",
                boxShadow: isPlaying
                  ? "0 10px 26px rgba(28,76,53,0.28), 0 1px 4px rgba(0,0,0,0.14)"
                  : "0 6px 16px rgba(0,0,0,0.18)",
                transform: isPlaying ? "scale(1.04)" : "scale(1)",
              }}
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleVolumeChange(volume > 0 ? 0 : 1)}
              className="shrink-0 text-[0.72rem] transition-colors duration-150"
              style={{ color: "rgba(212,168,32,0.6)" }}
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
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="flex-1 h-0.75 rounded-full cursor-pointer"
              style={{ accentColor: "var(--gold-bright, #d4a820)" }}
              aria-label="Volume"
            />
            <span
              className="shrink-0 text-[0.58rem] w-6 text-right tabular-nums"
              style={{
                color: "rgba(212,168,32,0.5)",
                fontFamily: "var(--font-ui)",
              }}
            >
              {Math.round(volume * 100)}%
            </span>
          </div>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[0.63rem] transition-all duration-150 w-full"
            style={{
              background: "var(--player-panel-bg)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "rgba(240,234,214,0.52)",
              fontFamily: "var(--font-ui)",
            }}
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
              className="flex flex-col gap-3 border-t pt-3"
              style={{
                borderColor: "rgba(192,154,74,0.12)",
                animation: "fadeInUp 0.18s var(--ease, ease)",
              }}
            >
              {/* Reciter grid */}
              <div>
                <div
                  className="text-[0.58rem] font-bold uppercase tracking-widest mb-1.5"
                  style={{
                    color: "rgba(212,168,32,0.5)",
                    fontFamily: "var(--font-ui)",
                  }}
                >
                  {t("audio.reciter", lang)}
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {currentReciters.map((r) => {
                    const active = reciter === r.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => set({ reciter: r.id })}
                        className="flex items-center gap-1 px-1.5 py-1.5 rounded-lg text-left transition-all duration-150"
                        style={{
                          background: active
                            ? "rgba(27,94,59,0.35)"
                            : "rgba(255,255,255,0.04)",
                          border: active
                            ? "1px solid rgba(212,168,32,0.35)"
                            : "1px solid rgba(255,255,255,0.07)",
                          color: active ? "#fbf3d5" : "rgba(240,234,214,0.65)",
                        }}
                        aria-pressed={active}
                      >
                        {active && (
                          <i
                            className="fas fa-check shrink-0 text-[0.48rem]"
                            style={{ color: "var(--gold-bright)" }}
                          />
                        )}
                        <span
                          className="text-[0.6rem] font-semibold leading-tight truncate"
                          style={{ fontFamily: "var(--font-ui)" }}
                        >
                          {lang === "ar"
                            ? r.name
                            : lang === "fr"
                              ? r.nameFr
                              : r.nameEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Memorization settings */}
              {memMode && (
                <div>
                  <div
                    className="text-[0.58rem] font-bold uppercase tracking-widest mb-1.5"
                    style={{
                      color: "rgba(212,168,32,0.5)",
                      fontFamily: "var(--font-ui)",
                    }}
                  >
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
                          className="text-[0.68rem]"
                          style={{
                            color: "rgba(240,234,214,0.7)",
                            fontFamily: "var(--font-ui)",
                          }}
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
                          className="w-12 px-1.5 py-1 text-center text-[0.72rem] rounded-lg outline-none"
                          style={{
                            background: "rgba(255,255,255,0.07)",
                            border: "1px solid rgba(212,168,32,0.2)",
                            color: "rgba(253,243,213,0.9)",
                            fontFamily: "var(--font-ui)",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stop */}
              <button
                onClick={stop}
                className="flex items-center justify-center gap-2 py-1.5 rounded-xl text-[0.7rem] font-semibold transition-all duration-150"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(240,234,214,0.6)",
                  fontFamily: "var(--font-ui)",
                }}
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
