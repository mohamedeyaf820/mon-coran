import React, { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import audioService from "../../services/audioService";
import { getAudioPlayerLabels } from "../audioPlayer/audioPlayerLabels";
import { formatAudioTime } from "../audioPlayer/audioPlayerUtils";
import { Icon } from "../ui/icon";

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

  const labels = getAudioPlayerLabels(lang);

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

    return () => {
      unsubscribeTime();
      unsubscribeAyah();
      unsubscribeEnd();
    };
  }, []);

  const handleProgressClick = (e) => {
    const rail = progressRailRef.current;
    if (!rail) return;
    const rect = rail.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioService.seek(ratio * audioService.duration);
  };

  const handleProgressKeyDown = (e) => {
    const dur = audioService.duration;
    if (!dur) return;
    if (e.key === "ArrowRight") { e.preventDefault(); audioService.seek(Math.min(dur, audioService.currentTime + 5)); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); audioService.seek(Math.max(0, audioService.currentTime - 5)); }
    else if (e.key === "Home") { e.preventDefault(); audioService.seek(0); }
    else if (e.key === "End") { e.preventDefault(); audioService.seek(dur); }
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
        "bg-[var(--bg-primary)]/98",
        "flex flex-col",
        "shadow-[0_-4px_24px_rgba(0,0,0,0.12)]",
      )}
      role="region"
      aria-label={labels.region}
    >
      <div
        ref={progressRailRef}
        onClick={handleProgressClick}
        onKeyDown={handleProgressKeyDown}
        className="relative h-1 w-full cursor-pointer bg-[var(--border)]"
        role="slider"
        tabIndex={0}
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
            {formatAudioTime(currentTime)} / {formatAudioTime(duration)}
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
            <Icon name="backward-step" size={17} />
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
            <Icon
              name={playing ? "pause" : "play"}
              size={17}
              className={!playing ? "ml-0.5" : undefined}
            />
          </button>

          <button
            type="button"
            onClick={() => audioService.next()}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-all hover:bg-[rgba(var(--primary-rgb),0.08)] hover:text-[var(--primary)]"
            aria-label={labels.next}
          >
            <Icon name="forward-step" size={17} />
          </button>

          <button
            type="button"
            onClick={() => audioService.stop()}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] transition-all hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/20"
            aria-label={labels.stop}
          >
            <Icon name="stop" size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
