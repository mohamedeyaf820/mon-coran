import audioService, { AudioService } from "./audioService";
import { buildSurahAudioPlaylist } from "../utils/audioPlaylist";

const TRUSTED_MP3QURAN_HOST = /^server\d+\.mp3quran\.net$/i;

function isSafeReciterDownloadUrl(url) {
  try {
    const parsed = new URL(String(url || ""));
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname || "/";
    if (host === "download.quranicaudio.com") return /\.mp3$/i.test(path);
    if (TRUSTED_MP3QURAN_HOST.test(host)) return /\.mp3$/i.test(path);
    return false;
  } catch {
    return false;
  }
}

export function buildStationPlaylist(surahNumbers = []) {
  return surahNumbers.flatMap((num) => buildSurahAudioPlaylist(num));
}

export function reciterDownloadUrl(targetReciter, surahNum) {
  if (!targetReciter || targetReciter.cdnType !== "mp3quran-surah") return null;
  const url = AudioService.buildUrl(
    targetReciter.cdn,
    { surah: surahNum },
    targetReciter.cdnType,
  );
  return isSafeReciterDownloadUrl(url) ? url : null;
}

export function playPlaylistWithReciter({ items, reciter, set }) {
  if (!reciter || !Array.isArray(items) || items.length === 0) return false;
  set?.({
    reciter: reciter.id,
    displayMode: "surah",
    currentSurah: items[0]?.surah || 1,
    currentAyah: 1,
    showHome: false,
    showDuas: false,
  });
  audioService.loadPlaylist(items, reciter.cdn, reciter.cdnType || "islamic");
  audioService.play();
  return true;
}
