import { fetchWithTimeout } from "./fetchWithTimeout.js";

// Prayer names in day order. Sunrise (Chourouq) is displayed for reference but
// is not a prayer: it never triggers a reminder and is excluded from "next".
export const PRAYER_KEYS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
export const DISPLAYED_TIME_KEYS = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];

export const PRAYER_METHODS = [
  { id: 12, fr: "UOIF (France)", en: "UOIF (France)", ar: "اتحاد المنظمات الإسلامية في فرنسا" },
  { id: 2, fr: "ISNA (Amérique du N.)", en: "ISNA (North America)", ar: "الجمعية الإسلامية لأمريكا الشمالية" },
  { id: 3, fr: "Ligue islamique mondiale", en: "Muslim World League", ar: "رابطة العالم الإسلامي" },
  { id: 4, fr: "Umm al-Qura (Makkah)", en: "Umm al-Qura (Makkah)", ar: "أم القرى (مكة)" },
  { id: 5, fr: "Autorité égyptienne", en: "Egyptian Authority", ar: "الهيئة المصرية العامة للمساحة" },
  { id: 1, fr: "Karachi (Asr hanafite)", en: "Karachi (Hanafi Asr)", ar: "كراتشي (العصر حنفي)" },
];

const VALID_METHOD_IDS = new Set(PRAYER_METHODS.map((method) => method.id));
const CACHE_KEY = "mushaf-plus-prayer-timings";
const CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000;

export function normalizePrayerMethod(value, lang = "fr") {
  const parsed = Number(value);
  if (VALID_METHOD_IDS.has(parsed)) return parsed;
  // French-speaking readers overwhelmingly follow the UOIF 12°/12° convention.
  return lang === "fr" ? 12 : 3;
}

export function isValidPrayerMethod(value) {
  return VALID_METHOD_IDS.has(Number(value));
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

function localDayKey(date) {
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
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(entry) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
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
 * CACHE_MAX_AGE_MS. Rejects only when nothing can be served at all.
 */
export async function fetchTodayTimings({ latitude, longitude, method, date = new Date() }) {
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

  if (cached && Date.now() - Number(cached.fetchedAt || 0) < CACHE_MAX_AGE_MS) {
    networkPromise.catch(() => {});
    return { ...cached, stale: false, refreshing: true };
  }
  if (cached) {
    return networkPromise
      .then((fresh) => ({ ...fresh, stale: false, refreshing: false }))
      .catch(() => ({ ...cached, stale: true, refreshing: false }));
  }
  const fresh = await networkPromise;
  return { ...fresh, stale: false, refreshing: false };
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
