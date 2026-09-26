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
export const ADHAN_SOURCES = [];

export function getAdhanSource(id) {
  return ADHAN_SOURCES.find((source) => source.id === id) || null;
}

export function hasAdhanSources() {
  return ADHAN_SOURCES.length > 0;
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

export async function removeCachedAdhan(sourceId) {
  const source = getAdhanSource(sourceId);
  const cache = await openCache();
  if (!source || !cache) return false;
  try {
    return await cache.delete(source.url);
  } catch {
    return false;
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

export function stopAdhan() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
}

/** True only when audio actually started; callers decide the silent fallback. */
export async function playAdhan(sourceId, volume = 1) {
  const blob = await adhanBlob(sourceId);
  if (!blob) return false;
  stopAdhan();
  const audio = new Audio(URL.createObjectURL(blob));
  currentAudio = audio;
  audio.volume = Math.max(0, Math.min(1, volume));
  // Revoke once decoded; the element keeps playing from its buffer.
  audio.addEventListener("loadeddata", () => URL.revokeObjectURL(audio.src), { once: true });
  audio.addEventListener("ended", () => {
    if (currentAudio === audio) currentAudio = null;
  });
  try {
    await audio.play();
    return true;
  } catch {
    stopAdhan();
    return false;
  }
}
