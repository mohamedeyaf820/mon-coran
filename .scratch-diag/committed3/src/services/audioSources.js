const TRUSTED_MP3QURAN_HOST = /^server\d+\.mp3quran\.net$/i;

export function isTrustedAudioUrl(url) {
  try {
    const parsed = new URL(String(url || ""));
    if (parsed.protocol !== "https:") return false;

    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname || "/";

    if (host === "cdn.islamic.network") {
      return path.startsWith("/quran/audio/") && /\.mp3$/i.test(path);
    }
    if (host === "everyayah.com" || host === "www.everyayah.com") {
      return path.startsWith("/data/") && /\.mp3$/i.test(path);
    }
    if (host === "download.quranicaudio.com") {
      return /\.mp3$/i.test(path);
    }
    if (host === "audio.qurancdn.com") {
      return /\.mp3$/i.test(path);
    }
    if (host === "verses.quran.com") {
      return /\.mp3$/i.test(path);
    }
    if (TRUSTED_MP3QURAN_HOST.test(host)) {
      return /\.mp3$/i.test(path);
    }

    return false;
  } catch {
    return false;
  }
}

export const ISLAMIC_FALLBACK_MAP = {
  "ar.husary": "Husary_128kbps",
  "ar.alafasy": "Alafasy_128kbps",
  "ar.abdulbasitmurattal": "Abdul_Basit_Murattal_192kbps",
  "ar.minshawi": "Minshawy_Murattal_128kbps",
  "ar.shaatree": "Abu_Bakr_Ash-Shaatree_128kbps",
  "ar.hudhaify": "Hudhaify_128kbps",
  "ar.ajamy": "Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net",
  "ar.ghamadi": "Ghamadi_40kbps",
  "ar.muaiqly": "MaherAlMuaiqly128kbps",
};

