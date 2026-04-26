import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  lazy,
  Suspense,
} from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useApp } from "./context/AppContext";
import SplashScreen from "./components/SplashScreen";
import HomePage from "./components/HomePage";
import {
  getReciter,
  ensureReciterForRiwaya,
  isWarshVerifiedReciter,
} from "./data/reciters";
import { Toast } from "./components/ModernUIComponents";
import { buildAudioPlaylistForSurah } from "./utils/audioPlaylist";
import { ensureFontLoaded } from "./services/fontLoader";
import { runWhenIdle } from "./utils/idleUtils";

const Header = lazy(() => import("./components/Header"));
const QuranDisplay = lazy(() => import("./components/QuranDisplay"));
const NotesPanel = lazy(() => import("./components/NotesPanel"));
const Sidebar = lazy(() => import("./components/Sidebar"));
const AudioPlayer = lazy(() => import("./components/AudioPlayer"));
const SearchModal = lazy(() => import("./components/SearchModal"));
const SettingsModal = lazy(() => import("./components/SettingsModal"));
const BookmarksModal = lazy(() => import("./components/BookmarksModal"));
const WirdPanel = lazy(() => import("./components/WirdPanel"));
const ReadingHistoryPanel = lazy(
  () => import("./components/ReadingHistoryPanel"),
);
const PlaylistPanel = lazy(() => import("./components/PlaylistPanel"));
const DuasPage = lazy(() => import("./components/DuasPage"));
const FlashcardsPanel = lazy(() => import("./components/FlashcardsPanel"));
const TajweedQuizPanel = lazy(() => import("./components/TajweedQuizPanel"));
const KhatmaPanel = lazy(() => import("./components/KhatmaPanel"));
const ReciterComparatorPanel = lazy(
  () => import("./components/ReciterComparatorPanel"),
);
const AyahSharePanel = lazy(() => import("./components/AyahSharePanel"));
const WeeklyStatsPanel = lazy(() => import("./components/WeeklyStatsPanel"));
const AudioMakerPanel = lazy(() => import("./components/AudioMakerPanel"));

let audioServiceLoader = null;

async function getAudioServiceInstance() {
  if (!audioServiceLoader) {
    audioServiceLoader = import("./services/audioService").then(
      (mod) => mod.default,
    );
  }
  return audioServiceLoader;
}

