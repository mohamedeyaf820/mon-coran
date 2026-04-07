import React, { useMemo } from "react";
import SmartAyahRenderer from "./SmartAyahRenderer";
import { toAr, getSurah } from "../../data/surahs";
import { getJuzForAyah } from "../../data/juz";
import MushafInlineHeader from "./MushafInlineHeader";
import { getMushafFontClass, getRevelationBadge } from "./mushafInlineUtils";

function AyahMarker({ lang, num }) {
  return (
    <span className="mp-ayah-marker" aria-label={`Fin verset ${num}`}>
      <span className="mp-ayah-marker-glyph" aria-hidden="true">
        {"\u06dd"}
      </span>
      <span className="mp-ayah-num">{lang === "ar" ? toAr(num) : num}</span>
    </span>
  );
}

export default function MushafInlineView({
  ayahs,
  surahNum,
  displayMode,
  currentPage,
  currentJuz,
  isQCF4,
  showTajwid,
  currentPlayingAyah,
  calibration,
  riwaya,
  lang,
  fontSize,
  onAyahClick,
}) {
  const surahMeta = useMemo(() => getSurah(surahNum), [surahNum]);
  const juzNum = useMemo(() => (ayahs.length > 0 ? getJuzForAyah(surahNum, ayahs[0].numberInSurah) : 1), [ayahs, surahNum]);
  const juzNumEnd = useMemo(() => (ayahs.length > 0 ? getJuzForAyah(surahNum, ayahs[ayahs.length - 1].numberInSurah) : juzNum), [ayahs, surahNum, juzNum]);
  const showBasmala = surahNum !== 1 && surahNum !== 9 && ayahs.length > 0 && ayahs[0].numberInSurah === 1;
  const surahNameAr = surahMeta?.ar || "";
  const displayName = lang === "ar" ? surahNameAr : lang === "fr" ? surahMeta?.fr || surahNameAr : surahMeta?.en || surahNameAr;
  const ayahCountLabel = surahMeta?.ayahs ?? "?";
  const basmalaTranslation = lang === "fr" ? "Au nom d'Allah, le Tout Misericordieux, le Tres Misericordieux" : lang === "ar" ? null : "In the Name of Allah, the Most Compassionate, the Most Merciful";

  return (
    <div className={`mp-frame${isQCF4 ? " mp-qcf4" : ""} relative overflow-hidden rounded-[30px] border border-[rgba(186,148,74,0.26)] bg-[linear-gradient(165deg,rgba(247,237,213,0.94)_0%,rgba(236,220,183,0.96)_100%)] shadow-[0_20px_38px_rgba(12,18,14,0.14)]`}>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(132,102,46,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(132,102,46,0.07)_1px,transparent_1px)] bg-size-[60px_60px] opacity-[0.12]" aria-hidden="true" />
      <div className="mp-outer-border relative z-10">
        <div className="mp-inner-border rounded-2xl border border-[rgba(186,148,74,0.22)] bg-[rgba(240,226,190,0.2)] p-3">
          <MushafInlineHeader ayahCountLabel={ayahCountLabel} basmalaTranslation={basmalaTranslation} currentJuz={currentJuz} displayName={displayName} isQCF4={isQCF4} juzNum={displayMode === "juz" ? currentJuz ?? juzNum : juzNum} juzNumEnd={juzNumEnd} lang={lang} pageStart={(displayMode === "page" ? currentPage : null) ?? ayahs[0]?.page ?? null} revelBadge={getRevelationBadge(lang, surahMeta)} showBasmala={showBasmala} surahNameAr={surahNameAr} />
          <div className={`mp-ayahs-flow ${getMushafFontClass(Math.min(Math.max((fontSize ?? 38) + 16, 54), 72))} rounded-2xl border border-[rgba(184,146,72,0.22)] bg-[rgba(231,210,160,0.16)] px-3 py-4`} dir="rtl">
            {ayahs.map((ayah) => {
              const isPlaying = currentPlayingAyah?.ayah === ayah.numberInSurah && (currentPlayingAyah?.surah === surahNum || currentPlayingAyah?.surah == null);
              return (
                <React.Fragment key={ayah.number ?? ayah.numberInSurah}>
                  <span id={`ayah-${ayah.numberInSurah}`} data-surah-number={surahNum} data-ayah-number={ayah.numberInSurah} data-ayah-global={ayah.number} className={`mp-ayah${isPlaying ? " mp-ayah--playing" : ""}`} onClick={() => onAyahClick?.(ayah.numberInSurah)} role="button" tabIndex={0} onKeyDown={(event) => event.key === "Enter" && onAyahClick?.(ayah.numberInSurah)} aria-label={`Verset ${ayah.numberInSurah}`}>
                    <SmartAyahRenderer ayah={ayah} showTajwid={showTajwid} isPlaying={isPlaying} surahNum={surahNum} calibration={calibration} riwaya={riwaya} />
                  </span>
                  {!isQCF4 ? <AyahMarker num={ayah.numberInSurah} lang={lang} /> : null}
                  {"\u200C"}
                </React.Fragment>
              );
            })}
          </div>
          <div className="mp-separator mp-separator--bottom" aria-hidden="true">
            <span className="mp-sep-line"></span>
            <span className="mp-sep-diamond">{"\u25c6"}</span>
            <span className="mp-sep-line"></span>
          </div>
        </div>
      </div>
    </div>
  );
}
