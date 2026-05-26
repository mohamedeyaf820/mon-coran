import React, { useState, useCallback, useEffect } from 'react';

/**
 * Displays Quran ayah text in memorization mode.
 * Words are hidden by default and can be revealed sequentially or by click.
 */
export default function MemorizationText({ text, lang = 'fr' }) {
  const words = text ? text.trim().split(/\s+/) : [];
  const [seqRevealed, setSeqRevealed] = useState(0);
  const [clickRevealed, setClickRevealed] = useState(new Set());

  // Reset when the ayah changes
  useEffect(() => {
    setSeqRevealed(0);
    setClickRevealed(new Set());
  }, [text]);

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
