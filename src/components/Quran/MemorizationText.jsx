import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye, RotateCcw } from "lucide-react";

/**
 * Hides Quran words until the learner reveals them manually or starts audio.
 */
export default function MemorizationText({
  text,
  lang = "fr",
  isPlaying = false,
  repeatCount = 3,
}) {
  const words = useMemo(() => (text ? text.trim().split(/\s+/) : []), [text]);
  const [seqRevealed, setSeqRevealed] = useState(0);
  const [clickRevealed, setClickRevealed] = useState(new Set());
  const autoRevealTimer = useRef(null);
  const seqRevealedRef = useRef(0);

  useEffect(() => {
    seqRevealedRef.current = 0;
    setSeqRevealed(0);
    setClickRevealed(new Set());
    if (autoRevealTimer.current) {
      clearInterval(autoRevealTimer.current);
      autoRevealTimer.current = null;
    }
  }, [text]);

  useEffect(() => {
    if (!isPlaying || words.length === 0) {
      if (autoRevealTimer.current) {
        clearInterval(autoRevealTimer.current);
        autoRevealTimer.current = null;
      }
      return undefined;
    }

    const intervalMs = Math.max(1100, 2100 - Math.min(repeatCount, 10) * 60);
    autoRevealTimer.current = setInterval(() => {
      const next = seqRevealedRef.current + 1;
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
  }, [isPlaying, repeatCount, words.length]);

  const isRevealed = useCallback(
    (index) => index < seqRevealed || clickRevealed.has(index),
    [clickRevealed, seqRevealed],
  );
  const revealedCount = words.filter((_, index) => isRevealed(index)).length;
  const allRevealed = revealedCount === words.length;
  const progress = words.length
    ? Math.round((revealedCount / words.length) * 100)
    : 0;

  const revealNext = useCallback(
    () => setSeqRevealed((value) => Math.min(value + 1, words.length)),
    [words.length],
  );
  const revealAll = useCallback(() => setSeqRevealed(words.length), [words.length]);
  const reset = useCallback(() => {
    seqRevealedRef.current = 0;
    setSeqRevealed(0);
    setClickRevealed(new Set());
  }, []);

  const labels = {
    fr: {
      next: "Mot suivant",
      all: "Tout r\u00e9v\u00e9ler",
      reset: "R\u00e9initialiser",
      reveal: "R\u00e9v\u00e9ler le mot",
      progress: "Progression",
    },
    en: {
      next: "Next word",
      all: "Reveal all",
      reset: "Reset",
      reveal: "Reveal word",
      progress: "Progress",
    },
    ar: {
      next: "\u0627\u0644\u0643\u0644\u0645\u0629 \u0627\u0644\u062a\u0627\u0644\u064a\u0629",
      all: "\u0643\u0634\u0641 \u0627\u0644\u0643\u0644",
      reset: "\u0625\u0639\u0627\u062f\u0629",
      reveal: "\u0625\u0638\u0647\u0627\u0631 \u0627\u0644\u0643\u0644\u0645\u0629",
      progress: "\u0627\u0644\u062a\u0642\u062f\u0645",
    },
  };
  const currentLabels = labels[lang] || labels.fr;

  return (
    <div className="mem-container">
      <div className="mem-session" aria-label={currentLabels.progress}>
        <span className="mem-session__label">{currentLabels.progress}</span>
        <span className="mem-session__track" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </span>
        <span className="mem-counter" aria-live="polite">
          {revealedCount}/{words.length}
        </span>
      </div>

      <div className="mem-toolbar">
        <button className="mem-btn" onClick={revealNext} disabled={allRevealed}>
          <Eye size={13} />
          {currentLabels.next}
        </button>
        <button className="mem-btn" onClick={revealAll} disabled={allRevealed}>
          <Eye size={13} />
          {currentLabels.all}
        </button>
        <button
          className="mem-btn mem-btn--reset"
          onClick={reset}
          title={currentLabels.reset}
          aria-label={currentLabels.reset}
        >
          <RotateCcw size={13} />
        </button>
      </div>

      <div className="mem-words" dir="rtl">
        {words.map((word, index) => {
          const revealed = isRevealed(index);
          return (
            <button
              type="button"
              key={`${word}-${index}`}
              className={`mem-word ${revealed ? "mem-word--shown" : "mem-word--hidden"}`}
              onClick={() => {
                if (!revealed) {
                  setClickRevealed((value) => new Set([...value, index]));
                }
              }}
              disabled={revealed}
              aria-label={
                revealed ? undefined : `${currentLabels.reveal} ${index + 1}`
              }
              title={revealed ? undefined : currentLabels.reveal}
            >
              {revealed ? word : <span className="mem-mask">___</span>}
            </button>
          );
        })}
      </div>

    </div>
  );
}
