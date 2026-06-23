import { useCallback, useEffect, useRef } from "react";
import audioService from "../services/audioService";

function shouldIgnoreKeyboardEvent(event) {
  if (event.defaultPrevented) return true;

  const target = event.target;
  const isElementTarget = target instanceof Element;
  if (
    isElementTarget &&
    target.closest(
      'input, textarea, select, button, [contenteditable="true"], [role="textbox"], [role="combobox"], [role="slider"]',
    )
  ) {
    return true;
  }

  return false;
}

export function useKeyboardNavigation({
  state,
  displayMode,
  currentSurah,
  currentPage,
  currentJuz,
  lang,
  sidebarOpen,
  showShortcuts,
  setShowShortcuts,
  dispatch,
  set,
}) {
  const latestRef = useRef({
    state,
    displayMode,
    currentSurah,
    currentPage,
    currentJuz,
    lang,
    sidebarOpen,
    showShortcuts,
  });

  useEffect(() => {
    latestRef.current = {
      state,
      displayMode,
      currentSurah,
      currentPage,
      currentJuz,
      lang,
      sidebarOpen,
      showShortcuts,
    };
  }, [
    state,
    displayMode,
    currentSurah,
    currentPage,
    currentJuz,
    lang,
    sidebarOpen,
    showShortcuts,
  ]);

  const handlePrevious = useCallback(() => {
    const latest = latestRef.current;
    if (latest.state.showDuas) return;

    set({ showHome: false, showDuas: false });

    if (latest.displayMode === "page") {
      const isRTL = latest.lang === "ar";
      const canNavigate = isRTL ? latest.currentPage > 1 : latest.currentPage < 604;
      if (canNavigate) {
        set({ currentPage: isRTL ? latest.currentPage - 1 : latest.currentPage + 1 });
      }
      return;
    }

    if (latest.displayMode === "juz") {
      const isRTL = latest.lang === "ar";
      const canNavigate = isRTL ? latest.currentJuz > 1 : latest.currentJuz < 30;
      if (canNavigate) {
        dispatch({
          type: "NAVIGATE_JUZ",
          payload: { juz: isRTL ? latest.currentJuz - 1 : latest.currentJuz + 1 },
        });
      }
      return;
    }

    const isRTL = latest.lang === "ar";
    const canNavigate = isRTL ? latest.currentSurah > 1 : latest.currentSurah < 114;
    if (canNavigate) {
      dispatch({
        type: "NAVIGATE_SURAH",
        payload: { surah: isRTL ? latest.currentSurah - 1 : latest.currentSurah + 1 },
      });
    }
  }, [dispatch, set]);

  const handleNext = useCallback(() => {
    const latest = latestRef.current;
    if (latest.state.showDuas) return;

    set({ showHome: false, showDuas: false });

    if (latest.displayMode === "page") {
      const isRTL = latest.lang === "ar";
      const canNavigate = isRTL ? latest.currentPage < 604 : latest.currentPage > 1;
      if (canNavigate) {
        set({ currentPage: isRTL ? latest.currentPage + 1 : latest.currentPage - 1 });
      }
      return;
    }

    if (latest.displayMode === "juz") {
      const isRTL = latest.lang === "ar";
      const canNavigate = isRTL ? latest.currentJuz < 30 : latest.currentJuz > 1;
      if (canNavigate) {
        dispatch({
          type: "NAVIGATE_JUZ",
          payload: { juz: isRTL ? latest.currentJuz + 1 : latest.currentJuz - 1 },
        });
      }
      return;
    }

    const isRTL = latest.lang === "ar";
    const canNavigate = isRTL ? latest.currentSurah < 114 : latest.currentSurah > 1;
    if (canNavigate) {
      dispatch({
        type: "NAVIGATE_SURAH",
        payload: { surah: isRTL ? latest.currentSurah + 1 : latest.currentSurah - 1 },
      });
    }
  }, [dispatch, set]);

  const handleSearch = useCallback(
    (event) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        dispatch({ type: "TOGGLE_SEARCH" });
      }
    },
    [dispatch],
  );

  const handleEscape = useCallback(() => {
    const latest = latestRef.current;
    const closeActions = [
      { condition: latest.state.searchOpen, action: () => dispatch({ type: "TOGGLE_SEARCH" }) },
      { condition: latest.state.settingsOpen, action: () => dispatch({ type: "TOGGLE_SETTINGS" }) },
      { condition: latest.state.bookmarksOpen, action: () => dispatch({ type: "TOGGLE_BOOKMARKS" }) },
      { condition: latest.state.wirdOpen, action: () => set({ wirdOpen: false }) },
      { condition: latest.state.historyOpen, action: () => set({ historyOpen: false }) },
      { condition: latest.state.playlistOpen, action: () => set({ playlistOpen: false }) },
      { condition: latest.state.audioMakerOpen, action: () => set({ audioMakerOpen: false }) },
      { condition: latest.state.flashcardsOpen, action: () => set({ flashcardsOpen: false }) },
      { condition: latest.state.tajweedQuizOpen, action: () => set({ tajweedQuizOpen: false }) },
      { condition: latest.state.khatmaOpen, action: () => set({ khatmaOpen: false }) },
      { condition: latest.state.comparatorOpen, action: () => set({ comparatorOpen: false }) },
      { condition: latest.state.shareImageOpen, action: () => set({ shareImageOpen: false }) },
      { condition: latest.state.weeklyStatsOpen, action: () => set({ weeklyStatsOpen: false }) },
      { condition: latest.showShortcuts, action: () => setShowShortcuts(false) },
      { condition: latest.sidebarOpen, action: () => dispatch({ type: "TOGGLE_SIDEBAR" }) },
    ];

    const actionToExecute = closeActions.find(({ condition }) => condition);
    if (actionToExecute) actionToExecute.action();
  }, [dispatch, set, setShowShortcuts]);

  const handlePlayPause = useCallback(() => {
    audioService.toggle();
  }, []);

  const handleToggleShortcuts = useCallback(() => {
    setShowShortcuts((prev) => !prev);
  }, [setShowShortcuts]);

  const handleToggleTranslation = useCallback(() => {
    const { state: s } = latestRef.current;
    set({ showTranslation: !s.showTranslation });
  }, [set]);

  const handleToggleWordByWord = useCallback(() => {
    const { state: s } = latestRef.current;
    set({ showWordByWord: !s.showWordByWord, memMode: false });
  }, [set]);

  const handleToggleTajweed = useCallback(() => {
    const { state: s } = latestRef.current;
    set({ showTajwid: !s.showTajwid });
  }, [set]);

  const handleToggleMemorization = useCallback(() => {
    // Use the dedicated reducer to ensure showHome/showDuas are also reset
    dispatch({ type: "TOGGLE_MEM_MODE" });
  }, [dispatch]);

  const handleKeyboard = useCallback(
    (event) => {
      if (shouldIgnoreKeyboardEvent(event)) return;

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          handlePrevious();
          break;
        case "ArrowRight":
          event.preventDefault();
          handleNext();
          break;
        case "k":
        case "K":
          handleSearch(event);
          break;
        case "t":
        case "T":
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            handleToggleTranslation();
          }
          break;
        case "w":
        case "W":
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            handleToggleWordByWord();
          }
          break;
        case "j":
        case "J":
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            handleToggleTajweed();
          }
          break;
        case "m":
        case "M":
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            handleToggleMemorization();
          }
          break;
        case "Escape":
          handleEscape();
          break;
        case " ":
          event.preventDefault();
          handlePlayPause();
          break;
        case "?":
          event.preventDefault();
          handleToggleShortcuts();
          break;
        default:
          break;
      }
    },
    [handlePrevious, handleNext, handleSearch, handleEscape, handlePlayPause, handleToggleShortcuts, handleToggleTranslation, handleToggleWordByWord, handleToggleTajweed, handleToggleMemorization],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [handleKeyboard]);

  return {
    handlePrevious,
    handleNext,
    handleSearch,
    handleEscape,
    handlePlayPause,
    handleToggleShortcuts,
  };
}
