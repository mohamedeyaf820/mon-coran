import { useContext, useMemo, useCallback } from "react";
import { AppContext, AppStateContext, AppActionsContext } from "../context/AppContext";

/**
 * Hooks optimisés pour accéder au contexte sans re-renders inutiles
 * Utilise useMemo pour sélectionner uniquement les parties du state nécessaires
 */

// Hook de base
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

// Hook pour accéder uniquement au state
export function useAppState() {
  const state = useContext(AppStateContext);
  if (!state) {
    throw new Error("useAppState must be used within an AppProvider");
  }
  return state;
}

// Hook pour accéder uniquement aux actions
export function useAppActions() {
  const actions = useContext(AppActionsContext);
  if (!actions) {
    throw new Error("useAppActions must be used within an AppProvider");
  }
  return actions;
}

/**
 * Hook pour sélectionner une partie spécifique du state
 * Évite les re-renders quand d'autres parties du state changent
 * 
 * @example
 * const lang = useAppSelector(state => state.lang);
 * const { currentSurah, currentAyah } = useAppSelector(state => ({
 *   currentSurah: state.currentSurah,
 *   currentAyah: state.currentAyah
 * }));
 */
export function useAppSelector(selector) {
  const state = useAppState();
  return useMemo(() => selector(state), [state, selector]);
}

/**
 * Hooks spécialisés pour les parties fréquemment utilisées du state
 */

// Langue et thème
export function useLocale() {
  return useAppSelector(state => ({
    lang: state.lang,
    theme: state.theme,
  }));
}

// Navigation Quran
export function useQuranNavigation() {
  return useAppSelector(state => ({
    displayMode: state.displayMode,
    currentSurah: state.currentSurah,
    currentAyah: state.currentAyah,
    currentPage: state.currentPage,
    currentJuz: state.currentJuz,
  }));
}

// Affichage
export function useDisplaySettings() {
  return useAppSelector(state => ({
    showTranslation: state.showTranslation,
    showTajwid: state.showTajwid,
    showWordByWord: state.showWordByWord,
    showTransliteration: state.showTransliteration,
    showWordTranslation: state.showWordTranslation,
    translationReadingMode: state.translationReadingMode,
    translationLangs: state.translationLangs,
    wordTranslationLang: state.wordTranslationLang,
  }));
}

// Typographie
export function useFontSettings() {
  return useAppSelector(state => ({
    quranFontSize: state.quranFontSize,
    fontFamily: state.fontFamily,
    mushafLayout: state.mushafLayout,
  }));
}

// Audio
export function useAudioSettings() {
  return useAppSelector(state => ({
    reciter: state.reciter,
    audioSpeed: state.audioSpeed,
    volume: state.volume,
    continuousPlay: state.continuousPlay,
    isPlaying: state.isPlaying,
    currentPlayingAyah: state.currentPlayingAyah,
  }));
}

// Riwaya
export function useRiwaya() {
  return useAppSelector(state => ({
    riwaya: state.riwaya,
    warshStrictMode: state.warshStrictMode,
  }));
}

// UI State (modales, panneaux)
export function useUIState() {
  return useAppSelector(state => ({
    sidebarOpen: state.sidebarOpen,
    searchOpen: state.searchOpen,
    settingsOpen: state.settingsOpen,
    bookmarksOpen: state.bookmarksOpen,
    showHome: state.showHome,
    loading: state.loading,
    error: state.error,
  }));
}

// Actions optimisées avec useCallback
export function useQuranActions() {
  const { dispatch, set } = useAppActions();

  const navigateToSurah = useCallback((surah, ayah = 1) => {
    dispatch({
      type: "NAVIGATE_SURAH",
      payload: { surah, ayah },
    });
  }, [dispatch]);

  const navigateToPage = useCallback((page) => {
    set({ currentPage: page, showHome: false });
  }, [set]);

  const navigateToJuz = useCallback((juz) => {
    dispatch({
      type: "NAVIGATE_JUZ",
      payload: { juz },
    });
  }, [dispatch]);

  const setDisplayMode = useCallback((mode) => {
    set({ displayMode: mode });
  }, [set]);

  return {
    navigateToSurah,
    navigateToPage,
    navigateToJuz,
    setDisplayMode,
  };
}

export function useAudioActions() {
  const { dispatch, set } = useAppActions();

  const setReciter = useCallback((reciter) => {
    set({ reciter });
  }, [set]);

  const setAudioSpeed = useCallback((speed) => {
    set({ audioSpeed: speed });
  }, [set]);

  const setVolume = useCallback((volume) => {
    set({ volume });
  }, [set]);

  const toggleContinuousPlay = useCallback(() => {
    set(state => ({ continuousPlay: !state.continuousPlay }));
  }, [set]);

  return {
    setReciter,
    setAudioSpeed,
    setVolume,
    toggleContinuousPlay,
  };
}

export function useUIActions() {
  const { dispatch, set } = useAppActions();

  const toggleSidebar = useCallback(() => {
    dispatch({ type: "TOGGLE_SIDEBAR" });
  }, [dispatch]);

  const toggleSearch = useCallback(() => {
    dispatch({ type: "TOGGLE_SEARCH" });
  }, [dispatch]);

  const toggleSettings = useCallback(() => {
    dispatch({ type: "TOGGLE_SETTINGS" });
  }, [dispatch]);

  const goHome = useCallback(() => {
    set({ showHome: true });
  }, [set]);

  const closeAllModals = useCallback(() => {
    set({
      searchOpen: false,
      settingsOpen: false,
      bookmarksOpen: false,
      wirdOpen: false,
      historyOpen: false,
      playlistOpen: false,
    });
  }, [set]);

  return {
    toggleSidebar,
    toggleSearch,
    toggleSettings,
    goHome,
    closeAllModals,
  };
}
