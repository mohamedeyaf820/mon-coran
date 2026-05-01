import React, { useCallback, useMemo } from "react";
import { Bookmark } from "lucide-react";
import { toAr } from "../../data/surahs";
import { t } from "../../i18n";
import { useAppState, useApp } from "../../context/AppContext";
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
  const { translationReadingMode } = useAppState();

  const transliterationSource =
    riwaya === "warsh" && ayah.hafsText ? ayah.hafsText : ayah.text;

  const ayahTransliteration = useMemo(() => {
    if (!showTransliteration || showWordByWord) return "";
    return arabicToLatin(transliterationSource, riwaya);
  }, [riwaya, showTransliteration, showWordByWord, transliterationSource]);

  const arabicContent = useMemo(() => {
    if (memMode)
      return <MemorizationText text={ayah.hafsText || ayah.text} lang={lang} />;
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
    return (
      <SmartAyahRenderer
        ayah={ayah}
        showTajwid={showTajwid}
        isPlaying={isPlaying}
        surahNum={surahNum}
        calibration={calibration}
        riwaya={riwaya}
      />
    );
  }, [
    ayah,
    calibration,
    fontSize,
    isPlaying,
    lang,
    memMode,
    riwaya,
    showTajwid,
    showTransliteration,
    showWordByWord,
    showWordTranslation,
    surahNum,
  ]);

  const handleToggleActive = useCallback(() => {
    if (typeof onToggleActive === "function")
      onToggleActive(toggleId ?? ayah.numberInSurah);
  }, [ayah.numberInSurah, onToggleActive, toggleId]);

  return (
    <div
      id={ayahId}
      data-surah-number={surahNum}
      data-ayah-number={ayah.numberInSurah}
      data-ayah-global={ayah.number}
      role="listitem"
      aria-label={`${t("quran.ayah", lang)} ${ayah.numberInSurah}`}
      aria-current={isPlaying ? "true" : undefined}
      tabIndex={0}
      onClick={handleToggleActive}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleToggleActive();
        }
      }}
      className={cn(
        /* Base card */
        "rd-ayah qc-ayah-block group relative",
        "mx-auto mb-6 w-full max-w-[820px]",
        "rounded-[1.5rem] border border-[color-mix(in_srgb,var(--border)_50%,transparent_50%)]",
        "bg-[var(--bg-card)]",
        "px-7 py-6",
        "transition-all duration-300 ease-out outline-none",
        "content-visibility-auto [contain-intrinsic-size:1px_200px]",
        "shadow-[0_4px_20px_rgba(0,0,0,0.02)]",

        /* Hover */
        "hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] hover:border-[color-mix(in_srgb,var(--primary)_25%,transparent_75%)] hover:bg-[color-mix(in_srgb,var(--bg-card)_98%,var(--primary)_2%)]",
        "focus-visible:ring-2 focus-visible:ring-[rgba(var(--primary-rgb),0.3)]",

        /* Active */
        isActive && "is-active bg-[color-mix(in_srgb,var(--bg-card)_94%,var(--primary)_6%)] border-[color-mix(in_srgb,var(--primary)_50%,transparent_50%)] shadow-[0_8px_32px_rgba(var(--primary-rgb),0.12)] scale-[1.005] z-10",
        translationReadingMode && "is-translation-reading",

        /* Playing */
        isPlaying && [
          "playing is-playing",
          "bg-[color-mix(in_srgb,var(--bg-card)_90%,var(--primary)_10%)] border-[var(--primary)] shadow-[0_0_0_1px_rgba(var(--primary-rgb),0.2),0_8px_32px_rgba(var(--primary-rgb),0.15)] z-20",
        ],

        /* Mobile */
        "max-[640px]:px-5 max-[640px]:py-5 max-[640px]:rounded-[1.25rem] max-[640px]:mb-4"
      )}
    >
      {/* Top row: Minimalist Verse Badge */}
      <div className="flex items-center justify-between mb-5">
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1",
            "font-[var(--font-ui)] text-[0.75rem] font-bold tracking-widest uppercase",
            "transition-colors duration-300",
            isPlaying
              ? "bg-[rgba(var(--primary-rgb),0.1)] text-[var(--primary)]"
              : "bg-transparent text-[var(--text-muted)] border border-[color-mix(in_srgb,var(--border)_50%,transparent_50%)]"
          )}
          aria-hidden="true"
        >
          {lang === 'fr' ? 'Verset' : 'Verse'} {surahNum}:{ayah.numberInSurah}
        </div>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] opacity-40 hover:!opacity-100 hover:text-[var(--primary)] hover:bg-[rgba(var(--primary-rgb),0.08)] transition-all duration-300"
          onClick={(e) => { e.stopPropagation(); }}
          aria-label="Bookmark"
          title={lang === 'fr' ? 'Marquer ce verset' : 'Bookmark this verse'}
        >
          <Bookmark size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* Arabic text - Premium layout */}
      <div
        dir="rtl"
        style={{ fontFamily: "var(--qd-font-family, var(--font-quran, serif))" }}
        className={cn(
          "rd-arabic qc-ayah-text-ar",
          "!text-right mb-7 mt-1",
          "text-[max(1.86rem,var(--qd-reading-font-size,36px))]",
          "leading-[1.85]",
          "text-[var(--text-primary)]",
          "[text-rendering:optimizeLegibility]",
          "[-webkit-font-smoothing:antialiased]",

          /* Riwaya spacing optimized for List Mode */
          (riwaya === "hafs" || riwaya === "warsh") && [
            "[word-spacing:calc(var(--arabic-reading-word-spacing,0.02em)+0.01em)]",
            "leading-[calc(var(--arabic-reading-line-height,1.9)+0.05)]",
          ],

          /* Mobile */
          "max-[640px]:text-[max(1.5rem,calc(var(--qd-reading-font-size,36px)*0.7))]",
          "max-[640px]:leading-[1.8]",
          "max-[640px]:mb-5",
        )}
      >
        {arabicContent}
        {"\u00A0"}
        <AyahMarker num={ayah.numberInSurah} isPlaying={isPlaying} size="lg" />
      </div>

      {/* Transliteration + Translation */}
      {(ayahTransliteration ||
        (showTranslation && Array.isArray(trans) && trans.length > 0)) && (
        <AyahBlockSupplement
          ayahTransliteration={ayahTransliteration}
          isRtl={isRtl}
          riwaya={riwaya}
          trans={showTranslation ? trans : []}
        />
      )}

      {/* Actions (hover-reveal) */}
      <AyahBlockFooter ayah={ayah} isActive={isActive} surahNum={surahNum} />
    </div>
  );
});

export default AyahBlock;
