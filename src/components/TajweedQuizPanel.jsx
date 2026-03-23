/**
 * TajweedQuizPanel — Test your tajweed rule recognition
 * Shows a rule name / color and asks user to identify it from 4 choices
 */
import React, { useState, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import TAJWID_RULES from '../data/tajwidRules';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickChoices(rules, correct) {
  const others = shuffle(rules.filter(r => r.id !== correct.id)).slice(0, 3);
  return shuffle([correct, ...others]);
}

/* Sample colored word for each rule */
const SAMPLE_WORDS = {
  ghunna:        'مِّنَّا',
  qalqala:       'خَلَقۡ',
  idgham:        'مَن يَعۡمَلۡ',
  iqlab:         'مِن بَعۡدِ',
  'madd-normal': 'قَالَ',
  'madd-separated': 'يَا أَيُّهَا',
  'madd-connected': 'جَاءَ',
  madd:          'الۤمۤ',
  'lam-shamsiyya': 'الشَّمۡسُ',
};
const DEFAULT_WORD = 'ٱللَّهُ';

export default function TajweedQuizPanel() {
  const { state, dispatch } = useApp();
  const { lang } = state;

  const rules = useMemo(() => TAJWID_RULES.filter(r => r.id && r.color), []);

  const [questionIdx, setQuestionIdx] = useState(0);
  const [answered, setAnswered] = useState(null); // null | 'correct' | 'wrong'
  const [selectedId, setSelectedId] = useState(null);
  const [score, setScore] = useState({ correct: 0, wrong: 0, total: 0 });
  const [done, setDone] = useState(false);

  const orderedQuestions = useMemo(() => shuffle([...rules]).slice(0, Math.min(10, rules.length)), [rules]);
  const question = orderedQuestions[questionIdx];
  const choices = useMemo(() => question ? pickChoices(rules, question) : [], [question, rules, questionIdx]);

  const close = () => dispatch({ type: 'SET', payload: { tajweedQuizOpen: false } });

  const handleAnswer = useCallback((ruleId) => {
    if (answered) return;
    const isCorrect = ruleId === question.id;
    setSelectedId(ruleId);
    setAnswered(isCorrect ? 'correct' : 'wrong');
    setScore(s => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      wrong: s.wrong + (isCorrect ? 0 : 1),
      total: s.total + 1,
    }));
  }, [answered, question]);

  const nextQuestion = useCallback(() => {
    if (questionIdx >= orderedQuestions.length - 1) {
      setDone(true);
    } else {
      setQuestionIdx(i => i + 1);
      setAnswered(null);
      setSelectedId(null);
    }
  }, [questionIdx, orderedQuestions.length]);

  const restart = () => {
    setQuestionIdx(0);
    setAnswered(null);
    setSelectedId(null);
    setScore({ correct: 0, wrong: 0, total: 0 });
    setDone(false);
  };

  const nameFor = (rule) => lang === 'ar' ? rule.nameAr : lang === 'fr' ? rule.nameFr : rule.nameEn;

  return (
    <div className="modal-overlay !p-3 sm:!p-5" onClick={close} role="dialog" aria-modal="true"
      aria-label={lang === 'fr' ? 'Quiz Tajweed' : 'Tajweed Quiz'}>
      <div className="modal-panel tq-panel !w-full !max-w-2xl !overflow-hidden !rounded-3xl !border !border-white/12 !bg-[linear-gradient(160deg,rgba(10,18,35,0.98),rgba(8,15,30,0.96))] !shadow-[0_36px_90px_rgba(1,8,22,0.64)]" onClick={e => e.stopPropagation()}>
        <div className="modal-header !border-b !border-white/10 !bg-[linear-gradient(135deg,rgba(35,62,110,0.34),rgba(18,29,58,0.2))]">
          <div className="modal-title !inline-flex !items-center !gap-2 !text-white">
            <i className="fas fa-spell-check" />
            {lang === 'fr' ? 'Quiz Tajweed' : lang === 'ar' ? 'مسابقة التجويد' : 'Tajweed Quiz'}
          </div>
          <button className="modal-close !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-white/12 !bg-white/[0.04] hover:!bg-white/[0.1]" onClick={close}><i className="fas fa-xmark" /></button>
        </div>

        {done ? (
          <div className="fc-done !space-y-3 !p-5 !text-center">
            <div className="fc-done__trophy">🎓</div>
            <h3>{lang === 'fr' ? 'Quiz terminé !' : lang === 'ar' ? 'انتهت المسابقة!' : 'Quiz complete!'}</h3>
            <div className="fc-done__stats">
              <span className="fc-stat correct"><i className="fas fa-check" /> {score.correct}</span>
              <span className="fc-stat wrong"><i className="fas fa-xmark" /> {score.wrong}</span>
            </div>
            <div className="fc-done__pct">
              {Math.round((score.correct / score.total) * 100)}%{' '}
              {lang === 'fr' ? 'de réussite' : lang === 'ar' ? 'نجاح' : 'correct'}
            </div>
            <button className="fc-restart-btn !inline-flex !items-center !gap-2 !rounded-xl !bg-sky-500/80 !px-4 !py-2.5 !font-semibold !text-white hover:!bg-sky-500" onClick={restart}>
              <i className="fas fa-rotate-right" />
              {lang === 'fr' ? 'Recommencer' : lang === 'ar' ? 'إعادة' : 'Restart'}
            </button>
          </div>
        ) : question ? (
          <>
            {/* progress */}
            <div className="fc-progress-bar">
              <div className="fc-progress-fill" style={{ width: `${(questionIdx / orderedQuestions.length) * 100}%` }} />
            </div>
            <div className="fc-count !pb-2">{questionIdx + 1} / {orderedQuestions.length}</div>

            {/* Question card */}
            <div className="tq-question-card !mx-4 !rounded-2xl !border !border-white/12 !bg-white/[0.03] !p-4">
              <div className="tq-cue">
                <div className="tq-sample-word" style={{ color: question.color, textShadow: `0 0 12px ${question.color}66` }}>
                  {SAMPLE_WORDS[question.id] || DEFAULT_WORD}
                </div>
                <div className="tq-color-chip !inline-flex !items-center !gap-1.5 !rounded-full !px-2.5 !py-1 !text-xs" style={{ background: question.color + '28', border: `1.5px solid ${question.color}66`, color: question.color }}>
                  <i className="fas fa-palette text-[0.5rem]" />
                  {question.color}
                </div>
              </div>
              <div className="tq-prompt">
                {lang === 'fr' ? 'Quelle règle de tajweed ?' : lang === 'ar' ? 'ما حكم التجويد ؟' : 'Which tajweed rule?'}
              </div>
              {answered && (
                <div className="tq-description">{question.description || ''}</div>
              )}
            </div>

            {/* Choices */}
            <div className="tq-choices !grid !grid-cols-1 !gap-2 !px-4 !py-3">
              {choices.map((choice) => {
                const isSelected = selectedId === choice.id;
                const isCorrect  = answered && choice.id === question.id;
                const isWrong    = answered && isSelected && !isCorrect;
                return (
                  <button key={choice.id}
                    onClick={() => handleAnswer(choice.id)}
                    disabled={!!answered}
                    className={`tq-choice !inline-flex !items-center !justify-center !gap-2 !rounded-xl !border !px-3.5 !py-2.5 !text-sm !transition-all hover:!bg-white/[0.08] ${isCorrect ? 'tq-choice--correct !border-emerald-300/25 !bg-emerald-500/12' : ''} ${isWrong ? 'tq-choice--wrong !border-red-300/25 !bg-red-500/12' : ''}`}
                  >
                    <span className="tq-choice__dot" style={{ background: choice.color }} />
                    {nameFor(choice)}
                    {isCorrect && <i className="fas fa-check ml-1.5 text-[0.7rem]" />}
                    {isWrong   && <i className="fas fa-xmark ml-1.5 text-[0.7rem]" />}
                  </button>
                );
              })}
            </div>

            {/* Score + Next */}
            <div className="tq-footer !flex !items-center !justify-between !gap-2 !px-4 !pb-4">
              <div className="fc-score-row !flex !items-center !gap-2">
                <span className="fc-stat correct"><i className="fas fa-check" /> {score.correct}</span>
                <span className="fc-stat wrong"><i className="fas fa-xmark" /> {score.wrong}</span>
              </div>
              {answered && (
                <button className="tq-next-btn !inline-flex !items-center !gap-2 !rounded-xl !border !border-sky-200/30 !bg-sky-500/20 !px-3.5 !py-2.5 !text-sm !text-white hover:!bg-sky-500/30" onClick={nextQuestion}>
                  {questionIdx >= orderedQuestions.length - 1
                    ? (lang === 'fr' ? 'Voir résultats' : lang === 'ar' ? 'النتائج' : 'View results')
                    : (lang === 'fr' ? 'Suivant →' : lang === 'ar' ? 'التالي →' : 'Next →')}
                </button>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
