import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import { getSettings, saveSettings } from "../services/storageService";
import { ensureReciterForRiwaya } from "../data/reciters";
import audioService from "../services/audioService";
import { fetchPrayerTimes } from "../services/prayerTimesService";
import { getPreferredReciterId } from "../utils/reciterRanking";
import {
  normalizeDayTheme,
  normalizeNightTheme,
  normalizeThemeId,
} from "../data/themes";
import {
  DEFAULT_FONT_ID,
  DEFAULT_WARSH_FONT_ID,
  normalizeFontId,
} from "../data/fonts";
import { parseInitialRoute } from "../hooks/useUrlSync";

const clampQuranFontSize = (value, fallback = 25) => {
  const numeric = Number(value);
  return Number.isFinite(numeric)
    ? Math.max(12, Math.min(96, numeric))
    : fallback;
};

/* ── Initial State ──────────────────────────── */
// Lazy initialization pour éviter les calculs au démarrage
const getInitialState = () => {
  const stored = getSettings();
  const initialRiwaya = stored.riwaya || "hafs";
  const initialReciter = ensureReciterForRiwaya(
    stored.reciter || "ar.alafasy",
    initialRiwaya,
  );
  const initialLang = ["fr", "en", "ar"].includes(stored.lang)
    ? stored.lang
    : "fr";
  const routeOverrides = parseInitialRoute();
  const initialFontFamilyByRiwaya = {
    hafs: normalizeFontId(
      stored.fontFamilyByRiwaya?.hafs ||
        (initialRiwaya === "hafs" ? stored.fontFamily : null) ||
        DEFAULT_FONT_ID,
      "hafs",
    ),
    warsh: normalizeFontId(
      stored.fontFamilyByRiwaya?.warsh ||
        (initialRiwaya === "warsh" ? stored.fontFamily : null) ||
        DEFAULT_WARSH_FONT_ID,
      "warsh",
    ),
  };
  const initialFontFamily = normalizeFontId(
    initialFontFamilyByRiwaya[initialRiwaya] || stored.fontFamily,
    initialRiwaya,
  );

  return {
    // UI
    lang: initialLang,
    theme: normalizeThemeId(
    stored.theme,
    typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
  ),
  sidebarOpen: false,
  searchOpen: false,
  settingsOpen: false,
  bookmarksOpen: false,
  wirdOpen: false,
  historyOpen: false,
  playlistOpen: false,
  flashcardsOpen: false,
  tajweedQuizOpen: false,
  khatmaOpen: false,
  comparatorOpen: false,
  shareImageOpen: false,
  weeklyStatsOpen: false,
  audioMakerOpen: false,
  toolsHubOpen: false,
  splashDone: false,
  tafsirSidebarOpen: false,
  tafsirSidebarVerse: null,

  // Quran
  riwaya: initialRiwaya,
  displayMode: routeOverrides.displayMode ?? (stored.displayMode || "surah"), // 'surah' | 'page' | 'juz'
  mushafLayout: stored.mushafLayout || "list", // 'list' | 'mushaf'
  currentSurah:
    routeOverrides.currentSurah ?? (stored.lastPosition?.surah || 1),
  currentAyah: routeOverrides.currentAyah ?? (stored.lastPosition?.ayah || 1),
  currentPage: routeOverrides.currentPage ?? (stored.lastPosition?.page || 1),
  currentJuz: routeOverrides.currentJuz ?? (stored.lastPosition?.juz || 1),
  quranFontSize: (() => {
    const stored_fs = stored.quranFontSize ?? stored.fontSize;
    return stored_fs != null ? clampQuranFontSize(stored_fs) : 25;
  })(),
  quranTranslationFontSize: (() => {
    const value = Number(stored.quranTranslationFontSize);
    return Number.isFinite(value) ? Math.max(12, Math.min(28, value)) : 18;
  })(),
  fontFamily: initialFontFamily,
  fontFamilyByRiwaya: {
    ...initialFontFamilyByRiwaya,
    [initialRiwaya]: initialFontFamily,
  },
  showHome:
    routeOverrides.showHome ??
    (stored.showHome !== undefined ? Boolean(stored.showHome) : true),
  showDuas: routeOverrides.showDuas ?? false,
  showTranslation: stored.showTranslation ?? true,
  showTajwid: stored.showTajwid ?? false,
  showWordByWord: stored.showWordByWord ?? false,
  showTransliteration: stored.showTransliteration ?? true,
  showWordTranslation: stored.showWordTranslation ?? true,
  translationReadingMode: stored.translationReadingMode ?? false,
  pinnedAyahs: stored.pinnedAyahs || [],
  translationLangs: stored.translationLangs || [stored.translationLang || "fr"],
  wordTranslationLang:
    stored.wordTranslationLang || stored.translationLang || "fr",
  continuousPlay: stored.continuousPlay ?? true, // auto-play next surah
  focusReading: stored.focusReading ?? false,

  // Audio
  reciter: initialReciter,
  audioSpeed: stored.audioSpeed || 1,
  volume: stored.volume ?? 1,
  syncOffsetsMs: stored.syncOffsetsMs || {},
  warshStrictMode: stored.warshStrictMode ?? true,
  favoriteReciters: stored.favoriteReciters || [],
  autoSelectFastestReciter: false,
  reciterLatencyByKey: stored.reciterLatencyByKey || {},
  reciterAvailabilityById: stored.reciterAvailabilityById || {},
  isPlaying: false,
  currentPlayingAyah: null,
  playerMinimized: stored.playerMinimized ?? false,

  // Memorization
  memMode: false,
  memRepeatCount: 3,
  memPause: 2,
  surahRepeatCount: (() => {
    const value = Number(stored.surahRepeatCount);
    if (!Number.isFinite(value)) return 1;
    if (value <= 0) return 0;
    return Math.max(1, Math.min(999, Math.floor(value)));
  })(),

  // Karaoke / suivi auto
  karaokeFollow: true,

  // Auto night mode
  autoNightMode: stored.autoNightMode ?? false,
  nightStart: stored.nightStart || "20:00",
  nightEnd: stored.nightEnd || "06:00",
  nightTheme: normalizeNightTheme(stored.nightTheme || "dark"),
  dayTheme: normalizeDayTheme(stored.dayTheme || "light"),
  usePrayerTimes: stored.usePrayerTimes ?? false,

  // Wird goals
  wirdGoalType: stored.wirdGoalType || "pages",
  wirdGoalAmount: stored.wirdGoalAmount || 5,

  // Loading
  loading: true,
  error: null,

    // Currently loaded ayah count (updated after each fetch, used by Header)
    loadedAyahCount: 0,
  };
};

