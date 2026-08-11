import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import "../styles/readerStyles.js";
import {
  shallowEqual,
  useAppActions,
  useAppSelector,
} from "../context/AppContext";
import { t } from "../i18n";
import { ensureReciterForRiwaya } from "../data/reciters";
import { getKaraokeCalibration } from "../utils/karaokeUtils";
import Footer from "./Footer";
import SurahMode from "./QuranDisplay/SurahMode";
import WarshNotice from "./QuranDisplay/WarshNotice";
import ReaderSourceStatus from "./QuranDisplay/ReaderSourceStatus";
import { createDisplayClasses } from "./QuranDisplay/displayClasses";
import useQuranDisplayAudio from "./QuranDisplay/useQuranDisplayAudio";
import useQuranDisplayData, {
  preloadQuranDisplayData,
} from "./QuranDisplay/useQuranDisplayData";
import useQuranDisplayGroups from "./QuranDisplay/useQuranDisplayGroups";
import useQuranDisplayNavigation from "./QuranDisplay/useQuranDisplayNavigation";
import useQuranDisplayPrefetch from "./QuranDisplay/useQuranDisplayPrefetch";
import useQuranDisplayScroll from "./QuranDisplay/useQuranDisplayScroll";
import useQuranDisplayView from "./QuranDisplay/useQuranDisplayView";
import useQuranTranslations from "./QuranDisplay/useQuranTranslations";
import AyahSkeleton from "./Quran/AyahSkeleton";
import TajweedLegend from "./Quran/TajweedLegend";
import { Icon } from "./ui/icon";

