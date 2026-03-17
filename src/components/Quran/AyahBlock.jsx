import React, { useState, useEffect, useCallback } from "react";
import { toAr } from "../../data/surahs";
import { t } from "../../i18n";
import { arabicToLatin } from "../../data/transliteration";
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
  ayahId,
  progress,
  fontSize,
  memMode,
  mushafLayout,
}) {
  const transliterationSource =
    riwaya === "warsh" && ayah.hafsText ? ayah.hafsText : ayah.text;
  // Warsh mode: transliteration not reliable — hide it, show translation only
  const ayahTransliteration =
    showTransliteration && !showWordByWord && riwaya !== "warsh"
      ? arabicToLatin(transliterationSource, riwaya)
      : "";

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

  const arabicContent = memMode ? (
    <MemorizationText text={ayah.hafsText || ayah.text} lang={lang} />
  ) : showWordByWord && !(ayah.warshWords?.length > 0) ? (
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
  ) : (
    <SmartAyahRenderer
      ayah={ayah}
      showTajwid={showTajwid}
      isPlaying={isPlaying}
      surahNum={surahNum}
      calibration={calibration}
      riwaya={riwaya}
    />
  );

  const shouldShowVerseTranslation =
    showTranslation &&
    trans?.text &&
    !(riwaya === "warsh" && showWordByWord);

  return (
    <div
      id={ayahId}
      data-surah-number={surahNum}
      data-ayah-number={ayah.numberInSurah}
      data-ayah-global={ayah.number}
      role="listitem"
      aria-label={`${t("quran.ayah", lang)} ${ayah.numberInSurah}`}
      aria-current={isPlaying ? "true" : undefined}
      className={`qc-ayah-block${isPlaying ? " is-playing" : ""}${isActive ? " is-active" : ""}`}
      onClick={onToggleActive}
      tabIndex={0}
    >
      <div className="qc-ayah-container">
        {/* ── Verse number badge + memorization stars ── */}
        <div className="qc-ayah-sidebar">
          <div className="qc-ayah-num-wrapper">
            <span className="qc-ayah-num-ornament" aria-hidden="true">
              &#xFD3E;
            </span>
            <span className="qc-ayah-num">{toAr(ayah.numberInSurah)}</span>
            <span className="qc-ayah-num-ornament" aria-hidden="true">
              &#xFD3F;
            </span>
          </div>
          {/* ★ Memorization stars — shown on active or when level > 0 */}
          {(isActive || memoLevel > 0) && (
            <div
              className="qc-memo-stars"
              aria-label={`Mémorisation: ${memoLevel}/5`}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  className={`qc-memo-star${n <= memoLevel ? " filled" : ""}`}
                  onClick={(e) => handleStar(e, n)}
                  aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
                  title={`Niveau ${n}`}
                >
                  ★
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Main content ── */}
        <div className="qc-ayah-content">
          {/* Arabic text — full width, beautifully rendered */}
          <div className="qc-ayah-text-ar">{arabicContent}</div>

          {/* Warsh QCF4 mode: WBW not available — inform user */}
          {!memMode && showWordByWord && ayah.warshWords?.length > 0 && (
            <div className="qc-wbw-warsh-note">
              <i className="fas fa-info-circle" />
              <span>
                {lang === "fr"
                  ? "Mot à mot non disponible en mode Warsh QCF4"
                  : lang === "ar"
                    ? "الكلمة بكلمة غير متاحة في رواية ورش QCF4"
                    : "Word-by-word unavailable in Warsh QCF4 mode"}
              </span>
            </div>
          )}

          {/* Transliteration (optional, shown below Arabic) */}
          {ayahTransliteration && (
            <div className="qc-ayah-transliteration">{ayahTransliteration}</div>
          )}

          {/* Translation (optional, shown when enabled) */}
          {shouldShowVerseTranslation && (
            <div className="qc-ayah-translation" dir="auto">
              {trans.text}
            </div>
          )}
        </div>
      </div>

      {/* ── Expanded actions panel ── */}
      {isActive && (
        <div className="qc-ayah-actions-panel">
          <AyahActions
            surah={surahNum}
            ayah={ayah.numberInSurah}
            ayahData={ayah}
          />
        </div>
      )}
    </div>
  );
});

export default AyahBlock;
