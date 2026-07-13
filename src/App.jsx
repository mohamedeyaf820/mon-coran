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
import {
  getReciter,
  ensureReciterForRiwaya,
  isWarshVerifiedReciter,
} from "./data/reciters";
import { getSurah } from "./data/surahs";
import { ensureFontLoaded } from "./services/fontLoader";
import audioService from "./services/audioService";
import { runWhenIdle } from "./utils/idleUtils";
import { useUrlSync } from "./hooks/useUrlSync";
import { useKeyboardNavigation } from "./hooks/useKeyboardNavigation";
import ProgressBar from "./components/ProgressBar";
import { CheckCircle, XCircle, TriangleAlert, Info } from "lucide-react";

const HomePage = lazy(() => import("./components/HomePage"));
const Header = lazy(() => import("./components/Header"));
const QuranDisplay = lazy(() => import("./components/QuranDisplay"));
const NotesPanel = lazy(() => import("./components/NotesPanel"));
const Sidebar = lazy(() => import("./components/Sidebar"));
const AudioPlayer = lazy(() => import("./components/AudioPlayer"));
const MiniPlayer = lazy(() => import("./components/MiniPlayer"));
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
const KeyboardShortcutsModal = lazy(
  () => import("./components/KeyboardShortcutsModal"),
);
const TafsirSidebar = lazy(() => import("./components/TafsirSidebar"));
const ToolsHubModal = lazy(() => import("./components/ToolsHubModal"));

async function getAudioServiceInstance() {
  return audioService;
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
    (lowMemory ||
      lowCpu ||
      /3g|2g/.test(navigator.connection?.effectiveType || ""));

  return Boolean(
    reducedMotion || lowMemory || lowCpu || slowNetwork || constrainedMobile,
  );
}

const SUSPENSE_FALLBACK = (
  <div className="flex items-center justify-center min-h-[60vh]" role="status">
    <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" aria-hidden="true" />
    <span className="sr-only" lang="fr">Chargement en cours…</span>
  </div>
);

