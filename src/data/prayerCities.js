// Offline city presets for manual prayer-location choice (about a hundred
// cities of France, the Maghreb, the Gulf, West Africa, Asia and North America,
// also used to name a GPS position). Fixed: no geocoding service is queried, so a location can be set with
// no network and no third party learns a city name. Coordinates are city
// centres, rounded to 4 decimals like every stored location.

// [id, fr, en ("" when identical to fr), ar, latitude, longitude]
const ROWS = [
  ["paris", "Paris", "", "باريس", 48.8566, 2.3522],
  ["marseille", "Marseille", "", "مرسيليا", 43.2965, 5.3698],
  ["lyon", "Lyon", "", "ليون", 45.764, 4.8357],
  ["toulouse", "Toulouse", "", "طولوز", 43.6047, 1.4442],
  ["lille", "Lille", "", "ليل", 50.6296, 3.0573],
  ["strasbourg", "Strasbourg", "", "ستراسبورغ", 48.5734, 7.7521],
  ["bordeaux", "Bordeaux", "", "بوردو", 44.8378, -0.5792],
  ["rennes", "Rennes", "", "رين", 48.1173, -1.6778],
  ["nice", "Nice", "", "نيس", 43.7102, 7.262],
  ["nantes", "Nantes", "", "نانت", 47.2184, -1.5536],
  ["bruxelles", "Bruxelles", "Brussels", "بروكسل", 50.8503, 4.3517],
  ["geneve", "Genève", "Geneva", "جنيف", 46.2044, 6.1432],
  ["montreal", "Montréal", "Montreal", "مونتريال", 45.5017, -73.5673],
  ["casablanca", "Casablanca", "", "الدار البيضاء", 33.5731, -7.5898],
  ["rabat", "Rabat", "", "الرباط", 34.0209, -6.8416],
  ["marrakech", "Marrakech", "", "مراكش", 31.6295, -7.9811],
  ["fes", "Fès", "Fez", "فاس", 34.0181, -5.0078],
  ["alger", "Alger", "Algiers", "الجزائر", 36.7538, 3.0588],
  ["oran", "Oran", "", "وهران", 35.6969, -0.6331],
  ["tunis", "Tunis", "", "تونس", 36.8065, 10.1815],
  ["dakarm", "Dakar", "", "داكار", 14.7167, -17.4677],
  ["abidjan", "Abidjan", "", "أبيدجان", 5.3599, -4.0083],
  ["istanbul", "Istanbul", "", "إسطنبول", 41.0082, 28.9784],
  ["londres", "Londres", "London", "لندن", 51.5074, -0.1278],
  ["madrid", "Madrid", "", "مدريد", 40.4168, -3.7038],
  ["mecque", "La Mecque", "Makkah", "مكة المكرمة", 21.3891, 39.8579],
  ["medine", "Médine", "Madinah", "المدينة المنورة", 24.5247, 39.5692],
  ["lecaire", "Le Caire", "Cairo", "القاهرة", 30.0444, 31.2357],
  ["duba", "Dubaï", "Dubai", "دبي", 25.2048, 55.2708],
  ["jakarta", "Jakarta", "", "جاكرتا", -6.2088, 106.8456],
  ["montpellier", "Montpellier", "", "مونبلييه", 43.6108, 3.8767],
  ["grenoble", "Grenoble", "", "غرونوبل", 45.1885, 5.7245],
  ["dijon", "Dijon", "", "ديجون", 47.322, 5.0415],
  ["lehavre", "Le Havre", "", "لو هافر", 49.4944, 0.1079],
  ["saintetienne", "Saint-Étienne", "", "سانت إتيان", 45.4397, 4.3872],
  ["toulon", "Toulon", "", "تولون", 43.1242, 5.928],
  ["nimes", "Nîmes", "", "نيم", 43.8367, 4.3601],
  ["clermont", "Clermont-Ferrand", "", "كليرمون فيران", 45.7772, 3.087],
  ["reims", "Reims", "", "ريمس", 49.2583, 4.0317],
  ["orleans", "Orléans", "", "أورليان", 47.9029, 1.9093],
  ["tours", "Tours", "", "تور", 47.3941, 0.6848],
  ["metz", "Metz", "", "ميتز", 49.1193, 6.1757],
  ["rouen", "Rouen", "", "روان", 49.4432, 1.0993],
  ["amiens", "Amiens", "", "أميان", 49.8941, 2.2958],
  ["perpignan", "Perpignan", "", "بربينيان", 42.6887, 2.8948],
  ["angers", "Angers", "", "أنجيه", 47.4784, -0.5632],
  ["mulhouse", "Mulhouse", "", "مولهاوس", 47.7508, 7.3359],
  ["anvers", "Anvers", "Antwerp", "أنتويرب", 51.2194, 4.4025],
  ["lausanne", "Lausanne", "", "لوزان", 46.5197, 6.6323],
  ["luxembourg", "Luxembourg", "", "لوكسمبورغ", 49.6116, 6.1319],
  ["berlin", "Berlin", "", "برلين", 52.52, 13.405],
  ["amsterdam", "Amsterdam", "", "أمستردام", 52.3676, 4.9041],
  ["rome", "Rome", "", "روما", 41.9028, 12.4964],
  ["lisbonne", "Lisbonne", "Lisbon", "لشبونة", 38.7223, -9.1393],
  ["barcelone", "Barcelone", "Barcelona", "برشلونة", 41.3874, 2.1686],
  ["tanger", "Tanger", "Tangier", "طنجة", 35.7595, -5.834],
  ["agadir", "Agadir", "", "أكادير", 30.4278, -9.5981],
  ["meknes", "Meknès", "Meknes", "مكناس", 33.8935, -5.5473],
  ["oujda", "Oujda", "", "وجدة", 34.6814, -1.9086],
  ["tetouan", "Tétouan", "Tetouan", "تطوان", 35.5785, -5.3684],
  ["constantine", "Constantine", "", "قسنطينة", 36.365, 6.6147],
  ["annaba", "Annaba", "", "عنابة", 36.9, 7.7667],
  ["setif", "Sétif", "Setif", "سطيف", 36.1898, 5.4108],
  ["blida", "Blida", "", "البليدة", 36.47, 2.83],
  ["tlemcen", "Tlemcen", "", "تلمسان", 34.8783, -1.315],
  ["sfax", "Sfax", "", "صفاقس", 34.7406, 10.7603],
  ["sousse", "Sousse", "", "سوسة", 35.8256, 10.6084],
  ["tripoli", "Tripoli", "", "طرابلس", 32.8872, 13.1913],
  ["nouakchott", "Nouakchott", "", "نواكشوط", 18.0735, -15.9582],
  ["bamako", "Bamako", "", "باماكو", 12.6392, -8.0029],
  ["lagos", "Lagos", "", "لاغوس", 6.5244, 3.3792],
  ["khartoum", "Khartoum", "", "الخرطوم", 15.5007, 32.5599],
  ["nairobi", "Nairobi", "", "نيروبي", -1.2921, 36.8219],
  ["riyad", "Riyad", "Riyadh", "الرياض", 24.7136, 46.6753],
  ["djeddah", "Djeddah", "Jeddah", "جدة", 21.4858, 39.1925],
  ["koweit", "Koweït", "Kuwait City", "مدينة الكويت", 29.3759, 47.9774],
  ["doha", "Doha", "", "الدوحة", 25.2854, 51.531],
  ["abudhabi", "Abou Dabi", "Abu Dhabi", "أبوظبي", 24.4539, 54.3773],
  ["mascate", "Mascate", "Muscat", "مسقط", 23.5859, 58.4059],
  ["amman", "Amman", "", "عمّان", 31.9454, 35.9284],
  ["jerusalem", "Jérusalem", "Jerusalem", "القدس", 31.7683, 35.2137],
  ["beyrouth", "Beyrouth", "Beirut", "بيروت", 33.8938, 35.5018],
  ["damas", "Damas", "Damascus", "دمشق", 33.5138, 36.2765],
  ["bagdad", "Bagdad", "Baghdad", "بغداد", 33.3152, 44.3661],
  ["teheran", "Téhéran", "Tehran", "طهران", 35.6892, 51.389],
  ["sanaa", "Sanaa", "", "صنعاء", 15.3694, 44.191],
  ["karachi", "Karachi", "", "كراتشي", 24.8607, 67.0011],
  ["lahore", "Lahore", "", "لاهور", 31.5497, 74.3436],
  ["dhaka", "Dacca", "Dhaka", "دكا", 23.8103, 90.4125],
  ["delhi", "Delhi", "", "دلهي", 28.6139, 77.209],
  ["kualalumpur", "Kuala Lumpur", "", "كوالالمبور", 3.139, 101.6869],
  ["singapour", "Singapour", "Singapore", "سنغافورة", 1.3521, 103.8198],
  ["newyork", "New York", "", "نيويورك", 40.7128, -74.006],
  ["toronto", "Toronto", "", "تورنتو", 43.6532, -79.3832],
];

export const PRAYER_CITIES = ROWS.map(([id, fr, en, ar, latitude, longitude]) => ({
  id,
  fr,
  en: en || fr,
  ar,
  latitude,
  longitude,
}));

const EARTH_RADIUS_KM = 6371;

function distanceKm(aLat, aLon, bLat, bLon) {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLon = (bLon - aLon) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * The listed city closest to a position, with its distance in km, or null when
 * none lies within `maxKm`. Names a GPS position without any geocoding request.
 */
export function nearestPrayerCity(latitude, longitude, maxKm = 40) {
  let best = null;
  for (const city of PRAYER_CITIES) {
    const km = distanceKm(latitude, longitude, city.latitude, city.longitude);
    if (km <= maxKm && (!best || km < best.km)) best = { city, km };
  }
  return best;
}
