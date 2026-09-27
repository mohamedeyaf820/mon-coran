import { useEffect, useRef } from 'react';

/**
 * Hook MediaSession API — expose controls to lock screen / headset buttons.
 * Safe to call in any environment; feature-detected at runtime.
 *
 * @param {object} opts
 * @param {string}   opts.title       - Track title shown on lock screen
 * @param {string}   opts.artist      - Artist / reciter name
 * @param {string}   opts.album       - Album (defaults to "MushafPlus")
 * @param {string}   [opts.artwork]   - Artwork URL (512×512 PNG)
 * @param {boolean}  opts.isPlaying   - Current playback state
 * @param {string}   [opts.playbackState] - Authoritative state for the OS
 *   (`playing`/`paused`). Defaults to `isPlaying`. A background suspension is
 *   not a user pause: publishing `paused` there gives up Android's audio-focus
 *   exemption and freezes the tab mid-recitation, so callers pass the reader's
 *   intent instead of the element's instant state.
 * @param {Function} opts.onPlay      - Called when user taps play on lock screen
 * @param {Function} opts.onPause     - Called when user taps pause
 * @param {Function} opts.onNext      - Called when user taps next-track
 * @param {Function} opts.onPrev      - Called when user taps previous-track
 */
export function useMediaSession({
  title,
  artist,
  album,
  artwork,
  isPlaying,
  playbackState,
  onPlay,
  onPause,
  onNext,
  onPrev,
  onStop,
  onSeekTo,
  onSeekBackward,
  onSeekForward,
  currentTime = 0,
  duration = 0,
  playbackRate = 1,
}) {
  // Keep handlers in a ref so we never need to re-register listeners
  const handlersRef = useRef({});
  handlersRef.current = {
    onPlay,
    onPause,
    onNext,
    onPrev,
    onStop,
    onSeekTo,
    onSeekBackward,
    onSeekForward,
  };

  // Update metadata whenever track identity changes
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: title || '',
        artist: artist || '',
        album: album || 'MushafPlus',
        artwork: artwork ? [{ src: artwork, sizes: '512x512', type: 'image/png' }] : [],
      });
    } catch {
      // MediaMetadata may not be supported in some browsers
    }
  }, [title, artist, album, artwork]);

  // Sync playback state. The caller may pass the reader's intent explicitly:
  // while the recitation is meant to keep going, the lock screen must not read
  // `paused`, or Android hands the audio focus back and freezes the tab.
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const state = playbackState || (isPlaying ? 'playing' : 'paused');
    try {
      navigator.mediaSession.playbackState = state;
    } catch {
      // ignore
    }
  }, [isPlaying, playbackState]);

  // Keep the lock-screen progress bar synchronized with the real media
  // element. Invalid/unknown durations are intentionally skipped because
  // setPositionState throws until metadata is available.
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const safeDuration = Number(duration);
    const safePosition = Number(currentTime);
    const safeRate = Number(playbackRate);
    if (!Number.isFinite(safeDuration) || safeDuration <= 0) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: safeDuration,
        playbackRate:
          Number.isFinite(safeRate) && safeRate > 0 ? safeRate : 1,
        position: Math.min(
          safeDuration,
          Math.max(0, Number.isFinite(safePosition) ? safePosition : 0),
        ),
      });
    } catch {
      // Position state is optional and unavailable in older Safari versions.
    }
  }, [currentTime, duration, playbackRate]);

  // Register action handlers once, use ref to keep them fresh
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const actions = [
      ['play',          () => handlersRef.current.onPlay?.()],
      ['pause',         () => handlersRef.current.onPause?.()],
      ['nexttrack',     () => handlersRef.current.onNext?.()],
      ['previoustrack', () => handlersRef.current.onPrev?.()],
      ['stop',          () => handlersRef.current.onStop?.()],
      ['seekto',        (details) => {
        if (Number.isFinite(details?.seekTime)) {
          handlersRef.current.onSeekTo?.(details.seekTime, details.fastSeek);
        }
      }],
      ['seekbackward',  (details) => {
        handlersRef.current.onSeekBackward?.(details?.seekOffset || 10);
      }],
      ['seekforward',   (details) => {
        handlersRef.current.onSeekForward?.(details?.seekOffset || 10);
      }],
    ];

    for (const [action, handler] of actions) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Action may not be supported
      }
    }

    return () => {
      for (const [action] of actions) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // ignore
        }
      }
    };
  }, []); // register once — handlers stay fresh via ref
}
