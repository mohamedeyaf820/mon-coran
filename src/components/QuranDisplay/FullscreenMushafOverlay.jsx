import React, { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Minus, Plus, X, Play, Pause, SkipBack, SkipForward, Settings, BookOpen, Repeat2 } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { toAr } from "../../data/surahs";
import { t } from "../../i18n";
import { Button } from "../ui/button";
import ImmersiveMushafPage from "./ImmersiveMushafPage";
import { preloadQuranDisplayData } from "./useQuranDisplayData";
import audioService from "../../services/audioService";
import { resolveFontFamily } from "../../data/fonts";
import { getArabicReadingLineHeight } from "../../utils/arabicTypography";

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
  ayahs, currentPage, currentPlayingAyah, currentSurah, fullPage, lang,
  onClose, onNextPage, onPrevPage, onPlayAyah, onOpenPlayer, riwaya,
  readingFontSize, isQCF4, calibration,
}) {
  const { state, set } = useApp();
  const rootRef = useRef(null);
  const viewportRef = useRef(null);
  const callbacks = useRef({ onClose, onNextPage, onPrevPage, currentPage });
  callbacks.current = { onClose, onNextPage, onPrevPage, currentPage };
  const [zoom, setZoom] = useState(1);
  const [fitMode, setFitMode] = useState(null);
  const [pageHeights, setPageHeights] = useState({});
  const measurePage = useCallback((page, height) => {
    setPageHeights(previous => previous[page] === height ? previous : { ...previous, [page]: height });
  }, []);
  const [composition, setComposition] = useState(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [pagePreference, setPagePreference] = useState(() => {
    try { return localStorage.getItem("mushafplus-page-layout") === "1" ? 1 : 2; } catch { return 2; }
  });
  const [neighbour, setNeighbour] = useState(null);
  const [pageAttempt, setPageAttempt] = useState(0);
  const repeat = state.surahRepeatCount === 0;
  const pageWidth = (composition?.width || 700) + 50;
  const minimumPageScale = Math.max(0.5, 18 / (composition?.fontSize || readingFontSize));
  const canSpread = viewport.width >= Math.max(760, pageWidth * 2 * minimumPageScale + 24)
    && viewport.width / Math.max(1, viewport.height) >= 1.1 && viewport.height >= 300;
  const pageCount = canSpread && pagePreference === 2 && currentPage < 604 ? 2 : 1;
  const effectiveFitMode = fitMode || (viewport.width >= 760 ? "page" : "width");
  const spreadHeight = Math.max(pageWidth * 1.45, pageHeights[currentPage] || 0, pageCount === 2 ? pageHeights[currentPage + 1] || 0 : 0);
  const widthFit = Math.max(0.1, (viewport.width - (pageCount - 1) * 24) / (pageWidth * pageCount));
  const fit = Math.min(1, widthFit, effectiveFitMode === "page" && spreadHeight ? viewport.height / spreadHeight : Infinity);
  const scale = fit * zoom;
  const neighbourKey = `${riwaya}:${currentPage + 1}:${state.warshStrictMode}`;

  const [playing, setPlaying] = useState(audioService.isPlaying);
  const [track, setTrack] = useState(audioService.currentAyah);
  const pageLabel = lang === "ar" ? toAr(currentPage) : currentPage;
  const theme = state.theme || "light";

  useLayoutEffect(() => {
    if (!fullPage) { setComposition(null); return; }
    const text = document.querySelector(`[data-stream-page="${currentPage}"] .mushaf-text-block`);
    if (!text) {
      setComposition((previous) => previous || {
        riwaya, fontFamily: state.fontFamily, fallback: true,
        width: Math.min(readingFontSize * 16.7, window.innerWidth - 50), fontSize: readingFontSize,
        lineHeight: getArabicReadingLineHeight({ fontFamily: state.fontFamily, riwaya, mushafLayout: state.mushafLayout }), styles: {},
      });
      return;
    }
    const style = getComputedStyle(text);
    setComposition((previous) => !previous?.fallback && previous?.riwaya === riwaya && previous?.fontFamily === state.fontFamily ? previous : {
      riwaya,
      fontFamily: state.fontFamily,
      width: Math.min(text.getBoundingClientRect().width, parseFloat(style.fontSize) * 16.7),
      fontSize: parseFloat(style.fontSize),
      lineHeight: style.lineHeight,
      styles: Object.fromEntries([text, ...text.querySelectorAll('.cpv-verse, .cpv-verse *')].map((node) => {
        const resolved = getComputedStyle(node);
        return [`${node.tagName}.${node.className}`, Object.fromEntries(['font-family', 'font-size', 'font-weight', 'font-feature-settings', 'font-kerning', 'font-synthesis', 'line-height', 'letter-spacing', 'word-spacing', 'display', 'vertical-align', 'white-space', 'word-break', 'overflow-wrap', 'padding', 'margin', 'min-width', 'max-width', 'min-height', 'text-align', 'text-align-last', 'direction', 'transform'].map((key) => [key, resolved.getPropertyValue(key)]))];
      })),
    });
  }, [fullPage, currentPage, riwaya, state.fontFamily, ayahs, readingFontSize, state.mushafLayout]);

  useLayoutEffect(() => {
    if (!viewportRef.current) return;
    const observer = new ResizeObserver(([entry]) => setViewport({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, [fullPage]);

  useEffect(() => {
    if (pageCount !== 2) return;
    let active = true;
    setNeighbour({ key: neighbourKey, status: "loading" });
    preloadQuranDisplayData({ displayMode: "page", currentPage: currentPage + 1, currentSurah, currentJuz: state.currentJuz, riwaya, lang, warshStrictMode: state.warshStrictMode })
      .then((result) => { if (active) setNeighbour({ key: neighbourKey, status: result.ayahs.length ? "ready" : "error", ayahs: result.ayahs }); })
      .catch(() => { if (active) setNeighbour({ key: neighbourKey, status: "error" }); });
    return () => { active = false; };
  }, [pageCount, neighbourKey, currentPage, currentSurah, state.currentJuz, state.warshStrictMode, riwaya, lang, pageAttempt]);

  useEffect(() => {
    const update = () => {
      setPlaying(audioService.isPlaying);
      setTrack(audioService.currentAyah);
    };
    const unsubscribers = [
      audioService.addPlayListener(update), audioService.addPauseListener(update),
      audioService.addAyahChangeListener(update), audioService.addEndListener(update),
    ];
    update();
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  useEffect(() => {
    if (!fullPage) return;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    const app = document.getElementById("root");
    const wasInert = app?.inert;
    if (app) app.inert = true;
    document.body.style.overflow = "hidden";
    // Focus the dialog, not Close: a Space keyup from the opening control
    // must not immediately activate the newly focused close button.
    rootRef.current?.focus();
    const onKey = (event) => {
      event.stopPropagation();
      const actions = callbacks.current;
      if (event.key === "Escape") {
        event.preventDefault();
        actions.onClose();
      } else if (event.key === "Tab") {
        const buttons = [...rootRef.current.querySelectorAll('button:not(:disabled), summary, [href], [tabindex="0"]')].filter((node) => node.getClientRects().length > 0);
        const first = buttons[0];
        const last = buttons.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || document.activeElement === rootRef.current)) { event.preventDefault(); first?.focus(); }
        else if (event.shiftKey && document.activeElement === rootRef.current) { event.preventDefault(); last?.focus(); }
      } else if (event.key === "ArrowLeft" && actions.currentPage < 604) {
        event.preventDefault(); actions.onNextPage?.();
      } else if (event.key === "ArrowRight" && actions.currentPage > 1) {
        event.preventDefault(); actions.onPrevPage?.();
      }
    };
    rootRef.current?.addEventListener("keydown", onKey);
    const root = rootRef.current;
    return () => {
      root?.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      if (app) app.inert = wasInert;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [fullPage]);

  useEffect(() => {
    if (viewportRef.current) viewportRef.current.scrollTop = 0;
  }, [currentPage, riwaya]);

  if (!fullPage) return null;
  const playPause = () => {
    if (audioService.isPlaying) audioService.pause();
    else if (audioService.currentAyah) audioService.resume();
    else if (ayahs[0]) onPlayAyah(ayahs[0], ayahs);
  };
  const playMarker = (id) => {
    const ayah = ayahs.find((item) => item.number === id);
    if (ayah) onPlayAyah(ayah, ayahs);
  };
  const button = (label, action, icon, disabled = false) => (
    <Button type="button" variant="ghost" size="icon" aria-label={label} title={label} onClick={action} disabled={disabled}>{icon}</Button>
  );

  return createPortal(
    <div ref={rootRef} className="mfp-portal-root mfp-shared-reader" data-theme={theme} data-view="reading" data-riwaya={riwaya}
      dir={lang === "ar" ? "rtl" : "ltr"} style={{
        ...getThemeOverlayStyle(theme),
        "--quran-font-family": resolveFontFamily(state.fontFamily, riwaya),
        "--quran-font-size": `${composition?.fontSize || readingFontSize}px`,
        "--quran-line-height": composition?.lineHeight || getArabicReadingLineHeight({ fontFamily: state.fontFamily, riwaya, mushafLayout: state.mushafLayout }),
      }} role="dialog" aria-modal="true"
       tabIndex={-1} aria-label={`${t("quran.page", lang)} ${pageLabel}`}
       onTouchStart={(event) => event.stopPropagation()} onTouchMove={(event) => event.stopPropagation()} onTouchEnd={(event) => event.stopPropagation()}>
      <header className="mfp-controls">
        {button(t("audio.close", lang), onClose, <X />)}
        <h2>{t("quran.page", lang)} {pageLabel} / 604 <small>{riwaya === "warsh" ? "Warsh" : "Hafs"}</small></h2>
        <div className="mfp-controls">
          {button(`${t("settings.fontSize", lang)} -`, () => setZoom((value) => Math.max(0.75, value - 0.25)), <Minus />, zoom <= 0.75)}
          {button(`${t("settings.fontSize", lang)} 100%`, () => setZoom(1), <span>{Math.round(zoom * 100)}%</span>)}
          {button(`${t("settings.fontSize", lang)} +`, () => setZoom((value) => Math.min(1.5, value + 0.25)), <Plus />, zoom >= 1.5)}
        </div>
        <details className="mfp-options">
          <summary aria-label={t("quran.readingOptions", lang)}><Settings size={18} /></summary>
          <div className="mfp-options-panel">
            <Button variant="ghost" aria-pressed={effectiveFitMode === "page"} onClick={() => { setFitMode("page"); setZoom(1); }}>{t("quran.fitPage", lang)}</Button>
            <Button variant="ghost" aria-pressed={effectiveFitMode === "width"} onClick={() => { setFitMode("width"); setZoom(1); }}>{t("quran.fitWidth", lang)}</Button>
            <Button variant="ghost" aria-pressed={pagePreference === 1} onClick={() => { setPagePreference(1); try { localStorage.setItem("mushafplus-page-layout", "1"); } catch { /* Session preference remains usable. */ } }}>{t("quran.singlePage", lang)}</Button>
            <Button variant="ghost" aria-pressed={pagePreference === 2} disabled={!canSpread} onClick={() => { setPagePreference(2); try { localStorage.setItem("mushafplus-page-layout", "2"); } catch { /* Session preference remains usable. */ } }}><BookOpen />{t("quran.doublePage", lang)}</Button>
            <Button variant="ghost" aria-pressed={repeat} onClick={() => { const count = repeat ? 1 : 0; audioService.setSurahRepeatCount(count); set({ surahRepeatCount: count }); }}><Repeat2 />{t("audio.repeat", lang)}</Button>
          </div>
        </details>
      </header>
      <main ref={viewportRef} data-fit={effectiveFitMode}>
        <div className="mfp-spread" dir="rtl" data-page-count={pageCount}>
          {composition && <ImmersiveMushafPage composition={composition} scale={scale} page={currentPage} onMeasure={measurePage} paperHeight={spreadHeight}
            ayahs={ayahs} lang={lang} isQCF4={isQCF4} showTajwid={state.showTajwid} currentPlayingAyah={currentPlayingAyah} calibration={calibration}
            surahNum={ayahs[0]?.surah?.number || currentSurah} riwaya={riwaya}
            onAyahClick={playMarker} getAyahToggleId={(ayah) => ayah.number} onPlayAyah={onPlayAyah} showSurahHeader />}
          {pageCount === 2 && (neighbour?.key === neighbourKey && neighbour.status === "ready" && composition
            ? <ImmersiveMushafPage composition={composition} scale={scale} page={currentPage + 1} onMeasure={measurePage} paperHeight={spreadHeight}
                ayahs={neighbour.ayahs} lang={lang} isQCF4={isQCF4} showTajwid={state.showTajwid} currentPlayingAyah={currentPlayingAyah} calibration={calibration}
                surahNum={neighbour.ayahs[0]?.surah?.number || currentSurah} riwaya={riwaya}
                onAyahClick={(id) => { const ayah = neighbour.ayahs.find((item) => item.number === id); if (ayah) onPlayAyah(ayah, neighbour.ayahs); }}
                getAyahToggleId={(ayah) => ayah.number} onPlayAyah={onPlayAyah} showSurahHeader />
            : <div className="mfp-page-status" role="status" style={{ width: pageWidth * scale }}>
                {neighbour?.key === neighbourKey && neighbour.status === "error" ? <><p>{t("errors.generic", lang)}</p><Button onClick={() => setPageAttempt((value) => value + 1)}>{t("quran.retry", lang)}</Button></> : t("quran.loading", lang)}
              </div>)}
        </div>
      </main>
      <footer>
        <div className="mfp-controls mfp-transport">
          {button(t("audio.prev", lang), () => audioService.prev(), <SkipBack />, !track)}
          {button(t(playing ? "audio.pause" : "audio.play", lang), playPause, playing ? <Pause /> : <Play />, !ayahs.length && !track)}
          {button(t("audio.next", lang), () => audioService.next(), <SkipForward />, !track)}
          {button(t("settings.reciter", lang), () => { onClose(); onOpenPlayer?.(); }, <Settings />)}
          {track && <span className="mfp-track">{track.surah}:{track.ayah}</span>}
        </div>
        <div className="mfp-controls mfp-pagination">
          {button(t("quran.prevPage", lang), onPrevPage, <ChevronRight />, currentPage <= 1)}
          <span>{pageLabel} / 604</span>
          {button(t("quran.nextPage", lang), onNextPage, <ChevronLeft />, currentPage >= 604)}
        </div>
      </footer>
    </div>, document.body,
  );
}
export default memo(FullscreenMushafOverlayComponent);
