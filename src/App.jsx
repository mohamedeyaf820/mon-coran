import React, { useState, useRef, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { useApp } from "./context/AppContext";
import SplashScreen from "./components/SplashScreen";
import Header from "./components/Header";
import QuranDisplay from "./components/QuranDisplay";
import HomePage from "./components/HomePage";
import { prefetchInitialData } from "./services/quranAPI";
import audioService from "./services/audioService";
import SURAHS from "./data/surahs";
import { getReciter, ensureReciterForRiwaya } from "./data/reciters";

// Lazy-load modals — they're only needed when opened
const Sidebar = lazy(() => import("./components/Sidebar"));
const AudioPlayer = lazy(() => import("./components/AudioPlayer"));
const SearchModal = lazy(() => import("./components/SearchModal"));
const SettingsModal = lazy(() => import("./components/SettingsModal"));
const BookmarksModal = lazy(() => import("./components/BookmarksModal"));
const NotesPanel = lazy(() => import("./components/NotesPanel"));
const WirdPanel = lazy(() => import("./components/WirdPanel"));
const ReadingHistoryPanel = lazy(
  () => import("./components/ReadingHistoryPanel"),
);
const PlaylistPanel = lazy(() => import("./components/PlaylistPanel"));
const DuasPage = lazy(() => import("./components/DuasPage"));const FlashcardsPanel = lazy(() => import('./components/FlashcardsPanel'));
const TajweedQuizPanel = lazy(() => import('./components/TajweedQuizPanel'));
const KhatmaPanel = lazy(() => import('./components/KhatmaPanel'));
const ReciterComparatorPanel = lazy(() => import('./components/ReciterComparatorPanel'));
const AyahSharePanel = lazy(() => import('./components/AyahSharePanel'));
const WeeklyStatsPanel = lazy(() => import('./components/WeeklyStatsPanel'));
function detectLowPerformanceDevice() {
  if (typeof window === "undefined" || typeof navigator === "undefined")
    return false;
  const reducedMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  )?.matches;
  const lowMemory =
    typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 4;
  const lowCpu =
    typeof navigator.hardwareConcurrency === "number" &&
    navigator.hardwareConcurrency <= 4;
  const slowNetwork =
    navigator.connection?.saveData === true ||
    /2g/.test(navigator.connection?.effectiveType || "");
  return Boolean(reducedMotion || lowMemory || lowCpu || slowNetwork);
}

