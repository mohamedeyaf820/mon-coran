import React from "react";
import { t } from "../../i18n";
import { getSurah } from "../../data/surahs";
import ReadingToolbar from "../Quran/ReadingToolbar";
import ReadingProgressBar from "../Quran/ReadingProgressBar";
import CleanPageView from "../Quran/CleanPageView";
import SurahHeader from "../Quran/SurahHeader";
import AyahActionsModal from "./AyahActionsModal";
import QCVerseByVerseView from "./QCVerseByVerseView";
import ModeNavigation from "./ModeNavigation";
import { modePaneShellClass } from "./displayClasses";

export default function SurahMode({
  activeAyah,
  ayahs,
  calibration,
  classes,
  currentPlayingAyah,
  currentSurah,
  getTranslationForAyah,
  isQCF4,
  lang,
  memMode,
  mushafLayout,
  onNextSurah,
  onPlaySurah,
  onPrevSurah,
  onToggleActive,
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

  const endOfSurahLabel =
    lang === "fr"
      ? "Fin de la Sourate"
      : "End of Surah";

  return (
    <div
      role="region"
      aria-label={t("settings.surahMode", lang)}
      className={`quran-mode-pane quran-mode-pane--surah ${modePaneShellClass}`}
    >
      <ReadingProgressBar />
      {!(isQCF4 && mushafLayout === "mushaf") && (
        <div className="qc-surah-header-wrap animate-in">
          <SurahHeader surahNum={currentSurah} lang={lang} />
        </div>
      )}

      <ReadingToolbar
        contextLabel={surahMeta ? `${currentSurah}. ${lang === "fr" ? surahMeta.fr || surahMeta.en : surahMeta.en}` : undefined}
        playLabel={lang === "fr" ? "Ecouter la sourate" : "Listen surah"}
        surahNum={currentSurah}
        onPlaySurah={onPlaySurah}
        preparingSurah={preparingSurah}
      />

      {mushafLayout === "mushaf" ? (
        <>
          <CleanPageView
            ayahs={ayahs}
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
            showSurahHeader={false}
          />
          <AyahActionsModal
            activeAyah={activeAyah}
            onClose={() => onToggleActive(null)}
            surah={currentSurah}
            ayahData={ayahs.find((ayah) => ayah.numberInSurah === activeAyah)}
          />
        </>
      ) : (
        <QCVerseByVerseView
          ayahs={ayahs}
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

      {ayahs.length > 0 && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-[rgba(var(--primary-rgb),0.3)] to-transparent" />
          <div className="flex items-center gap-3">
            <span className="text-[var(--text-muted)] text-sm">☽</span>
            <span className="font-[var(--font-ui)] text-sm font-semibold text-[var(--text-muted)] uppercase tracking-widest">
              {endOfSurahLabel}
            </span>
            <span className="text-[var(--text-muted)] text-sm">☾</span>
          </div>
          <div className="w-full h-px bg-gradient-to-r from-transparent via-[rgba(var(--primary-rgb),0.3)] to-transparent" />
        </div>
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
