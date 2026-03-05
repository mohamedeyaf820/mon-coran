import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getWordByWord } from '../../services/wordByWordService';
import { useApp } from '../../context/AppContext';
import audioService from '../../services/audioService';

/**
 * WordByWordDisplay - Displays ayah text with word-by-word breakdown
 * Each word shows: Arabic text, transliteration, and translation
 * Inspired by quranwbw.com design
 */
const WordByWordDisplay = React.memo(function WordByWordDisplay({
  surah,
  ayah,
  text,
  isPlaying,
  progress = 0,
  showTransliteration = true,
  showWordTranslation = true,
  fontSize = 28,
}) {
  const { state } = useApp();
  const { translationLang } = state;
  
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredWord, setHoveredWord] = useState(null);
  
  // Fetch word-by-word data
  useEffect(() => {
    let cancelled = false;
    
    async function fetchWords() {
      setLoading(true);
      setError(null);
      
      try {
        const wbwData = await getWordByWord(surah, ayah, translationLang);
        if (!cancelled) {
          setWords(wbwData);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load word-by-word:', err);
          setError(err.message);
          setLoading(false);
        }
      }
    }
    
    if (surah && ayah) {
      fetchWords();
    }
    
    return () => { cancelled = true; };
  }, [surah, ayah, translationLang]);
  
  // Calculate current word index based on progress
  const currentWordIdx = useMemo(() => {
    if (!isPlaying || words.length === 0) return -1;
    
    const idx = Math.floor(progress * words.length);
    return Math.min(idx, words.length - 1);
  }, [isPlaying, progress, words.length]);
  
  // Handle word click - play audio for that word
  const handleWordClick = useCallback((word, index) => {
    if (word.audioUrl) {
      // Play word audio
      const audio = new Audio(word.audioUrl);
      audio.play().catch(() => {});
    }
    setHoveredWord(index);
  }, []);
  
  // Fallback to simple text display if no WBW data
  if (loading) {
    return (
      <div className="wbw-display wbw-loading">
        <span className="wbw-text-fallback" style={{ fontSize: `${fontSize}px` }}>
          {text}
        </span>
        <span className="wbw-loading-indicator">
          <i className="fas fa-spinner fa-spin" />
        </span>
      </div>
    );
  }
  
  if (error || words.length === 0) {
    return (
      <span className="wbw-text-fallback" style={{ fontSize: `${fontSize}px` }}>
        {text}
      </span>
    );
  }
  
  return (
    <div className="wbw-display" dir="rtl">
      {words.map((word, i) => {
        const isRead = isPlaying && i < currentWordIdx;
        const isCurrent = isPlaying && i === currentWordIdx;
        const isHovered = hoveredWord === i;
        
        let wordClass = 'wbw-word-block';
        if (isRead) wordClass += ' wbw-read';
        else if (isCurrent) wordClass += ' wbw-current';
        if (isHovered) wordClass += ' wbw-hovered';
        
        return (
          <div
            key={word.id || i}
            className={wordClass}
            onClick={() => handleWordClick(word, i)}
            onMouseEnter={() => setHoveredWord(i)}
            onMouseLeave={() => setHoveredWord(null)}
          >
            {/* Arabic word */}
            <span 
              className="wbw-arabic"
              style={{ fontSize: `${fontSize}px` }}
            >
              {word.text}
            </span>
            
            {/* Transliteration */}
            {showTransliteration && word.transliteration && (
              <span className="wbw-transliteration">
                {word.transliteration}
              </span>
            )}
            
            {/* Word translation */}
            {showWordTranslation && word.translation && (
              <span className="wbw-translation">
                {word.translation}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
});

export default WordByWordDisplay;
