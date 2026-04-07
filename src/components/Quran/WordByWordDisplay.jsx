import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import TajweedText from "./TajweedText";
import useWordByWordDisplay from "./useWordByWordDisplay";
import WordByWordAnalysisOverlay from "./WordByWordAnalysisOverlay";

const WordByWordDisplay = React.memo(function WordByWordDisplay({
  surah,
  ayah,
  isPlaying,
  showTransliteration = true,
  showWordTranslation = true,
  fontSize = 28,
  showTajwid = true,
  calibration,
  text,
}) {
  const { state } = useApp();
  const [selectedWord, setSelectedWord] = useState(null);
  const { currentWordIdx, error, handleWordClick, loading, words } =
    useWordByWordDisplay({
      ayah,
      calibration,
      isPlaying,
      reciter: state.reciter,
      riwaya: state.riwaya,
      surah,
      wordTranslationLang: state.wordTranslationLang,
    });

  if (loading) {
    return (
      <div className="wbw-display wbw-loading">
        {text ? (
          <span className="wbw-text-fallback" style={{ fontSize: `${fontSize}px` }}>
            {text}
          </span>
        ) : null}
        <span className="wbw-loading-indicator">
          <i className="fas fa-spinner fa-spin" />
        </span>
      </div>
    );
  }

  if (error || words.length === 0) {
    return (
      <span className="wbw-text-fallback" style={{ fontSize: `${fontSize}px` }}>
        {text || ""}
      </span>
    );
  }

  return (
    <div className="wbw-display" dir="rtl">
      {words.map((word, index) => {
        const currentClass =
          isPlaying && index < currentWordIdx
            ? " wbw-read"
            : isPlaying && index === currentWordIdx
              ? " wbw-current"
              : "";

        return (
          <div
            key={word.id ?? index}
            className={`wbw-word-block${currentClass}`}
            onClick={() => handleWordClick(word, setSelectedWord)}
          >
            <span className="wbw-arabic" style={{ fontSize: `${fontSize}px` }}>
              <TajweedText
                text={word.text}
                enabled={showTajwid}
                riwaya={state.riwaya}
                tajweedColors={null}
              />
            </span>
            {showTransliteration && word.transliteration ? (
              <span className="wbw-transliteration" dir="ltr">
                {word.transliteration}
              </span>
            ) : null}
            {showWordTranslation && word.translation ? (
              <span className="wbw-translation">{word.translation}</span>
            ) : null}
          </div>
        );
      })}
      <WordByWordAnalysisOverlay
        lang={state.lang}
        onClose={() => setSelectedWord(null)}
        onReplay={() => handleWordClick(selectedWord, setSelectedWord)}
        selectedWord={selectedWord}
      />
    </div>
  );
});

export default WordByWordDisplay;
