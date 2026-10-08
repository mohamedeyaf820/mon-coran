import test from "node:test";
import assert from "node:assert/strict";

const store = new Map();
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear(),
};

const { suggestPrayerMethod, DEFAULT_REGION_METHOD } = await import("../src/data/prayerRegions.js");
const { PRAYER_CITIES, nearestPrayerCity } = await import("../src/data/prayerCities.js");
const {
  PRAYER_METHODS,
  timingsOnDeviceClock,
  zoneOffsetFromDevice,
  zonedWallClock,
} = await import("../src/services/prayerTimesService.js");

// Aladhan method ids: 12 UOIF, 4 Umm al-Qura, 2 ISNA, 5 Egypt, 1 Karachi,
// 21 Morocco, 19 Algeria, 18 Tunisia, 13 Diyanet, 23 Jordan, 8 Gulf, 9 Kuwait,
// 10 Qatar, 17 JAKIM, 20 Kemenag, 11 Singapore, 22 Lisbon, 3 MWL.
const EXPECTED = {
  paris: 12, marseille: 12, lyon: 12, strasbourg: 12, nice: 12, nantes: 12, rennes: 12,
  bordeaux: 12, bruxelles: 12, geneve: 12, lille: 12,
  mecque: 4, medine: 4, riyad: 4, djeddah: 4, sanaa: 4,
  montreal: 2, newyork: 2, toronto: 2,
  lecaire: 5,
  casablanca: 21, rabat: 21, marrakech: 21, fes: 21, tanger: 21, agadir: 21, oujda: 21,
  alger: 19, oran: 19, constantine: 19, annaba: 19, tlemcen: 19,
  tunis: 18, sfax: 18, sousse: 18,
  istanbul: 13,
  amman: 23, jerusalem: 23,
  duba: 8, abudhabi: 8, mascate: 8,
  koweit: 9, doha: 10,
  karachi: 1, lahore: 1, dhaka: 1, delhi: 1,
  kualalumpur: 17, jakarta: 20, singapour: 11,
  lisbonne: 22,
  londres: 3, madrid: 3, barcelone: 3, berlin: 3, rome: 3, dakarm: 3, abidjan: 3, bagdad: 3, damas: 3, beyrouth: 3,
};

test("each listed city follows the method of its own country", () => {
  for (const [id, method] of Object.entries(EXPECTED)) {
    const city = PRAYER_CITIES.find((entry) => entry.id === id);
    assert.ok(city, `missing city ${id}`);
    assert.equal(suggestPrayerMethod(city.latitude, city.longitude), method, `${id} should use method ${method}`);
  }
});

test("every proposed method is one the app can display", () => {
  const known = new Set(PRAYER_METHODS.map((method) => method.id));
  for (const city of PRAYER_CITIES) {
    assert.ok(known.has(suggestPrayerMethod(city.latitude, city.longitude)), city.id);
  }
  assert.ok(known.has(DEFAULT_REGION_METHOD));
  for (const method of PRAYER_METHODS) {
    assert.ok(method.fajr > 0 && (method.isha > 0 || method.ishaMin > 0), `angles of ${method.id}`);
  }
});

test("unknown or invalid coordinates fall back to the Muslim World League", () => {
  assert.equal(suggestPrayerMethod(-33.9, 151.2), 3);
  assert.equal(suggestPrayerMethod(NaN, 2), 3);
  assert.equal(suggestPrayerMethod(undefined, undefined), 3);
});

test("a GPS position is named after the closest listed city, offline", () => {
  assert.equal(nearestPrayerCity(48.86, 2.35).city.id, "paris");
  assert.equal(nearestPrayerCity(21.42, 39.83).city.id, "mecque");
  assert.equal(nearestPrayerCity(-33.9, 151.2), null);
  // Versailles is 17 km from Paris: still "near Paris", not a different city.
  assert.equal(nearestPrayerCity(48.8049, 2.1204).city.id, "paris");
});

test("the place's clock is read in its own timezone", () => {
  const instant = new Date("2026-10-08T12:00:00Z");
  const makkah = zonedWallClock(instant, "Asia/Riyadh");
  assert.equal(makkah.getHours(), 15);
  assert.equal(makkah.getMinutes(), 0);
  // Unknown or missing zones leave the device clock alone.
  assert.equal(zonedWallClock(instant, "Not/AZone"), instant);
  assert.equal(zonedWallClock(instant, ""), instant);
});

test("a place in another timezone is converted back for reminders", () => {
  const instant = new Date("2026-10-08T12:00:00Z");
  const offset = zoneOffsetFromDevice(instant, "Asia/Riyadh");
  const deviceOffset = -instant.getTimezoneOffset();
  assert.equal(offset, 180 - deviceOffset);
  const timings = { Fajr: { hhmm: "04:30", minutes: 270 }, Isha: { hhmm: "19:30", minutes: 1170 } };
  const shifted = timingsOnDeviceClock(timings, "Asia/Riyadh", instant);
  assert.equal(shifted.Fajr.minutes, (((270 - offset) % 1440) + 1440) % 1440);
  // On-site readers (same zone as the device) keep their times untouched.
  const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
  assert.equal(timingsOnDeviceClock(timings, local, instant), timings);
});
