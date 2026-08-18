import React, {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Pause,
  Play,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import SURAHS, { getSurah, toAr } from "../../data/surahs";
import { getReciter } from "../../data/reciters";
import { t } from "../../i18n";
import audioService, { AudioService } from "../../services/audioService";
import AyahMarker from "../Quran/AyahMarker";
import Bismillah from "../Quran/Bismillah";
import { CleanPageSurahHeader } from "../Quran/CleanPageDecor";
import SmartAyahRenderer from "../Quran/SmartAyahRenderer";
import AyahActionsModal from "./AyahActionsModal";
import { preloadQuranDisplayData } from "./useQuranDisplayData";

const MIN_ZOOM = 1;
const MAX_ZOOM = 1.85;
const ZOOM_STEP = 0.15;
const PAGE_WINDOW_RADIUS = 4;
const PAGE_CACHE_RADIUS = 6;
const CONTEXT_CHROME_IDLE_MS = 2800;
const SCROLL_SETTLE_MS = 220;

function clampZoom(value) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function getAyahSurah(ayah, fallback) {
  return Number(ayah?.surah?.number || ayah?.surah || fallback || 1);
}

const ImmersiveMushafPage = memo(function ImmersiveMushafPage({
  ayahs,
  currentPlayingAyah,
  fallbackSurah,
  lang,
  page,
  riwaya,
  fontSize,
  selectedAyah,
  showTajwid,
  onOpenAyahActions,
  onPlayAyah,
  onPointerDownAyah,
}) {
  const clickTimerRef = useRef(null);
  const lastTouchRef = useRef({ key: "", time: 0 });
  const suppressClickRef = useRef(false);

  useEffect(
    () => () => {
      if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current);
    },
    [],
  );

  const firstSurah = getAyahSurah(ayahs[0], fallbackSurah);
  const surah = getSurah(firstSurah);
  const pageLabel = lang === "ar" ? toAr(page) : page;

  return (
    <section
      className="mfp-page-surface"
      data-mfp-page={page}
      aria-label={`${t("quran.page", lang)} ${pageLabel}`}
      style={{
        "--mfp-page-font-size": `${fontSize}px`,
      }}
    >
      <article
        className="mfp-page-sheet"
        dir="rtl"
        lang="ar"
      >
        <div className="mfp-page-meta" aria-hidden="true">
          <span>{surah?.ar}</span>
          <span>{t("quran.page", lang)} {pageLabel}</span>
        </div>

        <div className="mfp-quran-flow">
          {ayahs.flatMap((ayah) => {
            const ayahSurah = getAyahSurah(ayah, firstSurah);
            const isPlaying =
              Number(currentPlayingAyah?.ayah) === Number(ayah.numberInSurah) &&
              Number(currentPlayingAyah?.surah) === ayahSurah;
            const blocks = [];

            if (Number(ayah.numberInSurah) === 1) {
              const metadata = getSurah(ayahSurah);
              if (metadata) {
                blocks.push(
                  <div
                    key={`mfp-surah-${page}-${ayahSurah}`}
                    className="mfp-surah-break"
                    aria-hidden="true"
                  >
                    <CleanPageSurahHeader surahMeta={metadata} lang={lang} />
                    {ayahSurah !== 1 && ayahSurah !== 9 ? <Bismillah /> : null}
                  </div>,
                );
              }
            }

            blocks.push(
              <span
                key={ayah.number || `${ayahSurah}:${ayah.numberInSurah}`}
                className={`mfp-ayah${isPlaying ? " mfp-ayah--playing" : ""}${
                  Number(selectedAyah?.surah) === ayahSurah &&
                  Number(selectedAyah?.ayah) === Number(ayah.numberInSurah)
                    ? " mfp-ayah--selected"
                    : ""
                }`}
                data-surah-number={ayahSurah}
                data-ayah-number={ayah.numberInSurah}
                aria-current={isPlaying ? "true" : undefined}
                onPointerDown={() => onPointerDownAyah?.(ayah)}
                onClick={(event) => {
                  event.stopPropagation();
                  if (suppressClickRef.current) {
                    suppressClickRef.current = false;
                    return;
                  }
                  if (event.detail > 1) {
                    if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current);
                    clickTimerRef.current = null;
                    onOpenAyahActions?.(ayah);
                    return;
                  }
                  if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current);
                  clickTimerRef.current = window.setTimeout(() => {
                    onPlayAyah?.(ayah, ayahs, page);
                    clickTimerRef.current = null;
                  }, 230);
                }}
                onPointerUp={(event) => {
                  if (event.pointerType !== "touch") return;
                  const key = `${ayahSurah}:${ayah.numberInSurah}`;
                  const now = performance.now();
                  if (
                    lastTouchRef.current.key === key &&
                    now - lastTouchRef.current.time < 360
                  ) {
                    event.preventDefault();
                    event.stopPropagation();
                    if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current);
                    clickTimerRef.current = null;
                    suppressClickRef.current = true;
                    lastTouchRef.current = { key: "", time: 0 };
                    onOpenAyahActions?.(ayah);
                    return;
                  }
                  lastTouchRef.current = { key, time: now };
                }}
                onDoubleClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current);
                  clickTimerRef.current = null;
                  onOpenAyahActions?.(ayah);
                }}
              >
                <SmartAyahRenderer
                  ayah={ayah}
                  appendNativeMarker={false}
                  isPlaying={isPlaying}
                  riwaya={riwaya}
                  showTajwid={showTajwid}
                  surahNum={ayahSurah}
                />
                <AyahMarker
                  number={ayah.numberInSurah}
                  isPlaying={isPlaying}
                  className="mfp-ayah-marker"
                />
              </span>,
            );

            return blocks;
          })}
        </div>

        <div className="mfp-page-folio" aria-hidden="true">
          <span />
          <strong>{pageLabel}</strong>
          <span />
        </div>
      </article>
    </section>
  );
});

