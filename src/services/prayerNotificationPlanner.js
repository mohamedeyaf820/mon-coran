// Pure planner turning one day's timings into notification items. Kept free
// of timers and DOM so it runs in Node tests and inside the SW-less page.

import { PRAYER_KEYS } from "./prayerTimesService.js";
import { NOTIFY_KINDS, localDayKey } from "./prayerLogService.js";

// How late after the planned moment a closed app may still deliver it —
// the price of the no-push-backend limit, bounded so a random app open at
// noon does not replay the whole morning.
export const PRE_CATCH_UP_MS = 15 * 60 * 1000;
export const ADHAN_CATCH_UP_MS = 90 * 60 * 1000;
// Tighter than the adhan window: a "did you pray?" question only stays useful
// shortly after the prayer, not hours later.
export const POST_CATCH_UP_MS = 60 * 60 * 1000;

function dateAt(day, totalMinutes) {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, Math.round(totalMinutes)));
  const date = new Date(day);
  date.setHours(Math.floor(clamped / 60), clamped % 60, 0, 0);
  return date;
}

/**
 * Returns [{ prayerKey, kind, date, dayKey, late }] for enabled prayers.
 * `late` marks items whose moment already passed at planning time — the
 * scheduler delivers them as catch-up, and `shouldSkip` (performed prayers,
 * answered questions, stale nudges) is the caller's policy hook.
 */
export function planDayNotifications({
  timings,
  prefs,
  now = new Date(),
  isNotified,
  shouldSkip,
}) {
  const notifications = prefs || {};
  const prayers = notifications.prayers || {};
  const day = new Date(now);
  const nowMs = now.getTime();
  const dayKey = localDayKey(now);
  const items = [];

  for (const prayerKey of PRAYER_KEYS) {
    if (prayers[prayerKey] === false) continue;
    const entry = timings?.[prayerKey];
    if (!entry) continue;

    const planned = [
      {
        kind: "pre",
        when: notifications.preReminderMinutes
          ? dateAt(day, entry.minutes - notifications.preReminderMinutes)
          : null,
        windowMs: PRE_CATCH_UP_MS,
      },
      { kind: "adhan", when: dateAt(day, entry.minutes), windowMs: ADHAN_CATCH_UP_MS },
      {
        kind: "post",
        when: notifications.postReminderMinutes
          ? dateAt(day, entry.minutes + notifications.postReminderMinutes)
          : null,
        windowMs: POST_CATCH_UP_MS,
      },
    ];

    for (const { kind, when, windowMs } of planned) {
      if (!when) continue;
      const late = when.getTime() <= nowMs;
      if (late && nowMs - when.getTime() > windowMs) continue;
      if (isNotified?.(dayKey, prayerKey, kind)) continue;
      if (shouldSkip?.(dayKey, prayerKey, kind)) continue;
      items.push({ prayerKey, kind, date: when, dayKey, late });
    }
  }
  return items;
}

export { NOTIFY_KINDS, PRAYER_KEYS };
