import React, {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Star,
  X,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { toAr } from "../../data/surahs";
import { getJuzForAyah } from "../../data/juz";
import { t } from "../../i18n";
import CleanPageView from "../Quran/CleanPageView";
import { preloadQuranDisplayData } from "./useQuranDisplayData";

const MIN_ZOOM = 0.8;
const MAX_ZOOM = 2.2;
const ZOOM_STEP = 0.15;

function clampZoom(value) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function FullscreenMushafOverlayComponent({
  ayahs,
  currentPage,
  currentPlayingAyah,
  currentSurah,
  fullPage,
  lang,
  onClose,
  onNextPage,
  onPlayAyah,
  onPrevPage,
  riwaya,
}) {
  const { state, dispatch } = useApp();
  const viewportRef = useRef(null);
  const swipeRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pageCache, setPageCache] = useState(() => new Map([[currentPage, ayahs]]));

  const isWarsh = riwaya === "warsh";
  const pageLabel = lang === "ar" ? toAr(currentPage) : currentPage;
  const currentJuz =
    ayahs[0]?.juz ||
    getJuzForAyah(ayahs[0]?.surah?.number, ayahs[0]?.numberInSurah);

  // Sync current page data into cache
  useEffect(() => {
    setPageCache((current) => {
      const next = new Map(current);
      next.set(currentPage, ayahs);
      return next;
    });
  }, [ayahs, currentPage]);

  // Preload adjacent pages for instant navigation
  useEffect(() => {
    if (!fullPage) return undefined;
    let cancelled = false;
    const neighbours = [currentPage - 1, currentPage + 1].filter(
      (p) => p >= 1 && p <= 604 && !pageCache.has(p),
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
  }, [currentPage, currentSurah, fullPage, lang, pageCache, riwaya, state.currentJuz, state.warshStrictMode]);

  // Lock body scroll when fullscreen is open
  useEffect(() => {
    if (!fullPage) return undefined;
    const prevOverflow = document.body.style.overflow;
    const prevOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    const onKey = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowLeft") {
        if (currentPage > 1) {
          if (pageCache.has(currentPage - 1)) {
            dispatch({ type: "NAVIGATE_PAGE", payload: { page: currentPage - 1 } });
          } else {
            onPrevPage?.();
          }
        }
        return;
      }
      if (e.key === "ArrowRight") {
        if (currentPage < 604) {
          if (pageCache.has(currentPage + 1)) {
            dispatch({ type: "NAVIGATE_PAGE", payload: { page: currentPage + 1 } });
          } else {
            onNextPage?.();
          }
        }
        return;
      }
      if (e.key === "+" || e.key === "=") {
        setZoom((z) => clampZoom(z + ZOOM_STEP));
        return;
      }
      if (e.key === "-") {
        setZoom((z) => clampZoom(z - ZOOM_STEP));
        return;
      }
      if (e.key === "0") {
        setZoom(1);
        return;
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.overscrollBehavior = prevOverscroll;
      document.removeEventListener("keydown", onKey);
    };
  }, [currentPage, dispatch, fullPage, onClose, onNextPage, onPrevPage, pageCache]);

  // Reset scroll to top when page changes
  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  const handlePrev = useCallback(() => {
    if (currentPage <= 1) return;
    if (pageCache.has(currentPage - 1)) {
      dispatch({ type: "NAVIGATE_PAGE", payload: { page: currentPage - 1 } });
    } else {
      onPrevPage?.();
    }
  }, [currentPage, dispatch, onPrevPage, pageCache]);

  const handleNext = useCallback(() => {
    if (currentPage >= 604) return;
    if (pageCache.has(currentPage + 1)) {
      dispatch({ type: "NAVIGATE_PAGE", payload: { page: currentPage + 1 } });
    } else {
      onNextPage?.();
    }
  }, [currentPage, dispatch, onNextPage, pageCache]);

  // Touch gestures for swipe navigation
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      swipeRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: performance.now(),
      };
    }
  };

  const handleTouchEnd = (e) => {
    if (!swipeRef.current || !e.changedTouches[0]) return;
    const deltaX = e.changedTouches[0].clientX - swipeRef.current.x;
    const deltaY = e.changedTouches[0].clientY - swipeRef.current.y;
    const elapsed = performance.now() - swipeRef.current.time;
    swipeRef.current = null;

    if (elapsed > 700 || Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) {
      return;
    }

    if (deltaX > 0) {
      handleNext();
    } else {
      handlePrev();
    }
  };

  if (!fullPage || typeof document === "undefined") return null;

  const activePageAyahs = pageCache.get(currentPage) || ayahs;
  const activeSurahNum =
    activePageAyahs[0]?.surah?.number || activePageAyahs[0]?.surah || currentSurah;

  return createPortal(
    <div
      className="mfp-portal-root fixed inset-0 z-[99999] flex flex-col justify-between bg-black/90 text-white select-none backdrop-blur-xl transition-all duration-300"
      data-theme={state.theme}
      data-view="reading"
      data-riwaya={riwaya}
      role="dialog"
      aria-modal="true"
      aria-label={`${t("quran.page", lang)} ${pageLabel}`}
    >
      {/* ── Top Bar: Page info, Zoom Controls, Close ── */}
      <header className="relative z-30 flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-black/40 px-3 py-2.5 backdrop-blur-md sm:px-5">
        {/* Left: Close & Page title */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95"
            aria-label={t("audio.close", lang)}
            title={`${t("audio.close", lang)} (Esc)`}
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-white sm:text-sm">
              {lang === "ar" ? `صفحة ${pageLabel}` : `Page ${pageLabel}`}
              <span className="text-[0.7rem] font-normal opacity-60"> / 604</span>
            </h2>
            {currentJuz && (
              <span className="hidden text-xs text-white/60 sm:inline">
                · {t("sidebar.juz", lang)} {currentJuz}
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.62rem] font-black tracking-wider uppercase ${
                isWarsh
                  ? "border border-amber-500/30 bg-amber-500/20 text-amber-300"
                  : "border border-emerald-500/30 bg-emerald-500/20 text-emerald-300"
              }`}
            >
              {isWarsh ? <Star size={8} fill="currentColor" /> : null}
              {isWarsh ? "WARSH" : "HAFS"}
            </span>
          </div>
        </div>

        {/* Right: Zoom In/Out & Reset */}
        <div className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 p-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setZoom((z) => clampZoom(z - ZOOM_STEP))}
            disabled={zoom <= MIN_ZOOM}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-white/80 transition-all hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            title="Zoomer arrière (-)"
            aria-label="Zoomer arrière"
          >
            <Minus size={14} />
          </button>

          <button
            type="button"
            onClick={() => setZoom(1)}
            className="px-1.5 text-[0.72rem] font-bold tabular-nums text-white/90 transition-all hover:text-white"
            title="Réinitialiser le zoom (0)"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            type="button"
            onClick={() => setZoom((z) => clampZoom(z + ZOOM_STEP))}
            disabled={zoom >= MAX_ZOOM}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-white/80 transition-all hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            title="Zoomer avant (+)"
            aria-label="Zoomer avant"
          >
            <Plus size={14} />
          </button>
        </div>
      </header>

      {/* ── Main Viewport: Clean Mushaf Page with Zoom Scaling ── */}
      <main
        ref={viewportRef}
        className="relative z-10 flex flex-1 items-start justify-center overflow-y-auto overflow-x-hidden p-2 sm:p-6"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="mushaf-fullscreen-zoom-wrap my-auto transition-transform duration-150 ease-out"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
            width: "min(100%, 780px)",
            maxWidth: "780px",
          }}
        >
          <CleanPageView
            ayahs={activePageAyahs}
            lang={lang}
            fontSize={state.quranFontSize || 34}
            showTajwid={state.showTajwid}
            currentPlayingAyah={currentPlayingAyah}
            surahNum={activeSurahNum}
            riwaya={riwaya}
            onAyahClick={onPlayAyah}
            onPlayAyah={onPlayAyah}
            showSurahHeader={true}
          />
        </div>
      </main>

      {/* ── Floating Side Navigation (Previous / Next Page) ── */}
      <button
        type="button"
        onClick={handlePrev}
        disabled={currentPage <= 1}
        className="fixed left-3 top-1/2 z-30 hidden -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/60 p-3 text-white shadow-2xl backdrop-blur-md transition-all hover:scale-110 hover:bg-black/80 active:scale-95 disabled:pointer-events-none disabled:opacity-20 sm:flex"
        title="Page précédente (←)"
        aria-label="Page précédente"
      >
        <ChevronLeft size={24} />
      </button>

      <button
        type="button"
        onClick={handleNext}
        disabled={currentPage >= 604}
        className="fixed right-3 top-1/2 z-30 hidden -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/60 p-3 text-white shadow-2xl backdrop-blur-md transition-all hover:scale-110 hover:bg-black/80 active:scale-95 disabled:pointer-events-none disabled:opacity-20 sm:flex"
        title="Page suivante (→)"
        aria-label="Page suivante"
      >
        <ChevronRight size={24} />
      </button>
    </div>,
    document.body,
  );
}

export default memo(FullscreenMushafOverlayComponent);

