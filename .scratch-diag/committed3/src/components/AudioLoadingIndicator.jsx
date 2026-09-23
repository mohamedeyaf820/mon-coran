import React from "react";
import { t } from "../i18n";
import { cn } from "../lib/utils";

/**
 * AudioLoadingIndicator — Affiche le statut de chargement du lecteur audio
 * Supporte: loading, buffering, playing, paused, error, ready
 */
export default function AudioLoadingIndicator({
  state = "ready",
  isPlaying = false,
  errorMessage = null,
  lang = "fr",
  showKaraokeFollow = false,
}) {
  if (state === "ready" && !isPlaying) return null;

  const getIcon = () => {
    switch (state) {
      case "loading":
        return (
          <svg
            className="animate-spin"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path
              d="M12 2a10 10 0 0 1 10 10"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        );
      case "buffering":
        return (
          <svg
            className="animate-pulse"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <circle cx="6" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" opacity="0.6" />
            <circle cx="18" cy="12" r="2" opacity="0.3" />
          </svg>
        );
      case "error":
        return (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        );
      case "playing":
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="5" y="4" width="2" height="16" />
            <rect x="12" y="4" width="2" height="16" opacity="0.8" />
            <rect x="19" y="4" width="2" height="16" opacity="0.6" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getLabel = () => {
    switch (state) {
      case "loading":
        return t("audio.loading", lang);
      case "buffering":
        return t("audio.buffering", lang);
      case "error":
        return t("audio.error", lang);
      case "playing":
        return isPlaying ? t("audio.playing", lang) : t("audio.ready", lang);
      default:
        return "";
    }
  };

  const getColor = () => {
    switch (state) {
      case "loading":
      case "buffering":
        return "text-blue-500";
      case "error":
        return "text-red-500";
      case "playing":
        return "text-emerald-600";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div
      className={cn(
        "audio-loading-indicator flex items-center gap-2 text-xs font-medium",
        getColor(),
      )}
    >
      {getIcon()}
      <span>{getLabel()}</span>
      {showKaraokeFollow && (
        <span className="ml-2 text-blue-600 dark:text-blue-400">
          {t("audio.karaokeFollow", lang)}
        </span>
      )}
      {errorMessage && state === "error" && (
        <span className="text-red-600 text-[11px] ml-1" title={errorMessage}>
          - {errorMessage.substring(0, 30)}...
        </span>
      )}
    </div>
  );
}

/**
 * AudioProgressBar — Barre de progression moderne pour le chargement audio
 */
export function AudioProgressBar({
  progress = 0,
  buffered = 0,
  isLoading = false,
}) {
  return (
    <div className="audio-progress-container relative w-full h-1 bg-white/10 rounded-full overflow-hidden">
      {/* Buffered progress */}
      <div
        className="absolute h-full bg-white/20 transition-all duration-200 rounded-full"
        style={{ width: `${buffered}%` }}
      />

      {/* Main progress */}
      <div
        className={cn(
          "absolute h-full bg-linear-to-r from-gold to-gold-bright transition-all duration-100",
          isLoading && "animate-pulse",
        )}
        style={{ width: `${progress}%` }}
      />

      {/* Loading animation  */}
      {isLoading && (
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
      )}
    </div>
  );
}

/**
 * AudioVolumeIndicator — Indicateur de volume moderne
 */
export function AudioVolumeIndicator({ volume = 1, isMuted = false }) {
  const bars = Math.ceil(volume * 3);

  return (
    <div className="audio-volume-indicator flex items-center gap-1">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1 w-0.5 rounded-full transition-all duration-200",
            i < bars && !isMuted ? "bg-gold" : "bg-white/20",
          )}
          style={{ height: `${(i + 1) * 4}px` }}
        />
      ))}
    </div>
  );
}
