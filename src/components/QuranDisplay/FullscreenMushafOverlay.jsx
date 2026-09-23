import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeftRight, ChevronLeft, ChevronRight, Maximize, Minus, Pause, Play, Plus, Settings2, SkipBack, SkipForward, X } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { resolveFontFamily } from "../../data/fonts";
import { DEFAULT_ARABIC_FONT_SIZE, clampArabicFontSize } from "../../utils/arabicTypography";
import { getJuzForAyah } from "../../data/juz";
import { toAr } from "../../data/surahs";
import { t } from "../../i18n";
import audioService from "../../services/audioService";
import AyahActionsModal from "./AyahActionsModal";
import QuranMushafPage from "./QuranMushafPage";
import { preloadQuranDisplayData } from "./useQuranDisplayData";

const MIN_ZOOM = 0.75;
const MAX_ZOOM = 2.2;
const ZOOM_STEP = 0.15;
const ZOOM_STORAGE_KEY = "mushafplus-fullscreen-zoom";
const TOTAL_PAGES = 604;
const DARK_THEMES = new Set(["dark", "night-blue", "oled"]);
const CHROME_HIDE_DELAY = 5500;
// One polite status per overlay: the arrows describe themselves through it, so
// a retry stays announced without each control owning a live region.
const NAV_STATUS_ID = "mfp-nav-status";

// A Mushaf spread only shows two faces when there is real room for them and
// the window is not portrait; otherwise a single leaf keeps its measure.
function computeLayout(width, height) {
  if (width < 1024) return "single";
  if (height > width * 1.05) return "single";
  return width >= 1150 ? "double" : "single";
}

// In the Madani Mushaf the first leaf is a right-hand page, so odd folios sit
// on the right and even folios on the left. A spread pairs an odd page with the
// next even page.
function getSpread(page) {
  const start = page % 2 === 1 ? page : page - 1;
  return { right: Math.max(1, start), left: Math.min(TOTAL_PAGES, start + 1) };
}

function clampZoom(value) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

// Which arrow a leaf was meant for: a neighbour that cannot be fetched is the
// same request the arrow would make, so it carries the same retry state.
function turnDirection(page, fromPage) {
  return page > fromPage ? "next" : "prev";
}

// The pill sits inside the failing control so it follows it across themes and
// layouts; assistive tech gets the same words from the polite status region.
function TurnAlert({ lang }) {
  return <span className="mfp-nav-alert" aria-hidden="true">{t("quran.pageLoadFailed", lang)}</span>;
}

function getInitialZoom() {
  if (typeof sessionStorage === "undefined") return 1;
  const raw = sessionStorage.getItem(ZOOM_STORAGE_KEY);
  if (raw == null) return 1;
  const stored = Number(raw);
  return Number.isFinite(stored) ? clampZoom(stored) : 1;
}

function isInteractiveTarget(target) {
  return Boolean(target?.closest?.("button, a, input, textarea, select, [contenteditable='true']"));
}

function isPageScoped(ayahs, page) {
  return Array.isArray(ayahs) && ayahs.length > 0 && ayahs.every((ayah) => Number(ayah?.page) === Number(page));
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
  const trackLabel = track?.surah ? `${track.surah}${track.ayah ? `:${track.ayah}` : ""}` : "";
  const toggleLabel = isPlaying ? t("audio.pause", lang) : t("audio.play", lang);
  const toggle = () => { if (hasSession) audioService.toggle(); else onStart?.(); };

  return (
    <div className={`mfp-audio-controls${compact ? " mfp-audio-controls--compact" : ""}`} dir="ltr">
      {!compact ? <button type="button" className="mfp-icon-btn mfp-audio-skip" onClick={() => audioService.prev()} disabled={!hasSession || audioService.playlistIndex <= 0} aria-label={t("audio.prev", lang)}><SkipBack size={16} aria-hidden="true" /></button> : null}
      <button type="button" className="mfp-icon-btn mfp-audio-toggle" onClick={toggle} aria-label={toggleLabel} title={`${toggleLabel} (Espace)`}>{isPlaying ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}</button>
      {!compact ? <button type="button" className="mfp-icon-btn mfp-audio-skip" onClick={() => audioService.next()} disabled={!hasSession || audioService.playlistIndex >= audioService.playlist.length - 1} aria-label={t("audio.next", lang)}><SkipForward size={16} aria-hidden="true" /></button> : null}
      <span className="mfp-audio-track" aria-live="polite">{trackLabel ? <strong>{trackLabel}</strong> : null}<small>{isPlaying ? t("audio.playing", lang) : t("audio.ready", lang)}</small></span>
      <button type="button" className="mfp-icon-btn" onClick={onOpenPlayer} aria-label={t("settings.audio", lang)}><Settings2 size={17} aria-hidden="true" /></button>
    </div>
  );
}

