// Notifications are strictly opt-in and local-first: every notification this
// app shows on its own (prayer reminder, verse of the day) is fired from an
// open page through the service worker. The `push` handler in public/sw.js
// accepts server-sent pushes too, but background delivery requires a push
// backend (VAPID subscription + a sending service) that MushafPlus does not
// run yet — nothing here subscribes to one.

const VOD_NOTIFY_KEY = "mushaf-plus-vod-notified-on";

export function isNotificationSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission() {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission; // "granted" | "denied" | "default"
}

export async function ensureNotificationPermission() {
  if (!isNotificationSupported()) return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

/**
 * Shows a notification through the service worker registration when available
 * (survives the page gaining/losing focus, appears as an app notification on
 * installed PWAs), with the plain Notification constructor as fallback.
 */
export async function showAppNotification(title, body, { tag, icon = "/logo-ui.webp", data } = {}) {
  if (getNotificationPermission() !== "granted") return false;
  const options = { body, tag, icon, badge: "/favicon.png", lang: "fr", data };
  try {
    const registration = await navigator.serviceWorker?.getRegistration?.();
    if (registration?.showNotification) {
      await registration.showNotification(title, options);
      return true;
    }
  } catch {
    // Fall through to the constructor path.
  }
  try {
    /* eslint-disable-next-line no-new -- fire-and-forget by design */
    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}

function todayKey(now = new Date()) {
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

/** Verse-of-the-day reminder, at most once per calendar day. */
export async function maybeNotifyDailyVerse({ title, body }) {
  if (getNotificationPermission() !== "granted") return false;
  try {
    if (localStorage.getItem(VOD_NOTIFY_KEY) === todayKey()) return false;
  } catch {
    return false;
  }
  const shown = await showAppNotification(title, body, { tag: "mushafplus-vod" });
  if (shown) {
    try {
      localStorage.setItem(VOD_NOTIFY_KEY, todayKey());
    } catch {
      // Without persistence the worst case is one extra reminder per visit.
    }
  }
  return shown;
}

/**
 * Schedules local notifications for today's remaining prayers. Returns a
 * cancel function. Timers only run while the page is open; the browser gives
 * a PWA no reliable way to wake for a prayer time without a push backend.
 */
export function schedulePrayerNotifications(prayers, { buildTitle, buildBody, now = new Date() }) {
  const timers = [];
  const nowMs = now.getTime();
  for (const prayer of prayers) {
    const target = prayer.date;
    if (!(target instanceof Date)) continue;
    const delay = target.getTime() - nowMs;
    if (delay <= 0 || delay > 24 * 60 * 60 * 1000) continue;
    timers.push(window.setTimeout(() => {
      showAppNotification(buildTitle(prayer), buildBody(prayer), {
        tag: `mushafplus-prayer-${prayer.key}`,
        data: { url: "/" },
      });
    }, delay));
  }
  return () => timers.forEach((id) => window.clearTimeout(id));
}

/** Turns today's "HH:MM" timings into Date objects in device-local time. */
export function prayerDatesFromTimings(timings, keys, day = new Date()) {
  const dates = [];
  for (const key of keys) {
    const entry = timings?.[key];
    const match = /^(\d{1,2}):(\d{2})$/.exec(String(entry?.hhmm || ""));
    if (!match) continue;
    const date = new Date(day);
    date.setHours(Number(match[1]), Number(match[2]), 0, 0);
    dates.push({ key, hhmm: entry.hhmm, date });
  }
  return dates;
}
