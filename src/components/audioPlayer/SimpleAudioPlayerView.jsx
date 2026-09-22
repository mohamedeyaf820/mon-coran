import React from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Gauge,
  Loader2,
  Pause,
  Play,
  RotateCw,
  Settings2,
  SkipBack,
  SkipForward,
  WifiOff,
  X,
} from "lucide-react";
import { cn } from "../../lib/utils";
import AudioLoadingIndicator from "../AudioLoadingIndicator";
import { CoverArt, ProgressRail } from "./AudioPlayerPrimitives";
import { formatAudioTime } from "./audioPlayerUtils";

function playerShellProps(props) {
  return { "data-player-state": props.minimized ? "compact" : "expanded" };
}

function IconButton({
  className,
  label,
  onClick,
  pressed,
  children,
  ariaHidden,
  tabIndex,
}) {
  return (
    <button
      type="button"
      className={cn("simple-player__icon-button", className)}
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      aria-hidden={ariaHidden ? "true" : undefined}
      tabIndex={tabIndex}
    >
      {children}
    </button>
  );
}

function PlayerProgress({
  currentTime,
  duration,
  label,
  onClick,
  onKeyDown,
  onPointerDown,
  progress,
  progressDragging,
  progressRef,
  showThumb = true,
  showTimes = true,
}) {
  return (
    <div className="simple-player__timeline">
      <div
        className={cn(
          "mp-player-progress simple-player__progress",
          progressDragging && "is-dragging",
        )}
        ref={progressRef}
        onClick={onClick}
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuetext={`${formatAudioTime(currentTime)} / ${formatAudioTime(duration)}`}
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <ProgressRail progress={progress} showThumb={showThumb} />
      </div>
      {showTimes && (
        <div className="simple-player__time" aria-hidden="true">
          <span>{formatAudioTime(currentTime)}</span>
          <span>{formatAudioTime(duration)}</span>
        </div>
      )}
    </div>
  );
}

function NetworkStatus({ networkBadge, networkState }) {
  if (!networkBadge) return null;
  return (
    <span className="simple-player__network" role="status">
      {networkState === "stalled" ? (
        <WifiOff size={12} aria-hidden="true" />
      ) : (
        <Loader2 size={12} className="simple-player__spinner" aria-hidden="true" />
      )}
      {networkBadge.text}
    </span>
  );
}

function RetryAudioAction({ onRetryAudio, retryLabel }) {
  return (
    <button
      type="button"
      onClick={onRetryAudio}
      className="my-1 inline-flex min-h-[max(2.75rem,44px)] items-center gap-2 self-center rounded-full border border-white/15 bg-white/[0.06] px-4 text-xs font-semibold text-[color-mix(in_srgb,var(--theme-text-inverse)_92%,transparent_8%)] transition-colors duration-150 hover:bg-[rgba(var(--theme-primary-rgb),0.14)]"
    >
      <RotateCw size={14} aria-hidden="true" />
      {retryLabel}
    </button>
  );
}

function TrackMeta({
  currentArabicName,
  currentAyahPreview,
  reciterLabel,
  riwaya,
  surahNum,
  title,
}) {
  const surahLigature = surahNum ? String(surahNum).padStart(3, "0") : null;
  return (
    <div className="simple-player__meta">
      <div className="simple-player__eyebrow">
        <span className="simple-player__riwaya">{riwaya === "warsh" ? "Warsh" : "Hafs"}</span>
        {surahLigature ? (
          <span className="simple-player__surah-ar font-surah-names" dir="ltr" lang="en" aria-hidden="true">
            {surahLigature}
          </span>
        ) : currentArabicName ? (
          <span className="simple-player__surah-ar" dir="rtl" lang="ar">
            {currentArabicName}
          </span>
        ) : null}
      </div>
      <strong className="simple-player__title">{title}</strong>
      <span className="simple-player__reciter">{reciterLabel || "—"}</span>
      {currentAyahPreview && (
        <p className="simple-player__ayah" dir="rtl" lang="ar">
          {currentAyahPreview}
        </p>
      )}
    </div>
  );
}

