import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  toggleId,
  ayahId,
  progress,
  fontSize,
  memMode,
}) {
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
      className={`rd-ayah${isPlaying ? " playing" : ""}${isActive ? " active" : ""}`}
      onClick={handleToggleActive}
      onKeyDown={handleToggleActiveFromKeyboard}
      tabIndex={0}
    >
      {/* ── Main content (Arabic + Num) ── */}
      <div className="rd-arabic qc-ayah-text-ar">
        {arabicContent}
        <span className="rd-ayah-end" aria-hidden="true">
          <span className="rd-ayah-end-glyph">۝</span>
          <span className="rd-ayah-end-num">{toAr(ayah.numberInSurah)}</span>
        </span>
      </div>

      {/* Warsh QCF4 mode note */}
      {!memMode && showWordByWord && ayah.warshWords?.length > 0 && (
        <div className="rd-warsh-note">
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

      {/* Transliteration */}
      {ayahTransliteration && (
        <div className="rd-translations rd-translations--tight">
          <div className="rd-trans-item transliteration">{ayahTransliteration}</div>
        </div>
      )}

      {/* Translation */}
      {shouldShowVerseTranslation && (
        <div className="rd-translations" dir="auto">
          {trans.map((t, idx) => (
            <div key={t.edition?.identifier || idx} className="rd-trans-item">
              {trans.length > 1 && (
                <div className="rd-trans-author">
                  {t.edition?.name || t.edition?.identifier}
                </div>
              )}
              <div>{t.text}</div>
            </div>
          ))}
        </div>
      )}

      <div className="rd-actions">
        {/* Actions button group (bookmark, play) */}
        <AyahActions
          surah={surahNum}
          ayah={ayah.numberInSurah}
          ayahData={ayah}
          compact
        />
        {/* Play shortcut logic is also handled in AyahActions, so we can keep it clean.*/}
        
        {/* Memorization stars */}
        {(isActive || memoLevel > 0) && (
          <div className="rd-action-meta rd-action-meta-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={(e) => handleStar(e, n)}
                className={`rd-star-btn${n <= memoLevel ? " is-on" : ""}`}
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
