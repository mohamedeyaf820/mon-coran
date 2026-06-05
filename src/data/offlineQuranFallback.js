import { getSurah } from "./surahs";

const FATIHA_HAFS = [
  "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
  "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
  "الرَّحْمَٰنِ الرَّحِيمِ",
  "مَالِكِ يَوْمِ الدِّينِ",
  "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
  "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
  "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
];

function buildWords(text, surahNumber, ayahNumber) {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => ({
      id: `${surahNumber}:${ayahNumber}:offline:${index + 1}`,
      charType: "word",
      char_type_name: "word",
      position: index + 1,
      text: word,
      textQpcHafs: word,
      textUthmani: word,
      textTajweed: word,
    }));
}

function buildSurahFallback(surahNumber) {
  if (Number(surahNumber) !== 1) return null;
  const meta = getSurah(1);
  const surah = {
    number: 1,
    name: meta?.ar || "الفاتحة",
    englishName: meta?.en || "Al-Fatiha",
    englishNameTranslation: meta?.fr || "L'Ouverture",
    numberOfAyahs: 7,
    revelationType: meta?.type || "Meccan",
  };

  const ayahs = FATIHA_HAFS.map((text, index) => {
    const numberInSurah = index + 1;
    const words = buildWords(text, 1, numberInSurah);
    return {
      number: numberInSurah,
      numberInSurah,
      page: 1,
      juz: 1,
      manzil: 1,
      hizbQuarter: 1,
      sajda: false,
      surah,
      text,
      words,
      quranCom: {
        textQpcHafs: text,
        textQpcNastaleeqHafs: text,
        textUthmani: text,
        textTajweed: text,
      },
      source: "offline-fallback",
    };
  });

  return {
    ayahs,
    edition: {
      identifier: "offline-hafs-fatiha",
      language: "ar",
      name: "Offline Hafs fallback",
      type: "quran",
    },
    source: "offline-fallback",
    usedEdition: "offline-hafs-fatiha",
    requestedRiwaya: "hafs",
    isOfflineFallback: true,
  };
}

export function getOfflineArabicData({
  currentJuz,
  currentPage,
  currentSurah,
  displayMode,
  riwaya,
}) {
  if (riwaya !== "hafs") return null;
  if (displayMode === "surah") return buildSurahFallback(currentSurah);
  if (displayMode === "page" && Number(currentPage) === 1) return buildSurahFallback(1);
  if (displayMode === "juz" && Number(currentJuz) === 1) return buildSurahFallback(1);
  return null;
}

export default getOfflineArabicData;
