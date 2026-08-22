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

function getThemeOverlayStyle(theme) {
  if (theme === "dark") {
    return {
      background: "var(--theme-bg, #0f1724)",
      color: "var(--theme-text, #e8eff8)",
      "--mfp-header-bg": "color-mix(in srgb, var(--theme-panel-bg, #1a2233) 95%, transparent 5%)",
      "--mfp-header-border": "color-mix(in srgb, var(--theme-border, #2a3a4a) 60%, transparent 40%)",
      "--mfp-btn-bg": "color-mix(in srgb, var(--theme-panel-bg, #1a2233) 80%, transparent 20%)",
      "--mfp-btn-border": "color-mix(in srgb, var(--theme-border, #2a3a4a) 50%, transparent 50%)",
      "--mfp-btn-text": "var(--theme-text, #e8eff8)",
      "--mfp-nav-bg": "color-mix(in srgb, var(--theme-panel-bg, #1a2233) 70%, transparent 30%)",
      "--mfp-nav-border": "color-mix(in srgb, var(--theme-border, #2a3a4a) 50%, transparent 50%)",
    };
  }
  if (theme === "sepia") {
    return {
      background: "var(--theme-bg, #f3e8cf)",
      color: "var(--theme-text, #3b2b1a)",
      "--mfp-header-bg": "color-mix(in srgb, var(--theme-panel-bg, #ede0c5) 95%, transparent 5%)",
      "--mfp-header-border": "color-mix(in srgb, var(--theme-border, #c8a97a) 50%, transparent 50%)",
      "--mfp-btn-bg": "color-mix(in srgb, var(--theme-panel-bg, #ede0c5) 80%, transparent 20%)",
      "--mfp-btn-border": "color-mix(in srgb, var(--theme-border, #c8a97a) 50%, transparent 50%)",
      "--mfp-btn-text": "var(--theme-text, #3b2b1a)",
      "--mfp-nav-bg": "color-mix(in srgb, var(--theme-panel-bg, #ede0c5) 70%, transparent 30%)",
      "--mfp-nav-border": "color-mix(in srgb, var(--theme-border, #c8a97a) 50%, transparent 50%)",
    };
  }
  return {
    background: "var(--theme-bg, #f8fafc)",
    color: "var(--theme-text, #1e293b)",
    "--mfp-header-bg": "color-mix(in srgb, var(--theme-panel-bg, #ffffff) 95%, transparent 5%)",
    "--mfp-header-border": "color-mix(in srgb, var(--theme-border, #d1d5db) 50%, transparent 50%)",
    "--mfp-btn-bg": "color-mix(in srgb, var(--theme-panel-bg, #ffffff) 80%, transparent 20%)",
    "--mfp-btn-border": "color-mix(in srgb, var(--theme-border, #d1d5db) 60%, transparent 40%)",
    "--mfp-btn-text": "var(--theme-text, #1e293b)",
    "--mfp-nav-bg": "color-mix(in srgb, var(--theme-panel-bg, #ffffff) 70%, transparent 30%)",
    "--mfp-nav-border": "color-mix(in srgb, var(--theme-border, #d1d5db) 60%, transparent 40%)",
  };
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

  const theme = state.theme || "light";
  const isWarsh = riwaya === "warsh";
  const pageLabel = lang === "ar" ? toAr(currentPage) : currentPage;
  const currentJuz =
    ayahs[0]?.juz ||
    getJuzForAyah(ayahs[0]?.surah?.number, ayahs[0]?.numberInSurah);
  const overlayStyle = getThemeOverlayStyle(theme);
  const isDark = theme === "dark";

  useEffect(() => {
    setPageCache((current) => {
      const next = new Map(current);
      next.set(currentPage, ayahs);
      return next;
    });
  }, [ayahs, currentPage]);

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
    return () => { cancelled = true; };
  }, [currentPage, currentSurah, fullPage, lang, pageCache, riwaya, state.currentJuz, state.warshStrictMode]);

  useEffect(() => {
    if (!fullPage) return undefined;
    const prevOverflow = document.body.style.overflow;
    const prevOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    const onKey = (e) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowLeft") {
        if (currentPage > 1) {
          if (pageCache.has(currentPage - 1)) dispatch({ type: "NAVIGATE_PAGE", payload: { page: currentPage - 1 } });
          else onPrevPage?.();
        }
        return;
      }
      if (e.key === "ArrowRight") {
        if (currentPage < 604) {
          if (pageCache.has(currentPage + 1)) dispatch({ type: "NAVIGATE_PAGE", payload: { page: currentPage + 1 } });
          else onNextPage?.();
        }
        return;
      }
      if (e.key === "+" || e.key === "=") { setZoom((z) => clampZoom(z + ZOOM_STEP)); return; }
      if (e.key === "-") { setZoom((z) => clampZoom(z - ZOOM_STEP)); return; }
      if (e.key === "0") { setZoom(1); return; }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.overscrollBehavior = prevOverscroll;
      document.removeEventListener("keydown", onKey);
    };
  }, [currentPage, dispatch, fullPage, onClose, onNextPage, onPrevPage, pageCache]);

  useEffect(() => {
    if (viewportRef.current) viewportRef.current.scrollTop = 0;
  }, [currentPage]);

  const handlePrev = useCallback(() => {
    if (currentPage <= 1) return;
    if (pageCache.has(currentPage - 1)) dispatch({ type: "NAVIGATE_PAGE", payload: { page: currentPage - 1 } });
    else onPrevPage?.();
  }, [currentPage, dispatch, onPrevPage, pageCache]);

  const handleNext = useCallback(() => {
    if (currentPage >= 604) return;
    if (pageCache.has(currentPage + 1)) dispatch({ type: "NAVIGATE_PAGE", payload: { page: currentPage + 1 } });
    else onNextPage?.();
  }, [currentPage, dispatch, onNextPage, pageCache]);

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      swipeRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: performance.now() };
    }
  };
  const handleTouchEnd = (e) => {
    if (!swipeRef.current || !e.changedTouches[0]) return;
    const deltaX = e.changedTouches[0].clientX - swipeRef.current.x;
    const deltaY = e.changedTouches[0].clientY - swipeRef.current.y;
    const elapsed = performance.now() - swipeRef.current.time;
    swipeRef.current = null;
    if (elapsed > 700 || Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;
    if (deltaX > 0) handleNext();
    else handlePrev();
  };

  if (!fullPage || typeof document === "undefined") return null;

  const activePageAyahs = pageCache.get(currentPage) || ayahs;
  const activeSurahNum =
    activePageAyahs[0]?.surah?.number || activePageAyahs[0]?.surah || currentSurah;

  const navBtnStyle = (disabled) => ({
    position: "fixed",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "2.8rem",
    height: "2.8rem",
    border: "1px solid var(--mfp-nav-border)",
    borderRadius: "50%",
    background: "var(--mfp-nav-bg)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    color: "var(--mfp-btn-text)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.2 : 1,
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    transition: "all 0.2s ease",
    pointerEvents: disabled ? "none" : "auto",
  });

  return createPortal(
    <div
      className="mfp-portal-root"
      data-theme={theme}
      data-view="reading"
      data-riwaya={riwaya}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        userSelect: "none",
        ...overlayStyle,
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`${t("quran.page", lang)} ${pageLabel}`}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          flexShrink: 0,
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
          padding: "0.55rem 1rem",
          borderBottom: "1px solid var(--mfp-header-border)",
          background: "var(--mfp-header-bg)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          zIndex: 30,
          position: "relative",
          boxShadow: isDark ? "0 1px 0 rgba(255,255,255,0.06)" : "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "2.25rem", height: "2.25rem", flexShrink: 0,
              border: "1px solid var(--mfp-btn-border)", borderRadius: "0.75rem",
              background: "var(--mfp-btn-bg)", color: "var(--mfp-btn-text)",
              cursor: "pointer", transition: "all 0.15s ease",
            }}
            aria-label={t("audio.close", lang)}
            title={`${t("audio.close", lang)} (Esc)`}
          >
            <X size={16} />
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: "0.82rem", fontWeight: 700, color: "var(--mfp-btn-text)", lineHeight: 1 }}>
              {lang === "ar" ? `صفحة ${pageLabel}` : `Page ${pageLabel}`}
              <span style={{ opacity: 0.5, fontWeight: 400, fontSize: "0.72rem" }}> / 604</span>
            </h2>
            {currentJuz && (
              <span style={{ fontSize: "0.72rem", opacity: 0.6, color: "var(--mfp-btn-text)" }}>
                · {t("sidebar.juz", lang)} {currentJuz}
              </span>
            )}
            <span
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.2rem",
                padding: "0.15rem 0.55rem", borderRadius: "999px",
                fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.1em",
                textTransform: "uppercase",
                border: isWarsh ? "1px solid rgba(245,158,11,0.4)" : "1px solid rgba(16,185,129,0.4)",
                background: isWarsh ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.12)",
                color: isWarsh ? "#d97706" : "#059669",
              }}
            >
              {isWarsh ? <Star size={7} fill="currentColor" /> : null}
              {isWarsh ? "WARSH" : "HAFS"}
            </span>
          </div>
        </div>

        {/* Zoom controls */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: "0.1rem",
            border: "1px solid var(--mfp-btn-border)", borderRadius: "0.75rem",
            background: "var(--mfp-btn-bg)", padding: "0.2rem",
          }}
        >
          <button
            type="button"
            onClick={() => setZoom((z) => clampZoom(z - ZOOM_STEP))}
            disabled={zoom <= MIN_ZOOM}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "1.9rem", height: "1.9rem",
              border: "none", borderRadius: "0.55rem", background: "transparent",
              color: "var(--mfp-btn-text)",
              opacity: zoom <= MIN_ZOOM ? 0.3 : 1,
              cursor: zoom <= MIN_ZOOM ? "not-allowed" : "pointer",
              transition: "all 0.15s",
            }}
            aria-label="Zoom arrière"
          >
            <Minus size={13} />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            style={{
              padding: "0 0.4rem", border: "none", background: "transparent",
              color: "var(--mfp-btn-text)", fontSize: "0.7rem", fontWeight: 700,
              fontVariantNumeric: "tabular-nums", cursor: "pointer",
              minWidth: "3rem", textAlign: "center",
            }}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => clampZoom(z + ZOOM_STEP))}
            disabled={zoom >= MAX_ZOOM}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "1.9rem", height: "1.9rem",
              border: "none", borderRadius: "0.55rem", background: "transparent",
              color: "var(--mfp-btn-text)",
              opacity: zoom >= MAX_ZOOM ? 0.3 : 1,
              cursor: zoom >= MAX_ZOOM ? "not-allowed" : "pointer",
              transition: "all 0.15s",
            }}
            aria-label="Zoom avant"
          >
            <Plus size={13} />
          </button>
        </div>
      </header>

      {/* Mushaf content */}
      <main
        ref={viewportRef}
        style={{
          flex: 1, overflowY: "auto", overflowX: "hidden",
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "1.5rem 1rem 5rem",
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          style={{
            transform: scale(),
            transformOrigin: "top center",
            width: "min(100%, 760px)",
            maxWidth: "760px",
            transition: "transform 0.15s ease-out",
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

      {/* Desktop side nav */}
      <button
        type="button"
        onClick={handlePrev}
        disabled={currentPage <= 1}
        style={{ ...navBtnStyle(currentPage <= 1), left: "0.75rem" }}
        aria-label="Page précédente"
        title="Page précédente (?)"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        type="button"
        onClick={handleNext}
        disabled={currentPage >= 604}
        style={{ ...navBtnStyle(currentPage >= 604), right: "0.75rem" }}
        aria-label="Page suivante"
        title="Page suivante (?)"
      >
        <ChevronRight size={20} />
      </button>

      {/* Mobile bottom nav */}
      <div
        className="mfp-mobile-footer"
        style={{
          display: "flex", flexShrink: 0, position: "sticky", bottom: 0, zIndex: 30,
          width: "100%", borderTop: "1px solid var(--mfp-header-border)",
          background: "var(--mfp-header-bg)", backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)", padding: "0.4rem 1rem",
          justifyContent: "space-between", alignItems: "center",
        }}
      >
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentPage <= 1}
          style={{
            display: "flex", alignItems: "center", gap: "0.3rem",
            padding: "0.45rem 0.9rem",
            border: "1px solid var(--mfp-btn-border)", borderRadius: "0.65rem",
            background: "var(--mfp-btn-bg)", color: "var(--mfp-btn-text)",
            fontSize: "0.78rem", fontWeight: 600,
            cursor: currentPage <= 1 ? "not-allowed" : "pointer",
            opacity: currentPage <= 1 ? 0.3 : 1,
          }}
        >
          <ChevronLeft size={15} />
          {lang === "ar" ? "السابقة" : lang === "en" ? "Prev" : "Préc."}
        </button>
        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--mfp-btn-text)" }}>
          {pageLabel} / 604
        </span>
        <button
          type="button"
          onClick={handleNext}
          disabled={currentPage >= 604}
          style={{
            display: "flex", alignItems: "center", gap: "0.3rem",
            padding: "0.45rem 0.9rem",
            border: "1px solid var(--mfp-btn-border)", borderRadius: "0.65rem",
            background: "var(--mfp-btn-bg)", color: "var(--mfp-btn-text)",
            fontSize: "0.78rem", fontWeight: 600,
            cursor: currentPage >= 604 ? "not-allowed" : "pointer",
            opacity: currentPage >= 604 ? 0.3 : 1,
          }}
        >
          {lang === "ar" ? "التالية" : lang === "en" ? "Next" : "Suiv."}
          <ChevronRight size={15} />
        </button>
      </div>
    </div>,
    document.body,
  );
}

export default memo(FullscreenMushafOverlayComponent);
