import React, { memo, useMemo } from "react";
import { t } from "../../i18n";
import { toAr } from "../../data/surahs";
import ReadingToolbar from "../Quran/ReadingToolbar";
import AyahActionsModal from "./AyahActionsModal";
import QCVerseByVerseView from "./QCVerseByVerseView";
import ModeNavigation from "./ModeNavigation";
import ReaderContextCard from "./ReaderContextCard";
import VirtualizedMushafPages from "./VirtualizedMushafPages";
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
  mushafLayout,
  onNextJuz,
  onOpenFullscreen,
  onPlayJuz,
  onPlaySpecificSurah,
  onPrevJuz,
  onToggleActive,
  onToggleMushaf,
  pageGroups = [],
  preparingSurah,
  readingFontSize,
  riwaya,
  showTajwid,
  showTranslation,
  showTransliteration,
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
      <section
        className="reader-control-deck"
        aria-label={lang === "fr" ? "Commandes de lecture" : lang === "ar" ? "أدوات القراءة" : "Reading controls"}
      >
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
          onToggleMushaf={onToggleMushaf}
          onOpenFullscreen={onOpenFullscreen}
        />
      </section>

      {mushafLayout === "mushaf" ? (
        <>
          <VirtualizedMushafPages
            activeAyah={activeAyah}
            calibration={calibration}
            currentPlayingAyah={currentPlayingAyah}
            fallbackSurah={firstSurah}
            getTranslation={getTranslationForAyah}
            isQCF4={isQCF4}
            lang={lang}
            mode="juz"
            onAyahClick={onToggleActive}
            onOpenFullscreen={onOpenFullscreen}
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
            surah={activeAyahData?.surah?.number || activeAyahEntry?.surah}
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
