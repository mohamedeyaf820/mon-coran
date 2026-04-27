import React, { useCallback, useMemo } from "react";
import { toAr } from "../../data/surahs";
import { t } from "../../i18n";
import { useAppState } from "../../context/AppContext";
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
        /* ── Base layout ── */
        "rd-ayah qc-ayah-block group relative flex items-start gap-3",
        "px-4 py-5",
        "border-b border-(--border) last:border-b-0",
        "transition-all duration-200 ease-out outline-none",
        "rounded-xl",
        "content-visibility-auto [contain-intrinsic-size:1px_220px]",

        /* ── Hover ── */
        "hover:bg-[rgba(var(--primary-rgb),0.03)]",
        "focus-visible:ring-2 focus-visible:ring-[rgba(var(--primary-rgb),0.35)]",

        /* ── Active (sélectionné) ── */
        isActive && "active is-active bg-[rgba(var(--primary-rgb),0.05)]",
        translationReadingMode && "is-translation-reading",

        /* ── Playing (lecture en cours) ── */
        isPlaying && [
          "playing is-playing",
          "bg-[rgba(212,168,32,0.06)]",
          "border-l-2 border-l-(--gold,#d4a820)",
          "pl-3",
        ],

        /* ── Mobile ── */
        "max-[640px]:px-3 max-[640px]:py-4 max-[640px]:gap-2",
        "max-[560px]:landscape:py-3",
      )}
    >
      {/* ────────────────────────────────────────────────
          Médaillon du numéro de verset (style Quran.com)
      ──────────────────────────────────────────────── */}
      <div
        className={cn(
          /* Layout */
          "rd-ayah-head rd-ayah-ref qc-ayah-sidebar qc-ayah-num shrink-0 flex items-center justify-center rounded-full select-none",
          /* Typography */
          "[font-family:var(--font-ui,sans-serif)] font-bold leading-none",
          /* Animation */
          "transition-all duration-200",
          /* Taille desktop */
          "w-9 h-9 text-[0.68rem]",
          /* Taille mobile */
          "max-[640px]:w-8 max-[640px]:h-8 max-[640px]:text-[0.62rem]",

          isPlaying
            ? /* Doré quand en lecture */
              "bg-(--gold,#d4a820) text-white shadow-[0_2px_10px_rgba(212,168,32,0.45)]"
            : cn(
                /* État par défaut */
                "bg-[rgba(var(--primary-rgb),0.08)] text-(--primary)",
                "border border-[rgba(var(--primary-rgb),0.15)]",
                /* Hover : devient solide */
                "group-hover:bg-(--primary) group-hover:text-white",
                "group-hover:border-transparent",
                "group-hover:shadow-[0_2px_10px_rgba(var(--primary-rgb),0.32)]",
              ),
        )}
        aria-hidden="true"
      >
        {ayah.numberInSurah}
      </div>

      {/* ────────────────────────────────────────────────
          Contenu principal
      ──────────────────────────────────────────────── */}
      <div className="rd-ayah-body qc-ayah-content flex-1 min-w-0">
        {/* Texte arabe ─────────────────────────────── */}
        <div
          dir="rtl"
          className={cn(
            "rd-arabic qc-ayah-text-ar",
            "text-right wrap-break-word mb-3",
            "[font-family:var(--qd-font-family,var(--font-quran,'Amiri Quran')),serif]",
            "text-[max(1.86rem,var(--qd-reading-font-size,36px))]",
            "leading-[1.92]",
            "text-(--text-primary)",
            "[text-rendering:optimizeLegibility]",
            "font-features-['kern'_1,'liga'_1]",
            "[-webkit-font-smoothing:antialiased]",

            /* Espacement spécifique Hafs / Warsh */
            (riwaya === "hafs" || riwaya === "warsh") && [
              "[word-spacing:calc(var(--arabic-reading-word-spacing,0.072em)+0.01em)]",
              "leading-[calc(var(--arabic-reading-line-height,2.46)+0.08)]",
            ],

            /* Mobile portrait */
            "max-[640px]:text-[max(1.34rem,calc(var(--qd-reading-font-size,36px)*0.62))]",
            "max-[640px]:leading-[1.82]",
            "max-[640px]:mb-2",

            /* Mobile paysage */
            "max-[560px]:landscape:text-[max(1.2rem,calc(var(--qd-reading-font-size,36px)*0.56))]",
            "max-[560px]:landscape:leading-[1.68]",
          )}
        >
          {arabicContent}
          <AyahMarker num={ayah.numberInSurah} isPlaying={isPlaying} />
        </div>

        {/* Translittération + Traduction ───────────── */}
        {(ayahTransliteration ||
          (showTranslation && Array.isArray(trans) && trans.length > 0)) && (
          <AyahBlockSupplement
            ayahTransliteration={ayahTransliteration}
            isRtl={isRtl}
            lang={lang}
            riwaya={riwaya}
            trans={showTranslation ? trans : []}
          />
        )}

        {/* Actions (hover-reveal) ───────────────────── */}
        <AyahBlockFooter ayah={ayah} isActive={isActive} surahNum={surahNum} />
      </div>
    </div>
  );
});

export default AyahBlock;
