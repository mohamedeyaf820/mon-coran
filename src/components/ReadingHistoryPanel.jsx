import React, { useCallback, useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useAppActions, useAppLocale } from "../context/AppContext";
import { t } from "../i18n";
import {
  clearHistory,
  getAllSessions,
  getReadingDates,
} from "../services/historyService";
import { getSurah } from "../data/surahs";
import { Icon } from "./ui/icon";

export default function ReadingHistoryPanel() {
  const { dispatch, set } = useAppActions();
  const { lang } = useAppLocale();

  const [dates, setDates] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [tab, setTab] = useState("calendar");
  const [loading, setLoading] = useState(true);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const titleId = "reading-history-title";

  const close = () =>
    dispatch({ type: "SET", payload: { historyOpen: false } });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [readingDates, readingSessions] = await Promise.all([
        getReadingDates(60),
        getAllSessions(100),
      ]);
      setDates(readingDates);
      setSessions(readingSessions);
    } catch (err) {
      console.error("History load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleClear = async () => {
    if (!window.confirm(`${t("readingHistory.clear", lang)}?`)) return;
    await clearHistory();
    loadData();
  };

  const goToSession = (surah, ayah) => {
    set({ displayMode: "surah", showHome: false, showDuas: false });
    dispatch({ type: "NAVIGATE_SURAH", payload: { surah, ayah } });
    close();
  };

  const formatDuration = (ms) => {
    if (!ms || ms < 1000) return "< 1 min";
    const mins = Math.round(ms / 60000);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const rm = mins % 60;
    return `${hrs}h${rm > 0 ? ` ${rm}m` : ""}`;
  };

  const now = new Date();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const dateSet = new Set(dates.map((d) => d.date));

  const calendarDays = [];
  const startOffset = (firstDayOfWeek + 6) % 7;
  for (let i = 0; i < startOffset; i += 1) calendarDays.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    calendarDays.push({
      day,
      date: dateStr,
      hasReading: dateSet.has(dateStr),
      isToday:
        day === now.getDate() &&
        calMonth === now.getMonth() &&
        calYear === now.getFullYear(),
    });
  }

  const goMonthPrev = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((year) => year - 1);
    } else {
      setCalMonth((month) => month - 1);
    }
  };

  const goMonthNext = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((year) => year + 1);
    } else {
      setCalMonth((month) => month + 1);
    }
  };

  const isCurrentMonth =
    calMonth === now.getMonth() && calYear === now.getFullYear();
  const totalDuration = dates.reduce((acc, d) => acc + d.totalDurationMs, 0);
  const totalAyahs = dates.reduce((acc, d) => acc + d.ayahsRead, 0);
  const streak = (() => {
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 365; i += 1) {
      const day = new Date(today);
      day.setDate(day.getDate() - i);
      const ds = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
      if (dateSet.has(ds)) count += 1;
      else break;
    }
    return count;
  })();

  const dayNames =
    lang === "fr"
      ? ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
      : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const monthName = new Date(calYear, calMonth).toLocaleDateString(lang, {
    month: "long",
    year: "numeric",
  });

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <Dialog.Portal>
        <div className="modal-overlay !p-3 sm:!p-5" onClick={close}>
          <Dialog.Content
            className="modal modal-panel--wide !w-full !max-w-5xl !overflow-hidden !rounded-3xl !border !border-[var(--border)] !bg-[var(--bg-card)] !backdrop-blur-xl !shadow-[0_36px_90px_rgba(1,8,22,0.64)]"
            aria-labelledby={titleId}
            onClick={(event) => event.stopPropagation()}
            onEscapeKeyDown={(event) => {
              event.preventDefault();
              close();
            }}
            onInteractOutside={close}
          >
            <Dialog.Title className="sr-only">Historique de lecture</Dialog.Title>
            <div className="modal-header !border-b !border-[var(--border)] !bg-[var(--bg-secondary)]">
              <div className="modal-title-stack">
                <div className="modal-kicker">
                  {lang === "fr" ? "Parcours" : lang === "ar" ? "المسار" : "Journey"}
                </div>
                <h2 className="modal-title" id={titleId}>
                  <Icon name="clock-rotate-left" size={18} />
                  {t("readingHistory.title", lang)}
                </h2>
                <div className="modal-subtitle">
                  {lang === "fr"
                    ? "Calendrier, sessions et continuite de lecture dans une meme vue."
                    : lang === "ar"
                      ? "التقويم والجلسات واستمرارية القراءة في عرض واحد."
                      : "Calendar, sessions and reading continuity in one place."}
                </div>
              </div>
              <button
                className="modal-close !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-[var(--border)] !bg-white/[0.04] hover:!bg-white/[0.1]"
                onClick={close}
                type="button"
                aria-label={
                  lang === "fr"
                    ? "Fermer l'historique"
                    : lang === "ar"
                      ? "إغلاق السجل"
                      : "Close reading history"
                }
              >
                <Icon name="xmark" size={18} />
              </button>
            </div>

            <div className="panel-grid-stats !grid !grid-cols-1 !gap-2 !p-3 sm:!grid-cols-3 sm:!p-4">
              <div className="panel-stat-card !rounded-2xl !border !border-[var(--border)] !bg-white/[0.04] !p-3">
                <span className="panel-stat-value">{streak}</span>
                <span className="panel-stat-label">
                  {t("readingHistory.streak", lang)}
                </span>
              </div>
              <div className="panel-stat-card !rounded-2xl !border !border-[var(--border)] !bg-white/[0.04] !p-3">
                <span className="panel-stat-value">{totalAyahs}</span>
                <span className="panel-stat-label">
                  {t("readingHistory.ayahsRead", lang)}
                </span>
              </div>
              <div className="panel-stat-card !rounded-2xl !border !border-[var(--border)] !bg-white/[0.04] !p-3">
                <span className="panel-stat-value">
                  {formatDuration(totalDuration)}
                </span>
                <span className="panel-stat-label">
                  {t("readingHistory.totalTime", lang)}
                </span>
              </div>
            </div>

            <div
              className="modal-segmented !mx-3 !mb-2 !rounded-2xl !border !border-[var(--border)] !bg-white/[0.03] !p-1 sm:!mx-4"
              role="tablist"
              aria-label={t("readingHistory.title", lang)}
            >
              <button
                className={`modal-segmented-btn !rounded-xl !px-3 !py-2 !text-sm !transition-all hover:!bg-white/[0.08] ${tab === "calendar" ? "!bg-sky-500/25 !text-white" : ""}`}
                onClick={() => setTab("calendar")}
                type="button"
              >
                <Icon name="calendar" size={15} />
                {t("readingHistory.calendar", lang)}
              </button>
              <button
                className={`modal-segmented-btn !rounded-xl !px-3 !py-2 !text-sm !transition-all hover:!bg-white/[0.08] ${tab === "sessions" ? "!bg-sky-500/25 !text-white" : ""}`}
                onClick={() => setTab("sessions")}
                type="button"
              >
                <Icon name="list" size={15} />
                {t("readingHistory.sessions", lang)}
              </button>
            </div>

            <div className="panel-scroll !max-h-[62vh] !overflow-auto !px-3 !pb-3 sm:!px-4 sm:!pb-4">
              {loading ? (
                <div className="wird-loading">
                  <Icon name="spinner" size={20} spin />
                </div>
              ) : tab === "calendar" ? (
                <div className="panel-calendar-shell">
                  <div className="panel-calendar-nav !mb-2 !flex !items-center !justify-between">
                    <button
                      className="panel-icon-btn !inline-flex !h-9 !w-9 !items-center !justify-center !rounded-xl !border !border-[var(--border)] !bg-white/[0.04] hover:!bg-white/[0.1]"
                      onClick={goMonthPrev}
                      title={lang === "fr" ? "Mois précédent" : "Previous month"}
                      aria-label={
                        lang === "fr" ? "Mois précédent" : "Previous month"
                      }
                      type="button"
                    >
                      <Icon name="chevron-left" size={18} />
                    </button>
                    <h4 className="panel-month-title">{monthName}</h4>
                    <button
                      className="panel-icon-btn !inline-flex !h-9 !w-9 !items-center !justify-center !rounded-xl !border !border-[var(--border)] !bg-white/[0.04] hover:!bg-white/[0.1] disabled:!opacity-40"
                      onClick={goMonthNext}
                      disabled={isCurrentMonth}
                      title={lang === "fr" ? "Mois suivant" : "Next month"}
                      aria-label={lang === "fr" ? "Mois suivant" : "Next month"}
                      type="button"
                    >
                      <Icon name="chevron-right" size={18} />
                    </button>
                  </div>
                  <div className="panel-calendar-grid">
                    {dayNames.map((day) => (
                      <div key={day} className="panel-calendar-head">
                        {day}
                      </div>
                    ))}
                    {calendarDays.map((cell, index) => (
                      <div
                        key={cell?.date || `empty-${index}`}
                        className={`panel-calendar-day ${cell?.isToday ? "today" : ""} ${cell?.hasReading ? "has-reading" : ""} ${!cell ? "empty" : ""}`}
                      >
                        {cell?.day || ""}
                      </div>
                    ))}
                  </div>
                  {dates.length === 0 ? (
                    <p className="wird-empty">
                      {t("readingHistory.empty", lang)}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="panel-stack-list">
                  {sessions.length === 0 ? (
                    <p className="wird-empty">
                      {lang === "fr"
                        ? "Aucune session enregistrée."
                        : "No sessions recorded."}
                    </p>
                  ) : (
                    <>
                      {sessions.slice(0, 50).map((session, index) => {
                        const surah = getSurah(session.surah);
                        return (
                          <div
                            key={`${session.timestamp}-${index}`}
                            className="modal-item-card !rounded-2xl !border !border-[var(--border)] !bg-white/[0.03] !p-2.5"
                          >
                            <div className="modal-item-main !rounded-xl !px-2 !py-2">
                              <div className="modal-item-meta">
                                {session.ayahFrom === session.ayahTo
                                  ? `v.${session.ayahFrom}`
                                  : `v.${session.ayahFrom}-${session.ayahTo}`}
                              </div>
                              <div className="modal-item-ar">
                                {surah?.ar || `S.${session.surah}`}
                              </div>
                              <div className="panel-inline-meta">
                                <span>
                                  <Icon name="calendar-day" size={13} />
                                  {new Date(
                                    session.timestamp,
                                  ).toLocaleDateString(lang, {
                                    day: "numeric",
                                    month: "short",
                                  })}
                                </span>
                                <span>
                                  <Icon name="clock" size={13} />
                                  {formatDuration(session.durationMs)}
                                </span>
                              </div>
                            </div>
                            <div className="modal-item-side">
                              <button
                                className="modal-action-btn !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-[var(--border)] !bg-white/[0.05] hover:!bg-white/[0.12]"
                                type="button"
                                onClick={() =>
                                  goToSession(session.surah, session.ayahFrom)
                                }
                                aria-label={
                                  lang === "fr"
                                    ? "Ouvrir la session"
                                    : "Open session"
                                }
                              >
                                <Icon
                                  name="arrow-up-right-from-square"
                                  size={17}
                                />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      <button
                        className="panel-hero-btn !mt-3 !inline-flex !items-center !gap-2 !rounded-xl !border !border-red-300/20 !bg-red-500/10 !px-3.5 !py-2.5 !text-red-100 hover:!bg-red-500/20"
                        onClick={handleClear}
                        type="button"
                      >
                        <Icon name="trash" size={16} />
                        {lang === "fr"
                          ? "Effacer l'historique"
                          : "Clear history"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
