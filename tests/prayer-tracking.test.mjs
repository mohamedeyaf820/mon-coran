import test from "node:test";
import assert from "node:assert/strict";

// prayerLogService stores an encrypted blob through localStorage; cryptoUtil
// needs Web Crypto. Node 18+ exposes both, localStorage does not — stub it.
const store = new Map();
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear(),
};

const {
  markPrayer,
  getDayAnswers,
  hasNotified,
  markNotified,
  summarizeRange,
  localDayKey,
} = await import("../src/services/prayerLogService.js");
const {
  planDayNotifications,
  ADHAN_CATCH_UP_MS,
} = await import("../src/services/prayerNotificationPlanner.js");
const {
  applyPrayerOffsets,
  sanitizePrayerNotifications,
  DEFAULT_PRAYER_NOTIFICATIONS,
} = await import("../src/services/prayerTimesService.js");

const TIMINGS = {
  Fajr: { hhmm: "05:30", minutes: 330 },
  Sunrise: { hhmm: "07:05", minutes: 425 },
  Dhuhr: { hhmm: "13:15", minutes: 795 },
  Asr: { hhmm: "17:00", minutes: 1020 },
  Maghrib: { hhmm: "20:10", minutes: 1210 },
  Isha: { hhmm: "21:45", minutes: 1305 },
};

test("prayer marks round-trip through the encrypted log", () => {
  const day = localDayKey(new Date(2026, 0, 15));
  markPrayer(day, "Maghrib", "prayed");
  markPrayer(day, "Fajr", "not-yet");
  const answers = getDayAnswers(new Date(2026, 0, 15));
  assert.equal(answers.Maghrib, "prayed");
  assert.equal(answers.Fajr, "not-yet");
  assert.equal(answers.Asr, null);
  // Nothing is readable in storage without the key.
  const raw = store.get("mushafplus-prayer-log-v1");
  assert.ok(raw && !raw.includes("Maghrib"), "log must not store plaintext");
});

test("a reminder answer never overwrites a performed prayer, and null clears", () => {
  const day = localDayKey(new Date(2026, 2, 3));
  markPrayer(day, "Asr", "prayed");
  markPrayer(day, "Asr", "not-yet");
  assert.equal(getDayAnswers(new Date(2026, 2, 3)).Asr, "prayed");
  markPrayer(day, "Asr", null);
  assert.equal(getDayAnswers(new Date(2026, 2, 3)).Asr, null);
});

test("notification stamps are separate from the reader's answers", () => {
  const day = localDayKey(new Date(2026, 5, 20));
  assert.equal(hasNotified(day, "Dhuhr", "adhan"), false);
  markNotified(day, "Dhuhr", "adhan");
  assert.equal(hasNotified(day, "Dhuhr", "adhan"), true);
  assert.equal(hasNotified(day, "Dhuhr", "post"), false);
  assert.equal(getDayAnswers(new Date(2026, 5, 20)).Dhuhr, null);
});

test("summarizeRange covers every day in the window without mutating the log", () => {
  const start = new Date(2026, 6, 1);
  markPrayer(localDayKey(start), "Fajr", "prayed");
  const days = summarizeRange(start, new Date(2026, 6, 6));
  assert.equal(days.length, 6);
  assert.equal(days[0].prayed, 1);
  assert.equal(days[5].prayed, 0);
});

test("planner emits pre/adhan/post per enabled prayer and drops disabled ones", () => {
  const now = new Date(2026, 0, 15, 4, 0); // 04:00, before everything
  const prefs = {
    ...DEFAULT_PRAYER_NOTIFICATIONS,
    preReminderMinutes: 10,
    postReminderMinutes: 15,
    prayers: { Fajr: true, Dhuhr: true, Asr: false, Maghrib: true, Isha: true },
  };
  const items = planDayNotifications({ timings: TIMINGS, prefs, now });
  const kinds = items.map((item) => `${item.prayerKey}:${item.kind}`);
  assert.ok(kinds.includes("Fajr:pre") && kinds.includes("Fajr:adhan") && kinds.includes("Fajr:post"));
  assert.equal(kinds.some((k) => k.startsWith("Asr:")), false);
  // 4 enabled prayers x 3 kinds
  assert.equal(items.length, 12);
});

