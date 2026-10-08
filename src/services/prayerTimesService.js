import { fetchWithTimeout } from "./fetchWithTimeout.js";
import { encryptData, decryptDataWithMeta } from "./cryptoUtil.js";

// Prayer names in day order. Sunrise (Chourouq) is displayed for reference but
// is not a prayer: it never triggers a reminder and is excluded from "next".
export const PRAYER_KEYS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
export const DISPLAYED_TIME_KEYS = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];

// Aladhan method ids. `fajr` / `isha` are the sun angles below the horizon;
// `ishaMin` replaces the Isha angle when the method fixes Isha a set number of
// minutes after Maghrib. `where` says in plain words who follows the method.
export const PRAYER_METHODS = [
  { id: 12, fr: "UOIF (France)", en: "UOIF (France)", ar: "اتحاد المنظمات الإسلامية في فرنسا", fajr: 12, isha: 12, where: { fr: "France, Belgique, Suisse romande", en: "France, Belgium, French-speaking Switzerland", ar: "فرنسا وبلجيكا وسويسرا الفرنسية" } },
  { id: 4, fr: "Umm al-Qura (La Mecque)", en: "Umm al-Qura (Makkah)", ar: "أم القرى (مكة)", fajr: 18.5, ishaMin: 90, where: { fr: "Arabie saoudite, La Mecque et Médine", en: "Saudi Arabia, Makkah and Madinah", ar: "السعودية، مكة والمدينة" } },
  { id: 3, fr: "Ligue islamique mondiale", en: "Muslim World League", ar: "رابطة العالم الإسلامي", fajr: 18, isha: 17, where: { fr: "Europe, Asie, méthode par défaut", en: "Europe, Asia, the default method", ar: "أوروبا وآسيا، الطريقة الافتراضية" } },
  { id: 2, fr: "ISNA (Amérique du N.)", en: "ISNA (North America)", ar: "الجمعية الإسلامية لأمريكا الشمالية", fajr: 15, isha: 15, where: { fr: "États-Unis, Canada", en: "United States, Canada", ar: "الولايات المتحدة وكندا" } },
  { id: 5, fr: "Autorité égyptienne", en: "Egyptian Authority", ar: "الهيئة المصرية العامة للمساحة", fajr: 19.5, isha: 17.5, where: { fr: "Égypte, Afrique, Syrie, Liban", en: "Egypt, Africa, Syria, Lebanon", ar: "مصر وإفريقيا وسوريا ولبنان" } },
  { id: 1, fr: "Karachi (Pakistan)", en: "Karachi (Pakistan)", ar: "كراتشي (باكستان)", fajr: 18, isha: 18, where: { fr: "Pakistan, Inde, Bangladesh, Afghanistan", en: "Pakistan, India, Bangladesh, Afghanistan", ar: "باكستان والهند وبنغلاديش وأفغانستان" } },
  { id: 21, fr: "Maroc", en: "Morocco", ar: "المغرب", fajr: 19, isha: 17 },
  { id: 19, fr: "Algérie", en: "Algeria", ar: "الجزائر", fajr: 18, isha: 17 },
  { id: 18, fr: "Tunisie", en: "Tunisia", ar: "تونس", fajr: 18, isha: 18 },
  { id: 13, fr: "Turquie (Diyanet)", en: "Turkey (Diyanet)", ar: "تركيا (ديانت)", fajr: 18, isha: 17 },
  { id: 23, fr: "Jordanie", en: "Jordan", ar: "الأردن", fajr: 18, isha: 18, where: { fr: "Jordanie, Palestine", en: "Jordan, Palestine", ar: "الأردن وفلسطين" } },
  { id: 9, fr: "Koweït", en: "Kuwait", ar: "الكويت", fajr: 18, isha: 17.5 },
  { id: 10, fr: "Qatar", en: "Qatar", ar: "قطر", fajr: 18, ishaMin: 90 },
  { id: 8, fr: "Golfe (Émirats, Oman)", en: "Gulf (Emirates, Oman)", ar: "الخليج (الإمارات وعُمان)", fajr: 19.5, ishaMin: 90 },
  { id: 17, fr: "Malaisie (JAKIM)", en: "Malaysia (JAKIM)", ar: "ماليزيا (جاكيم)", fajr: 20, isha: 18 },
  { id: 20, fr: "Indonésie (Kemenag)", en: "Indonesia (Kemenag)", ar: "إندونيسيا (وزارة الشؤون الدينية)", fajr: 20, isha: 18 },
  { id: 11, fr: "Singapour (MUIS)", en: "Singapore (MUIS)", ar: "سنغافورة", fajr: 20, isha: 18 },
  { id: 22, fr: "Portugal (Lisbonne)", en: "Portugal (Lisbon)", ar: "البرتغال (لشبونة)", fajr: 18, ishaMin: 77 },
];

