import React from "react";
import { t } from "../../i18n";
import { toAr } from "../../data/surahs";
import { cn } from "../../lib/utils";
import { shouldShowStandaloneBasmala } from "../../utils/quranUtils";
import Bismillah from "../Quran/Bismillah";
import CleanPageView from "../Quran/CleanPageView";
import ReadingToolbar from "../Quran/ReadingToolbar";
import SurahHeader from "../Quran/SurahHeader";
import AyahActionsModal from "./AyahActionsModal";
import AyahList from "./AyahList";
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
  onToggleMemorization,
  onToggleMushaf,
  onToggleWordByWord,
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
  theme,
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
      {/* ── En-tête de Juz — style Quran.com ── */}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] mb-4">
        <div className="flex items-center gap-2">
          <i className="fas fa-book-open text-[var(--primary)] text-sm" />
          <span className="font-[var(--font-ui)] text-sm font-bold text-[var(--text-primary)]">
            {t("sidebar.juz", lang)}{" "}
            {lang === "ar" ? toAr(currentJuz) : currentJuz} / 30
          </span>
        </div>

        {/* Badge riwaya */}
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.65rem] font-bold tracking-wide",
            riwaya === "warsh"
              ? "bg-[rgba(212,168,32,0.12)] text-[var(--gold,#b8860b)] border border-[rgba(212,168,32,0.3)]"
              : "bg-[rgba(var(--primary-rgb),0.08)] text-[var(--primary)] border border-[rgba(var(--primary-rgb),0.2)]",
          )}
        >
          {showRiwayaStar && <i className="fas fa-star text-[0.55rem]" />}
          {riwaya === "warsh" ? "WARSH" : "HAFS"}
        </span>
      </div>

      {/* ── Barre toggle simplifiée ── */}
      <ReadingToolbar
        contextLabel={`Juz ${lang === "ar" ? toAr(currentJuz) : currentJuz}`}
        onPlay={onPlayJuz || (() => firstSurah && onPlaySpecificSurah(firstSurah))}
        playLabel={lang === "fr" ? "Ecouter le juz" : "Listen juz"}
        preparingSurah={preparingSurah}
        surahNum={firstSurah}
      />

      {/* ── Contenu principal ── */}
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
        <div role="list">
          {surahGroups.map((group) => (
            <div key={`juz-list-${group.surah}-${group.ayahs[0]?.number}`}>
              {!isQCF4 && group.ayahs[0]?.numberInSurah === 1 ? (
                <>
                  <SurahHeader surahNum={group.surah} lang={lang} />
                  {shouldShowStandaloneBasmala(
                    group.surah,
                    riwaya,
                    group.ayahs[0]?.text,
                  ) ? (
                    <Bismillah />
                  ) : null}
                  <div className="play-surah-bar mt-3 mb-2 flex justify-center">
                    <button
                      className="btn-play-surah"
                      type="button"
                      onClick={() => onPlaySpecificSurah(group.surah)}
                      disabled={preparingSurah === group.surah}
                      title={t("audio.playSurah", lang)}
                    >
                      <i className="fas fa-play"></i>
                      <span>
                        {preparingSurah === group.surah
                          ? lang === "fr"
                            ? "Préparation..."
                            : "Preparing..."
                          : t("audio.playSurah", lang)}
                      </span>
                    </button>
                  </div>
                </>
              ) : null}
              <AyahList
                ayahs={group.ayahs}
                className={classes.ayahListClass}
                currentPlayingAyah={currentPlayingAyah}
                activeAyah={activeAyah}
                lang={lang}
                theme={theme}
                currentSurah={group.surah}
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
                getToggleId={(ayah) => ayah.number}
                getAyahId={(ayah) => `ayah-${ayah.number}`}
                getSurahNumber={(ayah) => ayah.surah?.number || group.surah}
              />
            </div>
          ))}
        </div>
      )}

      {/* ── Navigation bas de Juz ── */}
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
            {t("sidebar.juz", lang)}{" "}
            {lang === "ar" ? toAr(currentJuz) : currentJuz} / 30
          </span>
        }
        lang={lang}
      />
    </div>
  );
}
