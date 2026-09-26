import React, { useCallback, useEffect, useState } from "react";
import { CloudDownload, Loader2, MapPin, Play, Square } from "lucide-react";
import { Section, SwitchRow } from "./controls";
import { t } from "../../i18n";
import { PRAYER_CITIES } from "../../data/prayerCities";
import {
  ADHAN_VOLUME_STEPS,
  POST_REMINDER_CHOICES,
  PRAYER_KEYS,
  PRAYER_METHODS,
  PRE_REMINDER_CHOICES,
  requestLocation,
} from "../../services/prayerTimesService";
import { ADHAN_SOURCES, isAdhanCached } from "../../services/adhanService";
import {
  ensureNotificationPermission,
  getNotificationPermission,
} from "../../services/notificationService";

const OFFSET_RANGE = [-30, -20, -15, -10, -5, 0, 5, 10, 15, 20, 30];

function offsetLabel(minutes, lang) {
  if (minutes === 0) return t("prayers.offsetZero", lang);
  return t("prayers.offsetMinutes", lang).replace("{count}", Math.abs(minutes));
}

function ChoiceGroup({ label, name, options, value, onChange }) {
  return (
    <fieldset className="settings-prayer-choices">
      <legend>{label}</legend>
      <div className="settings-prayer-choices__row">
        {options.map((option) => (
          <label key={option.value} className="settings-prayer-chip">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * « Horaires de prière et Adhan » — the full configuration panel. Location,
 * method and a reminder switch also exist on the home modal; this panel adds
 * what the modal has no room for: per-prayer switches, manual adjustments,
 * the adhan picker with preview and offline download, and the tracking opt-in.
 */
export default function PrayerSettingsSection({ lang, state, set }) {
  const {
    prayerTimesEnabled,
    prayerMethod,
    prayerLocation,
    prayerReminders,
    prayerTimeOffsets,
    prayerNotifications,
    prayerTrackingEnabled,
    prayerPostAdhanDuas,
  } = state;
  const prefs = prayerNotifications || {};
  const prayersOn = prefs.prayers || {};
  const [permission, setPermission] = useState(getNotificationPermission);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [playingId, setPlayingId] = useState("");
  const [cachedIds, setCachedIds] = useState([]);
  const [downloadFailedId, setDownloadFailedId] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all(ADHAN_SOURCES.map((source) => isAdhanCached(source.id)))
      .then((checks) => {
        if (active) {
          setCachedIds(ADHAN_SOURCES.filter((_, index) => checks[index]).map((s) => s.id));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const patchPrefs = useCallback(
    (changes) => set({ prayerNotifications: { ...prefs, ...changes } }),
    [prefs, set],
  );

  const patchPrayerSwitch = useCallback(
    (key, checked) =>
      set({ prayerNotifications: { ...prefs, prayers: { ...prayersOn, [key]: checked } } }),
    [prefs, prayersOn, set],
  );

  const toggleReminders = useCallback(
    async (checked) => {
      if (!checked) {
        set({ prayerReminders: false });
        return;
      }
      const result = await ensureNotificationPermission();
      setPermission(result);
      set({ prayerReminders: result === "granted" });
    },
    [set],
  );

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
    } catch {
      setLocationError(t("prayer.locationError", lang));
    } finally {
      setLocating(false);
    }
  }, [lang, set]);

  const chooseCity = useCallback(
    (cityId) => {
      const city = PRAYER_CITIES.find((entry) => entry.id === cityId);
      if (!city) {
        set({ prayerLocation: null });
        return;
      }
      set({
        prayerTimesEnabled: true,
        prayerLocation: {
          latitude: city.latitude,
          longitude: city.longitude,
          label: lang === "ar" ? city.ar : lang === "en" ? city.en : city.fr,
        },
      });
    },
    [lang, set],
  );

  const previewAdhan = useCallback(
    async (sourceId) => {
      const { playAdhan, stopAdhan } = await import("../../services/adhanService");
      if (playingId === sourceId) {
        stopAdhan();
        setPlayingId("");
        return;
      }
      setPlayingId(sourceId);
      const started = await playAdhan(sourceId, 1).catch(() => false);
      if (!started) setPlayingId("");
    },
    [playingId],
  );

  const downloadAdhan = useCallback(async (sourceId) => {
    const { downloadAdhan: save } = await import("../../services/adhanService");
    const ok = await save(sourceId).catch(() => false);
    setDownloadFailedId(ok ? "" : sourceId);
    if (ok) {
      setCachedIds((current) => (current.includes(sourceId) ? current : [...current, sourceId]));
    }
  }, []);

  const remindersDenied = permission === "denied";
  const selectedCityId =
    PRAYER_CITIES.find(
      (city) =>
        Math.abs(city.latitude - Number(prayerLocation?.latitude ?? 999)) < 0.05 &&
        Math.abs(city.longitude - Number(prayerLocation?.longitude ?? 999)) < 0.05,
    )?.id || "";

  return (
    <>
      <Section title={t("prayers.settingsSection", lang)}>
        <SwitchRow
          id="settings-prayer-enabled"
          checked={prayerTimesEnabled}
          label={t("prayers.enableTimes", lang)}
          description={t("prayers.enableTimesHint", lang)}
          onChange={(checked) => set({ prayerTimesEnabled: checked })}
        />

        <div className="settings-prayer-field">
          <label htmlFor="settings-prayer-city">{t("prayers.city", lang)}</label>
          <div className="settings-prayer-city-row">
            <select
              id="settings-prayer-city"
              className="settings-select"
              value={selectedCityId}
              onChange={(event) => chooseCity(event.target.value)}
            >
              <option value="">
                {prayerLocation
                  ? prayerLocation.label ||
                    `${prayerLocation.latitude.toFixed(2)}, ${prayerLocation.longitude.toFixed(2)}`
                  : t("prayers.cityNone", lang)}
              </option>
              {PRAYER_CITIES.map((city) => (
                <option key={city.id} value={city.id}>
                  {lang === "ar" ? city.ar : lang === "en" ? city.en : city.fr}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="settings-prayer-detect"
              onClick={detectLocation}
              disabled={locating}
            >
              {locating ? (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              ) : (
                <MapPin size={14} aria-hidden="true" />
              )}
              <span>{t("prayer.detectLocation", lang)}</span>
            </button>
          </div>
          <small className="settings-prayer-hint">{t("prayers.cityHint", lang)}</small>
          {locationError ? (
            <small className="settings-prayer-error" role="alert">{locationError}</small>
          ) : null}
        </div>

        <div className="settings-prayer-field">
          <label htmlFor="settings-prayer-method">{t("prayer.method", lang)}</label>
          <select
            id="settings-prayer-method"
            className="settings-select"
            value={prayerMethod}
            onChange={(event) => set({ prayerMethod: Number(event.target.value) })}
          >
            {PRAYER_METHODS.map((item) => (
              <option key={item.id} value={item.id}>
                {lang === "ar" ? item.ar : lang === "en" ? item.en : item.fr}
              </option>
            ))}
          </select>
        </div>
      </Section>

      <Section title={t("prayers.reminderSection", lang)}>
        <SwitchRow
          id="settings-prayer-reminders"
          checked={prayerReminders}
          label={t("prayer.reminders", lang)}
          description={t("prayer.remindersHint", lang)}
          onChange={toggleReminders}
        />
        {remindersDenied ? (
          <p className="settings-prayer-error" role="alert">{t("prayer.remindersDenied", lang)}</p>
        ) : null}

        <fieldset className="settings-prayer-per-list" disabled={!prayerReminders}>
          <legend className="settings-prayer-subtitle">{t("prayers.perPrayer", lang)}</legend>
          {PRAYER_KEYS.map((key) => (
            <SwitchRow
              key={key}
              id={`settings-prayer-on-${key}`}
              checked={prayersOn[key] !== false}
              label={t(`prayer.names.${key}`, lang)}
              onChange={(checked) => patchPrayerSwitch(key, checked)}
            />
          ))}
        </fieldset>

        <ChoiceGroup
          name="prayer-pre"
          label={t("prayers.preReminder", lang)}
          value={prefs.preReminderMinutes || 0}
          onChange={(value) => patchPrefs({ preReminderMinutes: value })}
          options={PRE_REMINDER_CHOICES.map((minutes) => ({
            value: minutes,
            label: minutes
              ? t("prayers.beforeMinutes", lang).replace("{count}", minutes)
              : t("prayers.off", lang),
          }))}
        />
        <ChoiceGroup
          name="prayer-post"
          label={t("prayers.postReminder", lang)}
          value={prefs.postReminderMinutes || 0}
          onChange={(value) => patchPrefs({ postReminderMinutes: value })}
          options={POST_REMINDER_CHOICES.map((minutes) => ({
            value: minutes,
            label: minutes
              ? t("prayers.afterMinutes", lang).replace("{count}", minutes)
              : t("prayers.off", lang),
          }))}
        />
      </Section>

      <Section title={t("prayers.adhanSection", lang)}>
        <SwitchRow
          id="settings-prayer-adhan"
          checked={prefs.adhanEnabled !== false}
          label={t("prayers.adhanEnable", lang)}
          description={t("prayers.adhanEnableHint", lang)}
          onChange={(checked) => patchPrefs({ adhanEnabled: checked })}
        />
        <SwitchRow
          id="settings-prayer-silent"
          checked={Boolean(prefs.silent)}
          label={t("prayers.silent", lang)}
          description={t("prayers.silentHint", lang)}
          onChange={(checked) => patchPrefs({ silent: checked })}
        />

        {ADHAN_SOURCES.length ? (
          <div className="settings-prayer-adhan-list">
            {ADHAN_SOURCES.map((source) => {
              const selected = prefs.adhanSourceId === source.id;
              const cached = cachedIds.includes(source.id);
              return (
                <div key={source.id} className={`settings-prayer-adhan-row${selected ? " is-selected" : ""}`}>
                  <label className="settings-prayer-adhan-pick" htmlFor={`adhan-${source.id}`}>
                    <input
                      id={`adhan-${source.id}`}
                      type="radio"
                      name="adhan-source"
                      checked={selected}
                      onChange={() => patchPrefs({ adhanSourceId: source.id })}
                    />
                    <span>
                      <strong>{lang === "ar" ? source.ar : lang === "en" ? source.en : source.fr}</strong>
                      <small>{source.source}</small>
                    </span>
                  </label>
                  <span className="settings-prayer-adhan-actions">
                    <button
                      type="button"
                      className="settings-prayer-icon-btn"
                      onClick={() => previewAdhan(source.id)}
                      aria-label={t(
                        playingId === source.id ? "prayers.adhanStopAria" : "prayers.adhanPreviewAria",
                        lang,
                      )}
                    >
                      {playingId === source.id ? <Square size={14} /> : <Play size={14} />}
                    </button>
                    <button
                      type="button"
                      className={`settings-prayer-icon-btn${cached ? " is-done" : ""}`}
                      onClick={() => downloadAdhan(source.id)}
                      disabled={cached}
                      aria-label={t(cached ? "prayers.adhanCachedAria" : "prayers.adhanDownloadAria", lang)}
                    >
                      <CloudDownload size={14} />
                    </button>
                  </span>
                  {downloadFailedId === source.id ? (
                    <small className="settings-prayer-error" role="alert">{t("prayers.adhanDownloadFailed", lang)}</small>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="settings-prayer-hint">{t("prayers.adhanComingSoon", lang)}</p>
        )}

        <div className="settings-prayer-field">
          <label htmlFor="settings-prayer-volume">{t("prayers.adhanVolume", lang)}</label>
          <input
            id="settings-prayer-volume"
            type="range"
            min={0}
            max={ADHAN_VOLUME_STEPS.length - 1}
            step={1}
            value={Math.max(0, ADHAN_VOLUME_STEPS.indexOf(prefs.adhanVolume ?? 1))}
            onChange={(event) =>
              patchPrefs({ adhanVolume: ADHAN_VOLUME_STEPS[Number(event.target.value)] ?? 1 })
            }
          />
        </div>
      </Section>

      <Section title={t("prayers.adjustSection", lang)}>
        <p className="settings-prayer-hint">{t("prayers.adjustHint", lang)}</p>
        {PRAYER_KEYS.map((key) => (
          <div className="settings-prayer-field" key={key}>
            <label htmlFor={`prayer-offset-${key}`}>{t(`prayer.names.${key}`, lang)}</label>
            <select
              id={`prayer-offset-${key}`}
              className="settings-select"
              value={prayerTimeOffsets?.[key] ?? 0}
              onChange={(event) =>
                set({
                  prayerTimeOffsets: {
                    ...prayerTimeOffsets,
                    [key]: Number(event.target.value),
                  },
                })
              }
            >
              {OFFSET_RANGE.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {offsetLabel(minutes, lang)}
                </option>
              ))}
            </select>
          </div>
        ))}
      </Section>

      <Section title={t("prayers.trackingSection", lang)}>
        <SwitchRow
          id="settings-prayer-tracking"
          checked={prayerTrackingEnabled}
          label={t("prayers.trackingEnable", lang)}
          description={t("prayers.trackingEnableHint", lang)}
          onChange={(checked) => set({ prayerTrackingEnabled: checked })}
        />
        <SwitchRow
          id="settings-prayer-duas"
          checked={prayerPostAdhanDuas}
          label={t("prayers.showDuas", lang)}
          description={t("prayers.showDuasHint", lang)}
          onChange={(checked) => set({ prayerPostAdhanDuas: checked })}
        />
      </Section>
    </>
  );
}
