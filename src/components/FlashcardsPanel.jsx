/**
 * FlashcardsPanel — Vocabulary flashcards for frequent Quranic words
 * 100 most-frequent words with Arabic, transliteration, French/English translation and root
 */
import React, { useState, useCallback, useEffect } from "react";
import { useApp } from "../context/AppContext";
import "../styles/index.css";

/* ── Static dataset: top-100 most frequent Quranic words ── */
const VOCAB = [
  {
    ar: "اللَّهُ",
    root: "أله",
    fr: "Allah (Dieu)",
    en: "Allah (God)",
    freq: 2699,
  },
  { ar: "رَبِّ", root: "ربب", fr: "Seigneur", en: "Lord", freq: 980 },
  { ar: "يَوْمِ", root: "يوم", fr: "Jour", en: "Day", freq: 475 },
  {
    ar: "إِنَّ",
    root: "أنن",
    fr: "Certes / En vérité",
    en: "Indeed / Verily",
    freq: 1621,
  },
  { ar: "الَّذِينَ", root: "ذا", fr: "Ceux qui", en: "Those who", freq: 985 },
  { ar: "مَا", root: "ما", fr: "Ce qui / Non", en: "What / Not", freq: 2235 },
  { ar: "وَ", root: "و", fr: "Et", en: "And", freq: 29872 },
  { ar: "فِي", root: "في", fr: "Dans / En", en: "In", freq: 1696 },
  { ar: "مِنْ", root: "من", fr: "De / Parmi", en: "From / Of", freq: 2935 },
  { ar: "عَلَى", root: "على", fr: "Sur", en: "Upon", freq: 1318 },
  { ar: "أَنَّ", root: "أنن", fr: "Que (conj.)", en: "That", freq: 890 },
  { ar: "قَالَ", root: "قول", fr: "Il dit", en: "He said", freq: 1625 },
  { ar: "إِلَى", root: "إلى", fr: "Vers", en: "To / Towards", freq: 689 },
  { ar: "كَانَ", root: "كون", fr: "Il était", en: "He was", freq: 1360 },
  { ar: "لَا", root: "لا", fr: "Non / Ne pas", en: "No / Not", freq: 4337 },
  { ar: "هُمْ", root: "هم", fr: "Eux / Ils", en: "They", freq: 827 },
  { ar: "وَلَا", root: "لا", fr: "Et non", en: "And not", freq: 1000 },
  { ar: "قُلْ", root: "قول", fr: "Dis !", en: "Say!", freq: 332 },
  {
    ar: "آمَنُوا",
    root: "أمن",
    fr: "Ils ont cru",
    en: "They believed",
    freq: 228,
  },
  { ar: "نَبِيّ", root: "نبأ", fr: "Prophète", en: "Prophet", freq: 75 },
  { ar: "الْجَنَّةُ", root: "جنن", fr: "Le Paradis", en: "Paradise", freq: 77 },
  {
    ar: "النَّارُ",
    root: "نور",
    fr: "Le Feu (Enfer)",
    en: "The Fire (Hell)",
    freq: 145,
  },
  {
    ar: "رَحِيمٌ",
    root: "رحم",
    fr: "Très Miséricordieux",
    en: "Most Merciful",
    freq: 115,
  },
  {
    ar: "كَرِيمٌ",
    root: "كرم",
    fr: "Généreux / Noble",
    en: "Generous",
    freq: 27,
  },
  {
    ar: "عَلِيمٌ",
    root: "علم",
    fr: "Omniscient",
    en: "All-Knowing",
    freq: 162,
  },
  { ar: "حَكِيمٌ", root: "حكم", fr: "Sage", en: "All-Wise", freq: 97 },
  { ar: "عَزِيزٌ", root: "عزز", fr: "Puissant", en: "Almighty", freq: 92 },
  {
    ar: "غَفُورٌ",
    root: "غفر",
    fr: "Très Pardonneur",
    en: "Oft-Forgiving",
    freq: 91,
  },
  {
    ar: "تَوَّابٌ",
    root: "توب",
    fr: "Accepteur de repentir",
    en: "Ever-Relenting",
    freq: 11,
  },
  { ar: "صَبُورٌ", root: "صبر", fr: "Patient", en: "Patient", freq: 3 },
  { ar: "بِاللَّهِ", root: "أله", fr: "Par Allah", en: "By Allah", freq: 180 },
  { ar: "رَسُولُ", root: "رسل", fr: "Messager", en: "Messenger", freq: 236 },
  { ar: "كِتَابُ", root: "كتب", fr: "Livre", en: "Book", freq: 319 },
  {
    ar: "آيَةٌ",
    root: "أيي",
    fr: "Verset / signe",
    en: "Verse / Sign",
    freq: 382,
  },
  { ar: "سُورَةٌ", root: "سور", fr: "Sourate", en: "Chapter", freq: 9 },
  {
    ar: "حَقٌّ",
    root: "حقق",
    fr: "Vérité / Droit",
    en: "Truth / Right",
    freq: 287,
  },
  {
    ar: "عَمَلٌ",
    root: "عمل",
    fr: "Action / Œuvre",
    en: "Work / Deed",
    freq: 359,
  },
  {
    ar: "خَيْرٌ",
    root: "خير",
    fr: "Bien / Meilleur",
    en: "Good / Better",
    freq: 220,
  },
  { ar: "شَرٌّ", root: "شرر", fr: "Mal / Mauvais", en: "Evil", freq: 32 },
  { ar: "إِيمَانٌ", root: "أمن", fr: "Foi", en: "Faith", freq: 45 },
  {
    ar: "إِسْلَامٌ",
    root: "سلم",
    fr: "Islam / soumission",
    en: "Islam / Submission",
    freq: 8,
  },
  { ar: "صَلَاةٌ", root: "صلو", fr: "Prière", en: "Prayer", freq: 83 },
  {
    ar: "زَكَاةٌ",
    root: "زكو",
    fr: "Aumône purificatrice",
    en: "Alms / Zakat",
    freq: 32,
  },
  { ar: "صِيَامٌ", root: "صوم", fr: "Jeûne", en: "Fasting", freq: 2 },
  { ar: "حَجٌّ", root: "حجج", fr: "Pèlerinage", en: "Pilgrimage", freq: 10 },
  { ar: "سَمَاءٌ", root: "سمو", fr: "Ciel", en: "Sky / Heaven", freq: 310 },
  { ar: "أَرْضٌ", root: "أرض", fr: "Terre", en: "Earth / Land", freq: 461 },
  { ar: "نَفْسٌ", root: "نفس", fr: "Âme / Soi", en: "Soul / Self", freq: 295 },
  { ar: "قَلْبٌ", root: "قلب", fr: "Cœur", en: "Heart", freq: 168 },
  { ar: "عَقْلٌ", root: "عقل", fr: "Raison", en: "Reason / Mind", freq: 49 },
  {
    ar: "إِنسَانٌ",
    root: "أنس",
    fr: "Être humain",
    en: "Human being",
    freq: 65,
  },
  { ar: "مَلَكٌ", root: "ملك", fr: "Ange", en: "Angel", freq: 88 },
  {
    ar: "شَيْطَانٌ",
    root: "شطن",
    fr: "Satan / Diable",
    en: "Satan / Devil",
    freq: 88,
  },
  {
    ar: "دُنْيَا",
    root: "دنو",
    fr: "Ce monde (ici-bas)",
    en: "World (this life)",
    freq: 115,
  },
  {
    ar: "آخِرَةٌ",
    root: "أخر",
    fr: "Au-delà / Vie future",
    en: "Hereafter",
    freq: 115,
  },
  { ar: "مَوْتٌ", root: "موت", fr: "Mort", en: "Death", freq: 165 },
  { ar: "حَيَاةٌ", root: "حيي", fr: "Vie", en: "Life", freq: 188 },
  { ar: "نُورٌ", root: "نور", fr: "Lumière", en: "Light", freq: 36 },
  { ar: "ظُلْمَةٌ", root: "ظلم", fr: "Obscurité", en: "Darkness", freq: 23 },
  { ar: "حِكْمَةٌ", root: "حكم", fr: "Sagesse", en: "Wisdom", freq: 20 },
  { ar: "رَحْمَةٌ", root: "رحم", fr: "Miséricorde", en: "Mercy", freq: 79 },
  {
    ar: "عَذَابٌ",
    root: "عذب",
    fr: "Châtiment / Tourment",
    en: "Punishment",
    freq: 322,
  },
  { ar: "غُفْرَانٌ", root: "غفر", fr: "Pardon", en: "Forgiveness", freq: 5 },
  { ar: "شُكْرٌ", root: "شكر", fr: "Gratitude", en: "Gratitude", freq: 75 },
  { ar: "صَبْرٌ", root: "صبر", fr: "Patience", en: "Patience", freq: 90 },
  { ar: "تَوْبَةٌ", root: "توب", fr: "Repentir", en: "Repentance", freq: 17 },
  {
    ar: "هُدًى",
    root: "هدي",
    fr: "Guidée / Direction",
    en: "Guidance",
    freq: 133,
  },
  { ar: "ضَلَالٌ", root: "ضلل", fr: "Égarement", en: "Misguidance", freq: 191 },
  {
    ar: "فَضْلٌ",
    root: "فضل",
    fr: "Grâce / Faveur",
    en: "Grace / Bounty",
    freq: 98,
  },
  {
    ar: "أَمَانَةٌ",
    root: "أمن",
    fr: "Confiance / Fidélité",
    en: "Trust / Faithful",
    freq: 6,
  },
  {
    ar: "عَهْدٌ",
    root: "عهد",
    fr: "Alliance / Promesse",
    en: "Covenant / Promise",
    freq: 25,
  },
  { ar: "حُكْمٌ", root: "حكم", fr: "Jugement", en: "Judgment", freq: 56 },
  { ar: "مُؤْمِنٌ", root: "أمن", fr: "Croyant", en: "Believer", freq: 180 },
  { ar: "كَافِرٌ", root: "كفر", fr: "Mécréant", en: "Disbeliever", freq: 525 },
  { ar: "مُنَافِقٌ", root: "نفق", fr: "Hypocrite", en: "Hypocrite", freq: 37 },
  {
    ar: "ظَالِمٌ",
    root: "ظلم",
    fr: "Injuste / Oppresseur",
    en: "Wrongdoer",
    freq: 314,
  },
  { ar: "صَادِقٌ", root: "صدق", fr: "Véridique", en: "Truthful", freq: 130 },
  {
    ar: "مُتَّقِينَ",
    root: "وقي",
    fr: "Pieux / Craignant Dieu",
    en: "The righteous",
    freq: 130,
  },
  {
    ar: "مُتَوَكِّل",
    root: "وكل",
    fr: "Confiant en Allah",
    en: "Relying on Allah",
    freq: 7,
  },
  {
    ar: "بِسْمِ",
    root: "سمو",
    fr: "Au nom de",
    en: "In the name of",
    freq: 114,
  },
  {
    ar: "الرَّحْمَن",
    root: "رحم",
    fr: "Le Tout Miséricordieux",
    en: "The Most Gracious",
    freq: 57,
  },
  {
    ar: "مَلِكٌ",
    root: "ملك",
    fr: "Roi / Maître",
    en: "King / Sovereign",
    freq: 7,
  },
  {
    ar: "مُحَمَّدٌ",
    root: "حمد",
    fr: "Muhammad (le Prophète)",
    en: "Muhammad (the Prophet)",
    freq: 4,
  },
  {
    ar: "إِبْرَاهِيمُ",
    root: "برهم",
    fr: "Ibrahim (Abraham)",
    en: "Ibrahim (Abraham)",
    freq: 69,
  },
  { ar: "مُوسَى", root: "موس", fr: "Moïse", en: "Moses", freq: 136 },
  { ar: "عِيسَى", root: "عيس", fr: "Jésus", en: "Jesus", freq: 25 },
  { ar: "مَرْيَمُ", root: "مرم", fr: "Marie", en: "Mary", freq: 34 },
  {
    ar: "أَهْلُ",
    root: "أهل",
    fr: "Gens / Famille",
    en: "People / Folk",
    freq: 127,
  },
  {
    ar: "أُمَّةٌ",
    root: "أمم",
    fr: "Communauté / Nation",
    en: "Community",
    freq: 65,
  },
  { ar: "كَلِمَةٌ", root: "كلم", fr: "Parole / Mot", en: "Word", freq: 74 },
  {
    ar: "بَيِّنَاتٌ",
    root: "بين",
    fr: "Preuves claires",
    en: "Clear proofs",
    freq: 137,
  },
  { ar: "مُعْجِزَة", root: "عجز", fr: "Miracle", en: "Miracle", freq: 0 },
  {
    ar: "تَسْبِيحٌ",
    root: "سبح",
    fr: "Glorification",
    en: "Glorification",
    freq: 92,
  },
  { ar: "سَلَامٌ", root: "سلم", fr: "Paix", en: "Peace", freq: 140 },
  {
    ar: "نِعْمَةٌ",
    root: "نعم",
    fr: "Bienfait / Grâce",
    en: "Blessing / Grace",
    freq: 56,
  },
  { ar: "شَرِيعَةٌ", root: "شرع", fr: "Loi divine", en: "Divine law", freq: 0 },
  {
    ar: "جِهَادٌ",
    root: "جهد",
    fr: "Effort/combat en Islam",
    en: "Striving/Struggle",
    freq: 4,
  },
  { ar: "قُرْآنٌ", root: "قرأ", fr: "Le Coran", en: "The Quran", freq: 70 },
];

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

  // Persist score to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("flashcards-score", JSON.stringify(score));
    } catch {
      // localStorage unavailable — silently ignore
    }
  }, [score]);

  // Guard: if deck is somehow empty, show a fallback
  if (deck.length === 0) {
    return (
      <div
        className="modal-overlay"
        onClick={close}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="modal-panel fc-panel"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <div className="modal-title">
              <i className="fas fa-layer-group" />
              {lang === "fr"
                ? "Flashcards"
                : lang === "ar"
                  ? "بطاقات تعليمية"
                  : "Vocabulary Cards"}
            </div>
            <button className="modal-close" onClick={close}>
              <i className="fas fa-xmark" />
            </button>
          </div>
          <div className="fc-done">
            <div className="fc-done__trophy">📭</div>
            <h3>
              {lang === "fr"
                ? "Aucune carte disponible"
                : lang === "ar"
                  ? "لا توجد بطاقات"
                  : "No cards available"}
            </h3>
          </div>
        </div>
      </div>
    );
  }

  const card = deck[idx];
  const total = deck.length;

  const close = () =>
    dispatch({ type: "SET", payload: { flashcardsOpen: false } });

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
    <div
      className="modal-overlay"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label={
        lang === "fr" ? "Flashcards vocabulaire" : "Vocabulary Flashcards"
      }
    >
      <div
        className="modal-panel fc-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <i className="fas fa-layer-group" />
            {lang === "fr"
              ? "Flashcards"
              : lang === "ar"
                ? "بطاقات تعليمية"
                : "Vocabulary Cards"}
          </div>
          <button className="modal-close" onClick={close}>
            <i className="fas fa-xmark" />
          </button>
        </div>

        {done ? (
          <div className="fc-done">
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
                <i className="fas fa-check" /> {score.correct}
              </span>
              <span className="fc-stat wrong">
                <i className="fas fa-xmark" /> {score.wrong}
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
            <button className="fc-restart-btn" onClick={restart}>
              <i className="fas fa-rotate-right" />
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
            <div className="fc-card-wrap" onClick={() => setFlipped((f) => !f)}>
              <div className={`fc-card ${flipped ? "fc-card--flipped" : ""}`}>
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
                      {lang === "fr" ? "fois dans le Coran" : "times in Quran"}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Score + actions */}
            <div className="fc-score-row">
              <span className="fc-stat correct">
                <i className="fas fa-check" /> {score.correct}
              </span>
              <span className="fc-stat wrong">
                <i className="fas fa-xmark" /> {score.wrong}
              </span>
            </div>
            {flipped && (
              <div className="fc-actions">
                <button
                  className="fc-btn fc-btn--wrong"
                  onClick={() => answer(false)}
                >
                  <i className="fas fa-xmark" />
                  {lang === "fr"
                    ? "À revoir"
                    : lang === "ar"
                      ? "مراجعة"
                      : "Review"}
                </button>
                <button
                  className="fc-btn fc-btn--correct"
                  onClick={() => answer(true)}
                >
                  <i className="fas fa-check" />
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
      </div>
    </div>
  );
}
