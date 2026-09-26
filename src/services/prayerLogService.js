// Local, private record of which prayers the reader has performed. One
// encrypted localStorage blob keyed by local day; no device identifier ever
// leaves the app and nothing here is synced. The log is a personal mirror,
// not a scoreboard: it stores only what the reader taps.

import { encryptData, decryptDataWithMeta } from "./cryptoUtil.js";
import { PRAYER_KEYS } from "./prayerTimesService.js";

const LOG_KEY = "mushafplus-prayer-log-v1";
const NOTIFY_KEY = "mushafplus-prayer-notified-v1";
// A bit over a year of days; older days roll off to keep the blob bounded.
const RETENTION_DAYS = 400;

// Notification bookkeeping kinds (never the reader's "prayed" answer).
export const NOTIFY_KINDS = ["pre", "adhan", "post"];

export function localDayKey(date = new Date()) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function readEncryptedMap(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const { data, locked } = decryptDataWithMeta(raw);
    if (locked || !data || typeof data !== "object" || Array.isArray(data)) return {};
    return data;
  } catch {
    return {};
  }
}

function writeEncryptedMap(key, value) {
  try {
    localStorage.setItem(key, encryptData(value));
    return true;
  } catch {
    return false;
  }
}

function sanitizeEntry(value) {
  if (!value || typeof value !== "object") return null;
  if (value.p === true) return { p: true, t: Number(value.t) || 0 };
  if (value.s === 1) return { s: 1, t: Number(value.t) || 0 };
  if (value.s === 2) return { s: 2, t: Number(value.t) || 0 };
  return null;
}

function sanitizeLog(raw) {
  const out = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [day, prayers] of Object.entries(raw)) {
    if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(day) || !prayers || typeof prayers !== "object") continue;
    const clean = {};
    for (const key of PRAYER_KEYS) {
      const entry = sanitizeEntry(prayers[key]);
      if (entry) clean[key] = entry;
    }
    if (Object.keys(clean).length) out[day] = clean;
  }
  return out;
}

function pruneOldDays(log, now = new Date()) {
  const cutoff = now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const out = {};
  for (const [day, prayers] of Object.entries(log)) {
    const [year, month, date] = day.split("-").map(Number);
    const stamp = new Date(year, month - 1, date, 23, 59, 59).getTime();
    if (stamp >= cutoff) out[day] = prayers;
  }
  return out;
}

function readLog() {
  return sanitizeLog(readEncryptedMap(LOG_KEY));
}

/** Full log as { "YYYY-M-D": { Fajr: {p|s,t}, … } }; p=prayed, s=1 not-yet, s=2 snoozed. */
export function getPrayerLog() {
  return readLog();
}

/** Answers for one day: { Fajr: "prayed"|"not-yet"|"snoozed"|null, … }. */
export function getDayAnswers(day = new Date()) {
  const entries = readLog()[localDayKey(day)] || {};
  const out = {};
  for (const key of PRAYER_KEYS) {
    const entry = entries[key];
    out[key] = entry?.p === true ? "prayed" : entry?.s === 1 ? "not-yet" : entry?.s === 2 ? "snoozed" : null;
  }
  return out;
}

/**
 * Record the reader's answer. `null` clears the mark (undo from the log page);
 * reminder answers ("not-yet", "snoozed") never overwrite a performed prayer.
 */
export function markPrayer(dayKey, prayerKey, answer) {
  if (!PRAYER_KEYS.includes(prayerKey)) return false;
  const log = readLog();
  const day = { ...(log[dayKey] || {}) };
  if (answer === null) {
    delete day[prayerKey];
  } else {
    const previous = day[prayerKey];
    if (
      previous?.p === true &&
      (answer === "not-yet" || answer === "snoozed")
    ) {
      return true; // performed stays performed; nothing to downgrade
    }
    if (answer === "prayed") day[prayerKey] = { p: true, t: Date.now() };
    else if (answer === "not-yet") day[prayerKey] = { s: 1, t: Date.now() };
    else if (answer === "snoozed") day[prayerKey] = { s: 2, t: Date.now() };
    else return false;
  }
  if (Object.keys(day).length) log[dayKey] = day;
  else delete log[dayKey];
  return writeEncryptedMap(LOG_KEY, pruneOldDays(log));
}

/** Per-day counts over an inclusive range of Date objects — read-only view. */
export function summarizeRange(start, end, log = readLog()) {
  const days = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cursor <= last) {
    const entries = log[localDayKey(cursor)] || {};
    const record = { date: new Date(cursor), prayed: 0, marks: {} };
    for (const key of PRAYER_KEYS) {
      const answer = entries[key]?.p === true ? "prayed" : entries[key]?.s === 1 ? "not-yet" : entries[key]?.s === 2 ? "snoozed" : null;
      record.marks[key] = answer;
      if (answer === "prayed") record.prayed += 1;
    }
    days.push(record);
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

/* ── Notification bookkeeping ───────────────────────────────────────────
   Purely technical stamps so a reminder fires at most once per prayer per
   day, including after a catch-up. They are not user answers and are kept
   apart from the log for that reason. */

function readNotifyMap() {
  const raw = readEncryptedMap(NOTIFY_KEY);
  const out = {};
  for (const [day, prayers] of Object.entries(raw)) {
    if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(day) || !prayers || typeof prayers !== "object") continue;
    const clean = {};
    for (const [key, value] of Object.entries(prayers)) {
      if (PRAYER_KEYS.includes(key) && Array.isArray(value)) {
        clean[key] = value.filter((kind) => NOTIFY_KINDS.includes(kind));
      }
    }
    out[day] = clean;
  }
  return out;
}

export function hasNotified(dayKey, prayerKey, kind) {
  return Boolean(readNotifyMap()[dayKey]?.[prayerKey]?.includes(kind));
}

/** Returns false (and still schedules) if stamps cannot be persisted. */
export function markNotified(dayKey, prayerKey, kind) {
  if (!PRAYER_KEYS.includes(prayerKey) || !NOTIFY_KINDS.includes(kind)) return false;
  const map = readNotifyMap();
  const day = { ...(map[dayKey] || {}) };
  day[prayerKey] = [...new Set([...(day[prayerKey] || []), kind])];
  map[dayKey] = day;
  return writeEncryptedMap(NOTIFY_KEY, map);
}