function detectLowPerformanceDevice() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

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
  const constrainedMobile =
    window.matchMedia?.("(max-width: 820px)")?.matches &&
    (lowMemory || lowCpu || /3g|2g/.test(navigator.connection?.effectiveType || ""));

  return Boolean(
    reducedMotion ||
      lowMemory ||
      lowCpu ||
      slowNetwork ||
      constrainedMobile,
  );
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
    memMode,
  } = state;

  useEffect(() => {
    document.documentElement.style.setProperty("--reading-progress", "0");
  }, [currentSurah, currentJuz, currentPage, displayMode]);

  const suspenseFallback = (
    <div
      className="min-h-10 animate-pulse rounded-2xl border border-[color-mix(in_srgb,var(--theme-border)_35%,transparent_65%)] bg-[color-mix(in_srgb,var(--theme-panel-bg)_84%,transparent_16%)]"
      aria-hidden="true"
    />
  );

  const lowPerfMode = useMemo(() => detectLowPerformanceDevice(), []);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [immersiveHidden, setImmersiveHidden] = useState(false);
  const [toast, setToast] = useState(null);
  const [deferNonCriticalUI, setDeferNonCriticalUI] = useState(false);
  const immersiveTimer = useRef(null);

  const immersiveActive = focusReading && !showHome && !showDuas;
  const sidebarShiftClass =
    !focusReading && sidebarOpen
      ? lang === "ar"
        ? "lg:mr-[23rem]"
        : "lg:ml-[23rem]"
      : "";

  useEffect(() => {
    const handleToast = (event) => {
      setToast({
        type: event.detail?.type || "info",
        message: event.detail?.message || "",
      });
    };

    window.addEventListener("quran-toast", handleToast);
    return () => window.removeEventListener("quran-toast", handleToast);
  }, []);

  useEffect(() => {
    if (!immersiveActive) {
      setImmersiveHidden(false);
      clearTimeout(immersiveTimer.current);
      return;
    }

    const showChrome = () => {
      setImmersiveHidden(false);
      clearTimeout(immersiveTimer.current);
      immersiveTimer.current = setTimeout(() => setImmersiveHidden(true), 3000);
    };

    showChrome();
    window.addEventListener("mousemove", showChrome, { passive: true });
    window.addEventListener("touchstart", showChrome, { passive: true });
    window.addEventListener("scroll", showChrome, { passive: true });

    return () => {
      clearTimeout(immersiveTimer.current);
      window.removeEventListener("mousemove", showChrome);
      window.removeEventListener("touchstart", showChrome);
      window.removeEventListener("scroll", showChrome);
    };
  }, [immersiveActive]);

  useEffect(() => {
    document.documentElement.dataset.perf = lowPerfMode ? "low" : "normal";
  }, [lowPerfMode]);

  useEffect(() => {
    const cancelIdle = runWhenIdle(
      () => setDeferNonCriticalUI(true),
      lowPerfMode ? 2800 : 1200,
    );
    return cancelIdle;
  }, [lowPerfMode]);

  useEffect(() => {
    const onFirstInteraction = () => {
      setHasInteracted(true);
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
      window.removeEventListener("touchstart", onFirstInteraction);
    };

    window.addEventListener("pointerdown", onFirstInteraction, {
      passive: true,
      once: true,
    });
    window.addEventListener("keydown", onFirstInteraction, { once: true });
    window.addEventListener("touchstart", onFirstInteraction, {
      passive: true,
      once: true,
    });

    return () => {
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
      window.removeEventListener("touchstart", onFirstInteraction);
    };
  }, []);

  useEffect(() => {
    if (lowPerfMode) return undefined;

    const cancelIdle = runWhenIdle(() => {
      ensureFontLoaded(state.fontFamily).catch(() => {});
    }, 1800);

    return cancelIdle;
  }, [state.fontFamily, lowPerfMode]);

  useEffect(() => {
    if (!showHome || lowPerfMode || !deferNonCriticalUI || !hasInteracted) {
      return undefined;
    }

    let cancelled = false;
    const {
      riwaya,
      reciter: reciterId,
      currentSurah: surahNum,
      warshStrictMode,
    } = state;
    const safeId = ensureReciterForRiwaya(reciterId, riwaya);
    const reciter = getReciter(safeId, riwaya);

    if (!reciter) return undefined;

    if (
      riwaya === "warsh" &&
      warshStrictMode &&
      !isWarshVerifiedReciter(reciter)
    ) {
      return undefined;
    }

    const cancelIdle = runWhenIdle(async () => {
      try {
        const items = await buildAudioPlaylistForSurah(surahNum, riwaya);
        if (cancelled || items.length === 0) return;
        const audioService = await getAudioServiceInstance();
        if (cancelled) return;
        audioService.loadPlaylist(
          items,
          reciter.cdn,
          reciter.cdnType || "islamic",
        );
      } catch {
        // The home page stays usable even if the preload fails.
      }
    }, 420);

    return () => {
      cancelled = true;
      cancelIdle();
    };
  }, [
    showHome,
    state.riwaya,
    state.reciter,
    state.currentSurah,
    state.warshStrictMode,
    lowPerfMode,
    deferNonCriticalUI,
    hasInteracted,
  ]);

  const handleKeyboard = useCallback(
    (event) => {
      if (event.defaultPrevented) return;

      const target = event.target;
      const isElementTarget = target instanceof Element;
      if (
        isElementTarget &&
        target.closest(
          'input, textarea, select, button, [contenteditable="true"], [role="textbox"], [role="combobox"], [role="slider"]',
        )
      ) {
        return;
      }

      switch (event.key) {
        case "ArrowLeft":
          if (state.showDuas) return;
          event.preventDefault();
          set({ showHome: false, showDuas: false });
          if (displayMode === "page") {
            if (lang === "ar" ? currentPage > 1 : currentPage < 604) {
              set({
                currentPage: lang === "ar" ? currentPage - 1 : currentPage + 1,
              });
            }
          } else if (displayMode === "juz") {
            if (lang === "ar" ? currentJuz > 1 : currentJuz < 30) {
              dispatch({
                type: "NAVIGATE_JUZ",
                payload: {
                  juz: lang === "ar" ? currentJuz - 1 : currentJuz + 1,
                },
              });
            }
          } else if (lang === "ar" ? currentSurah > 1 : currentSurah < 114) {
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
          event.preventDefault();
          set({ showHome: false, showDuas: false });
          if (displayMode === "page") {
            if (lang === "ar" ? currentPage < 604 : currentPage > 1) {
              set({
                currentPage: lang === "ar" ? currentPage + 1 : currentPage - 1,
              });
            }
          } else if (displayMode === "juz") {
            if (lang === "ar" ? currentJuz < 30 : currentJuz > 1) {
              dispatch({
                type: "NAVIGATE_JUZ",
                payload: {
                  juz: lang === "ar" ? currentJuz + 1 : currentJuz - 1,
                },
              });
            }
          } else if (lang === "ar" ? currentSurah < 114 : currentSurah > 1) {
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
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            dispatch({ type: "TOGGLE_SEARCH" });
          }
          break;
        case "Escape":
          if (state.searchOpen) dispatch({ type: "TOGGLE_SEARCH" });
          else if (state.settingsOpen) dispatch({ type: "TOGGLE_SETTINGS" });
          else if (state.bookmarksOpen) dispatch({ type: "TOGGLE_BOOKMARKS" });
          else if (state.wirdOpen) set({ wirdOpen: false });
          else if (state.historyOpen) set({ historyOpen: false });
          else if (state.playlistOpen) set({ playlistOpen: false });
          else if (state.audioMakerOpen) set({ audioMakerOpen: false });
          else if (state.flashcardsOpen) set({ flashcardsOpen: false });
          else if (state.tajweedQuizOpen) set({ tajweedQuizOpen: false });
          else if (state.khatmaOpen) set({ khatmaOpen: false });
          else if (state.comparatorOpen) set({ comparatorOpen: false });
          else if (state.shareImageOpen) set({ shareImageOpen: false });
          else if (state.weeklyStatsOpen) set({ weeklyStatsOpen: false });
          else if (sidebarOpen) dispatch({ type: "TOGGLE_SIDEBAR" });
          break;
        case " ":
          event.preventDefault();
          getAudioServiceInstance()
            .then((audioService) => audioService.toggle())
            .catch(() => {});
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
      state.audioMakerOpen,
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

  if (!splashDone) {
    return (
      <SplashScreen
        onDone={() => dispatch({ type: "SPLASH_DONE" })}
        onPrefetch={async () => {
          const { prefetchInitialData } = await import("./services/quranAPI");
          return prefetchInitialData(
            state.currentSurah,
            state.riwaya,
            state.translationLangs?.[0] || "fr",
          );
        }}
        lowPerfMode={lowPerfMode}
      />
    );
  }

  return (
    <ErrorBoundary>
      <div
        className={`app-root premium-plus flex h-dvh min-h-screen w-full flex-col overflow-x-hidden ${focusReading ? "focus-reading" : ""} ${immersiveHidden ? "immersive-mode" : ""} ${sidebarOpen ? "is-sidebar-open" : ""} ${memMode ? "is-memorizing" : ""}`}
        style={{ height: "100dvh", minHeight: "100dvh" }}
        dir={lang === "ar" ? "rtl" : "ltr"}
        data-view={showHome ? "home" : showDuas ? "duas" : "reading"}
        data-display-mode={displayMode}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[10000] focus:rounded-xl focus:bg-[var(--theme-panel-bg-strong,var(--bg-card))] focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--text-primary)] focus:shadow-[0_10px_24px_rgba(2,8,23,0.18)]"
        >
          {lang === "fr"
            ? "Aller au contenu principal"
            : lang === "ar"
              ? "الانتقال إلى المحتوى الرئيسي"
              : "Skip to main content"}
        </a>

        <Suspense fallback={suspenseFallback}>
          <Header />
        </Suspense>

        <div className="app-layout-shell relative flex min-h-0 flex-1">
          <Suspense fallback={suspenseFallback}>
            {(deferNonCriticalUI || sidebarOpen) && <Sidebar />}
          </Suspense>

          {sidebarOpen && (
            <div
              className="sidebar-clickout-overlay fixed inset-0 z-190"
              onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
              aria-hidden="true"
            />
          )}

          <main
            id="main-content"
            tabIndex={-1}
            aria-label={
              showHome
                ? lang === "fr"
                  ? "Contenu principal - Accueil"
                  : lang === "ar"
                    ? "المحتوى الرئيسي - الصفحة الرئيسية"
                    : "Main content - Home"
                : showDuas
                  ? lang === "fr"
                    ? "Contenu principal - Douas"
                  : lang === "ar"
                    ? "المحتوى الرئيسي - الأدعية"
                    : "Main content - Duas"
                : lang === "fr"
                  ? "Contenu principal - Lecture"
                  : lang === "ar"
                    ? "المحتوى الرئيسي - القراءة"
                    : "Main content - Reading"
            }
            className={`app-main app-main-shell flex-1 min-h-0 min-w-0 overflow-x-hidden overflow-y-auto pb-(--player-h) transition-[margin] duration-300 ${sidebarShiftClass} ${showHome ? "app-main--home" : ""}`}
            style={{
              height: "calc(100dvh - var(--header-h, 72px))",
              maxHeight: "calc(100dvh - var(--header-h, 72px))",
            }}
          >
            <div
              className={`app-view-shell ${showHome ? "app-view-home" : showDuas ? "app-view-duas" : "app-view-reading"} ${!showHome && !showDuas ? `app-mode-${displayMode}` : ""}`}
            >
              {showHome ? (
                <Suspense fallback={suspenseFallback}>
                  <HomePage lowPerfMode={lowPerfMode} />
                </Suspense>
              ) : showDuas ? (
                <Suspense fallback={suspenseFallback}>
                  <DuasPage />
                </Suspense>
              ) : (
                <Suspense fallback={suspenseFallback}>
                  <QuranDisplay
                    key={
                      displayMode === "juz"
                        ? `juz-${currentJuz}`
                        : displayMode === "page"
                          ? `page-${currentPage}`
                          : `surah-${currentSurah}`
                    }
                  />
                </Suspense>
              )}
            </div>
          </main>

          {!focusReading && deferNonCriticalUI && (
            <Suspense fallback={suspenseFallback}>
              <NotesPanel />
            </Suspense>
          )}
        </div>

        {toast && (
          <div
            className="fixed left-1/2 top-4 z-9999 w-[min(90vw,400px)] -translate-x-1/2"
            role="alert"
            aria-live="polite"
          >
            <Toast
              type={toast.type}
              message={toast.message}
              onClose={() => setToast(null)}
              autoClose={4500}
            />
          </div>
        )}

        <Suspense fallback={suspenseFallback}>
          <AudioPlayer />
        </Suspense>

        <Suspense fallback={suspenseFallback}>
          {state.searchOpen && <SearchModal />}
          {state.settingsOpen && <SettingsModal />}
          {state.bookmarksOpen && <BookmarksModal />}
          {state.wirdOpen && <WirdPanel />}
          {state.historyOpen && <ReadingHistoryPanel />}
          {state.playlistOpen && <PlaylistPanel />}
          {state.audioMakerOpen && <AudioMakerPanel />}
          {state.flashcardsOpen && <FlashcardsPanel />}
          {state.tajweedQuizOpen && <TajweedQuizPanel />}
          {state.khatmaOpen && <KhatmaPanel />}
          {state.comparatorOpen && <ReciterComparatorPanel />}
          {state.shareImageOpen && <AyahSharePanel />}
          {state.weeklyStatsOpen && <WeeklyStatsPanel />}
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}
