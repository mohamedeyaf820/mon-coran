import { useCallback } from "react";

export default function useQuranDisplayNavigation({
  currentJuz,
  currentPage,
  currentSurah,
  dispatch,
  set,
  showWordByWord,
}) {
  const goNextPage = useCallback(() => {
    if (currentPage < 604) set({ currentPage: currentPage + 1 });
  }, [currentPage, set]);

  const goPrevPage = useCallback(() => {
    if (currentPage > 1) set({ currentPage: currentPage - 1 });
  }, [currentPage, set]);

  const goNextSurah = useCallback(() => {
    if (currentSurah < 114) {
      dispatch({ type: "NAVIGATE_SURAH", payload: { surah: currentSurah + 1 } });
    }
  }, [currentSurah, dispatch]);

  const goPrevSurah = useCallback(() => {
    if (currentSurah > 1) {
      dispatch({ type: "NAVIGATE_SURAH", payload: { surah: currentSurah - 1 } });
    }
  }, [currentSurah, dispatch]);

  const goNextJuz = useCallback(() => {
    if (currentJuz < 30) dispatch({ type: "NAVIGATE_JUZ", payload: { juz: currentJuz + 1 } });
  }, [currentJuz, dispatch]);

  const goPrevJuz = useCallback(() => {
    if (currentJuz > 1) dispatch({ type: "NAVIGATE_JUZ", payload: { juz: currentJuz - 1 } });
  }, [currentJuz, dispatch]);

  const toggleWordByWordMode = useCallback(() => {
    set({ mushafLayout: "list", showWordByWord: !showWordByWord, memMode: false });
  }, [set, showWordByWord]);

  return {
    goNextJuz,
    goNextPage,
    goNextSurah,
    goPrevJuz,
    goPrevPage,
    goPrevSurah,
    toggleWordByWordMode,
  };
}
