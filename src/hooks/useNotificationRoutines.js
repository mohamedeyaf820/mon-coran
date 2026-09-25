import { useEffect } from "react";
import { t } from "../i18n";

const REARM_INTERVAL_MS = 30 * 60 * 1000;

/**
 * App-level notification routines. Both branches stay dormant (and their
 * modules unloaded) until the matching opt-in setting is on. Everything is
 * local to the open page: the browser gives a PWA no reliable background wake,
 * so reminders fire while MushafPlus is open — see notificationService.
 */
export function useNotificationRoutines({
  lang,
  prayerTimesEnabled,
  prayerReminders,
  prayerLocation,
  prayerMethod,
  dailyVerseNotification,
}) {
  useEffect(() => {
    if (!prayerTimesEnabled || !prayerReminders || !prayerLocation) return undefined;
    let active = true;
    let cancelScheduled = () => {};

    const arm = async () => {
      try {
        const [prayerModule, notifModule] = await Promise.all([
          import("../services/prayerTimesService"),
          import("../services/notificationService"),
        ]);
        if (!active) return;
        const data = await prayerModule.fetchTodayTimings({
          latitude: prayerLocation.latitude,
          longitude: prayerLocation.longitude,
          method: prayerMethod,
        });
        if (!active) return;
        cancelScheduled();
        const dates = notifModule.prayerDatesFromTimings(
          data.timings,
          prayerModule.PRAYER_KEYS,
        );
        cancelScheduled = notifModule.schedulePrayerNotifications(dates, {
          buildTitle: (prayer) =>
            t("prayer.notificationTitle", lang).replace(
              "{prayer}",
              t(`prayer.names.${prayer.key}`, lang),
            ),
          buildBody: (prayer) =>
            t("prayer.notificationBody", lang).replace("{time}", prayer.hhmm),
        });
      } catch {
        // A failed arm keeps the previous schedule; the next rearm retries.
      }
    };

    arm();
    const rearm = window.setInterval(arm, REARM_INTERVAL_MS);
    return () => {
      active = false;
      cancelScheduled();
      window.clearInterval(rearm);
    };
  }, [lang, prayerTimesEnabled, prayerReminders, prayerLocation, prayerMethod]);

  useEffect(() => {
    if (!dailyVerseNotification) return undefined;
    let active = true;
    Promise.all([
      import("../services/notificationService"),
      import("../components/Home/homeConstants"),
    ])
      .then(([notif, { DAILY_VERSES, getDailyVerseIndex }]) => {
        if (!active) return;
        if (notif.getNotificationPermission() !== "granted") return;
        const verse = DAILY_VERSES[getDailyVerseIndex(new Date())];
        if (!verse) return;
        notif.maybeNotifyDailyVerse({
          title: t("settings.vodNotificationTitle", lang),
          body: `${verse.text} — ${verse.ref}`.slice(0, 180),
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [dailyVerseNotification, lang]);
}
