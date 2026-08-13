import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { getJuzForAyah } from "../../data/juz";
import { t } from "../../i18n";
import { toAr } from "../../data/surahs";
import CleanPageView from "../Quran/CleanPageView";
import ReadingToolbar from "../Quran/ReadingToolbar";
import AyahActionsModal from "./AyahActionsModal";
import QCVerseByVerseView from "./QCVerseByVerseView";
import ModeNavigation from "./ModeNavigation";
import QuranMushafPage from "./QuranMushafPage";
import ReaderContextCard from "./ReaderContextCard";
import { modePaneShellClass } from "./displayClasses";

function PageMode({
  activeAyah,
  ayahs,
  calibration,
  classes,
  currentPage,
  currentPlayingAyah,
  currentSurah,
  fontFamily,
  getTranslationForAyah,
  isQCF4,
  lang,
  mushafLayout,
  onNextPage,
  onOpenFullscreen,
  onPlaySurah,
  onPrevPage,
  onToggleActive,
  onToggleMushaf,
  pageGroups = [],
  pageTopSurah,
  preparingSurah,
  readingFontSize,
  riwaya,
  showTajwid,
  showTranslation,
  showTransliteration,
  surahGroups,
  theme: _theme,
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
  const contextSecondary = `${t("sidebar.juz", lang)} ${currentJuz || "—"}`;
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
      className={`quran-mode-pane quran-mode-pane--page ${
        canUseFifteenLinePage ? "quran-mode-pane--mushaf-exact" : ""
      } ${mushafLayout === "mushaf" ? "quran-mode-pane--mushaf" : ""} ${modePaneShellClass}`}
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
        className={`page-turn-container ${turnClass}`}
        onDoubleClick={handleMushafDoubleClick}
      >
      {canUseFifteenLinePage ? (
        <>
          <QuranMushafPage
            activeAyah={activeAyah}
            ayahs={ayahs}
            currentPage={currentPage}
            currentPlayingAyah={currentPlayingAyah}
            fontFamily={fontFamily}
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
            translations={activeAyahData ? getTranslationForAyah?.(activeAyahData) : []}
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
              showTransliteration={showTransliteration}
            />
          ))}
          <AyahActionsModal
            activeAyah={activeAyah}
            onClose={() => onToggleActive(null)}
            surah={activeAyahData?.surah?.number || currentSurah}
            ayahData={activeAyahData}
            translations={activeAyahData ? getTranslationForAyah?.(activeAyahData) : []}
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
          showTransliteration={showTransliteration}
          calibration={calibration}
          riwaya={riwaya}
          fontSize={readingFontSize}
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
