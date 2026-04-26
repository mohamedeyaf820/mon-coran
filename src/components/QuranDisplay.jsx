import React, { useCallback, useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import { clearCache } from "../services/quranAPI";
import { ensureReciterForRiwaya } from "../data/reciters";
import { getKaraokeCalibration } from "../utils/karaokeUtils";
import { openExternalUrl } from "../lib/security";
import Footer from "./Footer";
import FullscreenMushafOverlay from "./QuranDisplay/FullscreenMushafOverlay";
import JuzMode from "./QuranDisplay/JuzMode";
import PageMode from "./QuranDisplay/PageMode";
import SurahMode from "./QuranDisplay/SurahMode";
import WarshNotice from "./QuranDisplay/WarshNotice";
import { createDisplayClasses } from "./QuranDisplay/displayClasses";
import useQuranDisplayAudio from "./QuranDisplay/useQuranDisplayAudio";
import useQuranDisplayData from "./QuranDisplay/useQuranDisplayData";
import useQuranDisplayGroups from "./QuranDisplay/useQuranDisplayGroups";
import useQuranDisplayNavigation from "./QuranDisplay/useQuranDisplayNavigation";
import useQuranDisplayPrefetch from "./QuranDisplay/useQuranDisplayPrefetch";
import useQuranDisplayScroll from "./QuranDisplay/useQuranDisplayScroll";
import useQuranDisplayView from "./QuranDisplay/useQuranDisplayView";
import useQuranTranslations from "./QuranDisplay/useQuranTranslations";

export default function QuranDisplay() {
  const { state, dispatch, set } = useApp();
  const [activeAyah, setActiveAyah] = useState(null);
  const {
    currentAyah,
    currentJuz,
    currentPage,
    currentPlayingAyah,
    currentSurah,
    displayMode,
    focusReading,
    fontFamily,
    lang,
    loading,
    memMode,
    mushafLayout,
    quranFontSize,
    reciter,
    riwaya,
    showTajwid,
    showTranslation,
    showTransliteration,
    showWordByWord,
    showWordTranslation,
    syncOffsetsMs,
    translationLangs,
    warshStrictMode,
  } = state;

  const syncKey = `${riwaya}:${ensureReciterForRiwaya(reciter, riwaya)}`;
  const { ayahs, error, fetchData, isQCF4, isWarshFallback, setError } =
    useQuranDisplayData({
      currentAyah,
      currentJuz,
      currentPage,
      currentSurah,
      dispatch,
      displayMode,
      lang,
      showHome: state.showHome,
      riwaya,
      warshStrictMode,
    });
  const { getTranslationForAyah } = useQuranTranslations({
    currentJuz,
    currentPage,
    currentSurah,
    displayMode,
    showTranslation,
    translationLangs,
  });
  const { pageTopSurah, surahGroups } = useQuranDisplayGroups({
    ayahs,
    currentSurah,
    displayMode,
  });
  const classes = useMemo(
    () => createDisplayClasses({ focusReading, riwaya }),
    [focusReading, riwaya],
  );
  const view = useQuranDisplayView({
    dispatch,
    displayMode,
    fontFamily,
    isQCF4,
    quranFontSize,
    riwaya,
    syncKey,
    syncOffsetsMs,
  });
  const karaokeCalibration = useMemo(() => {
    const reciterId = ensureReciterForRiwaya(reciter, riwaya);
    const base = getKaraokeCalibration(reciterId, riwaya);
    const offsetSec =
      (base.offsetSec ?? 0.15) +
      view.userSyncOffsetMs / 1000 +
      (displayMode === "surah" ? 0 : -0.02);
    return { ...base, offsetSec: Math.max(-0.8, Math.min(0.95, offsetSec)) };
  }, [displayMode, reciter, riwaya, view.userSyncOffsetMs]);
  const { playSpecificSurah, playSurah, preparingSurah } = useQuranDisplayAudio({
    ayahs,
    currentJuz,
    currentPage,
    currentSurah,
    continuousPlay: state.continuousPlay,
    displayMode,
    dispatch,
    lang,
    reciter,
    riwaya,
    set,
    setError,
    warshStrictMode,
  });
  const { scrollToTop, showScrollTop } = useQuranDisplayScroll({
    ayahCount: ayahs.length,
    contentRef: view.contentRef,
    currentAyah,
    currentJuz,
    currentPage,
    currentPlayingAyah,
    currentSurah,
    displayMode,
    getScrollContainer: view.getScrollContainer,
    mushafLayout,
    onInitialFocusAyah: setActiveAyah,
  });
  const navigation = useQuranDisplayNavigation({
    currentJuz,
    currentPage,
    currentSurah,
    dispatch,
    set,
    showWordByWord,
  });

  useQuranDisplayPrefetch({
    currentJuz,
    currentPage,
    currentSurah,
    displayMode,
    loading,
    riwaya,
    showTranslation,
    translationLangs,
  });

  const toggleAyah = useCallback((id) => setActiveAyah((current) => (current === id ? null : id)), []);
  const toggleMushaf = useCallback(() => {
    set({ mushafLayout: mushafLayout === "mushaf" ? "list" : "mushaf", showWordByWord: false, memMode: false, showTajwid: true, fontFamily: "mushaf-tajweed" });
  }, [mushafLayout, set]);
  const toggleMemorization = useCallback(() => {
    set({ mushafLayout: "list", memMode: !memMode, showWordByWord: false });
  }, [memMode, set]);
  const repairPlatform = useCallback(async () => {
    try {
      await clearCache();
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
      localStorage.removeItem("mushaf-plus-settings");
    } finally {
      window.location.reload();
    }
  }, []);

  if (loading && ayahs.length === 0) return <div className="quran-loading"><div className="loading-skeleton"><div className="loading-skeleton-topbar"><div className="loading-pill"></div><div className="loading-pill"></div></div><div className="skeleton-header"></div><div className="skeleton-bismillah"></div><div className="skeleton-line thin"></div><div className="skeleton-line long"></div><div className="skeleton-line medium"></div><div className="skeleton-line long"></div><div className="skeleton-line short"></div><div className="skeleton-line long"></div><div className="skeleton-line medium"></div><div className="skeleton-line long"></div><div className="skeleton-line short"></div><div className="skeleton-line medium"></div><div className="skeleton-line long"></div></div></div>;
  if (error) return <div className="quran-error"><i className={`fas ${ayahs.length === 0 && /Failed to fetch|NetworkError|timeout|AbortError/i.test(error) ? "fa-wifi-slash" : "fa-circle-exclamation"}`}></i>{ayahs.length === 0 && /Failed to fetch|NetworkError|timeout|AbortError/i.test(error) ? <><p className="quran-error-network-msg">{lang === "fr" ? "Impossible de charger les donnees : verifiez votre connexion internet et reessayez." : "Unable to load data: please check your internet connection and try again."}</p><p className="quran-error-detail">{error}</p></> : <p>{error}</p>}<div className="quran-error-actions"><button className="btn btn-primary" onClick={fetchData}>{t("errors.retry", lang)}</button><button className="btn btn-outline" onClick={repairPlatform}>{lang === "fr" ? "R\u00e9parer la plateforme" : "Repair Platform"}</button></div></div>;
  if (!loading && ayahs.length === 0) return <div className="quran-error"><i className="fas fa-book-open"></i><p>{t("errors.emptyData", lang)}</p><div className="quran-error-actions"><button className="btn btn-primary" onClick={fetchData}>{t("errors.retry", lang)}</button><button className="btn btn-outline" onClick={repairPlatform}>{lang === "fr" ? "R\u00e9parer la plateforme" : "Repair Platform"}</button></div></div>;

  return (
    <>
      <div className="reading-progress-bar" aria-hidden="true" />
      <div className={`quran-display quran-display--${riwaya} quran-display--platform`} ref={view.contentRef} {...view.touchHandlers}>
        {riwaya === "warsh" && !isWarshFallback ? <WarshNotice kind="ok" badgeLabel={t("settings.warshUnicodeBadge", lang)} body={t("settings.warshUnicodeText", lang)} frameClassName={classes.readingChromeFrameClass} /> : null}
        {riwaya === "warsh" && isWarshFallback ? <WarshNotice kind="fallback" badgeLabel={t("settings.warshFallbackBadge", lang)} body={t("settings.warshFallbackText", lang)} frameClassName={classes.readingChromeFrameClass} linkLabel={t("settings.warshMushafLink", lang)} linkClassName={classes.warshMushafLinkClass} onLinkClick={() => openExternalUrl("https://archive.org/download/MushafAlMadinahWarsh5488865/Mushaf%20AlMadinah_Warsh.pdf")} /> : null}
        {displayMode === "surah" ? <SurahMode activeAyah={activeAyah} ayahs={ayahs} calibration={karaokeCalibration} classes={classes} currentPlayingAyah={currentPlayingAyah} currentSurah={currentSurah} getTranslationForAyah={getTranslationForAyah} isQCF4={isQCF4} lang={lang} memMode={memMode} mushafLayout={mushafLayout} onNextSurah={navigation.goNextSurah} onPlaySurah={playSurah} onPrevSurah={navigation.goPrevSurah} onToggleActive={toggleAyah} preparingSurah={preparingSurah} readingFontSize={view.readingFontSize} riwaya={riwaya} showTajwid={showTajwid} showTranslation={showTranslation} showTransliteration={showTransliteration} showWordByWord={showWordByWord} showWordTranslation={showWordTranslation} theme={state.theme} /> : null}
        {displayMode === "page" ? <PageMode activeAyah={activeAyah} ayahs={ayahs} calibration={karaokeCalibration} classes={classes} currentPage={currentPage} currentPlayingAyah={currentPlayingAyah} currentSurah={currentSurah} getMushafLayoutButtonClass={classes.getMushafLayoutButtonClass} getTranslationForAyah={getTranslationForAyah} isQCF4={isQCF4} lang={lang} memMode={memMode} mushafLayout={mushafLayout} onNextPage={navigation.goNextPage} onPrevPage={navigation.goPrevPage} onToggleActive={toggleAyah} onToggleMemorization={toggleMemorization} onToggleMushaf={toggleMushaf} onToggleWordByWord={navigation.toggleWordByWordMode} pageTopSurah={pageTopSurah} readingFontSize={view.readingFontSize} riwaya={riwaya} showRiwayaStar={riwaya === "warsh" && isQCF4} showTajwid={showTajwid} showTranslation={showTranslation} showTransliteration={showTransliteration} showWordByWord={showWordByWord} showWordTranslation={showWordTranslation} surahGroups={surahGroups} theme={state.theme} /> : null}
        {displayMode === "juz" ? <JuzMode activeAyah={activeAyah} calibration={karaokeCalibration} classes={classes} currentJuz={currentJuz} currentPlayingAyah={currentPlayingAyah} getMushafLayoutButtonClass={classes.getMushafLayoutButtonClass} getTranslationForAyah={getTranslationForAyah} isQCF4={isQCF4} lang={lang} memMode={memMode} mushafLayout={mushafLayout} onNextJuz={navigation.goNextJuz} onPlaySpecificSurah={playSpecificSurah} onPrevJuz={navigation.goPrevJuz} onToggleActive={toggleAyah} onToggleMemorization={toggleMemorization} onToggleMushaf={toggleMushaf} onToggleWordByWord={navigation.toggleWordByWordMode} preparingSurah={preparingSurah} readingFontSize={view.readingFontSize} riwaya={riwaya} showRiwayaStar={riwaya === "warsh" && isQCF4} showTajwid={showTajwid} showTranslation={showTranslation} showTransliteration={showTransliteration} showWordByWord={showWordByWord} showWordTranslation={showWordTranslation} surahGroups={surahGroups} theme={state.theme} /> : null}
        {showScrollTop ? <button className="scroll-top-btn" onClick={scrollToTop} title={t("nav.scrollTop", lang)} aria-label={t("nav.scrollTop", lang)}><i className="fas fa-chevron-up"></i></button> : null}
        <Footer goSurah={(surah) => { set({ displayMode: "surah", showHome: false, showDuas: false }); dispatch({ type: "NAVIGATE_SURAH", payload: { surah, ayah: 1 } }); }} />
        <FullscreenMushafOverlay ayahs={ayahs} currentPage={currentPage} currentPlayingAyah={currentPlayingAyah} currentSurah={currentSurah} fullPage={view.fullPage} lang={lang} onClose={() => view.setFullPage(false)} riwaya={riwaya} />
      </div>
    </>
  );
}
