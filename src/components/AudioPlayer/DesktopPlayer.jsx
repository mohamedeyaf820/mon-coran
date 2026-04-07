import React from "react";
import { cn } from "../../lib/utils";
import CoverArt from "./CoverArt";
import ProgressRail from "./ProgressRail";
import Waveform from "./Waveform";

export function DesktopPlayer({
  state,
  currentPlayingAyah,
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
  isHomeDesktop,
  minimized,
  expanded,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  cardRef,
  progressRef,
  handleProgressMouseDown,
  audioIndicatorState,
  audioError,
  lang,
  playerPanelSurfaceClass,
  playerPrimaryBtnClass,
  isContextualDesktop,
  manualDockPosition,
  playerSoftSurfaceClass,
  hasAyahContext,
  isReadingDesktop,
  isDragging,
  canDragDesktopCard,
  desktopCardWidthClass,
  desktopCardPositionClass,
  desktopCardShadowClass,
  currentArabicName,
  idleSubtitle,
  currentAyahPreview,
  dockedMetaChips,
  resetDockPosition,
  playerUtilityClass,
  networkBadge,
  audioSpeed,
  cycleSpeed,
  renderOptionsModal,
  optionsModalOpen,
}) {
  return (
    <div
      ref={cardRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={cn(
        "mp-audio-player mp-audio-player--desktop !fixed z-[410] flex flex-col overflow-hidden select-none touch-auto text-[color-mix(in_srgb,var(--theme-text)_92%,var(--theme-bg)_8%)]",
        playerPanelSurfaceClass,
        isContextualDesktop && !manualDockPosition && "mp-audio-player--reading-dock",
        isReadingDesktop && "max-h-[calc(100vh-var(--header-h)-1.6rem)]",
        minimized ? "is-minimized rounded-[20px]" : "is-maximized rounded-[24px]",
        expanded ? "is-expanded" : "is-collapsed",
        desktopCardWidthClass,
        desktopCardPositionClass,
        desktopCardShadowClass,
        !isDragging && "transition-[box-shadow,width,transform] duration-300 ease-[var(--ease,ease)]",
        !canDragDesktopCard ? "cursor-default" : isDragging ? "cursor-grabbing" : "cursor-grab",
        "glass-premium backdrop-blur-2xl border border-white/10"
      )}
      role="region"
      aria-label="Audio Player"
    >
      {minimized && !isHomeDesktop ? (
        <div className="flex items-center gap-3 px-3.5 py-3" data-player-drag="true">
          <CoverArt isPlaying={isPlaying} size={42} />
          <div className="flex-1 min-w-0" onClick={onToggleMinimized}>
            <div className="text-[0.76rem] font-bold text-white/95 truncate">
              {titleLabel || (lang === "fr" ? "Prêt" : "Ready")}
            </div>
            <div className="text-[0.62rem] text-white/50 truncate">
              {reciterLabel || "-"}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={onToggle} className={cn(playerPrimaryBtnClass, "h-9 w-9")}>
              <i className={`fas ${isPlaying ? "fa-pause" : "fa-play"}`} />
            </button>
            <button onClick={onClose} className="p-2 text-white/30 hover:text-white"><i className="fas fa-times text-xs" /></button>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className={cn("flex items-center justify-between px-4 py-2.5", playerSoftSurfaceClass)} data-player-drag="true">
            <div className="flex items-center gap-2">
              <div className="h-1 w-6 rounded-full bg-white/20" />
              <span className="text-[0.6rem] font-bold text-white/40 uppercase tracking-widest">Controls</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={onToggleOptions} className={cn(playerUtilityClass, "h-7 w-7")}><i className="fas fa-sliders text-xs" /></button>
              <button onClick={onToggleMinimized} className={cn(playerUtilityClass, "h-7 w-7")}><i className="fas fa-chevron-down text-xs" /></button>
              <button onClick={onClose} className={cn(playerUtilityClass, "h-7 w-7")}><i className="fas fa-times text-xs" /></button>
            </div>
          </div>

          <div className="px-5 pb-5 pt-4">
            <div className="flex items-center gap-4 mb-4">
              <CoverArt isPlaying={isPlaying} size={52} />
              <div className="min-w-0 flex-1">
                {currentArabicName && (
                  <div className="text-lg font-quran text-[var(--gold)] mb-0.5 truncate" dir="rtl">{currentArabicName}</div>
                )}
                <div className="text-[0.8rem] font-bold text-white/95 truncate">{titleLabel}</div>
                <div className="text-[0.65rem] text-white/50 truncate">{reciterLabel}</div>
              </div>
            </div>

            <Waveform isPlaying={isPlaying} progress={progress} />

            <div className="mt-4 mb-2">
              <div ref={progressRef} onMouseDown={handleProgressMouseDown} className="h-1 bg-white/10 rounded-full relative cursor-pointer">
                <ProgressRail progress={progress} showThumb />
              </div>
              <div className="flex justify-between text-[0.6rem] font-mono text-white/40 mt-1 tabular-nums">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <button onClick={cycleSpeed} className="text-[0.65rem] font-bold text-[var(--gold)] px-2 py-1 bg-white/5 rounded-md">{audioSpeed}x</button>
              <div className="flex items-center gap-4">
                <button onClick={onPrev} className="text-white/60 hover:text-white"><i className="fas fa-step-backward" /></button>
                <button onClick={onToggle} className={cn(playerPrimaryBtnClass, "h-11 w-11 text-lg shadow-lg active:scale-95 transition-transform")}>
                  <i className={`fas ${isPlaying ? "fa-pause" : "fa-play"}`} />
                </button>
                <button onClick={onNext} className="text-white/60 hover:text-white"><i className="fas fa-step-forward" /></button>
              </div>
              <button onClick={onStop} className="text-white/40 hover:text-rose-400"><i className="fas fa-stop text-sm" /></button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default DesktopPlayer;
