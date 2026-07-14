import React, { useCallback, useEffect, useMemo, useState } from "react";
import "../styles/domains/reader-consolidation.css";
import "../styles/domains/reading-platform.css";
import "../styles/word-by-word-refonte.css";
import {
  shallowEqual,
  useAppActions,
  useAppSelector,
} from "../context/AppContext";
import { t } from "../i18n";
import { clearCache } from "../services/quranAPI";
import { clearWarshCache } from "../services/warshService";
import { clearMushafRuntimeCaches } from "../services/runtimeCacheService";
import { ensureReciterForRiwaya } from "../data/reciters";
import { getKaraokeCalibration } from "../utils/karaokeUtils";
import Footer from "./Footer";
import FullscreenMushafOverlay from "./QuranDisplay/FullscreenMushafOverlay";
import JuzMode from "./QuranDisplay/JuzMode";
import PageMode from "./QuranDisplay/PageMode";
import SurahMode from "./QuranDisplay/SurahMode";
import VerseCompareTray from "./QuranDisplay/VerseCompareTray";
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
import AyahSkeleton from "./Quran/AyahSkeleton";
import { Icon } from "./ui/icon";

export default function QuranDisplay() {
  const { dispatch, set } = useAppActions();
  const state = useAppSelector(
    (current) => ({
      currentAyah: current.currentAyah,
      currentJuz: current.currentJuz,
      currentPage: current.currentPage,
      currentPlayingAyah: current.currentPlayingAyah,
      currentSurah: current.currentSurah,
      displayMode: current.displayMode,
      focusReading: current.focusReading,
      fontFamily: current.fontFamily,
      isPlaying: current.isPlaying,
      lang: current.lang,
      loading: current.loading,
      memMode: current.memMode,
      mushafLayout: current.mushafLayout,
      quranFontSize: current.quranFontSize,
      quranTranslationFontSize: current.quranTranslationFontSize,
      reciter: current.reciter,
      riwaya: current.riwaya,
      showHome: current.showHome,
      showTajwid: current.showTajwid,
      showTranslation: current.showTranslation,
      showTransliteration: current.showTransliteration,
      showWordByWord: current.showWordByWord,
      showWordTranslation: current.showWordTranslation,
      syncOffsetsMs: current.syncOffsetsMs,
      translationLangs: current.translationLangs,
      warshStrictMode: current.warshStrictMode,
    }),
    shallowEqual,
  );
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
    isPlaying,
    lang,
    loading,
    memMode,
    mushafLayout,
    quranFontSize,
    quranTranslationFontSize,
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
  const { ayahs, error, fetchData, isWarshFallback, setError } =
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
    arabicReady: ayahs.length > 0,
    currentJuz,
    currentPage,
    currentSurah,
    displayMode,
    showTranslation,
    translationLangs,
  });
  const { pageTopSurah, surahGroups, pageGroups } = useQuranDisplayGroups({
    ayahs,
    currentSurah,
    displayMode,
  });
  const classes = useMemo(
    () => createDisplayClasses({ focusReading, riwaya }),
    [focusReading, riwaya],
  );
  const isQCF4 =
    fontFamily === "qcf-v4-tajweed" ||
    fontFamily === "mushaf-tajweed" ||
    fontFamily === "qcf-v4";
  const view = useQuranDisplayView({
    contentReady: ayahs.length > 0,
    dispatch,
    displayMode,
    fontFamily,
    isQCF4,
    quranFontSize,
    quranTranslationFontSize,
    riwaya,
    syncKey,
    syncOffsetsMs,
    mushafLayout,
  });
  const karaokeCalibration = useMemo(() => {
    const reciterId = ensureReciterForRiwaya(reciter, riwaya);
    const base = getKaraokeCalibration(reciterId, riwaya);
    const offsetSec =
      (base.offsetSec ?? 0.15) +
      (view.userSyncOffsetMs ?? 0) / 1000 +
      (displayMode === "surah" ? 0 : -0.02);
    return { ...base, offsetSec: Math.max(-0.8, Math.min(0.95, offsetSec)) };
  }, [displayMode, reciter, riwaya, view.userSyncOffsetMs]);
  const { playSpecificSurah, playSurah, preparingSurah } = useQuranDisplayAudio(
    {
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
    },
  );
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
    isPlaying,
    loading,
    riwaya,
    showTranslation,
    translationLangs,
  });

  useEffect(() => {
    setActiveAyah(null);
  }, [currentJuz, currentPage, currentSurah, displayMode, riwaya]);

  const toggleAyah = useCallback(
    (id) => setActiveAyah((current) => (current === id ? null : id)),
    [],
  );
  const handleNavigateToAyah = useCallback(
    ({ surah, ayah }) => {
      const match = ayahs.find(
        (a) =>
          Number(a.numberInSurah) === Number(ayah) &&
          Number(a.surah?.number || a.surah) === Number(surah),
      );
      if (match) {
        setActiveAyah(displayMode === "surah" ? ayah : match.number);
        const elementId =
          displayMode === "surah" ? `ayah-${ayah}` : `ayah-${match.number}`;
        document.getElementById(elementId)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      } else {
        dispatch({ type: "NAVIGATE_SURAH", payload: { surah, ayah } });
        setActiveAyah(ayah);
      }
    },
    [ayahs, displayMode, dispatch],
  );
  const toggleMushaf = useCallback(() => {
    set({
      mushafLayout: mushafLayout === "mushaf" ? "list" : "mushaf",
      showWordByWord: false,
      memMode: false,
      showTajwid: true,
    });
  }, [mushafLayout, set]);
  const toggleMemorization = useCallback(() => {
    dispatch({ type: "TOGGLE_MEM_MODE" });
  }, [dispatch]);

  const exitMemorization = useCallback(() => {
    set({ memMode: false, mushafLayout: "list", showWordByWord: false });
  }, [set]);
  const repairPlatform = useCallback(async () => {
    try {
      await clearCache();
      await clearWarshCache(); // Also clear Warsh-specific cache
      await clearMushafRuntimeCaches();
      try {
        localStorage.removeItem("mushaf-plus-settings");
      } catch {}
    } finally {
      window.location.reload();
    }
  }, []);

  const [fontLoading, setFontLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const loadFont = async () => {
      try {
        const {
          ensureFontLoaded,
          ensureQcfPageFontLoaded,
          isFontMarkedLoaded,
        } = await import("../services/fontLoader");
        const isQcfPageFont =
          fontFamily === "qcf-v1" ||
          fontFamily === "qcf-v2" ||
          fontFamily === "qcf-v4-tajweed";
        if (!isFontMarkedLoaded(fontFamily)) setFontLoading(true);

        if (isQcfPageFont && displayMode === "page") {
          const qcfVersion =
            fontFamily === "qcf-v4-tajweed"
              ? "v4"
              : fontFamily === "qcf-v2"
                ? "v2"
                : "v1";
          await ensureQcfPageFontLoaded(currentPage, qcfVersion);
        } else {
          await ensureFontLoaded(fontFamily);
        }
      } catch (err) {
        console.error("Font loading error:", err);
      } finally {
        if (active) {
          setFontLoading(false);
        }
      }
    };
    loadFont();
    return () => {
      active = false;
    };
  }, [fontFamily, currentPage, displayMode]);

  if ((loading && ayahs.length === 0) || (fontLoading && ayahs.length === 0))
    return (
      <div className="quran-display--platform flex-1 overflow-y-auto px-4 py-4">
        <AyahSkeleton count={6} showTranslation={showTranslation} lang={lang} />
      </div>
    );
  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center backdrop-blur-xl bg-bg-card/90 m-4 rounded-3xl shadow-xl border border-red-500/20 max-w-2xl mx-auto">
        <Icon
          name={
            ayahs.length === 0 &&
            /Failed to fetch|NetworkError|timeout|AbortError/i.test(error)
              ? "wifi-slash"
              : "circle-exclamation"
          }
          size={42}
          className="mb-6 text-red-500/80"
        />
        {ayahs.length === 0 &&
        /Failed to fetch|NetworkError|timeout|AbortError/i.test(error) ? (
          <>
            <p className="text-lg text-text-main font-medium mb-3">
              {lang === "fr"
                ? "Impossible de charger les données : vérifiez votre connexion internet et réessayez."
                : "Unable to load data: please check your internet connection and try again."}
            </p>
            <p className="text-sm text-text-muted/70 bg-black/10 p-3 rounded-lg font-mono text-left w-full break-words mb-8">
              {error}
            </p>
          </>
        ) : (
          <p className="text-lg text-text-main mb-8">{error}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button
            className="px-6 py-3 rounded-xl bg-primary text-primary-fg font-medium hover:brightness-110 active:scale-95 transition-all shadow-lg"
            onClick={fetchData}
          >
            {t("errors.retry", lang)}
          </button>
          <button
            className="px-6 py-3 rounded-xl border border-primary/30 text-primary font-medium hover:bg-primary/5 active:scale-95 transition-all"
            onClick={repairPlatform}
          >
            {lang === "fr" ? "R\u00e9parer la plateforme" : "Repair Platform"}
          </button>
        </div>
      </div>
    );
  if (!loading && ayahs.length === 0)
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center backdrop-blur-xl bg-bg-card/90 m-4 rounded-3xl shadow-xl border border-white/10 max-w-2xl mx-auto">
        <Icon name="book-open" size={42} className="mb-6 text-primary/60" />
        <p className="text-lg text-text-main font-medium mb-8">
          {t("errors.emptyData", lang)}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button
            className="px-6 py-3 rounded-xl bg-primary text-primary-fg font-medium hover:brightness-110 active:scale-95 transition-all shadow-lg"
            onClick={fetchData}
          >
            {t("errors.retry", lang)}
          </button>
          <button
            className="px-6 py-3 rounded-xl border border-primary/30 text-primary font-medium hover:bg-primary/5 active:scale-95 transition-all"
            onClick={repairPlatform}
          >
            {lang === "fr" ? "R\u00e9parer la plateforme" : "Repair Platform"}
          </button>
        </div>
      </div>
    );

  return (
    <>
      <div className="reading-progress-bar" aria-hidden="true" />

      {/* Memorization exit action, only visible while memMode is active. */}
      {memMode && (
        <button
          onClick={exitMemorization}
          className="fixed bottom-[calc(var(--player-h,72px)+1.25rem)] left-1/2 -translate-x-1/2 z-[350] flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          style={{
            background:
              "linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 70%, #d4a820 30%))",
            boxShadow:
              "0 4px 18px rgba(var(--primary-rgb), 0.45), 0 1px 4px rgba(0,0,0,0.15)",
          }}
          aria-label={
            lang === "fr"
              ? "Quitter le mode mémorisation"
              : lang === "ar"
                ? "الخروج من وضع الحفظ"
                : "Exit memorization mode"
          }
        >
          <Icon name="brain" size={14} />
          <span>
            {lang === "fr"
              ? "Quitter mémorisation"
              : lang === "ar"
                ? "خروج من الحفظ"
                : "Exit memorization"}
          </span>
          <Icon name="xmark" size={14} className="opacity-80" />
        </button>
      )}
      {riwaya === "warsh" && !isWarshFallback ? (
        <WarshNotice
          kind="ok"
          badgeLabel={t("settings.warshUnicodeBadge", lang)}
          body={t("settings.warshUnicodeText", lang)}
        />
      ) : null}
      {riwaya === "warsh" && isWarshFallback ? (
        <WarshNotice
          kind="fallback"
          badgeLabel={t("settings.warshFallbackBadge", lang)}
          body={t("settings.warshFallbackText", lang)}
        />
      ) : null}
      <div
        className={`quran-display quran-display--${riwaya} quran-display--platform${showWordByWord ? " quran-display--word-by-word" : ""}`}
        ref={view.contentRef}
        {...view.touchHandlers}
      >
        {displayMode === "surah" ? (
          <SurahMode
            activeAyah={activeAyah}
            ayahs={ayahs}
            calibration={karaokeCalibration}
            classes={classes}
            currentPlayingAyah={currentPlayingAyah}
            currentSurah={currentSurah}
            getTranslationForAyah={getTranslationForAyah}
            isQCF4={isQCF4}
            lang={lang}
            memMode={memMode}
            mushafLayout={mushafLayout}
            onNavigateToAyah={handleNavigateToAyah}
            onNextSurah={navigation.goNextSurah}
            onPlaySurah={playSurah}
            onPrevSurah={navigation.goPrevSurah}
            onToggleActive={toggleAyah}
            onToggleMemorization={toggleMemorization}
            onToggleMushaf={toggleMushaf}
            onToggleWordByWord={navigation.toggleWordByWordMode}
            pageGroups={pageGroups}
            preparingSurah={preparingSurah}
            readingFontSize={view.readingFontSize}
            riwaya={riwaya}
            showTajwid={showTajwid}
            showTranslation={showTranslation}
            showTransliteration={showTransliteration}
            showWordByWord={showWordByWord}
            showWordTranslation={showWordTranslation}
            theme={state.theme}
          />
        ) : null}
        {displayMode === "page" ? (
          <PageMode
            activeAyah={activeAyah}
            ayahs={ayahs}
            calibration={karaokeCalibration}
            classes={classes}
            currentPage={currentPage}
            currentPlayingAyah={currentPlayingAyah}
            currentSurah={currentSurah}
            fontFamily={fontFamily}
            getMushafLayoutButtonClass={classes.getMushafLayoutButtonClass}
            getTranslationForAyah={getTranslationForAyah}
            isQCF4={isQCF4}
            lang={lang}
            memMode={memMode}
            mushafLayout={mushafLayout}
            onNavigateToAyah={handleNavigateToAyah}
            onNextPage={navigation.goNextPage}
            onPlaySurah={playSurah}
            onPrevPage={navigation.goPrevPage}
            onToggleActive={toggleAyah}
            onToggleMemorization={toggleMemorization}
            onToggleMushaf={toggleMushaf}
            onToggleWordByWord={navigation.toggleWordByWordMode}
            pageGroups={pageGroups}
            pageTopSurah={pageTopSurah}
            preparingSurah={preparingSurah}
            readingFontSize={view.readingFontSize}
            riwaya={riwaya}
            showRiwayaStar={riwaya === "warsh"}
            showTajwid={showTajwid}
            showTranslation={showTranslation}
            showTransliteration={showTransliteration}
            showWordByWord={showWordByWord}
            showWordTranslation={showWordTranslation}
            surahGroups={surahGroups}
            theme={state.theme}
          />
        ) : null}
        {displayMode === "juz" ? (
          <JuzMode
            activeAyah={activeAyah}
            calibration={karaokeCalibration}
            classes={classes}
            currentJuz={currentJuz}
            currentPlayingAyah={currentPlayingAyah}
            getMushafLayoutButtonClass={classes.getMushafLayoutButtonClass}
            getTranslationForAyah={getTranslationForAyah}
            isQCF4={isQCF4}
            lang={lang}
            memMode={memMode}
            mushafLayout={mushafLayout}
            onNavigateToAyah={handleNavigateToAyah}
            onNextJuz={navigation.goNextJuz}
            onPlayJuz={playSurah}
            onPlaySpecificSurah={playSpecificSurah}
            onPrevJuz={navigation.goPrevJuz}
            onToggleActive={toggleAyah}
            onToggleMemorization={toggleMemorization}
            onToggleMushaf={toggleMushaf}
            onToggleWordByWord={navigation.toggleWordByWordMode}
            pageGroups={pageGroups}
            preparingSurah={preparingSurah}
            readingFontSize={view.readingFontSize}
            riwaya={riwaya}
            showRiwayaStar={riwaya === "warsh"}
            showTajwid={showTajwid}
            showTranslation={showTranslation}
            showTransliteration={showTransliteration}
            showWordByWord={showWordByWord}
            showWordTranslation={showWordTranslation}
            surahGroups={surahGroups}
            theme={state.theme}
          />
        ) : null}
        {showScrollTop ? (
          <button
            className="scroll-top-btn fixed bottom-[calc(var(--player-h,72px)+1.5rem)] right-6 w-12 h-12 flex items-center justify-center rounded-full bg-primary text-primary-fg shadow-[0_4px_20px_rgba(var(--primary-rgb),0.5)] z-40 transition-all hover:-translate-y-1 hover:brightness-110 active:scale-95"
            onClick={scrollToTop}
            title={t("nav.scrollTop", lang)}
            aria-label={t("nav.scrollTop", lang)}
          >
            <Icon name="chevron-up" size={20} />
          </button>
        ) : null}
        <VerseCompareTray lang={lang} />
        <Footer
          goSurah={(surah) => {
            set({ displayMode: "surah", showHome: false, showDuas: false });
            dispatch({ type: "NAVIGATE_SURAH", payload: { surah, ayah: 1 } });
          }}
        />
        <FullscreenMushafOverlay
          ayahs={ayahs}
          currentPage={currentPage}
          currentPlayingAyah={currentPlayingAyah}
          currentSurah={currentSurah}
          fullPage={view.fullPage}
          lang={lang}
          onClose={() => view.setFullPage(false)}
          riwaya={riwaya}
        />
      </div>
    </>
  );
}
