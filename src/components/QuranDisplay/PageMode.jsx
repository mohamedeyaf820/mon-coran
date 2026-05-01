import React from "react";
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

export default function PageMode({
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
  onNextPage,
  onPlaySurah,
  onPrevPage,
  onToggleActive,
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
  const activeAyahData = ayahs.find(
    (ayah) => ayah.number === activeAyah || ayah.numberInSurah === activeAyah,
  );
  const currentJuz =
    ayahs[0]?.juz ||
    getJuzForAyah(ayahs[0]?.surah?.number, ayahs[0]?.numberInSurah);
  const pageLabel = lang === "ar" ? toAr(currentPage) : currentPage;
  const contextLabel = `Page ${pageLabel} / 604 \u00b7 ${t("sidebar.juz", lang)} ${
    currentJuz || ""
  } \u00b7 ${riwaya.toUpperCase()}`;
  const canUseFifteenLinePage = ayahs.some((ayah) => {
    const words = Array.isArray(ayah.words) ? ayah.words : [];
    const supportWords = Array.isArray(ayah.hafsSupport?.words)
      ? ayah.hafsSupport.words
      : [];
    return [...words, ...supportWords].some(
      (word) => word.lineNumber || word.lineV2 || word.lineV1,
    );
  });

  return (
    <div
      className={`quran-mode-pane quran-mode-pane--page ${
        canUseFifteenLinePage ? "quran-mode-pane--mushaf-exact" : ""
      } ${modePaneShellClass}`}
      role="region"
      aria-label={t("settings.pageMode", lang)}
    >
      <ReadingProgressBar />
      <ReadingToolbar
        contextLabel={contextLabel}
        onPlay={onPlaySurah}
        playLabel={lang === "fr" ? "Ecouter la page" : "Listen page"}
        preparingSurah={preparingSurah}
        surahNum={pageTopSurah || currentSurah}
      />

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
          {surahGroups.map((group, index) => (
            <CleanPageView
              key={`cpv-pg-${group.surah}-${index}`}
              ayahs={group.ayahs}
              lang={lang}
              fontSize={readingFontSize}
              isQCF4={isQCF4}
              showTajwid={showTajwid}
              currentPlayingAyah={currentPlayingAyah}
              surahNum={group.surah}
              calibration={calibration}
              riwaya={riwaya}
              showTranslation={showTranslation}
              getTranslation={getTranslationForAyah}
              onAyahClick={onToggleActive}
              activeAyah={activeAyah}
              getAyahToggleId={(ayah) => ayah.number}
              showSurahHeader={false}
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
