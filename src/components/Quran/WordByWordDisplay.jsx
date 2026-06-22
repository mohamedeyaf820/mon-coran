import React, { useMemo, useState } from "react";
import { shallowEqual, useAppSelector } from "../../context/AppContext";
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
  inline = false,
}) {
  const { lang, reciter, riwaya, wordTranslationLang } = useAppSelector(
    (state) => ({
      lang: state.lang,
      reciter: state.reciter,
      riwaya: state.riwaya,
      wordTranslationLang: state.wordTranslationLang,
    }),
    shallowEqual,
  );
  const [selectedWord, setSelectedWord] = useState(null);
  const { activeWordId, currentWordIdx, error, handleWordClick, loading, words } =
    useWordByWordDisplay({
      ayah,
      calibration,
      initialWords,
      isPlaying,
      reciter,
      riwaya,
      surah,
      wordTranslationLang,
    });
  const fallbackWords = useMemo(() => {
    if (!text || typeof text !== "string") return [];
    return text
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((wordText, index) => ({
        id: `${surah}:${ayah}:fallback:${index + 1}`,
        position: index + 1,
        text: wordText,
        textQpcHafs: wordText,
      }));
  }, [ayah, surah, text]);
  const displayWords = words.length > 0 ? words : fallbackWords;

  if (loading && fallbackWords.length === 0) {
    const skeletonCount = text ? text.trim().split(/\s+/).length : 5;
    return (
      <div className="wbw-display wbw-loading" dir="rtl" aria-busy="true" aria-label={lang === "ar" ? "جاري التحميل" : "Loading"}>
        <div className="wbw-skeleton-row">
          {Array.from({ length: Math.min(skeletonCount, 12) }, (_, i) => (
            <div key={i} className="wbw-skeleton-word">
              <div className="wbw-skeleton-pulse wbw-skeleton-arabic" />
              {showTransliteration && <div className="wbw-skeleton-pulse wbw-skeleton-translit" />}
              {showWordTranslation && <div className="wbw-skeleton-pulse wbw-skeleton-meaning" />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if ((error || words.length === 0) && displayWords.length === 0) {
    return (
      <span className="wbw-text-fallback" style={{ fontSize: `${fontSize}px` }}>
        {text || ""}
      </span>
    );
  }

  if (inline) {
    return (
      <span className="wbw-display-inline inline" dir="rtl">
        {displayWords.map((word, index) => {
          const wordId = word.id ?? `${surah}:${ayah}:${word.position ?? index}`;
          const isClickedWord = activeWordId === wordId;

          return (
            <QuranWord
              key={word.id ?? index}
              active={isClickedWord}
              current={isPlaying && index === currentWordIdx}
              fontSize={fontSize}
              lang={lang}
              onSelect={(event) => handleWordClick(word, setSelectedWord, event)}
              read={isPlaying && index < currentWordIdx}
              riwaya={riwaya}
              showTajwid={showTajwid}
              showTransliteration={showTransliteration}
              showWordTranslation={showWordTranslation}
              word={word}
              wordId={String(wordId)}
              inline={true}
            />
          );
        })}
        <WordByWordAnalysisOverlay
          lang={lang}
          onClose={() => setSelectedWord(null)}
          onReplay={() => handleWordClick(selectedWord, setSelectedWord)}
          selectedWord={selectedWord}
        />
      </span>
    );
  }

  return (
    <div className="wbw-display" dir="rtl">
        {displayWords.map((word, index) => {
        const wordId = word.id ?? `${surah}:${ayah}:${word.position ?? index}`;
        const isClickedWord = activeWordId === wordId;

        return (
          <QuranWord
            key={word.id ?? index}
            active={isClickedWord}
            current={isPlaying && index === currentWordIdx}
            fontSize={fontSize}
            lang={lang}
            onSelect={(event) => handleWordClick(word, setSelectedWord, event)}
            read={isPlaying && index < currentWordIdx}
            riwaya={riwaya}
            showTajwid={showTajwid}
            showTransliteration={showTransliteration}
            showWordTranslation={showWordTranslation}
            word={word}
            wordId={String(wordId)}
            inline={false}
          />
        );
      })}
      <WordByWordAnalysisOverlay
        lang={lang}
        onClose={() => setSelectedWord(null)}
        onReplay={() => handleWordClick(selectedWord, setSelectedWord)}
        selectedWord={selectedWord}
      />
    </div>
  );
});

export default WordByWordDisplay;
