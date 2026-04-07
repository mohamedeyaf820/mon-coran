import React from "react";

export default function WordByWordAnalysisOverlay({
  lang,
  onClose,
  onReplay,
  selectedWord,
}) {
  if (!selectedWord) return null;

  return (
    <div className="wbw-analysis-overlay" onClick={onClose}>
      <div className="wbw-analysis-card" onClick={(event) => event.stopPropagation()}>
        <div className="wbw-analysis-header">
          <span className="wbw-analysis-arabic">{selectedWord.text}</span>
          <button className="wbw-close-btn" onClick={onClose}>
            {"\u00d7"}
          </button>
        </div>
        <div className="wbw-analysis-body">
          <div className="wbw-analysis-section">
            <span className="wbw-label">{lang === "fr" ? "Traduction" : "Translation"}</span>
            <span className="wbw-value">{selectedWord.translation}</span>
          </div>
          <div className="wbw-analysis-section">
            <span className="wbw-label">
              {lang === "fr" ? "Translitt\u00e9ration" : "Transliteration"}
            </span>
            <span className="wbw-value">{selectedWord.transliteration}</span>
          </div>
          {selectedWord.root ? (
            <div className="wbw-analysis-section">
              <span className="wbw-label">{lang === "fr" ? "Racine" : "Root"}</span>
              <span className="wbw-value wbw-root">{selectedWord.root}</span>
            </div>
          ) : null}
          {selectedWord.grammar ? (
            <div className="wbw-analysis-section">
              <span className="wbw-label">{lang === "fr" ? "Grammaire" : "Grammar"}</span>
              <span className="wbw-value wbw-grammar">{selectedWord.grammar}</span>
            </div>
          ) : null}
        </div>
        <div className="wbw-analysis-footer">
          <button className="wbw-audio-btn" onClick={onReplay}>
            <i className="fas fa-play"></i> {lang === "fr" ? "\u00c9couter" : "Listen"}
          </button>
        </div>
      </div>
    </div>
  );
}
