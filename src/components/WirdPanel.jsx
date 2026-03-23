import React, { useState, useEffect, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import {
  getTodayWird,
  getWirdHistory,
  resetTodayWird,
} from "../services/wirdService";

/* ── Sparkline: mini bar chart showing the last 7 days of reading ── */
function Sparkline({ data, goalTarget, lang }) {
  if (!data || data.length === 0) return null;
  const W = 220,
    H = 56,
    barW = 22,
    gap = 6;
  const maxVal = Math.max(goalTarget, ...data.map((d) => d.val));
  const items = data.slice(-7);
  const totalBars = items.length;
  const totalWidth = totalBars * (barW + gap) - gap;
  const offsetX = (W - totalWidth) / 2;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="wird-sparkline">
      <svg width={W} height={H + 20} aria-hidden="true">
        {/* Goal line */}
        <line
          x1={offsetX}
          y1={H - (goalTarget / maxVal) * (H - 4) + 2}
          x2={offsetX + totalWidth}
          y2={H - (goalTarget / maxVal) * (H - 4) + 2}
          stroke="rgba(200,152,14,0.4)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        {items.map((item, i) => {
          const x = offsetX + i * (barW + gap);
          const pct = Math.min(1, item.val / maxVal);
          const barH = Math.max(3, pct * (H - 4));
          const y = H - barH + 2;
          const isToday = item.date === today;
          const isComplete = item.val >= goalTarget;
          const fill = isComplete
            ? "rgba(34,197,94,0.75)"
            : item.val > 0
              ? "rgba(212,168,32,0.6)"
              : "rgba(128,128,128,0.18)";
          return (
            <g key={item.date}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={4}
                fill={fill}
                opacity={isToday ? 1 : 0.82}
              />
              {isToday && (
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx={4}
                  fill="none"
                  stroke="rgba(212,168,32,0.7)"
                  strokeWidth="1.5"
                />
              )}
              <text
                x={x + barW / 2}
                y={H + 14}
                textAnchor="middle"
                fontSize="8"
                fill="currentColor"
                opacity="0.5"
                fontFamily="system-ui,sans-serif"
              >
                {new Date(item.date + "T00:00").toLocaleDateString(
                  lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : "en-GB",
                  { weekday: "narrow" },
                )}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="wird-sparkline__legend">
        <span>
          <span
            className="wird-spark-dot"
            style={{ background: "rgba(34,197,94,0.75)" }}
          />
          {lang === "fr"
            ? "Objectif atteint"
            : lang === "ar"
              ? "هدف مكتمل"
              : "Goal reached"}
        </span>
        <span>
          <span
            className="wird-spark-dot"
            style={{ background: "rgba(212,168,32,0.6)" }}
          />
          {lang === "fr" ? "Partiel" : lang === "ar" ? "جزئي" : "Partial"}
        </span>
      </div>
    </div>
  );
}

/* ── StreakHeatmap: GitHub-style 13-week reading calendar ── */
function StreakHeatmap({ history, goalTarget, wirdGoalType, lang }) {
  // Build a lookup: date → progress value
  const lookup = {};
  for (const d of history) {
    lookup[d.date] = wirdGoalType === "pages" ? d.pagesRead : d.ayahsRead;
  }

  // Build 91 days (13 weeks) ending today
  const today = new Date();
  const days = [];
  for (let i = 90; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  // Compute current streak (consecutive days with any reading)
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if ((lookup[days[i]] || 0) > 0) streak++;
    else if (days[i] !== today.toISOString().slice(0, 10)) break;
  }

  // Color: 0=none, 1=light, 2=medium, 3=complete
  const level = (date) => {
    const v = lookup[date] || 0;
    if (v === 0) return 0;
    if (v >= goalTarget) return 3;
    if (v >= goalTarget * 0.6) return 2;
    return 1;
  };

  const COLORS = [
    "rgba(255,255,255,0.06)",
    "rgba(34,197,94,0.25)",
    "rgba(34,197,94,0.55)",
    "rgba(34,197,94,0.9)",
  ];

  // Group into 13 weeks
  const weeks = [];
  for (let w = 0; w < 13; w++) {
    weeks.push(days.slice(w * 7, w * 7 + 7));
  }

  const monthLabels = [];
  let lastMonth = null;
  weeks.forEach((week, wi) => {
    const m = new Date(week[0] + "T00:00").toLocaleDateString(
      lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : "en-GB",
      { month: "short" },
    );
    if (m !== lastMonth) {
      monthLabels.push({ wi, label: m });
      lastMonth = m;
    } else {
      monthLabels.push(null);
    }
  });

  return (
    <div className="wird-streak">
      {/* Streak badge */}
      <div className="wird-streak__badge">
        <i
          className="fas fa-fire"
          style={{ color: streak > 0 ? "#f97316" : "rgba(255,255,255,0.3)" }}
        />
        <span>{streak}</span>
        <span className="wird-streak__badge-label">
          {lang === "fr"
            ? `jour${streak !== 1 ? "s" : ""} de suite`
            : lang === "ar"
              ? "يوم متتالي"
              : `day${streak !== 1 ? "s" : ""} streak`}
        </span>
      </div>

      {/* Month labels */}
      <div className="wird-heatmap-months">
        {monthLabels.map((item, wi) => (
          <div key={wi} className="wird-heatmap-month-cell">
            {item ? item.label : ""}
          </div>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="wird-heatmap-grid">
        {weeks.map((week, wi) => (
          <div key={wi} className="wird-heatmap-col">
            {week.map((date) => (
              <div
                key={date}
                className="wird-heatmap-cell"
                style={{ background: COLORS[level(date)] }}
                title={`${date}: ${lookup[date] || 0}/${goalTarget}`}
                aria-label={`${date}: ${lookup[date] || 0}/${goalTarget}`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="wird-heatmap-legend">
        <span>{lang === "fr" ? "Moins" : lang === "ar" ? "أقل" : "Less"}</span>
        {COLORS.map((c, i) => (
          <div
            key={i}
            className="wird-heatmap-cell"
            style={{ background: c }}
          />
        ))}
        <span>{lang === "fr" ? "Plus" : lang === "ar" ? "أكثر" : "More"}</span>
      </div>
    </div>
  );
}

export default function WirdPanel() {
  const { state, dispatch, set } = useApp();
  const { lang, wirdGoalType, wirdGoalAmount } = state;

  const [todayWird, setTodayWird] = useState(null);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState("today"); // 'today' | 'history' | 'streak' | 'settings'
  const [loading, setLoading] = useState(true);

  const close = () => dispatch({ type: "TOGGLE_WIRD" });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [today, hist] = await Promise.all([
        getTodayWird(),
        getWirdHistory(90), // 90 days for streak heatmap
      ]);
      setTodayWird(today);
      setHistory(hist);
    } catch (err) {
      console.error("Wird load error:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const goalLabel =
    wirdGoalType === "pages"
      ? lang === "fr"
        ? "pages"
        : lang === "ar"
          ? "صفحات"
          : "pages"
      : wirdGoalType === "hizb"
        ? lang === "fr"
          ? "hizb"
          : lang === "ar"
            ? "حزب"
            : "hizb"
        : lang === "fr"
          ? "juz"
          : lang === "ar"
            ? "جزء"
            : "juz";

  const progressValue = todayWird
    ? wirdGoalType === "pages"
      ? todayWird.pagesRead
      : todayWird.ayahsRead
    : 0;

  const goalTarget = wirdGoalAmount || 5;
  const progressPct = Math.min(
    100,
    Math.round((progressValue / goalTarget) * 100),
  );
  const isComplete = progressPct >= 100;

  const handleReset = async () => {
    const confirmMsg =
      lang === "ar"
        ? "هل أنت متأكد من إعادة ضبط ورد اليوم؟"
        : lang === "fr"
          ? "Confirmer la réinitialisation du wird d'aujourd'hui ?"
          : "Reset today's wird progress? This cannot be undone.";
    if (!window.confirm(confirmMsg)) return;
    await resetTodayWird();
    loadData();
  };

  const GOAL_TYPES = [
    {
      id: "pages",
      label: lang === "fr" ? "Pages" : lang === "ar" ? "صفحات" : "Pages",
    },
    { id: "hizb", label: lang === "ar" ? "حزب" : "Hizb" },
    { id: "juz", label: lang === "ar" ? "جزء" : "Juz" },
  ];

  return (
    <div className="modal-overlay !p-3 sm:!p-5" onClick={close}>
      <div
        className="modal modal-panel--wide modal-wird !w-full !max-w-5xl !overflow-hidden !rounded-3xl !border !border-white/12 !bg-[linear-gradient(160deg,rgba(10,18,35,0.98),rgba(8,15,30,0.96))] !shadow-[0_36px_90px_rgba(1,8,22,0.64)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header !border-b !border-white/10 !bg-[linear-gradient(135deg,rgba(35,62,110,0.34),rgba(18,29,58,0.2))]">
          <div className="modal-title-stack">
            <div className="modal-kicker">
              {lang === "fr"
                ? "Discipline"
                : lang === "ar"
                  ? "الورد"
                  : "Routine"}
            </div>
            <h2 className="modal-title">
              <i className="fas fa-bullseye"></i>
              {t("wird.title", lang)}
            </h2>
            <div className="modal-subtitle">
              {lang === "fr"
                ? "Suivi du wird quotidien, historique et réglage d’objectif."
                : lang === "ar"
                  ? "متابعة الورد اليومي وسجلّه وضبط هدفه."
                  : "Daily wird tracking, history and goal settings."}
            </div>
          </div>
          <button className="modal-close !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-white/12 !bg-white/[0.04] hover:!bg-white/[0.1]" onClick={close}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div
          className="modal-segmented !mx-3 !mt-3 !rounded-2xl !border !border-white/12 !bg-white/[0.03] !p-1 sm:!mx-4"
          role="tablist"
          aria-label={t("wird.title", lang)}
        >
          <button
            className={`modal-segmented-btn !rounded-xl !px-3 !py-2 !text-sm !transition-all hover:!bg-white/[0.08] ${tab === "today" ? "active !bg-sky-500/25 !text-white" : ""}`}
            onClick={() => setTab("today")}
          >
            <i className="fas fa-calendar-day"></i> {t("wird.today", lang)}
          </button>
          <button
            className={`modal-segmented-btn !rounded-xl !px-3 !py-2 !text-sm !transition-all hover:!bg-white/[0.08] ${tab === "history" ? "active !bg-sky-500/25 !text-white" : ""}`}
            onClick={() => setTab("history")}
          >
            <i className="fas fa-chart-line"></i> {t("wird.history", lang)}
          </button>
          <button
            className={`modal-segmented-btn !rounded-xl !px-3 !py-2 !text-sm !transition-all hover:!bg-white/[0.08] ${tab === "streak" ? "active !bg-sky-500/25 !text-white" : ""}`}
            onClick={() => setTab("streak")}
          >
            <i className="fas fa-fire"></i>{" "}
            {lang === "fr" ? "Série" : lang === "ar" ? "سلسلة" : "Streak"}
          </button>
          <button
            className={`modal-segmented-btn !rounded-xl !px-3 !py-2 !text-sm !transition-all hover:!bg-white/[0.08] ${tab === "settings" ? "active !bg-sky-500/25 !text-white" : ""}`}
            onClick={() => setTab("settings")}
          >
            <i className="fas fa-sliders-h"></i> {t("wird.goal", lang)}
          </button>
        </div>

        <div className="wird-summary-bar !mx-3 !mt-2 !flex !flex-wrap !gap-2 sm:!mx-4">
          <span className="wird-summary-pill !inline-flex !items-center !gap-1.5 !rounded-full !border !border-white/14 !bg-white/[0.05] !px-2.5 !py-1 !text-xs">
            <i className="fas fa-bullseye"></i>
            {goalTarget} {goalLabel}
          </span>
          <span className="wird-summary-pill !inline-flex !items-center !gap-1.5 !rounded-full !border !border-white/14 !bg-white/[0.05] !px-2.5 !py-1 !text-xs">
            <i className="fas fa-chart-simple"></i>
            {progressValue} / {goalTarget}
          </span>
          <span
            className={`wird-summary-pill !inline-flex !items-center !gap-1.5 !rounded-full !border !px-2.5 !py-1 !text-xs ${isComplete ? "is-complete !border-emerald-300/30 !bg-emerald-500/15" : "!border-white/14 !bg-white/[0.05]"}`}
          >
            <i
              className={`fas ${isComplete ? "fa-check-circle" : "fa-hourglass-half"}`}
            ></i>
            {progressPct}%
          </span>
        </div>

        <div className="panel-scroll wird-body !max-h-[62vh] !overflow-auto !px-3 !pb-3 sm:!px-4 sm:!pb-4">
          {loading ? (
            <div className="wird-loading">
              <i className="fas fa-spinner fa-spin"></i>
            </div>
          ) : tab === "today" ? (
            <div className="wird-today !space-y-3">
              <div className="wird-progress-card !rounded-2xl !border !border-white/12 !bg-white/[0.03] !p-4">
                <div className="wird-progress-wrapper">
                  <svg viewBox="0 0 120 120" className="wird-progress-svg">
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="var(--border)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke={isComplete ? "var(--primary)" : "var(--gold)"}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 52}`}
                      strokeDashoffset={`${2 * Math.PI * 52 * (1 - progressPct / 100)}`}
                      transform="rotate(-90 60 60)"
                      style={{ transition: "stroke-dashoffset 0.5s ease" }}
                    />
                  </svg>
                  <div className="wird-progress-text">
                    <span className="wird-pct">{progressPct}%</span>
                    <span className="wird-detail">
                      {progressValue} / {goalTarget} {goalLabel}
                    </span>
                  </div>
                </div>

                <div className="wird-progress-copy">
                  <span className="wird-progress-kicker">
                    {lang === "fr"
                      ? "Lecture du jour"
                      : lang === "ar"
                        ? "ورد اليوم"
                        : "Today"}
                  </span>
                  <h3 className="wird-progress-title">
                    {isComplete
                      ? lang === "fr"
                        ? "Objectif atteint"
                        : lang === "ar"
                          ? "تم بلوغ الهدف"
                          : "Goal reached"
                      : lang === "fr"
                        ? "Continuez votre wird"
                        : lang === "ar"
                          ? "واصل وردك"
                          : "Keep your wird moving"}
                  </h3>
                  <p className="wird-progress-copytext">
                    {lang === "fr"
                      ? "Le suivi reste visible dans un format plus clair pour voir immédiatement votre cadence quotidienne."
                      : lang === "ar"
                        ? "تم تبسيط العرض حتى ترى تقدّمك اليومي بسرعة ووضوح."
                        : "The layout highlights your daily pace more clearly so progress is readable at a glance."}
                  </p>
                </div>
              </div>

              {isComplete && (
                <div className="wird-complete-badge">
                  <i className="fas fa-check-circle"></i>
                  {lang === "fr"
                    ? "Objectif atteint ! Barak Allahu fik"
                    : lang === "ar"
                      ? "تم بلوغ الهدف، بارك الله فيك"
                      : "Goal achieved! Barak Allahu feek"}
                </div>
              )}

              {todayWird && todayWird.entries.length > 0 && (
                <div className="wird-entries panel-stack-list !space-y-2">
                  <h4 className="wird-entries-title">
                    {lang === "fr"
                      ? "Sessions d'aujourd'hui"
                      : lang === "ar"
                        ? "جلسات اليوم"
                        : "Today's Sessions"}{" "}
                    ({todayWird.entries.length})
                  </h4>
                  {todayWird.entries
                    .slice(-5)
                    .reverse()
                    .map((e, i) => (
                      <div key={i} className="wird-entry modal-item-card !rounded-xl !border !border-white/10 !bg-white/[0.03] !px-3 !py-2">
                        <span className="wird-entry-surah">
                          {lang === "ar" ? "س." : "S."}
                          {e.surah} : {e.fromAyah}-{e.toAyah}
                        </span>
                        <span className="wird-entry-time">
                          {new Date(e.timestamp).toLocaleTimeString(lang, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ))}
                </div>
              )}

              {todayWird && todayWird.entries.length > 0 && (
                <button className="wird-reset-btn !inline-flex !items-center !gap-2 !rounded-xl !border !border-red-300/20 !bg-red-500/10 !px-3.5 !py-2.5 !text-red-100 hover:!bg-red-500/20" onClick={handleReset}>
                  <i className="fas fa-redo"></i>{" "}
                  {lang === "fr"
                    ? "Réinitialiser"
                    : lang === "ar"
                      ? "إعادة الضبط"
                      : "Reset"}
                </button>
              )}

              {(!todayWird || todayWird.entries.length === 0) && (
                <div className="modal-empty wird-empty">
                  {lang === "fr"
                    ? "Aucune lecture enregistrée aujourd'hui. Commencez à lire le Coran pour suivre votre progression !"
                    : lang === "ar"
                      ? "لا توجد قراءة مسجلة اليوم. ابدأ القراءة لتتبّع تقدّمك."
                      : "No reading logged today. Start reading the Quran to track your progress!"}
                </div>
              )}
            </div>
          ) : tab === "history" ? (
            <div className="wird-history">
              {history.length === 0 ? (
                <div className="modal-empty wird-empty">
                  {lang === "fr"
                    ? "Aucun historique de wird."
                    : lang === "ar"
                      ? "لا يوجد سجل للورد."
                      : "No wird history."}
                </div>
              ) : (
                <>
                  <Sparkline
                    data={history.map((d) => ({
                      date: d.date,
                      val: wirdGoalType === "pages" ? d.pagesRead : d.ayahsRead,
                    }))}
                    goalTarget={goalTarget}
                    lang={lang}
                  />
                  <div className="wird-calendar">
                    {history.map((day) => {
                      const dayProgress =
                        wirdGoalType === "pages"
                          ? day.pagesRead
                          : day.ayahsRead;
                      const dayPct = Math.min(
                        100,
                        Math.round((dayProgress / goalTarget) * 100),
                      );
                      return (
                        <div
                          key={day.date}
                          className={`wird-day modal-item-card ${dayPct >= 100 ? "complete" : dayPct > 0 ? "partial" : ""}`}
                        >
                          <span className="wird-day-date">
                            {new Date(day.date + "T00:00").toLocaleDateString(
                              lang,
                              {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              },
                            )}
                          </span>
                          <div className="wird-day-bar">
                            <div
                              className="wird-day-fill"
                              style={{ width: `${dayPct}%` }}
                            ></div>
                          </div>
                          <span className="wird-day-stat">
                            {dayProgress}/{goalTarget}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ) : tab === "streak" ? (
            /* Streak tab — GitHub-style heatmap */
            <StreakHeatmap
              history={history}
              goalTarget={goalTarget}
              wirdGoalType={wirdGoalType}
              lang={lang}
            />
          ) : (
            /* Settings tab */
            <div className="wird-settings !space-y-3">
              <div className="wird-setting-group settings-card !rounded-2xl !border !border-white/12 !bg-white/[0.03] !p-3">
                <label className="wird-setting-label">
                  {lang === "fr"
                    ? "Type d'objectif"
                    : lang === "ar"
                      ? "نوع الهدف"
                      : "Goal type"}
                </label>
                <div className="wird-setting-options">
                  {GOAL_TYPES.map((gt) => (
                    <button
                      key={gt.id}
                      className={`chip ${wirdGoalType === gt.id ? "active" : ""}`}
                      onClick={() => set({ wirdGoalType: gt.id })}
                    >
                      {gt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="wird-setting-group settings-card !rounded-2xl !border !border-white/12 !bg-white/[0.03] !p-3">
                <label className="wird-setting-label">
                  {lang === "fr"
                    ? "Quantité par jour"
                    : lang === "ar"
                      ? "الكمية اليومية"
                      : "Amount per day"}
                  : {wirdGoalAmount} {goalLabel}
                </label>
                <input
                  type="range"
                  min={1}
                  max={
                    wirdGoalType === "juz"
                      ? 10
                      : wirdGoalType === "hizb"
                        ? 20
                        : 30
                  }
                  value={wirdGoalAmount}
                  onChange={(e) =>
                    set({ wirdGoalAmount: parseInt(e.target.value) || 1 })
                  }
                  className="wird-range"
                />
              </div>

              <div className="wird-info settings-info-note">
                <i className="fas fa-info-circle"></i>
                <p>
                  {lang === "fr"
                    ? "La progression se met à jour automatiquement quand vous lisez le Coran dans l'application."
                    : lang === "ar"
                      ? "يتم تحديث التقدّم تلقائيًا أثناء القراءة داخل التطبيق."
                      : "Progress updates automatically as you read the Quran in the app."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
