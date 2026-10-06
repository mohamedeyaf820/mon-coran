/** Native ended drives queue progression. All source changes share one loader. */
export function handOffToIndex(svc, index) {
  if (index < 0 || index >= svc.playlist.length || svc._basmala.active) return false;
  void svc._loadAndPlay(index);
  return true;
}

/** What happens when the current track reaches its end. */
export function handleVerseEnded(svc) {
  // The basmala is not a verse: finishing it must not advance the playlist.
  if (svc._basmala.ended()) return;
  // One-shots often play without a playlist: clearing the flag here would
  // truncate the next playlist.
  if (svc._oneShotMode) {
    svc._oneShotMode = false;
    svc.isPlaying = false;
    svc._playbackIntent = "stopped";
    svc._setState?.("ENDED");
    svc.onEnd?.();
    for (const fn of svc._endListeners) fn();
    return;
  }
  if (svc.playlist.length === 0) return;

  // A-B Repeat: if we've reached end point B, loop back to A
  if (svc.abRepeatStart >= 0 && svc.abRepeatEnd >= 0) {
    if (svc.playlistIndex >= svc.abRepeatEnd) {
      if (!handOffToIndex(svc, svc.abRepeatStart)) {
        svc._loadAndPlay(svc.abRepeatStart);
      }
      return;
    }
  }

  // Native ended is a media event, not a guarantee of user activation.
  if (svc.playlistIndex < svc.playlist.length - 1) {
    const nextIndex = svc.playlistIndex + 1;
    if (!handOffToIndex(svc, nextIndex)) {
      svc._loadAndPlay(nextIndex);
    }
  } else {
    const repeatInfinitely = svc.surahRepeatCount === 0;
    const hasMoreCycles =
      repeatInfinitely || svc.surahCurrentCycle < svc.surahRepeatCount;

    if (svc.playlist.length > 0 && hasMoreCycles) {
      if (!repeatInfinitely) {
        svc.surahCurrentCycle += 1;
      }
      if (!handOffToIndex(svc, 0)) {
        svc._loadAndPlay(0);
      }
      return;
    }

    svc.surahCurrentCycle = 1;
    svc.isPlaying = false;
    svc._playbackIntent = "stopped";
    svc._setState?.("ENDED");
    svc.onEnd?.();
    for (const fn of svc._endListeners) fn();
  }
}
