/**
 * Background preload pool for the audio service.
 *
 * Keeps the next verses warm on a small pool of detached Audio elements so
 * verse transitions do not wait on the network. The pool lives on the
 * AudioService instance (`_preloadPool`, `_preloadAudio`, `_maxPreloadPool`)
 * so stop/new-playlist paths can release it from one place.
 */

import { isTrustedAudioUrl } from "./audioSources.js";
import { getAdaptiveAudioPreloadCount } from "../utils/networkPolicy.js";

/**
 * Preload the next track in background using a separate Audio element.
 */
export function preloadTrack(svc, url) {
  if (!url) return;
  if (!isTrustedAudioUrl(url)) return;
  if (svc._preloadPool.some((p) => p.url === url)) return;
  // Keep the next verse warm while the PWA is locked — that is the verse the
  // synchronous hand-off will start with no time to spare. Keep the pool
  // bounded to one entry there so the preload never competes with the active
  // stream for bandwidth (iOS suspends long hidden downloads).
  if (typeof document !== "undefined" && document.visibilityState === "hidden" &&
      svc._preloadPool.length >= Math.max(1, svc._maxPreloadPool)) {
    return;
  }

  try {
    const preloadAudio = new Audio();
    preloadAudio.preload = "auto";
    const entry = { url, audio: preloadAudio };
    preloadAudio.addEventListener(
      "error",
      () => {
        // A failed preload must not hold the URL: the pool dedupes on it,
        // which would block any later retry of the same track.
        releasePreloadEntry(entry);
        const i = svc._preloadPool.indexOf(entry);
        if (i !== -1) svc._preloadPool.splice(i, 1);
      },
      { once: true },
    );
    preloadAudio.src = url;
    preloadAudio.load();

    svc._preloadAudio = preloadAudio;
    svc._preloadPool.push(entry);

    while (svc._preloadPool.length > svc._maxPreloadPool) {
      releasePreloadEntry(svc._preloadPool.shift());
    }
  } catch {
    // Preload is best-effort
  }
}

function releasePreloadEntry(entry) {
  if (entry?.audio) {
    entry.audio.removeAttribute("src");
    entry.audio.load();
  }
}

export function releasePreloadPool(svc) {
  for (const item of svc._preloadPool) {
    releasePreloadEntry(item);
  }
  svc._preloadPool = [];
  svc._preloadAudio = null;
}

export function preloadAhead(svc, startIndex, count = 2) {
  if (!Array.isArray(svc.playlist) || svc.playlist.length === 0) return;
  const hidden = typeof document !== "undefined" && document.visibilityState === "hidden";
  // One warm track while hidden: enough for a gapless hand-off at the verse
  // boundary, small enough not to starve the verse being recited.
  const adaptiveCount = Math.min(
    count,
    getAdaptiveAudioPreloadCount(),
    hidden ? 1 : count,
  );
  svc._maxPreloadPool = adaptiveCount;
  if (adaptiveCount === 0) {
    releasePreloadPool(svc);
    return;
  }
  for (let i = 0; i < adaptiveCount; i++) {
    const idx = startIndex + i;
    if (idx >= 0 && idx < svc.playlist.length) {
      preloadTrack(svc, svc.playlist[idx].url);
    }
  }
}
