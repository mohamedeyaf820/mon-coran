import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { getJuzForAyah } from "../../data/juz";
import { t } from "../../i18n";
import { toAr } from "../../data/surahs";
import CleanPageView from "../Quran/CleanPageView";
import ReadingToolbar from "../Quran/ReadingToolbar";
import ReadingProgressBar from "../Quran/ReadingProgressBar";
import AyahActionsModal from "./AyahActionsModal";
import QCVerseByVerseView from "./QCVerseByVerseView";
import ModeNavigation from "./ModeNavigation";
import QuranMushafPage from "./QuranMushafPage";
import { modePaneShellClass } from "./displayClasses";

function PageMode({
  activeAyah,
  ayahs,
  calibration,
  classes,
  currentPage,
  currentPlayingAyah,
  currentSurah,
  getTranslationForAyah,
  isQCF4,
  lang,
  memMode,
  mushafLayout,
  onNavigateToAyah,
  onNextPage,
  onPlaySurah,
  onPrevPage,
  onToggleActive,
  onToggleMemorization,
  onToggleMushaf,
  onToggleWordByWord,
  pageGroups = [],
  pageTopSurah,
  preparingSurah,
  readingFontSize,
  riwaya,
  showTajwid,
  showTranslation,
  showTransliteration,
  showWordByWord,
  showWordTranslation,
  surahGroups,
  theme,
}) {
  const prevPageRef = useRef(currentPage);
  const [turnClass, setTurnClass] = useState("");

  useEffect(() => {
    if (prevPageRef.current === currentPage) return;
    const direction = currentPage > prevPageRef.current ? "next" : "prev";
    prevPageRef.current = currentPage;
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
  const pageLabel = lang === "ar" ? toAr(currentPage) : currentPage;
  const pageWord = lang === "fr" ? "Page" : lang === "ar" ? "صفحة" : "Page";
  const contextLabel = `${pageWord} ${pageLabel} / 604 · ${t("sidebar.juz", lang)} ${
    currentJuz || ""
  } · ${riwaya.toUpperCase()}`;
  // Disable exact 15-line QCF coordinate rendering in favor of clean normal Arabic text (Unicode)
  const canUseFifteenLinePage = false;

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

  return (
    <div
      className={`quran-mode-pane quran-mode-pane--page ${
        canUseFifteenLinePage ? "quran-mode-pane--mushaf-exact" : ""
      } ${mushafLayout === "mushaf" ? "quran-mode-pane--mushaf" : ""} ${modePaneShellClass}`}
      role="region"
      aria-label={t("settings.pageMode", lang)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <ReadingProgressBar />
      <ReadingToolbar
        contextLabel={contextLabel}
        onPlay={onPlaySurah}
        playLabel={lang === "fr" ? "Écouter la page" : "Listen page"}
        preparingSurah={preparingSurah}
        surahNum={pageTopSurah || currentSurah}
        currentAyah={activeAyah || 1}
        currentPage={currentPage}
        onNavigateToAyah={onNavigateToAyah}
        onToggleMushaf={onToggleMushaf}
        onToggleMemorization={onToggleMemorization}
        onToggleWordByWord={onToggleWordByWord}
      />

      <div className={`page-turn-container ${turnClass}`}>
      {canUseFifteenLinePage ? (
        <>
          <QuranMushafPage
            activeAyah={activeAyah}
            ayahs={ayahs}
            currentPage={currentPage}
            currentPlayingAyah={currentPlayingAyah}
            lang={lang}
            onToggleActive={onToggleActive}
            riwaya={riwaya}
            showTajwid={showTajwid}
          />
          <AyahActionsModal
            activeAyah={activeAyah}
            onClose={() => onToggleActive(null)}
            surah={activeAyahData?.surah?.number || currentSurah}
            ayahData={activeAyahData}
          />
        </>
      ) : mushafLayout === "mushaf" ? (
        <>
          {pageGroups.map((group, index) => (
            <CleanPageView
              key={`cpv-pg-pg-${group.page}-${index}`}
              ayahs={group.ayahs}
              lang={lang}
              fontSize={readingFontSize}
              isQCF4={isQCF4}
              showTajwid={showTajwid}
              currentPlayingAyah={currentPlayingAyah}
              surahNum={group.ayahs[0]?.surah?.number || group.ayahs[0]?.surah || currentSurah}
              calibration={calibration}
              riwaya={riwaya}
              showTranslation={showTranslation}
              getTranslation={getTranslationForAyah}
              onAyahClick={onToggleActive}
              activeAyah={activeAyah}
              getAyahToggleId={(ayah) => ayah.number}
              showSurahHeader={true}
              showWordByWord={showWordByWord}
              showWordTranslation={showWordTranslation}
              showTransliteration={showTransliteration}
            />
          ))}
          <AyahActionsModal
            activeAyah={activeAyah}
            onClose={() => onToggleActive(null)}
            surah={activeAyahData?.surah?.number || currentSurah}
            ayahData={activeAyahData}
          />
        </>
      ) : (
        <QCVerseByVerseView
          surahGroups={surahGroups}
          currentPlayingAyah={currentPlayingAyah}
          activeAyah={activeAyah}
          lang={lang}
          getTranslationForAyah={getTranslationForAyah}
          showTajwid={showTajwid}
          showTranslation={showTranslation}
          showWordByWord={showWordByWord}
          showTransliteration={showTransliteration}
          showWordTranslation={showWordTranslation}
          calibration={calibration}
          riwaya={riwaya}
          fontSize={readingFontSize}
          memMode={memMode}
          onToggleActive={onToggleActive}
          displayMode="page"
          showPageSeparators
        />
      )}
      </div>

      <ModeNavigation
        className={classes.quranNavClass}
        buttonClassName={classes.quranNavButtonClass}
        previousLabel={t("quran.prevPage", lang)}
        nextLabel={t("quran.nextPage", lang)}
        previousDisabled={currentPage <= 1}
        nextDisabled={currentPage >= 604}
        onPrevious={onPrevPage}
        onNext={onNextPage}
        centerContent={
          <span className={classes.pageIndicatorClass}>
            {pageLabel} / 604
          </span>
        }
        lang={lang}
      />
    </div>
  );
}

export default memo(PageMode);
