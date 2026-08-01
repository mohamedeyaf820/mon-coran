import React, { useCallback, useMemo, useState } from "react";
import { shallowEqual, useAppSelector } from "../../context/AppContext";
import QuranWord from "./QuranWord";
import AyahMarker from "./AyahMarker";
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
  const { fontFamily, lang, reciter, riwaya, wordTranslationLang } = useAppSelector(
    (state) => ({
      fontFamily: state.fontFamily,
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
  // Stable callback avoids a new inline arrow per word defeating QuranWord's React.memo
  const handleWordSelect = useCallback(
    (word, event) => handleWordClick(word, setSelectedWord, event),
    [handleWordClick],
  );
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
      <div className="wbw-display wbw-loading" dir="rtl" aria-busy="true" aria-label={lang === "ar" ? "جاري التحميل" : lang === "fr" ? "Chargement des mots" : "Loading words"}>
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
              fontFamily={fontFamily}
              lang={lang}
              onWordClick={handleWordSelect}
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
        <AyahMarker number={ayah} isPlaying={isPlaying} className="wbw-ayah-marker" />
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
    <div
      className="wbw-display wbw-study-grid"
      dir="rtl"
      role="group"
      aria-label={
        lang === "ar"
          ? `الآية ${ayah} كلمة بكلمة`
          : lang === "fr"
            ? `Verset ${ayah}, lecture mot à mot`
            : `Verse ${ayah}, word-by-word reading`
      }
      data-show-transliteration={showTransliteration ? "true" : "false"}
      data-show-translation={showWordTranslation ? "true" : "false"}
      data-translation-language={wordTranslationLang}
    >
      {displayWords.map((word, index) => {
        const wordId = word.id ?? `${surah}:${ayah}:${word.position ?? index}`;
        const isClickedWord = activeWordId === wordId;

        return (
          <QuranWord
            key={word.id ?? index}
            active={isClickedWord}
            current={isPlaying && index === currentWordIdx}
            fontSize={fontSize}
            fontFamily={fontFamily}
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
      <span
        className="wbw-verse-end"
        aria-label={
          lang === "fr"
            ? `Fin du verset ${ayah}`
            : lang === "ar"
              ? `نهاية الآية ${ayah}`
              : `End of verse ${ayah}`
        }
      >
        <span aria-hidden="true">•</span>
        {lang === "fr"
          ? `Verset ${ayah}`
          : lang === "ar"
            ? `الآية ${ayah}`
            : `Verse ${ayah}`}
      </span>
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
