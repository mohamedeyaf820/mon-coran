import { useCallback, useEffect } from "react";
import { getAudioServiceInstance } from "../services/audioService";

/**
 * Vérifie si l'événement clavier doit être ignoré (focus sur un élément interactif)
 */
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

/**
 * Hook pour la navigation clavier dans l'application Quran
 */
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
  // Handler pour la navigation vers l'élément précédent
  const handlePrevious = useCallback(() => {
    if (state.showDuas) return;

    set({ showHome: false, showDuas: false });

    if (displayMode === "page") {
      const isRTL = lang === "ar";
      const canNavigate = isRTL ? currentPage > 1 : currentPage < 604;
      if (canNavigate) {
        set({
          currentPage: isRTL ? currentPage - 1 : currentPage + 1,
        });
      }
    } else if (displayMode === "juz") {
      const isRTL = lang === "ar";
      const canNavigate = isRTL ? currentJuz > 1 : currentJuz < 30;
      if (canNavigate) {
        dispatch({
          type: "NAVIGATE_JUZ",
          payload: { juz: isRTL ? currentJuz - 1 : currentJuz + 1 },
        });
      }
    } else {
      const isRTL = lang === "ar";
      const canNavigate = isRTL ? currentSurah > 1 : currentSurah < 114;
      if (canNavigate) {
        dispatch({
          type: "NAVIGATE_SURAH",
          payload: { surah: isRTL ? currentSurah - 1 : currentSurah + 1 },
        });
      }
    }
  }, [
    state.showDuas,
    displayMode,
    lang,
    currentPage,
    currentJuz,
    currentSurah,
    set,
    dispatch,
  ]);

  // Handler pour la navigation vers l'élément suivant
  const handleNext = useCallback(() => {
    if (state.showDuas) return;

    set({ showHome: false, showDuas: false });

    if (displayMode === "page") {
      const isRTL = lang === "ar";
      const canNavigate = isRTL ? currentPage < 604 : currentPage > 1;
      if (canNavigate) {
        set({
          currentPage: isRTL ? currentPage + 1 : currentPage - 1,
        });
      }
    } else if (displayMode === "juz") {
      const isRTL = lang === "ar";
      const canNavigate = isRTL ? currentJuz < 30 : currentJuz > 1;
      if (canNavigate) {
        dispatch({
          type: "NAVIGATE_JUZ",
          payload: { juz: isRTL ? currentJuz + 1 : currentJuz - 1 },
        });
      }
    } else {
      const isRTL = lang === "ar";
      const canNavigate = isRTL ? currentSurah < 114 : currentSurah > 1;
      if (canNavigate) {
        dispatch({
          type: "NAVIGATE_SURAH",
          payload: { surah: isRTL ? currentSurah + 1 : currentSurah - 1 },
        });
      }
    }
  }, [
    state.showDuas,
    displayMode,
    lang,
    currentPage,
    currentJuz,
    currentSurah,
    set,
    dispatch,
  ]);

  // Handler pour ouvrir la recherche
  const handleSearch = useCallback(
    (event) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        dispatch({ type: "TOGGLE_SEARCH" });
      }
    },
    [dispatch],
  );

  // Handler pour fermer les modales/panneaux
  const handleEscape = useCallback(() => {
    const closeActions = [
      { condition: state.searchOpen, action: () => dispatch({ type: "TOGGLE_SEARCH" }) },
      { condition: state.settingsOpen, action: () => dispatch({ type: "TOGGLE_SETTINGS" }) },
      { condition: state.bookmarksOpen, action: () => dispatch({ type: "TOGGLE_BOOKMARKS" }) },
      { condition: state.wirdOpen, action: () => set({ wirdOpen: false }) },
      { condition: state.historyOpen, action: () => set({ historyOpen: false }) },
      { condition: state.playlistOpen, action: () => set({ playlistOpen: false }) },
      { condition: state.audioMakerOpen, action: () => set({ audioMakerOpen: false }) },
      { condition: state.flashcardsOpen, action: () => set({ flashcardsOpen: false }) },
      { condition: state.tajweedQuizOpen, action: () => set({ tajweedQuizOpen: false }) },
      { condition: state.khatmaOpen, action: () => set({ khatmaOpen: false }) },
      { condition: state.comparatorOpen, action: () => set({ comparatorOpen: false }) },
      { condition: state.shareImageOpen, action: () => set({ shareImageOpen: false }) },
      { condition: state.weeklyStatsOpen, action: () => set({ weeklyStatsOpen: false }) },
      { condition: showShortcuts, action: () => setShowShortcuts(false) },
      { condition: sidebarOpen, action: () => dispatch({ type: "TOGGLE_SIDEBAR" }) },
    ];

    const actionToExecute = closeActions.find(({ condition }) => condition);
    if (actionToExecute) {
      actionToExecute.action();
    }
  }, [
    state.searchOpen,
    state.settingsOpen,
    state.bookmarksOpen,
    state.wirdOpen,
    state.historyOpen,
    state.playlistOpen,
    state.audioMakerOpen,
    state.flashcardsOpen,
    state.tajweedQuizOpen,
    state.khatmaOpen,
    state.comparatorOpen,
    state.shareImageOpen,
    state.weeklyStatsOpen,
    showShortcuts,
    sidebarOpen,
    dispatch,
    set,
    setShowShortcuts,
  ]);

  // Handler pour play/pause audio
  const handlePlayPause = useCallback(() => {
    getAudioServiceInstance()
      .then((audioService) => audioService.toggle())
      .catch(() => {});
  }, []);

  // Handler pour afficher/masquer les raccourcis
  const handleToggleShortcuts = useCallback(() => {
    setShowShortcuts((prev) => !prev);
  }, [setShowShortcuts]);

  // Handler principal regroupant tous les raccourcis
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
    [handlePrevious, handleNext, handleSearch, handleEscape, handlePlayPause, handleToggleShortcuts],
  );

  // Enregistrer/désenregistrer le listener
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
