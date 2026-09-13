import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Minus, Pause, Play, Plus, Settings2, SkipBack, SkipForward, X } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { resolveFontFamily } from "../../data/fonts";
import { getJuzForAyah } from "../../data/juz";
import { toAr } from "../../data/surahs";
import { t } from "../../i18n";
import audioService from "../../services/audioService";
import CleanPageView from "../Quran/CleanPageView";
import QuranMushafPage from "./QuranMushafPage";
import { preloadQuranDisplayData } from "./useQuranDisplayData";

const MIN_ZOOM = 0.8;
const MAX_ZOOM = 2.2;
const ZOOM_STEP = 0.15;
const DARK_THEMES = new Set(["dark", "night-blue", "oled"]);

function clampZoom(value) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function isInteractiveTarget(target) {
  return Boolean(target?.closest?.("button, a, input, textarea, select, [contenteditable='true']"));
}

function getThemeOverlayStyle(theme) {
  if (DARK_THEMES.has(theme)) {
    return {
      background: "var(--theme-bg, #0f1724)", color: "var(--theme-text, #e8eff8)",
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
      background: "var(--theme-bg, #f3e8cf)", color: "var(--theme-text, #3b2b1a)",
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
    background: "var(--theme-bg, #f8fafc)", color: "var(--theme-text, #1e293b)",
    "--mfp-header-bg": "color-mix(in srgb, var(--theme-panel-bg, #fff) 95%, transparent 5%)",
    "--mfp-header-border": "color-mix(in srgb, var(--theme-border, #d1d5db) 50%, transparent 50%)",
    "--mfp-btn-bg": "color-mix(in srgb, var(--theme-panel-bg, #fff) 80%, transparent 20%)",
    "--mfp-btn-border": "color-mix(in srgb, var(--theme-border, #d1d5db) 60%, transparent 40%)",
    "--mfp-btn-text": "var(--theme-text, #1e293b)",
    "--mfp-nav-bg": "color-mix(in srgb, var(--theme-panel-bg, #fff) 70%, transparent 30%)",
    "--mfp-nav-border": "color-mix(in srgb, var(--theme-border, #d1d5db) 60%, transparent 40%)",
  };
}

function AudioControls({ audioAyah, compact = false, hasSession, isPlaying, lang, onOpenPlayer, onStart }) {
  const track = audioService.currentAyah || audioAyah;
  const trackLabel = track?.surah ? `${track.surah}${track.ayah ? `:${track.ayah}` : ""}` : t("audio.ready", lang);
  const toggleLabel = isPlaying ? t("audio.pause", lang) : t("audio.play", lang);
  const toggle = () => { if (hasSession) audioService.toggle(); else onStart?.(); };

  return (
    <div className={`mfp-audio-controls${compact ? " mfp-audio-controls--compact" : ""}`} dir="ltr">
      {!compact ? <button type="button" className="mfp-icon-btn mfp-audio-skip" onClick={() => audioService.prev()} disabled={!hasSession || audioService.playlistIndex <= 0} aria-label={t("audio.prev", lang)}><SkipBack size={16} aria-hidden="true" /></button> : null}
      <button type="button" className="mfp-icon-btn mfp-audio-toggle" onClick={toggle} aria-label={toggleLabel} title={`${toggleLabel} (Espace)`}>{isPlaying ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}</button>
      {!compact ? <button type="button" className="mfp-icon-btn mfp-audio-skip" onClick={() => audioService.next()} disabled={!hasSession || audioService.playlistIndex >= audioService.playlist.length - 1} aria-label={t("audio.next", lang)}><SkipForward size={16} aria-hidden="true" /></button> : null}
      <span className="mfp-audio-track" aria-live="polite"><strong>{trackLabel}</strong><small>{isPlaying ? t("audio.playing", lang) : t("audio.ready", lang)}</small></span>
      <button type="button" className="mfp-icon-btn" onClick={onOpenPlayer} aria-label={t("settings.audio", lang)}><Settings2 size={17} aria-hidden="true" /></button>
    </div>
  );
}

function FullscreenMushafOverlayComponent({ ayahs, currentPage, currentPlayingAyah, currentSurah, fullPage, lang, onClose, onNextPage, onOpenPlayer, onPlayAyah, onPrevPage, returnFocusRef, riwaya, isPlaying, audioAyah }) {
  const { state, dispatch } = useApp();
  const overlayRef = useRef(null);
  const viewportRef = useRef(null);
  const swipeRef = useRef(null);
  const closeButtonRef = useRef(null);
  const turnRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pageCache, setPageCache] = useState(() => new Map([[currentPage, ayahs]]));
  const theme = state.theme || "light";
  const pageLabel = lang === "ar" ? toAr(currentPage) : currentPage;
  const currentJuz = ayahs[0]?.juz || getJuzForAyah(ayahs[0]?.surah?.number, ayahs[0]?.numberInSurah);
  const quranFontFamily = resolveFontFamily(state.fontFamily, riwaya);
  const hasAudioSession = Boolean(audioAyah || audioService.currentAyah || audioService.playlist.length || audioService.audio?.src);

  useEffect(() => {
    setPageCache((current) => new Map(current).set(currentPage, ayahs));
  }, [ayahs, currentPage]);

  useEffect(() => {
    if (!fullPage) return undefined;
    let cancelled = false;
    const neighbours = [currentPage - 1, currentPage + 1].filter((page) => page >= 1 && page <= 604 && !pageCache.has(page));
    Promise.all(neighbours.map(async (page) => {
      const result = await preloadQuranDisplayData({ currentJuz: state.currentJuz, currentPage: page, currentSurah, displayMode: "page", lang, riwaya, warshStrictMode: state.warshStrictMode });
      return [page, result.ayahs];
    })).then((entries) => {
      if (cancelled || !entries.length) return;
      setPageCache((current) => {
        const next = new Map(current);
        entries.forEach(([page, pageAyahs]) => next.set(page, pageAyahs));
        return next;
      });
    }).catch(() => null);
    return () => { cancelled = true; };
  }, [currentPage, currentSurah, fullPage, lang, pageCache, riwaya, state.currentJuz, state.warshStrictMode]);

  const handlePrev = useCallback(() => {
    if (currentPage <= 1) return;
    turnRef.current = "prev";
    if (pageCache.has(currentPage - 1)) dispatch({ type: "NAVIGATE_PAGE", payload: { page: currentPage - 1 } }); else onPrevPage?.();
  }, [currentPage, dispatch, onPrevPage, pageCache]);

  const handleNext = useCallback(() => {
    if (currentPage >= 604) return;
    turnRef.current = "next";
    if (pageCache.has(currentPage + 1)) dispatch({ type: "NAVIGATE_PAGE", payload: { page: currentPage + 1 } }); else onNextPage?.();
  }, [currentPage, dispatch, onNextPage, pageCache]);

  const handleOverlayKeyDown = useCallback((event) => {
    if (event.key === "Escape") { event.stopPropagation(); onClose(); return; }
    if (event.key === " " && !isInteractiveTarget(event.target) && hasAudioSession) { event.preventDefault(); audioService.toggle(); return; }
    if (isInteractiveTarget(event.target)) return;
    if (event.key === "ArrowLeft") { handleNext(); return; }
    if (event.key === "ArrowRight") { handlePrev(); return; }
    if (event.key === "+" || event.key === "=") { setZoom((value) => clampZoom(value + ZOOM_STEP)); return; }
    if (event.key === "-") { setZoom((value) => clampZoom(value - ZOOM_STEP)); return; }
    if (event.key === "0") setZoom(1);
  }, [handleNext, handlePrev, hasAudioSession, onClose]);

  useEffect(() => {
    if (!fullPage) return undefined;
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.classList.add("mfp-open");
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    return () => {
      document.body.classList.remove("mfp-open");
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
    };
  }, [fullPage]);

  useEffect(() => {
    if (!fullPage) return undefined;
    const handleDocumentEscape = (event) => {
      if (event.key !== "Escape") return;
      const visibleChildDialog = Array.from(document.querySelectorAll(
        ".audio-player-modal--simple, .ayah-actions-modal--fullscreen",
      )).some((element) => element.getClientRects().length > 0);
      if (!visibleChildDialog) onClose();
    };
    document.addEventListener("keydown", handleDocumentEscape);
    return () => document.removeEventListener("keydown", handleDocumentEscape);
  }, [fullPage, onClose]);

  useEffect(() => {
    if (!fullPage) return undefined;
    const returnFocusTarget = returnFocusRef?.current;
    closeButtonRef.current?.focus();
    const trapFocus = (event) => {
      if (event.key !== "Tab") return;
      const focusable = Array.from(overlayRef.current?.querySelectorAll("button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])") || []).filter((element) => element.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", trapFocus);
    return () => {
      document.removeEventListener("keydown", trapFocus);
      requestAnimationFrame(() => {
        const fallbackTarget = Array.from(document.querySelectorAll(
          ".reader-fullscreen-trigger, .srh-fullscreen-btn",
        )).find((element) => element.getClientRects().length > 0);
        const target = returnFocusTarget?.isConnected ? returnFocusTarget : fallbackTarget;
        target?.focus?.();
      });
    };
  }, [fullPage, returnFocusRef]);

  useEffect(() => { if (viewportRef.current) viewportRef.current.scrollTop = 0; }, [currentPage]);

  if (!fullPage || typeof document === "undefined") return null;

  const activePageAyahs = pageCache.get(currentPage) || ayahs;
  const activeSurahNum = activePageAyahs[0]?.surah?.number || activePageAyahs[0]?.surah || currentSurah;
  const hasLineData = riwaya !== "warsh" && activePageAyahs.some((ayah) => (ayah?.words || []).some((word) => Number(word?.lineNumber || word?.lineV2) > 0));
  const pageKind = currentPage <= 2 ? "opening" : "standard";
  const startPageAudio = () => { if (activePageAyahs[0]) onPlayAyah?.(activePageAyahs[0], activePageAyahs); };
  const audioProps = { audioAyah, hasSession: hasAudioSession, isPlaying, lang, onOpenPlayer, onStart: startPageAudio };
  const handleTouchStart = (event) => { if (event.touches.length === 1) swipeRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY, time: performance.now() }; };
  const handleTouchEnd = (event) => {
    if (!swipeRef.current || !event.changedTouches[0]) return;
    const deltaX = event.changedTouches[0].clientX - swipeRef.current.x;
    const deltaY = event.changedTouches[0].clientY - swipeRef.current.y;
    const elapsed = performance.now() - swipeRef.current.time;
    swipeRef.current = null;
    if (elapsed > 700 || Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;
    if (deltaX > 0) handleNext(); else handlePrev();
  };

  return createPortal(
    <div ref={overlayRef} className="mfp-portal-root" data-theme={theme} data-view="reading" data-riwaya={riwaya} dir={lang === "ar" ? "rtl" : "ltr"} style={{ "--qd-font-family": quranFontFamily, "--font-quran": quranFontFamily, "--font-quran-tajweed": quranFontFamily, ...getThemeOverlayStyle(theme) }} role="dialog" aria-modal="true" aria-label={`${t("quran.page", lang)} ${pageLabel}`} onKeyDown={handleOverlayKeyDown}>
      <header className="mfp-header">
        <div className="mfp-header__identity">
          <button ref={closeButtonRef} type="button" className="mfp-icon-btn" onClick={onClose} aria-label={t("audio.close", lang)} title={`${t("audio.close", lang)} (Esc)`}><X size={18} aria-hidden="true" /></button>
          <div className="mfp-header__copy"><h2>{t("quran.page", lang)} {pageLabel}<span> / 604 · {riwaya === "warsh" ? "Warsh" : "Hafs"}{currentJuz ? ` · ${t("sidebar.juz", lang)} ${currentJuz}` : ""}</span></h2></div>
        </div>
        <div className="mfp-header__tools">
          <AudioControls {...audioProps} />
          <div className="mfp-zoom-controls" dir="ltr">
            <button type="button" className="mfp-icon-btn" onClick={() => setZoom((value) => clampZoom(value - ZOOM_STEP))} disabled={zoom <= MIN_ZOOM} aria-label="Zoom arrière"><Minus size={16} /></button>
            <button type="button" className="mfp-zoom-value" onClick={() => setZoom(1)} aria-label="Réinitialiser le zoom">{Math.round(zoom * 100)}%</button>
            <button type="button" className="mfp-icon-btn" onClick={() => setZoom((value) => clampZoom(value + ZOOM_STEP))} disabled={zoom >= MAX_ZOOM} aria-label="Zoom avant"><Plus size={16} /></button>
          </div>
        </div>
      </header>
      <main ref={viewportRef} className="mfp-viewport" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div key={currentPage} className={hasLineData ? "mfp-book mfp-book--exact" : "mfp-book mfp-book--flow"} data-page-kind={pageKind} data-turn={turnRef.current || undefined} style={{ transform: `scale(${zoom})`, width: hasLineData ? undefined : "min(100%, 760px)", maxWidth: hasLineData ? "100%" : "760px" }}>
          {hasLineData ? <QuranMushafPage activeAyah={null} ayahs={activePageAyahs} currentPage={currentPage} currentPlayingAyah={currentPlayingAyah} fontFamily={state.fontFamily} lang={lang} onToggleActive={() => {}} riwaya={riwaya} showTajwid={state.showTajwid} /> : <CleanPageView ayahs={activePageAyahs} lang={lang} fontSize={state.quranFontSize || 34} showTajwid={state.showTajwid} currentPlayingAyah={currentPlayingAyah} surahNum={activeSurahNum} riwaya={riwaya} onAyahClick={onPlayAyah} onPlayAyah={onPlayAyah} showSurahHeader />}
        </div>
      </main>
      <button type="button" className="mfp-side-nav mfp-side-nav--next" onClick={handleNext} disabled={currentPage >= 604} aria-label={t("nav.nextPage", lang)} title={`${t("nav.nextPage", lang)} (←)`}><ChevronLeft size={22} /></button>
      <button type="button" className="mfp-side-nav mfp-side-nav--prev" onClick={handlePrev} disabled={currentPage <= 1} aria-label={t("nav.prevPage", lang)} title={`${t("nav.prevPage", lang)} (→)`}><ChevronRight size={22} /></button>
      <footer className="mfp-mobile-footer">
        <AudioControls compact {...audioProps} />
        <div className="mfp-mobile-pagination" dir="ltr"><button type="button" className="mfp-icon-btn" onClick={handleNext} disabled={currentPage >= 604} aria-label={t("nav.nextPage", lang)}><ChevronLeft size={20} /></button><strong>{pageLabel} / 604</strong><button type="button" className="mfp-icon-btn" onClick={handlePrev} disabled={currentPage <= 1} aria-label={t("nav.prevPage", lang)}><ChevronRight size={20} /></button></div>
      </footer>
    </div>, document.body,
  );
}

export default memo(FullscreenMushafOverlayComponent);
