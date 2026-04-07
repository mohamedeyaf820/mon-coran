import React, { useCallback, useMemo } from "react";
import { toAr } from "../../data/surahs";
import { t } from "../../i18n";
import { arabicToLatin } from "../../data/transliteration";
import { cn } from "../../lib/utils";
import { useAppState } from "../../context/AppContext";
import MemorizationText from "./MemorizationText";
import SmartAyahRenderer from "./SmartAyahRenderer";
import useMemorizationLevel from "./useMemorizationLevel";
import WordByWordDisplay from "./WordByWordDisplay";
import AyahBlockFooter from "./AyahBlockFooter";
import AyahBlockSupplement from "./AyahBlockSupplement";

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
  const { theme } = useAppState();
  const { memoLevel, updateMemoLevel } = useMemorizationLevel(
    surahNum,
    ayah.numberInSurah,
  );
  const isRtl = lang === "ar";
  const isDarkTheme = theme === "dark" || theme === "night-blue" || theme === "oled";
  const transliterationSource =
    riwaya === "warsh" && ayah.hafsText ? ayah.hafsText : ayah.text;
  const ayahTransliteration = useMemo(() => {
    if (!showTransliteration || showWordByWord || riwaya === "warsh") return "";
    return arabicToLatin(transliterationSource, riwaya);
  }, [riwaya, showTransliteration, showWordByWord, transliterationSource]);
  const arabicContent = useMemo(() => {
    if (memMode) return <MemorizationText text={ayah.hafsText || ayah.text} lang={lang} />;
    if (showWordByWord && !(ayah.warshWords?.length > 0)) {
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
      <div className={cn("rd-arabic qc-ayah-text-ar text-right [direction:rtl] [font-family:var(--qd-font-family,var(--font-quran,\"Amiri Quran\")),serif] text-[max(1.86rem,var(--qd-reading-font-size,36px))] leading-[1.92] text-[var(--text-primary)] break-words [text-rendering:optimizeLegibility] [font-feature-settings:\"kern\"_1,\"liga\"_1] [-webkit-font-smoothing:antialiased] max-[640px]:text-[max(1.34rem,calc(var(--qd-reading-font-size,36px)*0.62))] max-[640px]:leading-[1.82] max-[560px]:landscape:text-[max(1.2rem,calc(var(--qd-reading-font-size,36px)*0.56))] max-[560px]:landscape:leading-[1.68]", riwaya === "hafs" && "[word-spacing:calc(var(--arabic-reading-word-spacing,0.072em)+0.01em)] [line-height:calc(var(--arabic-reading-line-height,2.46)+0.08)]", riwaya === "warsh" && "[word-spacing:calc(var(--arabic-reading-word-spacing,0.072em)-0.012em)] [line-height:calc(var(--arabic-reading-line-height,2.46)-0.04)]")}>
        {arabicContent}
        <span className="rd-ayah-end" aria-hidden="true">
          <span className={cn("rd-ayah-end relative mx-[0.24em] inline-flex h-[1em] w-[1em] items-center justify-center align-middle text-[1em] leading-none [filter:none]", isDarkTheme && "drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]")}>
            <span className="rd-ayah-end-glyph inline-block text-[1em] leading-none text-[color:var(--ayah-stop-text,color-mix(in_srgb,var(--text-primary)_74%,#7b5820_26%))] opacity-70">{"\u06dd"}</span>
            <span className="rd-ayah-end-num absolute inset-0 inline-flex items-center justify-center font-[var(--font-surah-name,var(--font-surah,var(--font-ui)))] text-[0.38em] font-bold leading-none text-[color:var(--ayah-stop-text,color-mix(in_srgb,var(--text-primary)_70%,#5a3a06_30%))]">{toAr(ayah.numberInSurah)}</span>
          </span>
        </span>
      </div>
      {!memMode && showWordByWord && ayah.warshWords?.length > 0 ? <div className="rd-warsh-note flex items-center gap-2 text-[0.85rem] text-[var(--text-muted)]"><i className="fas fa-info-circle" /><span>{lang === "fr" ? "Mot \u00e0 mot non disponible en mode Warsh" : lang === "ar" ? "\u0627\u0644\u0643\u0644\u0645\u0629 \u0628\u0643\u0644\u0645\u0629 \u063a\u064a\u0631 \u0645\u062a\u0627\u062d\u0629 \u0641\u064a \u0631\u0648\u0627\u064a\u0629 \u0648\u0631\u0634 QCF4" : "Word-by-word unavailable in Warsh QCF4"}</span></div> : null}
      {ayahTransliteration || (showTranslation && Array.isArray(trans) && trans.length > 0 && !(riwaya === "warsh" && showWordByWord)) ? <AyahBlockSupplement ayahTransliteration={ayahTransliteration} isRtl={isRtl} lang={lang} riwaya={riwaya} trans={showTranslation && !(riwaya === "warsh" && showWordByWord) ? trans : []} /> : null}
      <AyahBlockFooter ayah={ayah} isActive={isActive} isRtl={isRtl} memoLevel={memoLevel} onStarClick={updateMemoLevel} surahNum={surahNum} />
    </div>
  );
});

export default AyahBlock;
