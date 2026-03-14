import SURAHS from "../data/surahs";

const SURAH_STARTS = (() => {
  let offset = 0;
  return SURAHS.map((surah) => {
    const start = offset + 1;
    offset += surah.ayahs;
    return start;
  });
})();

export function buildSurahAudioPlaylist(surahNum) {
  const surah = SURAHS[surahNum - 1];
  if (!surah) return [];

  const globalStart = SURAH_STARTS[surahNum - 1] || 1;
  return Array.from({ length: surah.ayahs }, (_, index) => ({
    surah: surahNum,
    ayah: index + 1,
    number: globalStart + index,
  }));
}
