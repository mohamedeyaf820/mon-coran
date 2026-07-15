import React, { memo, useMemo } from "react";
import { t } from "../../i18n";
import { toAr } from "../../data/surahs";
import CleanPageView from "../Quran/CleanPageView";
import ReadingToolbar from "../Quran/ReadingToolbar";
import ReadingProgressBar from "../Quran/ReadingProgressBar";
import AyahActionsModal from "./AyahActionsModal";
import QCVerseByVerseView from "./QCVerseByVerseView";
import ModeNavigation from "./ModeNavigation";
import ReaderContextCard from "./ReaderContextCard";
import { modePaneShellClass } from "./displayClasses";

function JuzMode({
  activeAyah,
  calibration,
  classes,
  currentJuz,
  currentPlayingAyah,
  getTranslationForAyah,
  isQCF4,
  lang,
  memMode,
  mushafLayout,
  onNavigateToAyah,
  onNextJuz,
  onPlayJuz,
  onPlaySpecificSurah,
  onPrevJuz,
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
  surahGroups,
}) {
  const activeAyahEntry = useMemo(() =>
    surahGroups
      .flatMap((group) =>
        group.ayahs.map((ayah) => ({ ayah, surah: group.surah })),
      )
      .find(
        ({ ayah }) =>
          ayah.number === activeAyah || ayah.numberInSurah === activeAyah,
      ),
    [surahGroups, activeAyah]
  );
  const activeAyahData = activeAyahEntry?.ayah;
  const firstSurah = surahGroups[0]?.surah;

  return (
    <div
      role="region"
      aria-label={t("settings.juzMode", lang)}
      className={`quran-mode-pane quran-mode-pane--juz ${
        mushafLayout === "mushaf" ? "quran-mode-pane--mushaf" : ""
      } ${modePaneShellClass}`}
    >
      <ReadingProgressBar />
      <ReaderContextCard
        kind="juz"
        label={t("sidebar.juz", lang)}
        value={lang === "ar" ? toAr(currentJuz) : currentJuz}
        numericValue={currentJuz}
        total={30}
        secondary={
          lang === "fr"
            ? "Lecture continue"
            : lang === "ar"
              ? "قراءة متواصلة"
              : "Continuous reading"
        }
        riwaya={riwaya}
        lang={lang}
      />

      <ReadingToolbar
        onPlay={onPlayJuz || (() => firstSurah && onPlaySpecificSurah(firstSurah))}
        playLabel={lang === "fr" ? "Écouter le juz" : "Listen juz"}
        preparingSurah={preparingSurah}
        surahNum={firstSurah}
        currentAyah={activeAyah || 1}
        onNavigateToAyah={onNavigateToAyah}
        onToggleMushaf={onToggleMushaf}
        onToggleMemorization={onToggleMemorization}
        onToggleWordByWord={onToggleWordByWord}
      />

      {mushafLayout === "mushaf" ? (
        <>
          {pageGroups.map((group, index) => (
            <CleanPageView
              key={`cpv-jz-pg-${group.page}-${index}`}
              ayahs={group.ayahs}
              lang={lang}
              fontSize={readingFontSize}
              isQCF4={isQCF4}
              showTajwid={showTajwid}
              currentPlayingAyah={currentPlayingAyah}
              surahNum={group.ayahs[0]?.surah?.number || group.ayahs[0]?.surah || firstSurah}
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
            surah={activeAyahData?.surah?.number || activeAyahEntry?.surah}
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
          displayMode="juz"
          showPageSeparators
        />
      )}

      <ModeNavigation
        className={classes.quranNavClass}
        buttonClassName={classes.quranNavButtonClass}
        previousLabel={t("quran.prevJuz", lang)}
        nextLabel={t("quran.nextJuz", lang)}
        previousDisabled={currentJuz <= 1}
        nextDisabled={currentJuz >= 30}
        onPrevious={onPrevJuz}
        onNext={onNextJuz}
        centerContent={
          <span className={classes.pageIndicatorClass}>
            {t("sidebar.juz", lang)} {lang === "ar" ? toAr(currentJuz) : currentJuz} / 30
          </span>
        }
        lang={lang}
      />
    </div>
  );
}

export default memo(JuzMode);