function CompactPlayer(props) {
  const {
    audioFailed,
    closeLabel,
    currentArabicName,
    currentTime,
    duration,
    errorLabel,
    expandLabel,
    isMobile,
    isPlaying,
    onDismissError,
    onExpand,
    onProgressClick,
    onProgressKeyDown,
    onProgressPointerDown,
    onRetryAudio,
    onToggle,
    playPauseLabel,
    progress,
    progressDragging,
    progressLabel,
    progressRef,
    reciter,
    reciterLabel,
    retryLabel,
    surahNum,
    title,
  } = props;

  return (
    <section
      {...playerShellProps(props)}
      className={cn(
        "mp-audio-player audio-player-simple simple-player simple-player--compact is-minimized",
        isMobile
          ? "mp-audio-player--mobile mp-audio-player--dock"
          : "mp-audio-player--desktop",
      )}
      role="region"
      aria-label={props.regionLabel}
      data-testid="audio-player-compact"
    >
      <PlayerProgress
        currentTime={currentTime}
        duration={duration}
        label={progressLabel}
        onClick={onProgressClick}
        onKeyDown={onProgressKeyDown}
        onPointerDown={onProgressPointerDown}
        progress={progress}
        progressDragging={progressDragging}
        progressRef={progressRef}
        showTimes={false}
      />
      <div className="mp-player-minimized-row simple-player__compact-row">
        <CoverArt isPlaying={isPlaying} size={42} reciter={reciter} />
        <button
          type="button"
          className="mp-player-minimized-open simple-player__compact-meta"
          onClick={onExpand}
          aria-label={expandLabel}
        >
          <span className="simple-player__compact-meta-text">
            <span className="simple-player__compact-title-row">
              <strong className="simple-player__compact-title">{title}</strong>
              {currentArabicName && (
                <span className="simple-player__compact-ar-badge" dir="rtl" lang="ar">
                  {currentArabicName}
                </span>
              )}
            </span>
            {audioFailed ? (
              <span
                className="simple-player__compact-reciter simple-player__compact-error"
                role="alert"
              >
                <AlertCircle size={11} aria-hidden="true" />
                <span>{errorLabel}</span>
              </span>
            ) : (
              <span className="simple-player__compact-reciter">{reciterLabel || "—"}</span>
            )}
          </span>
        </button>
        <div className="simple-player__compact-actions">
          <IconButton
            className="mp-player-play-btn simple-player__play simple-player__play--compact"
            label={playPauseLabel}
            onClick={onToggle}
            pressed={isPlaying}
          >
            {isPlaying ? <Pause size={18} strokeWidth={2.4} /> : <Play size={18} strokeWidth={2.4} className="simple-player__play-glyph" />}
          </IconButton>
          {audioFailed ? (
            <>
              <IconButton
                className="simple-player__expand-btn"
                label={retryLabel}
                onClick={onRetryAudio}
              >
                <RotateCw size={16} strokeWidth={2.2} />
              </IconButton>
              <button
                type="button"
                className="simple-player__icon-button simple-player__expand-btn simple-player__expand-btn--alert"
                onClick={onDismissError}
                aria-label={`${errorLabel} · ${closeLabel}`}
                title={closeLabel}
              >
                <X size={16} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </>
          ) : (
            <IconButton
              className="simple-player__expand-btn"
              label={expandLabel}
              onClick={onExpand}
              ariaHidden
              tabIndex={-1}
            >
              <ChevronUp size={18} strokeWidth={2.2} />
            </IconButton>
          )}
        </div>
      </div>
    </section>
  );
}

