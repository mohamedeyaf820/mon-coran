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
import {
  shallowEqual,
  useAppActions,
  useAppSelector,
} from "./context/AppContext";
import { t } from "./i18n";
import SplashScreen from "./components/SplashScreen";
import PWAUpdateBanner from "./components/PWAUpdateBanner";
import { runWhenIdle } from "./utils/idleUtils";
import { isLowPerformanceDevice } from "./utils/networkPolicy";
import { loadAudioService } from "./services/loadAudioService";
import { useUrlSync } from "./hooks/useUrlSync";
import { useKeyboardNavigation } from "./hooks/useKeyboardNavigation";
import ProgressBar from "./components/ProgressBar";
import {
  ensureReciterForRiwaya,
  getReciter,
  isWarshVerifiedReciter,
} from "./data/reciters";

const loadHomePage = () => import("./components/HomePage");
const loadQuranDisplay = () => import("./components/QuranDisplay");
const loadHeader = () => import("./components/Header");
const loadLegalPage = () => import("./components/LegalPage");
const loadDuasPage = () => import("./components/DuasPage");
const HomePage = lazy(loadHomePage);
const Header = lazy(loadHeader);
const QuranDisplay = lazy(loadQuranDisplay);
const LegalPage = lazy(loadLegalPage);
const ConfirmDialogHost = lazy(() => import("./components/ConfirmDialogHost"));
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
const DuasPage = lazy(loadDuasPage);
const FlashcardsPanel = lazy(() => import("./components/FlashcardsPanel"));
const TajweedQuizPanel = lazy(() => import("./components/TajweedQuizPanel"));
const KhatmaPanel = lazy(() => import("./components/KhatmaPanel"));
const ReciterComparatorPanel = lazy(
  () => import("./components/ReciterComparatorPanel"),
);
const AyahSharePanel = lazy(() => import("./components/AyahSharePanel"));
const WeeklyStatsPanel = lazy(() => import("./components/WeeklyStatsPanel"));
const AudioMakerPanel = lazy(() => import("./components/AudioMakerPanel"));
const KeyboardShortcutsModal = lazy(
  () => import("./components/KeyboardShortcutsModal"),
);
const TafsirSidebar = lazy(() => import("./components/TafsirSidebar"));
const ToolsHubModal = lazy(() => import("./components/ToolsHubModal"));
const FutureFeaturesModal = lazy(
  () => import("./components/FutureFeaturesModal"),
);

function AppLoadingFallback({ lang, variant = "page" }) {
  const label =
    lang === "ar"
      ? "\u062c\u0627\u0631\u064d \u0627\u0644\u062a\u062d\u0645\u064a\u0644…"
      : lang === "en"
        ? "Loading…"
        : "Chargement en cours…";

  const isHeader = variant === "header";
  const isOverlay = variant === "overlay";
  const spinnerSize = isHeader ? 18 : 24;

  return (
    <div
      className="app-loading-fallback"
      role="status"
      aria-busy="true"
      style={{
        position: isOverlay ? "fixed" : "relative",
        inset: isOverlay ? 0 : undefined,
        zIndex: isOverlay ? 9800 : undefined,
        width: "100%",
        minHeight: isHeader
          ? "var(--header-h, 56px)"
          : isOverlay
            ? "100dvh"
            : "min(42vh, 320px)",
        display: "grid",
        placeItems: "center",
        padding: isHeader ? "0.4rem" : "clamp(0.8rem, 3vw, 1.5rem)",
        background: isOverlay
          ? "color-mix(in srgb, var(--bg-primary) 72%, transparent)"
          : "transparent",
        backdropFilter: isOverlay ? "blur(6px)" : undefined,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.65rem",
          borderRadius: "999px",
          padding: isHeader ? 0 : "0.65rem 0.85rem",
          color: "var(--text-secondary)",
          background: isHeader
            ? "transparent"
            : "color-mix(in srgb, var(--bg-card) 92%, transparent)",
          border: isHeader ? 0 : "1px solid var(--border)",
          boxShadow: isHeader ? "none" : "var(--shadow-sm)",
        }}
      >
        <span
          className="animate-spin"
          style={{
            width: spinnerSize,
            height: spinnerSize,
            flex: `0 0 ${spinnerSize}px`,
            borderRadius: "50%",
            border: "2px solid color-mix(in srgb, var(--primary) 22%, transparent)",
            borderTopColor: "var(--primary)",
          }}
          aria-hidden="true"
        />
        <span
          className={isHeader ? "sr-only" : undefined}
          lang={lang}
          style={
            isHeader
              ? undefined
              : {
                  fontSize: "var(--mp-device-ui-sm, 0.78rem)",
                  fontWeight: 650,
                  lineHeight: 1.2,
                }
          }
        >
          {label}
        </span>
      </div>
    </div>
  );
}

