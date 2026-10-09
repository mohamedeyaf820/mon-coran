import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CloudOff,
  Loader2,
  MapPin,
  Sunrise,
} from "lucide-react";
import { t } from "../../i18n";
import {
  PRAYER_KEYS,
  formatCountdown,
} from "../../services/prayerTimesService";
import "../../styles/domains/prayer-times.css";

/**
 * The home "Aujourd'hui" panel's prayer block: the next prayer up front with
 * its countdown, then the whole day as five quiet rows. Everything here is a
 * single affordance — it opens the detail modal — and it stays under the
 * Quran text in weight: one accent (the next row), no decoration elsewhere.
 */
export default function PrayerTimesCard({ lang, isRtl, status, next, timings, now, onOpen }) {
  let icon = <Sunrise size={15} aria-hidden="true" />;
  let title = t("prayer.cardEnable", lang);
  let detail = t("prayer.cardEnableHint", lang);
  let time = "";
  let stateClass = "is-idle";

  if (status === "no-location") {
    icon = <MapPin size={15} aria-hidden="true" />;
    detail = t("prayer.noLocationYet", lang);
    stateClass = "is-idle";
  } else if (status === "loading") {
    icon = <Loader2 size={15} className="animate-spin" aria-hidden="true" />;
    detail = t("prayer.loading", lang);
    stateClass = "is-loading";
  } else if (status === "offline") {
    icon = <CloudOff size={15} aria-hidden="true" />;
    detail = t("prayer.offline", lang);
    stateClass = "is-error";
  } else if (status === "error") {
    icon = <AlertTriangle size={15} aria-hidden="true" />;
    detail = t("prayer.error", lang);
    stateClass = "is-error";
  } else if (status === "ready") {
    stateClass = "is-ready";
    if (next) {
      title = t("prayer.next", lang);
      detail = t(`prayer.names.${next.key}`, lang);
      time = next.hhmm;
    } else {
      title = t("prayer.title", lang);
      detail = t("prayer.afterIsha", lang);
    }
  }

  const nowMinutes = now ? now.getHours() * 60 + now.getMinutes() : -1;

  return (
    <div className={`home-prayer-block ${stateClass}`}>
      {status === "ready" && next ? (
        <span className="home-prayer-block__kicker">{t("prayer.next", lang)}</span>
      ) : null}
      <button
        type="button"
        className={`home-prayer-strip ${stateClass}`}
        onClick={onOpen}
        aria-label={
          status === "ready" && next
            ? `${t("prayer.next", lang)}: ${t(`prayer.names.${next.key}`, lang)} ${next.hhmm} — ${formatCountdown(next.minutesUntil, lang)}`
            : `${title} — ${detail}`
        }
      >
        <span className="home-prayer-strip__icon" aria-hidden="true">{icon}</span>
        <span className="home-prayer-strip__copy">
          <strong>{status === "ready" && next ? `${t(`prayer.names.${next.key}`, lang)}` : title}</strong>
          <small>
            {status === "ready" && next ? formatCountdown(next.minutesUntil, lang) : detail}
          </small>
        </span>
        {time ? (
          <span className="home-prayer-strip__time" dir="ltr">{time}</span>
        ) : null}
        <span className="home-prayer-strip__arrow" aria-hidden="true">
          {isRtl ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
        </span>
      </button>

      {status === "ready" && timings ? (
        <ul className="home-prayer-daylist">
          {PRAYER_KEYS.map((key) => {
            const entry = timings[key];
            if (!entry) return null;
            const isNext = next?.key === key;
            const isPast = !isNext && entry.minutes <= nowMinutes;
            return (
              <li key={key} className={isNext ? "is-next" : isPast ? "is-past" : ""}>
                <button type="button" onClick={onOpen} aria-current={isNext ? "true" : undefined}>
                  <span className="home-prayer-daylist__name">
                    {t(`prayer.names.${key}`, lang)}
                  </span>
                  <span className="home-prayer-daylist__time" dir="ltr">{entry.hhmm}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
