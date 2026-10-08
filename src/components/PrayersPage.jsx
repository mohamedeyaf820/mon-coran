import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  Circle,
  Clock,
  Home,
  Info,
  Loader2,
  LocateFixed,
  MapPin,
  MoonStar,
  RefreshCw,
  Settings2,
  Sparkles,
  Sunrise,
} from "lucide-react";
import "../styles/domains/prayers-page.css";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import { usePrayerTimes } from "../hooks/usePrayerTimes";
import {
  PRAYER_KEYS,
  PRAYER_METHODS,
  formatCountdown,
  localDayKey,
  normalizePrayerMethod,
} from "../services/prayerTimesService";
import { nearestPrayerCity } from "../data/prayerCities";
import PrayerLocationPicker from "./prayers/PrayerLocationPicker";
import PrayerMethodPicker from "./prayers/PrayerMethodPicker";
import { POST_ADHAN_DUAS } from "../data/adhanDuas";

// The Arabic locale is a lazy chunk, absent while the app reads in French or
// English: the Arabic name beside each prayer must not depend on it.
const ARABIC_NAMES = { Fajr: "الفجر", Dhuhr: "الظهر", Asr: "العصر", Maghrib: "المغرب", Isha: "العشاء" };

const cityNameIn = (city, lang) => (lang === "ar" ? city.ar : lang === "en" ? city.en : city.fr);

function formatCoordinates(location) {
  const lat = `${Math.abs(location.latitude).toFixed(2)}° ${location.latitude >= 0 ? "N" : "S"}`;
  const lon = `${Math.abs(location.longitude).toFixed(2)}° ${location.longitude >= 0 ? "E" : "W"}`;
  return `${lat}, ${lon}`;
}

function formatOffset(minutes) {
  const sign = minutes > 0 ? "+" : "−";
  const abs = Math.abs(minutes);
  const hours = Math.floor(abs / 60);
  const rest = abs % 60;
  return `${sign}${hours}${rest ? `:${String(rest).padStart(2, "0")}` : ""} h`;
}

/**
 * « Horaires de prière » — today's five prayers for the reader's place, then,
 * only if they opt in, a private mirror of what they prayed. Choosing the
 * place happens here (position or city), not in Settings. Marks are stored
 * locally and encrypted; the page deliberately builds no score, it only shows
 * what was tapped today, this week, this month.
 */