const VALID_METHOD_IDS = new Set(PRAYER_METHODS.map((method) => method.id));
const CACHE_KEY = "mushaf-plus-prayer-timings";
const CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000;
// Manual per-prayer adjustments, in minutes (negative = earlier). Kept small:
// no sane adjustment crosses an hour boundary in either direction.
export const PRAYER_OFFSET_MIN_MAX = 60;
export const ADHAN_VOLUME_STEPS = [0.2, 0.4, 0.6, 0.8, 1];
export const PRE_REMINDER_CHOICES = [0, 5, 10, 15, 20];
export const POST_REMINDER_CHOICES = [0, 10, 15, 20, 30, 45];

export function normalizePrayerMethod(value, lang = "fr") {
  const parsed = Number(value);
  if (VALID_METHOD_IDS.has(parsed)) return parsed;
  // French-speaking readers overwhelmingly follow the UOIF 12°/12° convention.
  return lang === "fr" ? 12 : 3;
}

export function sanitizePrayerLocation(value) {
  if (!value || typeof value !== "object") return null;
  const latitude = Number(value.latitude);
  const longitude = Number(value.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return {
    latitude: Math.round(latitude * 10000) / 10000,
    longitude: Math.round(longitude * 10000) / 10000,
    label: typeof value.label === "string" ? value.label.slice(0, 80) : "",
  };
}

function clampOffset(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(-PRAYER_OFFSET_MIN_MAX, Math.min(PRAYER_OFFSET_MIN_MAX, Math.round(parsed)));
}

/** Per-prayer manual adjustments in minutes; unknown keys and noise dropped. */
export function sanitizePrayerOffsets(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const out = {};
  for (const key of PRAYER_KEYS) {
    out[key] = clampOffset(source[key]);
  }
  return out;
}

/**
 * Apply the reader's manual adjustments to a fetched timings payload, once.
 * Adjusted entries carry `baseHhmm` so the UI can show what was shifted.
 * Sunrise is reference-only and never adjusted.
 */
export function applyPrayerOffsets(timings, offsets) {
  const clean = sanitizePrayerOffsets(offsets);
  const changed = PRAYER_KEYS.some((key) => clean[key] !== 0);
  if (!timings || !changed) return timings;
  const out = { ...timings };
  for (const key of PRAYER_KEYS) {
    const entry = out[key];
    if (!entry || clean[key] === 0) continue;
    const minutes = Math.max(0, Math.min(24 * 60 - 1, entry.minutes + clean[key]));
    out[key] = {
      hhmm: `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`,
      minutes,
      baseHhmm: entry.hhmm,
    };
  }
  return out;
}

function clampChoice(value, choices, fallback) {
  const parsed = Number(value);
  return choices.includes(parsed) ? parsed : fallback;
}

function sanitizePrayerSwitches(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const out = {};
  for (const key of PRAYER_KEYS) {
    out[key] = source[key] !== false;
  }
  return out;
}

/**
 * One settings object owns every prayer-notification preference. Defaults:
 * reminders on for all five prayers, adhan on with the sound (never silent —
 * an Adhan the reader cannot hear is worse than none), no pre/post nagging
 * until the reader opts in.
 */
export const DEFAULT_PRAYER_NOTIFICATIONS = {
  adhanEnabled: true,
  adhanSourceId: "prophets-mosque-ejaz215",
  adhanVolume: 1,
  silent: false,
  preReminderMinutes: 0,
  postReminderMinutes: 0,
  catchUp: true,
  prayers: { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true },
};

export function sanitizePrayerNotifications(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const volume = Number(source.adhanVolume);
  return {
    adhanEnabled: source.adhanEnabled !== false,
    adhanSourceId:
      typeof source.adhanSourceId === "string" ? source.adhanSourceId.slice(0, 40) : "",
    adhanVolume: Number.isFinite(volume)
      ? ADHAN_VOLUME_STEPS.reduce((best, step) =>
        Math.abs(step - volume) < Math.abs(best - volume) ? step : best,
      )
      : DEFAULT_PRAYER_NOTIFICATIONS.adhanVolume,
    silent: Boolean(source.silent),
    preReminderMinutes: clampChoice(source.preReminderMinutes, PRE_REMINDER_CHOICES, 0),
    postReminderMinutes: clampChoice(source.postReminderMinutes, POST_REMINDER_CHOICES, 0),
    catchUp: source.catchUp !== false,
    prayers: sanitizePrayerSwitches(source.prayers),
  };
}

export function requestLocation(timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(Object.assign(new Error("Geolocation unavailable"), { code: "unsupported" }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        // Rounded to ~1.1km: enough for prayer times, less precise user data
        // persisted in the settings blob.
        accuracy: Math.round(position.coords.accuracy || 0),
      }),
      (error) => reject(error),
      { timeout: timeoutMs, maximumAge: 30 * 60 * 1000, enableHighAccuracy: false },
    );
  });
}

