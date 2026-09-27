/**
 * Verse-boundary hand-off for background recitation.
 *
 * A verse boundary is the one moment the browser still honours a `play()` with
 * the page hidden: the `ended` event carries an activation of its own, but only
 * while nothing awaits before that `play()`. The normal loader awaits the
 * basmala pre-roll and then the whole load/retry chain, so it reaches `play()`
 * with the activation already spent — Android refuses it (background media
 * suspension) and iOS refuses it too (WebKit bug 261858, standalone PWA). The
 * recitation then dies on the verse that was playing when the screen went off.
 *
 * `handOffToIndex` therefore performs the whole swap synchronously — `src`,
 * `load()` and `play()` inside the `ended` task, nothing awaited in between —
 * and declines the cases it cannot serve (basmala pre-roll owns the element, a
 * surah stream still resolves its target ayah after loading, no trusted URL),
 * leaving the caller on its resilient asynchronous path.
 *
 * State stays on the AudioService instance (`playlist`, `playlistIndex`,
 * `_playbackIntent`, `_handOffInFlight`, `_pendingBackgroundIndex`, …); this
 * module only drives it, the same way audioPreload and reciterLatency do.
 */

import { isTrustedAudioUrl } from "./audioSources.js";
import { isSurahStreamCdn } from "./audioUrlBuilder.js";
import { preparePlaybackSession } from "./audioSession.js";

/**
 * Advance to `index` while still inside the `ended` event task.
 *
 * Returns false when this path cannot apply; the caller then keeps the normal
 * asynchronous route. Everything that can wait — notifications, preloads,
 * retries — runs *after* `play()`.
 */
export function handOffToIndex(svc, index) {
  if (index < 0 || index >= svc.playlist.length) return false;
  const item = svc.playlist[index];
  if (!item) return false;
  // The pre-roll owns the element while active and needs its own async load.
  if (svc._basmala.active) return false;
  // A surah stream resolves its target ayah from metadata after loading.
  if (isSurahStreamCdn(svc._currentCdnType)) return false;
  const candidates =
    Array.isArray(item.urls) && item.urls.length > 0 ? item.urls : [item.url];
  const url = candidates.find((candidate) => isTrustedAudioUrl(candidate));
  if (!url) return false;

  preparePlaybackSession(svc._audioCtx);

  // Any pending load belongs to the verse we are leaving.
  svc._cancelPendingLoad?.();
  svc._cancelPendingLoad = null;
  svc._clearLoadTimeout();
  svc._loadRequestId += 1;
  svc._clearBackgroundRetry();
  svc._pendingBackgroundIndex = null;

  svc.playlistIndex = index;
  svc._oneShotMode = false;
  svc._pendingSeekSec = null;
  svc.currentAyah = item;
  svc.memCurrentRepeat = 0;
  if (svc.tartilMode) {
    const speed = svc._tartilSpeed(item);
    if (speed) svc.audio.playbackRate = speed;
  }
  svc._playRequestedAt =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  svc._hasCapturedLatency = false;

  /* ── synchronous section: no `await`, no promise hop before play() ── */
  svc._handOffInFlight = true;
  if (svc.audio.src !== url || svc.audio.readyState < 2) {
    svc.audio.preload = "auto";
    svc.audio.src = url;
    svc.audio.load();
  }
  svc._playbackIntent = "playing";
  const started = svc.audio.play();
  /* ── end of synchronous section ── */

  item.url = url;
  svc.isPlaying = true;
  svc.onNetworkState?.("playing");
  svc._notifyPlay(item);
  svc._emitAyahChange(item);
  svc._preloadAhead(index + 1, 3);

  if (started && typeof started.then === "function") {
    started.catch(() => {
      // The hand-off itself was refused (or its source failed): hand the verse
      // back to the resilient path, which retries, parks the index and
      // re-asserts the session.
      svc._handOffInFlight = false;
      if (svc.playlistIndex !== index) return;
      svc._loadAndPlay(index);
    });
  }
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

  // Normal mode: advance playlist. The hand-off keeps the verse boundary
  // inside this task so the next `play()` still carries the activation the
  // `ended` event granted; the async path stays as the fallback.
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
    svc.onEnd?.();
    for (const fn of svc._endListeners) fn();
  }
}
