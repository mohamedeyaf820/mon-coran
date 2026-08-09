import { useCallback, useRef } from "react";

export default function useQuranDisplayNavigation({
  currentJuz,
  currentPage,
  currentSurah,
  dispatch,
  prepareTarget,
}) {
  const requestRef = useRef(0);
  const navigate = useCallback(
    async (mode, value, action) => {
      const requestId = requestRef.current + 1;
      requestRef.current = requestId;
      await prepareTarget(mode, value);
      if (requestRef.current !== requestId) return;
      action();
    },
    [prepareTarget],
  );

  const goNextPage = useCallback(() => {
    if (currentPage < 604) {
      navigate("page", currentPage + 1, () =>
        dispatch({ type: "NAVIGATE_PAGE", payload: { page: currentPage + 1 } }),
      );
    }
  }, [currentPage, dispatch, navigate]);

  const goPrevPage = useCallback(() => {
    if (currentPage > 1) {
      navigate("page", currentPage - 1, () =>
        dispatch({ type: "NAVIGATE_PAGE", payload: { page: currentPage - 1 } }),
      );
    }
  }, [currentPage, dispatch, navigate]);

  const goNextSurah = useCallback(() => {
    if (currentSurah < 114) {
      navigate("surah", currentSurah + 1, () =>
        dispatch({ type: "NAVIGATE_SURAH", payload: { surah: currentSurah + 1 } }),
      );
    }
  }, [currentSurah, dispatch, navigate]);

  const goPrevSurah = useCallback(() => {
    if (currentSurah > 1) {
      navigate("surah", currentSurah - 1, () =>
        dispatch({ type: "NAVIGATE_SURAH", payload: { surah: currentSurah - 1 } }),
      );
    }
  }, [currentSurah, dispatch, navigate]);

  const goNextJuz = useCallback(() => {
    if (currentJuz < 30) {
      navigate("juz", currentJuz + 1, () =>
        dispatch({ type: "NAVIGATE_JUZ", payload: { juz: currentJuz + 1 } }),
      );
    }
  }, [currentJuz, dispatch, navigate]);

  const goPrevJuz = useCallback(() => {
    if (currentJuz > 1) {
      navigate("juz", currentJuz - 1, () =>
        dispatch({ type: "NAVIGATE_JUZ", payload: { juz: currentJuz - 1 } }),
      );
    }
  }, [currentJuz, dispatch, navigate]);

  return {
    goNextJuz,
    goNextPage,
    goNextSurah,
    goPrevJuz,
    goPrevPage,
    goPrevSurah,
  };
}
