/**
 * KhatmaPanel — Quran completion goal (Khatma) calculator & tracker
 */
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  getKhatmaGoal,
  setKhatmaGoal,
  clearKhatmaGoal,
  getKhatmaStats,
  KHATMA_PRESETS,
} from '../services/khatmaService';

export default function KhatmaPanel() {
  const { state, dispatch } = useApp();
  const { lang, currentPage } = state;

  const [goal, setGoalState] = useState(() => getKhatmaGoal());
  const [stats, setStats] = useState(() => getKhatmaStats(currentPage));
  const [selectedDays, setSelectedDays] = useState(30);
  const [customDays, setCustomDays] = useState('');
  const [tab, setTab] = useState(goal ? 'progress' : 'setup');

  const close = () => dispatch({ type: 'SET', payload: { khatmaOpen: false } });

  useEffect(() => {
    setStats(getKhatmaStats(currentPage));
  }, [currentPage, goal]);

  const handleStart = () => {
    const days = parseInt(customDays) || selectedDays;
    const g = setKhatmaGoal({ targetDays: days, startPage: currentPage });
    setGoalState(g);
    setStats(getKhatmaStats(currentPage));
    setTab('progress');
  };

  const handleReset = () => {
    clearKhatmaGoal();
    setGoalState(null);
    setStats(null);
    setTab('setup');
  };

  const L = (fr, ar, en) => lang === 'ar' ? ar : lang === 'fr' ? fr : en;

  return (
    <div className="modal-overlay" onClick={close} role="dialog" aria-modal="true">
      <div className="modal-panel khatma-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <i className="fas fa-book-open-reader" />
            {L('Objectif Khatma', 'هدف الختمة', 'Khatma Goal')}
          </div>
          <button className="modal-close" onClick={close}><i className="fas fa-xmark" /></button>
        </div>

        {tab === 'setup' ? (
          <div className="khatma-setup">
            <p className="khatma-lead">
              {L('Finir le Coran (604 pages) en combien de temps ?',
                'كم تستغرق لختم القرآن الكريم (٦٠٤ صفحة) ؟',
                'How long to complete the Quran (604 pages)?')}
            </p>

            <div className="khatma-presets">
              {KHATMA_PRESETS.map(p => (
                <button key={p.days}
                  className={`khatma-preset ${selectedDays === p.days ? 'active' : ''}`}
                  onClick={() => { setSelectedDays(p.days); setCustomDays(''); }}
                >
                  <span className="khatma-preset__label">{L(p.labelFr, p.labelAr, p.labelEn)}</span>
                  <span className="khatma-preset__daily">
                    ≈ {p.pagesDay} {L('p/j', 'ص/ي', 'p/d')}
                  </span>
                </button>
              ))}
            </div>

            <div className="khatma-custom">
              <label>{L('Ou personnaliser (jours) :', 'أو خصص (أيام) :', 'Or customize (days):')}</label>
              <input type="number" min="1" max="3650" value={customDays}
                onChange={e => setCustomDays(e.target.value)}
                placeholder={L('Ex: 120', 'مثال: ١٢٠', 'e.g. 120')} />
              {customDays && (
                <div className="khatma-custom__info">
                  ≈ {Math.ceil(604 / (parseInt(customDays) || 1))} {L('pages/jour', 'صفحة/يوم', 'pages/day')}
                </div>
              )}
            </div>

            <button className="khatma-start-btn" onClick={handleStart}>
              <i className="fas fa-play" />
              {L('Commencer la Khatma', 'ابدأ الختمة', 'Start Khatma')}
            </button>
          </div>
        ) : stats ? (
          <div className="khatma-progress">
            {/* Big circle progress */}
            <div className="khatma-ring-wrap">
              <svg viewBox="0 0 100 100" className="khatma-ring">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                <circle cx="50" cy="50" r="40" fill="none"
                  stroke={stats.onTrack ? 'var(--emerald, #22c55e)' : 'var(--gold, #d4a820)'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - stats.pct / 100)}`}
                  transform="rotate(-90 50 50)"
                  style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
                <text x="50" y="50" textAnchor="middle" dominantBaseline="central"
                  fontSize="18" fontWeight="bold" fill="var(--text-primary, #fff)">
                  {stats.pct}%
                </text>
              </svg>
            </div>

            {/* Stats grid */}
            <div className="khatma-stats-grid">
              {[
                { label: L('Pages lues', 'صفحات مقروءة', 'Pages read'), val: stats.pagesRead },
                { label: L('Restantes', 'المتبقية', 'Remaining'), val: stats.pagesLeft },
                { label: L('Quota/jour', 'ح/يوم', 'Daily quota'), val: stats.dailyQuota },
                { label: L('Jours restants', 'أيام متبقية', 'Days left'), val: stats.remainingDays },
              ].map(({ label, val }) => (
                <div key={label} className="khatma-stat-card">
                  <div className="khatma-stat-val">{val}</div>
                  <div className="khatma-stat-label">{label}</div>
                </div>
              ))}
            </div>

            {/* Status */}
            <div className={`khatma-status ${stats.onTrack ? 'on-track' : 'behind'}`}>
              {stats.onTrack
                ? (lang === 'fr' ? '✓ Vous êtes dans les temps !' : lang === 'ar' ? '✓ أنت في الموعد المحدد!' : '✓ You are on track!')
                : (lang === 'fr' ? '⚠ Retard — lisez quelques pages supplémentaires' : lang === 'ar' ? '⚠ تأخر — اقرأ بعض الصفحات الإضافية' : '⚠ Behind — read a few extra pages')}
            </div>

            {stats.estDoneDate && (
              <div className="khatma-eta">
                {L('Fin estimée au rythme actuel :', 'تاريخ الإنهاء المتوقع :', 'Estimated finish at current pace:')}
                <strong> {stats.estDoneDate}</strong>
              </div>
            )}

            {/* Footer buttons */}
            <div className="khatma-footer">
              <button className="khatma-reset-btn" onClick={handleReset}>
                <i className="fas fa-trash" />
                {L('Réinitialiser', 'إعادة تعيين', 'Reset')}
              </button>
              <button className="khatma-edit-btn" onClick={() => setTab('setup')}>
                <i className="fas fa-pencil" />
                {L('Modifier l\'objectif', 'تعديل الهدف', 'Edit goal')}
              </button>
            </div>
          </div>
        ) : (
          <div className="khatma-setup">
            <p>{L('Aucun objectif défini.', 'لا يوجد هدف.', 'No goal set.')}</p>
            <button className="khatma-start-btn" onClick={() => setTab('setup')}>
              {L('Définir un objectif', 'تعيين هدف', 'Set a goal')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
