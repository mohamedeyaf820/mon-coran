import { useMemo } from "react";

export default function useQuranDisplayGroups({
  ayahs,
  currentSurah,
  displayMode,
}) {
  const surahGroups = useMemo(() => {
    if (displayMode !== "page" && displayMode !== "juz") return [];
    const groups = [];
    let currentGroup = null;

    ayahs.forEach((ayah) => {
      const surahNumber = ayah.surah?.number || currentSurah;
      if (!currentGroup || currentGroup.surah !== surahNumber) {
        currentGroup = { surah: surahNumber, ayahs: [] };
        groups.push(currentGroup);
      }
      currentGroup.ayahs.push(ayah);
    });

    return groups;
  }, [ayahs, currentSurah, displayMode]);

  const pageTopSurah = useMemo(() => {
    if (displayMode !== "page") return null;
    return surahGroups[0]?.surah || currentSurah;
  }, [currentSurah, displayMode, surahGroups]);

  return { pageTopSurah, surahGroups };
}
