import SURAHS from "../data/surahs";
import { getWarshSurahVerses } from "../services/warshService";

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

export function normalizeAyahsForAudioPlaylist(ayahs = [], fallbackSurah = null) {
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
      const globalNumber =
        Number(ayah.number) ||
        Number(ayah.globalNumber) ||
        getHafsSurahGlobalStart(surahNumber) + numberInSurah - 1;

      return {
        surah: surahNumber,
        surahNumber,
        ayah: numberInSurah,
        numberInSurah,
        number: globalNumber,
        text: ayah.text || ayah.aya_text || "",
      };
    });
}

export function buildSurahAudioPlaylist(surahNum) {
  const numericSurah = Number(surahNum);
  const surah = SURAHS[numericSurah - 1];
  if (!surah) return [];

  const globalStart = getHafsSurahGlobalStart(numericSurah);
  return Array.from({ length: surah.ayahs }, (_, index) => ({
    surah: numericSurah,
    surahNumber: numericSurah,
    ayah: index + 1,
    numberInSurah: index + 1,
    number: globalStart + index,
  }));
}

export async function buildAudioPlaylistForSurah(surahNum, riwaya = "hafs") {
  const numericSurah = Number(surahNum);
  if (!Number.isFinite(numericSurah) || numericSurah < 1 || numericSurah > 114) {
    return [];
  }

  if (riwaya === "warsh") {
    const verses = await getWarshSurahVerses(numericSurah);
    return normalizeAyahsForAudioPlaylist(verses, numericSurah);
  }

  return buildSurahAudioPlaylist(numericSurah);
}

export async function buildAudioPlaylistForSurahs(surahNums = [], riwaya = "hafs") {
  const playlists = [];
  for (const surahNum of surahNums) {
    playlists.push(...(await buildAudioPlaylistForSurah(surahNum, riwaya)));
  }
  return playlists;
}
