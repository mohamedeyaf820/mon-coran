import React, { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import audioService from "../../services/audioService";

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function QCAudioBar({ lang, currentPlayingAyah, isPlaying, surahName }) {
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [localPlaying, setLocalPlaying] = useState(false);
  const progressRailRef = useRef(null);

  useEffect(() => {
    const syncSnapshot = () => {
      setProgress(audioService.progress || 0);
      setCurrentTime(audioService.currentTime || 0);
      setDuration(audioService.duration || 0);
      setSpeed(audioService.playbackRate || 1);
      setLocalPlaying(Boolean(audioService.isPlaying));
    };

    syncSnapshot();
    const unsubscribeTime = audioService.addTimeUpdateListener(syncSnapshot);
    const unsubscribeAyah = audioService.addAyahChangeListener(syncSnapshot);
    const unsubscribeEnd = audioService.addEndListener(syncSnapshot);
    const interval = window.setInterval(syncSnapshot, 500);

    return () => {
      unsubscribeTime();
      unsubscribeAyah();
      unsubscribeEnd();
      window.clearInterval(interval);
    };
  }, []);

  const handleProgressClick = (e) => {
    const rail = progressRailRef.current;
    if (!rail) return;
    const rect = rail.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioService.seek(ratio * audioService.duration);
  };

  const cycleSpeed = () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
    audioService.setSpeed(next);
    setSpeed(next);
  };

  const playing = Boolean(isPlaying || localPlaying);

  const trackLabel =
    surahName && currentPlayingAyah?.ayah
      ? `${surahName} · ${lang === "fr" ? "Verset" : "Verse"} ${currentPlayingAyah.ayah}`
      : surahName || (lang === "fr" ? "Prêt" : "Ready");

  return (
    <div
      className={cn(
        "qc-audio-bar fixed bottom-0 left-0 right-0 z-[300]",
        "border-t border-[var(--border)]",
        "bg-[var(--bg-primary)]/95 backdrop-blur-xl",
        "flex flex-col",
        "shadow-[0_-4px_24px_rgba(0,0,0,0.12)]",
      )}
      role="region"
      aria-label={lang === "fr" ? "Lecteur audio" : "Audio player"}
    >
      {/* Progress rail */}
      <div
        ref={progressRailRef}
        onClick={handleProgressClick}
        className="h-1 w-full cursor-pointer bg-[var(--border)] relative"
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        aria-label="Progression"
      >
        <div
          className="absolute inset-y-0 left-0 bg-[var(--primary)] transition-all duration-150 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 px-4 py-2.5 max-[480px]:px-3">
        {/* Track info */}
        <div className="flex-1 min-w-0">
          <div className="text-[0.76rem] font-semibold text-[var(--text-primary)] truncate leading-tight">
            {trackLabel}
          </div>
          <div className="text-[0.62rem] text-[var(--text-muted)] tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* Playback controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Speed */}
          <button
            type="button"
            onClick={cycleSpeed}
            className={cn(
              "h-7 px-2 rounded-lg text-[0.62rem] font-extrabold transition-all",
              speed !== 1
                ? "bg-[rgba(var(--primary-rgb),0.12)] text-[var(--primary)] border border-[rgba(var(--primary-rgb),0.25)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
            )}
            aria-label={`Vitesse: ${speed}×`}
          >
            {speed}×
          </button>

          {/* Prev */}
          <button
            type="button"
            onClick={() => audioService.prev()}
            className="h-9 w-9 flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[rgba(var(--primary-rgb),0.08)] transition-all"
            aria-label={lang === "fr" ? "Précédent" : "Previous"}
          >
            <i className="fas fa-backward-step text-sm" />
          </button>

          {/* Play / Pause */}
          <button
            type="button"
            onClick={() => {
              audioService.toggle();
              window.setTimeout(() => setLocalPlaying(Boolean(audioService.isPlaying)), 60);
            }}
            className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center",
              "bg-[var(--primary)] text-white font-bold",
              "shadow-[0_4px_14px_rgba(var(--primary-rgb),0.4)]",
              "transition-all duration-150 hover:brightness-110 active:scale-95",
            )}
            aria-label={playing ? "Pause" : "Play"}
          >
            <i className={`fas ${playing ? "fa-pause" : "fa-play"} text-sm ${!playing ? "ml-0.5" : ""}`} />
          </button>

          {/* Next */}
          <button
            type="button"
            onClick={() => audioService.next()}
            className="h-9 w-9 flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[rgba(var(--primary-rgb),0.08)] transition-all"
            aria-label={lang === "fr" ? "Suivant" : "Next"}
          >
            <i className="fas fa-forward-step text-sm" />
          </button>

          {/* Stop */}
          <button
            type="button"
            onClick={() => audioService.stop()}
            className="h-9 w-9 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
            aria-label="Stop"
          >
            <i className="fas fa-stop text-xs" />
          </button>
        </div>
      </div>
    </div>
  );
}
