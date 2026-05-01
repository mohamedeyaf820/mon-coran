import React, { useState } from "react";
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
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={cardRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "mp-audio-player mp-audio-player--desktop !fixed z-[410] flex flex-col overflow-hidden select-none touch-auto",
        isContextualDesktop && !manualDockPosition && "mp-audio-player--reading-dock",
        isReadingDesktop && "max-h-[calc(100vh-var(--header-h)-1.6rem)]",
        minimized ? "is-minimized rounded-[18px]" : "is-maximized rounded-[28px]",
        expanded ? "is-expanded" : "is-collapsed",
        desktopCardWidthClass,
        desktopCardPositionClass,
        !isDragging && "transition-[box-shadow,width,transform] duration-300 ease-[var(--ease,ease)]",
        !canDragDesktopCard ? "cursor-default" : isDragging ? "cursor-grabbing" : "cursor-grab",
        // Premium glass surface
        "border border-white/[0.08] shadow-[0_32px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.04)_inset]",
        "bg-[linear-gradient(160deg,rgba(12,20,14,0.97)_0%,rgba(8,14,10,0.98)_100%)]",
        "backdrop-blur-3xl"
      )}
      role="region"
      aria-label="Audio Player"
      style={{
        // Subtle gold ambient glow when playing
        boxShadow: isPlaying
          ? "0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(180,140,20,0.08), 0 0 0 1px rgba(255,255,255,0.04) inset"
          : undefined,
      }}
    >
      {/* Top accent line — gold when playing */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-[1.5px] rounded-t-[28px] transition-all duration-700",
          isPlaying
            ? "bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-70"
            : "bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-40"
        )}
      />

      {/* ── MINIMIZED STATE ── */}
      {minimized && !isHomeDesktop ? (
        <div className="flex items-center gap-3 px-3.5 py-2.5" data-player-drag="true">
          <CoverArt isPlaying={isPlaying} size={40} />
          <button onClick={onToggleMinimized} className="flex-1 text-left min-w-0">
            <div className="text-[0.78rem] font-semibold text-white/90 truncate leading-tight">
              {titleLabel || (lang === "fr" ? "Prêt" : "Ready")}
            </div>
            <div className="text-[0.62rem] text-white/40 truncate mt-0.5">
              {reciterLabel || "—"}
            </div>
          </button>
          {/* Mini progress under text */}
          <div className="flex items-center gap-2">
            <div className="w-16 h-0.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--gold)] to-amber-300 rounded-full transition-all duration-300"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <button
              onClick={onToggle}
              className="h-9 w-9 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-[var(--gold)] text-black shadow-[0_4px_12px_rgba(212,168,34,0.35)] active:scale-95 transition-transform"
            >
              <i className={`fas ${isPlaying ? "fa-pause" : "fa-play"} text-xs`} />
            </button>
            <button onClick={onClose} className="p-1.5 text-white/20 hover:text-white/60 transition-colors">
              <i className="fas fa-times text-xs" />
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ── HEADER BAR ── */}
          <div
            className="flex items-center justify-between px-4 py-2 border-b border-white/[0.05]"
            data-player-drag="true"
          >
            <div className="flex items-center gap-2">
              {/* Drag handle dots */}
              <div className="flex gap-[3px] opacity-25">
                <div className="w-1 h-1 rounded-full bg-white" />
                <div className="w-1 h-1 rounded-full bg-white" />
                <div className="w-1 h-1 rounded-full bg-white" />
              </div>
              <span className="text-[0.55rem] font-black text-white/25 uppercase tracking-[0.2em]">
                {lang === "ar" ? "مشغل الصوت" : lang === "fr" ? "Lecteur" : "Player"}
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={onToggleOptions}
                className="mp-player-options-trigger h-7 w-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all"
                title="Options"
                aria-label={lang === "fr" ? "Options audio et récitateur" : "Audio and reciter options"}
              >
                <i className="fas fa-sliders text-[10px]" />
              </button>
              <button
                onClick={onToggleMinimized}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all"
                title="Minimiser"
              >
                <i className="fas fa-minus text-[10px]" />
              </button>
              <button
                onClick={onClose}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-white/20 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                title="Fermer"
              >
                <i className="fas fa-times text-[10px]" />
              </button>
            </div>
          </div>

          {/* ── MAIN BODY ── */}
          <div className="px-5 pt-4 pb-5 flex flex-col gap-4">

            {/* Track Info Row */}
            <div className="flex items-center gap-3.5">
              <CoverArt isPlaying={isPlaying} size={52} />
              <div className="min-w-0 flex-1">
                {currentArabicName && (
                  <div
                    className="text-[1.05rem] leading-none font-quran text-amber-300/90 truncate mb-1"
                    dir="rtl"
                  >
                    {currentArabicName}
                  </div>
                )}
                <div className="text-[0.82rem] font-semibold text-white/90 truncate leading-snug">
                  {titleLabel || (lang === "fr" ? "Aucune lecture" : "Nothing playing")}
                </div>
                <div className="text-[0.64rem] text-white/38 truncate mt-0.5">
                  {reciterLabel || "—"}
                </div>
              </div>
              {/* Favorite / like btn placeholder */}
              <button className="p-1.5 text-white/15 hover:text-amber-400 transition-colors shrink-0">
                <i className="far fa-heart text-sm" />
              </button>
            </div>

            {/* Audio loading / error state */}
            {audioError && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-400/20 text-rose-300 text-[0.68rem]">
                <i className="fas fa-exclamation-circle text-rose-400" />
                <span className="truncate">{audioError}</span>
              </div>
            )}

            {networkBadge && !audioError && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-400/20 text-amber-300 text-[0.68rem] animate-pulse">
                <i className={`fas ${networkBadge.icon} text-amber-400`} />
                <span className="truncate">{networkBadge.text}</span>
              </div>
            )}

            {/* Waveform visualizer */}
            <div className="h-8">
              <Waveform isPlaying={isPlaying} progress={progress} />
            </div>

            {/* Progress bar */}
            <div>
              <div
                ref={progressRef}
                onMouseDown={handleProgressMouseDown}
                className="group h-2 relative flex items-center cursor-pointer"
                role="slider"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
              >
                {/* Track */}
                <div className="absolute inset-0 my-auto h-[3px] rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-150 ease-linear"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                {/* Thumb */}
                <div
                  className="absolute w-3 h-3 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)] transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ left: `${progress * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[0.58rem] font-mono text-white/25 mt-1.5 tabular-nums select-none">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-between">
              {/* Speed button */}
              <button
                onClick={cycleSpeed}
                className={cn(
                  "text-[0.64rem] font-black px-2.5 py-1 rounded-lg transition-all",
                  audioSpeed !== 1
                    ? "bg-amber-400/15 text-amber-300 border border-amber-400/25"
                    : "bg-white/[0.05] text-white/35 border border-white/[0.06] hover:text-white/60 hover:bg-white/[0.08]"
                )}
              >
                {audioSpeed}×
              </button>

              {/* Main playback controls */}
              <div className="flex items-center gap-5">
                <button
                  onClick={onPrev}
                  className="text-white/45 hover:text-white transition-colors active:scale-90 transform"
                  aria-label="Précédent"
                >
                  <i className="fas fa-backward-step text-base" />
                </button>

                {/* Play/Pause — centrepiece */}
                <button
                  onClick={onToggle}
                  className={cn(
                    "relative h-12 w-12 rounded-full flex items-center justify-center text-black font-bold",
                    "bg-gradient-to-br from-amber-300 via-[var(--gold,#d4a820)] to-amber-600",
                    "shadow-[0_8px_24px_rgba(180,140,20,0.45),0_0_0_1px_rgba(255,220,80,0.15)_inset]",
                    "active:scale-95 transition-transform duration-100",
                    "hover:shadow-[0_8px_32px_rgba(180,140,20,0.65),0_0_0_1px_rgba(255,220,80,0.25)_inset]"
                  )}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {/* Ripple on playing */}
                  {isPlaying && (
                    <span className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping" />
                  )}
                  <i className={`fas ${isPlaying ? "fa-pause" : "fa-play"} text-base ${!isPlaying ? "ml-0.5" : ""}`} />
                </button>

                <button
                  onClick={onNext}
                  className="text-white/45 hover:text-white transition-colors active:scale-90 transform"
                  aria-label="Suivant"
                >
                  <i className="fas fa-forward-step text-base" />
                </button>
              </div>

              {/* Stop */}
              <button
                onClick={onStop}
                className="text-white/20 hover:text-rose-400/70 transition-colors active:scale-90 transform"
                aria-label="Stop"
              >
                <i className="fas fa-stop text-sm" />
              </button>
            </div>
          </div>

          {/* Options modal overlay */}
          {optionsModalOpen && renderOptionsModal && (
            <div className="absolute inset-0 z-50 rounded-[28px] overflow-hidden animate-in fade-in duration-200">
              {renderOptionsModal()}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DesktopPlayer;
