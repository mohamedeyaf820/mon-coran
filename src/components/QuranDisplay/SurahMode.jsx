import React from "react";
import { t } from "../../i18n";
import ReadingToolbar from "../Quran/ReadingToolbar";
import Bismillah from "../Quran/Bismillah";
import CleanPageView from "../Quran/CleanPageView";
import SurahHeader from "../Quran/SurahHeader";
import TajweedLegend from "../Quran/TajweedLegend";
import { shouldShowStandaloneBasmala } from "../../utils/quranUtils";
import AyahActionsModal from "./AyahActionsModal";
import AyahList from "./AyahList";
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
  return (
    <div
      role="region"
      aria-label={t("settings.surahMode", lang)}
      className={`quran-mode-pane quran-mode-pane--surah ${modePaneShellClass}`}
    >
      {!(isQCF4 && mushafLayout === "mushaf") && (
        <div className="qc-surah-header-wrap animate-in">
          <SurahHeader surahNum={currentSurah} lang={lang} />
          {shouldShowStandaloneBasmala(currentSurah, riwaya, ayahs[0]?.text) && mushafLayout !== "mushaf" ? (
            <Bismillah />
          ) : null}
        </div>
      )}
      <ReadingToolbar
        surahNum={currentSurah}
        onPlaySurah={onPlaySurah}
        preparingSurah={preparingSurah}
      />
      <TajweedLegend lang={lang} visible={showTajwid} riwaya={riwaya} />
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
          />
          <AyahActionsModal
            activeAyah={activeAyah}
            onClose={() => onToggleActive(null)}
            surah={currentSurah}
            ayahData={ayahs.find((ayah) => ayah.numberInSurah === activeAyah)}
          />
        </>
      ) : (
        <AyahList
          ayahs={ayahs}
          className={classes.ayahListClass}
          currentPlayingAyah={currentPlayingAyah}
          activeAyah={activeAyah}
          lang={lang}
          theme={theme}
          currentSurah={currentSurah}
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
          getToggleId={(ayah) => ayah.numberInSurah}
          getAyahId={(ayah) => `ayah-${ayah.numberInSurah}`}
          getSurahNumber={() => currentSurah}
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
        lang={lang}
      />
    </div>
  );
}
