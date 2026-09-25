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
import { formatCountdown } from "../../services/prayerTimesService";
import "../../styles/domains/prayer-times.css";

/**
 * One compact row in the home "Aujourd'hui" panel: the next prayer and its
 * countdown when set up, a single enable affordance otherwise. All states are
 * one line so the panel keeps its verse-of-the-day priority.
 */
export default function PrayerTimesCard({ lang, isRtl, status, next, onOpen }) {
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
      title = t(`prayer.names.${next.key}`, lang);
      detail = `${t("prayer.next", lang)} · ${formatCountdown(next.minutesUntil, lang)}`;
      time = next.hhmm;
    } else {
      title = t("prayer.title", lang);
      detail = t("prayer.afterIsha", lang);
    }
  }

  return (
    <button
      type="button"
      className={`home-prayer-strip ${stateClass}`}
      onClick={onOpen}
      aria-label={`${title} — ${detail}`}
    >
      <span className="home-prayer-strip__icon" aria-hidden="true">{icon}</span>
      <span className="home-prayer-strip__copy">
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
      {time ? (
        <span className="home-prayer-strip__time" dir="ltr">{time}</span>
      ) : null}
      <span className="home-prayer-strip__arrow" aria-hidden="true">
        {isRtl ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
      </span>
    </button>
  );
}
