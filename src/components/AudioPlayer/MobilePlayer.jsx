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
  audioIndicator, // This is expected to be a pre-rendered or component
  cycleSpeed,
  audioSpeed,
}) {
  if (minimized) {
    return (
      <div
        className={cn(
          "mp-audio-player mp-audio-player--mobile !fixed bottom-4 left-4 right-4 z-[300] overflow-hidden",
          "backdrop-blur-xl border border-white/20 bg-black/50 shadow-2xl rounded-2xl",
          "animate-in fade-in slide-in-from-bottom-4 duration-300"
        )}
      >
        <div className="h-1 w-full bg-white/10 overflow-hidden">
          <ProgressRail progress={progress} />
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <CoverArt isPlaying={isPlaying} size={40} pulse={false} />
          <button
            onClick={onToggleMinimized}
            className="flex-1 text-left min-w-0"
          >
            <div className="text-[0.82rem] font-bold text-white/95 truncate">
              {titleLabel || (lang === "fr" ? "Prêt" : "Ready")}
            </div>
            <div className="text-[0.68rem] text-white/50 truncate">
              {reciterLabel || "-"}
            </div>
          </button>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={onToggle}
              className="h-10 w-10 rounded-full flex items-center justify-center bg-[var(--gold)] text-black"
            >
              <i className={`fas ${isPlaying ? "fa-pause" : "fa-play"}`} />
            </button>
            <button onClick={onClose} className="p-2 text-white/40"><i className="fas fa-times" /></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mp-audio-player mp-audio-player--mobile-full !fixed inset-0 z-[400] flex flex-col",
        "backdrop-blur-2xl bg-black/80 text-white transition-transform duration-500",
        expanded ? "translate-y-0" : "translate-y-full"
      )}
    >
      {/* Top Bar / Handle */}
      <div className="flex items-center justify-between px-6 py-6 pt-12">
        <button onClick={onToggleMinimized} className="p-2 text-white/60 hover:text-white"><i className="fas fa-chevron-down text-xl" /></button>
        <div className="h-1.5 w-12 rounded-full bg-white/20" />
        <button onClick={onClose} className="p-2 text-white/60 hover:text-rose-400"><i className="fas fa-times text-xl" /></button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-10 pb-12">
        <CoverArt isPlaying={isPlaying} size={100} className="mb-10 shadow-[0_20px_50px_rgba(212,168,34,0.25)]" />
        
        <div className="text-center mb-10 w-full">
          <h2 className="text-2xl font-bold mb-2 truncate">
            {titleLabel || (lang === "fr" ? "Lecteur Prêt" : "Ready to Play")}
          </h2>
          <p className="text-white/60 text-lg truncate mb-4">
            {reciterLabel || "-"}
          </p>
          
          {networkBadge && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[0.7rem] text-white/80 animate-pulse">
              <i className={`fas ${networkBadge.icon}`} />
              <span>{networkBadge.text}</span>
            </div>
          )}
        </div>

        {/* Big Waveform */}
        <div className="w-full mb-8 h-12">
          <Waveform isPlaying={isPlaying} progress={progress} count={48} />
        </div>

        {/* Progress */}
        <div 
          ref={progressRef}
          onMouseDown={handleProgressMouseDown}
          className="w-full h-8 flex items-center relative cursor-pointer mb-2"
        >
          <ProgressRail progress={progress} showThumb className="h-1.5" />
        </div>
        
        <div className="w-full flex justify-between text-sm font-mono text-white/40 mb-10 tabular-nums">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Controls */}
        <div className="w-full flex items-center justify-between px-4">
          <button onClick={cycleSpeed} className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center font-bold text-sm text-[var(--gold)]">
            {audioSpeed}x
          </button>
          
          <div className="flex items-center gap-8">
            <button onClick={onPrev} className="text-3xl text-white/80"><i className="fas fa-step-backward" /></button>
            <button 
              onClick={onToggle}
              className="w-20 h-20 rounded-full bg-[var(--gold)] text-black flex items-center justify-center shadow-[0_0_30px_rgba(212,168,34,0.4)] active:scale-95 transition-transform"
            >
              <i className={`fas ${isPlaying ? "fa-pause" : "fa-play"} text-3xl`} />
            </button>
            <button onClick={onNext} className="text-3xl text-white/80"><i className="fas fa-step-forward" /></button>
          </div>
          
          <button onClick={onToggleOptions} className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-[var(--gold)]">
            <i className="fas fa-sliders-h text-xl" />
          </button>
        </div>
      </div>

      {/* Options Overlay */}
      {optionsModalOpen && (
        <div className="absolute inset-0 z-50 animate-in fade-in zoom-in-95 duration-200">
           {renderOptionsModal()}
        </div>
      )}
    </div>
  );
}

export default MobilePlayer;
