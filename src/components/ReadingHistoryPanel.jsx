import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { t } from '../i18n';
import { getReadingDates, getAllSessions, clearHistory } from '../services/historyService';
import { getSurah } from '../data/surahs';

export default function ReadingHistoryPanel() {
  const { state, dispatch, set } = useApp();
  const { lang } = state;

  const [dates, setDates] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [tab, setTab] = useState('calendar'); // 'calendar' | 'sessions'
  const [loading, setLoading] = useState(true);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  const close = () => dispatch({ type: 'TOGGLE_HISTORY' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [d, s] = await Promise.all([
        getReadingDates(60),
        getAllSessions(100),
      ]);
      setDates(d);
      setSessions(s);
    } catch (err) {
      console.error('History load error:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleClear = async () => {
    if (!window.confirm(t('readingHistory.clear', lang) + '?')) return;
    await clearHistory();
    loadData();
  };

  const goToSession = (surah, ayah) => {
    set({ displayMode: 'surah', showHome: false, showDuas: false });
    dispatch({ type: 'NAVIGATE_SURAH', payload: { surah, ayah } });
    close();
  };

  const formatDuration = (ms) => {
    if (!ms || ms < 1000) return '< 1 min';
    const mins = Math.round(ms / 60000);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const rm = mins % 60;
    return `${hrs}h${rm > 0 ? ` ${rm}m` : ''}`;
  };

  // Build a simple calendar grid for the selected month
  const now = new Date();
  const currentMonth = calMonth;
  const currentYear = calYear;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  // Map dates to a set for quick lookup
  const dateSet = new Set(dates.map(d => d.date));

  const calendarDays = [];
  // Empty cells before first day (Monday-start: adjust)
  const startOffset = (firstDayOfWeek + 6) % 7; // monday = 0
  for (let i = 0; i < startOffset; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ day: d, date: dateStr, hasReading: dateSet.has(dateStr), isToday: d === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear() });
  }

  const goMonthPrev = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const goMonthNext = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };
  const isCurrentMonth = calMonth === now.getMonth() && calYear === now.getFullYear();

  const totalSessions = dates.reduce((acc, d) => acc + d.sessions, 0);
  const totalDuration = dates.reduce((acc, d) => acc + d.totalDurationMs, 0);
  const totalAyahs = dates.reduce((acc, d) => acc + d.ayahsRead, 0);
  const streak = (() => {
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (dateSet.has(ds)) count++;
      else break;
    }
    return count;
  })();

  const DAY_NAMES = lang === 'fr'
    ? ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const MONTH_NAME = new Date(currentYear, currentMonth).toLocaleDateString(lang, { month: 'long', year: 'numeric' });

  return (
    <div className="modal-overlay !p-3 sm:!p-5" onClick={close}>
      <div
        className="modal modal-panel--wide !w-full !max-w-5xl !overflow-hidden !rounded-3xl !border !border-white/12 !bg-[linear-gradient(160deg,rgba(10,18,35,0.98),rgba(8,15,30,0.96))] !shadow-[0_36px_90px_rgba(1,8,22,0.64)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header !border-b !border-white/10 !bg-[linear-gradient(135deg,rgba(35,62,110,0.34),rgba(18,29,58,0.2))]">
          <div className="modal-title-stack">
            <div className="modal-kicker">{lang === 'fr' ? 'Parcours' : lang === 'ar' ? 'المسار' : 'Journey'}</div>
            <h2 className="modal-title">
              <i className="fas fa-clock-rotate-left"></i>
              {t('readingHistory.title', lang)}
            </h2>
            <div className="modal-subtitle">
              {lang === 'fr'
                ? 'Calendrier, sessions et continuité de lecture dans une même vue.'
                : lang === 'ar'
                  ? 'التقويم والجلسات واستمرارية القراءة في عرض واحد.'
                  : 'Calendar, sessions and reading continuity in one place.'}
            </div>
          </div>
          <button className="modal-close !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-white/12 !bg-white/[0.04] hover:!bg-white/[0.1]" onClick={close}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="panel-grid-stats !grid !grid-cols-1 !gap-2 !p-3 sm:!grid-cols-3 sm:!p-4">
          <div className="panel-stat-card !rounded-2xl !border !border-white/10 !bg-white/[0.04] !p-3">
            <span className="panel-stat-value">{streak}</span>
            <span className="panel-stat-label">{t('readingHistory.streak', lang)}</span>
          </div>
          <div className="panel-stat-card !rounded-2xl !border !border-white/10 !bg-white/[0.04] !p-3">
            <span className="panel-stat-value">{totalAyahs}</span>
            <span className="panel-stat-label">{t('readingHistory.ayahsRead', lang)}</span>
          </div>
          <div className="panel-stat-card !rounded-2xl !border !border-white/10 !bg-white/[0.04] !p-3">
            <span className="panel-stat-value">{formatDuration(totalDuration)}</span>
            <span className="panel-stat-label">{t('readingHistory.totalTime', lang)}</span>
          </div>
        </div>

        <div className="modal-segmented !mx-3 !mb-2 !rounded-2xl !border !border-white/12 !bg-white/[0.03] !p-1 sm:!mx-4" role="tablist" aria-label={t('readingHistory.title', lang)}>
          <button className={`modal-segmented-btn !rounded-xl !px-3 !py-2 !text-sm !transition-all hover:!bg-white/[0.08] ${tab === 'calendar' ? '!bg-sky-500/25 !text-white' : ''}`} onClick={() => setTab('calendar')}>
            <i className="fas fa-calendar"></i> {t('readingHistory.calendar', lang)}
          </button>
          <button className={`modal-segmented-btn !rounded-xl !px-3 !py-2 !text-sm !transition-all hover:!bg-white/[0.08] ${tab === 'sessions' ? '!bg-sky-500/25 !text-white' : ''}`} onClick={() => setTab('sessions')}>
            <i className="fas fa-list"></i> {t('readingHistory.sessions', lang)}
          </button>
        </div>

        <div className="panel-scroll !max-h-[62vh] !overflow-auto !px-3 !pb-3 sm:!px-4 sm:!pb-4">
          {loading ? (
            <div className="wird-loading">
              <i className="fas fa-spinner fa-spin"></i>
            </div>
          ) : tab === 'calendar' ? (
            <div className="panel-calendar-shell">
              <div className="panel-calendar-nav !mb-2 !flex !items-center !justify-between">
                <button className="panel-icon-btn !inline-flex !h-9 !w-9 !items-center !justify-center !rounded-xl !border !border-white/12 !bg-white/[0.04] hover:!bg-white/[0.1]" onClick={goMonthPrev} title={lang === 'fr' ? 'Mois précédent' : 'Previous month'}>
                  <i className="fas fa-chevron-left"></i>
                </button>
                <h4 className="panel-month-title">{MONTH_NAME}</h4>
                <button className="panel-icon-btn !inline-flex !h-9 !w-9 !items-center !justify-center !rounded-xl !border !border-white/12 !bg-white/[0.04] hover:!bg-white/[0.1] disabled:!opacity-40" onClick={goMonthNext} disabled={isCurrentMonth} title={lang === 'fr' ? 'Mois suivant' : 'Next month'}>
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
              <div className="panel-calendar-grid">
                {DAY_NAMES.map(d => (
                  <div key={d} className="panel-calendar-head">{d}</div>
                ))}
                {calendarDays.map((cell, i) => (
                  <div
                    key={i}
                    className={`panel-calendar-day ${cell?.isToday ? 'today' : ''} ${cell?.hasReading ? 'has-reading' : ''} ${!cell ? 'empty' : ''}`}
                  >
                    {cell?.day || ''}
                  </div>
                ))}
              </div>
              {dates.length === 0 && (
                <p className="wird-empty">
                  {t('readingHistory.empty', lang)}
                </p>
              )}
            </div>
          ) : (
            <div className="panel-stack-list">
              {sessions.length === 0 ? (
                <p className="wird-empty">
                  {lang === 'fr' ? 'Aucune session enregistrée.' : 'No sessions recorded.'}
                </p>
              ) : (
                <>
                  {sessions.slice(0, 50).map((s, i) => {
                    const surah = getSurah(s.surah);
                    return (
                      <div key={i} className="modal-item-card !rounded-2xl !border !border-white/10 !bg-white/[0.03] !p-2.5">
                        <div className="modal-item-main !rounded-xl !px-2 !py-2">
                          <div className="modal-item-meta">
                            {s.ayahFrom === s.ayahTo ? `v.${s.ayahFrom}` : `v.${s.ayahFrom}-${s.ayahTo}`}
                          </div>
                          <div className="modal-item-ar">{surah?.ar || `S.${s.surah}`}</div>
                          <div className="panel-inline-meta">
                            <span><i className="fas fa-calendar-day"></i>{new Date(s.timestamp).toLocaleDateString(lang, { day: 'numeric', month: 'short' })}</span>
                            <span><i className="fas fa-clock"></i>{formatDuration(s.durationMs)}</span>
                          </div>
                        </div>
                        <div className="modal-item-side">
                          <button className="modal-action-btn !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-white/12 !bg-white/[0.05] hover:!bg-white/[0.12]" type="button" onClick={() => goToSession(s.surah, s.ayahFrom)}>
                            <i className="fas fa-arrow-up-right-from-square"></i>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <button className="panel-hero-btn !mt-3 !inline-flex !items-center !gap-2 !rounded-xl !border !border-red-300/20 !bg-red-500/10 !px-3.5 !py-2.5 !text-red-100 hover:!bg-red-500/20" onClick={handleClear}>
                    <i className="fas fa-trash"></i>
                    {lang === 'fr' ? 'Effacer l\'historique' : 'Clear history'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