// Lazy initialization - ne calcule l'état initial qu'une fois au premier render
const initialState = getInitialState();

/* ── Reducer ────────────────────────────────── */

export function appReducer(state, action) {
  switch (action.type) {
    case "SET": {
      const payload = action.payload || {};
      const next = { ...state, ...payload };
      const hasRiwaya = Object.prototype.hasOwnProperty.call(payload, "riwaya");
      const hasFontFamily = Object.prototype.hasOwnProperty.call(payload, "fontFamily");
      const targetRiwaya = hasRiwaya
        ? payload.riwaya === "warsh"
          ? "warsh"
          : "hafs"
        : state.riwaya;
      if (Object.prototype.hasOwnProperty.call(payload, "theme")) {
        next.theme = normalizeThemeId(payload.theme, state.theme);
      }
      if (Object.prototype.hasOwnProperty.call(payload, "dayTheme")) {
        next.dayTheme = normalizeDayTheme(payload.dayTheme);
      }
      if (Object.prototype.hasOwnProperty.call(payload, "nightTheme")) {
        next.nightTheme = normalizeNightTheme(payload.nightTheme);
      }
      if (Object.prototype.hasOwnProperty.call(payload, "quranFontSize")) {
        next.quranFontSize = clampQuranFontSize(payload.quranFontSize, state.quranFontSize);
      }
      if (Object.prototype.hasOwnProperty.call(payload, "fontSize")) {
        next.quranFontSize = clampQuranFontSize(payload.fontSize, state.quranFontSize);
      }
      if (!Object.prototype.hasOwnProperty.call(payload, "karaokeFollow")) {
        next.karaokeFollow = state.karaokeFollow;
      }
      if (hasRiwaya) {
        const fontByRiwaya = {
          ...(state.fontFamilyByRiwaya || {}),
          [state.riwaya]: normalizeFontId(state.fontFamily, state.riwaya),
        };
        const nextRiwaya = payload.riwaya === "warsh" ? "warsh" : "hafs";
        next.riwaya = nextRiwaya;
        next.reciter = ensureReciterForRiwaya(next.reciter, nextRiwaya);
        next.fontFamily = normalizeFontId(
          fontByRiwaya[nextRiwaya],
          nextRiwaya,
        );
        next.fontFamilyByRiwaya = fontByRiwaya;
      }
      if (hasFontFamily) {
        const normalizedFont = normalizeFontId(payload.fontFamily, targetRiwaya);
        next.fontFamily = normalizedFont;
        next.fontFamilyByRiwaya = {
          ...(next.fontFamilyByRiwaya || state.fontFamilyByRiwaya || {}),
          [targetRiwaya]: normalizedFont,
        };
      }
      return next;
    }

    case "TOGGLE_SIDEBAR":
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case "TOGGLE_SEARCH":
      return { ...state, searchOpen: !state.searchOpen };
    case "TOGGLE_SETTINGS":
      return { ...state, settingsOpen: !state.settingsOpen };
    case "TOGGLE_BOOKMARKS":
      return { ...state, bookmarksOpen: !state.bookmarksOpen };
    case "TOGGLE_WIRD":
      return { ...state, wirdOpen: !state.wirdOpen };
    case "TOGGLE_HISTORY":
      return { ...state, historyOpen: !state.historyOpen };
    case "TOGGLE_PLAYLIST":
      return { ...state, playlistOpen: !state.playlistOpen };

    case "NAVIGATE_SURAH":
      return {
        ...state,
        currentSurah: action.payload.surah,
        currentAyah: action.payload.ayah || 1,
        displayMode: "surah",
        showHome: false,
        showDuas: false,
        sidebarOpen: false,
      };

    case "NAVIGATE_PAGE":
      return {
        ...state,
        currentPage: action.payload.page,
        displayMode: "page",
        showHome: false,
        showDuas: false,
        sidebarOpen: false,
      };

    case "NAVIGATE_JUZ":
      return {
        ...state,
        currentJuz: action.payload.juz,
        displayMode: "juz",
        showHome: false,
        showDuas: false,
        sidebarOpen: false,
      };

    case "SET_THEME":
      return { ...state, theme: normalizeThemeId(action.payload, state.theme) };

    case "SET_LANG":
      return { ...state, lang: action.payload };

    case "TOGGLE_TRANSLATION": {
      const lang = action.payload;
      const current = state.translationLangs || [];
      const next = current.includes(lang)
        ? current.filter((l) => l !== lang)
        : [...current, lang];
      // Ne pas permettre d'avoir 0 traduction si showTranslation est actif
      if (next.length === 0) return state;
      return { ...state, translationLangs: next };
    }

    case "SET_RIWAYA": {
      const nextRiwaya = action.payload === "warsh" ? "warsh" : "hafs";
      const nextReciter = ensureReciterForRiwaya(state.reciter, nextRiwaya);
      const fontByRiwaya = {
        ...(state.fontFamilyByRiwaya || {}),
        [state.riwaya]: normalizeFontId(state.fontFamily, state.riwaya),
      };
      const nextFont = normalizeFontId(fontByRiwaya[nextRiwaya], nextRiwaya);
      return {
        ...state,
        riwaya: nextRiwaya,
        reciter: nextReciter,
        fontFamily: nextFont,
        fontFamilyByRiwaya: {
          ...fontByRiwaya,
          [nextRiwaya]: nextFont,
        },
      };
    }

    case "SET_RECITER":
      return { ...state, reciter: action.payload };

    case "SET_QURAN_FONT_SIZE":
    case "SET_FONT_SIZE":
      return { ...state, quranFontSize: clampQuranFontSize(action.payload, state.quranFontSize) };

    case "SET_FONT_FAMILY":
      {
        const normalizedFont = normalizeFontId(action.payload, state.riwaya);
        return {
          ...state,
          fontFamily: normalizedFont,
          fontFamilyByRiwaya: {
            ...(state.fontFamilyByRiwaya || {}),
            [state.riwaya]: normalizedFont,
          },
        };
      }

    case "SET_PLAYING": {
      let ayah = action.payload.ayah ?? state.currentPlayingAyah;
      // Normalize: ensure currentPlayingAyah is always an object or null
      if (typeof ayah === "number") {
        ayah = { surah: null, ayah: ayah, globalNumber: ayah };
      }
      return {
        ...state,
        isPlaying: action.payload.playing,
        currentPlayingAyah: ayah,
      };
    }

    case "SET_LOADING":
      return { ...state, loading: action.payload, error: null };

    case "SET_ERROR":
      return { ...state, loading: false, error: action.payload };

    case "SPLASH_DONE":
      return { ...state, splashDone: true };

    default:
      return state;
  }
}

