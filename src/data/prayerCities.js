// Offline city presets for manual prayer-location choice. Deliberately small
// and fixed: no geocoding service is queried, so a location can be set with
// no network and no third party learns a city name. Coordinates are city
// centres, rounded to 4 decimals like every stored location.

export const PRAYER_CITIES = [
  { id: "paris", fr: "Paris", en: "Paris", ar: "باريس", latitude: 48.8566, longitude: 2.3522 },
  { id: "marseille", fr: "Marseille", en: "Marseille", ar: "مرسيليا", latitude: 43.2965, longitude: 5.3698 },
  { id: "lyon", fr: "Lyon", en: "Lyon", ar: "ليون", latitude: 45.764, longitude: 4.8357 },
  { id: "toulouse", fr: "Toulouse", en: "Toulouse", ar: "طولوز", latitude: 43.6047, longitude: 1.4442 },
  { id: "lille", fr: "Lille", en: "Lille", ar: "ليل", latitude: 50.6296, longitude: 3.0573 },
  { id: "strasbourg", fr: "Strasbourg", en: "Strasbourg", ar: "ستراسبورغ", latitude: 48.5734, longitude: 7.7521 },
  { id: "bordeaux", fr: "Bordeaux", en: "Bordeaux", ar: "بوردو", latitude: 44.8378, longitude: -0.5792 },
  { id: "rennes", fr: "Rennes", en: "Rennes", ar: "رين", latitude: 48.1173, longitude: -1.6778 },
  { id: "nice", fr: "Nice", en: "Nice", ar: "نيس", latitude: 43.7102, longitude: 7.262 },
  { id: "nantes", fr: "Nantes", en: "Nantes", ar: "نانت", latitude: 47.2184, longitude: -1.5536 },
  { id: "bruxelles", fr: "Bruxelles", en: "Brussels", ar: "بروكسل", latitude: 50.8503, longitude: 4.3517 },
  { id: "geneve", fr: "Genève", en: "Geneva", ar: "جنيف", latitude: 46.2044, longitude: 6.1432 },
  { id: "montreal", fr: "Montréal", en: "Montreal", ar: "مونتريال", latitude: 45.5017, longitude: -73.5673 },
  { id: "casablanca", fr: "Casablanca", en: "Casablanca", ar: "الدار البيضاء", latitude: 33.5731, longitude: -7.5898 },
  { id: "rabat", fr: "Rabat", en: "Rabat", ar: "الرباط", latitude: 34.0209, longitude: -6.8416 },
  { id: "marrakech", fr: "Marrakech", en: "Marrakech", ar: "مراكش", latitude: 31.6295, longitude: -7.9811 },
  { id: "fes", fr: "Fès", en: "Fez", ar: "فاس", latitude: 34.0181, longitude: -5.0078 },
  { id: "alger", fr: "Alger", en: "Algiers", ar: "الجزائر", latitude: 36.7538, longitude: 3.0588 },
  { id: "oran", fr: "Oran", en: "Oran", ar: "وهران", latitude: 35.6969, longitude: -0.6331 },
  { id: "tunis", fr: "Tunis", en: "Tunis", ar: "تونس", latitude: 36.8065, longitude: 10.1815 },
  { id: "dakarm", fr: "Dakar", en: "Dakar", ar: "داكار", latitude: 14.7167, longitude: -17.4677 },
  { id: "abidjan", fr: "Abidjan", en: "Abidjan", ar: "أبيدجان", latitude: 5.3599, longitude: -4.0083 },
  { id: "istanbul", fr: "Istanbul", en: "Istanbul", ar: "إسطنبول", latitude: 41.0082, longitude: 28.9784 },
  { id: "londres", fr: "Londres", en: "London", ar: "لندن", latitude: 51.5074, longitude: -0.1278 },
  { id: "madrid", fr: "Madrid", en: "Madrid", ar: "مدريد", latitude: 40.4168, longitude: -3.7038 },
  { id: "mecque", fr: "La Mecque", en: "Makkah", ar: "مكة المكرمة", latitude: 21.3891, longitude: 39.8579 },
  { id: "medine", fr: "Médine", en: "Madinah", ar: "المدينة المنورة", latitude: 24.5247, longitude: 39.5692 },
  { id: "lecaire", fr: "Le Caire", en: "Cairo", ar: "القاهرة", latitude: 30.0444, longitude: 31.2357 },
  { id: "duba", fr: "Dubaï", en: "Dubai", ar: "دبي", latitude: 25.2048, longitude: 55.2708 },
  { id: "jakarta", fr: "Jakarta", en: "Jakarta", ar: "جاكرتا", latitude: -6.2088, longitude: 106.8456 },
];
