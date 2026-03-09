/**
 * WeeklyStatsPanel — statistiques hebdomadaires exportables (image PNG / SVG).
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { getWirdHistory } from '../services/wirdService';
import { getReadingDates } from '../services/historyService';
import { getSurah } from '../data/surahs';

function padDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWeekDays(offset = 0) {
  // offset 0 = current week, -1 = last week, etc.
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return padDate(d);
  });
}

const DAY_LABELS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const DAY_LABELS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function buildStatsSVG({ days, wirdData, readingData, lang, weekLabel, goalTarget }) {
  const W = 700;
  const H = 420;
  const bg = '#0d1f17';
  const gold = '#f5d785';
  const goldDim = 'rgba(245,215,133,0.5)';
  const green = '#4ade80';
  const greenDim = 'rgba(74,222,128,0.25)';
  const dayLabels = lang === 'fr' ? DAY_LABELS_FR : DAY_LABELS_EN;

  // Bar chart: pages/ayahs per day
  const maxPages = Math.max(1, ...days.map(d => wirdData[d]?.pagesRead || 0));
  const barW = 52;
  const barGap = 14;
  const barAreaX = 60;
  const barAreaY = 220;
  const barAreaH = 120;

  const bars = days.map((date, i) => {
    const pages = wirdData[date]?.pagesRead || 0;
    const ayahs = readingData[date]?.ayahsRead || 0;
    const completed = wirdData[date]?.completed || false;
    const barH = Math.round((pages / maxPages) * barAreaH);
    const x = barAreaX + i * (barW + barGap);
    const y = barAreaY - barH;
    const label = dayLabels[i];

    return `
      <!-- Day ${i}: ${date} -->
      <rect x="${x}" y="${barAreaY - barAreaH}" width="${barW}" height="${barAreaH}" fill="rgba(255,255,255,0.04)" rx="6"/>
      ${barH > 0 ? `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="${completed ? green : gold}" opacity="0.75" rx="6"/>` : ''}
      <text x="${x + barW/2}" y="${barAreaY + 18}" font-size="11" fill="${goldDim}" text-anchor="middle" font-family="sans-serif">${label}</text>
      <text x="${x + barW/2}" y="${barAreaY + 32}" font-size="10" fill="rgba(255,255,255,0.35)" text-anchor="middle" font-family="sans-serif">${pages > 0 ? pages + 'p' : '·'}</text>
      ${completed ? `<text x="${x + barW/2}" y="${y - 6}" font-size="10" fill="${green}" text-anchor="middle">✓</text>` : ''}
    `;
  });

  // Summary stats
  const totalPages = days.reduce((s, d) => s + (wirdData[d]?.pagesRead || 0), 0);
  const totalAyahs = days.reduce((s, d) => s + (readingData[d]?.ayahsRead || 0), 0);
  const activeDays = days.filter(d => (wirdData[d]?.pagesRead || 0) > 0).length;
  const completedDays = days.filter(d => wirdData[d]?.completed).length;

  const safeWeekLabel = (weekLabel || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${bg}"/>
  <rect width="${W}" height="${H}" fill="none" stroke="${gold}" stroke-width="0.5" opacity="0.15"/>

  <!-- Header -->
  <text x="40" y="44" font-size="11" fill="${goldDim}" font-family="sans-serif">MushafPlus</text>
  <text x="40" y="68" font-size="22" fill="${gold}" font-family="sans-serif" font-weight="bold">
    ${lang === 'fr' ? 'Statistiques hebdomadaires' : 'Weekly Statistics'}
  </text>
  <text x="40" y="88" font-size="12" fill="${goldDim}" font-family="sans-serif">${safeWeekLabel}</text>

  <!-- Separator -->
  <line x1="40" y1="100" x2="${W-40}" y2="100" stroke="${gold}" stroke-width="0.5" opacity="0.3"/>

  <!-- Summary boxes -->
  <rect x="40"  y="115" width="130" height="72" rx="8" fill="rgba(255,255,255,0.05)" stroke="${gold}" stroke-width="0.5" stroke-opacity="0.2"/>
  <text x="105" y="145" font-size="28" fill="${gold}" text-anchor="middle" font-family="sans-serif" font-weight="bold">${totalPages}</text>
  <text x="105" y="161" font-size="10" fill="${goldDim}" text-anchor="middle" font-family="sans-serif">${lang === 'fr' ? 'pages lues' : 'pages read'}</text>
  <text x="105" y="177" font-size="9"  fill="rgba(255,255,255,0.3)" text-anchor="middle" font-family="sans-serif">/ semaine</text>

  <rect x="185" y="115" width="130" height="72" rx="8" fill="rgba(255,255,255,0.05)" stroke="${gold}" stroke-width="0.5" stroke-opacity="0.2"/>
  <text x="250" y="145" font-size="28" fill="${green}" text-anchor="middle" font-family="sans-serif" font-weight="bold">${activeDays}</text>
  <text x="250" y="161" font-size="10" fill="rgba(74,222,128,0.6)" text-anchor="middle" font-family="sans-serif">${lang === 'fr' ? 'jours actifs' : 'active days'}</text>
  <text x="250" y="177" font-size="9"  fill="rgba(255,255,255,0.3)" text-anchor="middle" font-family="sans-serif">/ 7</text>

  <rect x="330" y="115" width="130" height="72" rx="8" fill="rgba(255,255,255,0.05)" stroke="${gold}" stroke-width="0.5" stroke-opacity="0.2"/>
  <text x="395" y="145" font-size="28" fill="${completedDays > 0 ? green : goldDim}" text-anchor="middle" font-family="sans-serif" font-weight="bold">${completedDays}</text>
  <text x="395" y="161" font-size="10" fill="${completedDays > 0 ? 'rgba(74,222,128,0.6)' : goldDim}" text-anchor="middle" font-family="sans-serif">${lang === 'fr' ? 'objectifs atteints' : 'goals reached'}</text>
  <text x="395" y="177" font-size="9"  fill="rgba(255,255,255,0.3)" text-anchor="middle" font-family="sans-serif">/ 7</text>

  <rect x="475" y="115" width="185" height="72" rx="8" fill="rgba(255,255,255,0.05)" stroke="${gold}" stroke-width="0.5" stroke-opacity="0.2"/>
  <text x="568" y="145" font-size="28" fill="${gold}" text-anchor="middle" font-family="sans-serif" font-weight="bold">${totalAyahs}</text>
  <text x="568" y="161" font-size="10" fill="${goldDim}" text-anchor="middle" font-family="sans-serif">${lang === 'fr' ? 'versets lus' : 'verses read'}</text>

  <!-- Bar chart title -->
  <text x="40" y="212" font-size="10" fill="rgba(255,255,255,0.35)" font-family="sans-serif">
    ${lang === 'fr' ? 'Pages / jour' : 'Pages / day'}  ${goalTarget ? `(objectif: ${goalTarget}p)` : ''}
  </text>

  <!-- Goal line if set -->
  ${goalTarget ? `<line x1="${barAreaX}" y1="${barAreaY - Math.round((goalTarget / maxPages) * barAreaH)}" x2="${barAreaX + 7 * (barW + barGap) - barGap}" y2="${barAreaY - Math.round((goalTarget / maxPages) * barAreaH)}" stroke="${green}" stroke-width="1" stroke-dasharray="4,4" opacity="0.5"/>` : ''}

  <!-- Bars -->
  ${bars.join('')}

  <!-- Bottom branding -->
  <text x="${W/2}" y="${H - 14}" font-size="9" fill="rgba(245,215,133,0.2)" text-anchor="middle" font-family="sans-serif">
    MushafPlus · mushafplus.app
  </text>
</svg>`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function svgToPng(svgString) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 700;
      canvas.height = 420;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(b => {
        URL.revokeObjectURL(url);
        resolve(b);
      }, 'image/png');
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function WeeklyStatsPanel() {
  const { state, dispatch } = useApp();
  const { lang } = state;

  const [weekOffset, setWeekOffset] = useState(0); // 0 = current
  const [wirdMap, setWirdMap] = useState({});
  const [readingMap, setReadingMap] = useState({});
  const [goalTarget, setGoalTarget] = useState(null);
  const [exporting, setExporting] = useState(false);

  const close = () => dispatch({ type: 'SET', payload: { weeklyStatsOpen: false } });

  const days = getWeekDays(weekOffset);
  const weekStart = days[0];
  const weekEnd = days[6];
  const weekLabel = `${weekStart.slice(5).replace('-', '/')} – ${weekEnd.slice(5).replace('-', '/')} ${weekStart.slice(0, 4)}`;

  useEffect(() => {
    // Load wird + reading history for 90 days
    getWirdHistory(90).then(history => {
      const map = {};
      for (const r of history) { map[r.date] = r; }
      setWirdMap(map);
      // Goal target from localStorage
      try {
        const g = JSON.parse(localStorage.getItem('mushaf_khatma_v1') || 'null');
        if (g?.dailyPageGoal) setGoalTarget(g.dailyPageGoal);
      } catch {}
    });
    getReadingDates(90).then(dates => {
      const map = {};
      for (const r of dates) { map[r.date] = r; }
      setReadingMap(map);
    });
  }, []);

  const svgContent = buildStatsSVG({
    days,
    wirdData: wirdMap,
    readingData: readingMap,
    lang,
    weekLabel,
    goalTarget,
  });

  const handleExportSVG = () => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    downloadBlob(blob, `mushafplus-stats-${weekStart}.svg`);
  };

  const handleExportPNG = async () => {
    setExporting(true);
    try {
      const blob = await svgToPng(svgContent);
      downloadBlob(blob, `mushafplus-stats-${weekStart}.png`);
    } finally {
      setExporting(false);
    }
  };

  const totalPages = days.reduce((s, d) => s + (wirdMap[d]?.pagesRead || 0), 0);
  const activeDays = days.filter(d => (wirdMap[d]?.pagesRead || 0) > 0).length;
  const completedDays = days.filter(d => wirdMap[d]?.completed).length;
  const totalAyahs = days.reduce((s, d) => s + (readingMap[d]?.ayahsRead || 0), 0);

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal modal-panel--wide wst-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-stack">
            <div className="modal-kicker">
              {lang === 'fr' ? 'Rapport de lecture' : 'Reading Report'}
            </div>
            <h2 className="modal-title">
              {lang === 'fr' ? 'Statistiques hebdomadaires' : 'Weekly Statistics'}
            </h2>
            <div className="modal-subtitle">{weekLabel}</div>
          </div>
          <button className="modal-close" onClick={close}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Week navigator */}
        <div className="wst-nav">
          <button className="wst-nav-btn" onClick={() => setWeekOffset(o => o - 1)}>
            <i className="fas fa-chevron-left"></i>
          </button>
          <span className="wst-nav-label">{weekLabel}</span>
          <button className="wst-nav-btn" onClick={() => setWeekOffset(o => Math.min(0, o + 1))} disabled={weekOffset >= 0}>
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>

        {/* Summary cards */}
        <div className="wst-summary">
          <div className="wst-card">
            <div className="wst-card__val">{totalPages}</div>
            <div className="wst-card__label">{lang === 'fr' ? 'pages lues' : 'pages'}</div>
          </div>
          <div className="wst-card">
            <div className="wst-card__val green">{activeDays}</div>
            <div className="wst-card__label">{lang === 'fr' ? 'jours actifs' : 'active days'} /7</div>
          </div>
          <div className="wst-card">
            <div className="wst-card__val">{completedDays}</div>
            <div className="wst-card__label">{lang === 'fr' ? 'objectifs ✓' : 'goals ✓'}</div>
          </div>
          <div className="wst-card">
            <div className="wst-card__val">{totalAyahs}</div>
            <div className="wst-card__label">{lang === 'fr' ? 'versets' : 'verses'}</div>
          </div>
        </div>

        {/* Bar chart preview (inline) */}
        <div className="wst-bars">
          {days.map((date, i) => {
            const pages = wirdMap[date]?.pagesRead || 0;
            const completed = wirdMap[date]?.completed || false;
            const maxP = Math.max(1, ...days.map(d => wirdMap[d]?.pagesRead || 0));
            const pct = Math.round((pages / maxP) * 100);
            const dayLabel = (lang === 'fr' ? DAY_LABELS_FR : DAY_LABELS_EN)[i];
            return (
              <div key={date} className="wst-bar-col">
                <div className="wst-bar-wrap">
                  <div
                    className={`wst-bar ${completed ? 'completed' : pages > 0 ? 'active' : ''}`}
                    style={{ height: `${Math.max(2, pct)}%` }}
                  />
                </div>
                <div className="wst-bar-label">{dayLabel}</div>
                <div className="wst-bar-val">{pages > 0 ? pages : '·'}</div>
              </div>
            );
          })}
        </div>

        {/* Export actions */}
        <div className="wst-actions">
          <button className="wst-export-btn" onClick={handleExportSVG}>
            <i className="fas fa-file-code"></i>
            SVG
          </button>
          <button className="wst-export-btn" onClick={handleExportPNG} disabled={exporting}>
            {exporting
              ? <i className="fas fa-spinner fa-spin"></i>
              : <i className="fas fa-image"></i>}
            PNG
          </button>
        </div>
      </div>
    </div>
  );
}
