import { useEffect } from "react";
import { t } from "../i18n";

const REARM_INTERVAL_MS = 30 * 60 * 1000;
// One later nudge after a "not yet" answer.
const SNOOZE_MS = 15 * 60 * 1000;

/**
 * App-level notification routines. Both branches stay dormant (and their
 * modules unloaded) until the matching opt-in setting is on. Everything is
 * local to the open page: the browser gives a PWA no reliable background
 * wake, so reminders fire while MushafPlus is open — and catch up the moment
 * it reopens within the planner's windows (see notificationService).
 */
export function useNotificationRoutines({
  lang,
  prayerTimesEnabled,
  prayerReminders,
  prayerLocation,
  prayerMethod,
  prayerTimeOffsets,
  prayerNotifications,
  dailyVerseNotification,
}) {
  useEffect(() => {
    if (!prayerTimesEnabled || !prayerReminders || !prayerLocation) return undefined;
    let active = true;
    let cancelScheduled = () => {};
    let armRequest = 0;

    const arm = async () => {
      const request = ++armRequest;
      try {
        const [prayerModule, notifModule, logModule, plannerModule] = await Promise.all([
          import("../services/prayerTimesService"),
          import("../services/notificationService"),
          import("../services/prayerLogService"),
          import("../services/prayerNotificationPlanner"),
        ]);
        if (!active || request !== armRequest) return;
        if (notifModule.getNotificationPermission() !== "granted") return;
        const data = await prayerModule.fetchTodayTimings({
          latitude: prayerLocation.latitude,
          longitude: prayerLocation.longitude,
          method: prayerMethod,
          offsets: prayerTimeOffsets,
        });
        if (!active || request !== armRequest) return;
        cancelScheduled();

        const prefs = {
          ...prayerModule.DEFAULT_PRAYER_NOTIFICATIONS,
          ...(prayerNotifications || {}),
        };
        const now = new Date();
        // The planner asks about the same day for every item, so decode the key
        // once per day instead of decrypting the whole log in the per-item loop.
        const answersByDay = new Map();
        const dayAnswers = (dayKey) => {
          if (!answersByDay.has(dayKey)) {
            const day = logModule.dayKeyToDate(dayKey);
            answersByDay.set(dayKey, day ? logModule.getDayAnswers(day) : {});
          }
          return answersByDay.get(dayKey);
        };
        const items = plannerModule.planDayNotifications({
          timings: data.timings,
          prefs,
          now,
          isNotified: logModule.hasNotified,
          shouldSkip: (dayKey, prayerKey, kind) => {
            // The stored key carries a 0-based month; reading it back with the
            // 1-based shape looked up the previous month's answers, so a prayer
            // the reader had already marked still earned its reminders.
            const answers = dayAnswers(dayKey);
            if (answers[prayerKey] === "prayed") return true;
            // A pre-nudged past its prayer time is useless; a "pas encore"
            // answer already produced its snooze nudge.
            if (kind === "pre" && answers[prayerKey] != null) return true;
            if (kind === "post" && answers[prayerKey] === "snoozed") return true;
            return false;
          },
        });

        const fire = async (item) => {
          const prayerLabel = t(`prayer.names.${item.prayerKey}`, lang);
          const hhmm = data.timings[item.prayerKey]?.hhmm || "";
          let shown = false;
          if (item.kind === "post") {
            shown = await notifModule.showAppNotification(
              t("prayer.postTitle", lang).replace("{prayer}", prayerLabel),
              t("prayer.postBody", lang),
              {
                tag: `mushafplus-prayer-post-${item.prayerKey}`,
                silent: prefs.silent,
                data: {
                  url: "/prires",
                  prayerAnswer: { dayKey: item.dayKey, prayerKey: item.prayerKey },
                },
                actions: [
                  { action: "prayed", title: t("prayer.answerPrayed", lang) },
                  { action: "not-yet", title: t("prayer.answerNotYet", lang) },
                ],
              },
            );
          } else {
            const title = t("prayer.notificationTitle", lang).replace("{prayer}", prayerLabel);
            const body =
              item.kind === "pre"
                ? t("prayer.preBody", lang).replace("{minutes}", prefs.preReminderMinutes)
                : t("prayer.notificationBody", lang).replace("{time}", hhmm);
            let adhanStarted = false;
            if (item.kind === "adhan" && prefs.adhanEnabled) {
              const { DEFAULT_ADHAN_SOURCE_ID, playAdhan } = await import("../services/adhanService");
              adhanStarted = await playAdhan(
                prefs.adhanSourceId || DEFAULT_ADHAN_SOURCE_ID,
                prefs.adhanVolume,
              ).catch(() => false);
            }
            shown = await notifModule.showAppNotification(title, body, {
              tag: `mushafplus-prayer-${item.kind}-${item.prayerKey}`,
              // Avoid two sounds when the adhan starts. If autoplay is blocked,
              // keep the OS notification audible as the reliable fallback.
              silent: prefs.silent || adhanStarted,
              data: { url: item.kind === "adhan" ? "/prires" : "/" },
            });
          }
          if (shown) logModule.markNotified(item.dayKey, item.prayerKey, item.kind);
        };

        cancelScheduled = notifModule.schedulePrayerNotifications(
          items.map((item) => ({
            ...item,
            shouldFire: () =>
              active && !logModule.hasNotified(item.dayKey, item.prayerKey, item.kind),
            fire: () => fire(item),
          })),
        );
      } catch {
        // A failed arm keeps the previous schedule; the next rearm retries.
      }
    };

    arm();
    const rearm = window.setInterval(arm, REARM_INTERVAL_MS);
    const rearmWhenActive = () => {
      if (document.visibilityState === "visible") arm();
    };
    document.addEventListener("visibilitychange", rearmWhenActive);
    window.addEventListener("pageshow", rearmWhenActive);
    window.addEventListener("online", rearmWhenActive);
    return () => {
      active = false;
      armRequest += 1;
      cancelScheduled();
      window.clearInterval(rearm);
      document.removeEventListener("visibilitychange", rearmWhenActive);
      window.removeEventListener("pageshow", rearmWhenActive);
      window.removeEventListener("online", rearmWhenActive);
    };
  }, [
    lang,
    prayerTimesEnabled,
    prayerReminders,
    prayerLocation,
    prayerMethod,
    prayerTimeOffsets,
    prayerNotifications,
  ]);

  // The log page announces "pas encore" answers here; each earns exactly one
  // later nudge, and only while the app stays open (same platform limit).
  useEffect(() => {
    if (!prayerTimesEnabled || !prayerReminders) return undefined;
    let timer = 0;
    const onAnswer = async (event) => {
      const detail = event.detail;
      if (!detail || detail.answer !== "not-yet") return;
      const [{ getNotificationPermission, showAppNotification }, logModule] = await Promise.all([
        import("../services/notificationService"),
        import("../services/prayerLogService"),
      ]);
      if (getNotificationPermission() !== "granted") return;
      logModule.markPrayer(detail.dayKey, detail.prayerKey, "not-yet");
      if (logModule.hasNotified(detail.dayKey, detail.prayerKey, "post")) return;
      logModule.markNotified(detail.dayKey, detail.prayerKey, "post");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const prayerLabel = t(`prayer.names.${detail.prayerKey}`, lang);
        showAppNotification(
          t("prayer.postTitle", lang).replace("{prayer}", prayerLabel),
          t("prayer.postSnoozedBody", lang),
          {
            tag: `mushafplus-prayer-post-${detail.prayerKey}-snooze`,
            data: { url: "/prires", prayerAnswer: detail },
            actions: [
              { action: "prayed", title: t("prayer.answerPrayed", lang) },
              { action: "not-yet", title: t("prayer.answerNotYet", lang) },
            ],
          },
        ).then((shown) => {
          if (shown) logModule.markNotified(detail.dayKey, detail.prayerKey, "post");
        });
      }, SNOOZE_MS);
    };
    window.addEventListener("mushafplus-prayer-answer", onAnswer);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("mushafplus-prayer-answer", onAnswer);
    };
  }, [lang, prayerTimesEnabled, prayerReminders]);

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
