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

/** Reflect OS/headset interruptions without forcing an unwanted restart. */
export function observeNativePlayback(service) {
  const audio = service.audio;
  const paused = () => {
    if (!service.isPlaying || audio.ended || service._cancelPendingLoad) return;
    service.isPlaying = false;
    service._notifyPause(service.currentAyah);
  };
  const playing = () => {
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
    service.isPlaying = false;
    service._notifyPause(service.currentAyah);
  }
  return true;
}

/** Retry the queued verse from online, visibility or lock-screen Play. */
export function retryPendingBackgroundAudio(service) {
  const index = service._pendingBackgroundIndex;
  if (index == null) return null;
  service._pendingBackgroundIndex = null;
  service._backgroundRecoveryIndex = null;
  return service._loadAndPlay(index);
}
