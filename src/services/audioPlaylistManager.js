/**
 * Audio playlist and URL resolution manager for AudioService.
 * Centralises CDN URL resolution, fallbacks, and playlist normalization.
 */

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

export function isSurahStreamCdn(cdnType = "islamic") {
  return cdnType === "mp3quran-surah";
}

export function normalizePlaylistAyahs(ayahs, cdnType = "islamic") {
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

export function buildAudioUrl(reciterCdn, ayah, cdnType = "islamic") {
  if (isSurahStreamCdn(cdnType)) {
    const surah = typeof ayah === "object" ? ayah.surah || ayah.surahNumber || 1 : 1;
    const s = String(surah).padStart(3, "0");
    return `${reciterCdn}${s}.mp3`;
  }
  if (cdnType === "everyayah") {
    const surah = typeof ayah === "object" ? ayah.surah : 1;
    const num =
      typeof ayah === "object" ? ayah.numberInSurah || ayah.ayah || 1 : ayah;
    const s = String(surah).padStart(3, "0");
    const a = String(num).padStart(3, "0");
    return `https://everyayah.com/data/${reciterCdn}/${s}${a}.mp3`;
  }
  // Islamic Network: global ayah number
  const globalNum = typeof ayah === "object" ? ayah.number : ayah;
  return `https://cdn.islamic.network/quran/audio/128/${reciterCdn}/${globalNum}.mp3`;
}

export function buildAudioUrlCandidates(reciterCdn, ayah, cdnType = "islamic") {
  const primary = buildAudioUrl(reciterCdn, ayah, cdnType);
  if (cdnType === "everyayah") {
    const mirror = primary.includes("://everyayah.com/")
      ? primary.replace("://everyayah.com/", "://www.everyayah.com/")
      : primary.replace("://www.everyayah.com/", "://everyayah.com/");
    return [...new Set([primary, mirror])];
  }
  if (cdnType === "islamic") {
    const candidates = [primary];
    const fallbackFolder = ISLAMIC_FALLBACK_MAP[reciterCdn];
    const surah = typeof ayah === "object" ? ayah.surah || ayah.surahNumber : null;
    const ayahNum = typeof ayah === "object" ? ayah.numberInSurah || ayah.ayahNumber : null;
    if (fallbackFolder && surah && ayahNum) {
      const s = String(surah).padStart(3, "0");
      const a = String(ayahNum).padStart(3, "0");
      candidates.push(`https://everyayah.com/data/${fallbackFolder}/${s}${a}.mp3`);
    }
    return candidates;
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

export function buildPlaylistSignature(ayahs, reciterCdn, cdnType = "islamic") {
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

export function buildLatencyKey(reciterCdn, cdnType = "islamic") {
  return `${cdnType || "islamic"}:${reciterCdn || ""}`;
}
