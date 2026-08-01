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
  onPlay,
  onPause,
  onNext,
  onPrev,
}) {
  // Keep handlers in a ref so we never need to re-register listeners
  const handlersRef = useRef({});
  handlersRef.current = { onPlay, onPause, onNext, onPrev };

  // Update metadata whenever track identity changes
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: title || '',
        artist: artist || '',
        album: album || 'MushafPlus',
        artwork: artwork
          ? [{ src: artwork, sizes: '512x512', type: 'image/png' }]
          : [],
      });
    } catch {
      // MediaMetadata may not be supported in some browsers
    }
  }, [title, artist, album, artwork]);

  // Sync playback state
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    } catch {
      // ignore
    }
  }, [isPlaying]);

  // Register action handlers once, use ref to keep them fresh
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const actions = [
      ['play',          () => handlersRef.current.onPlay?.()],
      ['pause',         () => handlersRef.current.onPause?.()],
      ['nexttrack',     () => handlersRef.current.onNext?.()],
      ['previoustrack', () => handlersRef.current.onPrev?.()],
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