function MobileOpenPlayer(props) {
  const {
    audioFailed,
    audioIndicatorState,
    audioSpeed,
    closeLabel,
    currentArabicName,
    currentTime,
    duration,
    isPlaying,
    minimizeLabel,
    networkBadge,
    networkState,
    nextLabel,
    onClose,
    onCycleSpeed,
    onMinimize,
    onNext,
    onOptions,
    onPrevious,
    onProgressClick,
    onProgressKeyDown,
    onProgressPointerDown,
    onRetryAudio,
    onToggle,
    optionsLabel,
    optionsOpen,
    playPauseLabel,
    previousLabel,
    progress,
    progressDragging,
    progressLabel,
    progressRef,
    reciter,
    reciterLabel,
    regionLabel,
    retryLabel,
    riwaya,
    speedLabel,
    title,
  } = props;

  return (
    <section
      {...playerShellProps(props)}
      className="mp-audio-player audio-player-simple simple-player simple-player--open simple-player--mobile-open is-maximized mp-audio-player--mobile mp-audio-player--dock"
      role="region"
      aria-label={regionLabel}
      data-testid="audio-player-open"
    >
      <header className="simple-player__mobile-summary">
        <CoverArt isPlaying={isPlaying} size={40} reciter={reciter} />
        <div className="simple-player__mobile-meta">
          <span className="simple-player__mobile-kicker">
            {riwaya === "warsh" ? "Warsh" : "Hafs"}
            {props.surahNum ? (
              <b className="font-surah-names simple-player__mobile-surah-glyph" dir="ltr" lang="en" aria-hidden="true">
                {String(props.surahNum).padStart(3, "0")}
              </b>
            ) : currentArabicName ? (
              <b dir="rtl" lang="ar">{currentArabicName}</b>
            ) : null}
          </span>
          <strong>{title}</strong>
          <span>{reciterLabel || "—"}</span>
        </div>
        <div className="simple-player__header-actions">
          <IconButton
            className="simple-player__minimize"
            label={minimizeLabel}
            onClick={onMinimize}
          >
            <ChevronDown size={16} />
          </IconButton>
          <IconButton label={closeLabel} onClick={onClose}>
            <X size={17} />
          </IconButton>
        </div>
      </header>

      <NetworkStatus networkBadge={networkBadge} networkState={networkState} />

      <PlayerProgress
        currentTime={currentTime}
        duration={duration}
        label={progressLabel}
        onClick={onProgressClick}
        onKeyDown={onProgressKeyDown}
        onPointerDown={onProgressPointerDown}
        progress={progress}
        progressDragging={progressDragging}
        progressRef={progressRef}
        showTimes={false}
      />

      <div className="simple-player__transport">
        <button
          type="button"
          className="simple-player__speed"
          onClick={onCycleSpeed}
          aria-label={`${speedLabel} ${audioSpeed}x`}
          title={speedLabel}
        >
          <Gauge size={13} />
          <span>{audioSpeed}x</span>
        </button>
        <IconButton label={previousLabel} onClick={onPrevious}>
          <SkipBack size={17} />
        </IconButton>
        <IconButton
          className="mp-player-play-btn simple-player__play"
          label={playPauseLabel}
          onClick={onToggle}
          pressed={isPlaying}
        >
          {isPlaying ? <Pause size={19} /> : <Play size={19} className="simple-player__play-glyph" />}
        </IconButton>
        <IconButton label={nextLabel} onClick={onNext}>
          <SkipForward size={17} />
        </IconButton>
        <IconButton
          className="mp-player-options-trigger simple-player__transport-options"
          label={optionsLabel}
          onClick={onOptions}
          pressed={optionsOpen}
        >
          <Settings2 size={17} />
        </IconButton>
      </div>

      <div className="simple-player__mobile-status" aria-live="polite">
        {audioFailed && (
          <RetryAudioAction onRetryAudio={onRetryAudio} retryLabel={retryLabel} />
        )}
        <AudioLoadingIndicator
          state={audioIndicatorState}
          isPlaying={isPlaying}
          errorMessage={props.audioError}
        />
      </div>
    </section>
  );
}

