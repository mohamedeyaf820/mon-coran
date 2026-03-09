import React from "react";
import { toAr } from "../../data/surahs";
import { t } from "../../i18n";
import { arabicToLatin } from "../../data/transliteration";
import AyahActions from "../AyahActions";
import SmartAyahRenderer from "./SmartAyahRenderer";
import WordByWordDisplay from "./WordByWordDisplay";
import MemorizationText from "./MemorizationText";

/**
 * AyahBlock component – renders a single Arabic verse with a polished design.
 * Translation display has been removed; the Arabic text is the sole focus.
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
  const ayahTransliteration =
    showTransliteration && !showWordByWord
      ? arabicToLatin(transliterationSource, riwaya)
      : "";

  const arabicContent = memMode ? (
    <MemorizationText text={ayah.hafsText || ayah.text} lang={lang} />
  ) : showWordByWord && !(ayah.warshWords?.length > 0) ? (
    <WordByWordDisplay
      surah={surahNum}
      ayah={ayah.numberInSurah}
      text={ayah.text}
      isPlaying={isPlaying}
      progress={progress}
      showTransliteration={showTransliteration}
      showWordTranslation={showWordTranslation}
      fontSize={fontSize}
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

  return (
    <div
      id={ayahId}
      role="listitem"
      aria-label={`${t("quran.ayah", lang)} ${ayah.numberInSurah}`}
      aria-current={isPlaying ? "true" : undefined}
      className={`qc-ayah-block${isPlaying ? " is-playing" : ""}${isActive ? " is-active" : ""}`}
      onClick={onToggleActive}
      tabIndex={0}
    >
      <div className="qc-ayah-container">
        {/* ── Verse number badge ── */}
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
        </div>

        {/* ── Main content ── */}
        <div className="qc-ayah-content">
          {/* Arabic text — full width, beautifully rendered */}
          <div className="qc-ayah-text-ar">{arabicContent}</div>

          {/* Transliteration (optional, shown below Arabic) */}
          {ayahTransliteration && (
            <div className="qc-ayah-transliteration">{ayahTransliteration}</div>
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
