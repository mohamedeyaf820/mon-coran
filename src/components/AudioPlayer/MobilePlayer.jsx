import React from "react";
import { cn } from "../../lib/utils";
import CoverArt from "./CoverArt";
import ProgressRail from "./ProgressRail";
import Waveform from "./Waveform";

export function MobilePlayer({
  isPlaying,
  progress,
  currentTime,
  duration,
  titleLabel,
  reciterLabel,
  onToggle,
  onNext,
  onPrev,
  onStop,
  onSeek,
  onToggleMinimized,
  onClose,
  onToggleOptions,
  formatTime,
  minimized,
  expanded,
  progressRef,
  handleProgressMouseDown,
  audioIndicatorState,
  audioError,
  lang,
  playerPanelSurfaceClass,
  playerPrimaryBtnClass,
  isWarshMode,
  warshStrictMode,
  warshStrictLabel,
  warshNonStrictLabel,
  warshVerifiedLabel,
  isSurahStreamReciter,
  hasAyahContext,
  currentPlayingAyah,
  optionsModalOpen,
  renderOptionsModal,
  networkBadge,
  audioIndicator,
  cycleSpeed,
  audioSpeed,
  currentArabicName,
}) {
  /* ── MINIMIZED: persistent bottom bar ── */
  if (minimized) {
    return (
      <div
        className={cn(
          "mp-audio-player mp-audio-player--mobile !fixed bottom-0 left-0 right-0 z-[300] overflow-hidden",
          "border-t border-white/[0.07]",
          "bg-[linear-gradient(180deg,rgba(10,18,12,0.97)_0%,rgba(6,12,8,0.99)_100%)]",
          "backdrop-blur-2xl",
          "animate-in slide-in-from-bottom-2 duration-300"
        )}
      >
        {/* Gold progress line at top */}
        <div className="h-[2px] w-full bg-white/5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-600 via-[var(--gold,#d4a820)] to-amber-300 transition-all duration-300 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        <div className="flex items-center gap-3 px-4 py-3 safe-area-inset-bottom">
          <CoverArt isPlaying={isPlaying} size={40} pulse={false} />

          <button
            onClick={onToggleMinimized}
            className="flex-1 text-left min-w-0"
          >
            <div className="text-[0.84rem] font-semibold text-white/90 truncate leading-tight">
              {titleLabel || (lang === "fr" ? "Prêt à lire" : "Ready")}
            </div>
            <div className="text-[0.66rem] text-white/38 truncate mt-0.5">
              {reciterLabel || "—"}
            </div>
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onPrev}
              className="h-9 w-9 flex items-center justify-center text-white/40 hover:text-white/70 active:scale-90 transition-all"
            >
              <i className="fas fa-backward-step" />
            </button>
            <button
              onClick={onToggle}
              className="h-11 w-11 rounded-full flex items-center justify-center text-black font-bold bg-gradient-to-br from-amber-300 via-[var(--gold,#d4a820)] to-amber-600 shadow-[0_4px_16px_rgba(180,140,20,0.4)] active:scale-95 transition-transform"
            >
              <i className={`fas ${isPlaying ? "fa-pause" : "fa-play"} ${!isPlaying ? "ml-0.5" : ""}`} />
            </button>
            <button
              onClick={onNext}
              className="h-9 w-9 flex items-center justify-center text-white/40 hover:text-white/70 active:scale-90 transition-all"
            >
              <i className="fas fa-forward-step" />
            </button>
            <button
              onClick={onClose}
              className="h-9 w-9 flex items-center justify-center text-white/20 hover:text-white/50 active:scale-90 transition-all"
            >
              <i className="fas fa-times text-sm" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── EXPANDED: full-screen player ── */
  return (
    <div
      className={cn(
        "mp-audio-player mp-audio-player--mobile-full !fixed inset-0 z-[400] flex flex-col",
        "text-white transition-transform duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)]",
        expanded ? "translate-y-0" : "translate-y-full"
      )}
      style={{
        background:
          "linear-gradient(180deg, rgba(8,18,10,0.99) 0%, rgba(4,10,6,1) 100%)",
      }}
    >
      {/* Background ambient orb */}
      {isPlaying && (
        <div
          className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-[100px] opacity-[0.12] animate-pulse"
          style={{ background: "radial-gradient(circle, var(--gold,#d4a820), transparent)" }}
          aria-hidden="true"
        />
      )}

      {/* Top Handle Bar */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <button
          onClick={onToggleMinimized}
          className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white active:scale-90 transition-all"
        >
          <i className="fas fa-chevron-down text-lg" />
        </button>

        {/* Pull handle */}
        <div className="h-1 w-10 rounded-full bg-white/15" />

        <button
          onClick={onToggleOptions}
          className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white active:scale-90 transition-all"
        >
          <i className="fas fa-sliders text-base" />
        </button>
      </div>

      {/* Cover Art — large centered */}
      <div className="flex justify-center px-10 mb-8">
        <div
          className={cn(
            "relative w-52 h-52 rounded-[2rem] overflow-hidden",
            "shadow-[0_24px_64px_rgba(0,0,0,0.6)]",
            "bg-gradient-to-br from-amber-400 via-[var(--gold,#d4a820)] to-amber-700",
            "border border-white/15",
            "transition-transform duration-500",
            isPlaying ? "scale-100" : "scale-[0.92]"
          )}
        >
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.5)_0%,transparent_60%)]" />
          {/* Ornamental SVG */}
          <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full opacity-20" fill="none">
            <circle cx="100" cy="100" r="85" stroke="white" strokeWidth="1" strokeDasharray="6 6" />
            <circle cx="100" cy="100" r="60" stroke="white" strokeWidth="0.6" />
            {Array.from({ length: 16 }).map((_, i) => {
              const a = (i * 360) / 16;
              return (
                <line
                  key={i}
                  x1="100" y1="20" x2="100" y2="42"
                  stroke="white" strokeWidth="1"
                  transform={`rotate(${a} 100 100)`}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <i className="fas fa-quran text-white/80 text-5xl drop-shadow-xl" />
          </div>
          {isPlaying && (
            <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_12px_white] animate-pulse" />
          )}
        </div>
      </div>

      {/* Track info */}
      <div className="px-8 mb-6 text-center">
        {currentArabicName && (
          <div className="text-2xl font-quran text-amber-300/85 mb-2 truncate" dir="rtl">
            {currentArabicName}
          </div>
        )}
        <h2 className="text-xl font-bold text-white/95 truncate leading-tight mb-1">
          {titleLabel || (lang === "fr" ? "Aucune lecture" : "Nothing playing")}
        </h2>
        <p className="text-[0.82rem] text-white/40 truncate">
          {reciterLabel || "—"}
        </p>

        {/* Network badge */}
        {networkBadge && (
          <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-amber-500/10 border border-amber-400/20 rounded-full text-[0.65rem] text-amber-300 animate-pulse">
            <i className={`fas ${networkBadge.icon}`} />
            <span>{networkBadge.text}</span>
          </div>
        )}
        {audioError && (
          <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-rose-500/10 border border-rose-400/20 rounded-full text-[0.65rem] text-rose-300">
            <i className="fas fa-exclamation-circle" />
            <span className="truncate max-w-[200px]">{audioError}</span>
          </div>
        )}
      </div>

      {/* Waveform */}
      <div className="px-8 h-10 mb-4">
        <Waveform isPlaying={isPlaying} progress={progress} count={48} />
      </div>

      {/* Progress */}
      <div className="px-8 mb-1">
        <div
          ref={progressRef}
          onMouseDown={handleProgressMouseDown}
          className="group relative h-10 flex items-center cursor-pointer"
        >
          {/* Track */}
          <div className="absolute inset-0 my-auto h-[3px] rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-600 via-[var(--gold,#d4a820)] to-amber-300 rounded-full transition-all duration-150 ease-linear"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          {/* Thumb */}
          <div
            className="absolute w-4 h-4 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] -translate-x-1/2"
            style={{ left: `${progress * 100}%` }}
          />
        </div>
      </div>
      <div className="px-8 flex justify-between text-[0.62rem] font-mono text-white/28 mb-8 tabular-nums select-none">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-between px-8 mb-8">
        <button
          onClick={cycleSpeed}
          className={cn(
            "w-12 h-12 rounded-2xl font-black text-sm flex items-center justify-center border transition-all active:scale-90",
            audioSpeed !== 1
              ? "bg-amber-400/15 text-amber-300 border-amber-400/25"
              : "bg-white/[0.04] text-white/35 border-white/[0.07] hover:text-white/60"
          )}
        >
          {audioSpeed}×
        </button>

        <div className="flex items-center gap-7">
          <button
            onClick={onPrev}
            className="text-white/50 hover:text-white active:scale-90 transition-all"
          >
            <i className="fas fa-backward-step text-2xl" />
          </button>

          {/* Main play/pause */}
          <button
            onClick={onToggle}
            className="relative w-20 h-20 rounded-full flex items-center justify-center text-black font-bold bg-gradient-to-br from-amber-300 via-[var(--gold,#d4a820)] to-amber-600 shadow-[0_12px_36px_rgba(180,140,20,0.5),0_0_0_1px_rgba(255,220,80,0.2)_inset] active:scale-95 transition-transform duration-100"
          >
            {isPlaying && (
              <span className="absolute inset-0 rounded-full bg-amber-400/25 animate-ping" />
            )}
            <i className={`fas ${isPlaying ? "fa-pause" : "fa-play"} text-2xl ${!isPlaying ? "ml-1" : ""}`} />
          </button>

          <button
            onClick={onNext}
            className="text-white/50 hover:text-white active:scale-90 transition-all"
          >
            <i className="fas fa-forward-step text-2xl" />
          </button>
        </div>

        <button
          onClick={onStop}
          className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/[0.07] bg-white/[0.04] text-white/25 hover:text-rose-400/70 hover:bg-rose-500/10 hover:border-rose-400/20 transition-all active:scale-90"
        >
          <i className="fas fa-stop text-base" />
        </button>
      </div>

      {/* Options modal overlay */}
      {optionsModalOpen && (
        <div className="absolute inset-0 z-50 animate-in fade-in zoom-in-95 duration-200">
          {renderOptionsModal()}
        </div>
      )}
    </div>
  );
}

export default MobilePlayer;
