import SURAHS from "../data/surahs.js";
/** Media controls belong to the persistent engine, independent of React. */
export function bindEngineMediaSession(engine) {
  const session = typeof navigator !== "undefined" ? navigator.mediaSession : null;
  if (!session) return () => {};
  const actions = {
    play: () => engine.resume(), pause: () => engine.pause(), stop: () => engine.stop(),
    nexttrack: () => engine.next(), previoustrack: () => engine.prev(),
    seekto: ({ seekTime }) => { if (Number.isFinite(seekTime)) engine.seek(seekTime); },
    seekbackward: ({ seekOffset = 10 }) => engine.seek(Math.max(0, engine.currentTime - seekOffset)),
    seekforward: ({ seekOffset = 10 }) => engine.seek(Math.min(engine.duration, engine.currentTime + seekOffset)),
  };
  for (const [action, handler] of Object.entries(actions)) {
    try { session.setActionHandler(action, handler); } catch { /* Optional action. */ }
  }
  return () => {
    for (const action of Object.keys(actions)) {
      try { session.setActionHandler(action, null); } catch { /* Optional action. */ }
    }
  };
}

export function syncEngineMediaSession(engine) {
  const session = typeof navigator !== "undefined" ? navigator.mediaSession : null;
  if (!session) return;
  try {
    session.playbackState = engine.state === "IDLE" || engine.state === "ENDED"
      ? "none" : engine.audio.paused ? "paused" : "playing";
    const duration = engine.duration;
    if (Number.isFinite(duration) && duration > 0) session.setPositionState?.({
      duration, position: Math.max(0, Math.min(duration, engine.currentTime)), playbackRate: engine.playbackRate,
    });
    else session.setPositionState?.();
  } catch { /* Unsupported API or metadata not available yet. */ }
}

export function updateEngineMetadata(engine) {
  const session = typeof navigator !== "undefined" ? navigator.mediaSession : null;
  if (!session || typeof MediaMetadata === "undefined") return;
  const { lang = "fr", artist = "" } = engine._mediaContext || {};
  const surah = SURAHS.find(item => item.n === engine.currentAyah?.surah);
  const name = lang === "ar" ? surah?.ar : lang === "en" ? surah?.en : surah?.fr;
  const ayah = engine.currentAyah?.ayah;
  try {
    session.metadata = new MediaMetadata({
      title: `${name || "MushafPlus"}${ayah ? ` · ${ayah}` : ""}`,
      artist, album: "MushafPlus", artwork: [{ src: "/logo-512.png", sizes: "512x512", type: "image/png" }],
    });
  } catch { /* Optional metadata API. */ }
}
