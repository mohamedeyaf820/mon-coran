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
import audioService from "../../services/audioService";

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
    Array.isArray(trans) &&
    trans.length > 0 &&
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
      className={`rd-ayah${isPlaying ? " playing" : ""}${isActive ? " active" : ""}`}
      onClick={onToggleActive}
      tabIndex={0}
    >
      {/* ── Main content (Arabic + Num) ── */}
      <div
        className="rd-arabic"
        onClick={(event) => {
          event.stopPropagation();
          if (!audioService.playlist?.length) {
            window.dispatchEvent(new CustomEvent("mushaf:play-surah"));
            window.setTimeout(() => {
              audioService.playAyah(surahNum, ayah.numberInSurah);
            }, 120);
            return;
          }
          audioService.playAyah(surahNum, ayah.numberInSurah);
        }}
      >
        {arabicContent}
        <span className="rd-ayah-end">
          <svg viewBox="0 0 40 40">
             <path fill="currentColor" d="M20,1.2C9.6,1.2,1.2,9.6,1.2,20s8.4,18.8,18.8,18.8S38.8,30.4,38.8,20S30.4,1.2,20,1.2z M20,36.5c-9.1,0-16.5-7.4-16.5-16.5S10.9,3.5,20,3.5S36.5,10.9,36.5,20S29.1,36.5,20,36.5z" />
             <path fill="currentColor" d="M20,6.5c-7.4,0-13.5,6.1-13.5,13.5S12.6,33.5,20,33.5S33.5,27.4,33.5,20S27.4,6.5,20,6.5z M20,31.2c-6.1,0-11.2-5.1-11.2-11.2S13.9,8.8,20,8.8S31.2,13.9,31.2,20S26.1,31.2,20,31.2z" />
          </svg>
          <span className="rd-ayah-end-num">{toAr(ayah.numberInSurah)}</span>
        </span>
      </div>

      {/* Warsh QCF4 mode note */}
      {!memMode && showWordByWord && ayah.warshWords?.length > 0 && (
        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
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
        <div className="rd-translations" style={{ marginBottom: "0" }}>
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
          <div className="rd-action-meta" style={{ display: "flex", gap: "0.15rem", fontSize: "1rem" }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={(e) => handleStar(e, n)}
                style={{
                   background: "none", border: "none", cursor: "pointer",
                   color: n <= memoLevel ? "var(--gold)" : "var(--border)",
                   padding: "0"
                }}
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
