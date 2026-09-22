import SURAHS from "../data/surahs.js";
import {
  getWarshSurahAyahCount,
  hafsNumbersForAyah,
} from "../constants/warshSource.js";

const SURAH_STARTS = (() => {
  let offset = 0;
  return SURAHS.map((surah) => {
    const start = offset + 1;
    offset += surah.ayahs;
    return start;
  });
})();

export function getHafsSurahGlobalStart(surahNum) {
  return SURAH_STARTS[Number(surahNum) - 1] || 1;
}

export function normalizeAyahsForAudioPlaylist(ayahs = [], fallbackSurah = null, riwaya = "hafs") {
  const isWarsh = riwaya === "warsh";
  return (Array.isArray(ayahs) ? ayahs : [])
    .filter(Boolean)
    .map((ayah, index) => {
      const surahNumber =
        Number(ayah.surahNumber) ||
        Number(ayah.surah?.number) ||
        Number(ayah.surah) ||
        Number(fallbackSurah) ||
        1;
      const numberInSurah =
        Number(ayah.numberInSurah) ||
        Number(ayah.ayahNumber) ||
        Number(ayah.ayah) ||
        index + 1;
      // Warsh positions are Madinah-mushaf numbers: the Hafs (quran.com) global
      // number every audio CDN and timing feed is keyed on must come from the
      // Warsh-Hafs mapping, never from the raw numberInSurah.
      const hafsNumbers = isWarsh
        ? hafsNumbersForAyah({ surah: surahNumber, numberInSurah }, "warsh") ?? []
        : [numberInSurah];
      const hafsNumber = hafsNumbers[0] ?? null;
      const mappedGlobalNumber =
        hafsNumber === null
          ? null
          : getHafsSurahGlobalStart(surahNumber) + hafsNumber - 1;
      const globalNumber = isWarsh
        ? mappedGlobalNumber
        : Number(ayah.number) || Number(ayah.globalNumber) || mappedGlobalNumber;

      return {
        surah: surahNumber,
        surahNumber,
        ayah: numberInSurah,
        numberInSurah,
        number: globalNumber,
        text: ayah.text || ayah.aya_text || "",
        ...(isWarsh
          ? {
              warshNumber: numberInSurah,
              hafsNumber,
              hafsNumbers,
              riwaya: "warsh",
            }
          : {}),
      };
    });
}

export function buildSurahAudioPlaylist(surahNum, riwaya = "hafs") {
  const numericSurah = Number(surahNum);
  const surah = SURAHS[numericSurah - 1];
  if (!surah) return [];

  const globalStart = getHafsSurahGlobalStart(numericSurah);
  const warshTotal = riwaya === "warsh" ? getWarshSurahAyahCount(numericSurah) : 0;

  if (!warshTotal) {
    return Array.from({ length: surah.ayahs }, (_, index) => ({
      surah: numericSurah,
      surahNumber: numericSurah,
      ayah: index + 1,
      numberInSurah: index + 1,
      number: globalStart + index,
    }));
  }

  // Warsh: one item per Warsh ayah, positioned and numbered the way the reader
  // shows it, with the Hafs verse it recites carried alongside for the
  // Hafs-keyed audio CDNs and word-timing feeds. A surah whose total cannot be
  // derived from the mapping (0) keeps the Hafs enumeration above rather than
  // inventing a Quranic verse count.
  return Array.from({ length: warshTotal }, (_, index) => {
    const warshAyah = index + 1;
    const hafsNumbers =
      hafsNumbersForAyah({ surah: numericSurah, numberInSurah: warshAyah }, "warsh") ?? [];
    const hafsNumber = hafsNumbers[0] ?? null;
    return {
      surah: numericSurah,
      surahNumber: numericSurah,
      ayah: warshAyah,
      numberInSurah: warshAyah,
      warshNumber: warshAyah,
      hafsNumber,
      hafsNumbers,
      riwaya: "warsh",
      // `null` only when the mapping cannot place this verse: no audio is
      // honest, a neighbouring verse's audio would not be.
      number: hafsNumber === null ? null : globalStart + hafsNumber - 1,
    };
  });
}