function Toast({ type = "info", message, onClose, autoClose = 5000 }) {
  useEffect(() => {
    if (!autoClose) return;
    const t = setTimeout(onClose, autoClose);
    return () => clearTimeout(t);
  }, [autoClose, onClose]);
  const TOAST_ICONS = { success: CheckCircle, error: XCircle, warning: TriangleAlert, info: Info };
  const styles = {
    success: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-800", bar: "border-l-4 border-l-emerald-500", iconColor: "text-emerald-500" },
    error:   { bg: "bg-red-50 border-red-200",         text: "text-red-800",     bar: "border-l-4 border-l-red-500",     iconColor: "text-red-500" },
    warning: { bg: "bg-orange-50 border-orange-200",   text: "text-orange-800",  bar: "border-l-4 border-l-orange-500",  iconColor: "text-amber-500" },
    info:    { bg: "bg-blue-50 border-blue-200",        text: "text-blue-800",    bar: "border-l-4 border-l-blue-500",    iconColor: "text-blue-500" },
  }[type] ?? {};
  const ToastIcon = TOAST_ICONS[type];
  return (
    <div className={`toast-notification ${styles.bg} ${styles.bar} ${styles.text} px-4 py-3 rounded-md flex items-center justify-between gap-2 animate-fadeInScale`}>
      <div className="flex items-center gap-2 min-w-0">
        {ToastIcon && <ToastIcon size={16} className={`${styles.iconColor} shrink-0`} aria-hidden="true" />}
        <span className="text-sm font-medium">{message}</span>
      </div>
      <button onClick={onClose} className="text-lg hover:opacity-70 transition-opacity shrink-0" aria-label="Fermer">×</button>
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
    focusReading,
    memMode,
  } = state;

  const handleUrlRouteChange = useCallback(
    (route) => {
      set(route);
    },
    [set],
  );

  // Synchronisation URL ↔ état de navigation
  useUrlSync({
    showHome,
    showDuas,
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
    const APP_NAME = "MushafPlus";
    const { isPlaying, currentPlayingAyah } = state;

    if (showHome) {
      document.title = APP_NAME;
      return;
    }
    if (showDuas) {
      document.title =
        lang === "ar"
          ? `الأدعية · ${APP_NAME}`
          : lang === "fr"
            ? `Douas · ${APP_NAME}`
            : `Duas · ${APP_NAME}`;
      return;
    }

    // Helper : nom de sourate selon la langue
    const surahLabel = (surahNum) => {
      const s = getSurah(surahNum);
      if (!s) return `S${surahNum}`;
      return lang === "ar" ? s.ar : lang === "fr" ? s.fr : s.en;
    };

    if (isPlaying && currentPlayingAyah) {
      document.title = `${surahLabel(currentPlayingAyah.surah)} · ${APP_NAME}`;
      return;
    }

    // En lecture sans audio actif — afficher la position
    if (displayMode === "surah") {
      document.title = `${surahLabel(currentSurah)} · ${APP_NAME}`;
    } else if (displayMode === "page") {
      document.title =
        lang === "ar"
          ? `صفحة ${currentPage} · ${APP_NAME}`
          : lang === "fr"
            ? `Page ${currentPage} · ${APP_NAME}`
            : `Page ${currentPage} · ${APP_NAME}`;
    } else if (displayMode === "juz") {
      document.title =
        lang === "ar"
          ? `الجزء ${currentJuz} · ${APP_NAME}`
          : lang === "fr"
            ? `Juz ${currentJuz} · ${APP_NAME}`
            : `Juz ${currentJuz} · ${APP_NAME}`;
    } else {
      document.title = APP_NAME;
    }

    return () => {
      // Restaurer le titre par défaut si le composant se démonte
      document.title = APP_NAME;
    };
  }, [
    showHome,
    showDuas,
    displayMode,
    currentSurah,
    currentPage,
    currentJuz,
    lang,
    state.isPlaying,
    state.currentPlayingAyah,
  ]);

  const lowPerfMode = useMemo(() => detectLowPerformanceDevice(), []);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [immersiveHidden, setImmersiveHidden] = useState(false);
  const [toast, setToast] = useState(null);
  const [deferNonCriticalUI, setDeferNonCriticalUI] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const immersiveTimer = useRef(null);

  const immersiveActive = focusReading && !showHome && !showDuas;
  const sidebarShiftClass =
    !focusReading && sidebarOpen
      ? lang === "ar"
        ? "lg:mr-[23rem]"
        : "lg:ml-[23rem]"
      : "";
  const shouldMountAudioPlayer =
    !showHome ||
    deferNonCriticalUI ||
    hasInteracted ||
    state.isPlaying ||
    Boolean(state.currentPlayingAyah);

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
    ensureFontLoaded(state.fontFamily).catch(() => {});
  }, [state.fontFamily]);

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
        const { buildAudioPlaylistForSurah } = await import("./utils/audioPlaylist");
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
      if (
        isElementTarget &&
        target.closest(
          'input, textarea, select, button, [contenteditable="true"], [role="textbox"], [role="combobox"], [role="slider"]',
        )
      ) {
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
        data-riwaya={state.riwaya}
      >
        <ProgressBar />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[10000] focus:rounded-xl focus:bg-[var(--theme-panel-bg-strong,var(--bg-card))] focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--text-primary)] focus:shadow-[0_10px_24px_rgba(2,8,23,0.18)]"
        >
          {t("app.skipToContent", lang)}
        </a>

        <Suspense fallback={SUSPENSE_FALLBACK}>
          <Header />
        </Suspense>

        <div className="app-layout-shell relative flex min-h-0 flex-1">
          <Suspense fallback={SUSPENSE_FALLBACK}>
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
            className={`app-main app-main-shell flex-1 min-h-0 min-w-0 overflow-x-hidden overflow-y-auto transition-[margin] duration-300 ${sidebarShiftClass} ${showHome ? "app-main--home" : ""}`}
            style={{
              paddingBottom: 'calc(var(--player-h, 0px) + var(--mini-player-h, 0px))',
              height: "calc(100dvh - var(--header-h, 72px))",
            }}
          >
            <div
              className={`app-view-shell ${showHome ? "app-view-home" : showDuas ? "app-view-duas" : "app-view-reading"} ${!showHome && !showDuas ? `app-mode-${displayMode}` : ""}`}
            >
              {showHome ? (
                <ErrorBoundary>
                  <Suspense fallback={SUSPENSE_FALLBACK}>
                    <HomePage lowPerfMode={lowPerfMode} />
                  </Suspense>
                </ErrorBoundary>
              ) : showDuas ? (
                <ErrorBoundary>
                  <Suspense fallback={SUSPENSE_FALLBACK}>
                    <DuasPage />
                  </Suspense>
                </ErrorBoundary>
              ) : (
                <ErrorBoundary>
                  <Suspense fallback={SUSPENSE_FALLBACK}>
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
                </ErrorBoundary>
              )}
            </div>
          </main>

          {showHome && !focusReading && deferNonCriticalUI && (
            <Suspense fallback={SUSPENSE_FALLBACK}>
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
            />
          </div>
        )}

        {shouldMountAudioPlayer && (
          <Suspense fallback={null}>
            <AudioPlayer />
          </Suspense>
        )}

        {/* ── Mini-player persistant (barre fixe au bas de chaque page) ────── */}
        <Suspense fallback={null}>
          <MiniPlayer />
        </Suspense>

        {/* ── Bouton raccourcis clavier (desktop uniquement) ───────────── */}
        {!showHome && !showDuas && (
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
          <Suspense fallback={SUSPENSE_FALLBACK}>
            {state.searchOpen && <SearchModal />}
            {state.settingsOpen && <SettingsModal />}
            {state.toolsHubOpen && <ToolsHubModal />}
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