export default function App() {
  const { state, dispatch, set } = useApp();
  const {
    splashDone,
    lang,
    sidebarOpen,
    displayMode,
    currentSurah,
    currentPage,
    currentJuz,
    showHome,
    showDuas,
    focusReading,
  } = state;
  /* ── Reset reading progress bar on navigation ── */
  useEffect(() => {
    document.documentElement.style.setProperty("--reading-progress", "0");
  }, [currentSurah, currentJuz, currentPage, displayMode]);

  const lowPerfMode = useMemo(() => detectLowPerformanceDevice(), []);

  /* ── Immersive reading mode: auto-hide header after 3s inactivity ── */
  const [immersiveHidden, setImmersiveHidden] = useState(false);
  const immersiveTimer = useRef(null);
  const immersiveActive = focusReading && !showHome && !showDuas;

  useEffect(() => {
    if (!immersiveActive) {
      setImmersiveHidden(false);
      clearTimeout(immersiveTimer.current);
      return;
    }
    const show = () => {
      setImmersiveHidden(false);
      clearTimeout(immersiveTimer.current);
      immersiveTimer.current = setTimeout(() => setImmersiveHidden(true), 3000);
    };
    show();
    window.addEventListener("mousemove", show, { passive: true });
    window.addEventListener("touchstart", show, { passive: true });
    window.addEventListener("scroll", show, { passive: true });
    return () => {
      clearTimeout(immersiveTimer.current);
      window.removeEventListener("mousemove", show);
      window.removeEventListener("touchstart", show);
      window.removeEventListener("scroll", show);
    };
  }, [immersiveActive]);

  useEffect(() => {
    document.documentElement.dataset.perf = lowPerfMode ? "low" : "normal";
  }, [lowPerfMode]);

  /* ── Pre-load audio playlist when on the home page ──
     QuranDisplay handles playlist loading when in reading mode.
     When showHome is true it's not mounted, so we build a minimal
     playlist here (surah number + ayah index, no text) so the
     AudioPlayer play button works directly from the home page. */
  useEffect(() => {
    if (!showHome) return;
    const { riwaya, reciter: reciterId, currentSurah: surahNum, warshStrictMode } = state;
    const safeId = ensureReciterForRiwaya(reciterId, riwaya);
    const rec = getReciter(safeId, riwaya);
    if (!rec) return;
    // Respect Warsh strict-mode: don't load non-warsh voices
    if (
      riwaya === "warsh" &&
      warshStrictMode &&
      !String(rec.cdn || "").toLowerCase().includes("warsh")
    ) return;
    const surahData = SURAHS[surahNum - 1];
    if (!surahData) return;
    // Compute global ayah start (1-indexed)
    let globalStart = 0;
    for (let i = 0; i < surahNum - 1; i++) globalStart += SURAHS[i].ayahs;
    const items = Array.from({ length: surahData.ayahs }, (_, i) => ({
      surah: surahNum,
      ayah: i + 1,
      number: globalStart + i + 1,
    }));
    audioService.loadPlaylist(items, rec.cdn, rec.cdnType || "islamic");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHome, state.riwaya, state.reciter, state.currentSurah, state.warshStrictMode]);

  /* ── Keyboard shortcuts ── */
  const handleKeyboard = useCallback(
    (e) => {
      // Don't trigger if user is typing in an input
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;

      switch (e.key) {
        case "ArrowLeft":
          if (state.showDuas) return;
          e.preventDefault();
          set({ showHome: false, showDuas: false });
          if (displayMode === "page") {
            if (lang === "ar" ? currentPage > 1 : currentPage < 604)
              set({
                currentPage: lang === "ar" ? currentPage - 1 : currentPage + 1,
              });
          } else if (displayMode === "juz") {
            if (lang === "ar" ? currentJuz > 1 : currentJuz < 30)
              dispatch({
                type: "NAVIGATE_JUZ",
                payload: {
                  juz: lang === "ar" ? currentJuz - 1 : currentJuz + 1,
                },
              });
          } else {
            if (lang === "ar" ? currentSurah > 1 : currentSurah < 114)
              dispatch({
                type: "NAVIGATE_SURAH",
                payload: {
                  surah: lang === "ar" ? currentSurah - 1 : currentSurah + 1,
                },
              });
          }
          break;
        case "ArrowRight":
          if (state.showDuas) return;
          e.preventDefault();
          set({ showHome: false, showDuas: false });
          if (displayMode === "page") {
            if (lang === "ar" ? currentPage < 604 : currentPage > 1)
              set({
                currentPage: lang === "ar" ? currentPage + 1 : currentPage - 1,
              });
          } else if (displayMode === "juz") {
            if (lang === "ar" ? currentJuz < 30 : currentJuz > 1)
              dispatch({
                type: "NAVIGATE_JUZ",
                payload: {
                  juz: lang === "ar" ? currentJuz + 1 : currentJuz - 1,
                },
              });
          } else {
            if (lang === "ar" ? currentSurah < 114 : currentSurah > 1)
              dispatch({
                type: "NAVIGATE_SURAH",
                payload: {
                  surah: lang === "ar" ? currentSurah + 1 : currentSurah - 1,
                },
              });
          }
          break;
        case "k":
        case "K":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            dispatch({ type: "TOGGLE_SEARCH" });
          }
          break;
        case "Escape":
          // Close any open modal/panel
          if (state.searchOpen) dispatch({ type: "TOGGLE_SEARCH" });
          else if (state.settingsOpen) dispatch({ type: "TOGGLE_SETTINGS" });
          else if (state.bookmarksOpen) dispatch({ type: "TOGGLE_BOOKMARKS" });
          else if (state.wirdOpen) set({ wirdOpen: false });
          else if (state.historyOpen) set({ historyOpen: false });
          else if (state.playlistOpen) set({ playlistOpen: false });
          else if (state.flashcardsOpen) set({ flashcardsOpen: false });
          else if (state.tajweedQuizOpen) set({ tajweedQuizOpen: false });
          else if (state.khatmaOpen) set({ khatmaOpen: false });
          else if (state.comparatorOpen) set({ comparatorOpen: false });
          else if (state.shareImageOpen) set({ shareImageOpen: false });
          else if (state.weeklyStatsOpen) set({ weeklyStatsOpen: false });
          else if (sidebarOpen) dispatch({ type: "TOGGLE_SIDEBAR" });
          break;
        case " ":
          // Space pour play/pause audio
          e.preventDefault();
          audioService.toggle();
          break;
        default:
          break;
      }
    },
    [
      displayMode,
      currentSurah,
      currentPage,
      currentJuz,
      lang,
      sidebarOpen,
      state.searchOpen,
      state.settingsOpen,
      state.bookmarksOpen,
      state.wirdOpen,
      state.historyOpen,
      state.playlistOpen,
      state.flashcardsOpen,
      state.tajweedQuizOpen,
      state.khatmaOpen,
      state.comparatorOpen,
      state.shareImageOpen,
      state.weeklyStatsOpen,
      state.showDuas,
      dispatch,
      set,
    ],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [handleKeyboard]);

  // If splash not done, show splash
  if (!splashDone) {
    return (
      <SplashScreen
        onDone={() => dispatch({ type: "SPLASH_DONE" })}
        onPrefetch={() =>
          prefetchInitialData(
            state.currentSurah,
            state.riwaya,
            state.translationLang,
          )
        }
        lowPerfMode={lowPerfMode}
      />
    );
  }

  return (
    <div
      className={`app-root flex flex-col h-dvh w-full overflow-hidden ${focusReading ? "focus-reading" : ""} ${immersiveHidden ? "immersive-mode" : ""}`}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* Removed legacy Sakina starfield */}
      {/* ── Header ── */}
      <Header />

      {/* ── Main layout: sidebar + content ── */}
      <div className="relative flex flex-1 min-h-0">
        {/* Sidebar */}
        {!focusReading && (
          <Suspense fallback={null}>
            <Sidebar />
          </Suspense>
        )}

        {/* Invisible overlay for sidebar (to capture outside clicks without dimming) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-[190]"
            style={{ top: "var(--header-h)" }}
            onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
            aria-hidden="true"
          />
        )}

        {/* Main reading area */}
        <main
          className={`app-main flex-1 min-w-0 overflow-y-auto overflow-x-hidden ${showHome ? "app-main--home" : ""}`}
          style={{ paddingBottom: "var(--player-h)" }}
        >
          <div
            className={`app-view-shell ${showHome ? "app-view-home" : showDuas ? "app-view-duas" : "app-view-reading"} ${!showHome && !showDuas ? `app-mode-${displayMode}` : ""}`}
          >
            {showHome ? (
              <HomePage />
            ) : showDuas ? (
              <Suspense fallback={null}>
                <DuasPage />
              </Suspense>
            ) : (
              <QuranDisplay key={displayMode === "juz" ? `juz-${currentJuz}` : displayMode === "page" ? `page-${currentPage}` : `surah-${currentSurah}`} />
            )}
          </div>
        </main>

        {/* Notes panel (right side) */}
        {!focusReading && (
          <Suspense fallback={null}>
            <NotesPanel />
          </Suspense>
        )}
      </div>

      {/* ── Fixed bottom audio player ── */}
      <Suspense fallback={null}>
        <AudioPlayer />
      </Suspense>

      {/* ── Modals — lazy loaded ── */}
      <Suspense fallback={null}>
        {state.searchOpen && <SearchModal />}
        {state.settingsOpen && <SettingsModal />}
        {state.bookmarksOpen && <BookmarksModal />}
        {state.wirdOpen && <WirdPanel />}
        {state.historyOpen && <ReadingHistoryPanel />}
        {state.playlistOpen && <PlaylistPanel />}
        {state.flashcardsOpen && <FlashcardsPanel />}
        {state.tajweedQuizOpen && <TajweedQuizPanel />}
        {state.khatmaOpen && <KhatmaPanel />}
        {state.comparatorOpen && <ReciterComparatorPanel />}
        {state.shareImageOpen && <AyahSharePanel />}
        {state.weeklyStatsOpen && <WeeklyStatsPanel />}
      </Suspense>
    </div>
  );
}
