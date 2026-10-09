// Which calculation method a reader's region follows. Prayer times differ by a
// few minutes between methods (they set the sun angle for Fajr and Isha), and
// each country or institution has its own: Umm al-Qura in Makkah, the UOIF in
// France, the Moroccan Ministry in Morocco... The app proposes the method of
// the reader's region from their coordinates, entirely offline, and always
// shows which one it chose so the reader can change it.
//
// Approximate bounding boxes, first match wins (specific before general).
// They are a proposal, not a border survey: near a frontier the reader can
// pick the neighbouring method from the page. Method ids are Aladhan's.

const BOXES = [
  // [minLat, maxLat, minLon, maxLon, methodId]
  [1.1, 1.5, 103.5, 104.1, 11], // Singapore
  [29.2, 33.4, 34.9, 39.3, 23], // Jordan, Palestine
  [28.5, 30.1, 46.5, 48.5, 9], // Kuwait
  [24.4, 26.2, 50.7, 51.7, 10], // Qatar
  [22.6, 26.1, 51.5, 56.4, 8], // United Arab Emirates
  [16.6, 26.4, 55.7, 60.0, 8], // Oman
  [27.0, 32.2, 34.95, 55.7, 4], // Saudi Arabia, north
  [12.0, 27.0, 38.0, 55.7, 4], // Saudi Arabia, Hejaz and south, Yemen
  [22.0, 31.8, 24.7, 34.95, 5], // Egypt
  [27.6, 35.95, -13.3, -1.7, 21], // Morocco
  [30.2, 37.6, 8.0, 11.7, 18], // Tunisia
  [18.9, 37.2, -8.7, 12.0, 19], // Algeria
  [36.7, 42.2, 26.0, 44.8, 13], // Turkey
  [36.9, 42.2, -9.6, -6.1, 22], // Portugal
  [0.8, 7.4, 99.6, 104.6, 17], // Peninsular Malaysia
  [-11.0, 6.0, 95.0, 141.0, 20], // Indonesia
  [8.0, 37.1, 60.8, 92.7, 1], // Afghanistan, Pakistan, India, Bangladesh
  [42.3, 51.2, -1.9, 8.3, 12], // France, Belgium, Luxembourg, western Switzerland
  [46.3, 48.9, -5.2, -1.9, 12], // Brittany
  [41.3, 43.1, 8.5, 9.7, 12], // Corsica
  [14.0, 72.0, -170.0, -50.0, 2], // North America
];

export const DEFAULT_REGION_METHOD = 3; // Muslim World League

export function suggestPrayerMethod(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return DEFAULT_REGION_METHOD;
  for (const [minLat, maxLat, minLon, maxLon, method] of BOXES) {
    if (lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon) return method;
  }
  return DEFAULT_REGION_METHOD;
}
