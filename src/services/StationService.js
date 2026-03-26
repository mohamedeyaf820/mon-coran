export const THEMATIC_STATIONS = [
  {
    id: "popular",
    icon: "fa-fire",
    titleFr: "Recitations populaires",
    titleEn: "Popular recitations",
    titleAr: "تلاوات شائعة",
    surahs: [1, 36, 55, 67, 18],
  },
  {
    id: "kahf-repeat",
    icon: "fa-repeat",
    titleFr: "Al-Kahf en boucle",
    titleEn: "Al-Kahf on repeat",
    titleAr: "الكهف بالتكرار",
    surahs: [18, 18, 18],
  },
  {
    id: "juz-amma",
    icon: "fa-layer-group",
    titleFr: "Juz Amma",
    titleEn: "Juz Amma",
    titleAr: "جزء عم",
    surahs: [78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114],
  },
  {
    id: "night-soft",
    icon: "fa-moon",
    titleFr: "Recitation du soir",
    titleEn: "Night recitation",
    titleAr: "ورد المساء",
    surahs: [67, 36, 55, 56],
  },
];

export function buildReciterStations(reciters = []) {
  return reciters.slice(0, 8).map((reciter) => ({
    id: `r-${reciter.id}`,
    icon: "fa-user-astronaut",
    titleFr: reciter.nameFr,
    titleEn: reciter.nameEn,
    titleAr: reciter.name,
    surahs: [1, 36, 55, 67],
    reciterId: reciter.id,
  }));
}
