import { useCallback, useEffect, useRef } from "react";
import { loadAudioService } from "../services/loadAudioService";

/**
 * Overlays that own the keyboard: while one is open its own controls answer
 * the keys, and a reading shortcut must not change what is behind it.
 * The sidebar is deliberately absent — on a wide screen it is a persistent
 * rail, not an overlay, and the reader stays visible next to it.
 */
const BLOCKING_OVERLAYS = [
  "searchOpen",
  "settingsOpen",
  "libraryOpen",
  "shareImageOpen",
  "readerTypographyOpen",
  "showDuas",
  "legalPage",
];

function hasBlockingOverlay(latest) {
  return (
    latest.showShortcuts === true ||
    BLOCKING_OVERLAYS.some((key) => latest.state[key] === true)
  );
}

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
    if (hasBlockingOverlay(latest)) return;

    set({ showHome: false, showDuas: false });

    // ArrowLeft = visually left on screen = forward in mushaf reading order (higher page/surah).
    // This is correct for both LTR and RTL UI since the mushaf always reads right-to-left on screen.
    if (latest.displayMode === "page") {
      if (latest.currentPage < 604) set({ currentPage: latest.currentPage + 1 });
      return;
    }

    if (latest.displayMode === "juz") {
      if (latest.currentJuz < 30) dispatch({ type: "NAVIGATE_JUZ", payload: { juz: latest.currentJuz + 1 } });
      return;
    }

    if (latest.currentSurah < 114) {
      dispatch({ type: "NAVIGATE_SURAH", payload: { surah: latest.currentSurah + 1 } });
    }
  }, [dispatch, set]);

  const handleNext = useCallback(() => {
    const latest = latestRef.current;
    if (hasBlockingOverlay(latest)) return;

    set({ showHome: false, showDuas: false });

    // ArrowRight = visually right on screen = backward in mushaf reading order (lower page/surah).
    if (latest.displayMode === "page") {
      if (latest.currentPage > 1) set({ currentPage: latest.currentPage - 1 });
      return;
    }

    if (latest.displayMode === "juz") {
      if (latest.currentJuz > 1) dispatch({ type: "NAVIGATE_JUZ", payload: { juz: latest.currentJuz - 1 } });
      return;
    }

    if (latest.currentSurah > 1) {
      dispatch({ type: "NAVIGATE_SURAH", payload: { surah: latest.currentSurah - 1 } });
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
    // Each of these panels answers Escape itself and the event reaches this
    // window listener in the same keystroke, while the state still reads as
    // open. Toggling here then closed it and reopened it; setting it false is
    // the one action both handlers can share.
    const closeActions = [
      { condition: latest.state.searchOpen, action: () => set({ searchOpen: false }) },
      { condition: latest.state.settingsOpen, action: () => set({ settingsOpen: false }) },
      { condition: latest.state.libraryOpen, action: () => set({ libraryOpen: false }) },
      { condition: latest.state.shareImageOpen, action: () => set({ shareImageOpen: false }) },
      { condition: latest.state.readerTypographyOpen, action: () => set({ readerTypographyOpen: false }) },
      { condition: latest.showShortcuts, action: () => setShowShortcuts(false) },
      { condition: latest.sidebarOpen, action: () => dispatch({ type: "TOGGLE_SIDEBAR" }) },
    ];

    const actionToExecute = closeActions.find(({ condition }) => condition);
    if (actionToExecute) actionToExecute.action();
  }, [dispatch, set, setShowShortcuts]);

  const handlePlayPause = useCallback(() => {
    if (hasBlockingOverlay(latestRef.current)) return;
    loadAudioService()
      .then((audioService) => audioService.toggle())
      .catch(() => {});
  }, []);

  const handleToggleShortcuts = useCallback(() => {
    const latest = latestRef.current;
    if (latest.showShortcuts) {
      setShowShortcuts(false);
      return;
    }
    if (hasBlockingOverlay(latest)) return;
    setShowShortcuts(true);
  }, [setShowShortcuts]);

  const handleToggleTranslation = useCallback(() => {
    const { state: s } = latestRef.current;
    if (hasBlockingOverlay(latestRef.current)) return;
    // The printed Mushaf page has no translation band; keep the shortcut
    // aligned with the disabled toolbar toggle instead of flipping a
    // setting whose effect is invisible.
    if (s.mushafLayout === "mushaf") return;
    set({ showTranslation: !s.showTranslation });
  }, [set]);

  const handleToggleTajweed = useCallback(() => {
    if (hasBlockingOverlay(latestRef.current)) return;
    const { state: s } = latestRef.current;
    set({ showTajwid: !s.showTajwid });
  }, [set]);

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
        case "j":
        case "J":
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            handleToggleTajweed();
          }
          break;
        case "ArrowUp":
          if (event.altKey) {
            event.preventDefault();
            handlePrevious();
          }
          break;
        case "ArrowDown":
          if (event.altKey) {
            event.preventDefault();
            handleNext();
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
    [handlePrevious, handleNext, handleSearch, handleEscape, handlePlayPause, handleToggleShortcuts, handleToggleTranslation, handleToggleTajweed],
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
