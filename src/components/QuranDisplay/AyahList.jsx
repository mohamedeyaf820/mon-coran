import React, { memo } from "react";
import { Bookmark } from "lucide-react";
import { toAr } from "../../data/surahs";
import { cn } from "../../lib/utils";
import AyahBlock from "../Quran/AyahBlock";
import SmartAyahRenderer from "../Quran/SmartAyahRenderer";

function PageSeparator({ ayah, lang, theme }) {
  return (
    <div
      className="page-separator relative my-8 flex items-center justify-center gap-4 select-none"
      aria-hidden="true"
    >
      {/* Ligne gauche */}
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[rgba(var(--primary-rgb),0.2)]" />

      {/* Badge central */}
      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[rgba(var(--primary-rgb),0.15)] bg-[var(--bg-secondary)]">
        <Bookmark size={8} className="text-[var(--primary)]" />
        <span className="font-[var(--font-ui)] text-[0.72rem] font-semibold text-[var(--text-muted)] tracking-wide uppercase">
          {lang === "ar" ? "صفحة" : "Page"}{" "}
          {lang === "ar" ? toAr(ayah.page) : ayah.page}
        </span>
      </div>

      {/* Ligne droite */}
      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[rgba(var(--primary-rgb),0.2)]" />
    </div>
  );
}

function AyahList({
  ayahs,
  className,
  currentPlayingAyah,
  activeAyah,
  lang,
  theme,
  currentSurah,
  getTranslationForAyah,
  showPageSeparators = false,
  showTajwid,
  showTranslation,
  showTransliteration,
  calibration,
  riwaya,
  fontSize,
  onToggleActive,
  getToggleId,
  getAyahId,
  getSurahNumber,
}) {
  const useContinuousFlow =
    !showTranslation &&
    !showTransliteration;

  const playingAnnouncement = currentPlayingAyah
    ? `${lang === "ar" ? "الآية" : lang === "fr" ? "Verset" : "Verse"} ${currentPlayingAyah.surah}:${currentPlayingAyah.ayah}`
    : "";

  // Always-mounted live region — removing/adding it resets the AT announcement queue.
  const ariaLiveRegion = (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {playingAnnouncement}
    </div>
  );

  if (useContinuousFlow) {
    return (
      <div
        role="list"
        className={cn(className, "qcom-continuous-list")}
        dir="rtl"
        lang="ar"
      >
        {ariaLiveRegion}
        {ayahs.map((ayah, index) => {
          const surahNumber = getSurahNumber(ayah);
          const toggleId = getToggleId(ayah);
          const isPlaying =
            currentPlayingAyah?.ayah === ayah.numberInSurah &&
            currentPlayingAyah?.surah === surahNumber;
          const isActive = activeAyah === toggleId;
          const showPageSeparator =
            showPageSeparators &&
            index > 0 &&
            ayahs[index - 1].page !== ayah.page;

          return (
            <React.Fragment key={ayah.number || `${surahNumber}:${ayah.numberInSurah}`}>
              {showPageSeparator ? (
                <PageSeparator ayah={ayah} lang={lang} theme={theme} />
              ) : null}
              <span
                id={getAyahId(ayah)}
                role="listitem"
                data-surah-number={surahNumber || currentSurah}
                data-ayah-number={ayah.numberInSurah}
                data-ayah-global={ayah.number}
                aria-current={isPlaying ? "true" : undefined}
                tabIndex={0}
                className={cn(
                  "qcom-continuous-verse",
                  "content-visibility-auto [contain-intrinsic-size:1px_76px]",
                  isActive && "qcom-continuous-verse--active",
                  isPlaying && "qcom-continuous-verse--playing",
                )}
                onClick={() => onToggleActive?.(toggleId)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onToggleActive?.(toggleId);
                  }
                }}
              >
                <SmartAyahRenderer
                  ayah={ayah}
                  showTajwid={showTajwid}
                  isPlaying={isPlaying}
                  surahNum={surahNumber || currentSurah}
                  calibration={calibration}
                  riwaya={riwaya}
                />
                {"\u200A"}
              </span>
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div role="list" className={className}>
      {ariaLiveRegion}
      {ayahs.map((ayah, index) => {
        const surahNumber = getSurahNumber(ayah);
        const toggleId = getToggleId(ayah);
        const isPlaying =
          currentPlayingAyah?.ayah === ayah.numberInSurah &&
          currentPlayingAyah?.surah === surahNumber;
        const trans = getTranslationForAyah(ayah);
        const showPageSeparator =
          showPageSeparators &&
          index > 0 &&
          ayahs[index - 1].page !== ayah.page;

        return (
          <React.Fragment key={ayah.number || `${surahNumber}:${ayah.numberInSurah}`}>
            {showPageSeparator ? (
              <PageSeparator ayah={ayah} lang={lang} theme={theme} />
            ) : null}
            <AyahBlock
              ayah={ayah}
              ayahId={getAyahId(ayah)}
              isPlaying={isPlaying}
              isActive={activeAyah === toggleId}
              trans={trans}
              showTajwid={showTajwid}
              showTranslation={showTranslation}
              showTransliteration={showTransliteration}
              surahNum={surahNumber || currentSurah}
              calibration={calibration}
              riwaya={riwaya}
              lang={lang}
              fontSize={fontSize}
              toggleId={toggleId}
              onToggleActive={onToggleActive}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default memo(AyahList);
