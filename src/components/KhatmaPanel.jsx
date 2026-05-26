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
    <div className="modal-overlay !p-3 sm:!p-5" onClick={close} role="dialog" aria-modal="true">
      <div
        className="modal-panel khatma-panel !w-full !max-w-2xl !overflow-hidden !rounded-3xl !border !border-white/12 !bg-[linear-gradient(160deg,rgba(10,18,35,0.98),rgba(8,15,30,0.96))] !shadow-[0_36px_90px_rgba(1,8,22,0.64)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header !border-b !border-white/10 !bg-[linear-gradient(135deg,rgba(35,62,110,0.34),rgba(18,29,58,0.2))]">
          <div className="modal-title !inline-flex !items-center !gap-2 !text-white">
            <i className="fas fa-book-open-reader" />
            {L('Objectif Khatma', 'هدف الختمة', 'Khatma Goal')}
          </div>
          <button className="modal-close !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-white/12 !bg-white/[0.04] hover:!bg-white/[0.1]" type="button" onClick={close} aria-label={L('Fermer', 'اغلاق', 'Close')}><i className="fas fa-xmark" /></button>
        </div>

        {tab === 'setup' ? (
          <div className="khatma-setup !space-y-4 !p-4 sm:!p-5">
            <p className="khatma-lead !text-sm !text-white/85 sm:!text-base">
              {L('Finir le Coran (604 pages) en combien de temps ?',
                'كم تستغرق لختم القرآن الكريم (٦٠٤ صفحة) ؟',
                'How long to complete the Quran (604 pages)?')}
            </p>

            <div className="khatma-presets !grid !grid-cols-2 !gap-2 sm:!grid-cols-3">
              {KHATMA_PRESETS.map(p => (
                <button key={p.days}
                  className={`khatma-preset !rounded-xl !border !px-3 !py-2 !text-left !transition-all hover:!border-sky-200/40 hover:!bg-white/[0.08] ${selectedDays === p.days ? 'active !border-sky-200/40 !bg-sky-500/20 !text-white' : '!border-white/12 !bg-white/[0.04]'}`}
                  onClick={() => { setSelectedDays(p.days); setCustomDays(''); }}
                >
                  <span className="khatma-preset__label">{L(p.labelFr, p.labelAr, p.labelEn)}</span>
                  <span className="khatma-preset__daily">
                    ≈ {p.pagesDay} {L('p/j', 'ص/ي', 'p/d')}
                  </span>
                </button>
              ))}
            </div>

            <div className="khatma-custom !rounded-2xl !border !border-white/12 !bg-white/[0.03] !p-3">
              <label>{L('Ou personnaliser (jours) :', 'أو خصص (أيام) :', 'Or customize (days):')}</label>
              <input className="!mt-1.5 !min-h-11 !w-full !rounded-xl !border !border-white/14 !bg-white/[0.05] !px-3"
                type="number" min="1" max="3650" value={customDays}
                onChange={e => setCustomDays(e.target.value)}
                placeholder={L('Ex: 120', 'مثال: ١٢٠', 'e.g. 120')} />
              {customDays && (
                <div className="khatma-custom__info !mt-1.5 !text-xs !text-white/70">
                  ≈ {Math.ceil(604 / (parseInt(customDays) || 1))} {L('pages/jour', 'صفحة/يوم', 'pages/day')}
                </div>
              )}
            </div>

            <button className="khatma-start-btn !inline-flex !w-full !items-center !justify-center !gap-2 !rounded-xl !bg-sky-500/80 !px-4 !py-3 !font-semibold !text-white hover:!bg-sky-500" onClick={handleStart}>
              <i className="fas fa-play" />
              {L('Commencer la Khatma', 'ابدأ الختمة', 'Start Khatma')}
            </button>
          </div>
        ) : stats ? (
          <div className="khatma-progress !space-y-4 !p-4 sm:!p-5">
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
            <div className="khatma-stats-grid !grid !grid-cols-2 !gap-2">
              {[
                { label: L('Pages lues', 'صفحات مقروءة', 'Pages read'), val: stats.pagesRead },
                { label: L('Restantes', 'المتبقية', 'Remaining'), val: stats.pagesLeft },
                { label: L('Quota/jour', 'ح/يوم', 'Daily quota'), val: stats.dailyQuota },
                { label: L('Jours restants', 'أيام متبقية', 'Days left'), val: stats.remainingDays },
              ].map(({ label, val }) => (
                <div key={label} className="khatma-stat-card !rounded-xl !border !border-white/12 !bg-white/[0.04] !p-2.5">
                  <div className="khatma-stat-val">{val}</div>
                  <div className="khatma-stat-label">{label}</div>
                </div>
              ))}
            </div>

            {/* Status */}
            <div className={`khatma-status !rounded-xl !border !px-3 !py-2 ${stats.onTrack ? 'on-track !border-emerald-300/25 !bg-emerald-500/10' : 'behind !border-amber-300/25 !bg-amber-500/10'}`}>
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
            <div className="khatma-footer !flex !flex-wrap !gap-2">
              <button className="khatma-reset-btn !inline-flex !items-center !gap-2 !rounded-xl !border !border-red-300/20 !bg-red-500/10 !px-3.5 !py-2.5 !text-red-100 hover:!bg-red-500/20" onClick={handleReset}>
                <i className="fas fa-trash" />
                {L('Réinitialiser', 'إعادة تعيين', 'Reset')}
              </button>
              <button className="khatma-edit-btn !inline-flex !items-center !gap-2 !rounded-xl !border !border-white/14 !bg-white/[0.05] !px-3.5 !py-2.5 hover:!bg-white/[0.12]" onClick={() => setTab('setup')}>
                <i className="fas fa-pencil" />
                {L('Modifier l\'objectif', 'تعديل الهدف', 'Edit goal')}
              </button>
            </div>
          </div>
        ) : (
          <div className="khatma-setup !space-y-3 !p-4 sm:!p-5">
            <p>{L('Aucun objectif défini.', 'لا يوجد هدف.', 'No goal set.')}</p>
            <button className="khatma-start-btn !inline-flex !items-center !justify-center !rounded-xl !bg-sky-500/80 !px-4 !py-2.5 !font-semibold !text-white hover:!bg-sky-500" onClick={() => setTab('setup')}>
              {L('Définir un objectif', 'تعيين هدف', 'Set a goal')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
