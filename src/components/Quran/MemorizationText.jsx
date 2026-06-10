import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';

/**
 * Displays Quran ayah text in memorization mode.
 * Words are hidden by default and can be revealed sequentially or by click.
 * When `isPlaying` is true, words auto-reveal progressively over the repeat cycle.
 */
export default function MemorizationText({ text, lang = 'fr', isPlaying = false, repeatCount = 3 }) {
  const words = useMemo(() => (text ? text.trim().split(/\s+/) : []), [text]);
  const [seqRevealed, setSeqRevealed] = useState(0);
  const [clickRevealed, setClickRevealed] = useState(new Set());
  const autoRevealTimer = useRef(null);
  const seqRevealedRef = useRef(0);

  // Reset when the ayah changes
  useEffect(() => {
    seqRevealedRef.current = 0;
    setSeqRevealed(0);
    setClickRevealed(new Set());
    if (autoRevealTimer.current) {
      clearInterval(autoRevealTimer.current);
      autoRevealTimer.current = null;
    }
  }, [text]);

  // Auto-reveal words when playing (memorization + audio sync)
  useEffect(() => {
    if (!isPlaying || words.length === 0) {
      if (autoRevealTimer.current) {
        clearInterval(autoRevealTimer.current);
        autoRevealTimer.current = null;
      }
      return;
    }

    // Reveal words progressively over the repeat duration.
    // Each repeat reveals a chunk of words. With N repeats and W words,
    // we reveal ceil(W/N) words per repeat, spaced evenly over ~2.5s per word.
    const wordsPerChunk = Math.max(1, Math.ceil(words.length / Math.max(1, repeatCount)));
    const intervalMs = 1800; // Reveal a word every 1.8s when playing

    autoRevealTimer.current = setInterval(() => {
      const next = seqRevealedRef.current + 1;
      // Clear interval synchronously before state update to avoid extra ticks
      if (next >= words.length) {
        clearInterval(autoRevealTimer.current);
        autoRevealTimer.current = null;
      }
      seqRevealedRef.current = next;
      setSeqRevealed(Math.min(next, words.length));
    }, intervalMs);

    return () => {
      if (autoRevealTimer.current) {
        clearInterval(autoRevealTimer.current);
        autoRevealTimer.current = null;
      }
    };
  }, [isPlaying, words.length, repeatCount]);

  const isRevealed = (i) => i < seqRevealed || clickRevealed.has(i);
  const revealedCount = words.filter((_, i) => isRevealed(i)).length;
  const allRevealed = revealedCount === words.length;

  const revealNext = useCallback(() => setSeqRevealed(p => Math.min(p + 1, words.length)), [words.length]);
  const revealAll = useCallback(() => setSeqRevealed(words.length), [words.length]);
  const reset = useCallback(() => { setSeqRevealed(0); setClickRevealed(new Set()); }, []);

  const handleWordClick = useCallback((i) => {
    if (!isRevealed(i)) setClickRevealed(p => new Set([...p, i]));
  }, [seqRevealed, clickRevealed]);

  const labels = {
    fr: { next: 'Mot suivant', all: 'Tout révéler', reset: 'Réinitialiser' },
    en: { next: 'Next word', all: 'Reveal all', reset: 'Reset' },
    ar: { next: 'الكلمة التالية', all: 'كشف الكل', reset: 'إعادة' },
  };
  const lbl = labels[lang] || labels.fr;

  return (
    <div className="mem-container">
      <div className="mem-words" dir="rtl">
        {words.map((word, i) => {
          const revealed = isRevealed(i);
          return (
            <span
              key={i}
              className={`mem-word ${revealed ? 'mem-word--shown' : 'mem-word--hidden'}`}
              onClick={() => handleWordClick(i)}
              title={!revealed ? (lang === 'fr' ? 'Cliquer pour révéler' : 'Click to reveal') : undefined}
            >
              {revealed
                ? word
                : <span className="mem-mask">▁▁▁</span>
              }
            </span>
          );
        })}
      </div>
      <div className="mem-toolbar">
        <span className="mem-counter">{revealedCount}/{words.length}</span>
        <button className="mem-btn" onClick={revealNext} disabled={allRevealed}>
          <i className="fas fa-eye-slash" />
          {lbl.next}
        </button>
        <button className="mem-btn" onClick={revealAll} disabled={allRevealed}>
          <i className="fas fa-eye" />
          {lbl.all}
        </button>
        <button className="mem-btn mem-btn--reset" onClick={reset} title={lbl.reset}>
          <i className="fas fa-redo" />
        </button>
      </div>
    </div>
  );
}
