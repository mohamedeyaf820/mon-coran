// Adhan audio: catalogue, offline cache and playback. Sources are entries
// with an audited public URL — the reader hears a preview before choosing,
// and the chosen file is copied into the same Cache Storage bucket the
// recitation downloader uses, so the adhan survives going offline.
//
// Playback deliberately uses a blob URL from the cache (not the remote URL):
// the adhan must sound even when the service worker that would intercept a
// remote <audio src> is not the one currently in control.

export const ADHAN_CACHE_NAME = "mushafplus-audio-v2";

/**
 * { id, fr, en, ar, source, url }
 * `source` credits where the recording comes from and is shown in the picker.
 * URLs are added only after being verified reachable (HTTP 200, audio body).
 */
export const DEFAULT_ADHAN_SOURCE_ID = "prophets-mosque-ejaz215";

export const ADHAN_SOURCES = [
  {
    id: DEFAULT_ADHAN_SOURCE_ID,
    fr: "Mosquée du Prophète",
    en: "The Prophet's Mosque",
    ar: "المسجد النبوي",
    source: "ejaz215 · Wikimedia Commons · CC BY 3.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:33937_ejaz215_call-to-prayer-from-the-prophet-s-mo.ogg",
    url:
      "https://upload.wikimedia.org/wikipedia/commons/transcoded/7/7c/33937_ejaz215_call-to-prayer-from-the-prophet-s-mo.ogg/33937_ejaz215_call-to-prayer-from-the-prophet-s-mo.ogg.mp3",
  },
];

export function getAdhanSource(id) {
  return ADHAN_SOURCES.find((source) => source.id === id) || null;
}

async function openCache() {
  if (typeof caches === "undefined") return null;
  try {
    return await caches.open(ADHAN_CACHE_NAME);
  } catch {
    return null;
  }
}

export async function isAdhanCached(sourceId) {
  const source = getAdhanSource(sourceId);
  const cache = await openCache();
  if (!source || !cache) return false;
  try {
    return Boolean(await cache.match(source.url));
  } catch {
    return false;
  }
}

/** Fetches the file into the audio cache. Returns false when it cannot. */
export async function downloadAdhan(sourceId) {
  const source = getAdhanSource(sourceId);
  const cache = await openCache();
  if (!source || !cache) return false;
  try {
    const cached = await cache.match(source.url);
    if (cached) return true;
    const response = await fetch(source.url, { credentials: "omit", mode: "cors" });
    if (!response.ok) return false;
    await cache.put(source.url, response.clone());
    return true;
  } catch {
    // CORS-refusing hosts still give a usable opaque entry.
    try {
      const response = await fetch(source.url, { credentials: "omit", mode: "no-cors" });
      if (!response.ok && response.type !== "opaque") return false;
      await cache.put(source.url, response);
      return true;
    } catch {
      return false;
    }
  }
}

async function adhanBlob(sourceId) {
  const source = getAdhanSource(sourceId);
  if (!source) return null;
  const cache = await openCache();
  if (cache) {
    try {
      const cached = await cache.match(source.url);
      const blob = cached && (await cached.blob());
      // Opaque entries report size 0 but still decode in an <audio> element.
      if (blob && (blob.size > 0 || blob.type.startsWith("audio"))) return blob;
    } catch {
      // Fall through to the network.
    }
  }
  try {
    const response = await fetch(source.url, { credentials: "omit" });
    if (!response.ok) return null;
    return await response.blob();
  } catch {
    return null;
  }
}

let currentAudio = null;
let currentObjectUrl = "";
let playbackCommand = 0;

function getAudioElement() {
  if (currentAudio) return currentAudio;
  if (typeof Audio === "undefined") return null;
  currentAudio = new Audio();
  currentAudio.preload = "auto";
  if (typeof window !== "undefined") window.addEventListener?.("mushafplus-playback-claim", (event) => {
    if (event.detail?.owner !== "adhan") stopAdhan();
  });
  currentAudio.setAttribute("playsinline", "");
  currentAudio.addEventListener("ended", () => {
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = "";
    }
  });
  return currentAudio;
}

export function stopAdhan() {
  playbackCommand++;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = "";
  }
}

/** True only when audio actually started; callers decide the silent fallback. */
export async function playAdhan(sourceId, volume = 1) {
  const source = getAdhanSource(sourceId || DEFAULT_ADHAN_SOURCE_ID);
  const audio = getAudioElement();
  if (!source || !audio) return false;
  stopAdhan();
  const command = playbackCommand;
  if (typeof window !== "undefined") window.dispatchEvent?.(new CustomEvent("mushafplus-playback-claim", { detail: { owner: "adhan" } }));
  audio.volume = Math.max(0, Math.min(1, volume));
  // Keep the first play() in the click/timer task. On iOS a fetch or any other
  // await before play() spends the user activation; on an installed PWA the
  // service worker serves this same URL from Cache Storage when offline.
  if (audio.src !== source.url) audio.src = source.url;
  try {
    await audio.play();
    return command === playbackCommand;
  } catch {
    if (command !== playbackCommand) return false;
    // A page that is not yet controlled by the service worker can still use a
    // downloaded response directly. This fallback is also useful after a
    // transient CDN failure; the persistent element keeps any prior unlock.
    const blob = await adhanBlob(source.id);
    if (command !== playbackCommand) return false;
    if (!blob) {
      stopAdhan();
      return false;
    }
    currentObjectUrl = URL.createObjectURL(blob);
    audio.src = currentObjectUrl;
    try {
      await audio.play();
      return command === playbackCommand;
    } catch {
      if (command === playbackCommand) stopAdhan();
      return false;
    }
  }
}
