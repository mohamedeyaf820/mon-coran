import { useMemo } from "react";

export default function useQuranDisplayGroups({
  ayahs,
  currentSurah,
  currentPage,
  displayMode,
}) {
  const surahGroups = useMemo(() => {
    if (displayMode !== "page" && displayMode !== "juz") return [];
    const groups = [];
    let currentGroup = null;

    const filteredAyahs =
      displayMode === "page" && currentPage
        ? ayahs.filter((ayah) => !ayah.page || Number(ayah.page) === Number(currentPage))
        : ayahs;

    filteredAyahs.forEach((ayah) => {
      const surahNumber = ayah.surah?.number || currentSurah;
      if (!currentGroup || currentGroup.surah !== surahNumber) {
        currentGroup = { surah: surahNumber, ayahs: [] };
        groups.push(currentGroup);
      }
      currentGroup.ayahs.push(ayah);
    });

    return groups;
  }, [ayahs, currentPage, currentSurah, displayMode]);

  const pageGroups = useMemo(() => {
    const groups = [];
    let currentGroup = null;

    const filteredAyahs =
      displayMode === "page" && currentPage
        ? ayahs.filter((ayah) => !ayah.page || Number(ayah.page) === Number(currentPage))
        : ayahs;

    filteredAyahs.forEach((ayah) => {
      const pageNum = ayah.page || (displayMode === "page" && currentPage ? Number(currentPage) : 1);
      if (!currentGroup || currentGroup.page !== pageNum) {
        currentGroup = { page: pageNum, ayahs: [] };
        groups.push(currentGroup);
      }
      currentGroup.ayahs.push(ayah);
    });

    return groups.length > 0
      ? groups
      : displayMode === "page" && ayahs.length > 0
        ? [{ page: Number(currentPage) || 1, ayahs }]
        : [];
  }, [ayahs, currentPage, displayMode]);

  const pageTopSurah = useMemo(() => {
    if (displayMode !== "page") return null;
    return surahGroups[0]?.surah || currentSurah;
  }, [currentSurah, displayMode, surahGroups]);

  return { pageTopSurah, surahGroups, pageGroups };
}