/* ── Context ────────────────────────────────── */

export const AppContext = createContext(null);
export const AppStateContext = createContext(null);
export const AppActionsContext = createContext(null);
export const AppLocaleContext = createContext({ lang: "fr", riwaya: "hafs" });
const AppSelectorStoreContext = createContext(null);

export function shallowEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") {
    return false;
  }
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => Object.is(a[key], b[key]));
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const saveTimerRef = useRef(null);
  const persistentSettingsRef = useRef(null);
  const stateRef = useRef(state);
  const selectorListenersRef = useRef(new Set());
  stateRef.current = state;

  const selectorStore = useMemo(
    () => ({
      getSnapshot: () => stateRef.current,
      subscribe: (listener) => {
        selectorListenersRef.current.add(listener);
        return () => selectorListenersRef.current.delete(listener);
      },
    }),
    [],
  );

  useLayoutEffect(() => {
    stateRef.current = state;
    selectorListenersRef.current.forEach((listener) => listener());
  }, [state]);

  // Create persistent settings object - memoized to avoid unnecessary recalculations
  const persistentSettings = useMemo(() => ({
    lang: state.lang,
    theme: state.theme,
    riwaya: state.riwaya,
    reciter: state.reciter,
    quranFontSize: state.quranFontSize,
    quranTranslationFontSize: state.quranTranslationFontSize,
    fontSize: state.quranFontSize,
    fontFamily: state.fontFamily,
    fontFamilyByRiwaya: state.fontFamilyByRiwaya,
    translationLangs: state.translationLangs,
    wordTranslationLang: state.wordTranslationLang,
    showTranslation: state.showTranslation,
    showTajwid: state.showTajwid,
    showWordByWord: state.showWordByWord,
    showTransliteration: state.showTransliteration,
    showWordTranslation: state.showWordTranslation,
    translationReadingMode: state.translationReadingMode,
    pinnedAyahs: state.pinnedAyahs,
    showHome: state.showHome,
    showDuas: state.showDuas,
    displayMode: state.displayMode,
    mushafLayout: state.mushafLayout,
    audioSpeed: state.audioSpeed,
    volume: state.volume,
    continuousPlay: state.continuousPlay,
    focusReading: state.focusReading,
    syncOffsetsMs: state.syncOffsetsMs,
    warshStrictMode: state.warshStrictMode,
    favoriteReciters: state.favoriteReciters,
    autoSelectFastestReciter: state.autoSelectFastestReciter,
    reciterLatencyByKey: state.reciterLatencyByKey,
    reciterAvailabilityById: state.reciterAvailabilityById,
    playerMinimized: state.playerMinimized,
    autoNightMode: state.autoNightMode,
    nightStart: state.nightStart,
    nightEnd: state.nightEnd,
    nightTheme: state.nightTheme,
    dayTheme: state.dayTheme,
    usePrayerTimes: state.usePrayerTimes,
    karaokeFollow: state.karaokeFollow,
    surahRepeatCount: state.surahRepeatCount,
    wirdGoalType: state.wirdGoalType,
    wirdGoalAmount: state.wirdGoalAmount,
    lastPosition: {
      surah: state.currentSurah,
      ayah: state.currentAyah,
      page: state.currentPage,
      juz: state.currentJuz,
    },
  }), [
    state.lang,
    state.theme,
    state.riwaya,
    state.reciter,
    state.quranFontSize,
    state.quranTranslationFontSize,
    state.fontFamily,
    state.fontFamilyByRiwaya,
    state.translationLangs,
    state.wordTranslationLang,
    state.showTranslation,
    state.showTajwid,
    state.showWordByWord,
    state.showTransliteration,
    state.showWordTranslation,
    state.translationReadingMode,
    state.pinnedAyahs,
    state.showHome,
    state.showDuas,
    state.displayMode,
    state.mushafLayout,
    state.audioSpeed,
    state.volume,
    state.continuousPlay,
    state.focusReading,
    state.syncOffsetsMs,
    state.warshStrictMode,
    state.favoriteReciters,
    state.autoSelectFastestReciter,
    state.reciterLatencyByKey,
    state.reciterAvailabilityById,
    state.playerMinimized,
    state.autoNightMode,
    state.nightStart,
    state.nightEnd,
    state.nightTheme,
    state.dayTheme,
    state.usePrayerTimes,
    state.karaokeFollow,
    state.surahRepeatCount,
    state.wirdGoalType,
    state.wirdGoalAmount,
    state.currentSurah,
    state.currentAyah,
    state.currentPage,
    state.currentJuz,
  ]);

  // Persist settings to localStorage on change (debounced — 500ms)
  useEffect(() => {
    persistentSettingsRef.current = persistentSettings;
  }, [persistentSettings]);

  const flushSettings = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (persistentSettingsRef.current) {
      saveSettings(persistentSettingsRef.current);
    }
  }, []);

  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveSettings(persistentSettings);
      saveTimerRef.current = null;
    }, 500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [persistentSettings]);

  useEffect(() => {
    const handleBeforeUnload = () => flushSettings();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") flushSettings();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [flushSettings]);

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", state.theme);
  }, [state.theme]);

  useEffect(() => {
    audioService.setLatencySnapshot(state.reciterLatencyByKey || {});
  }, [state.reciterLatencyByKey]);

  useEffect(() => {
    const unsubscribe = audioService.subscribeLatency((latencyMap) => {
      dispatch({
        type: "SET",
        payload: { reciterLatencyByKey: latencyMap },
      });
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!state.autoSelectFastestReciter || state.isPlaying) return;
    const hasFavoriteSignals =
      Array.isArray(state.favoriteReciters) &&
      state.favoriteReciters.length > 0;
    const hasLatencySignals =
      Object.keys(state.reciterLatencyByKey || {}).length > 0;
    const hasAvailabilitySignals =
      Object.keys(state.reciterAvailabilityById || {}).length > 0;
    if (!hasFavoriteSignals && !hasLatencySignals && !hasAvailabilitySignals) {
      return;
    }
    const preferredReciter = getPreferredReciterId(state.riwaya, {
      currentReciterId: state.reciter,
      favoriteReciters: state.favoriteReciters,
      latencyByKey: state.reciterLatencyByKey,
      availabilityById: state.reciterAvailabilityById,
    });
    if (preferredReciter && preferredReciter !== state.reciter) {
      dispatch({ type: "SET_RECITER", payload: preferredReciter });
    }
  }, [
    state.autoSelectFastestReciter,
    state.favoriteReciters,
    state.isPlaying,
    state.reciter,
    state.reciterLatencyByKey,
    state.reciterAvailabilityById,
    state.riwaya,
  ]);

  // Auto night mode — check every 60s
  useEffect(() => {
    if (!state.autoNightMode) return;
    const checkNight = () => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const start = state.nightStart || "20:00";
      const end = state.nightEnd || "06:00";
      // Is it night time?
      let isNight;
      if (start <= end) {
        isNight = hhmm >= start && hhmm < end;
      } else {
        // Crosses midnight: e.g. 20:00 → 06:00
        isNight = hhmm >= start || hhmm < end;
      }
      const target = isNight
        ? normalizeNightTheme(state.nightTheme)
        : normalizeDayTheme(state.dayTheme);
      if (state.theme !== target) {
        dispatch({ type: "SET_THEME", payload: target });
      }
    };
    checkNight();
    const interval = setInterval(checkNight, 60000);
    return () => clearInterval(interval);
  }, [
    state.autoNightMode,
    state.nightStart,
    state.nightEnd,
    state.nightTheme,
    state.dayTheme,
    state.theme,
    dispatch,
  ]);

  // Prayer-time based auto-night: compute Fajr/Isha from geolocation
  // Delay the geolocation request so startup stays responsive.
  useEffect(() => {
    if (!state.autoNightMode || !state.usePrayerTimes) return;
    
    let cancelled = false;
    
    // Delai pour ne pas bloquer le demarrage
    const timer = setTimeout(() => {
      if (cancelled) return;
      fetchPrayerTimes((times) => {
        if (cancelled || !times) return;
        dispatch({
          type: "SET",
          payload: { nightEnd: times.fajr, nightStart: times.isha },
        });
      });
    }, 2000); // Attendre 2 secondes apres le chargement initial
    
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [state.autoNightMode, state.usePrayerTimes]);

  // Listen for system dark-mode changes (auto-apply if user hasn't manually overridden)
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const handler = (e) => {
      // Only auto-switch if no explicit saved preference
      const current = getSettings();
      if (!current.theme) {
        dispatch({ type: "SET_THEME", payload: e.matches ? "dark" : "light" });
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Apply direction to <html>
  useEffect(() => {
    const langDir = state.lang === "ar" ? "rtl" : "ltr";
    document.documentElement.dir = langDir;
    document.documentElement.lang = state.lang;
  }, [state.lang]);

  const set = useCallback(
    (payload) => dispatch({ type: "SET", payload }),
    [dispatch],
  );

  const actionsValue = useMemo(() => ({ dispatch, set }), [dispatch, set]);
  const localeValue = useMemo(
    () => ({ lang: state.lang, riwaya: state.riwaya }),
    [state.lang, state.riwaya],
  );
  const appValue = useMemo(
    () => ({ state, dispatch, set }),
    [state, dispatch, set],
  );

  return (
    <AppActionsContext.Provider value={actionsValue}>
      <AppLocaleContext.Provider value={localeValue}>
        <AppSelectorStoreContext.Provider value={selectorStore}>
          <AppStateContext.Provider value={state}>
            <AppContext.Provider value={appValue}>{children}</AppContext.Provider>
          </AppStateContext.Provider>
        </AppSelectorStoreContext.Provider>
      </AppLocaleContext.Provider>
    </AppActionsContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppProvider");
  return ctx;
}

export function useAppActions() {
  const ctx = useContext(AppActionsContext);
  if (!ctx) throw new Error("useAppActions must be used within AppProvider");
  return ctx;
}

export function useAppLocale() {
  const ctx = useContext(AppLocaleContext);
  if (!ctx) throw new Error("useAppLocale must be used within AppProvider");
  return ctx;
}

export function useAppSelector(selector, isEqual = Object.is) {
  const store = useContext(AppSelectorStoreContext);
  if (!store) throw new Error("useAppSelector must be used within AppProvider");

  const selectorRef = useRef(selector);
  const isEqualRef = useRef(isEqual);
  const selectedRef = useRef();
  selectorRef.current = selector;
  isEqualRef.current = isEqual;

  const getSelectedSnapshot = useCallback(() => {
    const next = selectorRef.current(store.getSnapshot());
    if (
      selectedRef.current !== undefined &&
      isEqualRef.current(selectedRef.current, next)
    ) {
      return selectedRef.current;
    }
    selectedRef.current = next;
    return next;
  }, [store]);

  return useSyncExternalStore(
    store.subscribe,
    getSelectedSnapshot,
    getSelectedSnapshot,
  );
}

export function useApp() {
  const state = useAppState();
  const { dispatch, set } = useAppActions();
  return useMemo(() => ({ state, dispatch, set }), [state, dispatch, set]);
}

export default AppContext;
