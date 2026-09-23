import audioService, { AudioService } from "./audioService.js";
import {
  buildAudioPlaylistForSurah,
  buildAudioPlaylistForSurahs,
  buildSurahAudioPlaylist,
} from "../utils/audioPlaylist.js";
import { validateReciterAudioConfig } from "../data/reciters.js";

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

export function buildStationPlaylist(surahNumbers = [], cdnType = "islamic") {
  const numbers = Array.isArray(surahNumbers) ? surahNumbers : [];
  if (AudioService.isSurahStreamCdn(cdnType)) {
    return numbers.flatMap((num) => buildSurahAudioPlaylist(num).slice(0, 1));
  }
  return numbers.flatMap((num) => buildSurahAudioPlaylist(num));
}

export async function buildStationPlaylistForRiwaya(
  surahNumbers = [],
  riwaya = "hafs",
  cdnType = "islamic",
) {
  if (AudioService.isSurahStreamCdn(cdnType)) {
    return buildStationPlaylist(surahNumbers, cdnType);
  }
  if (riwaya === "hafs") return buildStationPlaylist(surahNumbers, cdnType);
  return buildAudioPlaylistForSurahs(surahNumbers, riwaya);
}

export async function buildSurahPlaylistForRiwaya(
  surahNum,
  riwaya = "hafs",
  cdnType = "islamic",
) {
  if (AudioService.isSurahStreamCdn(cdnType)) {
    return buildSurahAudioPlaylist(surahNum).slice(0, 1);
  }
  if (riwaya === "hafs") return buildSurahAudioPlaylist(surahNum);
  return buildAudioPlaylistForSurah(surahNum, riwaya);
}

export function reciterDownloadUrl(targetReciter, surahNum) {
  if (
    !targetReciter ||
    targetReciter.cdnType !== "mp3quran-surah" ||
    !validateReciterAudioConfig(targetReciter).valid
  ) {
    return null;
  }
  const url = AudioService.buildUrl(
    targetReciter.cdn,
    { surah: surahNum },
    targetReciter.cdnType,
  );
  return isSafeReciterDownloadUrl(url) ? url : null;
}

export async function buildContinuousRadioPlaylist(
  startSurah = 1,
  riwaya = "hafs",
  cdnType = "islamic",
) {
  const start = Math.max(1, Math.min(114, Math.trunc(Number(startSurah)) || 1));
  const surahNumbers = [];
  for (let i = start; i <= 114; i++) surahNumbers.push(i);
  if (start > 1) {
    for (let i = 1; i < start; i++) surahNumbers.push(i);
  }
  return buildStationPlaylistForRiwaya(surahNumbers, riwaya, cdnType);
}

export function playPlaylistWithReciter({ items, reciter, set }) {
  if (
    !reciter ||
    !Array.isArray(items) ||
    items.length === 0 ||
    !validateReciterAudioConfig(reciter).valid
  ) {
    return false;
  }
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
