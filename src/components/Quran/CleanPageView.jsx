import React, { useMemo } from "react";
import { getSurah } from "../../data/surahs";
import SmartAyahRenderer from "./SmartAyahRenderer";
import CleanPageTranslationPanel from "./CleanPageTranslationPanel";
import { CleanPageSurahHeader, VerseMedallion } from "./CleanPageDecor";

export default function CleanPageView({
  ayahs,
  lang,
  fontSize,
  isQCF4,
  showTajwid,
  currentPlayingAyah,
  surahNum,
  calibration,
  riwaya,
  showTranslation,
  getTranslation,
  showSurahHeader = true,
  activeAyah = null,
  getAyahToggleId = (ayah) => ayah.numberInSurah,
  onAyahClick,
}) {
  const surahMeta = useMemo(() => getSurah(surahNum), [surahNum]);
  const pageNumber = ayahs[0]?.page ?? null;
  const juzNumber = ayahs[0]?.juz ?? null;
  const headerSurahName = surahMeta?.name_arabic || surahMeta?.name || "";
  const showBasmala = false;

  return (
    <div className={`cpv-container mushaf-wrapper mushaf-page-wrapper${isQCF4 ? " cpv-qcf4" : ""}`}>
      <div className="pointer-events-none mb-0 block h-[2px] bg-[linear-gradient(90deg,transparent,rgba(var(--primary-rgb),0.35)_25%,rgba(184,134,11,0.65)_50%,rgba(var(--primary-rgb),0.35)_75%,transparent)]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[64px_64px] opacity-[0.11]" aria-hidden="true" />
      <div className="mushaf-page-header" aria-hidden="true">
        <span>{juzNumber ? `جزء ${juzNumber}` : ""}</span>
        <span>{headerSurahName}</span>
      </div>
      {(showSurahHeader && ayahs[0]?.numberInSurah === 1 && surahMeta) || showBasmala ? (
        <div className="mushaf-surah-header">
          {showSurahHeader && ayahs[0]?.numberInSurah === 1 && surahMeta ? (
            <CleanPageSurahHeader surahMeta={surahMeta} lang={lang} />
          ) : null}
        </div>
      ) : null}
      <div className="mushaf-text-block mushaf-container" dir="rtl" lang="ar">
        {ayahs.map((ayah) => {
          const isPlaying = currentPlayingAyah?.ayah === ayah.numberInSurah && currentPlayingAyah?.surah === surahNum;
          const toggleId = getAyahToggleId(ayah);
          const isActive = activeAyah === toggleId;
          return (
            <span
              key={ayah.number || `${surahNum}:${ayah.numberInSurah}`}
              id={`ayah-${ayah.numberInSurah}`}
              data-surah-number={surahNum}
              data-ayah-number={ayah.numberInSurah}
              data-ayah-global={ayah.number}
              className={`quran-verse-inline cpv-verse mushaf-verse${isActive ? " cpv-verse--active" : ""}${isPlaying ? " cpv-verse--playing" : ""}`}
              onClick={() => onAyahClick?.(toggleId)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onAyahClick?.(toggleId);
                }
              }}
              role={onAyahClick ? "button" : undefined}
              tabIndex={onAyahClick ? 0 : undefined}
              aria-label={`${lang === "ar" ? "\u0627\u0644\u0622\u064a\u0629" : lang === "fr" ? "Verset" : "Verse"} ${ayah.numberInSurah}`}
              aria-current={isPlaying ? "true" : undefined}
            >
              <span className="quran-arabic-text verse-text">
                <SmartAyahRenderer
                  ayah={ayah}
                  showTajwid={showTajwid}
                  isPlaying={isPlaying}
                  surahNum={surahNum}
                  calibration={calibration}
                  riwaya={riwaya}
                />
              </span>
              <VerseMedallion num={ayah.numberInSurah} isPlaying={isPlaying} />
            </span>
          );
        })}
      </div>
      <div className="mushaf-page-footer" aria-hidden="true">
        <span />
        <span>{pageNumber ?? ""}</span>
        <span />
      </div>
      {showTranslation && getTranslation && ayahs.length > 0 ? <CleanPageTranslationPanel ayahs={ayahs} currentPlayingAyah={currentPlayingAyah} getTranslation={getTranslation} lang={lang} surahNum={surahNum} /> : null}
    </div>
  );
}
