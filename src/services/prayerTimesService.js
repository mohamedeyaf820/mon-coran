/**
 * Prayer times computation — pure astronomical calculation.
 * No external API. Uses standard ISNA angle method.
 * Returns { fajr, isha } as "HH:MM" strings in local time.
 */

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

/** Julian Day Number from gregorian date */
function toJD(year, month, day) {
  return Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month > 2 ? month + 1 : month + 13)) +
    day - 1524.5 +
    (month <= 2 ? -Math.floor(year / 100) + Math.floor(year / 400) + 2 : 0);
}

/** Format decimal hours to HH:MM local time */
function toHHMM(hours) {
  const tzOffset = -new Date().getTimezoneOffset() / 60;
  let h = hours + tzOffset;
  h = ((h % 24) + 24) % 24; // wrap to [0, 24)
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(mm === 60 ? hh + 1 : hh).padStart(2, '0')}:${String(mm === 60 ? 0 : mm).padStart(2, '0')}`;
}

/**
 * Compute Fajr and Isha times for a given location and date.
 * @param {number} lat  Latitude in degrees
 * @param {number} lng  Longitude in degrees (East positive)
 * @param {Date}   date
 * @returns {{ fajr: string, isha: string, fajrDecimal: number, ishaDecimal: number }}
 */
export function computePrayerTimes(lat, lng, date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const JD = toJD(year, month, day);
  const T = (JD - 2451545) / 36525; // Julian centuries from J2000

  // Sun's mean longitude & anomaly
  const L0 = (280.46646 + 36000.76983 * T) % 360;
  const M  = (357.52911 + 35999.05029 * T) % 360;
  const Mc = M * D2R;

  // Sun's equation of center
  const C = 1.914602 * Math.sin(Mc) + 0.019993 * Math.sin(2 * Mc) + 0.00029 * Math.sin(3 * Mc);
  const L = L0 + C;

  // Apparent longitude (nutation correction)
  const omega = 125.04 - 1934.136 * T;
  const lambda = (L - 0.00569 - 0.00478 * Math.sin(omega * D2R)) * D2R;

  // Obliquity of ecliptic
  const eps = (23.439291111 - 0.013004167 * T) * D2R;

  // Solar declination
  const decl = Math.asin(Math.sin(eps) * Math.sin(lambda));

  // Equation of time (minutes → hours)
  const y = Math.tan(eps / 2) ** 2;
  const Lc = L0 * D2R;
  const eotMin = (y * Math.sin(2 * Lc)
    - 2 * 0.016708634 * Math.sin(Mc)
    + 4 * y * 0.016708634 * Math.sin(Mc) * Math.cos(2 * Lc)
    - 0.5 * y * y * Math.sin(4 * Lc)
    - 1.25 * (0.016708634 ** 2) * Math.sin(2 * Mc)) * R2D * 4;
  const eotH = eotMin / 60;

  // Solar noon (UTC hours)
  const noon = 12 - lng / 15 - eotH;

  // Hour angle for a given elevation angle below horizon
  const hourAngle = (elevation) => {
    const sinH = Math.sin(elevation * D2R);
    const cosL = Math.cos(lat * D2R);
    const cosD = Math.cos(decl);
    const sinL = Math.sin(lat * D2R);
    const sinD = Math.sin(decl);
    const arg = (sinH - sinL * sinD) / (cosL * cosD);
    if (Math.abs(arg) > 1) return null; // midnight sun / polar night
    return Math.acos(arg) * R2D / 15; // in hours
  };

  // ISNA: Fajr 15°, Isha 15° below horizon
  const haFajr = hourAngle(-15);
  const haIsha = hourAngle(-15);
  if (haFajr === null || haIsha === null) return null;

  const fajrDecimal = noon - haFajr;
  const ishaDecimal = noon + haIsha;

  return {
    fajr:         toHHMM(fajrDecimal),
    isha:         toHHMM(ishaDecimal),
    fajrDecimal,
    ishaDecimal,
  };
}

/**
 * Request geolocation and compute prayer times.
 * @param {Function} onResult  Called with { fajr, isha } or null on error.
 */
export function fetchPrayerTimes(onResult) {
  if (!navigator.geolocation) { onResult(null); return; }
  navigator.geolocation.getCurrentPosition(
    pos => {
      const result = computePrayerTimes(pos.coords.latitude, pos.coords.longitude);
      onResult(result);
    },
    () => onResult(null),
    { timeout: 10000, maximumAge: 3600000 }
  );
}
