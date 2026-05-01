import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import QuranWord from "./QuranWord";
import useWordByWordDisplay from "./useWordByWordDisplay";
import WordByWordAnalysisOverlay from "./WordByWordAnalysisOverlay";

const WordByWordDisplay = React.memo(function WordByWordDisplay({
  surah,
  ayah,
  isPlaying,
  showTransliteration = true,
  showWordTranslation = true,
  fontSize = 28,
  initialWords,
  showTajwid = true,
  calibration,
  text,
}) {
  const { state } = useApp();
  const [selectedWord, setSelectedWord] = useState(null);
  const { activeWordId, currentWordIdx, error, handleWordClick, loading, words } =
    useWordByWordDisplay({
      ayah,
      calibration,
      initialWords,
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
        const wordId = word.id ?? `${surah}:${ayah}:${word.position ?? index}`;
        const isClickedWord = activeWordId === wordId;

        return (
          <QuranWord
            key={word.id ?? index}
            active={isClickedWord}
            current={isPlaying && index === currentWordIdx}
            fontSize={fontSize}
            lang={state.lang}
            onSelect={(event) => handleWordClick(word, setSelectedWord, event)}
            read={isPlaying && index < currentWordIdx}
            riwaya={state.riwaya}
            showTajwid={showTajwid}
            showTransliteration={showTransliteration}
            showWordTranslation={showWordTranslation}
            word={word}
            wordId={String(wordId)}
          />
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
