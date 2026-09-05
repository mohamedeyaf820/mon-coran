import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getJuzForAyah } from "../../data/juz";
import { t } from "../../i18n";
import { getSurah, toAr } from "../../data/surahs";
import CleanPageView from "../Quran/CleanPageView";
import ReadingToolbar from "../Quran/ReadingToolbar";
import AyahActionsModal from "./AyahActionsModal";
import QCVerseByVerseView from "./QCVerseByVerseView";
import usePageStream from "./usePageStream";
import { useApp } from "../../context/AppContext";
import ReaderContextCard from "./ReaderContextCard";
import { modePaneShellClass } from "./displayClasses";

function PageMode({
  activeAyah,
  ayahs,
  calibration,
  classes: _classes,
  currentPage,
  currentPlayingAyah,
  currentSurah,
  fontFamily: _fontFamily,
  getTranslationForAyah,
  isQCF4,
  lang,
  mushafLayout,
  onNextPage,
  onOpenFullscreen,
  onPlayAyah,
  onPlaySurah,
  onPrevPage,
  onToggleActive,
  onToggleMushaf,
  pageGroups: _pageGroups = [],
  pageTopSurah,
  preparingSurah,
  readingFontSize,
  riwaya,
  showTajwid,
  showTranslation,
  showTransliteration,
  surahGroups: _surahGroups,
  theme: _theme,
}) {
  const prevPageRef = useRef(currentPage);
  const [turnClass, setTurnClass] = useState("");
  const { dispatch, state } = useApp();
  const pageNavigationSource = state.pageNavigationSource;

  useEffect(() => {
    if (prevPageRef.current === currentPage) return;
    const direction = currentPage > prevPageRef.current ? "next" : "prev";
    prevPageRef.current = currentPage;
    // Continuous reading changes the page from the scroll position: no
    // page-turn animation there, it would move the text under the reader.
    if (pageNavigationSource === "scroll") return;
    setTurnClass(`page-turn--${direction}`);
    const id = setTimeout(() => setTurnClass(""), 280);
    return () => clearTimeout(id);
  }, [currentPage]);

  const activeAyahData = ayahs.find(
    (ayah) => ayah.number === activeAyah || ayah.numberInSurah === activeAyah,
  );
  const currentJuz =
    ayahs[0]?.juz ||
    getJuzForAyah(ayahs[0]?.surah?.number, ayahs[0]?.numberInSurah);
  const onVisiblePage = useCallback(
    (page) => {
      if (page !== currentPage) dispatch({ type: "NAVIGATE_PAGE", payload: { page, source: "scroll" } });
    },
    [currentPage, dispatch],
  );
  // Continuous reading: pages stream in as the reader scrolls, in both
  // directions, instead of a page-turn control.
  const stream = usePageStream({
    ayahs,
    currentJuz,
    currentPage,
    currentSurah,
    fallbackGetTranslation: getTranslationForAyah,
    lang,
    onVisiblePage,
    riwaya,
    showTranslation,
    translationLangs: state.translationLangs,
    warshStrictMode: state.warshStrictMode,
  });
  const streamPages = useMemo(
    () =>
      stream.pages.map(({ page, ayahs: pageAyahs }) => {
        const groups = [];
        let group = null;
        pageAyahs.forEach((ayah) => {
          const surahNumber = ayah.surah?.number || currentSurah;
          if (!group || group.surah !== surahNumber) {
            group = { surah: surahNumber, ayahs: [] };
            groups.push(group);
          }
          group.ayahs.push(ayah);
        });
        return { page, ayahs: pageAyahs, surahGroups: groups };
      }),
    [currentSurah, stream.pages],
  );
  const pageLabel = lang === "ar" ? toAr(currentPage) : currentPage;
  const pageWord = lang === "fr" ? "Page" : lang === "ar" ? "صفحة" : "Page";
  const contextSecondary = `${t("sidebar.juz", lang)} ${currentJuz || "—"}`;

  const touchStartX = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) return;
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 55) return;
    const isRTL = document.documentElement.dir === 'rtl';
    const goNext = isRTL ? delta > 0 : delta < 0;
    if (goNext) {
      if (currentPage < 604) onNextPage();
    } else {
      if (currentPage > 1) onPrevPage();
    }
  }, [currentPage, onNextPage, onPrevPage]);

  const handleMushafDoubleClick = useCallback(
    (event) => {
      if (mushafLayout !== "mushaf") return;
      if (!event.target.closest(".mushaf-page-wrapper")) return;
      if (event.target.closest("button, a, input, select, textarea, [role='button']")) return;
      onOpenFullscreen?.();
    },
    [mushafLayout, onOpenFullscreen],
  );

  return (
    <div
      className={`quran-mode-pane quran-mode-pane--page ${mushafLayout === "mushaf" ? "quran-mode-pane--mushaf" : ""} ${modePaneShellClass}`}
      role="region"
      aria-label={t("settings.pageMode", lang)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <section
        className="reader-control-deck"
        aria-label={lang === "fr" ? "Commandes de lecture" : lang === "ar" ? "أدوات القراءة" : "Reading controls"}
      >
        <ReaderContextCard
          kind="page"
          label={pageWord}
          value={pageLabel}
          numericValue={currentPage}
          total={604}
          secondary={contextSecondary}
          riwaya={riwaya}
          lang={lang}
        />
        <ReadingToolbar
          onPlay={onPlaySurah}
          playLabel={lang === "fr" ? "Écouter la page" : "Listen page"}
          preparingSurah={preparingSurah}
          surahNum={pageTopSurah || currentSurah}
          onToggleMushaf={onToggleMushaf}
          onOpenFullscreen={onOpenFullscreen}
        />
      </section>

      <div
        ref={stream.rootRef}
        className={`page-turn-container page-stream ${turnClass}`}
        onDoubleClick={handleMushafDoubleClick}
      >
        <div ref={stream.topRef} className="page-stream__sentinel" aria-hidden="true" />
        {streamPages.map(({ page, ayahs: pageAyahs, surahGroups: pageSurahGroups }) => (
          <section
            key={`stream-page-${page}`}
            className="page-stream__page"
            data-stream-page={page}
            aria-label={`${pageWord} ${lang === "ar" ? toAr(page) : page}`}
          >
            {mushafLayout === "mushaf" ? (
              <CleanPageView
                ayahs={pageAyahs}
                lang={lang}
                fontSize={readingFontSize}
                isQCF4={isQCF4}
                showTajwid={showTajwid}
                currentPlayingAyah={currentPlayingAyah}
                surahNum={pageAyahs[0]?.surah?.number || pageAyahs[0]?.surah || currentSurah}
                calibration={calibration}
                riwaya={riwaya}
                showTranslation={showTranslation}
                getTranslation={stream.getTranslationForAyah}
                onAyahClick={onToggleActive}
                onPlayAyah={onPlayAyah}
                activeAyah={activeAyah}
                getAyahToggleId={(ayah) => ayah.number}
                showSurahHeader={true}
                showTransliteration={showTransliteration}
              />
            ) : (
              <QCVerseByVerseView
                surahGroups={pageSurahGroups}
                currentPlayingAyah={currentPlayingAyah}
                activeAyah={activeAyah}
                lang={lang}
                getTranslationForAyah={stream.getTranslationForAyah}
                showTajwid={showTajwid}
                showTranslation={showTranslation}
                showTransliteration={showTransliteration}
                calibration={calibration}
                riwaya={riwaya}
                fontSize={readingFontSize}
                onToggleActive={onToggleActive}
                displayMode="page"
                showPageSeparators
              />
            )}
          </section>
        ))}
        <div ref={stream.bottomRef} className="page-stream__sentinel" aria-hidden="true" />
        {stream.pausedAtSurah ? (
          <div className="page-stream__end" role="status">
            <span>
              {lang === "ar"
                ? `نهاية سورة ${getSurah(stream.endedSurah)?.ar || ""}`
                : lang === "en"
                  ? `End of ${getSurah(stream.endedSurah)?.en || "the surah"}`
                  : `Fin de la sourate ${getSurah(stream.endedSurah)?.fr || ""}`}
            </span>
            {stream.endedSurah < 114 ? (
              <button type="button" className="page-stream__end-action" onClick={stream.continueStream}>
                {lang === "ar"
                  ? `متابعة إلى ${getSurah(stream.endedSurah + 1)?.ar || ""}`
                  : lang === "en"
                    ? `Continue to ${getSurah(stream.endedSurah + 1)?.en || ""}`
                    : `Continuer vers ${getSurah(stream.endedSurah + 1)?.fr || ""}`}
              </button>
            ) : null}
          </div>
        ) : stream.hasNext ? (
          <p className="page-stream__status" aria-live="polite">
            {lang === "ar" ? "الصفحة التالية تُحمَّل أثناء التمرير…" : lang === "en" ? "The next page loads as you scroll…" : "La page suivante se charge au fil du défilement…"}
          </p>
        ) : null}
        {mushafLayout === "mushaf" ? (
          <AyahActionsModal
            activeAyah={activeAyah}
            onClose={() => onToggleActive(null)}
            surah={activeAyahData?.surah?.number || currentSurah}
            ayahData={activeAyahData}
            translations={activeAyahData ? stream.getTranslationForAyah(activeAyahData) : []}
          />
        ) : null}
      </div>
    </div>
  );
}

export default memo(PageMode);