export async function buildAudioPlaylistForSurah(surahNum, riwaya = "hafs") {
  const numericSurah = Number(surahNum);
  if (!Number.isFinite(numericSurah) || numericSurah < 1 || numericSurah > 114) {
    return [];
  }

  // Audio URLs only need the canonical surah/ayah coordinates, and those
  // coordinates differ by riwaya (Warsh numbers 6214 ayahs across 114 surahs,
  // Hafs 6236). The Warsh-Hafs mapping is bundled data, so the Warsh playlist
  // is built synchronously here without reintroducing the IndexedDB read that
  // used to delay the first audio byte. Text enrichment stays in the reader
  // data pipeline.
  return buildSurahAudioPlaylist(numericSurah, riwaya);
}

export async function buildAudioPlaylistForSurahs(surahNums = [], riwaya = "hafs") {
  return (Array.isArray(surahNums) ? surahNums : []).flatMap((surahNum) =>
    buildSurahAudioPlaylist(surahNum, riwaya),
  );
}

/**
 * Whether two playlists recite the same verses in the same order. An A-B range
 * marks positions, so it only survives a rebuild that keeps those positions.
 */
export function keepsSameAudioVerseSet(previous, next) {
  if (!previous?.length || previous.length !== next?.length) return false;
  return previous.every(
    (item, index) => item.surah === next[index].surah && item.ayah === next[index].ayah,
  );
}

/**
 * Re-key a playlist onto the audio files the CDN actually serves.
 *
 * EveryAyah and the Quran.com CDN cut their mp3s at the Hafs verse stops, while a
 * Warsh mushaf breaks the same text into different verses (6214 against 6236, in
 * 18 surahs differently). Walking displayed verses and asking each for the first
 * Hafs file it recites therefore plays some audio twice — the two Warsh verses
 * inside one Hafs verse, 57 times over the mushaf — and never plays the second
 * file of a Hafs pair a Warsh verse spans, losing 78 verses of recitation.
 * Expanding each displayed verse across every file it covers, and skipping a file
 * the previous entry already plays, leaves exactly one pass over the surah.
 *
 * QuranPedia is left alone: its files carry the riwaya's own numbering, so one
 * entry per displayed verse is already one entry per file. The same is true of a
 * full-surah stream, which has one file per surah.
 */
export function expandAyahsToAudioFiles(ayahs, cdnType = "everyayah") {
  if (!Array.isArray(ayahs)) return [];
  if (cdnType === "quranpedia" || cdnType === "mp3quran-surah") return ayahs;

  let previousFile = null;
  let changed = false;
  const expanded = [];
  for (const ayah of ayahs) {
    if (ayah?.riwaya !== "warsh") {
      expanded.push(ayah);
      previousFile = null;
      continue;
    }
    const surah = ayah.surah || ayah.surahNumber || 1;
    const fallback = Number(ayah.hafsNumber ?? ayah.numberInSurah ?? ayah.ayah) || null;
    const files = ayah.hafsNumbers?.length ? ayah.hafsNumbers : [fallback];
    let kept = 0;
    for (const hafsNumber of files) {
      const fileKey = `${surah}:${hafsNumber}`;
      if (!hafsNumber || fileKey === previousFile) {
        changed = true;
        continue;
      }
      previousFile = fileKey;
      kept += 1;
      expanded.push(
        hafsNumber === ayah.hafsNumber && files.length === 1
          ? ayah
          : {
              ...ayah,
              hafsNumber,
              // This entry is one file now. Keeping the whole span would
              // re-expand it on every playlist rebuild, so a reciter change
              // mid-playback would double the list each time.
              hafsNumbers: [hafsNumber],
              number: getHafsSurahGlobalStart(surah) + hafsNumber - 1,
            },
      );
    }
    if (kept !== 1 || files.length !== 1) changed = true;
  }
  return changed ? expanded : ayahs;
}
