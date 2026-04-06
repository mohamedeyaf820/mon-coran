import React, { useState, useEffect, useCallback, useMemo } from "react";
import { toAr } from "../../data/surahs";
import { t } from "../../i18n";
import { arabicToLatin } from "../../data/transliteration";
import { cn } from "../../lib/utils";
import { useAppState } from "../../context/AppContext";
import AyahActions from "../AyahActions";
import SmartAyahRenderer from "./SmartAyahRenderer";
import WordByWordDisplay from "./WordByWordDisplay";
import MemorizationText from "./MemorizationText";
import {
  getMemorizationLevel,
  setMemorizationLevel,
} from "../../services/memorizationService";

/**
 * AyahBlock component – renders a single Arabic verse with a polished design.
 * Arabic remains the visual focus, with optional transliteration and translation.
 */
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
  progress,
  fontSize,
  memMode,
}) {
  const { theme } = useAppState();
  const transliterationSource =
    riwaya === "warsh" && ayah.hafsText ? ayah.hafsText : ayah.text;
  // Memoized transliteration avoids expensive recomputation while scrolling long surahs.
  const ayahTransliteration = useMemo(() => {
    if (!showTransliteration || showWordByWord || riwaya === "warsh") return "";
    return arabicToLatin(transliterationSource, riwaya);
  }, [riwaya, showTransliteration, showWordByWord, transliterationSource]);

  // Memorization star rating
  const [memoLevel, setMemoLevel] = useState(0);
  useEffect(() => {
    setMemoLevel(getMemorizationLevel(surahNum, ayah.numberInSurah));
  }, [surahNum, ayah.numberInSurah]);

  useEffect(() => {
    const handleMemoSync = (event) => {
      if (
        event.detail?.surah === surahNum &&
        event.detail?.ayah === ayah.numberInSurah
      ) {
        setMemoLevel(Number(event.detail.level) || 0);
      }
    };

    window.addEventListener("quran-memorization-updated", handleMemoSync);
    return () =>
      window.removeEventListener("quran-memorization-updated", handleMemoSync);
  }, [surahNum, ayah.numberInSurah]);

  const handleStar = useCallback(
    (e, level) => {
      e.stopPropagation();
      const next = memoLevel === level ? 0 : level;
      setMemorizationLevel(surahNum, ayah.numberInSurah, next);
      setMemoLevel(next);
      window.dispatchEvent(
        new CustomEvent("quran-memorization-updated", {
          detail: { surah: surahNum, ayah: ayah.numberInSurah, level: next },
        }),
      );
    },
    [memoLevel, surahNum, ayah.numberInSurah],
  );

  const arabicContent = useMemo(() => {
    if (memMode) {
      return <MemorizationText text={ayah.hafsText || ayah.text} lang={lang} />;
    }
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

  const shouldShowVerseTranslation =
    showTranslation &&
    Array.isArray(trans) &&
    trans.length > 0 &&
    !(riwaya === "warsh" && showWordByWord);
  const isRtl = lang === "ar";
  const isDarkTheme =
    theme === "dark" || theme === "night-blue" || theme === "oled";

  const handleToggleActive = useCallback(() => {
    if (typeof onToggleActive === "function") {
      onToggleActive(toggleId ?? ayah.numberInSurah);
    }
  }, [onToggleActive, toggleId, ayah.numberInSurah]);

  const handleToggleActiveFromKeyboard = useCallback(
    (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleToggleActive();
      }
    },
    [handleToggleActive],
  );

  return (
    <div
      id={ayahId}
      data-surah-number={surahNum}
      data-ayah-number={ayah.numberInSurah}
      data-ayah-global={ayah.number}
      role="listitem"
      aria-label={`${t("quran.ayah", lang)} ${ayah.numberInSurah}`}
      aria-current={isPlaying ? "true" : undefined}
      className={cn(
        "rd-ayah relative flex flex-col gap-4 rounded-2xl border px-[1.05rem] py-4 transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out",
        "bg-[radial-gradient(circle_at_12%_0%,rgba(var(--primary-rgb),0.08),transparent_52%),color-mix(in_srgb,var(--bg-primary)_93%,var(--bg-secondary)_7%)] shadow-[0_10px_22px_rgba(2,8,23,0.06)]",
        "border-[var(--border)] content-visibility-auto [contain-intrinsic-size:1px_240px]",
        "hover:-translate-y-px hover:border-[rgba(var(--primary-rgb),0.32)] hover:shadow-[0_14px_24px_rgba(var(--primary-rgb),0.12)]",
        "max-[640px]:rounded-[0.86rem] max-[640px]:px-[0.7rem] max-[640px]:py-[0.82rem]",
        "max-[560px]:landscape:gap-[0.66rem] max-[560px]:landscape:rounded-[0.78rem] max-[560px]:landscape:px-[0.8rem] max-[560px]:landscape:py-[0.72rem]",
        isActive &&
          "active border-[rgba(var(--primary-rgb),0.38)] bg-[rgba(var(--primary-rgb),0.05)] shadow-[0_14px_24px_rgba(var(--primary-rgb),0.14)]",
        isPlaying &&
          "playing border-[color:color-mix(in_srgb,var(--gold,#b8860b)_52%,rgba(var(--primary-rgb),0.54))] bg-[rgba(var(--primary-rgb),0.08)] shadow-[0_16px_28px_rgba(var(--primary-rgb),0.18)]",
      )}
      onClick={handleToggleActive}
      onKeyDown={handleToggleActiveFromKeyboard}
      tabIndex={0}
    >
      <div
        className={cn(
          "rd-arabic qc-ayah-text-ar text-right [direction:rtl] [font-family:var(--qd-font-family,var(--font-quran,\"Amiri Quran\")),serif]",
          "text-[max(1.86rem,var(--qd-reading-font-size,36px))] leading-[1.92] text-[var(--text-primary)] break-words",
          "[text-rendering:optimizeLegibility] [font-feature-settings:\"kern\"_1,\"liga\"_1] [-webkit-font-smoothing:antialiased]",
          "max-[640px]:text-[max(1.34rem,calc(var(--qd-reading-font-size,36px)*0.62))] max-[640px]:leading-[1.82]",
          "max-[560px]:landscape:text-[max(1.2rem,calc(var(--qd-reading-font-size,36px)*0.56))] max-[560px]:landscape:leading-[1.68]",
          riwaya === "hafs" &&
            "[word-spacing:calc(var(--arabic-reading-word-spacing,0.072em)+0.01em)] [line-height:calc(var(--arabic-reading-line-height,2.46)+0.08)]",
          riwaya === "warsh" &&
            "[word-spacing:calc(var(--arabic-reading-word-spacing,0.072em)-0.012em)] [line-height:calc(var(--arabic-reading-line-height,2.46)-0.04)]",
        )}
      >
        {arabicContent}
        <span className="rd-ayah-end" aria-hidden="true">
          <span
            className={cn(
              "rd-ayah-end relative mx-[0.24em] inline-flex h-[1em] w-[1em] items-center justify-center align-middle text-[1em] leading-none [filter:none]",
              isDarkTheme && "drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]",
            )}
          >
            <span className="rd-ayah-end-glyph inline-block text-[1em] leading-none text-[color:var(--ayah-stop-text,color-mix(in_srgb,var(--text-primary)_74%,#7b5820_26%))] opacity-70">
              ۝
            </span>
            <span className="rd-ayah-end-num absolute inset-0 inline-flex items-center justify-center font-[var(--font-surah-name,var(--font-surah,var(--font-ui)))] text-[0.38em] font-bold leading-none text-[color:var(--ayah-stop-text,color-mix(in_srgb,var(--text-primary)_70%,#5a3a06_30%))]">
              {toAr(ayah.numberInSurah)}
            </span>
          </span>
        </span>
      </div>

      {!memMode && showWordByWord && ayah.warshWords?.length > 0 && (
        <div className="rd-warsh-note flex items-center gap-2 text-[0.85rem] text-[var(--text-muted)]">
          <i className="fas fa-info-circle" />
          <span>
            {lang === "fr"
              ? "Mot à mot non disponible en mode Warsh"
              : lang === "ar"
                ? "الكلمة بكلمة غير متاحة في رواية ورش QCF4"
                : "Word-by-word unavailable in Warsh QCF4"}
          </span>
        </div>
      )}

      {ayahTransliteration && (
        <div
          className={cn(
            "rd-translations rd-translations--tight mt-[0.18rem] mb-0 flex flex-col gap-[0.62rem] rounded-[0.74rem] border py-[0.58rem] bg-[color-mix(in_srgb,rgba(var(--primary-rgb),0.05)_48%,transparent)] [font-family:var(--font-ui)]",
            "border-[rgba(var(--primary-rgb),0.18)] max-[640px]:rounded-[0.64rem] max-[640px]:py-[0.5rem]",
            "max-[560px]:landscape:gap-[0.42rem] max-[560px]:landscape:py-[0.44rem]",
            isRtl
              ? "pl-[0.72rem] pr-[0.76rem] [border-inline-start:0] [border-inline-end:2px_solid_rgba(var(--primary-rgb),0.24)] max-[640px]:pl-[0.52rem] max-[640px]:pr-[0.62rem] max-[560px]:landscape:pl-[0.5rem] max-[560px]:landscape:pr-[0.6rem]"
              : "pl-[0.76rem] pr-[0.72rem] [border-inline-start:2px_solid_rgba(var(--primary-rgb),0.28)] max-[640px]:pl-[0.62rem] max-[640px]:pr-[0.56rem] max-[560px]:landscape:pl-[0.6rem] max-[560px]:landscape:pr-[0.54rem]",
          )}
        >
          <div className="rd-trans-item transliteration flex max-w-[72ch] flex-col gap-1 text-[clamp(0.86rem,0.82rem+0.16vw,0.94rem)] italic leading-[1.66] text-[color-mix(in_srgb,var(--text-primary)_80%,var(--text-secondary)_20%)] max-[640px]:text-[0.82rem] max-[640px]:leading-[1.56] max-[560px]:landscape:leading-[1.56]">
            {ayahTransliteration}
          </div>
        </div>
      )}

      {shouldShowVerseTranslation && (
        <div
          className={cn(
            "rd-translations mt-[0.18rem] flex flex-col gap-[0.62rem] rounded-[0.74rem] border py-[0.58rem] bg-[color-mix(in_srgb,rgba(var(--primary-rgb),0.05)_48%,transparent)] [font-family:var(--font-ui)]",
            "border-[rgba(var(--primary-rgb),0.18)] max-[640px]:rounded-[0.64rem] max-[640px]:py-[0.5rem]",
            "max-[560px]:landscape:gap-[0.42rem] max-[560px]:landscape:py-[0.44rem]",
            isRtl
              ? "pl-[0.72rem] pr-[0.76rem] [border-inline-start:0] [border-inline-end:2px_solid_rgba(var(--primary-rgb),0.24)] max-[640px]:pl-[0.52rem] max-[640px]:pr-[0.62rem] max-[560px]:landscape:pl-[0.5rem] max-[560px]:landscape:pr-[0.6rem]"
              : "pl-[0.76rem] pr-[0.72rem] [border-inline-start:2px_solid_rgba(var(--primary-rgb),0.28)] max-[640px]:pl-[0.62rem] max-[640px]:pr-[0.56rem] max-[560px]:landscape:pl-[0.6rem] max-[560px]:landscape:pr-[0.54rem]",
          )}
          dir="auto"
        >
          {trans.map((t, idx) => (
            <div
              key={t.edition?.identifier || idx}
              className={cn(
                "rd-trans-item flex max-w-[72ch] flex-col gap-1 text-[clamp(0.97rem,0.9rem+0.22vw,1.08rem)] leading-[1.78] text-[var(--text-secondary)] max-[640px]:text-[0.92rem] max-[640px]:leading-[1.66] max-[560px]:landscape:leading-[1.56]",
                riwaya === "warsh" && "[text-align:start] [unicode-bidi:isolate]",
              )}
            >
              {trans.length > 1 && (
                <div className="rd-trans-author text-[0.8rem] font-semibold uppercase tracking-[0.05em] text-[var(--text-muted)]">
                  {t.edition?.name || t.edition?.identifier}
                </div>
              )}
              <div>{t.text}</div>
            </div>
          ))}
        </div>
      )}

      <div className="rd-actions mt-2 flex flex-wrap items-center gap-2 max-[640px]:mt-[0.28rem] max-[640px]:gap-[0.34rem] max-[560px]:landscape:mt-[0.2rem] max-[560px]:landscape:gap-[0.24rem]">
        <AyahActions
          surah={surahNum}
          ayah={ayah.numberInSurah}
          ayahData={ayah}
          compact
        />

        {(isActive || memoLevel > 0) && (
          <div
            className={cn(
              "rd-action-meta rd-action-meta-stars flex gap-[0.15rem] font-[var(--font-ui)] text-[0.85rem] font-semibold text-[var(--text-muted)]",
              isRtl ? "mr-auto ml-0" : "ml-auto",
            )}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={(e) => handleStar(e, n)}
                className={cn(
                  "rd-star-btn cursor-pointer border-none bg-transparent p-0 leading-none text-[var(--border)] transition-colors",
                  n <= memoLevel && "is-on text-[var(--gold)]",
                )}
              >
                ★
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default AyahBlock;
