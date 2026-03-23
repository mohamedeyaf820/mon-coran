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
import { getReciter, ensureReciterForRiwaya } from "./data/reciters";
import { Toast } from "./components/ModernUIComponents";
import { buildSurahAudioPlaylist } from "./utils/audioPlaylist";
import { ensureFontLoaded } from "./services/fontLoader";

// Lazy-load view shells and modals to reduce startup JS.
const Header = lazy(() => import("./components/Header"));
const HomePage = lazy(() => import("./components/HomePage"));
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

function runWhenIdle(callback, timeout = 240) {
  if (typeof window === "undefined") return () => {};

  if ("requestIdleCallback" in window) {
    const idleId = window.requestIdleCallback(callback, { timeout });
    return () => window.cancelIdleCallback(idleId);
  }

  const timeoutId = window.setTimeout(
    () =>
      callback({
        didTimeout: false,
        timeRemaining: () => 0,
      }),
    timeout,
  );

  return () => window.clearTimeout(timeoutId);
}

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
    memMode,
  } = state;

  /* ── Reset reading progress bar on navigation ── */
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

  /* ── Immersive reading mode: auto-hide header after 3s inactivity ── */
  const [immersiveHidden, setImmersiveHidden] = useState(false);

  /* ── Global Toast notification system ── */
  const [toast, setToast] = useState(null);
  const [deferNonCriticalUI, setDeferNonCriticalUI] = useState(false);

  // Listen for custom 'quran-toast' events dispatched anywhere in the app
  useEffect(() => {
    const handleToast = (e) => {
      setToast({
        type: e.detail?.type || "info",
        message: e.detail?.message || "",
      });
    };
    window.addEventListener("quran-toast", handleToast);
    return () => window.removeEventListener("quran-toast", handleToast);
  }, []);
  const immersiveTimer = useRef(null);
  const immersiveActive = focusReading && !showHome && !showDuas;
  const sidebarShiftClass =
    !focusReading && sidebarOpen
      ? lang === "ar"
        ? "lg:mr-[23rem]"
        : "lg:ml-[23rem]"
      : "";

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

  useEffect(() => {
    const cancelIdle = runWhenIdle(
      () => setDeferNonCriticalUI(true),
      lowPerfMode ? 2800 : 1200,
    );
    return cancelIdle;
  }, [lowPerfMode]);

  // Defer non-critical theme layer to protect initial LCP on mobile.
  useEffect(() => {
    let cancelled = false;
    let themeLoaded = false;
    let premiumLoaded = false;

    const loadThemeStyles = () => {
      if (cancelled || themeLoaded) return;
      themeLoaded = true;
      import("./styles/themes4.css").catch(() => {});
    };

    const loadPremiumStyles = () => {
      if (cancelled || premiumLoaded) return;

      // Keep premium visual layer off low-end devices to reduce CSS cost.
      if (lowPerfMode) return;
      // Removed incorrect viewport block to ensure unified design across desktop/mobile

      premiumLoaded = true;
      import("./styles/premium-platform.css").catch(() => {});
    };

    const onFirstInteraction = () => {
      setHasInteracted(true);
      loadThemeStyles();
      loadPremiumStyles();
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

    const cancelIdleBase = runWhenIdle(
      loadThemeStyles,
      lowPerfMode ? 2600 : 1500,
    );
    const cancelIdlePremium = runWhenIdle(
      loadPremiumStyles,
      lowPerfMode ? 14000 : 7000,
    );

    return () => {
      cancelled = true;
      cancelIdleBase();
      cancelIdlePremium();
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
      window.removeEventListener("touchstart", onFirstInteraction);
    };
  }, [lowPerfMode]);

  useEffect(() => {
    if (lowPerfMode) return;

    const cancelIdle = runWhenIdle(() => {
      ensureFontLoaded(state.fontFamily).catch(() => {});
    }, 1800);

    return cancelIdle;
  }, [state.fontFamily, lowPerfMode]);

  /* ── Pre-load audio playlist when on the home page ──
     QuranDisplay handles playlist loading when in reading mode.
     When showHome is true it's not mounted, so we build a minimal
     playlist here (surah number + ayah index, no text) so the
     AudioPlayer play button works directly from the home page. */
  useEffect(() => {
    if (!showHome) return;
    if (lowPerfMode) return;
    if (!deferNonCriticalUI) return;
    if (!hasInteracted) return;

    let cancelled = false;
    const {
      riwaya,
      reciter: reciterId,
      currentSurah: surahNum,
      warshStrictMode,
    } = state;
    const safeId = ensureReciterForRiwaya(reciterId, riwaya);
    const rec = getReciter(safeId, riwaya);
    if (!rec) return;
    // Respect Warsh strict-mode: don't load non-warsh voices
    if (
      riwaya === "warsh" &&
      warshStrictMode &&
      !String(rec.cdn || "")
        .toLowerCase()
        .includes("warsh")
    )
      return;
    const items = buildSurahAudioPlaylist(surahNum);
    if (items.length === 0) return;

    const cancelIdle = runWhenIdle(async () => {
      try {
        const audioService = await getAudioServiceInstance();
        if (cancelled) return;
        audioService.loadPlaylist(items, rec.cdn, rec.cdnType || "islamic");
      } catch {
        // Silent fallback: home remains usable even if preload fails.
      }
    }, 420);

    return () => {
      cancelled = true;
      cancelIdle();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  /* ── Keyboard shortcuts ── */
  const handleKeyboard = useCallback(
    (e) => {
      if (e.defaultPrevented) return;

      const target = e.target;
      const isElementTarget = target instanceof Element;
      // Ignore global shortcuts when focus is inside an interactive control.
      if (
        isElementTarget &&
        target.closest(
          'input, textarea, select, button, [contenteditable="true"], [role="textbox"], [role="combobox"], [role="slider"]',
        )
      )
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
          // Space pour play/pause audio
          e.preventDefault();
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

  // If splash not done, show splash
  if (!splashDone) {
    return (
      <SplashScreen
        onDone={() => dispatch({ type: "SPLASH_DONE" })}
        onPrefetch={async () => {
          const { prefetchInitialData } = await import("./services/quranAPI");
          return prefetchInitialData(
            state.currentSurah,
            state.riwaya,
            state.translationLang,
          );
        }}
        lowPerfMode={lowPerfMode}
      />
    );
  }

  return (
    <ErrorBoundary>
      <div
        className={`app-root premium-plus flex flex-col min-h-screen h-dvh w-full overflow-hidden ${focusReading ? "focus-reading" : ""} ${immersiveHidden ? "immersive-mode" : ""} ${sidebarOpen ? "is-sidebar-open" : ""} ${memMode ? "is-memorizing" : ""}`}
        dir={lang === "ar" ? "rtl" : "ltr"}
        data-view={showHome ? "home" : showDuas ? "duas" : "reading"}
        data-display-mode={displayMode}
      >
      {/* Removed legacy Sakina starfield */}
      {/* ── Header ── */}
      <Suspense fallback={suspenseFallback}>
        <Header />
      </Suspense>

      {/* ── Main layout: sidebar + content ── */}
      <div className="app-layout-shell relative flex flex-1 min-h-0">
        {/* Sidebar: keep available in all reading states (including focus mode) */}
        <Suspense fallback={suspenseFallback}>
          {(deferNonCriticalUI || sidebarOpen) && <Sidebar />}
        </Suspense>

        {/* Invisible overlay for sidebar (to capture outside clicks without dimming) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 top-(--header-h) z-190"
            onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
            aria-hidden="true"
          />
        )}

        {/* Main reading area */}
        <main
          className={`app-main app-main-shell flex-1 min-w-0 overflow-y-auto overflow-x-hidden pb-(--player-h) transition-[margin] duration-300 ${sidebarShiftClass} ${showHome ? "app-main--home" : ""}`}
        >
          <div
            className={`app-view-shell ${showHome ? "app-view-home" : showDuas ? "app-view-duas" : "app-view-reading"} ${!showHome && !showDuas ? `app-mode-${displayMode}` : ""}`}
          >
            {showHome ? (
              <Suspense fallback={suspenseFallback}>
                <HomePage />
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

        {/* Notes panel (right side) — loaded eagerly, always in the DOM when not in focus mode */}
        {!focusReading && deferNonCriticalUI && (
          <Suspense fallback={suspenseFallback}>
            <NotesPanel />
          </Suspense>
        )}
      </div>

      {/* ── Global Toast notifications ── */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-9999 w-[min(90vw,400px)]" role="alert" aria-live="polite">
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
            autoClose={4500}
          />
        </div>
      )}

      {/* ── Fixed bottom audio player ── */}
      <Suspense fallback={suspenseFallback}>
        {deferNonCriticalUI && (
          <AudioPlayer />
        )}
      </Suspense>

      {/* ── Modals — lazy loaded ── */}
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
