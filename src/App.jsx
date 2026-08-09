import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
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
let resolvedQuranDisplay;
const loadQuranDisplay = () =>
  import("./components/QuranDisplay").then((module) => {
    resolvedQuranDisplay = module.default;
    return module;
  });
if (typeof globalThis !== "undefined") {
  globalThis.__mushafPlusLoadQuranDisplay = loadQuranDisplay;
}
const loadHeader = () => import("./components/Header");
const loadLegalPage = () => import("./components/LegalPage");
const loadDuasPage = () => import("./components/DuasPage");
const HomePage = lazy(loadHomePage);
const Header = lazy(loadHeader);
const QuranDisplay = lazy(loadQuranDisplay);
const LegalPage = lazy(loadLegalPage);
const NotFoundPage = lazy(() => import("./components/NotFoundPage"));
const ConfirmDialogHost = lazy(() => import("./components/ConfirmDialogHost"));
const Sidebar = lazy(() => import("./components/Sidebar"));
const AudioPlayer = lazy(() => import("./components/AudioPlayer"));
const SearchModal = lazy(() => import("./components/SearchModal"));
const SettingsModal = lazy(() => import("./components/SettingsModal"));
const LibraryModal = lazy(() => import("./components/LibraryModal"));
const DuasPage = lazy(loadDuasPage);
const AyahSharePanel = lazy(() => import("./components/AyahSharePanel"));
const KeyboardShortcutsModal = lazy(
  () => import("./components/KeyboardShortcutsModal"),
);
const TafsirSidebar = lazy(() => import("./components/TafsirSidebar"));

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
      homeSection: current.homeSection,
      showHome: current.showHome,
      showDuas: current.showDuas,
      legalPage: current.legalPage,
      routeNotFound: current.routeNotFound,
      focusReading: current.focusReading,
      isPlaying: current.isPlaying,
      currentPlayingAyah: current.currentPlayingAyah,
      fontFamily: current.fontFamily,
      riwaya: current.riwaya,
      reciter: current.reciter,
      warshStrictMode: current.warshStrictMode,
      translationLangs: current.translationLangs,
      searchOpen: current.searchOpen,
      settingsOpen: current.settingsOpen,
      libraryOpen: current.libraryOpen,
      shareImageOpen: current.shareImageOpen,
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
    routeNotFound,
    focusReading,
  } = state;

  const handleUrlRouteChange = useCallback(
    (route) => {
      set({ legalPage: null, routeNotFound: false, ...route });
    },
    [set],
  );

  // Synchronisation URL ↔ état de navigation
  useUrlSync({
    showHome,
    showDuas,
    legalPage,
    routeNotFound,
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
    state.routeNotFound,
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
  const ActiveQuranDisplay = resolvedQuranDisplay || QuranDisplay;
  const [toast, setToast] = useState(null);
  const [deferNonCriticalUI, setDeferNonCriticalUI] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const immersiveTimer = useRef(null);
  const immersiveScrollTop = useRef(0);
  const immersiveRevealUntil = useRef(0);
  const mainScrollRef = useRef(null);

  useEffect(() => {
    const openShortcuts = () => setShowShortcuts(true);
    window.addEventListener("mushafplus-open-shortcuts", openShortcuts);
    return () => window.removeEventListener("mushafplus-open-shortcuts", openShortcuts);
  }, []);

  const immersiveActive = !showHome && !showDuas && !legalPage && !routeNotFound;
  const sidebarShiftClass =
    !focusReading && sidebarOpen
      ? lang === "ar"
        ? "lg:mr-[23rem]"
        : "lg:ml-[23rem]"
      : "";
  const shouldMountAudioPlayer =
    (!showHome && !showDuas && !legalPage && !routeNotFound) ||
    state.isPlaying ||
    Boolean(state.currentPlayingAyah);
  const blockingModalOpen = Boolean(
    state.searchOpen ||
      state.settingsOpen ||
      state.libraryOpen ||
      state.shareImageOpen ||
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

  const revealImmersiveChrome = useCallback(() => {
    clearTimeout(immersiveTimer.current);
    setImmersiveHidden(false);
  }, []);

  useEffect(() => {
    if (!immersiveActive || !state.isPlaying) return;
    immersiveRevealUntil.current = Date.now() + 1800;
    revealImmersiveChrome();
  }, [immersiveActive, revealImmersiveChrome, state.isPlaying]);

  useEffect(() => {
    if (!immersiveActive || blockingModalOpen || sidebarOpen) {
      setImmersiveHidden(false);
      clearTimeout(immersiveTimer.current);
      return;
    }

    const scrollContainer = mainScrollRef.current;
    if (!scrollContainer) return undefined;
    immersiveScrollTop.current = scrollContainer.scrollTop;

    const scheduleHide = () => {
      clearTimeout(immersiveTimer.current);
      if (scrollContainer.scrollTop < 88) return;
      immersiveTimer.current = setTimeout(() => setImmersiveHidden(true), 2800);
    };

    const showChrome = () => {
      setImmersiveHidden(false);
      scheduleHide();
    };

    const handleScroll = () => {
      const nextTop = scrollContainer.scrollTop;
      const delta = nextTop - immersiveScrollTop.current;
      immersiveScrollTop.current = nextTop;

      if (Date.now() < immersiveRevealUntil.current) {
        setImmersiveHidden(false);
        return;
      }

      if (nextTop < 40 || delta < -8) {
        showChrome();
      } else if (delta > 8 && nextTop > 88) {
        clearTimeout(immersiveTimer.current);
        setImmersiveHidden(true);
      }
    };

    const handlePointerMove = (event) => {
      if (event.clientY <= 64 || event.clientY >= window.innerHeight - 88) {
        showChrome();
      }
    };

    const handleKeyboard = (event) => {
      if (["Tab", "Escape", "Home", "PageUp", "ArrowUp"].includes(event.key)) {
        showChrome();
      }
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("keydown", handleKeyboard);

    return () => {
      clearTimeout(immersiveTimer.current);
      scrollContainer.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("keydown", handleKeyboard);
    };
  }, [blockingModalOpen, immersiveActive, sidebarOpen]);

  useLayoutEffect(() => {
    if (!immersiveActive) return;
    const scrollContainer = mainScrollRef.current;
    const preservedTop = immersiveScrollTop.current;
    if (
      scrollContainer &&
      preservedTop > 0 &&
      Math.abs(scrollContainer.scrollTop - preservedTop) > 2
    ) {
      scrollContainer.scrollTop = preservedTop;
    }
  }, [immersiveActive, immersiveHidden]);

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
            dispatch({ type: "TOGGLE_LIBRARY" });
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
    const screenPromise = state.routeNotFound
      ? import("./components/NotFoundPage")
      : state.legalPage
        ? loadLegalPage()
        : state.showHome
        ? loadHomePage()
        : state.showDuas
          ? loadDuasPage()
          : loadQuranDisplay();

    const criticalTasks = [loadHeader(), screenPromise];
    if (!state.legalPage && !state.routeNotFound && !state.showHome && !state.showDuas) {
      // Start the Quran request early, but let the reader shell render instead
      // of keeping the user behind the splash until the network settles.
      import("./services/quranAPI")
        .then(({ prefetchInitialData }) =>
          prefetchInitialData(state.currentSurah, state.riwaya),
        )
        .catch(() => null);
    }

    return Promise.allSettled(criticalTasks);
  }, [
    state.currentSurah,
    state.legalPage,
    state.routeNotFound,
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
        className={`app-root premium-plus flex h-dvh min-h-screen w-full flex-col overflow-x-hidden ${focusReading ? "focus-reading" : ""} ${immersiveHidden ? "immersive-mode" : ""} ${sidebarOpen ? "is-sidebar-open" : ""} ${!showHome && !showDuas && !legalPage && !routeNotFound ? "view-reading" : ""}`}
        style={{ height: "100dvh", minHeight: "100dvh" }}
        dir={lang === "ar" ? "rtl" : "ltr"}
        data-view={routeNotFound ? "not-found" : legalPage ? "legal" : showHome ? "home" : showDuas ? "duas" : "reading"}
        data-home-section={showHome ? state.homeSection || "surah" : undefined}
        data-display-mode={displayMode}
        data-riwaya={state.riwaya}
        inert={blockingModalOpen ? "" : undefined}
      >
        {!showHome && !showDuas && !legalPage && !routeNotFound ? <ProgressBar /> : null}
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
          <Header immersiveHidden={immersiveHidden} />
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
            ref={mainScrollRef}
            id="main-content"
            tabIndex={-1}
            aria-hidden={sidebarOpen ? "true" : undefined}
            inert={sidebarOpen ? "" : undefined}
            aria-label={
              routeNotFound
                ? lang === "fr"
                  ? "Contenu principal - Page introuvable"
                  : lang === "ar"
                    ? "المحتوى الرئيسي - الصفحة غير موجودة"
                    : "Main content - Page not found"
                : legalPage
                ? legalPage === "surahs"
                  ? lang === "ar"
                    ? "المحتوى الرئيسي - قائمة السور"
                    : lang === "en"
                      ? "Main content - Surah directory"
                      : "Contenu principal - Liste des sourates"
                  : lang === "ar"
                    ? "المحتوى الرئيسي - معلومات المشروع"
                    : lang === "en"
                      ? "Main content - Project information"
                      : "Contenu principal - Informations du projet"
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
              paddingBottom: immersiveHidden
                ? "env(safe-area-inset-bottom, 0px)"
                : "var(--player-h, 0px)",
              height: immersiveHidden
                ? "100dvh"
                : "calc(100dvh - var(--header-h, 72px))",
            }}
          >
            <div
              className={`app-view-shell ${routeNotFound ? "app-view-not-found" : legalPage ? "app-view-legal" : showHome ? "app-view-home" : showDuas ? "app-view-duas" : "app-view-reading"} ${!showHome && !showDuas && !legalPage && !routeNotFound ? `app-mode-${displayMode}` : ""}`}
            >
              {routeNotFound ? (
                <ErrorBoundary>
                  <Suspense fallback={suspenseFallback}>
                    <NotFoundPage />
                  </Suspense>
                </ErrorBoundary>
              ) : legalPage ? (
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
                    <ActiveQuranDisplay />
                  </Suspense>
                </ErrorBoundary>
              )}
            </div>
          </main>
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

        {immersiveActive && immersiveHidden ? (
          <div className="immersive-reveal-controls">
            {["top", "bottom"].map((edge) => (
              <button
                key={edge}
                type="button"
                className={`immersive-reveal immersive-reveal--${edge}`}
                onClick={revealImmersiveChrome}
                style={{
                  position: "fixed",
                  left: "50%",
                  [edge]: edge === "bottom"
                    ? "env(safe-area-inset-bottom, 0px)"
                    : 0,
                  zIndex: 240,
                  width: 80,
                  height: 44,
                  display: "grid",
                  placeItems: "center",
                  padding: 0,
                  transform: "translateX(-50%)",
                  border: 0,
                  background: "transparent",
                  color: "var(--primary)",
                  cursor: "pointer",
                }}
                aria-label={
                  lang === "ar"
                    ? "Ø¥Ø¸Ù‡Ø§Ø± Ø£Ø¯ÙˆØ§Øª Ø§Ù„Ù‚Ø±Ø§Ø¡Ø©"
                    : lang === "en"
                      ? "Show reading controls"
                      : "Afficher les commandes de lecture"
                }
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 34,
                    height: 4,
                    borderRadius: 999,
                    background: "currentColor",
                    boxShadow: "0 0 0 4px color-mix(in srgb, var(--bg-card) 78%, transparent)",
                  }}
                />
              </button>
            ))}
          </div>
        ) : null}

        {shouldMountAudioPlayer && (
          <div aria-hidden={immersiveHidden ? "true" : undefined} inert={immersiveHidden ? "" : undefined}>
            <Suspense fallback={null}>
              <AudioPlayer />
            </Suspense>
          </div>
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
            {state.libraryOpen && <LibraryModal />}
            {state.shareImageOpen && <AyahSharePanel />}
            {state.tafsirSidebarOpen && <TafsirSidebar />}
          </Suspense>
        </ErrorBoundary>
      </div>
      <PWAUpdateBanner />
    </ErrorBoundary>
  );
}
