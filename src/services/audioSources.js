const TRUSTED_MP3QURAN_HOST = /^server\d+\.mp3quran\.net$/i;

export function isTrustedAudioUrl(url) {
  try {
    const parsed = new URL(String(url || ""));
    if (parsed.protocol !== "https:") return false;

    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname || "/";

    if (host === "everyayah.com" || host === "www.everyayah.com") {
      return path.startsWith("/data/") && /\.mp3$/i.test(path);
    }
    if (host === "download.quranicaudio.com" || host === "mirrors.quranicaudio.com") {
      return /\.mp3$/i.test(path);
    }
    if (host === "audio.qurancdn.com") {
      return /\.mp3$/i.test(path);
    }
    if (host === "verses.quran.com") {
      return /\.mp3$/i.test(path);
    }
    if (host === "files.quranpedia.net") {
      return path.startsWith("/recitations/") && /\.mp3$/i.test(path);
    }
    if (TRUSTED_MP3QURAN_HOST.test(host)) {
      return /\.mp3$/i.test(path);
    }

    return false;
  } catch {
    return false;
  }
}

/* Quran.com per-ayah folders → equivalent EveryAyah mirror folders. */
export const QURANCDN_EVERYAYAH_MAP = {
  "Alafasy/mp3/": "Alafasy_128kbps",
  "Minshawi/Murattal/mp3/": "Minshawy_Murattal_128kbps",
};

export { filterAyahAudioGaps } from "../data/audioAvailability.js";

