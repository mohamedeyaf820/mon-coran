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
