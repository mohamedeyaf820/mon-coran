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
      const hafsNumber = isWarsh
        ? hafsNumbersForAyah({ surah: surahNumber, numberInSurah }, "warsh")?.[0] ?? null
        : numberInSurah;
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
    const hafsNumber =
      hafsNumbersForAyah({ surah: numericSurah, numberInSurah: warshAyah }, "warsh")?.[0] ?? null;
    return {
      surah: numericSurah,
      surahNumber: numericSurah,
      ayah: warshAyah,
      numberInSurah: warshAyah,
      warshNumber: warshAyah,
      hafsNumber,
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