export default function PrayersPage() {
  const { state, set } = useApp();
  const { lang } = state;
  const isRtl = lang === "ar";
  const locale = lang === "ar" ? "ar-SA" : lang === "en" ? "en-GB" : "fr-FR";
  const [now, setNow] = useState(() => new Date());
  const [view, setView] = useState("day");
  const [changingPlace, setChangingPlace] = useState(false);
  const panelRendered = Boolean(state.prayerLocation) && (view === "day" || Boolean(state.prayerTrackingEnabled));
  const [log, setLog] = useState({});
  const prayer = usePrayerTimes({
    enabled: Boolean(state.prayerLocation),
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
      const dayKey = localDayKey(now);
      const wasPrayed = log[dayKey]?.[prayerKey]?.p === true;
      const { markPrayer } = await import("../services/prayerLogService");
      markPrayer(dayKey, prayerKey, wasPrayed ? null : "prayed");
      await refreshLog();
    },
    [log, now, refreshLog],
  );

  const todayEntries = log[localDayKey(now)] || {};
  const timings = prayer.status === "ready" ? prayer.data.timings : null;
  const clock = prayer.placeNow || now;
  const nowMinutes = clock.getHours() * 60 + clock.getMinutes();
  // A chosen city keeps its name; a GPS position is named after the closest
  // listed city (no geocoding request) or, failing that, shown as coordinates.
  const placeName = (() => {
    const location = state.prayerLocation;
    if (!location) return "";
    if (location.label) return location.label;
    const near = nearestPrayerCity(location.latitude, location.longitude);
    return near
      ? t("prayers.nearCity", lang).replace("{city}", cityNameIn(near.city, lang))
      : t("prayers.positionAt", lang).replace("{coordinates}", formatCoordinates(location));
  })();
  const isMyPosition = Boolean(state.prayerLocation) && !state.prayerLocation.label;
  // The place as a plain noun phrase, for sentences ("the times of …").
  const placeShort = (() => {
    const location = state.prayerLocation;
    if (!location) return "";
    if (location.label) return location.label;
    const near = nearestPrayerCity(location.latitude, location.longitude);
    return near ? cityNameIn(near.city, lang) : t("prayers.thisPosition", lang);
  })();
  const methodEntry = PRAYER_METHODS.find((item) => item.id === normalizePrayerMethod(state.prayerMethod, lang));
  const methodName = methodEntry ? methodEntry[lang] || methodEntry.fr : "";

  const week = useMemo(() => {
    const days = [];
    const start = new Date(now);
    // Monday-first week.
    start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    for (let i = 0; i < 7; i += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const entries = log[localDayKey(date)] || {};
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
      const entries = log[localDayKey(date)] || {};
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
        <button
          type="button"
          className="prayers-back-btn"
          aria-label={t("ux.prayerSettings", lang)}
          onClick={() => set({ settingsActiveTab: "prayer", settingsOpen: true })}
        >
          <Settings2 size={15} aria-hidden="true" />
          <span>{t("nav.settings", lang)}</span>
        </button>
      </section>

      {/* Only the selected tab owns a panel, and only once the page has what it
          needs to draw one: a reference to an absent id is invalid ARIA. */}
      {state.prayerLocation ? <div className="prayers-view-switch" role="tablist" aria-label={t("prayers.switchAria", lang)}>
        {[
          { id: "day", icon: Clock },
          { id: "week", icon: CalendarDays },
          { id: "month", icon: MoonStar },
        ].map(({ id, icon: Icon }, index, tabs) => (
          <button
            key={id}
            id={`prayers-tab-${id}`}
            type="button"
            role="tab"
            aria-selected={view === id}
            aria-controls={view === id && panelRendered ? `prayers-panel-${id}` : undefined}
            tabIndex={view === id ? 0 : -1}
            className={`prayers-view-btn${view === id ? " is-active" : ""}`}
            onClick={() => setView(id)}
            onKeyDown={(event) => {
              const forward = isRtl ? "ArrowLeft" : "ArrowRight";
              const backward = isRtl ? "ArrowRight" : "ArrowLeft";
              let nextIndex;
              if (event.key === forward) nextIndex = (index + 1) % tabs.length;
              else if (event.key === backward) nextIndex = (index - 1 + tabs.length) % tabs.length;
              else if (event.key === "Home") nextIndex = 0;
              else if (event.key === "End") nextIndex = tabs.length - 1;
              else return;
              event.preventDefault();
              setView(tabs[nextIndex].id);
              document.getElementById(`prayers-tab-${tabs[nextIndex].id}`)?.focus();
            }}
          >
            <Icon size={14} aria-hidden="true" />
            <span>{t(`prayers.views.${id}`, lang)}</span>
          </button>
        ))}
      </div> : null}

      {!state.prayerLocation ? (
        <section className="prayers-empty prayers-onboarding card" aria-labelledby="prayers-onboarding-title">
          <MapPin size={22} aria-hidden="true" />
          <h2 id="prayers-onboarding-title">{t("prayers.noLocationTitle", lang)}</h2>
          <p>{t("prayers.noLocationBody", lang)}</p>
          <PrayerLocationPicker lang={lang} set={set} methodAuto={state.prayerMethodAuto !== false} autoDetect />
        </section>
      ) : view !== "day" && !state.prayerTrackingEnabled ? (
        <div className="prayers-empty card">
          <Sparkles size={18} aria-hidden="true" />
          <p>{t("ux.prayerTrackingHint", lang)}</p>
          <button type="button" className="prayers-enable-btn" onClick={() => set({ prayerTrackingEnabled: true })}>
            {t("ux.enablePrayerTracking", lang)}
          </button>
        </div>
      ) : view === "day" ? (
        <section id="prayers-panel-day" role="tabpanel" aria-labelledby="prayers-tab-day" className="prayers-day" aria-label={t("prayers.views.day", lang)}>
          <div className="prayers-place">
            <span className="prayers-place__name">
              {isMyPosition ? <LocateFixed size={16} aria-hidden="true" /> : <MapPin size={16} aria-hidden="true" />}
              <span>{placeName}</span>
            </span>
            <button
              type="button"
              className="prayers-place__change"
              aria-expanded={changingPlace}
              aria-controls="prayers-place-panel"
              onClick={() => setChangingPlace((open) => !open)}
            >
              {t(changingPlace ? "prayers.closePlace" : "prayers.changePlace", lang)}
            </button>
          </div>
          {changingPlace ? (
            <div id="prayers-place-panel" className="prayers-place__panel card">
              <PrayerLocationPicker
                lang={lang}
                set={set}
                currentLabel={state.prayerLocation.label}
                methodAuto={state.prayerMethodAuto !== false}
                onDone={() => setChangingPlace(false)}
              />
            </div>
          ) : null}

          {prayer.status === "ready" && prayer.offsetMinutes ? (
            <p className="prayers-zone-note" role="note">
              {t("prayers.otherTimezone", lang)
                .replace("{place}", placeShort)
                .replace("{offset}", formatOffset(prayer.offsetMinutes))}
            </p>
          ) : null}

          {prayer.status === "ready" ? (
            <section className="prayers-next" aria-labelledby="prayers-next-label">
              {prayer.next ? (
                <>
                  <p id="prayers-next-label" className="prayers-next__label">{t("prayer.next", lang)}</p>
                  <p className="prayers-next__main">
                    <strong>{t(`prayer.names.${prayer.next.key}`, lang)}</strong>
                    <span className="prayers-next__time" dir="ltr">{prayer.next.hhmm}</span>
                  </p>
                  <p className="prayers-next__countdown">{formatCountdown(prayer.next.minutesUntil, lang)}</p>
                </>
              ) : (
                <>
                  <p id="prayers-next-label" className="prayers-next__label">{t("prayer.today", lang)}</p>
                  <p className="prayers-next__done">{t("prayer.afterIsha", lang)}</p>
                </>
              )}
            </section>
          ) : null}

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
          {prayer.status === "offline" || prayer.status === "error" ? (
            <div className="prayers-problem" role="alert">
              <p>{t(prayer.status === "offline" ? "prayer.offline" : "prayer.error", lang)}</p>
              <button type="button" className="prayers-problem__retry" onClick={prayer.refresh}>
                <RefreshCw size={15} aria-hidden="true" />
                <span>{t("prayer.retry", lang)}</span>
              </button>
            </div>
          ) : null}
          {prayer.data?.stale ? <p className="prayers-hint">{t("prayer.stale", lang)}</p> : null}
          <ul className="prayers-day-list">
            {PRAYER_KEYS.flatMap((key) => {
              const entry = todayEntries[key];
              const prayed = entry?.p === true;
              const time = timings?.[key]?.hhmm;
              const isNext = prayer.next?.key === key;
              const isPast = Boolean(timings?.[key]) && !isNext && timings[key].minutes <= nowMinutes;
              const rows = [];
              if (key === "Dhuhr") {
                rows.push(
                  <li key="Sunrise" className="prayers-day-sun">
                    <span className="prayers-day-name">
                      <Sunrise size={15} aria-hidden="true" />
                      <span>{t("prayer.names.Sunrise", lang)}</span>
                    </span>
                    <span className="prayers-day-time" dir="ltr">{timings?.Sunrise?.hhmm || "—"}</span>
                    <small className="prayers-day-sun__note">{t("prayer.sunriseNote", lang)}</small>
                  </li>,
                );
              }
              rows.push(
                <li
                  key={key}
                  className={`prayers-day-row${prayed ? " is-done" : ""}${isNext ? " is-next" : ""}${isPast ? " is-past" : ""}`}
                  aria-current={isNext ? "time" : undefined}
                >
                  <span className="prayers-day-name">
                    <strong>{t(`prayer.names.${key}`, lang)}</strong>
                    {lang !== "ar" ? (
                      <span className="prayers-day-name-ar" dir="rtl" lang="ar">
                        {ARABIC_NAMES[key]}
                      </span>
                    ) : null}
                    {isNext ? <span className="prayers-day-badge">{t("prayers.nextBadge", lang)}</span> : null}
                  </span>
                  <span className="prayers-day-time" dir="ltr">{time || "—"}</span>
                  {!prayed && entry?.s === 1 ? (
                    <span className="prayers-day-flag">{t("prayers.notYet", lang)}</span>
                  ) : null}
                  {state.prayerTrackingEnabled ? <button
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
                  </button> : null}
                </li>,
              );
              return rows;
            })}
          </ul>
          <PrayerMethodPicker
            lang={lang}
            set={set}
            location={state.prayerLocation}
            methodId={state.prayerMethod}
            auto={state.prayerMethodAuto !== false}
          />
          <details className="prayers-how">
            <summary>
              <Info size={16} aria-hidden="true" />
              <span>{t("prayers.howTitle", lang)}</span>
            </summary>
            <ol>
              <li>{t("prayers.howPlace", lang)}</li>
              <li>{t("prayers.howNext", lang)}</li>
              <li>{t("prayers.howMethod", lang).replace("{method}", methodName)}</li>
              <li>{t("prayers.howMore", lang)}</li>
            </ol>
            <button
              type="button"
              className="prayers-how__settings"
              onClick={() => set({ settingsActiveTab: "prayer", settingsOpen: true })}
            >
              <Settings2 size={15} aria-hidden="true" />
              <span>{t("prayers.howSettings", lang)}</span>
            </button>
          </details>
          {state.prayerTrackingEnabled ? (
            <p className="prayers-private-note">{t("prayers.privateNote", lang)}</p>
          ) : (
            <div className="prayers-empty card">
              <Sparkles size={18} aria-hidden="true" />
              <p>{t("ux.prayerTrackingHint", lang)}</p>
              <button type="button" className="prayers-enable-btn" onClick={() => set({ prayerTrackingEnabled: true })}>
                {t("ux.enablePrayerTracking", lang)}
              </button>
            </div>
          )}
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
                    <p className="prayers-dua-translit" dir="ltr">{dua.transliteration}</p>
                  ) : null}
                  <p className="prayers-dua-translation">
                    <span className="prayers-dua-translation__text" lang={lang === "fr" ? "fr" : "en"} dir="ltr">
                      {lang === "fr" ? dua.fr : dua.en}
                    </span>
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
        <section id="prayers-panel-week" role="tabpanel" aria-labelledby="prayers-tab-week" className="prayers-grid-view" aria-label={t("prayers.views.week", lang)}>
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
        <section id="prayers-panel-month" role="tabpanel" aria-labelledby="prayers-tab-month" className="prayers-grid-view" aria-label={t("prayers.views.month", lang)}>
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
