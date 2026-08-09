import React, { memo } from "react";
import { t } from "../../i18n";
import { getSurah } from "../../data/surahs";
import SurahReaderHeader from "../Quran/SurahReaderHeader";
import ReadingProgressBar from "../Quran/ReadingProgressBar";
import AyahActionsModal from "./AyahActionsModal";
import QCVerseByVerseView from "./QCVerseByVerseView";
import ModeNavigation from "./ModeNavigation";
import VirtualizedMushafPages from "./VirtualizedMushafPages";
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
  mushafLayout,
  onNextSurah,
  onPlaySurah,
  onPrevSurah,
  onToggleActive,
  onToggleMushaf,
  pageGroups = [],
  preparingSurah,
  readingFontSize,
  riwaya,
  showTajwid,
  showTranslation,
  showTransliteration,
  theme: _theme,
}) {
  const surahMeta = getSurah(currentSurah);
  const activeAyahData = ayahs.find(
    (ayah) => ayah.numberInSurah === activeAyah,
  );

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
      <div className="qc-surah-header-wrap animate-in">
        <SurahReaderHeader
          surahNum={currentSurah}
          onPlaySurah={onPlaySurah}
          preparingSurah={preparingSurah}
          onToggleMushaf={onToggleMushaf}
        />
      </div>

      {mushafLayout === "mushaf" ? (
        <>
          <VirtualizedMushafPages
            activeAyah={activeAyah}
            calibration={calibration}
            currentAyah={currentAyah}
            currentPlayingAyah={currentPlayingAyah}
            fallbackSurah={currentSurah}
            getTranslation={getTranslationForAyah}
            isQCF4={isQCF4}
            lang={lang}
            mode="surah"
            onAyahClick={onToggleActive}
            pageGroups={pageGroups}
            readingFontSize={readingFontSize}
            riwaya={riwaya}
            showTajwid={showTajwid}
            showTranslation={showTranslation}
            showTransliteration={showTransliteration}
          />
          <AyahActionsModal
            activeAyah={activeAyah}
            onClose={() => onToggleActive(null)}
            surah={currentSurah}
            ayahData={activeAyahData}
            translations={activeAyahData ? getTranslationForAyah?.(activeAyahData) : []}
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
          showTransliteration={showTransliteration}
          calibration={calibration}
          riwaya={riwaya}
          fontSize={readingFontSize}
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
