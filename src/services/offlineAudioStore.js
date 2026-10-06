/** Explicit audio downloads. Stable cache identity survives shell updates. */
export const OFFLINE_AUDIO_CACHE_NAME = "mushafplus-audio-v2";

// Validate readable, complete MP3 bodies, never opaque/partial/error pages.
// Decode success remains the native media element's responsibility.
export async function inspectAudioResponse(response) {
  if (!response || response.type === "opaque" || response.status !== 200) return null;
  const mime = (response.headers.get("content-type") || "").split(";")[0].trim();
  if (!/^(audio\/(mpeg|mp3)|application\/octet-stream)$/i.test(mime)) return null;
  try {
    const blob = await response.clone().blob();
    const length = Number(response.headers.get("content-length"));
    if (blob.size < 10 || (length > 0 && !response.headers.get("content-encoding") && length !== blob.size)) return null;
    const bytes = new Uint8Array(await blob.slice(0, 4096).arrayBuffer());
    let offset = 0;
    if (bytes[0] === 73 && bytes[1] === 68 && bytes[2] === 51) {
      if (bytes[3] < 2 || bytes[3] > 4 || bytes.slice(6, 10).some(n => n > 127)) return null;
      offset = 10 + ((bytes[5] & 16) ? 10 : 0) + ((bytes[6] << 21) | (bytes[7] << 14) | (bytes[8] << 7) | bytes[9]);
      if (offset + 4 > blob.size) return null;
    }
    // Walk complete MPEG Layer III frames. A valid first frame does not prove
    // a truncated download is complete. Slice chunks to avoid copying a whole
    // long-form surah into another ArrayBuffer.
    let frames = 0;
    let chunk = new Uint8Array();
    let chunkStart = -1;
    const rates1 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
    const rates2 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
    while (offset < blob.size) {
      if (offset < chunkStart || offset + 4 > chunkStart + chunk.length) {
        chunkStart = offset;
        chunk = new Uint8Array(await blob.slice(offset, offset + 65536).arrayBuffer());
      }
      const i = offset - chunkStart;
      // ID3v1 is an optional trailing 128-byte tag.
      if (blob.size - offset === 128 && chunk[i] === 84 && chunk[i + 1] === 65 && chunk[i + 2] === 71) { offset = blob.size; break; }
      const a = chunk[i], b = chunk[i + 1], c = chunk[i + 2];
      const version = (b >> 3) & 3;
      const bitrateIndex = c >> 4;
      const frequencyIndex = (c >> 2) & 3;
      if (a !== 255 || (b & 224) !== 224 || version === 1 || ((b >> 1) & 3) !== 1 ||
          !bitrateIndex || bitrateIndex === 15 || frequencyIndex === 3) return null;
      const bitrate = (version === 3 ? rates1 : rates2)[bitrateIndex] * 1000;
      const frequency = [44100, 48000, 32000][frequencyIndex] / (version === 3 ? 1 : version === 2 ? 2 : 4);
      const frameSize = Math.floor((version === 3 ? 144 : 72) * bitrate / frequency) + ((c >> 1) & 1);
      if (offset + frameSize > blob.size) return null;
      offset += frameSize;
      frames++;
    }
    if (frames < 2 || offset !== blob.size) return null;
    return { blob: blob.slice(0, blob.size, "audio/mpeg"), bytes: blob.size };
  } catch { return null; }
}

export async function findOfflineAudio(urls) {
  if (typeof caches === "undefined") return null;
  try {
    const cache = await caches.open(OFFLINE_AUDIO_CACHE_NAME);
    for (const url of urls) {
      const checked = await inspectAudioResponse(await cache.match(url, { ignoreVary: true }));
      if (checked) return { ...checked, originalUrl: url };
    }
  } catch { /* Online playback is still possible with unavailable storage. */ }
  return null;
}

// `known` is the outcome of a lookup made earlier: a hit, or `null` for a miss.
// With it, no storage is read here, which keeps the verse boundary free of I/O
// (a locked phone may freeze the page between two tracks). Left `undefined`,
// the lookup runs now.
export async function resolveAudioSource(urls, known) {
  const local = known === undefined ? await findOfflineAudio(urls) : known;
  if (local) return { url: URL.createObjectURL(local.blob), originalUrl: local.originalUrl, local: true };
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    const error = new Error("Audio unavailable offline");
    error.code = "OFFLINE_AUDIO_MISSING";
    throw error;
  }
  return { url: urls[0], originalUrl: urls[0], local: false };
}
