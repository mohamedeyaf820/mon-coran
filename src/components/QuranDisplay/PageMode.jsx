import React from "react";
import { getJuzForAyah } from "../../data/juz";
import { t } from "../../i18n";
import { toAr } from "../../data/surahs";
import CleanPageView from "../Quran/CleanPageView";
import SurahHeader from "../Quran/SurahHeader";
import AyahActionsModal from "./AyahActionsModal";
import AyahList from "./AyahList";
import ModeNavigation from "./ModeNavigation";
import ModeToggleBar from "./ModeToggleBar";
import { modePaneShellClass } from "./displayClasses";

export default function PageMode({
  activeAyah,
  ayahs,
  calibration,
  classes,
  currentPage,
  currentPlayingAyah,
  currentSurah,
  getMushafLayoutButtonClass,
  getTranslationForAyah,
  isQCF4,
  lang,
  memMode,
  mushafLayout,
  onNextPage,
  onPrevPage,
  onToggleActive,
  onToggleMemorization,
  onToggleMushaf,
  onToggleWordByWord,
  pageTopSurah,
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
  const activeAyahData = ayahs.find(
    (ayah) => ayah.number === activeAyah || ayah.numberInSurah === activeAyah,
  );

  return (
    <div
      className={`quran-mode-pane quran-mode-pane--page ${modePaneShellClass}`}
      role="region"
      aria-label={t("settings.pageMode", lang)}
    >
      <div className={classes.pageHeaderBarClass}>
        <span className={classes.pageHeaderPrimaryMetaClass}>
          {t("quran.page", lang)} {lang === "ar" ? toAr(currentPage) : currentPage}
        </span>
        {ayahs[0] ? (
          <span className={classes.pageHeaderSecondaryMetaClass}>
            {t("sidebar.juz", lang)}{" "}
            {getJuzForAyah(ayahs[0].surah?.number, ayahs[0].numberInSurah)}
          </span>
        ) : null}
        <span className={classes.riwayaBadgeClassName}>
          {showRiwayaStar ? <i className="fas fa-star text-[0.62rem]"></i> : null}
          {riwaya === "warsh" ? "WARSH" : "HAFS"}
        </span>
      </div>
      {!isQCF4 && pageTopSurah ? (
        <div className="page-mode-top-surah mx-auto mt-[0.4rem] mb-[0.78rem]">
          <SurahHeader surahNum={pageTopSurah} lang={lang} />
        </div>
      ) : null}
      <ModeToggleBar
        className={classes.mushafToggleBarClass}
        separatorClassName={classes.mushafToggleSeparatorClass}
        getButtonClassName={getMushafLayoutButtonClass}
        lang={lang}
        mushafLayout={mushafLayout}
        memMode={memMode}
        showWordByWord={showWordByWord}
        onToggleWordByWord={onToggleWordByWord}
        onToggleMushaf={onToggleMushaf}
        onToggleMemorization={onToggleMemorization}
      />
      {mushafLayout === "mushaf" ? (
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
        <div>
          {surahGroups.map((group) => (
            <AyahList
              key={`page-list-${group.surah}-${group.ayahs[0]?.number}`}
              ayahs={group.ayahs}
              className={classes.ayahListClass}
              currentPlayingAyah={currentPlayingAyah}
              activeAyah={activeAyah}
              lang={lang}
              theme={theme}
              currentSurah={currentSurah}
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
              getToggleId={(ayah) => ayah.number}
              getAyahId={(ayah) => `ayah-pg-${ayah.number}`}
              getSurahNumber={(ayah) => ayah.surah?.number || group.surah}
            />
          ))}
        </div>
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
            {lang === "ar" ? toAr(currentPage) : currentPage} / 604
          </span>
        }
        lang={lang}
      />
    </div>
  );
}
