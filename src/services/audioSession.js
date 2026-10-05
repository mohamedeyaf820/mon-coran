/** Feature-detected native playback category; no background keepalive hacks. */
export function preparePlaybackSession(audioContext) {
  try {
    if (typeof navigator !== "undefined" && navigator.audioSession) navigator.audioSession.type = "playback";
    if (audioContext?.state === "suspended") audioContext.resume().catch(() => {});
  } catch { /* Optional API. */ }
}

export function reportPausedState(service, ayah = service.currentAyah) {
  service.isPlaying = false;
  service._setState?.(service._playbackIntent === "paused" ? "PAUSED_BY_USER" : "INTERRUPTED");
  service._notifyPause(ayah);
}

export function observeNativePlayback(service) {
  const audio = service.audio;
  const paused = () => {
    if (audio.ended || service._cancelPendingLoad || service._handOffInFlight) return;
    reportPausedState(service);
  };
  const playing = () => {
    if (service._playbackIntent !== "playing") { audio.pause(); return; }
    if (service._cancelPendingLoad || service.isPlaying) return;
    service._handOffInFlight = false;
    service.isPlaying = true;
    service._setState?.("PLAYING");
    service._notifyPlay(service.currentAyah);
  };
  audio.addEventListener("pause", paused);
  audio.addEventListener("playing", playing);
  return () => {
    audio.removeEventListener("pause", paused);
    audio.removeEventListener("playing", playing);
  };
}

export function recoverBackgroundAudio(service) {
  if (service._playbackIntent !== "playing") return false;
  reportPausedState(service);
  return true;
}
