import React, { memo } from "react";
import { t } from "../../i18n";
import { getSurah } from "../../data/surahs";
import SurahReaderHeader from "../Quran/SurahReaderHeader";
import ReadingProgressBar from "../Quran/ReadingProgressBar";
import CleanPageView from "../Quran/CleanPageView";
import AyahActionsModal from "./AyahActionsModal";
import QCVerseByVerseView from "./QCVerseByVerseView";
import ModeNavigation from "./ModeNavigation";
import { modePaneShellClass } from "./displayClasses";

function SurahMode({
  activeAyah,
  ayahs,
  calibration,
  classes,
  currentAyah,
  currentPlayingAyah,
  currentSurah,
  getTranslationForAyah,
  isQCF4,
  lang,
  memMode,
  mushafLayout,
  onNavigateToAyah,
  onNextSurah,
  onPlaySurah,
  onPrevSurah,
  onToggleActive,
  onToggleMemorization,
  onToggleMushaf,
  onToggleWordByWord,
  pageGroups = [],
  preparingSurah,
  readingFontSize,
  riwaya,
  showTajwid,
  showTranslation,
  showTransliteration,
  showWordByWord,
  showWordTranslation,
  theme,
}) {
  const surahMeta = getSurah(currentSurah);

  return (
    <div
      role="region"
      aria-label={t("settings.surahMode", lang)}
      className={`quran-mode-pane quran-mode-pane--surah ${
        mushafLayout === "mushaf" ? "quran-mode-pane--mushaf" : ""
      } ${modePaneShellClass}`}
    >
      <ReadingProgressBar />

      {/* Unified surah identity + controls header */}
      {!(isQCF4 && mushafLayout === "mushaf") && (
        <div className="qc-surah-header-wrap animate-in">
          <SurahReaderHeader
            surahNum={currentSurah}
            currentAyah={activeAyah || 1}
            onPlaySurah={onPlaySurah}
            preparingSurah={preparingSurah}
            onNavigateToAyah={onNavigateToAyah}
            onToggleMushaf={onToggleMushaf}
            onToggleMemorization={onToggleMemorization}
            onToggleWordByWord={onToggleWordByWord}
          />
        </div>
      )}

      {mushafLayout === "mushaf" ? (
        <>
          {pageGroups.map((group, index) => (
            <CleanPageView
              key={`cpv-surah-pg-${group.page}-${index}`}
              ayahs={group.ayahs}
              lang={lang}
              fontSize={readingFontSize}
              isQCF4={isQCF4}
              showTajwid={showTajwid}
              currentPlayingAyah={currentPlayingAyah}
              surahNum={currentSurah}
              calibration={calibration}
              riwaya={riwaya}
              showTranslation={showTranslation}
              getTranslation={getTranslationForAyah}
              onAyahClick={onToggleActive}
              activeAyah={activeAyah}
              getAyahToggleId={(ayah) => ayah.numberInSurah}
              showSurahHeader={true}
              showWordByWord={showWordByWord}
              showWordTranslation={showWordTranslation}
              showTransliteration={showTransliteration}
            />
          ))}
          <AyahActionsModal
            activeAyah={activeAyah}
            onClose={() => onToggleActive(null)}
            surah={currentSurah}
            ayahData={ayahs.find((ayah) => ayah.numberInSurah === activeAyah)}
            quietBackdrop
          />
        </>
      ) : (
        <QCVerseByVerseView
          ayahs={ayahs}
          initialTargetAyah={currentAyah}
          currentPlayingAyah={currentPlayingAyah}
          activeAyah={activeAyah}
          lang={lang}
          getTranslationForAyah={getTranslationForAyah}
          showPageSeparators
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
          displayMode="surah"
          surahMeta={surahMeta}
        />
      )}

      <ModeNavigation
        className={classes.quranNavClass}
        buttonClassName={classes.quranNavButtonClass}
        previousLabel={t("quran.prevSurah", lang)}
        nextLabel={t("quran.nextSurah", lang)}
        previousDisabled={currentSurah <= 1}
        nextDisabled={currentSurah >= 114}
        onPrevious={onPrevSurah}
        onNext={onNextSurah}
        centerContent={
          surahMeta ? (
            <div className="mode-nav-current">
              <strong>
                {lang === "fr" ? surahMeta.fr || surahMeta.en : surahMeta.en}
              </strong>
              <span>
                {surahMeta.ayahs} {t("quran.ayahs", lang)}
              </span>
            </div>
          ) : null
        }
        lang={lang}
      />
    </div>
  );
}

export default memo(SurahMode);