function OpenPlayer(props) {
  const {
    audioFailed,
    audioIndicatorState,
    audioSpeed,
    closeLabel,
    currentArabicName,
    currentAyahPreview,
    currentTime,
    duration,
    isMobile,
    isPlaying,
    minimizeLabel,
    networkBadge,
    networkState,
    nextLabel,
    onClose,
    onCycleSpeed,
    onMinimize,
    onNext,
    onOptions,
    onPrevious,
    onProgressClick,
    onProgressKeyDown,
    onProgressPointerDown,
    onRetryAudio,
    onToggle,
    optionsLabel,
    optionsOpen,
    playPauseLabel,
    previousLabel,
    progress,
    progressDragging,
    progressLabel,
    progressRef,
    reciter,
    reciterLabel,
    regionLabel,
    retryLabel,
    riwaya,
    speedLabel,
    surahNum,
    title,
  } = props;

  return (
    <section
      {...playerShellProps(props)}
      className={cn(
        "mp-audio-player audio-player-simple simple-player simple-player--open is-maximized",
        isMobile
          ? "mp-audio-player--mobile mp-audio-player--dock"
          : "mp-audio-player--desktop",
      )}
      role="region"
      aria-label={regionLabel}
      data-testid="audio-player-open"
    >
      {isMobile && (
        <button
          type="button"
          className="simple-player__handle"
          onClick={onMinimize}
          aria-label={minimizeLabel}
        >
          <span />
        </button>
      )}

      <header className="simple-player__header">
        <span className="simple-player__drag-label">
          <span className="simple-player__header-label">{regionLabel}</span>
        </span>
        <div className="simple-player__header-actions">
          {!isMobile && (
            <IconButton label={minimizeLabel} onClick={onMinimize}>
              <ChevronDown size={17} />
            </IconButton>
          )}
          <IconButton label={closeLabel} onClick={onClose}>
            <X size={17} />
          </IconButton>
        </div>
      </header>

      <div className="simple-player__track">
        <CoverArt isPlaying={isPlaying} size={52} reciter={reciter} />
        <TrackMeta
          currentArabicName={currentArabicName}
          currentAyahPreview={currentAyahPreview}
          reciterLabel={reciterLabel}
          riwaya={riwaya}
          surahNum={surahNum}
          title={title}
        />
      </div>

      <NetworkStatus networkBadge={networkBadge} networkState={networkState} />

      <PlayerProgress
        currentTime={currentTime}
        duration={duration}
        label={progressLabel}
        onClick={onProgressClick}
        onKeyDown={onProgressKeyDown}
        onPointerDown={onProgressPointerDown}
        progress={progress}
        progressDragging={progressDragging}
        progressRef={progressRef}
      />

      <div className="simple-player__transport">
        <button
          type="button"
          className="simple-player__speed"
          onClick={onCycleSpeed}
          aria-label={`${speedLabel} ${audioSpeed}x`}
          title={speedLabel}
        >
          <Gauge size={14} />
          <span>{audioSpeed}x</span>
        </button>
        <IconButton label={previousLabel} onClick={onPrevious}>
          <SkipBack size={20} />
        </IconButton>
        <IconButton
          className="mp-player-play-btn simple-player__play"
          label={playPauseLabel}
          onClick={onToggle}
          pressed={isPlaying}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} className="simple-player__play-glyph" />}
        </IconButton>
        <IconButton label={nextLabel} onClick={onNext}>
          <SkipForward size={20} />
        </IconButton>
        <IconButton
          className="mp-player-options-trigger simple-player__settings-secondary"
          label={optionsLabel}
          onClick={onOptions}
          pressed={optionsOpen}
        >
          <Settings2 size={18} />
        </IconButton>
      </div>

      <div className="simple-player__footer">
        {audioFailed && (
          <RetryAudioAction onRetryAudio={onRetryAudio} retryLabel={retryLabel} />
        )}
        <AudioLoadingIndicator
          state={audioIndicatorState}
          isPlaying={isPlaying}
          errorMessage={props.audioError}
        />
      </div>
    </section>
  );
}

export default function SimpleAudioPlayerView(props) {
  if (props.minimized) return <CompactPlayer {...props} />;
  if (props.isMobile) return <MobileOpenPlayer {...props} />;
  return <OpenPlayer {...props} />;
}