function formatDateKey(date) {
  return `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
}

/**
 * Day key shared with `prayerLogService.localDayKey`: `YYYY-M-D` with a 0-based
 * month. Holds the times cache to one day and is the encoder the tracker page
 * and the home strip use, so a key written anywhere in the app is readable by
 * the routines that match it against the reader's log.
 */
export function localDayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

// The API answers in the location's timezone with bare "HH:MM" strings; the
// app treats them as device-local wall times, which holds whenever the reader
// is at the located position (the only flow the product offers).
function parseTimeToMinutes(hhmm) {
  const match = /^(\d{1,2}):(\d{2})/.exec(String(hhmm || "").trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function normalizeTimingsPayload(data, coords, methodId) {
  const timings = data?.timings || {};
  const clean = {};
  for (const key of DISPLAYED_TIME_KEYS) {
    const minutes = parseTimeToMinutes(timings[key]);
    if (minutes === null) return null;
    clean[key] = { hhmm: String(timings[key]).slice(0, 5), minutes };
  }
  return {
    timings: clean,
    hijri: data?.date?.hijri?.date || "",
    timezone: data?.meta?.timezone || "",
    methodName: data?.meta?.method?.name || "",
    latitude: coords.latitude,
    longitude: coords.longitude,
    method: methodId,
    fetchedAt: Date.now(),
  };
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    // The cache holds the reader's coordinates, so it is encrypted like the
    // other private storage. decryptDataWithMeta also returns a legacy
    // plaintext JSON payload (needsMigration) so an existing cache keeps
    // working and is rewritten encrypted on the next fetch.
    const { data, locked } = decryptDataWithMeta(raw);
    if (locked || !data || typeof data !== "object") return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(entry) {
  try {
    localStorage.setItem(CACHE_KEY, encryptData(entry));
  } catch {
    // A full or blocked localStorage only loses the offline convenience.
  }
}

export function getCachedTimings({ latitude, longitude, method, date }) {
  const cache = readCache();
  if (!cache) return null;
  const sameDay = cache.dayKey === localDayKey(date);
  const sameSpot =
    Math.abs(Number(cache.latitude) - latitude) < 0.05 &&
    Math.abs(Number(cache.longitude) - longitude) < 0.05 &&
    Number(cache.method) === Number(method);
  if (!sameDay || !sameSpot) return null;
  return cache;
}

/**
 * Stale-while-revalidate: the cached day answers immediately (instant render,
 * offline), the network refreshes in the background at most every
 * CACHE_MAX_AGE_MS. Rejects only when nothing can be served at all. The cache
 * always stores unadjusted API times; the reader's manual adjustments are
 * applied on the way out so changing an offset needs no refetch.
 */
export async function fetchTodayTimings({ latitude, longitude, method, offsets, date = new Date() }) {
  const cached = getCachedTimings({ latitude, longitude, method, date });
  const networkPromise = (async () => {
    const url =
      `https://api.aladhan.com/v1/timings/${formatDateKey(date)}` +
      `?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}` +
      `&method=${encodeURIComponent(normalizePrayerMethod(method))}&school=0`;
    const response = await fetchWithTimeout(url, {}, 10000);
    if (!response.ok) throw new Error(`aladhan ${response.status}`);
    const payload = await response.json();
    if (payload?.code !== 200) throw new Error("aladhan payload");
    const normalized = normalizeTimingsPayload(payload.data, { latitude, longitude }, method);
    if (!normalized) throw new Error("aladhan timings");
    writeCache({ ...normalized, dayKey: localDayKey(date) });
    return normalized;
  })();

  const adjust = (entry) => ({
    ...entry,
    timings: applyPrayerOffsets(entry.timings, offsets),
  });

  if (cached && Date.now() - Number(cached.fetchedAt || 0) < CACHE_MAX_AGE_MS) {
    networkPromise.catch(() => {});
    return { ...adjust(cached), stale: false, refreshing: true };
  }
  if (cached) {
    return networkPromise
      .then((fresh) => ({ ...adjust(fresh), stale: false, refreshing: false }))
      .catch(() => ({ ...adjust(cached), stale: true, refreshing: false }));
  }
  const fresh = await networkPromise;
  return { ...adjust(fresh), stale: false, refreshing: false };
}

