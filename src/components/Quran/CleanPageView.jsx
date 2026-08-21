import React, { useMemo } from "react";
import { getSurah, toAr } from "../../data/surahs";
import SmartAyahRenderer from "./SmartAyahRenderer";
import CleanPageTranslationPanel from "./CleanPageTranslationPanel";
import { CleanPageSurahHeader } from "./CleanPageDecor";
import Bismillah from "./Bismillah";
import AyahMarker from "./AyahMarker";

function CleanPageViewComponent({
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
  showTransliteration: _showTransliteration = true,
}) {
  const surahMeta = useMemo(() => getSurah(surahNum), [surahNum]);
  const pageNumber = ayahs[0]?.page ?? null;
  const juzNumber = ayahs[0]?.juz ?? null;
  const headerSurahName = surahMeta?.ar || surahMeta?.name_arabic || surahMeta?.name || "";
  // `fontSize` is already resolved for the current viewport by
  // useQuranDisplayView. Keeping one source of truth prevents deferred mobile
  // styles from enlarging the Mushaf after its first paint.
  const mushafFontSize = Math.max(12, Math.min(96, Number(fontSize) || 34));
  const mushafWordSpacing = "0";

  const juzLabel = useMemo(() => {
    if (!juzNumber) return "";
    return lang === "ar" ? `الجزء ${toAr(juzNumber)}` : `Juz ${juzNumber}`;
  }, [juzNumber, lang]);

  const surahLabel = useMemo(() => {
    if (!headerSurahName) return "";
    return headerSurahName;
  }, [headerSurahName]);

  return (
    <div
      className={`cpv-container mushaf-wrapper mushaf-page-wrapper ${isQCF4 ? "cpv-qcf4" : ""}`}
    >
      <div className="mushaf-corner mushaf-corner--tr" aria-hidden="true" />
      <div className="mushaf-corner mushaf-corner--tl" aria-hidden="true" />
      <div className="mushaf-corner mushaf-corner--br" aria-hidden="true" />
      <div className="mushaf-corner mushaf-corner--bl" aria-hidden="true" />

      <div
        className="pointer-events-none mb-0 block h-[2px] bg-[linear-gradient(90deg,transparent,rgba(var(--primary-rgb),0.35)_25%,rgba(184,134,11,0.65)_50%,rgba(var(--primary-rgb),0.35)_75%,transparent)]"
        aria-hidden="true"
      />
      <div className="mushaf-page-header" aria-hidden="true">
        {juzLabel && <span dir="rtl">{juzLabel}</span>}
        {juzLabel && surahLabel && <span className="mushaf-header-sep" aria-hidden="true">·</span>}
        {surahLabel && <span dir="rtl">{surahLabel}</span>}
      </div>
      <div
        className="mushaf-text-block mushaf-container"
        dir="rtl"
        lang="ar"
        style={{
          fontSize: `${Math.round(mushafFontSize)}px`,
          "--cpv-font-size": `${Math.round(mushafFontSize)}px`,
          "--cpv-line-height": "var(--quran-line-height, 2.2)",
          "--cpv-word-spacing": mushafWordSpacing,
          wordSpacing: "0",
        }}
      >
        {ayahs.flatMap((ayah) => {
          const ayahSurahNum = ayah.surah?.number || ayah.surah || surahNum;
          const isPlaying =
            currentPlayingAyah?.ayah === ayah.numberInSurah &&
            Number(currentPlayingAyah?.surah) === Number(ayahSurahNum);
          const toggleId = getAyahToggleId(ayah);
          const isActive = activeAyah === toggleId;
          const elements = [];

          if (showSurahHeader && ayah.numberInSurah === 1) {
            const sMeta = getSurah(ayahSurahNum);
            if (sMeta) {
              elements.push(
                <div
                  key={`header-${ayahSurahNum}`}
                  className="mushaf-surah-header-inline w-full my-6 block pointer-events-none select-none"
                >
                  <CleanPageSurahHeader surahMeta={sMeta} lang={lang} />
                  {ayahSurahNum !== 9 && ayahSurahNum !== 1 && <Bismillah />}
                </div>,
              );
            }
          }

          elements.push(
            <span
              key={ayah.number || `${ayahSurahNum}:${ayah.numberInSurah}`}
              id={`ayah-${getAyahToggleId(ayah)}`}
              data-surah-number={ayahSurahNum}
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
              aria-label={`${lang === "ar" ? "الآية" : lang === "fr" ? "Verset" : "Verse"} ${ayah.numberInSurah}`}
              aria-current={isPlaying ? "true" : undefined}
            >
              <span className="qc-ayah-text-ar quran-arabic-text verse-text">
                <SmartAyahRenderer
                  ayah={ayah}
                  showTajwid={showTajwid}
                  isPlaying={isPlaying}
                  surahNum={ayahSurahNum}
                  calibration={calibration}
                  riwaya={riwaya}
                  appendNativeMarker={true}
                />
              </span>
            </span>,
          );


          return elements;
        })}
      </div>
      <div className="mushaf-page-footer" aria-hidden="true">
        <span />
        <span className="mushaf-page-number-medallion">
          {lang === "ar" && pageNumber ? toAr(pageNumber) : (pageNumber ?? "")}
        </span>
        <span />
      </div>
      {showTranslation && getTranslation && ayahs.length > 0 ? (
        <CleanPageTranslationPanel
          ayahs={ayahs}
          currentPlayingAyah={currentPlayingAyah}
          getTranslation={getTranslation}
          lang={lang}
          surahNum={surahNum}
        />
      ) : null}
    </div>
  );
}

function areCleanPageViewEqual(prev, next) {
  return (
    prev.ayahs === next.ayahs &&
    prev.lang === next.lang &&
    prev.fontSize === next.fontSize &&
    prev.isQCF4 === next.isQCF4 &&
    prev.showTajwid === next.showTajwid &&
    prev.currentPlayingAyah === next.currentPlayingAyah &&
    prev.surahNum === next.surahNum &&
    prev.calibration === next.calibration &&
    prev.riwaya === next.riwaya &&
    prev.showTranslation === next.showTranslation &&
    prev.getTranslation === next.getTranslation &&
    prev.showSurahHeader === next.showSurahHeader &&
    prev.activeAyah === next.activeAyah &&
    prev.getAyahToggleId === next.getAyahToggleId &&
    prev.onAyahClick === next.onAyahClick &&
    prev.showTransliteration === next.showTransliteration
  );
}

export default React.memo(CleanPageViewComponent, areCleanPageViewEqual);