const FullscreenMushafOverlay = lazy(
  () => import("./QuranDisplay/FullscreenMushafOverlay"),
);
const JuzMode = lazy(() => import("./QuranDisplay/JuzMode"));
const PageMode = lazy(() => import("./QuranDisplay/PageMode"));

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
      mushafLayout: current.mushafLayout,
      quranFontSize: current.quranFontSize,
      quranTranslationFontSize: current.quranTranslationFontSize,
      reciter: current.reciter,
      riwaya: current.riwaya,
      showHome: current.showHome,
      showTajwid: current.showTajwid,
      showTranslation: current.showTranslation,
      showTransliteration: current.showTransliteration,
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
    mushafLayout,
    quranFontSize,
    quranTranslationFontSize,
    reciter,
    riwaya,
    showTajwid,
    showTranslation,
    showTransliteration,
    syncOffsetsMs,
    translationLangs,
    warshStrictMode,
  } = state;

  const syncKey = `${riwaya}:${ensureReciterForRiwaya(reciter, riwaya)}`;
  const {
    ayahs,
    dataTransitioning,
    dataSource,
    error,
    fetchData,
    isWarshFallback,
    setError,
  } =
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
      mushafLayout,
      showTransliteration,
      warshStrictMode,
    });
  const { getTranslationForAyah, translationState } = useQuranTranslations({
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
      isPlaying,
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
  const prepareReadingTarget = useCallback(
    (mode, value) =>
      preloadQuranDisplayData({
        currentJuz: mode === "juz" ? value : currentJuz,
        currentPage: mode === "page" ? value : currentPage,
        currentSurah: mode === "surah" ? value : currentSurah,
        displayMode: mode,
        lang,
        riwaya,
        warshStrictMode,
      }).catch(() => null),
    [
      currentJuz,
      currentPage,
      currentSurah,
      lang,
      riwaya,
      warshStrictMode,
    ],
  );

  const openImmersiveMushaf = useCallback(async () => {
    const currentAyahData = ayahs.find(
      (ayah) => Number(ayah.numberInSurah) === Number(currentAyah),
    );
    const targetPage = Number(
      displayMode === "page"
        ? currentPage
        : currentAyahData?.page || pageGroups[0]?.page || currentPage,
    );

    if (displayMode !== "page") {
      await prepareReadingTarget("page", targetPage);
      dispatch({ type: "NAVIGATE_PAGE", payload: { page: targetPage } });
    }
    view.setFullPage(true);
  }, [
    ayahs,
    currentAyah,
    currentPage,
    dispatch,
    displayMode,
    pageGroups,
    prepareReadingTarget,
    view,
  ]);

  const navigation = useQuranDisplayNavigation({
    currentJuz,
    currentPage,
    currentSurah,
    dispatch,
    prepareTarget: prepareReadingTarget,
  });

  useQuranDisplayPrefetch({
    currentJuz,
    currentPage,
    currentSurah,
    displayMode,
    isPlaying,
    lang,
    loading,
    riwaya,
    warshStrictMode,
  });

  useEffect(() => {
    setActiveAyah(null);
  }, [currentJuz, currentPage, currentSurah, displayMode, riwaya]);

  const toggleAyah = useCallback(
    (id) => setActiveAyah((current) => (current === id ? null : id)),
    [],
  );
  const toggleMushaf = useCallback(() => {
    set({
      mushafLayout: mushafLayout === "mushaf" ? "list" : "mushaf",
      showTajwid: true,
    });
  }, [mushafLayout, set]);
  const openHome = useCallback(() => {
    set({
      focusReading: false,
      showDuas: false,
      showHome: true,
    });
  }, [set]);

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

  const isNetworkFailure =
    ayahs.length === 0 &&
    (error === "reader-load-failed" ||
      /Failed to fetch|NetworkError|timeout|AbortError/i.test(error || ""));
  const readerBusy =
    dataTransitioning ||
    (loading && ayahs.length === 0) ||
    (fontLoading && ayahs.length === 0);

  if (error)
    return (
      <div className="reader-data-state mx-auto my-4 flex min-h-[18rem] max-w-xl flex-col items-center justify-center rounded-2xl border border-border bg-bg-card p-6 text-center shadow-sm sm:min-h-[20rem] sm:p-8">
        <Icon
          name={isNetworkFailure ? "wifi-slash" : "circle-exclamation"}
          size={30}
          className="mb-4 text-primary"
        />
        {isNetworkFailure ? (
          <>
            <p className="text-lg text-text-main font-medium mb-3">
              {lang === "fr"
                ? "Impossible de charger les données : vérifiez votre connexion internet et réessayez."
                : lang === "ar"
                  ? "تعذر تحميل البيانات. تحقق من اتصالك بالإنترنت ثم أعد المحاولة."
                  : "Unable to load data: please check your internet connection and try again."}
            </p>
          </>
        ) : (
          <p className="text-lg text-text-main mb-8">{error}</p>
        )}
        <div className="reader-data-state__actions flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <button
            className="px-6 py-3 rounded-xl bg-primary text-primary-fg font-medium hover:brightness-110 active:scale-95 transition-all shadow-lg"
            onClick={fetchData}
          >
            {t("errors.retry", lang)}
          </button>
          <button
            className="px-6 py-3 rounded-xl border border-border bg-bg-secondary text-text-primary font-medium hover:bg-bg-tertiary active:scale-95 transition-all"
            onClick={openHome}
          >
            {lang === "fr"
              ? "Retour \u00e0 l\u2019accueil"
              : lang === "ar"
                ? "\u0627\u0644\u0639\u0648\u062f\u0629 \u0644\u0644\u0631\u0626\u064a\u0633\u064a\u0629"
                : "Back to home"}
          </button>
        </div>
        <p className="reader-data-state__source">
          {lang === "fr" ? "Source tentée" : lang === "ar" ? "المصدر المطلوب" : "Attempted source"}: {dataSource?.label || (riwaya === "warsh" ? "Warsh dataset" : "Quran.com / AlQuran Cloud")}
        </p>
      </div>
    );
  if (!loading && ayahs.length === 0)
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center backdrop-blur-xl bg-bg-card/90 m-4 rounded-3xl shadow-xl border border-white/10 max-w-2xl mx-auto">
        <Icon name="book-open" size={30} className="mb-5 text-primary/70" />
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
            className="px-6 py-3 rounded-xl border border-border bg-bg-secondary text-text-primary font-medium hover:bg-bg-tertiary active:scale-95 transition-all"
            onClick={openHome}
          >
            {lang === "fr"
              ? "Retour \u00e0 l\u2019accueil"
              : lang === "ar"
                ? "\u0627\u0644\u0639\u0648\u062f\u0629 \u0644\u0644\u0631\u0626\u064a\u0633\u064a\u0629"
                : "Back to home"}
          </button>
        </div>
      </div>
    );

  return (
    <>
      <div className="reading-progress-bar" aria-hidden="true" />

      {riwaya === "warsh" && isWarshFallback ? (
        <WarshNotice
          badgeLabel={t("settings.warshFallbackBadge", lang)}
          body={t("settings.warshFallbackText", lang)}
        />
      ) : null}
      <ReaderSourceStatus
        dataSource={dataSource}
        lang={lang}
        translationState={showTranslation ? translationState : "idle"}
      />
      <div
        className={`quran-display quran-display--${riwaya} quran-display--platform`}
        data-quran-font={fontFamily}
        ref={view.contentRef}
        aria-busy={readerBusy}
        {...view.touchHandlers}
      >
        {showTajwid ? <TajweedLegend lang={lang} riwaya={riwaya} /> : null}
        {displayMode === "surah" ? (
          <SurahMode
            activeAyah={activeAyah}
            ayahs={ayahs}
            calibration={karaokeCalibration}
            classes={classes}
            currentAyah={currentAyah}
            currentPlayingAyah={currentPlayingAyah}
            currentSurah={currentSurah}
            getTranslationForAyah={getTranslationForAyah}
            isQCF4={isQCF4}
            lang={lang}
            mushafLayout={mushafLayout}
            onNextSurah={navigation.goNextSurah}
            onPlaySurah={playSurah}
            onPrevSurah={navigation.goPrevSurah}
            onOpenFullscreen={openImmersiveMushaf}
            onToggleActive={toggleAyah}
            onToggleMushaf={toggleMushaf}
            pageGroups={pageGroups}
            preparingSurah={preparingSurah}
            readingFontSize={view.readingFontSize}
            riwaya={riwaya}
            showTajwid={showTajwid}
            showTranslation={showTranslation}
            showTransliteration={showTransliteration}
            theme={state.theme}
          />
        ) : null}
        {displayMode === "page" ? (
          <Suspense
            fallback={
              <AyahSkeleton
                count={3}
                lang={lang}
                showTranslation={showTranslation}
              />
            }
          >
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
              mushafLayout={mushafLayout}
              onNextPage={navigation.goNextPage}
              onOpenFullscreen={openImmersiveMushaf}
              onPlaySurah={playSurah}
              onPrevPage={navigation.goPrevPage}
              onToggleActive={toggleAyah}
              onToggleMushaf={toggleMushaf}
              pageGroups={pageGroups}
              pageTopSurah={pageTopSurah}
              preparingSurah={preparingSurah}
              readingFontSize={view.readingFontSize}
              riwaya={riwaya}
              showTajwid={showTajwid}
              showTranslation={showTranslation}
              showTransliteration={showTransliteration}
              surahGroups={surahGroups}
              theme={state.theme}
            />
          </Suspense>
        ) : null}
        {displayMode === "juz" ? (
          <Suspense
            fallback={
              <AyahSkeleton
                count={3}
                lang={lang}
                showTranslation={showTranslation}
              />
            }
          >
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
              mushafLayout={mushafLayout}
              onNextJuz={navigation.goNextJuz}
              onPlayJuz={playSurah}
              onOpenFullscreen={openImmersiveMushaf}
              onPlaySpecificSurah={playSpecificSurah}
              onPrevJuz={navigation.goPrevJuz}
              onToggleActive={toggleAyah}
              onToggleMushaf={toggleMushaf}
              pageGroups={pageGroups}
              preparingSurah={preparingSurah}
              readingFontSize={view.readingFontSize}
              riwaya={riwaya}
              showTajwid={showTajwid}
              showTranslation={showTranslation}
              showTransliteration={showTransliteration}
              surahGroups={surahGroups}
              theme={state.theme}
            />
          </Suspense>
        ) : null}
        {readerBusy && mushafLayout === "mushaf" ? (
          <div className="reader-loading-content">
            <AyahSkeleton
              count={5}
              lang={lang}
              showTranslation={showTranslation}
            />
          </div>
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
        <Footer
          goSurah={(surah) => {
            set({ displayMode: "surah", showHome: false, showDuas: false });
            dispatch({ type: "NAVIGATE_SURAH", payload: { surah, ayah: 1 } });
          }}
        />
        {view.fullPage ? (
          <Suspense fallback={null}>
            <FullscreenMushafOverlay
              ayahs={ayahs}
              currentPage={currentPage}
              currentPlayingAyah={currentPlayingAyah}
              currentSurah={currentSurah}
              fullPage
              lang={lang}
              onClose={() => view.setFullPage(false)}
              onNextPage={navigation.goNextPage}
              onPrevPage={navigation.goPrevPage}
              riwaya={riwaya}
            />
          </Suspense>
        ) : null}
      </div>
    </>
  );
}