/**
 * The wall clock of `timeZone` as a Date whose local fields read that time.
 * The API returns times in the location's timezone, so "what is next" must be
 * judged on the location's clock, not the device's: a reader in France looking
 * at Makkah is three hours apart. Falls back to the device clock when the zone
 * is missing or unknown.
 */
export function zonedWallClock(date, timeZone) {
  if (!timeZone) return date;
  try {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-GB", {
        timeZone,
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
        .formatToParts(date)
        .map((part) => [part.type, part.value]),
    );
    return new Date(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );
  } catch {
    return date;
  }
}

/** Minutes the location's clock is ahead of the device clock (0 when equal). */
export function zoneOffsetFromDevice(date, timeZone) {
  const zoned = zonedWallClock(date, timeZone);
  const delta = Math.round((zoned.getTime() - date.getTime()) / 60000);
  // Both clocks are read as device-local wall time, so the DST of the device
  // cancels out except around its own transitions; round to a quarter hour.
  return Math.round(delta / 15) * 15;
}

/**
 * The same times read on the device clock, for reminders: a notification must
 * fire when the device clock reaches the prayer, whichever place was chosen.
 */
export function timingsOnDeviceClock(timings, timeZone, date = new Date()) {
  const offset = zoneOffsetFromDevice(date, timeZone);
  if (!timings || !offset) return timings;
  const shifted = {};
  for (const [key, entry] of Object.entries(timings)) {
    const minutes = (((entry.minutes - offset) % 1440) + 1440) % 1440;
    shifted[key] = {
      ...entry,
      minutes,
      hhmm: `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`,
    };
  }
  return shifted;
}

/** Next prayer among the five (Sunrise excluded), or null after Isha. */
export function getNextPrayer(timings, now = new Date()) {
  if (!timings) return null;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  for (const key of PRAYER_KEYS) {
    const entry = timings[key];
    if (entry && entry.minutes > nowMinutes) {
      return {
        key,
        hhmm: entry.hhmm,
        minutesUntil: entry.minutes - nowMinutes,
      };
    }
  }
  return null;
}

export function formatCountdown(totalMinutes, lang) {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (lang === "ar") {
    if (hours <= 0) return `بعد ${rest} د`;
    return `بعد ${hours} س ${rest} د`;
  }
  if (lang === "en") {
    if (hours <= 0) return `in ${rest} min`;
    return `in ${hours} h ${rest} min`;
  }
  if (hours <= 0) return `dans ${rest} min`;
  return `dans ${hours} h ${rest} min`;
}
