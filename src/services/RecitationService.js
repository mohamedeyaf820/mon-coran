import audioService, { AudioService } from "./audioService.js";
import {
  buildAudioPlaylistForSurah,
  buildAudioPlaylistForSurahs,
  buildSurahAudioPlaylist,
} from "../utils/audioPlaylist.js";
import { validateReciterAudioConfig } from "../data/reciters.js";

export function buildStationPlaylist(surahNumbers = [], cdnType = "everyayah") {
  const numbers = Array.isArray(surahNumbers) ? surahNumbers : [];
  if (AudioService.isSurahStreamCdn(cdnType)) {
    return numbers.flatMap((num) => buildSurahAudioPlaylist(num).slice(0, 1));
  }
  return numbers.flatMap((num) => buildSurahAudioPlaylist(num));
}

export async function buildStationPlaylistForRiwaya(
  surahNumbers = [],
  riwaya = "hafs",
  cdnType = "everyayah",
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
  cdnType = "everyayah",
) {
  if (AudioService.isSurahStreamCdn(cdnType)) {
    return buildSurahAudioPlaylist(surahNum).slice(0, 1);
  }
  if (riwaya === "hafs") return buildSurahAudioPlaylist(surahNum);
  return buildAudioPlaylistForSurah(surahNum, riwaya);
}

export async function buildContinuousRadioPlaylist(
  startSurah = 1,
  riwaya = "hafs",
  cdnType = "everyayah",
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
  audioService.loadPlaylist(items, reciter.cdn, reciter.cdnType || "everyayah");
  audioService.play();
  return true;
}
