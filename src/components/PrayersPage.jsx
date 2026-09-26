import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  Circle,
  Clock,
  Home,
  Loader2,
  MapPin,
  MoonStar,
  Settings2,
  Sparkles,
} from "lucide-react";
import "../styles/domains/prayers-page.css";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import { usePrayerTimes } from "../hooks/usePrayerTimes";
import { PRAYER_KEYS } from "../services/prayerTimesService";
import { POST_ADHAN_DUAS } from "../data/adhanDuas";

/**
 * « Mes prières » — a private mirror of the reader's five daily prayers.
 * Marks are stored locally and encrypted; the page deliberately builds no
 * score, it only shows what was tapped today, this week, this month.
 */
export default function PrayersPage() {
  const { state, set } = useApp();
  const { lang } = state;
  const isRtl = lang === "ar";
  const locale = lang === "ar" ? "ar-SA" : lang === "en" ? "en-GB" : "fr-FR";
  const [now, setNow] = useState(() => new Date());
  const [view, setView] = useState("day");
  const [log, setLog] = useState({});
  const prayer = usePrayerTimes({
    enabled: state.prayerTimesEnabled,
    location: state.prayerLocation,
    method: state.prayerMethod,
    offsets: state.prayerTimeOffsets,
    now,
  });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!state.prayerTrackingEnabled) return undefined;
    let cancelled = false;
    const load = () => {
      import("../services/prayerLogService")
        .then(({ getPrayerLog }) => {
          if (!cancelled) setLog(getPrayerLog());
        })
        .catch(() => {});
    };
    load();
    // Roll the page over at midnight without a reload.
    const dayWatcher = window.setInterval(load, 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(dayWatcher);
    };
  }, [state.prayerTrackingEnabled]);

  const refreshLog = useCallback(async () => {
    const { getPrayerLog } = await import("../services/prayerLogService");
    setLog(getPrayerLog());
  }, []);

  const togglePrayer = useCallback(
    async (prayerKey) => {
      const dayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
      const wasPrayed = log[dayKey]?.[prayerKey]?.p === true;
      const { markPrayer } = await import("../services/prayerLogService");
      markPrayer(dayKey, prayerKey, wasPrayed ? null : "prayed");
      await refreshLog();
    },
    [log, now, refreshLog],
  );

  const todayEntries = log[`${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`] || {};
  const timings = prayer.status === "ready" ? prayer.data.timings : null;

  const week = useMemo(() => {
    const days = [];
    const start = new Date(now);
    // Monday-first week.
    start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    for (let i = 0; i < 7; i += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const entries = log[`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`] || {};
      days.push({
        date,
        future: date > now,
        cells: PRAYER_KEYS.map((key) =>
          entries[key]?.p === true ? "prayed" : entries[key] ? "answered" : null,
        ),
      });
    }
    return days;
  }, [log, now]);

  const month = useMemo(() => {
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const days = [];
    for (let day = 1; day <= last.getDate(); day += 1) {
      const date = new Date(now.getFullYear(), now.getMonth(), day);
      const entries = log[`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`] || {};
      days.push({
        date,
        future: date > now,
        counts: PRAYER_KEYS.map((key) =>
          entries[key]?.p === true ? "prayed" : entries[key] ? "answered" : null,
        ),
      });
    }
    return days;
  }, [log, now]);

  const monthTotal = month.reduce(
    (sum, day) => sum + day.counts.filter((cell) => cell === "prayed").length,
    0,
  );

  return (
    <div className="prayers-page" dir={isRtl ? "rtl" : "ltr"}>
      <section className="prayers-hero">
        <div className="prayers-hero-head">
          <h1 className="prayers-title">{t("prayers.pageTitle", lang)}</h1>
          <p className="prayers-subtitle">{t("prayers.pageSubtitle", lang)}</p>
        </div>
        <button
          type="button"
          className="prayers-back-btn"
          onClick={() => set({ showPrayers: false, showHome: true })}
        >
          <Home size={15} aria-hidden="true" />
          <span>{t("prayers.backHome", lang)}</span>
        </button>
      </section>

      <div className="prayers-view-switch" role="tablist" aria-label={t("prayers.switchAria", lang)}>
        {[
          { id: "day", icon: Clock },
          { id: "week", icon: CalendarDays },
          { id: "month", icon: MoonStar },
        ].map(({ id, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            className={`prayers-view-btn${view === id ? " is-active" : ""}`}
            onClick={() => setView(id)}
          >
            <Icon size={14} aria-hidden="true" />
            <span>{t(`prayers.views.${id}`, lang)}</span>
          </button>
        ))}
      </div>

      {!state.prayerTrackingEnabled ? (
        <div className="prayers-empty card">
          <Sparkles size={18} aria-hidden="true" />
          <h2>{t("prayers.offTitle", lang)}</h2>
          <p>{t("prayers.offBody", lang)}</p>
          <button
            type="button"
            className="prayers-enable-btn"
            onClick={() => set({ prayerTrackingEnabled: true })}
          >
            {t("prayers.offEnable", lang)}
          </button>
        </div>
      ) : !state.prayerLocation ? (
        <div className="prayers-empty card">
          <MapPin size={18} aria-hidden="true" />
          <h2>{t("prayers.noLocationTitle", lang)}</h2>
          <p>{t("prayers.noLocationBody", lang)}</p>
          <button
            type="button"
            className="prayers-enable-btn"
            onClick={() => set({ settingsOpen: true })}
          >
            <Settings2 size={14} aria-hidden="true" />
            <span>{t("prayers.goSettings", lang)}</span>
          </button>
        </div>
      ) : view === "day" ? (
        <section className="prayers-day" aria-label={t("prayers.views.day", lang)}>
          <div className="prayers-day-head">
            <time dateTime={now.toISOString()}>
              {now.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}
            </time>
            {prayer.data?.hijri ? <span dir="rtl" lang="ar">{prayer.data.hijri}</span> : null}
          </div>
          {prayer.status === "loading" && !timings ? (
            <p className="prayers-hint" role="status">
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              {t("prayer.loading", lang)}
            </p>
          ) : null}
          <ul className="prayers-day-list">
            {PRAYER_KEYS.map((key) => {
              const entry = todayEntries[key];
              const prayed = entry?.p === true;
              const time = timings?.[key]?.hhmm;
              return (
                <li key={key} className={`prayers-day-row${prayed ? " is-done" : ""}`}>
                  <span className="prayers-day-name">
                    <strong>{t(`prayer.names.${key}`, lang)}</strong>
                    {lang !== "ar" ? (
                      <span className="prayers-day-name-ar" dir="rtl" lang="ar">
                        {t(`prayer.names.${key}`, "ar")}
                      </span>
                    ) : null}
                  </span>
                  <span className="prayers-day-time" dir="ltr">{time || "—"}</span>
                  <span className="prayers-day-flag">
                    {!prayed && entry?.s === 1 ? t("prayers.notYet", lang) : null}
                  </span>
                  <button
                    type="button"
                    className={`prayers-mark-btn${prayed ? " is-on" : ""}`}
                    onClick={() => togglePrayer(key)}
                    aria-pressed={prayed}
                    aria-label={`${t(`prayer.names.${key}`, lang)} — ${
                      prayed ? t("prayers.markedAria", lang) : t("prayers.unmarkedAria", lang)
                    }`}
                  >
                    {prayed ? <Check size={16} aria-hidden="true" /> : <Circle size={16} aria-hidden="true" />}
                    <span>{prayed ? t("prayers.prayed", lang) : t("prayers.markPrayed", lang)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="prayers-private-note">{t("prayers.privateNote", lang)}</p>
          {state.prayerPostAdhanDuas ? (
            <section className="prayers-duas" aria-label={t("prayers.duasTitle", lang)}>
              <h2>
                <Sparkles size={15} aria-hidden="true" />
                {t("prayers.duasTitle", lang)}
              </h2>
              {POST_ADHAN_DUAS.map((dua) => (
                <article key={dua.id} className="prayers-dua-card">
                  <p className="prayers-dua-arabic" dir="rtl" lang="ar">{dua.arabic}</p>
                  {dua.transliteration ? (
                    <p className="prayers-dua-translit">{dua.transliteration}</p>
                  ) : null}
                  <p className="prayers-dua-translation">
                    {lang === "fr" ? dua.fr : dua.en}
                    {lang === "ar" ? (
                      <small className="prayers-dua-lang-note">{t("prayers.duasLangNote", lang)}</small>
                    ) : null}
                  </p>
                  <footer className="prayers-dua-source">{dua.source}</footer>
                </article>
              ))}
            </section>
          ) : null}
        </section>
      ) : view === "week" ? (
        <section className="prayers-grid-view" aria-label={t("prayers.views.week", lang)}>
          <div className="prayers-week-grid" role="table">
            <span className="prayers-grid-corner" aria-hidden="true" />
            {week.map((day) => (
              <span key={`${day.date.toISOString()}`} className="prayers-grid-colhead" role="columnheader">
                <small>{day.date.toLocaleDateString(locale, { weekday: "short" })}</small>
                <strong>{day.date.getDate()}</strong>
              </span>
            ))}
            {PRAYER_KEYS.map((key, keyIndex) => (
              <React.Fragment key={key}>
                <span className="prayers-grid-rowhead" role="rowheader">
                  {t(`prayer.names.${key}`, lang)}
                </span>
                {week.map((day) => {
                  const cell = day.cells[keyIndex];
                  return (
                    <span
                      key={`${day.date.toISOString()}-${key}`}
                      role="cell"
                      className={`prayers-grid-cell${cell === "prayed" ? " is-prayed" : cell ? " is-answered" : ""}${day.future ? " is-future" : ""}`}
                    >
                      <span className="prayers-sr">
                        {`${t(`prayer.names.${key}`, lang)} ${day.date.toLocaleDateString(locale)} — ${
                          cell === "prayed"
                            ? t("prayers.prayed", lang)
                            : cell
                              ? t("prayers.notYet", lang)
                              : day.future
                                ? t("prayers.upcoming", lang)
                                : t("prayers.unmarkedAria", lang)
                        }`}
                      </span>
                    </span>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
          <p className="prayers-private-note">{t("prayers.privateNote", lang)}</p>
        </section>
      ) : (
        <section className="prayers-grid-view" aria-label={t("prayers.views.month", lang)}>
          <h2 className="prayers-month-title">
            {now.toLocaleDateString(locale, { month: "long", year: "numeric" })}
          </h2>
          <div className="prayers-month-grid">
            {month.map((day) => (
              <div
                key={`${day.date.toISOString()}`}
                className={`prayers-month-cell${day.date.toDateString() === now.toDateString() ? " is-today" : ""}${day.future ? " is-future" : ""}`}
              >
                <span className="prayers-month-daynum">{day.date.getDate()}</span>
                <span className="prayers-month-dots" aria-hidden="true">
                  {day.counts.map((cell, index) => (
                    <i
                      key={PRAYER_KEYS[index]}
                      className={cell === "prayed" ? "is-prayed" : cell ? "is-answered" : ""}
                    />
                  ))}
                </span>
                <span className="prayers-sr">
                  {`${day.date.toLocaleDateString(locale)} — ${day.counts.filter((c) => c === "prayed").length}/5`}
                </span>
              </div>
            ))}
          </div>
          <p className="prayers-month-total">
            {t("prayers.monthTotal", lang, monthTotal)}
          </p>
          <p className="prayers-private-note">{t("prayers.privateNote", lang)}</p>
        </section>
      )}
    </div>
  );
}
