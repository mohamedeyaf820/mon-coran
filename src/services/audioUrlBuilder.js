/**
 * URL and identity helpers shared by the player and the downloader.
 * Kept out of AudioService so both paths provably request the same files.
 */

import { QURANCDN_EVERYAYAH_MAP } from "./audioSources.js";

const pad3 = (n) => String(n).padStart(3, "0");

export function isSurahStreamCdn(cdnType = "everyayah") {
  return cdnType === "mp3quran-surah";
}

export function normalizePlaylistAyahs(ayahs, cdnType = "everyayah") {
  if (!Array.isArray(ayahs)) return [];
  if (!isSurahStreamCdn(cdnType)) return ayahs;

  const seenSurahs = new Set();
  return ayahs.reduce((acc, ayah) => {
    const surah = ayah?.surah || ayah?.surahNumber;
    if (!surah || seenSurahs.has(surah)) return acc;
    seenSurahs.add(surah);
    acc.push({
      ...ayah,
      surah,
      ayah: null,
      numberInSurah: null,
    });
    return acc;
  }, []);
}

/** Per-ayah CDN files are keyed on the Hafs verse, never the displayed
 *  Warsh number — except 'quranpedia', which is riwaya-numbered. */
export function hafsFileNumber(ayah) {
  if (typeof ayah !== "object") return Number(ayah) || null;
  return Number(ayah.hafsNumber ?? ayah.numberInSurah ?? ayah.ayah) || null;
}

export function buildUrl(reciterCdn, ayah, cdnType = "everyayah") {
  const isObject = typeof ayah === "object" && ayah !== null;
  const surah = (isObject && (ayah.surah || ayah.surahNumber)) || 1;
  if (isSurahStreamCdn(cdnType)) {
    return `${reciterCdn}${pad3(surah)}.mp3`;
  }
  const number =
    cdnType === "quranpedia"
      ? Number(isObject ? (ayah.ayah ?? ayah.numberInSurah ?? ayah) : ayah) || 1
      : hafsFileNumber(ayah) || 1;
  const file = `${pad3(surah)}${pad3(number)}.mp3`;
  if (cdnType === "quranpedia") {
    return `https://files.quranpedia.net/recitations/${reciterCdn}/${file}`;
  }
  if (cdnType === "quran-cdn") {
    return `https://audio.qurancdn.com/${reciterCdn}${file}`;
  }
  return `https://everyayah.com/data/${reciterCdn}/${file}`;
}

export function buildUrlCandidates(reciterCdn, ayah, cdnType = "everyayah") {
  const primary = buildUrl(reciterCdn, ayah, cdnType);
  if (cdnType === "everyayah") {
    const mirror = primary.includes("://everyayah.com/")
      ? primary.replace("://everyayah.com/", "://www.everyayah.com/")
      : primary.replace("://www.everyayah.com/", "://everyayah.com/");
    return [...new Set([primary, mirror])];
  }
  if (cdnType === "quran-cdn") {
    const fallbackFolder = QURANCDN_EVERYAYAH_MAP[reciterCdn];
    return fallbackFolder
      ? [primary, buildUrl(fallbackFolder, ayah, "everyayah")]
      : [primary];
  }
  if (!isSurahStreamCdn(cdnType)) return [primary];

  const surah = typeof ayah === "object" ? ayah.surah || ayah.surahNumber || 1 : 1;
  const unpadded = `${reciterCdn}${Number(surah)}.mp3`;
  return [...new Set([primary, unpadded])];
}

export function withQuranComPrimary(candidates, timing) {
  const quranComUrl =
    timing &&
    Array.isArray(timing.segments) &&
    timing.segments.length > 0 &&
    typeof timing.url === "string"
      ? timing.url
      : null;
  return quranComUrl ? [...new Set([quranComUrl, ...candidates])] : candidates;
}

export function buildPlaylistSignature(ayahs, reciterCdn, cdnType = "everyayah") {
  const base = `${cdnType}:${reciterCdn || ""}`;
  const preparedAyahs = normalizePlaylistAyahs(ayahs, cdnType);
  if (!Array.isArray(preparedAyahs) || preparedAyahs.length === 0) return base;
  return `${base}|${preparedAyahs
    .map((ayah) => {
      const surah = ayah.surah || ayah.surahNumber || 0;
      const ayahNum = ayah.ayah || ayah.numberInSurah || 0;
      const globalNum = ayah.number || ayah.globalNumber || 0;
      return `${surah}:${ayahNum}:${globalNum}`;
    })
    .join("|")}`;
}

export function buildLatencyKey(reciterCdn, cdnType = "everyayah") {
  return `${cdnType || "everyayah"}:${reciterCdn || ""}`;
}
