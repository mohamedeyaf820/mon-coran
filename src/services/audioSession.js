/** Keep long-form recitation eligible for native background playback. */
export function preparePlaybackSession(audioContext) {
  // Audio Session and lock-screen Media Session are complementary APIs.
  try {
    if (typeof navigator !== "undefined" && navigator.audioSession) {
      navigator.audioSession.type = "playback";
    }
    if (audioContext?.state === "suspended") {
      audioContext.resume().catch(() => {});
    }
  } catch { /* Optional browser API; native media playback remains available. */ }
}

/**
 * Report a pause without ending the recitation session.
 *
 * A background suspension (the browser freezing the element, an OS
 * interruption) is not the reader asking to stop. Publishing `paused` to the
 * MediaSession while `_playbackIntent` is still `playing` releases Android's
 * foreground-media/audio-focus exemption — which is exactly what lets Chrome
 * freeze the tab — and pins a stale paused lock screen the reader cannot
 * restart. Keeping the session in `playing` while the visibility/online/timer
 * retries run is what keeps the recitation alive; a genuine pause (visible
 * page, `pause()`/`stop()`) still reports straight through.
 */
export function reportPausedState(service, ayah = service.currentAyah) {
  service.isPlaying = false;
  const hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
  if (hidden && service._playbackIntent === 'playing') {
    // Mirror the interrupted verse so a foreground return restarts the right
    // one instead of the verse that already ended.
    if (service._pendingBackgroundIndex == null && service.playlistIndex >= 0) {
      service._pendingBackgroundIndex = service.playlistIndex;
    }
    return;
  }
  service._notifyPause(ayah);
}

/** Reflect OS/headset interruptions without forcing an unwanted restart. */
export function observeNativePlayback(service) {
  const audio = service.audio;
  const paused = () => {
    if (!service.isPlaying || audio.ended || service._cancelPendingLoad) return;
    // Swapping the source of a live element makes the engine report the old
    // resource as paused. That is our own transition: reporting it would
    // publish `paused` to the lock screen mid-recitation.
    if (service._handOffInFlight) return;
    reportPausedState(service);
  };
  const playing = () => {
    service._handOffInFlight = false;
    if (service.isPlaying || service._cancelPendingLoad) return;
    service.isPlaying = true;
    service._notifyPlay(service.currentAyah);
  };
  audio.addEventListener('pause', paused);
  audio.addEventListener('playing', playing);
  return () => {
    audio.removeEventListener('pause', paused);
    audio.removeEventListener('playing', playing);
  };
}

/** A dropped background stream is retried without silently changing voice. */
export function recoverBackgroundAudio(service) {
  if (typeof document === 'undefined' || !document.hidden ||
      service._playbackIntent !== 'playing' || service.playlistIndex < 0) return false;

  const index = service.playlistIndex;
  service._pendingBackgroundIndex = index;
  if (service._backgroundRecoveryIndex !== index && navigator.onLine !== false) {
    service._backgroundRecoveryIndex = index;
    const position = service.audio.currentTime;
    service._loadAndPlay(index).then(() => {
      if (service.isPlaying && Number.isFinite(position) && position > 0 &&
          Number.isFinite(service.audio.duration) && position < service.audio.duration - 0.5) {
        service.audio.currentTime = position;
      }
    });
  } else {
    reportPausedState(service);
  }
  return true;
}

/** Retry the queued verse from online, visibility or lock-screen Play. */
export function retryPendingBackgroundAudio(service) {
  const index = service._pendingBackgroundIndex;
  if (index == null) return null;
  // A lock-screen Play is a user gesture: spend it on the synchronous
  // hand-off (no `await` before `play()`) while it is still valid, instead of
  // an asynchronous reload the browser refuses once the page is hidden.
  if (service._handOffToIndex?.(index)) return null;
  service._pendingBackgroundIndex = null;
  service._backgroundRecoveryIndex = null;
  return service._loadAndPlay(index);
}