function Toast({ type = "info", message, onClose, autoClose = 5000, lang }) {
  useEffect(() => {
    if (!autoClose) return;
    const t = setTimeout(onClose, autoClose);
    return () => clearTimeout(t);
  }, [autoClose, onClose]);
  const TOAST_VARS = {
    success: { bg: "var(--toast-success-bg, #ecfdf5)", border: "var(--toast-success-border, #a7f3d0)", text: "var(--toast-success-text, #065f46)", accent: "var(--toast-success-accent, #10b981)", mark: "✓" },
    error:   { bg: "var(--toast-error-bg, #fef2f2)",   border: "var(--toast-error-border, #fecaca)",   text: "var(--toast-error-text, #991b1b)",   accent: "var(--toast-error-accent, #ef4444)",   mark: "×" },
    warning: { bg: "var(--toast-warning-bg, #fff7ed)", border: "var(--toast-warning-border, #fed7aa)", text: "var(--toast-warning-text, #9a3412)",  accent: "var(--toast-warning-accent, #f97316)",  mark: "!" },
    info:    { bg: "var(--toast-info-bg, #eff6ff)",    border: "var(--toast-info-border, #bfdbfe)",    text: "var(--toast-info-text, #1e40af)",    accent: "var(--toast-info-accent, #3b82f6)",    mark: "i" },
  };
  const tv = TOAST_VARS[type] ?? TOAST_VARS.info;
  return (
    <div
      className="toast-notification px-4 py-3 rounded-md flex items-center justify-between gap-2 animate-fadeInScale border-l-4"
      style={{ backgroundColor: tv.bg, borderColor: tv.border, borderLeftColor: tv.accent, color: tv.text }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="grid h-4 w-4 shrink-0 place-items-center rounded-full border border-current text-[10px] font-black leading-none"
          style={{ color: tv.accent }}
          aria-hidden="true"
        >
          {tv.mark}
        </span>
        <span className="text-sm font-medium">{message}</span>
      </div>
      <button
        onClick={onClose}
        className="shrink-0 text-lg transition-opacity hover:opacity-70"
        aria-label={
          lang === "ar" ? "إغلاق" : lang === "en" ? "Close" : "Fermer"
        }
      >
        ×
      </button>
    </div>
  );
}

export default function App() {
  const { dispatch, set } = useAppActions();
  const state = useAppSelector(
    (current) => ({
      splashDone: current.splashDone,
      lang: current.lang,
      sidebarOpen: current.sidebarOpen,
      displayMode: current.displayMode,
      currentSurah: current.currentSurah,
      currentAyah: current.currentAyah,
      currentPage: current.currentPage,
      currentJuz: current.currentJuz,
      showHome: current.showHome,
      showDuas: current.showDuas,
      legalPage: current.legalPage,
      focusReading: current.focusReading,
      memMode: current.memMode,
      isPlaying: current.isPlaying,
      currentPlayingAyah: current.currentPlayingAyah,
      fontFamily: current.fontFamily,
      riwaya: current.riwaya,
      reciter: current.reciter,
      warshStrictMode: current.warshStrictMode,
      translationLangs: current.translationLangs,
      searchOpen: current.searchOpen,
      settingsOpen: current.settingsOpen,
      toolsHubOpen: current.toolsHubOpen,
      futureHubOpen: current.futureHubOpen,
      bookmarksOpen: current.bookmarksOpen,
      wirdOpen: current.wirdOpen,
      historyOpen: current.historyOpen,
      playlistOpen: current.playlistOpen,
      audioMakerOpen: current.audioMakerOpen,
      flashcardsOpen: current.flashcardsOpen,
      tajweedQuizOpen: current.tajweedQuizOpen,
      khatmaOpen: current.khatmaOpen,
      comparatorOpen: current.comparatorOpen,
      shareImageOpen: current.shareImageOpen,
      weeklyStatsOpen: current.weeklyStatsOpen,
      tafsirSidebarOpen: current.tafsirSidebarOpen,
    }),
    shallowEqual,
  );
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
    legalPage,
    focusReading,
    memMode,
  } = state;

  const handleUrlRouteChange = useCallback(
    (route) => {
      set({ legalPage: null, ...route });
    },
    [set],
  );

  // Synchronisation URL ↔ état de navigation
  useUrlSync({
    showHome,
    showDuas,
    legalPage,
    displayMode,
    currentSurah,
    currentPage,
    currentJuz,
    currentAyah: state.currentAyah,
    onRouteChange: handleUrlRouteChange,
  });

  useEffect(() => {
    document.documentElement.style.setProperty("--reading-progress", "0");
  }, [currentSurah, currentJuz, currentPage, displayMode]);

  // ── Titre dynamique du navigateur (style Spotify) ────────────────────────
  useEffect(() => {
    let active = true;
    import("./services/seoService")
      .then(({ updateSeoMetadata }) => {
        if (active) updateSeoMetadata(state);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [
    showHome,
    showDuas,
    displayMode,
    currentSurah,
    currentPage,
    currentJuz,
    lang,
    state.currentAyah,
    state.isPlaying,
    state.currentPlayingAyah,
    state.legalPage,
  ]);

  const lowPerfMode = useMemo(() => isLowPerformanceDevice(), []);
  const suspenseFallback = useMemo(
    () => <AppLoadingFallback lang={lang} />,
    [lang],
  );
  const headerFallback = useMemo(
    () => <AppLoadingFallback lang={lang} variant="header" />,
    [lang],
  );
  const overlayFallback = useMemo(
    () => <AppLoadingFallback lang={lang} variant="overlay" />,
    [lang],
  );
  const [hasInteracted, setHasInteracted] = useState(false);
  const [immersiveHidden, setImmersiveHidden] = useState(false);
  const [toast, setToast] = useState(null);
  const [deferNonCriticalUI, setDeferNonCriticalUI] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const immersiveTimer = useRef(null);

  const immersiveActive = focusReading && !showHome && !showDuas && !legalPage;
  const sidebarShiftClass =
    !focusReading && sidebarOpen
      ? lang === "ar"
        ? "lg:mr-[23rem]"
        : "lg:ml-[23rem]"
      : "";
  const shouldMountAudioPlayer =
    (!showHome && !showDuas && !legalPage) ||
    state.isPlaying ||
    Boolean(state.currentPlayingAyah);
  const blockingModalOpen = Boolean(
    state.searchOpen ||
      state.settingsOpen ||
      state.toolsHubOpen ||
      state.futureHubOpen ||
      state.bookmarksOpen ||
      state.wirdOpen ||
      state.historyOpen ||
      state.playlistOpen ||
      state.audioMakerOpen ||
      state.flashcardsOpen ||
      state.tajweedQuizOpen ||
      state.khatmaOpen ||
      state.comparatorOpen ||
      state.shareImageOpen ||
      state.weeklyStatsOpen ||
      state.tafsirSidebarOpen ||
      showShortcuts,
  );

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
    let cancelIdle = () => {};
    const scheduleNonCriticalUI = () => {
      cancelIdle();
      cancelIdle = runWhenIdle(
        () => setDeferNonCriticalUI(true),
        lowPerfMode ? 2800 : 1200,
      );
    };

    if (navigator.onLine) {
      scheduleNonCriticalUI();
    } else {
      window.addEventListener("online", scheduleNonCriticalUI, { once: true });
    }

    return () => {
      cancelIdle();
      window.removeEventListener("online", scheduleNonCriticalUI);
    };
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
    if (!showHome || lowPerfMode || !deferNonCriticalUI || !hasInteracted) {
      return undefined;
    }

    let cancelled = false;
    const cancelIdle = runWhenIdle(async () => {
      try {
        const playlistModule = await import("./utils/audioPlaylist");
        const {
          riwaya,
          reciter: reciterId,
          currentSurah: surahNum,
          warshStrictMode,
        } = state;
        const safeId = ensureReciterForRiwaya(reciterId, riwaya);
        const reciter = getReciter(safeId, riwaya);
        if (!reciter) return;
        if (
          riwaya === "warsh" &&
          warshStrictMode &&
          !isWarshVerifiedReciter(reciter)
        ) {
          return;
        }

        const { buildAudioPlaylistForSurah } = playlistModule;
        const items = await buildAudioPlaylistForSurah(surahNum, riwaya);
        if (cancelled || items.length === 0) return;
        const audioService = await loadAudioService();
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

  useEffect(() => {
    if (!splashDone || showHome) return undefined;

    return runWhenIdle(
      () => loadHomePage().catch(() => null),
      lowPerfMode ? 1800 : 900,
    );
  }, [lowPerfMode, showHome, splashDone]);

  // Delegate most keyboard shortcuts to the shared hook.
  // App.jsx retains only the shortcuts that are outside the hook's scope:
  // `,` (settings), `b/B` (bookmarks), `h/H` (home), `/` (search), Alt+Up/Down.
  useKeyboardNavigation({
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
  });

  const appKeyboardSnapshotRef = useRef({});
  appKeyboardSnapshotRef.current = {
    state,
    displayMode,
    currentPage,
    currentJuz,
    lang,
  };

  const handleKeyboard = useCallback(
    (event) => {
      if (event.defaultPrevented) return;

      const {
        state,
        displayMode,
        currentPage,
        currentJuz,
        lang,
      } = appKeyboardSnapshotRef.current;

      const target = event.target;
      const isElementTarget = target instanceof Element;
      const editingTarget = isElementTarget && target.closest(
        'input, textarea, select, [contenteditable="true"], [role="textbox"], [role="combobox"], [role="slider"]',
      );
      const buttonTarget = isElementTarget && target.closest('button, [role="button"]');
      if (editingTarget || (buttonTarget && !event.ctrlKey && !event.metaKey)) {
        return;
      }

      switch (event.key) {
        case "/":
          if (state.showDuas) return;
          event.preventDefault();
          dispatch({ type: "TOGGLE_SEARCH" });
          break;
        case ",":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            dispatch({ type: "TOGGLE_SETTINGS" });
          }
          break;
        case "b":
        case "B":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            dispatch({ type: "TOGGLE_BOOKMARKS" });
          }
          break;
        case "h":
        case "H":
          if (!event.ctrlKey && !event.metaKey && (state.showDuas || !state.showHome)) {
            event.preventDefault();
            set({ showHome: true, showDuas: false });
          }
          break;
        case "ArrowUp":
          if (event.altKey && !state.showDuas) {
            event.preventDefault();
            if (displayMode === "page" && (lang === "ar" ? currentPage > 1 : currentPage < 604)) {
              set({ currentPage: lang === "ar" ? currentPage - 1 : currentPage + 1 });
            } else if (displayMode === "juz" && (lang === "ar" ? currentJuz > 1 : currentJuz < 30)) {
              dispatch({ type: "NAVIGATE_JUZ", payload: { juz: lang === "ar" ? currentJuz - 1 : currentJuz + 1 } });
            }
          }
          break;
        case "ArrowDown":
          if (event.altKey && !state.showDuas) {
            event.preventDefault();
            if (displayMode === "page" && (lang === "ar" ? currentPage < 604 : currentPage > 1)) {
              set({ currentPage: lang === "ar" ? currentPage + 1 : currentPage - 1 });
            } else if (displayMode === "juz" && (lang === "ar" ? currentJuz < 30 : currentJuz > 1)) {
              dispatch({ type: "NAVIGATE_JUZ", payload: { juz: lang === "ar" ? currentJuz + 1 : currentJuz - 1 } });
            }
          }
          break;
        default:
          break;
      }
    },
    [dispatch, set],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [handleKeyboard]);

  const handleSplashDone = useCallback(() => {
    dispatch({ type: "SPLASH_DONE" });
  }, [dispatch]);

  const handleSplashPrefetch = useCallback(async () => {
    const screenPromise = state.legalPage
      ? loadLegalPage()
      : state.showHome
        ? loadHomePage()
        : state.showDuas
          ? loadDuasPage()
          : loadQuranDisplay();

    const tasks = [loadHeader(), screenPromise];
    if (state.showHome && !state.legalPage) {
      tasks.push(
        screenPromise.then(({ preloadReciterLibrary }) =>
          preloadReciterLibrary?.(),
        ),
      );
    }
    if (!state.legalPage && !state.showHome && !state.showDuas) {
      tasks.push(
        import("./services/quranAPI").then(({ prefetchInitialData }) =>
          prefetchInitialData(state.currentSurah, state.riwaya),
        ),
      );
    }

    return Promise.allSettled(tasks);
  }, [
    state.currentSurah,
    state.legalPage,
    state.riwaya,
    state.showDuas,
    state.showHome,
  ]);

  return (
    <ErrorBoundary>
      {!splashDone ? (
        <SplashScreen
          onDone={handleSplashDone}
          onPrefetch={handleSplashPrefetch}
          lowPerfMode={lowPerfMode}
          lang={lang}
        />
      ) : null}
      <div
        className={`app-root premium-plus flex h-dvh min-h-screen w-full flex-col overflow-x-hidden ${focusReading ? "focus-reading" : ""} ${immersiveHidden ? "immersive-mode" : ""} ${sidebarOpen ? "is-sidebar-open" : ""} ${memMode ? "is-memorizing" : ""} ${!showHome && !showDuas && !legalPage ? "view-reading" : ""}`}
        style={{ height: "100dvh", minHeight: "100dvh" }}
        dir={lang === "ar" ? "rtl" : "ltr"}
        data-view={legalPage ? "legal" : showHome ? "home" : showDuas ? "duas" : "reading"}
        data-display-mode={displayMode}
        data-riwaya={state.riwaya}
        inert={blockingModalOpen ? "" : undefined}
      >
        <ProgressBar />
        <Suspense fallback={null}>
          <ConfirmDialogHost />
        </Suspense>
        <a
          href="#main-content"
          className="app-skip-link"
        >
          {t("app.skipToContent", lang)}
        </a>

        <Suspense fallback={headerFallback}>
          <Header />
        </Suspense>

        <div className="app-layout-shell relative flex min-h-0 flex-1">
          <Suspense fallback={null}>
            {(deferNonCriticalUI || sidebarOpen) && <Sidebar />}
          </Suspense>

          {sidebarOpen && (
            <div
              className="sidebar-clickout-overlay fixed inset-0 z-[999]"
              onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
              aria-hidden="true"
            />
          )}

          <main
            id="main-content"
            tabIndex={-1}
            aria-hidden={sidebarOpen ? "true" : undefined}
            inert={sidebarOpen ? "" : undefined}
            aria-label={
              legalPage
                ? lang === "ar"
                  ? "المحتوى الرئيسي - المعلومات القانونية"
                  : lang === "en"
                    ? "Main content - Legal information"
                    : "Contenu principal - Informations légales"
                : showHome
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
            className={`app-main app-main-shell flex-1 min-h-0 min-w-0 overflow-x-hidden overflow-y-auto transition-[margin] duration-300 ${sidebarShiftClass} ${showHome ? "app-main--home" : ""}`}
            style={{
              paddingBottom: "var(--player-h, 0px)",
              height: "calc(100dvh - var(--header-h, 72px))",
            }}
          >
            <div
              className={`app-view-shell ${legalPage ? "app-view-legal" : showHome ? "app-view-home" : showDuas ? "app-view-duas" : "app-view-reading"} ${!showHome && !showDuas && !legalPage ? `app-mode-${displayMode}` : ""}`}
            >
              {legalPage ? (
                <ErrorBoundary>
                  <Suspense fallback={suspenseFallback}>
                    <LegalPage page={legalPage} />
                  </Suspense>
                </ErrorBoundary>
              ) : showHome ? (
                <ErrorBoundary>
                  <Suspense fallback={suspenseFallback}>
                    <HomePage lowPerfMode={lowPerfMode} />
                  </Suspense>
                </ErrorBoundary>
              ) : showDuas ? (
                <ErrorBoundary>
                  <Suspense fallback={suspenseFallback}>
                    <DuasPage />
                  </Suspense>
                </ErrorBoundary>
              ) : (
                <ErrorBoundary>
                  <Suspense fallback={suspenseFallback}>
                    <QuranDisplay />
                  </Suspense>
                </ErrorBoundary>
              )}
            </div>
          </main>

          {showHome && !focusReading && deferNonCriticalUI && (
            <Suspense fallback={null}>
              <NotesPanel />
            </Suspense>
          )}
        </div>

        {toast && (
          <div
            className="fixed left-1/2 top-4 z-[9999] w-[min(90vw,400px)] -translate-x-1/2"
            role="alert"
            aria-live="polite"
          >
            <Toast
              type={toast.type}
              message={toast.message}
              onClose={() => setToast(null)}
              autoClose={4500}
              lang={lang}
            />
          </div>
        )}

        {shouldMountAudioPlayer && (
          <Suspense fallback={null}>
            <AudioPlayer />
          </Suspense>
        )}

        {/* ── Bouton raccourcis clavier (desktop uniquement) ───────────── */}
        {!showHome && !showDuas && !legalPage && (
          <button
            type="button"
            className="fixed bottom-6 right-6 z-[250] hidden md:flex w-9 h-9 items-center justify-center rounded-full bg-[var(--bg-card)] border border-[var(--border)] shadow-md text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all duration-200 text-sm font-bold font-mono"
            onClick={() => setShowShortcuts(true)}
            title={t("app.keyboardShortcutsHint", lang)}
            aria-label={t("app.keyboardShortcuts", lang)}
          >
            ?
          </button>
        )}

        {/* ── Modal raccourcis clavier ─────────────────────────────────── */}
        {showShortcuts && (
          <Suspense fallback={null}>
            <KeyboardShortcutsModal
              lang={lang}
              onClose={() => setShowShortcuts(false)}
            />
          </Suspense>
        )}

        <ErrorBoundary>
          <Suspense fallback={overlayFallback}>
            {state.searchOpen && <SearchModal />}
            {state.settingsOpen && <SettingsModal />}
            {state.toolsHubOpen && <ToolsHubModal />}
            {state.futureHubOpen && <FutureFeaturesModal />}
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
            {state.tafsirSidebarOpen && <TafsirSidebar />}
          </Suspense>
        </ErrorBoundary>
      </div>
      <PWAUpdateBanner />
    </ErrorBoundary>
  );
}
