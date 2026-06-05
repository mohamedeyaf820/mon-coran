import React, { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import audioService from "../../services/audioService";

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function pick(lang, values) {
  return values[lang] || values.fr;
}

export default function QCAudioBar({
  lang,
  currentPlayingAyah,
  isPlaying,
  surahName,
}) {
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [localPlaying, setLocalPlaying] = useState(false);
  const progressRailRef = useRef(null);

  const labels = {
    player: pick(lang, {
      fr: "Lecteur audio",
      en: "Audio player",
      ar: "\u0645\u0634\u063a\u0644 \u0627\u0644\u0635\u0648\u062a",
    }),
    progress: pick(lang, {
      fr: "Progression audio",
      en: "Audio progress",
      ar: "\u062a\u0642\u062f\u0645 \u0627\u0644\u0635\u0648\u062a",
    }),
    ready: pick(lang, {
      fr: "Pr\u00eat \u00e0 lire",
      en: "Ready",
      ar: "\u062c\u0627\u0647\u0632",
    }),
    verse: pick(lang, {
      fr: "Verset",
      en: "Verse",
      ar: "\u0622\u064a\u0629",
    }),
    speed: pick(lang, {
      fr: "Vitesse",
      en: "Speed",
      ar: "\u0627\u0644\u0633\u0631\u0639\u0629",
    }),
    previous: pick(lang, {
      fr: "Pr\u00e9c\u00e9dent",
      en: "Previous",
      ar: "\u0627\u0644\u0633\u0627\u0628\u0642",
    }),
    pause: pick(lang, {
      fr: "Pause",
      en: "Pause",
      ar: "\u0625\u064a\u0642\u0627\u0641 \u0645\u0624\u0642\u062a",
    }),
    play: pick(lang, {
      fr: "Lecture",
      en: "Play",
      ar: "\u062a\u0634\u063a\u064a\u0644",
    }),
    next: pick(lang, {
      fr: "Suivant",
      en: "Next",
      ar: "\u0627\u0644\u062a\u0627\u0644\u064a",
    }),
    stop: pick(lang, {
      fr: "Arr\u00eater",
      en: "Stop",
      ar: "\u0625\u064a\u0642\u0627\u0641",
    }),
  };

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
      ? `${surahName} \u00b7 ${labels.verse} ${currentPlayingAyah.ayah}`
      : surahName || labels.ready;

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
      aria-label={labels.player}
    >
      <div
        ref={progressRailRef}
        onClick={handleProgressClick}
        className="relative h-1 w-full cursor-pointer bg-[var(--border)]"
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        aria-label={labels.progress}
      >
        <div
          className="absolute inset-y-0 left-0 bg-[var(--primary)] transition-all duration-150 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="flex items-center gap-3 px-4 py-2.5 max-[480px]:px-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[0.76rem] font-semibold leading-tight text-[var(--text-primary)]">
            {trackLabel}
          </div>
          <div className="text-[0.62rem] tabular-nums text-[var(--text-muted)]">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={cycleSpeed}
            className={cn(
              "h-7 rounded-lg px-2 text-[0.62rem] font-extrabold transition-all",
              speed !== 1
                ? "border border-[rgba(var(--primary-rgb),0.25)] bg-[rgba(var(--primary-rgb),0.12)] text-[var(--primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
            )}
            aria-label={`${labels.speed}: ${speed}x`}
          >
            {speed}x
          </button>

          <button
            type="button"
            onClick={() => audioService.prev()}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-all hover:bg-[rgba(var(--primary-rgb),0.08)] hover:text-[var(--primary)]"
            aria-label={labels.previous}
          >
            <i className="fas fa-backward-step text-sm" />
          </button>

          <button
            type="button"
            onClick={() => {
              audioService.toggle();
              window.setTimeout(
                () => setLocalPlaying(Boolean(audioService.isPlaying)),
                60,
              );
            }}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              "bg-[var(--primary)] font-bold text-white",
              "shadow-[0_4px_14px_rgba(var(--primary-rgb),0.4)]",
              "transition-all duration-150 hover:brightness-110 active:scale-95",
            )}
            aria-label={playing ? labels.pause : labels.play}
            aria-pressed={playing}
          >
            <i className={`fas ${playing ? "fa-pause" : "fa-play"} text-sm ${!playing ? "ml-0.5" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => audioService.next()}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-all hover:bg-[rgba(var(--primary-rgb),0.08)] hover:text-[var(--primary)]"
            aria-label={labels.next}
          >
            <i className="fas fa-forward-step text-sm" />
          </button>

          <button
            type="button"
            onClick={() => audioService.stop()}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] transition-all hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/20"
            aria-label={labels.stop}
          >
            <i className="fas fa-stop text-xs" />
          </button>
        </div>
      </div>
    </div>
  );
}