export default function FullscreenMushafOverlay({
  ayahs,
  currentPage,
  currentPlayingAyah,
  currentSurah,
  fullPage,
  lang,
  onClose,
  onOpenPlayer,
  onNextPage,
  onPlayAyah,
  onPrevPage,
  getTranslationForAyah,
  riwaya,
}) {
  const { state, dispatch } = useApp();
  const containerRef = useRef(null);
  const viewportRef = useRef(null);
  const pinchRef = useRef(null);
  const pinchFrameRef = useRef(null);
  const pendingZoomRef = useRef(null);
  const swipeRef = useRef(null);
  const requestedPageRef = useRef(null);
  const scrollDrivenRef = useRef(false);
  const alignedRef = useRef(false);
  const chromeTimerRef = useRef(null);
  const scrollSettleTimerRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pageCache, setPageCache] = useState(() => new Map([[currentPage, ayahs]]));
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [selectedAyah, setSelectedAyah] = useState(null);
  const [zoomNotice, setZoomNotice] = useState(false);
  const [targetSurah, setTargetSurah] = useState(String(currentSurah || 1));
  const titleId = "mfp-title";
  // Vertical reading is always available; horizontal swiping is an additional
  // gesture, not a competing navigation mode.
  const pageFlow = "vertical";
  const showTajwid = Boolean(state.showTajwid);
  const hasActiveAudio = Boolean(state.isPlaying && state.currentPlayingAyah);
  const hasAudioSession = hasActiveAudio || Boolean(state.currentPlayingAyah);
  const currentPageAyahs = pageCache.get(currentPage) || ayahs;
  const openingAyah = currentPageAyahs.find(
    (ayah) => Number(ayah?.numberInSurah) === 1,
  );
  const visibleSurah = getAyahSurah(
    openingAyah || currentPageAyahs?.[0],
    currentSurah,
  );
  const activeSurah = getSurah(visibleSurah);
  const activeSurahName = activeSurah
    ? lang === "ar"
      ? activeSurah.ar
      : lang === "en"
        ? activeSurah.en
        : activeSurah.fr
    : "";
  const activeReciter = getReciter(state.reciter, riwaya);
  const activeReciterRef = useRef(activeReciter);
  activeReciterRef.current = activeReciter;

  const reciterLabel =
    lang === "ar"
      ? activeReciter?.name
      : lang === "en"
        ? activeReciter?.nameEn
        : activeReciter?.nameFr || activeReciter?.nameEn;
  const chromeLabels =
    lang === "ar"
      ? {
          go: "انتقال",
          reader: "المشغل والقرّاء",
          reciter: "القارئ",
          surah: "السورة",
        }
      : lang === "en"
        ? {
            go: "Go",
            reader: "Player and reciters",
            reciter: "Reciter",
            surah: "Surah",
          }
        : {
            go: "Aller",
            reader: "Lecteur et récitateur",
            reciter: "Récitateur",
            surah: "Sourate",
          };

  const handlePointerDownAyah = useCallback((ayah) => {
    const reciter = activeReciterRef.current;
    if (!reciter?.cdn) return;
    const url = AudioService.buildUrl(reciter.cdn, ayah, reciter.cdnType || "islamic");
    audioService._preloadTrack(url);
  }, []);

  const clearChromeTimer = useCallback(() => {
    if (chromeTimerRef.current) clearTimeout(chromeTimerRef.current);
    chromeTimerRef.current = null;
  }, []);

  const hideChrome = useCallback(() => {
    setNavigationOpen(false);
    setPlayerOpen(false);
  }, []);

  const scheduleChromeHide = useCallback(() => {
    clearChromeTimer();
    chromeTimerRef.current = window.setTimeout(hideChrome, CONTEXT_CHROME_IDLE_MS);
  }, [clearChromeTimer, hideChrome]);

  const revealNavigation = useCallback(() => {
    setNavigationOpen(true);
    scheduleChromeHide();
  }, [scheduleChromeHide]);

  const revealPlayer = useCallback(() => {
    if (!hasAudioSession) return;
    setPlayerOpen(true);
    scheduleChromeHide();
  }, [hasAudioSession, scheduleChromeHide]);

  const revealContextChrome = useCallback(() => {
    setNavigationOpen(true);
    if (hasAudioSession) setPlayerOpen(true);
    scheduleChromeHide();
  }, [hasAudioSession, scheduleChromeHide]);

  const updateZoom = useCallback((nextZoom) => {
    setZoom(clampZoom(nextZoom));
    setZoomNotice(true);
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setZoomNotice(true);
  }, []);

  const changePage = useCallback(
    (direction, fromScroll = false) => {
      const target = direction === "next" ? currentPage + 1 : currentPage - 1;
      if (target < 1 || target > 604 || requestedPageRef.current === target) return;
      requestedPageRef.current = target;
      scrollDrivenRef.current = fromScroll;
      // A page warmed by the rolling window can become active immediately.
      // This removes the network wait that previously made scrolling stop at
      // the visible edge. The outer reader will reuse the same prefetch cache.
      if (pageCache.has(target)) {
        dispatch({ type: "NAVIGATE_PAGE", payload: { page: target } });
      } else if (direction === "next") onNextPage?.();
      else onPrevPage?.();
    },
    [currentPage, dispatch, onNextPage, onPrevPage, pageCache],
  );

  useEffect(() => {
    setPageCache((current) => {
      const next = new Map(current);
      next.set(currentPage, ayahs);
      for (const page of next.keys()) {
        if (Math.abs(page - currentPage) > PAGE_CACHE_RADIUS) next.delete(page);
      }
      return next;
    });
    requestedPageRef.current = null;
  }, [ayahs, currentPage]);

  useEffect(() => {
    setTargetSurah(String(visibleSurah || currentSurah || 1));
  }, [currentSurah, visibleSurah]);

  useEffect(() => {
    if (hasAudioSession) {
      revealPlayer();
      return;
    }
    setPlayerOpen(false);
  }, [hasAudioSession, revealPlayer]);

  useEffect(() => {
    if (!fullPage) return undefined;
    let cancelled = false;
    const neighbours = Array.from(
      { length: PAGE_WINDOW_RADIUS * 2 + 1 },
      (_, index) => currentPage + index - PAGE_WINDOW_RADIUS,
    ).filter((page) => page >= 1 && page <= 604 && !pageCache.has(page));

    Promise.all(
      neighbours.map(async (page) => {
        const result = await preloadQuranDisplayData({
          currentJuz: state.currentJuz,
          currentPage: page,
          currentSurah,
          displayMode: "page",
          lang,
          riwaya,
          warshStrictMode: state.warshStrictMode,
        });
        return [page, result.ayahs];
      }),
    )
      .then((entries) => {
        if (cancelled || !entries.length) return;
        setPageCache((current) => {
          const next = new Map(current);
          entries.forEach(([page, pageAyahs]) => next.set(page, pageAyahs));
          return next;
        });
      })
      .catch(() => null);

    return () => {
      cancelled = true;
    };
  }, [
    currentPage,
    currentSurah,
    fullPage,
    lang,
    pageCache,
    riwaya,
    state.currentJuz,
    state.warshStrictMode,
  ]);

  const visiblePages = useMemo(() => {
    return Array.from(
      { length: PAGE_WINDOW_RADIUS * 2 + 1 },
      (_, index) => currentPage + index - PAGE_WINDOW_RADIUS,
    )
      .filter((page) => page >= 1 && page <= 604 && pageCache.has(page))
      .map((page) => [page, pageCache.get(page)]);
  }, [currentPage, pageCache]);

  const selectedAyahReference = useMemo(
    () =>
      selectedAyah
        ? {
            surah: getAyahSurah(selectedAyah, visibleSurah),
            ayah: selectedAyah.numberInSurah,
          }
        : null,
    [selectedAyah, visibleSurah],
  );

  useLayoutEffect(() => {
    if (!fullPage || pageFlow !== "vertical") return;
    const viewport = viewportRef.current;
    const page = viewport?.querySelector(`[data-mfp-page="${currentPage}"]`);
    if (!viewport || !page) return;

    if (!alignedRef.current || !scrollDrivenRef.current) {
      viewport.scrollTo({ top: page.offsetTop, behavior: alignedRef.current ? "smooth" : "auto" });
    }
    alignedRef.current = true;
    scrollDrivenRef.current = false;
  }, [currentPage, fullPage, pageFlow]);

  useLayoutEffect(() => {
    if (!fullPage || pageFlow !== "horizontal") return;
    viewportRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [currentPage, fullPage, pageFlow]);

  useEffect(() => {
    if (!fullPage || pageFlow !== "vertical") return undefined;
    const viewport = viewportRef.current;
    if (!viewport || typeof IntersectionObserver !== "function") return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible || visible.intersectionRatio < 0.68) return;
        const page = Number(visible.target.dataset.mfpPage);
        if (page === currentPage + 1) changePage("next", true);
        if (page === currentPage - 1) changePage("previous", true);
      },
      { root: viewport, threshold: [0.68, 0.82] },
    );

    viewport.querySelectorAll("[data-mfp-page]").forEach((page) => observer.observe(page));
    return () => observer.disconnect();
  }, [changePage, currentPage, fullPage, pageFlow, visiblePages]);

  useEffect(() => {
    if (!fullPage) return undefined;
    const el = containerRef.current;
    if (!el) return undefined;

    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    document.body.classList.add("mfp-open");
    el.focus();

    const onKey = (event) => {
      if (event.key === "Escape") {
        if (
          document.querySelector(
            ".ayah-actions-modal--fullscreen, .audio-player-modal--simple",
          )
        ) {
          return;
        }
        onClose();
        return;
      }
      if (event.key === "ArrowLeft" && zoom <= 1.01) {
        changePage("previous");
        return;
      }
      if (event.key === "ArrowRight" && zoom <= 1.01) {
        changePage("next");
        return;
      }
      if (event.key === "+" || event.key === "=") {
        updateZoom(zoom + ZOOM_STEP);
        return;
      }
      if (event.key === "-") {
        updateZoom(zoom - ZOOM_STEP);
        return;
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (pinchFrameRef.current) cancelAnimationFrame(pinchFrameRef.current);
      clearChromeTimer();
      if (scrollSettleTimerRef.current) clearTimeout(scrollSettleTimerRef.current);
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
      document.body.classList.remove("mfp-open");
      previousFocus?.focus?.();
    };
  }, [changePage, clearChromeTimer, fullPage, onClose, updateZoom, zoom]);

  useEffect(() => {
    setZoom(1);
    alignedRef.current = false;
  }, [fullPage]);

  useEffect(() => {
    if (!zoomNotice) return undefined;
    const timer = window.setTimeout(() => setZoomNotice(false), 1150);
    return () => window.clearTimeout(timer);
  }, [zoomNotice]);

  const handleTouchStart = (event) => {
    if (event.touches.length === 2) {
      const [first, second] = event.touches;
      pinchRef.current = {
        distance: Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY),
        zoom,
      };
      swipeRef.current = null;
      return;
    }
    if (event.touches.length === 1) {
      swipeRef.current = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
        time: performance.now(),
      };
    }
  };

  const handleTouchMove = (event) => {
    if (event.touches.length !== 2 || !pinchRef.current) return;
    event.preventDefault();
    const [first, second] = event.touches;
    const distance = Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
    pendingZoomRef.current = pinchRef.current.zoom * (distance / pinchRef.current.distance);
    if (pinchFrameRef.current) return;
    pinchFrameRef.current = requestAnimationFrame(() => {
      pinchFrameRef.current = null;
      if (pendingZoomRef.current != null) updateZoom(pendingZoomRef.current);
      pendingZoomRef.current = null;
    });
  };

  const handleTouchEnd = (event) => {
    if (pinchRef.current) {
      if (event.touches.length < 2) {
        pinchRef.current = null;
        pendingZoomRef.current = null;
      }
      return;
    }
    const start = swipeRef.current;
    swipeRef.current = null;
    if (!start || !event.changedTouches[0]) return;
    const deltaX = event.changedTouches[0].clientX - start.x;
    const deltaY = event.changedTouches[0].clientY - start.y;
    const elapsed = performance.now() - start.time;
    if (elapsed > 720 || Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY) * 1.15) return;
    changePage(deltaX > 0 ? "next" : "previous");
  };

  const handleViewportScroll = useCallback(
    (event) => {
      if (scrollSettleTimerRef.current) clearTimeout(scrollSettleTimerRef.current);
      if (hasAudioSession) {
        scrollSettleTimerRef.current = window.setTimeout(
          revealPlayer,
          SCROLL_SETTLE_MS,
        );
      }
      if (requestedPageRef.current != null) return;
      // Capture viewport before the handler returns (currentTarget is nullified after dispatch)
      const viewport = event.currentTarget;
      // Defer layout reads to RAF so they don't block the scroll compositor thread
      requestAnimationFrame(() => {
        if (!viewport) return;
        const activePage = viewport.querySelector(`[data-mfp-page="${currentPage}"]`);
        if (!activePage) return;
        const pageTop = activePage.offsetTop - viewport.scrollTop;
        const pageBottom = pageTop + activePage.offsetHeight;
        const triggerLine = viewport.clientHeight * 0.34;
        if (pageBottom < triggerLine && currentPage < 604) {
          changePage("next", true);
        } else if (pageTop > viewport.clientHeight - triggerLine && currentPage > 1) {
          changePage("previous", true);
        }
      });
    },
    [changePage, currentPage, hasAudioSession, revealPlayer],
  );

  const goToSurahNumber = useCallback((value) => {
    const nextSurah = Math.max(1, Math.min(114, Number(value) || visibleSurah));
    const target = getSurah(nextSurah);
    if (!target?.page) return;
    setTargetSurah(String(nextSurah));
    dispatch({ type: "NAVIGATE_PAGE", payload: { page: target.page } });
    revealNavigation();
  }, [dispatch, revealNavigation, visibleSurah]);

  const openFullPlayer = () => {
    hideChrome();
    onOpenPlayer?.();
  };

  const handleViewportClick = useCallback(
    (event) => {
      if (event.target.closest(".mfp-ayah, button, select, input, a")) return;
      revealContextChrome();
    },
    [revealContextChrome],
  );

  if (!fullPage || typeof document === "undefined") return null;

  const pageLabel = lang === "ar" ? toAr(currentPage) : currentPage;
  const fullscreenBaseFontSize = Math.min(
    64,
    Math.max(27, Number(state.quranFontSize || 34) + 4),
  );
  const zoomedFontSize = Math.min(78, fullscreenBaseFontSize * zoom);

  return createPortal(
    <div
      className="quran-display--platform mfp-portal-root"
      data-theme={state.theme}
      data-view="reading"
      data-riwaya={riwaya}
      style={{
        "--qd-font-family": "var(--quran-font-family, var(--font-quran, serif))",
        "--qd-fullscreen-font-size": `${fullscreenBaseFontSize}px`,
      }}
    >
      <div className="mfp-overlay" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div
          ref={containerRef}
          className={`mfp-page-container mfp-page-container--${pageFlow} mfp-page-container--immersive`}
          data-page-flow={pageFlow}
          data-zoomed={zoom > 1.01 ? "true" : "false"}
          tabIndex={-1}
        >
          <span id={titleId} className="sr-only">
            {t("quran.fullPageView", lang)} — {t("quran.page", lang)} {pageLabel}
          </span>

          <button type="button" className="sr-only" onClick={onClose}>
            {t("audio.close", lang)}
          </button>

          <button
            type="button"
            className="mfp-context-hotzone mfp-context-hotzone--top"
            onClick={revealContextChrome}
            aria-label={lang === "ar" ? "إظهار التنقل" : lang === "en" ? "Show navigation" : "Afficher la navigation"}
          />

          {navigationOpen ? (
            <section
              className="mfp-context-navigation"
              dir={lang === "ar" ? "rtl" : "ltr"}
              aria-label={lang === "ar" ? "التنقل في السور" : lang === "en" ? "Surah navigation" : "Navigation des sourates"}
              onPointerEnter={clearChromeTimer}
              onPointerLeave={scheduleChromeHide}
              onFocusCapture={clearChromeTimer}
              onBlurCapture={scheduleChromeHide}
            >
              <button
                type="button"
                className="mfp-context-navigation__close"
                onClick={onClose}
                aria-label={t("audio.close", lang)}
              >
                <X size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="mfp-context-navigation__step"
                onClick={() => {
                  goToSurahNumber(visibleSurah - 1);
                }}
                aria-label={lang === "ar" ? "السورة السابقة" : lang === "en" ? "Previous surah" : "Sourate précédente"}
                disabled={visibleSurah <= 1}
              >
                {lang === "ar" ? (
                  <ChevronRight size={17} aria-hidden="true" />
                ) : (
                  <ChevronLeft size={17} aria-hidden="true" />
                )}
              </button>
              <label className="mfp-context-navigation__target">
                <select
                  value={targetSurah}
                  onChange={(event) => goToSurahNumber(event.target.value)}
                  aria-label={chromeLabels.surah}
                >
                  {SURAHS.map((surah) => (
                    <option key={surah.n} value={surah.n}>
                      {surah.n}. {lang === "ar" ? surah.ar : lang === "en" ? surah.en : surah.fr}
                    </option>
                  ))}
                </select>
                <span
                  key={`mfp-surah-identity-${visibleSurah}`}
                  className="mfp-context-navigation__identity"
                  aria-hidden="true"
                >
                  <span className="mfp-context-navigation__arabic" lang="ar" dir="rtl">
                    {activeSurah?.ar}
                  </span>
                  <span className="mfp-context-navigation__copy">
                    <strong>{visibleSurah}. {activeSurahName}</strong>
                    <small>{t("quran.page", lang)} {pageLabel}</small>
                  </span>
                  <ChevronDown
                    className="mfp-context-navigation__chevron"
                    size={14}
                    aria-hidden="true"
                  />
                </span>
              </label>
              <button
                type="button"
                className="mfp-context-navigation__step"
                onClick={() => {
                  goToSurahNumber(visibleSurah + 1);
                }}
                aria-label={lang === "ar" ? "السورة التالية" : lang === "en" ? "Next surah" : "Sourate suivante"}
                disabled={visibleSurah >= 114}
              >
                {lang === "ar" ? (
                  <ChevronLeft size={17} aria-hidden="true" />
                ) : (
                  <ChevronRight size={17} aria-hidden="true" />
                )}
              </button>
            </section>
          ) : null}

          <main
            ref={viewportRef}
            className={`mfp-viewport mfp-viewport--${pageFlow}`}
            data-zoomed={zoom > 1.01 ? "true" : "false"}
            onDoubleClick={(event) => {
              if (event.target.closest(".mfp-ayah")) return;
              event.preventDefault();
              resetZoom();
            }}
            onClick={handleViewportClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onScroll={handleViewportScroll}
          >
            <div className={`mfp-pages mfp-pages--${pageFlow}`}>
              {visiblePages.map(([page, pageAyahs]) => (
                <ImmersiveMushafPage
                  key={page}
                  ayahs={pageAyahs}
                  currentPlayingAyah={currentPlayingAyah}
                  fallbackSurah={currentSurah}
                  lang={lang}
                  page={page}
                  riwaya={riwaya}
                  fontSize={zoomedFontSize}
                  selectedAyah={selectedAyahReference}
                  showTajwid={showTajwid}
                  onOpenAyahActions={setSelectedAyah}
                  onPlayAyah={onPlayAyah}
                  onPointerDownAyah={handlePointerDownAyah}
                />
              ))}
            </div>
          </main>

          {zoomNotice ? (
            <output className="mfp-zoom-status" aria-live="polite">
              {Math.round(zoom * 100)} %
            </output>
          ) : null}

          {hasAudioSession ? (
            <button
              type="button"
              className="mfp-context-hotzone mfp-context-hotzone--bottom"
              onClick={revealPlayer}
              aria-label={lang === "ar" ? "إظهار مشغل الصوت" : lang === "en" ? "Show audio player" : "Afficher le lecteur audio"}
            />
          ) : null}

          {playerOpen && hasAudioSession ? (
            <section
              className="mfp-context-player"
              aria-label={lang === "ar" ? "مشغل الصوت" : lang === "en" ? "Audio player" : "Lecteur audio"}
              onPointerEnter={clearChromeTimer}
              onPointerLeave={scheduleChromeHide}
            >
              <button
                type="button"
                className="mfp-context-player__track"
                onClick={openFullPlayer}
                aria-label={chromeLabels.reader}
              >
                <span className="mfp-context-player__pulse" aria-hidden="true"><Headphones size={15} /></span>
                <span>
                  <strong>{activeSurah?.fr || activeSurah?.en || chromeLabels.surah}</strong>
                  <small>{reciterLabel || chromeLabels.reciter}</small>
                </span>
              </button>
              <button
                type="button"
                className="mfp-context-player__toggle"
                onClick={() => audioService.toggle()}
                aria-label={state.isPlaying ? t("audio.pause", lang) : t("audio.play", lang)}
                aria-pressed={state.isPlaying}
              >
                {state.isPlaying ? <Pause size={19} aria-hidden="true" /> : <Play size={19} aria-hidden="true" />}
              </button>
              <button
                type="button"
                className="mfp-context-player__options"
                onClick={openFullPlayer}
                aria-label={chromeLabels.reader}
              >
                <SlidersHorizontal size={17} aria-hidden="true" />
              </button>
            </section>
          ) : null}

          <AyahActionsModal
            activeAyah={selectedAyah?.numberInSurah || null}
            className="ayah-actions-modal--fullscreen"
            onClose={() => setSelectedAyah(null)}
            quietBackdrop
            portalToBody
            surah={getAyahSurah(selectedAyah, visibleSurah)}
            ayahData={selectedAyah}
            translations={selectedAyah ? getTranslationForAyah?.(selectedAyah) || [] : []}
          />

        </div>
      </div>
    </div>,
    document.body,
  );
}