function FullscreenMushafOverlayComponent({ ayahs, currentPage, currentPlayingAyah, currentSurah, fullPage, getTranslationForAyah, lang, onClose, onOpenPlayer, onPlayAyah, returnFocusRef, riwaya, isPlaying, audioAyah }) {
  const { state, dispatch } = useApp();
  const overlayRef = useRef(null);
  const viewportRef = useRef(null);
  const swipeRef = useRef(null);
  const closeButtonRef = useRef(null);
  const turnRef = useRef(null);
  const chromeTimerRef = useRef(0);
  const [zoomDelta, setZoomDelta] = useState(getInitialZoom);
  const [layout, setLayout] = useState(() => (typeof window === "undefined" ? "single" : computeLayout(window.innerWidth, window.innerHeight)));
  const [chromeVisible, setChromeVisible] = useState(true);
  const [pageCache, setPageCache] = useState(() => new Map(
    isPageScoped(ayahs, currentPage) ? [[currentPage, ayahs]] : [],
  ));
  const pageCacheRef = useRef(pageCache);
  const [isPageChanging, setIsPageChanging] = useState(false);
  // Which leaf turn could not be served: the arrow stays live as its own retry
  // control but carries a localized indication instead of failing silently.
  const [failedTurn, setFailedTurn] = useState(null);
  // Verse whose end-marker was tapped: fullscreen had no way to reach the
  // action sheet, so marker taps now open it locally instead of doing nothing.
  const [actionsAyah, setActionsAyah] = useState(null);
  const theme = state.theme || "light";
  const pageLabel = lang === "ar" ? toAr(currentPage) : currentPage;
  const currentJuz = ayahs[0]?.juz || getJuzForAyah(ayahs[0]?.surah?.number, ayahs[0]?.numberInSurah);
  const quranFontFamily = resolveFontFamily(state.fontFamily, riwaya);
  // The reader's own size is what 100 % means in the book: a 40 px preference
  // opens the leaf at 160 % of the viewport-fitted page. The ± controls stay a
  // delta on top of it, so their reset returns to the reader's size, not to 25 px.
  const sizeScale = clampArabicFontSize(state.quranFontSize) / DEFAULT_ARABIC_FONT_SIZE;
  const zoom = clampZoom(zoomDelta * sizeScale);
  const hasAudioSession = Boolean(audioAyah || audioService.currentAyah || audioService.playlist.length || audioService.audio?.src);

  const isDouble = layout === "double";
  const spread = useMemo(() => getSpread(currentPage), [currentPage]);
  const spreadPages = useMemo(
    () => (isDouble && spread.right !== spread.left ? [spread.right, spread.left] : [currentPage]),
    [currentPage, isDouble, spread.left, spread.right],
  );

  useEffect(() => {
    const updateLayout = () => setLayout(computeLayout(window.innerWidth, window.innerHeight));
    updateLayout();
    window.addEventListener("resize", updateLayout);
    window.addEventListener("orientationchange", updateLayout);
    return () => {
      window.removeEventListener("resize", updateLayout);
      window.removeEventListener("orientationchange", updateLayout);
    };
  }, []);

  // Chrome recedes after a few idle seconds so the leaf reads as a page, and
  // returns on the next pointer, touch, wheel or key gesture.
  const revealChrome = useCallback(() => {
    setChromeVisible(true);
    window.clearTimeout(chromeTimerRef.current);
    chromeTimerRef.current = window.setTimeout(() => setChromeVisible(false), CHROME_HIDE_DELAY);
  }, []);

  useEffect(() => {
    if (!fullPage) return undefined;
    const onActivity = () => revealChrome();
    window.addEventListener("pointermove", onActivity);
    window.addEventListener("pointerdown", onActivity);
    window.addEventListener("touchstart", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);
    window.addEventListener("wheel", onActivity, { passive: true });
    revealChrome();
    return () => {
      window.removeEventListener("pointermove", onActivity);
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("touchstart", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("wheel", onActivity);
      window.clearTimeout(chromeTimerRef.current);
    };
  }, [fullPage, revealChrome]);

  useEffect(() => {
    if (isPageScoped(ayahs, currentPage)) {
      setPageCache((current) => {
        const next = new Map(current).set(currentPage, ayahs);
        pageCacheRef.current = next;
        return next;
      });
    }
    setIsPageChanging(false);
  }, [ayahs, currentPage]);

  useEffect(() => {
    if (!fullPage) return undefined;
    let cancelled = false;
    // Current page first, then the neighbours in reading order: an uncached
    // leaf must never wait behind a speculative prefetch of the next ones.
    const neighbours = [currentPage, currentPage + 1, currentPage - 1, currentPage + 2, currentPage - 2]
      .filter((page) => page >= 1 && page <= 604 && !pageCacheRef.current.has(page));
    (async () => {
      for (const page of neighbours) {
        const direction = turnDirection(page, currentPage);
        const isNeighbour = page !== currentPage;
        try {
          const result = await preloadQuranDisplayData({ currentJuz: state.currentJuz, currentPage: page, currentSurah, displayMode: "page", lang, riwaya, warshStrictMode: state.warshStrictMode });
          if (cancelled) return;
          setPageCache((current) => {
            const next = new Map(current).set(page, result.ayahs);
            pageCacheRef.current = next;
            return next;
          });
          if (isNeighbour && result.ayahs?.length) {
            setFailedTurn((current) => (current === direction ? null : current));
          }
        } catch {
          if (cancelled) return;
          if (!isNeighbour) return;
          // A neighbour that cannot be fetched is the same request its arrow
          // would make: show the retry state there instead of waiting for the
          // tap to fail as well.
          setFailedTurn((current) => current || direction);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [currentPage, currentSurah, fullPage, lang, riwaya, state.currentJuz, state.warshStrictMode]);

  const navigateToPage = useCallback(async (targetPage, direction) => {
    if (targetPage < 1 || targetPage > 604 || isPageChanging) return;
    turnRef.current = direction;
    setFailedTurn(null);
    setIsPageChanging(true);

    try {
      if (!pageCacheRef.current.has(targetPage)) {
        const result = await preloadQuranDisplayData({
          currentJuz: state.currentJuz,
          currentPage: targetPage,
          currentSurah,
          displayMode: "page",
          lang,
          riwaya,
          warshStrictMode: state.warshStrictMode,
        });
        if (!result.ayahs?.length) {
          // An empty leaf is as unusable as a rejected one: the arrow says so
          // instead of the tap looking like it did nothing.
          setFailedTurn(direction);
          setIsPageChanging(false);
          return;
        }
        setPageCache((current) => {
          const next = new Map(current).set(targetPage, result.ayahs);
          pageCacheRef.current = next;
          return next;
        });
      }
      dispatch({ type: "NAVIGATE_PAGE", payload: { page: targetPage } });
    } catch {
      // Keep the current Quran page readable. The same control stays enabled as
      // the retry path and now shows why the leaf did not arrive, so an offline
      // turn is a visible state instead of a swallowed error.
      setFailedTurn(direction);
      setIsPageChanging(false);
    }
  }, [currentSurah, dispatch, isPageChanging, lang, riwaya, state.currentJuz, state.warshStrictMode]);

  // Landing on another leaf — by arrow, key, swipe or an external navigation —
  // retires the indication; it belongs to the turn that was attempted.
  useEffect(() => {
    setFailedTurn(null);
  }, [currentPage]);

  // The action sheet belongs to a verse on the leaf that was turned to; any
  // page change removes that verse from the screen.
  useEffect(() => {
    setActionsAyah(null);
  }, [currentPage]);

  const handlePrev = useCallback(() => {
    if (isDouble) {
      const target = Math.max(1, currentPage - 2);
      if (target !== currentPage) navigateToPage(target, "prev");
      return;
    }
    if (currentPage <= 1) return;
    navigateToPage(currentPage - 1, "prev");
  }, [currentPage, isDouble, navigateToPage]);

  const handleNext = useCallback(() => {
    if (isDouble) {
      const target = Math.min(604, currentPage + 2);
      if (target !== currentPage) navigateToPage(target, "next");
      return;
    }
    if (currentPage >= 604) return;
    navigateToPage(currentPage + 1, "next");
  }, [currentPage, isDouble, navigateToPage]);

  const handleOverlayKeyDown = useCallback((event) => {
    if (event.key === "Escape") {
      // With the sheet open, its own document listener owns Escape; consuming
      // it here would close the whole overlay when focus sits on a marker.
      if (actionsAyah != null) return;
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key === " " && !isInteractiveTarget(event.target) && hasAudioSession) { event.preventDefault(); audioService.toggle(); return; }
    if (isInteractiveTarget(event.target)) return;
    if (event.key === "ArrowLeft") { handleNext(); return; }
    if (event.key === "ArrowRight") { handlePrev(); return; }
    if (event.key === "+" || event.key === "=") { setZoomDelta((value) => clampZoom(value + ZOOM_STEP)); return; }
    if (event.key === "-") { setZoomDelta((value) => clampZoom(value - ZOOM_STEP)); return; }
    if (event.key === "0") setZoomDelta(1);
  }, [actionsAyah, handleNext, handlePrev, hasAudioSession, onClose]);

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

  // A leaf wider than the window — big type or a zoomed sheet — opens on its
  // reading edge: a mushaf page starts on the right, and leaving the scroll at
  // the left showed the end of every line instead of its beginning. The
  // requested leaf is the one aligned, not the outer edge of the spread.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const leaf = viewport.querySelector(`.qcm-page-shell[data-page="${currentPage}"]`);
    if (leaf) leaf.scrollIntoView({ inline: "end", block: "start" });
    else viewport.scrollLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    viewport.scrollTop = 0;
  }, [currentPage, layout]);

  useEffect(() => {
    try { sessionStorage.setItem(ZOOM_STORAGE_KEY, String(zoomDelta)); } catch { /* best-effort preference */ }
  }, [zoomDelta]);

  if (!fullPage || typeof document === "undefined") return null;

  const activePageAyahs = pageCache.get(currentPage) || (isPageScoped(ayahs, currentPage) ? ayahs : []);
  const actionsAyahData = actionsAyah == null
    ? null
    : spreadPages
        .flatMap((page) => pageCache.get(page) || (isPageScoped(ayahs, page) ? ayahs : []))
        .find((ayah) => Number(ayah?.number) === actionsAyah) || null;
  const pageKind = (isDouble ? spread.right : currentPage) <= 2 ? "opening" : "standard";
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
  // Zoom scales the whole sheet (frame, head, folio and markers included)
  // through CSS zoom, so enlarged pages grow the scroll area instead of
  // spilling outside their layout box.
  const handleWheel = (event) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    setZoomDelta((value) => clampZoom(value + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)));
  };
  // Fit changes only the type scale: the fifteen lines and their words are
  // fixed by the printed page data, so the sheet shrinks or grows whole.
  const applyFit = (mode) => {
    const viewport = viewportRef.current;
    const sheet = viewport?.querySelector(".mfp-book");
    if (!viewport || !sheet) return;
    // With CSS zoom the sheet's offset box is already its unzoomed layout
    // size; the viewport's own padding is not readable area.
    const styles = window.getComputedStyle(viewport);
    const availW = viewport.clientWidth - (Number.parseFloat(styles.paddingLeft) || 0) - (Number.parseFloat(styles.paddingRight) || 0);
    const availH = viewport.clientHeight - (Number.parseFloat(styles.paddingTop) || 0) - (Number.parseFloat(styles.paddingBottom) || 0);
    const { offsetWidth: width, offsetHeight: height } = sheet;
    if (availW <= 0 || availH <= 0 || width <= 0 || height <= 0) return;
    const scale = mode === "width"
      ? availW / width
      : Math.min(availW / width, availH / height);
    // The fit target is an absolute scale of the printed sheet, while the
    // reader's size already counts as 100 % — convert the target into the delta.
    setZoomDelta((value) => clampZoom((scale || value * sizeScale) / sizeScale));
  };

  return createPortal(
    <div ref={overlayRef} className={`mfp-portal-root${chromeVisible ? "" : " mfp-portal-root--zen"}`} data-theme={theme} data-layout={layout} data-view="reading" data-riwaya={riwaya} dir={lang === "ar" ? "rtl" : "ltr"} style={{ "--qd-font-family": quranFontFamily, "--font-quran": quranFontFamily, "--font-quran-tajweed": quranFontFamily, ...getThemeOverlayStyle(theme) }} role="dialog" aria-modal="true" aria-label={`${t("quran.page", lang)} ${pageLabel}`} onKeyDown={handleOverlayKeyDown}>
      <header className="mfp-header">
        <div className="mfp-header__identity">
          <button ref={closeButtonRef} type="button" className="mfp-icon-btn" onClick={onClose} aria-label={t("audio.close", lang)} title={`${t("audio.close", lang)} (Esc)`}><X size={18} aria-hidden="true" /></button>
          <div className="mfp-header__copy"><h2>{t("quran.page", lang)} {pageLabel}<span className="mfp-header__total">{" / 604"}</span><span className="mfp-header__context">{` · ${riwaya === "warsh" ? "Warsh" : "Hafs"}${currentJuz ? ` · ${t("sidebar.juz", lang)} ${currentJuz}` : ""}`}</span></h2></div>
        </div>
        <div className="mfp-header__tools">
          <AudioControls {...audioProps} />
          <div className="mfp-zoom-controls" dir="ltr">
            <button type="button" className="mfp-icon-btn" onClick={() => setZoomDelta((value) => clampZoom(value - ZOOM_STEP))} disabled={zoom <= MIN_ZOOM} aria-label={t("quran.zoomOut", lang)}><Minus size={16} /></button>
            <button type="button" className="mfp-zoom-value" onClick={() => setZoomDelta(1)} aria-label={t("quran.zoomReset", lang)}>{Math.round(zoom * 100)}%</button>
            <button type="button" className="mfp-icon-btn" onClick={() => setZoomDelta((value) => clampZoom(value + ZOOM_STEP))} disabled={zoom >= MAX_ZOOM} aria-label={t("quran.zoomIn", lang)}><Plus size={16} /></button>
            <button type="button" className="mfp-icon-btn mfp-zoom-fit" onClick={() => applyFit("page")} aria-label={t("quran.fitPage", lang)} title={t("quran.fitPage", lang)}><Maximize size={16} /></button>
            <button type="button" className="mfp-icon-btn mfp-zoom-fit" onClick={() => applyFit("width")} aria-label={t("quran.fitWidth", lang)} title={t("quran.fitWidth", lang)}><ArrowLeftRight size={16} /></button>
          </div>
        </div>
      </header>
      <main ref={viewportRef} className="mfp-viewport" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onWheel={handleWheel}>
        <div key={currentPage} className="mfp-book mfp-book--exact" data-page-kind={pageKind} data-layout={layout} data-turn={turnRef.current || undefined} style={{ "--mfp-zoom": zoom }}>
          {spreadPages.map((pageNumber) => {
            const pageAyahs = pageCache.get(pageNumber) || (isPageScoped(ayahs, pageNumber) ? ayahs : []);
            return (
              <QuranMushafPage key={pageNumber} activeAyah={actionsAyah} ayahs={pageAyahs} currentPage={pageNumber} currentPlayingAyah={currentPlayingAyah} fontFamily={state.fontFamily} lang={lang} onToggleActive={(globalAyah) => setActionsAyah((current) => (current === globalAyah ? null : globalAyah))} riwaya={riwaya} showTajwid={state.showTajwid} />
            );
          })}
        </div>
      </main>
      <button type="button" className="mfp-side-nav mfp-side-nav--next" onClick={handleNext} disabled={isPageChanging || currentPage >= 604} aria-busy={isPageChanging || undefined} data-load-failed={failedTurn === "next" || undefined} aria-describedby={failedTurn === "next" ? NAV_STATUS_ID : undefined} aria-label={t("nav.nextPage", lang)} title={`${t("nav.nextPage", lang)} (←)`}>{failedTurn === "next" ? <TurnAlert lang={lang} /> : null}<ChevronLeft size={22} /></button>
      <button type="button" className="mfp-side-nav mfp-side-nav--prev" onClick={handlePrev} disabled={isPageChanging || currentPage <= 1} aria-busy={isPageChanging || undefined} data-load-failed={failedTurn === "prev" || undefined} aria-describedby={failedTurn === "prev" ? NAV_STATUS_ID : undefined} aria-label={t("nav.prevPage", lang)} title={`${t("nav.prevPage", lang)} (→)`}>{failedTurn === "prev" ? <TurnAlert lang={lang} /> : null}<ChevronRight size={22} /></button>
      <span id={NAV_STATUS_ID} className="sr-only" role="status" aria-live="polite">{failedTurn ? t("quran.pageLoadFailed", lang) : ""}</span>
      <footer className="mfp-mobile-footer">
        <AudioControls compact {...audioProps} />
        <div className="mfp-mobile-pagination" dir="ltr"><button type="button" className="mfp-icon-btn" onClick={handleNext} disabled={isPageChanging || currentPage >= 604} aria-busy={isPageChanging || undefined} data-load-failed={failedTurn === "next" || undefined} aria-describedby={failedTurn === "next" ? NAV_STATUS_ID : undefined} aria-label={t("nav.nextPage", lang)}>{failedTurn === "next" ? <TurnAlert lang={lang} /> : null}<ChevronLeft size={20} /></button><strong>{pageLabel} / 604</strong><button type="button" className="mfp-icon-btn" onClick={handlePrev} disabled={isPageChanging || currentPage <= 1} aria-busy={isPageChanging || undefined} data-load-failed={failedTurn === "prev" || undefined} aria-describedby={failedTurn === "prev" ? NAV_STATUS_ID : undefined} aria-label={t("nav.prevPage", lang)}>{failedTurn === "prev" ? <TurnAlert lang={lang} /> : null}<ChevronRight size={20} /></button></div>
      </footer>
      <AyahActionsModal
        activeAyah={actionsAyah}
        className="ayah-actions-modal--fullscreen"
        onClose={() => setActionsAyah(null)}
        portalToBody
        quietBackdrop
        surah={actionsAyahData?.surah?.number || currentSurah}
        ayahData={actionsAyahData}
        translations={actionsAyahData ? getTranslationForAyah?.(actionsAyahData) || [] : []}
      />
    </div>, document.body,
  );
}

export default memo(FullscreenMushafOverlayComponent);
