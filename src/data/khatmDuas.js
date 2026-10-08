/**
 * Completing the Quran (khatm). The Sunnah has no fixed wording for it; what is
 * reported is the practice of Anas ibn Malik (gathering his family and
 * supplicating), attributed to him, not to the Prophet. The page therefore offers
 * supplications that already exist elsewhere in the app, each with its own source,
 * and one common text whose weak attribution is stated on the card.
 */

/** Common end-of-mushaf text. Its attribution to the Prophet rests on a very weak chain: the card says so. */
export const KHATM_IRHAMNI = {
  id: "khatm-irhamni",
  arabic:
    "اللَّهُمَّ ارْحَمْنِي بِالْقُرْآنِ، وَاجْعَلْهُ لِي إِمَامًا وَنُورًا وَهُدًى وَرَحْمَةً، اللَّهُمَّ ذَكِّرْنِي مِنْهُ مَا نَسِيتُ، وَعَلِّمْنِي مِنْهُ مَا جَهِلْتُ، وَارْزُقْنِي تِلَاوَتَهُ آنَاءَ اللَّيْلِ وَأَطْرَافَ النَّهَارِ، وَاجْعَلْهُ لِي حُجَّةً يَا رَبَّ الْعَالَمِينَ",
  fr: "Ô Allah, fais-moi miséricorde par le Coran, fais-en pour moi un guide, une lumière, une direction et une miséricorde. Ô Allah, rappelle-moi ce que j’en ai oublié, enseigne-moi ce que j’en ignore et accorde-moi de le réciter aux heures de la nuit et aux extrémités du jour. Fais-en un argument en ma faveur, Seigneur des mondes.",
  en: "O Allah, have mercy on me through the Quran, make it for me a guide, a light, a direction and a mercy. O Allah, remind me of what I have forgotten of it, teach me what I do not know of it and grant me to recite it in the hours of the night and at the ends of the day. Make it an argument in my favour, Lord of the worlds.",
};

/** Supplications of the Quran already in the app (src/data/duas.js ids), fitting the end of a recitation. */
export const KHATM_QURAN_IDS = ["baqara-127", "imran-8"];

/** Invocations of the Hisn al-Muslim library (item ids): the ones said when a sitting ends. */
export const KHATM_HISN_ITEM_IDS = [196, 195];

export const KHATM_LINKS = {
  dorar: "https://dorar.net/h/3EP3wDgl",
  fatwa: "https://islamqa.info/fr/answers/65581",
};
