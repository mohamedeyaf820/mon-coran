// Notifications are strictly opt-in and local-first: every notification this
// app shows on its own (prayer reminder, verse of the day) is fired from an
// open page through the service worker. The `push` handler in public/sw.js
// accepts server-sent pushes too, but background delivery requires a push
// backend (VAPID subscription + a sending service) that MushafPlus does not
// run yet — nothing here subscribes to one.

import { logError } from "./errorAnalytics.js";

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
 * `silent` asks the OS not to sound; in that case an app-side audio (the
 * adhan) can be played by the caller when the page is visible.
 */
export async function showAppNotification(
  title,
  body,
  { tag, icon = "/logo-ui.webp", data, silent = false, actions } = {},
) {
  if (getNotificationPermission() !== "granted") return false;
  const options = {
    body,
    tag,
    icon,
    badge: "/favicon.png",
    lang: "fr",
    data,
    ...(silent ? { silent: true } : {}),
  };
  // Notification buttons are a desktop-Chrome affordance; where unsupported
  // the whole notification opens the app and the question is asked there.
  if (Array.isArray(actions) && actions.length) options.actions = actions;
  // A refused service-worker notification is not a failure on its own: the
  // constructor below usually succeeds. It becomes one when both paths fail,
  // because the reader has granted permission, enabled the reminder, and heard
  // nothing — the only way to see that after the fact is the error log.
  let registrationError = null;
  try {
    const registration = await navigator.serviceWorker?.getRegistration?.();
    if (registration?.showNotification) {
      await registration.showNotification(title, options);
      return true;
    }
  } catch (error) {
    registrationError = error;
    // Fall through to the constructor path.
  }
  try {
    /* eslint-disable-next-line no-new -- fire-and-forget by design */
    new Notification(title, options);
    return true;
  } catch (error) {
    logError(
      registrationError || error,
      `notification:delivery-failed${tag ? `:${tag}` : ""}`,
    );
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
  } catch (error) {
    // Unreadable storage means this reminder silently stops ever arriving,
    // which the reader cannot distinguish from "the app forgot".
    logError(error, "notification:daily-verse-state-unreadable");
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
 * Schedules today's prayer-related notifications (pre/adhan/post per prayer).
 * Items already in the past fire immediately when `shouldFire` still allows
 * them — that is the catch-up path for a phone whose app was closed at the
 * prayer time. Timers only run while the page is open; the browser gives a
 * PWA no reliable way to wake for a prayer time without a push backend.
 * Returns a cancel function.
 */
export function schedulePrayerNotifications(items, { now = Date.now() } = {}) {
  const timers = [];
  const deliver = (item, where) => {
    // One item's failure must not take the rest of the day with it: `shouldFire`
    // used to run synchronously inside the scheduling loop below, so a throw
    // there cancelled every later prayer without a trace. And `fire` is what
    // actually delivers the adhan — the reader cannot see it not happening, so
    // both are reported with the prayer they belong to.
    const label = `${item.prayerKey || "prayer"}-${item.kind || "notify"}`;
    try {
      if (!item.shouldFire?.()) return;
    } catch (error) {
      logError(error, `notification:${where}:should-fire:${label}`);
      return;
    }
    try {
      const started = item.fire?.();
      if (started && typeof started.catch === "function") {
        // The planner's `fire` is async: a rejected delivery would otherwise be
        // an unhandled rejection carrying no prayer context at all.
        started.catch((error) => logError(error, `notification:${where}:fire:${label}`));
      }
    } catch (error) {
      logError(error, `notification:${where}:fire:${label}`);
    }
  };
  for (const item of items) {
    if (!(item.date instanceof Date)) continue;
    const delay = item.date.getTime() - (now || Date.now());
    if (delay > 24 * 60 * 60 * 1000) continue;
    if (delay <= 0) {
      Promise.resolve().then(() => deliver(item, "catchup"));
      continue;
    }
    timers.push(window.setTimeout(() => deliver(item, "scheduled"), delay));
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
