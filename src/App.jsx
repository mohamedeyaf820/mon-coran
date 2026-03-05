import React, { useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { useApp } from "./context/AppContext";
import SplashScreen from "./components/SplashScreen";
import Header from "./components/Header";
import QuranDisplay from "./components/QuranDisplay";
import HomePage from "./components/HomePage";
import { prefetchInitialData } from "./services/quranAPI";
import audioService from "./services/audioService";

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
  } = state;
  const lowPerfMode = useMemo(() => detectLowPerformanceDevice(), []);

  useEffect(() => {
    document.documentElement.dataset.perf = lowPerfMode ? "low" : "normal";
  }, [lowPerfMode]);

  /* ── Keyboard shortcuts ── */
  const handleKeyboard = useCallback(
    (e) => {
      // Don't trigger if user is typing in an input
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          set({ showHome: false });
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
          e.preventDefault();
          set({ showHome: false });
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
          // Close any open modal
          if (state.searchOpen) dispatch({ type: "TOGGLE_SEARCH" });
          else if (state.settingsOpen) dispatch({ type: "TOGGLE_SETTINGS" });
          else if (state.bookmarksOpen) dispatch({ type: "TOGGLE_BOOKMARKS" });
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
      className="app-root flex flex-col h-screen h-[100dvh] w-full overflow-hidden"
      dir={lang === "ar" ? "rtl" : "ltr"}
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      {/* ── Header ── */}
      <Header />

      {/* ── Main layout: sidebar + content ── */}
      <div className="relative flex flex-1 min-h-0">
        {/* Sidebar */}
        <Suspense fallback={null}>
          <Sidebar />
        </Suspense>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-[190] backdrop-blur-sm transition-opacity duration-200"
            style={{
              top: "var(--header-h)",
              background: "var(--bg-overlay)",
            }}
            onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
            aria-hidden="true"
          />
        )}

        {/* Main reading area */}
        <main
          className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden"
          style={{ paddingBottom: "var(--player-h)" }}
        >
          {showHome ? <HomePage /> : <QuranDisplay />}
        </main>

        {/* Notes panel (right side) */}
        <Suspense fallback={null}>
          <NotesPanel />
        </Suspense>
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
      </Suspense>
    </div>
  );
}