test("planner catch-up keeps a just-passed adhan and drops a stale post reminder", () => {
  const at = (h, m) => new Date(2026, 0, 15, h, m);
  const prefs = { ...DEFAULT_PRAYER_NOTIFICATIONS, postReminderMinutes: 15 };
  // 21:00 — Fajr/Dhuhr/Asr/Maghrib adhan window (90 min) closed except Maghrib.
  const items = planDayNotifications({ timings: TIMINGS, prefs, now: at(20, 40) });
  const maghrib = items.filter((i) => i.prayerKey === "Maghrib").map((i) => i.kind);
  assert.ok(maghrib.includes("adhan"), "adhan catch-up stays live 90 minutes");
  assert.equal(items.some((i) => i.prayerKey === "Fajr"), false);
  assert.equal(ADHAN_CATCH_UP_MS, 90 * 60 * 1000);
  // The post reminder for Maghrib (20:25) is within its window; a 22:00 clock
  // leaves nothing of the day eligible.
  const later = planDayNotifications({ timings: TIMINGS, prefs, now: at(23, 30) });
  assert.equal(later.length, 0);
});

test("planner respects notification stamps and the performed answer", () => {
  const now = new Date(2026, 0, 15, 5, 0);
  const prefs = { ...DEFAULT_PRAYER_NOTIFICATIONS, preReminderMinutes: 10, postReminderMinutes: 15 };
  const items = planDayNotifications({
    timings: TIMINGS,
    prefs,
    now,
    isNotified: (_day, key, kind) => key === "Fajr" && kind === "adhan",
    shouldSkip: (_day, key, kind) => key === "Dhuhr" && kind === "post",
  });
  assert.equal(items.some((i) => i.prayerKey === "Fajr" && i.kind === "adhan"), false);
  assert.equal(items.some((i) => i.prayerKey === "Fajr" && i.kind === "pre"), true);
  assert.equal(items.some((i) => i.prayerKey === "Dhuhr" && i.kind === "post"), false);
});

test("manual offsets shift displayed times and keep the base time for the UI", () => {
  const adjusted = applyPrayerOffsets(TIMINGS, { Fajr: -10, Isha: 30, Maghrib: 0 });
  assert.equal(adjusted.Fajr.hhmm, "05:20");
  assert.equal(adjusted.Fajr.minutes, 320);
  assert.equal(adjusted.Fajr.baseHhmm, "05:30");
  assert.equal(adjusted.Isha.hhmm, "22:15");
  assert.equal(adjusted.Maghrib, TIMINGS.Maghrib, "zero offset leaves the entry alone");
  assert.equal(adjusted.Sunrise, TIMINGS.Sunrise, "sunrise is never adjusted");
  // Without offsets the same object reference comes back.
  assert.equal(applyPrayerOffsets(TIMINGS, {}), TIMINGS);
});

test("notification prefs clamp volumes and choices to the offered ones", () => {
  const clean = sanitizePrayerNotifications({
    adhanVolume: 0.75,
    preReminderMinutes: 7,
    postReminderMinutes: 25,
    prayers: { Fajr: false },
    adhanSourceId: "x".repeat(80),
  });
  assert.equal(clean.adhanVolume, 0.8, "snapped to the nearest offered step");
  assert.equal(clean.preReminderMinutes, 0, "7 is not offered; falls back to none");
  assert.equal(clean.postReminderMinutes, 0);
  assert.equal(clean.prayers.Fajr, false);
  assert.equal(clean.prayers.Isha, true);
  assert.equal(clean.adhanSourceId.length, 40);
});
