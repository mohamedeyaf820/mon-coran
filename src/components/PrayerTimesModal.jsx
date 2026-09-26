import React, { useCallback, useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  CloudSun,
  Loader2,
  MapPin,
  MoonStar,
  RefreshCw,
  Sun,
  SunDim,
  Sunset,
  Sunrise,
  X,
} from "lucide-react";
import "../styles/domains/prayer-times.css";
import { t } from "../i18n";
import {
  DISPLAYED_TIME_KEYS,
  PRAYER_METHODS,
  formatCountdown,
  requestLocation,
} from "../services/prayerTimesService";
import {
  ensureNotificationPermission,
  getNotificationPermission,
} from "../services/notificationService";

function timezoneToCity(timezone) {
  const raw = String(timezone || "").split("/").pop() || "";
  return raw.replace(/_/g, " ");
}

// One metaphor per moment of the day. Every row carries its own icon, even
// when another state (next, past) is what the row is really about.
const PRAYER_ICONS = {
  Fajr: CloudSun,
  Sunrise: Sunrise,
  Dhuhr: Sun,
  Asr: SunDim,
  Maghrib: Sunset,
  Isha: MoonStar,
};

export default function PrayerTimesModal({
  lang,
  now,
  prayer,
  enabled,
  method,
  location,
  reminders,
  set,
  onClose,
}) {
  const { status, data, next } = prayer;
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [permission, setPermission] = useState(getNotificationPermission);
  const [permissionAsked, setPermissionAsked] = useState(false);
  const locale = lang === "ar" ? "ar-SA" : lang === "en" ? "en-GB" : "fr-FR";

  // Name the saved position from the API timezone once the first fetch lands;
  // geolocation alone only gives coordinates.
  useEffect(() => {
    const city = data?.timezone ? timezoneToCity(data.timezone) : "";
    if (city && location && !location.label) {
      set({ prayerLocation: { ...location, label: city } });
    }
  }, [data?.timezone, location, set]);

  const detectLocation = useCallback(async () => {
    setLocating(true);
    setLocationError("");
    try {
      const position = await requestLocation();
      set({
        prayerTimesEnabled: true,
        prayerLocation: {
          latitude: position.latitude,
          longitude: position.longitude,
          label: "",
        },
      });
    } catch (error) {
      const key =
        error?.code === 1 || error?.PERMISSION_DENIED
          ? "prayer.locationDenied"
          : error?.code === 2 || error?.code === 3
            ? "prayer.locationError"
            : "prayer.locationUnsupported";
      setLocationError(t(key, lang));
    } finally {
      setLocating(false);
    }
  }, [lang, set]);

  const toggleReminders = useCallback(async () => {
    if (reminders) {
      set({ prayerReminders: false });
      return;
    }
    const result = await ensureNotificationPermission();
    setPermission(result);
    setPermissionAsked(true);
    if (result === "granted") {
      set({ prayerReminders: true });
    }
  }, [reminders, set]);

  const remindersBlocked = reminders && permission === "denied";
  const permissionMissing = permissionAsked && permission !== "granted" && !reminders;

  // The modal exists to answer one question: when is the next prayer? After
  // Isha the target becomes tomorrow's Fajr so the countdown never dies.
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const fajrEntry = data?.timings?.Fajr;
  const heroKey = next?.key || (fajrEntry ? "Fajr" : "");
  const heroTime = next ? next.hhmm : fajrEntry?.hhmm || "";
  const heroCountdown = next
    ? formatCountdown(next.minutesUntil, lang)
    : fajrEntry
      ? formatCountdown(1440 - nowMinutes + fajrEntry.minutes, lang)
      : "";
  const HeroIcon = PRAYER_ICONS[heroKey];

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <div className="modal-overlay prayer-modal-overlay" onClick={onClose}>
          <Dialog.Content
            className="modal prayer-modal"
            onClick={(event) => event.stopPropagation()}
            onEscapeKeyDown={onClose}
            onInteractOutside={onClose}
          >
            <header className="prayer-modal__header">
              <div>
                <Dialog.Title>{t("prayer.title", lang)}</Dialog.Title>
                <Dialog.Description className="prayer-modal__date">
                  <time dateTime={now.toISOString()}>
                    {now.toLocaleDateString(locale, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </time>
                  {data?.hijri ? <span dir="rtl" lang="ar">{data.hijri}</span> : null}
                </Dialog.Description>
              </div>
              <button
                type="button"
                className="modal-close prayer-modal__close"
                onClick={onClose}
                aria-label={t("prayer.closeAria", lang)}
              >
                <X size={16} />
              </button>
            </header>

            {status === "ready" && data && heroKey ? (
              <div className="prayer-modal__hero">
                <span className="prayer-modal__hero-icon" aria-hidden="true">
                  {HeroIcon ? <HeroIcon size={20} /> : null}
                </span>
                <div className="prayer-modal__hero-copy">
                  <span className="prayer-modal__hero-kicker">{t("prayer.next", lang)}</span>
                  <strong className="prayer-modal__hero-name">
                    {t(`prayer.names.${heroKey}`, lang)}
                    {lang !== "ar" ? (
                      <span dir="rtl" lang="ar">{t(`prayer.names.${heroKey}`, "ar")}</span>
                    ) : null}
                  </strong>
                </div>
                <div className="prayer-modal__hero-time">
                  <span className="prayer-modal__hero-clock" dir="ltr">{heroTime}</span>
                  <span className="prayer-modal__hero-countdown">{heroCountdown}</span>
                </div>
              </div>
            ) : null}
            {status === "ready" && data && !next ? (
              <p className="prayer-modal__note">{t("prayer.afterIsha", lang)}</p>
            ) : null}

            <div className="prayer-modal__location">
              <span className="prayer-modal__location-label">
                <MapPin size={14} aria-hidden="true" />
                {location?.label
                  ? location.label
                  : location
                    ? `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`
                    : t("prayer.noLocationYet", lang)}
              </span>
              <button
                type="button"
                className="prayer-modal__detect"
                onClick={detectLocation}
                disabled={locating}
              >
                {locating
                  ? <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                  : <MapPin size={14} aria-hidden="true" />}
                <span>{locating ? t("prayer.detecting", lang) : t("prayer.detectLocation", lang)}</span>
              </button>
            </div>
            {locationError ? (
              <p className="prayer-modal__alert" role="alert">{locationError}</p>
            ) : null}

            {status === "ready" && data ? (
              <ul className="prayer-modal__list">
                {DISPLAYED_TIME_KEYS.map((key) => {
                  const entry = data.timings[key];
                  const isNext = next?.key === key;
                  const isSunrise = key === "Sunrise";
                  const isPast = !isNext && !isSunrise && entry.minutes <= nowMinutes;
                  const RowIcon = PRAYER_ICONS[key];
                  return (
                    <li
                      key={key}
                      className={`prayer-modal__row${isNext ? " is-next" : ""}${isSunrise ? " is-sunrise" : ""}${isPast ? " is-past" : ""}`}
                      aria-current={isNext ? "true" : undefined}
                    >
                      <span className="prayer-modal__row-icon" aria-hidden="true">
                        {RowIcon ? <RowIcon size={15} /> : null}
                      </span>
                      <span className="prayer-modal__row-name">
                        <span className="prayer-modal__row-label">
                          {t(`prayer.names.${key}`, lang)}
                          {lang !== "ar" ? (
                            <span className="prayer-modal__row-ar" dir="rtl" lang="ar">
                              {t(`prayer.names.${key}`, "ar")}
                            </span>
                          ) : null}
                        </span>
                        {isSunrise ? <small>{t("prayer.sunriseNote", lang)}</small> : null}
                        {isNext ? <em>{t("prayer.next", lang)}</em> : null}
                      </span>
                      <span className="prayer-modal__row-time" dir="ltr">{entry.hhmm}</span>
                    </li>
                  );
                })}
              </ul>
            ) : status === "loading" ? (
              <p className="prayer-modal__hint" role="status">
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                {t("prayer.loading", lang)}
              </p>
            ) : (
              <div className="prayer-modal__banner" role="alert">
                <span>{t(status === "offline" ? "prayer.offline" : "prayer.error", lang)}</span>
                <button type="button" className="prayer-modal__retry" onClick={prayer.refresh}>
                  <RefreshCw size={13} aria-hidden="true" />
                  {t("prayer.retry", lang)}
                </button>
              </div>
            )}

            {data?.stale ? (
              <p className="prayer-modal__note">{t("prayer.stale", lang)}</p>
            ) : null}

            <div className="prayer-modal__settings">
              <label className="prayer-modal__field">
                <span>{t("prayer.method", lang)}</span>
                <select
                  className="prayer-modal__select"
                  value={method}
                  onChange={(event) => set({ prayerMethod: Number(event.target.value) })}
                >
                  {PRAYER_METHODS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {lang === "ar" ? item.ar : lang === "en" ? item.en : item.fr}
                    </option>
                  ))}
                </select>
              </label>

              <label className="prayer-modal__switch-row" htmlFor="prayer-reminders-toggle">
                <span className="prayer-modal__switch-copy">
                  <span className="prayer-modal__switch-label">{t("prayer.reminders", lang)}</span>
                  <span className="prayer-modal__switch-hint">{t("prayer.remindersHint", lang)}</span>
                </span>
                <span className="prayer-modal__switch" aria-hidden="true" data-state={reminders ? "checked" : "unchecked"}>
                  <span />
                </span>
                <input
                  id="prayer-reminders-toggle"
                  type="checkbox"
                  checked={Boolean(reminders)}
                  onChange={toggleReminders}
                  className="prayer-modal__visually-hidden"
                />
              </label>
              {permissionMissing || remindersBlocked ? (
                <p className="prayer-modal__note is-warning" role="alert">{t("prayer.remindersDenied", lang)}</p>
              ) : null}

              <label className="prayer-modal__switch-row" htmlFor="prayer-home-toggle">
                <span className="prayer-modal__switch-copy">
                  <span className="prayer-modal__switch-label">{t("prayer.cardEnable", lang)}</span>
                </span>
                <span className="prayer-modal__switch" aria-hidden="true" data-state={enabled ? "checked" : "unchecked"}>
                  <span />
                </span>
                <input
                  id="prayer-home-toggle"
                  type="checkbox"
                  checked={Boolean(enabled)}
                  onChange={(event) => set({ prayerTimesEnabled: event.target.checked })}
                  className="prayer-modal__visually-hidden"
                />
              </label>

              <button
                type="button"
                className="prayer-modal__tracker-link"
                onClick={() =>
                  set({
                    prayerModalOpen: false,
                    showPrayers: true,
                    showHome: false,
                    showDuas: false,
                  })
                }
              >
                {t("prayer.openTracker", lang)}
              </button>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
