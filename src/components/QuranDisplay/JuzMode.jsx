import React from "react";
import { t } from "../../i18n";
import { toAr } from "../../data/surahs";
import { cn } from "../../lib/utils";
import CleanPageView from "../Quran/CleanPageView";
import ReadingToolbar from "../Quran/ReadingToolbar";
import ReadingProgressBar from "../Quran/ReadingProgressBar";
import AyahActionsModal from "./AyahActionsModal";
import QCVerseByVerseView from "./QCVerseByVerseView";
import ModeNavigation from "./ModeNavigation";
import { modePaneShellClass } from "./displayClasses";

export default function JuzMode({
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
  onNextJuz,
  onPlayJuz,
  onPlaySpecificSurah,
  onPrevJuz,
  onToggleActive,
  preparingSurah,
  readingFontSize,
  riwaya,
  showRiwayaStar,
  showTajwid,
  showTranslation,
  showTransliteration,
  showWordByWord,
  showWordTranslation,
  surahGroups,
}) {
  const activeAyahEntry = surahGroups
    .flatMap((group) =>
      group.ayahs.map((ayah) => ({ ayah, surah: group.surah })),
    )
    .find(
      ({ ayah }) =>
        ayah.number === activeAyah || ayah.numberInSurah === activeAyah,
    );
  const activeAyahData = activeAyahEntry?.ayah;
  const firstSurah = surahGroups[0]?.surah;

  return (
    <div
      role="region"
      aria-label={t("settings.juzMode", lang)}
      className={`quran-mode-pane quran-mode-pane--juz ${modePaneShellClass}`}
    >
      <ReadingProgressBar />
      <div className="mb-4 flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3">
        <div className="flex items-center gap-2">
          <i className="fas fa-book-open text-sm text-[var(--primary)]" />
          <span className="font-[var(--font-ui)] text-sm font-bold text-[var(--text-primary)]">
            {t("sidebar.juz", lang)} {lang === "ar" ? toAr(currentJuz) : currentJuz} / 30
          </span>
        </div>

        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.65rem] font-bold tracking-wide",
            riwaya === "warsh"
              ? "border-[rgba(212,168,32,0.3)] bg-[rgba(212,168,32,0.12)] text-[var(--gold,#b8860b)]"
              : "border-[rgba(var(--primary-rgb),0.2)] bg-[rgba(var(--primary-rgb),0.08)] text-[var(--primary)]",
          )}
        >
          {showRiwayaStar && <i className="fas fa-star text-[0.55rem]" />}
          {riwaya === "warsh" ? "WARSH" : "HAFS"}
        </span>
      </div>

      <ReadingToolbar
        contextLabel={`Juz ${lang === "ar" ? toAr(currentJuz) : currentJuz}`}
        onPlay={onPlayJuz || (() => firstSurah && onPlaySpecificSurah(firstSurah))}
        playLabel={lang === "fr" ? "Ecouter le juz" : "Listen juz"}
        preparingSurah={preparingSurah}
        surahNum={firstSurah}
      />

      {mushafLayout === "mushaf" ? (
        <>
          {surahGroups.map((group, index) => (
            <CleanPageView
              key={`cpv-jz-${group.surah}-${index}`}
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
