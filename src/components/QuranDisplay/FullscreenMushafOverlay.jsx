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
  ArrowLeft,
  ArrowRight,
  Columns3,
  Minus,
  Plus,
  Rows3,
  X,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { getSurah, toAr } from "../../data/surahs";
import { t } from "../../i18n";
import AyahMarker from "../Quran/AyahMarker";
import Bismillah from "../Quran/Bismillah";
import { CleanPageSurahHeader } from "../Quran/CleanPageDecor";
import SmartAyahRenderer from "../Quran/SmartAyahRenderer";
import { preloadQuranDisplayData } from "./useQuranDisplayData";

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
const MIN_ZOOM = 1;
const MAX_ZOOM = 3.2;
const ZOOM_STEP = 0.25;

function labelFor(lang, fr, en, ar) {
  if (lang === "ar") return ar;
  return lang === "en" ? en : fr;
}

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
  scale,
  showTajwid,
}) {
  const contentRef = useRef(null);
  const [baseHeight, setBaseHeight] = useState(0);

  useLayoutEffect(() => {
    const node = contentRef.current;
    if (!node) return undefined;

    const measure = () => {
      const nextHeight = Math.ceil(node.scrollHeight);
      setBaseHeight((current) => (Math.abs(current - nextHeight) > 1 ? nextHeight : current));
    };
    measure();

    if (typeof ResizeObserver !== "function") {
      window.addEventListener("resize", measure, { passive: true });
      return () => window.removeEventListener("resize", measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [ayahs]);

  const firstSurah = getAyahSurah(ayahs[0], fallbackSurah);
  const surah = getSurah(firstSurah);
  const pageLabel = lang === "ar" ? toAr(page) : page;

  return (
    <section
      className="mfp-page-surface"
      data-mfp-page={page}
      aria-label={`${t("quran.page", lang)} ${pageLabel}`}
      style={{
        height: baseHeight ? `${Math.ceil(baseHeight * scale)}px` : undefined,
        width: `${scale * 100}%`,
      }}
    >
      <article
        ref={contentRef}
        className="mfp-page-sheet"
        dir="rtl"
        lang="ar"
        style={{
          transform: `scale(${scale})`,
          width: `${100 / scale}%`,
        }}
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
                className={`mfp-ayah${isPlaying ? " mfp-ayah--playing" : ""}`}
                data-surah-number={ayahSurah}
                data-ayah-number={ayah.numberInSurah}
                aria-current={isPlaying ? "true" : undefined}
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
  onNextPage,
  onPrevPage,
  riwaya,
}) {
  const { state, set } = useApp();
  const containerRef = useRef(null);
  const viewportRef = useRef(null);
  const hideTimerRef = useRef(null);
  const pinchRef = useRef(null);
  const pinchFrameRef = useRef(null);
  const pendingZoomRef = useRef(null);
  const swipeRef = useRef(null);
  const requestedPageRef = useRef(null);
  const scrollDrivenRef = useRef(false);
  const alignedRef = useRef(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pageCache, setPageCache] = useState(() => new Map([[currentPage, ayahs]]));
  const titleId = "mfp-title";
  const pageFlow = state.mushafPageFlow === "horizontal" ? "horizontal" : "vertical";
  const showTajwid = Boolean(state.showTajwid);

  const shouldAutoHide = useCallback(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 1024px)").matches;
  }, []);

  const scheduleControlsHide = useCallback(() => {
    window.clearTimeout(hideTimerRef.current);
    if (!shouldAutoHide()) return;
    hideTimerRef.current = window.setTimeout(() => setControlsVisible(false), 3200);
  }, [shouldAutoHide]);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    scheduleControlsHide();
  }, [scheduleControlsHide]);

  const updateZoom = useCallback((nextZoom) => {
    setZoom(clampZoom(nextZoom));
    revealControls();
  }, [revealControls]);

  const changePage = useCallback(
    (direction, fromScroll = false) => {
      const target = direction === "next" ? currentPage + 1 : currentPage - 1;
      if (target < 1 || target > 604 || requestedPageRef.current === target) return;
      requestedPageRef.current = target;
      scrollDrivenRef.current = fromScroll;
      if (direction === "next") onNextPage?.();
      else onPrevPage?.();
    },
    [currentPage, onNextPage, onPrevPage],
  );

  useEffect(() => {
    setPageCache((current) => {
      const next = new Map(current);
      next.set(currentPage, ayahs);
      for (const page of next.keys()) {
        if (Math.abs(page - currentPage) > 1) next.delete(page);
      }
      return next;
    });
    requestedPageRef.current = null;
  }, [ayahs, currentPage]);

  useEffect(() => {
    if (!fullPage) return undefined;
    let cancelled = false;
    const neighbours = [currentPage - 1, currentPage + 1].filter(
      (page) => page >= 1 && page <= 604 && !pageCache.has(page),
    );

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
    if (pageFlow === "horizontal") return [[currentPage, ayahs]];
    return [currentPage - 1, currentPage, currentPage + 1]
      .filter((page) => page >= 1 && page <= 604 && pageCache.has(page))
      .map((page) => [page, pageCache.get(page)]);
  }, [ayahs, currentPage, pageCache, pageFlow]);

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
  }, [currentPage, fullPage, pageFlow, visiblePages.length]);

  useLayoutEffect(() => {
    if (!fullPage || pageFlow !== "horizontal") return;
    viewportRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [currentPage, fullPage, pageFlow]);

  useEffect(() => {
    if (!fullPage || pageFlow !== "vertical" || zoom > 1.01) return undefined;
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
  }, [changePage, currentPage, fullPage, pageFlow, visiblePages, zoom]);

  useEffect(() => {
    if (!fullPage) return undefined;
    const el = containerRef.current;
    if (!el) return undefined;

    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    el.querySelector(FOCUSABLE)?.focus();
    revealControls();

    const onKey = (event) => {
      if (event.key === "Escape") {
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
      if (event.key !== "Tab") return;
      const all = [...el.querySelectorAll(FOCUSABLE)].filter(
        (node) => !node.closest('[aria-hidden="true"]'),
      );
      if (!all.length) return;
      const first = all[0];
      const last = all[all.length - 1];
      if (
        event.shiftKey
          ? document.activeElement === first
          : document.activeElement === last
      ) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(hideTimerRef.current);
      if (pinchFrameRef.current) cancelAnimationFrame(pinchFrameRef.current);
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
      previousFocus?.focus?.();
    };
  }, [changePage, fullPage, onClose, revealControls, updateZoom, zoom]);

  useEffect(() => {
    setZoom(1);
    alignedRef.current = false;
  }, [pageFlow]);

  const handleTouchStart = (event) => {
    revealControls();
    if (event.touches.length === 2) {
      const [first, second] = event.touches;
      pinchRef.current = {
        distance: Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY),
        zoom,
      };
      swipeRef.current = null;
      return;
    }
    if (event.touches.length === 1 && zoom <= 1.01 && pageFlow === "horizontal") {
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
    if (!start || zoom > 1.01 || !event.changedTouches[0]) return;
    const deltaX = event.changedTouches[0].clientX - start.x;
    const deltaY = event.changedTouches[0].clientY - start.y;
    const elapsed = performance.now() - start.time;
    if (elapsed > 720 || Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY) * 1.15) return;
    changePage(deltaX > 0 ? "next" : "previous");
  };

  const handleReaderTap = (event) => {
    if (event.target.closest("button, a, [role='button']")) return;
    setControlsVisible((visible) => {
      const next = !visible;
      if (next) scheduleControlsHide();
      else window.clearTimeout(hideTimerRef.current);
      return next;
    });
  };

  if (!fullPage || typeof document === "undefined") return null;

  const resolvedSurahNumber = getAyahSurah(ayahs[0], currentSurah);
  const surah = getSurah(resolvedSurahNumber);
  const pageLabel = lang === "ar" ? toAr(currentPage) : currentPage;
  const zoomLabel = `${Math.round(zoom * 100)}%`;

  return createPortal(
    <div
      className="quran-display--platform mfp-portal-root"
      data-theme={state.theme}
      data-view="reading"
      data-riwaya={riwaya}
      style={{
        "--qd-font-family": "var(--quran-font-family, var(--font-quran, serif))",
        "--qd-fullscreen-font-size": `${Math.min(74, Math.max(28, Number(state.quranFontSize || 34) + 6))}px`,
      }}
    >
      <div className="mfp-overlay" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div
          ref={containerRef}
          className={`mfp-page-container mfp-page-container--${pageFlow}${controlsVisible ? "" : " mfp-page-container--immersive"}`}
          data-page-flow={pageFlow}
          data-zoomed={zoom > 1.01 ? "true" : "false"}
        >
          <span id={titleId} className="sr-only">
            {t("quran.fullPageView", lang)} — {t("quran.page", lang)} {pageLabel}
          </span>

          <header className="mfp-reader-bar" aria-hidden={!controlsVisible}>
            <button
              className="mfp-icon-btn"
              type="button"
              onClick={onClose}
              aria-label={t("audio.close", lang)}
            >
              <X size={17} aria-hidden="true" />
            </button>

            <div className="mfp-reader-bar__identity">
              <strong>{surah?.ar}</strong>
              <span>{t("quran.page", lang)} {pageLabel} · {riwaya === "warsh" ? "Warsh" : "Hafs"}</span>
            </div>

            <span className="mfp-reader-bar__folio" aria-hidden="true">{pageLabel}</span>
          </header>

          <main
            ref={viewportRef}
            className={`mfp-viewport mfp-viewport--${pageFlow}`}
            data-zoomed={zoom > 1.01 ? "true" : "false"}
            onClick={handleReaderTap}
            onDoubleClick={() => updateZoom(zoom > 1.01 ? 1 : 1.75)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
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
                  scale={zoom}
                  showTajwid={showTajwid}
                />
              ))}
            </div>
          </main>

          <footer className="mfp-navigation" aria-hidden={!controlsVisible}>
            <button
              type="button"
              onClick={() => changePage("previous")}
              disabled={currentPage <= 1 || zoom > 1.01}
              aria-label={labelFor(lang, "Page précédente", "Previous page", "الصفحة السابقة")}
            >
              <ArrowLeft size={17} aria-hidden="true" />
            </button>

            <div className="mfp-navigation__center">
              <div className="mfp-flow-switch" role="group" aria-label={labelFor(lang, "Navigation des pages", "Page navigation", "طريقة التنقل") }>
                <button
                  type="button"
                  aria-pressed={pageFlow === "vertical"}
                  onClick={() => set({ mushafPageFlow: "vertical" })}
                  title={labelFor(lang, "Défilement vertical", "Vertical scroll", "تمرير عمودي")}
                >
                  <Rows3 size={15} aria-hidden="true" />
                  <span>{labelFor(lang, "Vertical", "Vertical", "عمودي")}</span>
                </button>
                <button
                  type="button"
                  aria-pressed={pageFlow === "horizontal"}
                  onClick={() => set({ mushafPageFlow: "horizontal" })}
                  title={labelFor(lang, "Balayage horizontal", "Horizontal swipe", "سحب أفقي")}
                >
                  <Columns3 size={15} aria-hidden="true" />
                  <span>{labelFor(lang, "Balayage", "Swipe", "سحب")}</span>
                </button>
              </div>

              <div className="mfp-zoom-controls" role="group" aria-label={labelFor(lang, "Zoom de la page", "Page zoom", "تكبير الصفحة") }>
                <button
                  type="button"
                  onClick={() => updateZoom(zoom - ZOOM_STEP)}
                  disabled={zoom <= MIN_ZOOM}
                  aria-label={labelFor(lang, "Dézoomer", "Zoom out", "تصغير")}
                >
                  <Minus size={15} aria-hidden="true" />
                </button>
                <span aria-live="polite">{zoomLabel}</span>
                <button
                  type="button"
                  onClick={() => updateZoom(zoom + ZOOM_STEP)}
                  disabled={zoom >= MAX_ZOOM}
                  aria-label={labelFor(lang, "Zoomer", "Zoom in", "تكبير")}
                >
                  <Plus size={15} aria-hidden="true" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => changePage("next")}
              disabled={currentPage >= 604 || zoom > 1.01}
              aria-label={labelFor(lang, "Page suivante", "Next page", "الصفحة التالية")}
            >
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          </footer>

          <button
            type="button"
            className="mfp-immersive-hint"
            onClick={revealControls}
            aria-label={labelFor(lang, "Afficher les contrôles", "Show controls", "إظهار عناصر التحكم")}
            tabIndex={controlsVisible ? -1 : 0}
          >
            <span />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
