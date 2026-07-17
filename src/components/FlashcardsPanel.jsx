import React, { useState, useCallback, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useApp } from "../context/AppContext";
import { Icon } from "./ui/icon";
import { VOCAB } from "../data/vocabFlashcards";


function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function FlashcardsPanel() {
  const { state, dispatch } = useApp();
  const { lang } = state;

  const [deck, setDeck] = useState(() => shuffle(VOCAB));
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [score, setScore] = useState(() => {
    try {
      const saved = localStorage.getItem("flashcards-score");
      return saved ? JSON.parse(saved) : { correct: 0, wrong: 0 };
    } catch {
      return { correct: 0, wrong: 0 };
    }
  });
  const [done, setDone] = useState(false);

  const close = () =>
    dispatch({ type: "SET", payload: { flashcardsOpen: false } });

  // Persist score to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("flashcards-score", JSON.stringify(score));
    } catch {
      // localStorage unavailable — silently ignore
    }
  }, [score]);

  const total = deck.length;
  const card = deck[idx];
  const answer = useCallback(
    (correct) => {
      setScore((s) => ({
        ...s,
        [correct ? "correct" : "wrong"]: s[correct ? "correct" : "wrong"] + 1,
      }));
      if (idx >= total - 1) {
        setDone(true);
      } else {
        setIdx((i) => i + 1);
        setFlipped(false);
      }
    },
    [idx, total],
  );

  // Guard: if deck is somehow empty, show a fallback
  if (deck.length === 0) {
    return (
      <Dialog.Root
        open
        onOpenChange={(o) => {
          if (!o) close();
        }}
      >
        <Dialog.Portal>
          <div className="modal-overlay !p-3 sm:!p-5" onClick={close}>
            <Dialog.Content
              className="modal-panel fc-panel !w-full !max-w-2xl !overflow-hidden !rounded-3xl !border !border-[var(--border)] !bg-[var(--bg-card)] !backdrop-blur-xl !shadow-[0_36px_90px_rgba(1,8,22,0.64)]"
              onClick={(event) => event.stopPropagation()}
              onEscapeKeyDown={(event) => {
                event.preventDefault();
                close();
              }}
              onInteractOutside={close}
            >
              <Dialog.Title className="sr-only">
                {lang === "ar" ? "تعديل البطاقات التعليمية" : lang === "en" ? "Edit flashcards" : "Modifier les flashcards"}
              </Dialog.Title>
              <div className="modal-header !border-b !border-[var(--border)] !bg-[var(--bg-secondary)]">
                <div className="modal-title !inline-flex !items-center !gap-2 !text-white">
                  <Icon name="layer-group" size={18} />
                  {lang === "fr"
                    ? "Flashcards"
                    : lang === "ar"
                      ? "بطاقات تعليمية"
                      : "Vocabulary Cards"}
                </div>
                <button
                  className="modal-close !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-[var(--border)] !bg-white/[0.04] hover:!bg-white/[0.1]"
                  onClick={close}
                  type="button"
                  aria-label={lang === "fr" ? "Fermer" : "Close"}
                >
                  <Icon name="xmark" size={18} />
                </button>
              </div>
              <div className="fc-done !space-y-3 !p-5 !text-center">
                <div className="fc-done__trophy">📭</div>
                <h3>
                  {lang === "fr"
                    ? "Aucune carte disponible"
                    : lang === "ar"
                      ? "لا توجد بطاقات"
                      : "No cards available"}
                </h3>
              </div>
            </Dialog.Content>
          </div>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  const restart = () => {
    setDeck(shuffle(VOCAB));
    setIdx(0);
    setFlipped(false);
    const fresh = { correct: 0, wrong: 0 };
    setScore(fresh);
    try {
      localStorage.setItem("flashcards-score", JSON.stringify(fresh));
    } catch {
      /* ignore */
    }
    setDone(false);
  };

  return (
    <Dialog.Root
      open
      onOpenChange={(o) => {
        if (!o) close();
      }}
    >
      <Dialog.Portal>
        <div className="modal-overlay !p-3 sm:!p-5" onClick={close}>
          <Dialog.Content
            className="modal-panel fc-panel !w-full !max-w-2xl !overflow-hidden !rounded-3xl !border !border-[var(--border)] !bg-[var(--bg-card)] !backdrop-blur-xl !shadow-[0_36px_90px_rgba(1,8,22,0.64)]"
            aria-label={
              lang === "fr" ? "Flashcards vocabulaire" : "Vocabulary Flashcards"
            }
            onClick={(event) => event.stopPropagation()}
            onEscapeKeyDown={(event) => {
              event.preventDefault();
              close();
            }}
            onInteractOutside={close}
          >
            <Dialog.Title className="sr-only">
              {lang === "ar" ? "بطاقات تعليمية" : lang === "en" ? "Vocabulary flashcards" : "Flashcards de vocabulaire"}
            </Dialog.Title>
            {/* Header */}
            <div className="modal-header !border-b !border-[var(--border)] !bg-[var(--bg-secondary)]">
              <div className="modal-title !inline-flex !items-center !gap-2 !text-white">
                <Icon name="layer-group" size={18} />
                {lang === "fr"
                  ? "Flashcards"
                  : lang === "ar"
                    ? "بطاقات تعليمية"
                    : "Vocabulary Cards"}
              </div>
              <button
                className="modal-close !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-[var(--border)] !bg-white/[0.04] hover:!bg-white/[0.1]"
                onClick={close}
                type="button"
                aria-label={lang === "fr" ? "Fermer" : "Close"}
              >
                <Icon name="xmark" size={18} />
              </button>
            </div>

            {done ? (
              <div className="fc-done !space-y-3 !p-5 !text-center">
                <div className="fc-done__trophy">🏆</div>
                <h3>
                  {lang === "fr"
                    ? "Session terminée !"
                    : lang === "ar"
                      ? "انتهت الجلسة!"
                      : "Session complete!"}
                </h3>
                <div className="fc-done__stats">
                  <span className="fc-stat correct">
                    <Icon name="check" size={15} /> {score.correct}
                  </span>
                  <span className="fc-stat wrong">
                    <Icon name="xmark" size={15} /> {score.wrong}
                  </span>
                </div>
                <div className="fc-done__pct">
                  {Math.round((score.correct / total) * 100)}%{" "}
                  {lang === "fr"
                    ? "de réussite"
                    : lang === "ar"
                      ? "نجاح"
                      : "success rate"}
                </div>
                <button
                  className="fc-restart-btn !inline-flex !items-center !gap-2 !rounded-xl !bg-sky-500/80 !px-4 !py-2.5 !font-semibold !text-white hover:!bg-sky-500"
                  onClick={restart}
                >
                  <Icon name="rotate-right" size={16} />
                  {lang === "fr"
                    ? "Recommencer"
                    : lang === "ar"
                      ? "إعادة"
                      : "Restart"}
                </button>
              </div>
            ) : (
              <>
                {/* Progress bar */}
                <div className="fc-progress-bar">
                  <div
                    className="fc-progress-fill"
                    style={{ width: `${(idx / total) * 100}%` }}
                  />
                </div>
                <div className="fc-count">
                  {idx + 1} / {total}
                </div>

                {/* Card */}
                <div
                  className="fc-card-wrap !px-4 !pt-2"
                  onClick={() => setFlipped((f) => !f)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setFlipped((value) => !value);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={flipped}
                  aria-label={
                    lang === "ar"
                      ? "قلب بطاقة المفردات"
                      : lang === "en"
                        ? "Flip vocabulary card"
                        : "Retourner la carte de vocabulaire"
                  }
                >
                  <div
                    className={`fc-card ${flipped ? "fc-card--flipped" : ""}`}
                  >
                    <div className="fc-card__front">
                      <div className="fc-card__arabic">{card.ar}</div>
                      <div className="fc-card__hint">
                        {lang === "fr"
                          ? "Appuyez pour voir"
                          : lang === "ar"
                            ? "اضغط للكشف"
                            : "Tap to reveal"}
                      </div>
                    </div>
                    <div className="fc-card__back">
                      <div className="fc-card__translation">
                        {lang === "ar"
                          ? card.en
                          : lang === "fr"
                            ? card.fr
                            : card.en}
                      </div>
                      <div className="fc-card__root">
                        <span className="fc-card__root-label">
                          {lang === "fr" ? "Racine" : "Root"}
                        </span>
                        <span className="fc-card__root-val">{card.root}</span>
                      </div>
                      {card.freq > 0 && (
                        <div className="fc-card__freq">
                          ×{card.freq.toLocaleString()}{" "}
                          {lang === "fr"
                            ? "fois dans le Coran"
                            : "times in Quran"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Score + actions */}
                <div className="fc-score-row !mt-4 !flex !items-center !justify-center !gap-3">
                  <span className="fc-stat correct">
                    <Icon name="check" size={15} /> {score.correct}
                  </span>
                  <span className="fc-stat wrong">
                    <Icon name="xmark" size={15} /> {score.wrong}
                  </span>
                </div>
                {flipped && (
                  <div className="fc-actions !mt-3 !flex !items-center !justify-center !gap-2 !pb-4">
                    <button
                      className="fc-btn fc-btn--wrong !inline-flex !items-center !gap-2 !rounded-xl !border !border-red-300/20 !bg-red-500/10 !px-3.5 !py-2 !text-red-100 hover:!bg-red-500/20"
                      onClick={() => answer(false)}
                    >
                      <Icon name="xmark" size={15} />
                      {lang === "fr"
                        ? "À revoir"
                        : lang === "ar"
                          ? "مراجعة"
                          : "Review"}
                    </button>
                    <button
                      className="fc-btn fc-btn--correct !inline-flex !items-center !gap-2 !rounded-xl !border !border-emerald-300/20 !bg-emerald-500/10 !px-3.5 !py-2 !text-emerald-100 hover:!bg-emerald-500/20"
                      onClick={() => answer(true)}
                    >
                      <Icon name="check" size={15} />
                      {lang === "fr"
                        ? "Connu !"
                        : lang === "ar"
                          ? "أعرفه"
                          : "Got it!"}
                    </button>
                  </div>
                )}
              </>
            )}
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
