import React, { useId, useState } from "react";
import { Calculator } from "lucide-react";
import { t } from "../../i18n";
import { PRAYER_METHODS, normalizePrayerMethod } from "../../services/prayerTimesService";
import { suggestPrayerMethod } from "../../data/prayerRegions";

function anglesLine(method, lang) {
  const isha = method.ishaMin
    ? t("prayers.ishaAfterMaghrib", lang).replace("{minutes}", method.ishaMin)
    : `${method.isha}°`;
  return t("prayers.anglesLine", lang).replace("{fajr}", `${method.fajr}°`).replace("{isha}", isha);
}

/**
 * Which rule computes the times. The app proposes the one used where the
 * reader is (Umm al-Qura in Makkah, the UOIF in France, the Moroccan
 * authority in Morocco...) and says so; the reader can follow another
 * authority, e.g. their mosque's, in two taps without opening Settings.
 */
export default function PrayerMethodPicker({ lang, set, location, methodId, auto }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const current = normalizePrayerMethod(methodId, lang);
  const recommended = location ? suggestPrayerMethod(location.latitude, location.longitude) : current;
  const name = (method) => method[lang] || method.fr;
  const currentMethod = PRAYER_METHODS.find((item) => item.id === current) || PRAYER_METHODS[0];
  const ordered = [
    ...PRAYER_METHODS.filter((item) => item.id === recommended),
    ...PRAYER_METHODS.filter((item) => item.id !== recommended),
  ];

  const choose = (id) => set({ prayerMethod: id, prayerMethodAuto: id === recommended });

  return (
    <section className="prayers-method" aria-labelledby={`${panelId}-title`}>
      <div className="prayers-method__summary">
        <Calculator size={17} aria-hidden="true" />
        <div className="prayers-method__text">
          <p id={`${panelId}-title`} className="prayers-method__label">{t("prayers.methodLabel", lang)}</p>
          <p className="prayers-method__name">{name(currentMethod)}</p>
          <p className="prayers-method__why">
            {current === recommended
              ? t("prayers.methodMatchesRegion", lang)
              : t("prayers.methodChosenByYou", lang).replace("{recommended}", name(PRAYER_METHODS.find((item) => item.id === recommended) || currentMethod))}
          </p>
        </div>
        <button
          type="button"
          className="prayers-place__change prayers-method__change"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          {t(open ? "prayers.closePlace" : "prayers.methodChange", lang)}
        </button>
      </div>
      {open ? (
        <fieldset id={panelId} className="prayers-method__panel">
          <legend>{t("prayers.methodExplain", lang)}</legend>
          <ul>
            {ordered.map((method) => {
              const selected = method.id === current;
              return (
                <li key={method.id}>
                  <label className={`prayers-method__option${selected ? " is-selected" : ""}`}>
                    <input
                      type="radio"
                      name={`${panelId}-method`}
                      checked={selected}
                      onChange={() => choose(method.id)}
                    />
                    <span className="prayers-method__dot" aria-hidden="true" />
                    <span className="prayers-method__option-body">
                      <strong>
                        {name(method)}
                        {method.id === recommended ? (
                          <span className="prayers-day-badge">{t("prayers.methodRecommended", lang)}</span>
                        ) : null}
                      </strong>
                      <small>{[method.where?.[lang] || method.where?.fr, anglesLine(method, lang)].filter(Boolean).join(" · ")}</small>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          {!auto && current !== recommended ? (
            <p className="prayers-method__note">{t("prayers.methodStaysNote", lang)}</p>
          ) : null}
        </fieldset>
      ) : null}
    </section>
  );
}
