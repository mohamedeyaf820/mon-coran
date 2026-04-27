import React, { useCallback, useMemo } from "react";
import { toAr } from "../../data/surahs";
import { t } from "../../i18n";
import { arabicToLatin } from "../../data/transliteration";
import { cn } from "../../lib/utils";
import MemorizationText from "./MemorizationText";
import SmartAyahRenderer from "./SmartAyahRenderer";
import WordByWordDisplay from "./WordByWordDisplay";
import AyahBlockFooter from "./AyahBlockFooter";
import AyahBlockSupplement from "./AyahBlockSupplement";
import AyahMarker from "./AyahMarker";

const AyahBlock = React.memo(function AyahBlock({
  ayah,
  isPlaying,
  isActive,
  trans,
  showTajwid,
  showTranslation,
  showWordByWord,
  showTransliteration,
  showWordTranslation,
  surahNum,
  calibration,
  riwaya,
  lang,
  onToggleActive,
  toggleId,
  ayahId,
  fontSize,
  memMode,
}) {
  const isRtl = lang === "ar";
  const transliterationSource =
    riwaya === "warsh" && ayah.hafsText ? ayah.hafsText : ayah.text;
  const ayahTransliteration = useMemo(() => {
    if (!showTransliteration || showWordByWord) return "";
    return arabicToLatin(transliterationSource, riwaya);
  }, [riwaya, showTransliteration, showWordByWord, transliterationSource]);
  const arabicContent = useMemo(() => {
    if (memMode) return <MemorizationText text={ayah.hafsText || ayah.text} lang={lang} />;
    if (showWordByWord) {
      return (
        <WordByWordDisplay
          surah={surahNum}
          ayah={ayah.numberInSurah}
          text={ayah.text}
          isPlaying={isPlaying}
          showTajwid={showTajwid}
          showTransliteration={showTransliteration}
          showWordTranslation={showWordTranslation}
          fontSize={fontSize}
          calibration={calibration}
          warshWords={ayah.warshWords}
        />
      );
    }
    return <SmartAyahRenderer ayah={ayah} showTajwid={showTajwid} isPlaying={isPlaying} surahNum={surahNum} calibration={calibration} riwaya={riwaya} />;
  }, [ayah, calibration, fontSize, isPlaying, lang, memMode, riwaya, showTajwid, showTransliteration, showWordByWord, showWordTranslation, surahNum]);
  const handleToggleActive = useCallback(() => {
    if (typeof onToggleActive === "function") onToggleActive(toggleId ?? ayah.numberInSurah);
  }, [ayah.numberInSurah, onToggleActive, toggleId]);

  return (
    <div id={ayahId} data-surah-number={surahNum} data-ayah-number={ayah.numberInSurah} data-ayah-global={ayah.number} role="listitem" aria-label={`${t("quran.ayah", lang)} ${ayah.numberInSurah}`} aria-current={isPlaying ? "true" : undefined} className={cn("rd-ayah relative flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[radial-gradient(circle_at_12%_0%,rgba(var(--primary-rgb),0.08),transparent_52%),color-mix(in_srgb,var(--bg-primary)_93%,var(--bg-secondary)_7%)] px-[1.05rem] py-4 shadow-[0_10px_22px_rgba(2,8,23,0.06)] transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out content-visibility-auto [contain-intrinsic-size:1px_240px] hover:-translate-y-px hover:border-[rgba(var(--primary-rgb),0.32)] hover:shadow-[0_14px_24px_rgba(var(--primary-rgb),0.12)] max-[640px]:rounded-[0.86rem] max-[640px]:px-[0.7rem] max-[640px]:py-[0.82rem] max-[560px]:landscape:gap-[0.66rem] max-[560px]:landscape:rounded-[0.78rem] max-[560px]:landscape:px-[0.8rem] max-[560px]:landscape:py-[0.72rem]", isActive && "active border-[rgba(var(--primary-rgb),0.38)] bg-[rgba(var(--primary-rgb),0.05)] shadow-[0_14px_24px_rgba(var(--primary-rgb),0.14)]", isPlaying && "playing border-[color:color-mix(in_srgb,var(--gold,#b8860b)_52%,rgba(var(--primary-rgb),0.54))] bg-[rgba(var(--primary-rgb),0.08)] shadow-[0_16px_28px_rgba(var(--primary-rgb),0.18)]")} onClick={handleToggleActive} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); handleToggleActive(); } }} tabIndex={0}>
      <div className="rd-ayah-head flex items-center justify-between gap-3 font-[var(--font-ui)]">
        <span className="rd-ayah-ref" dir="ltr">
          {surahNum}:{ayah.numberInSurah}
        </span>
      </div>
      <div className={cn("rd-arabic qc-ayah-text-ar text-right [direction:rtl] [font-family:var(--qd-font-family,var(--font-quran,\"Amiri Quran\")),serif] text-[max(1.86rem,var(--qd-reading-font-size,36px))] leading-[1.92] text-[var(--text-primary)] break-words [text-rendering:optimizeLegibility] [font-feature-settings:\"kern\"_1,\"liga\"_1] [-webkit-font-smoothing:antialiased] max-[640px]:text-[max(1.34rem,calc(var(--qd-reading-font-size,36px)*0.62))] max-[640px]:leading-[1.82] max-[560px]:landscape:text-[max(1.2rem,calc(var(--qd-reading-font-size,36px)*0.56))] max-[560px]:landscape:leading-[1.68]", (riwaya === "hafs" || riwaya === "warsh") && "[word-spacing:calc(var(--arabic-reading-word-spacing,0.072em)+0.01em)] [line-height:calc(var(--arabic-reading-line-height,2.46)+0.08)]")}>
        {arabicContent}
        <AyahMarker num={ayah.numberInSurah} isPlaying={isPlaying} />
      </div>
      {ayahTransliteration || (showTranslation && Array.isArray(trans) && trans.length > 0) ? <AyahBlockSupplement ayahTransliteration={ayahTransliteration} isRtl={isRtl} lang={lang} riwaya={riwaya} trans={showTranslation ? trans : []} /> : null}
      <AyahBlockFooter ayah={ayah} isActive={isActive} surahNum={surahNum} />
    </div>
  );
});

export default AyahBlock;
