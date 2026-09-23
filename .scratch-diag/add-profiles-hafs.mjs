import fs from "node:fs";
const path = "public/data/reciter-profiles.json";
const j = JSON.parse(fs.readFileSync(path, "utf8"));
const src = { provider: "QuranPedia", url: "https://api.quranpedia.net/v1/reciters" };
const add = (id, fr, en, ar) => {
  j[id] = { bio: { fr, en, ar }, bioSource: src, reviewedAt: "2026-09-20" };
};
add(
  "abdulbar_althubaity",
  "Abdul Bara Al-Thubaiti est un savant et récitant saoudien, imam et prédicateur de la Grande Mosquée de La Mecque et membre du Conseil des oulémas seniors. Son mushaf complet en lecture de Hafs est diffusé par MP3Quran en flux par sourate.",
  "Abdul Bara Al-Thubaiti is a Saudi scholar and reciter, imam and preacher of the Grand Mosque of Mecca and a member of the Council of Senior Scholars. His complete Hafs mushaf is streamed surah by surah on MP3Quran.",
  "عبدالبارئ الثبيتي عالم وقارئ سعودي، إمام وخطيب المسجد الحرام وعضو هيئة كبار العلماء. مصحفه الكامل برواية حفص متاح سورًا سورًا على مكتبة القرآن الصوتية.",
);
add(
  "saad_almoqren",
  "Saad Al-Meqren est un récitant et prédicateur saoudien, imam de la Grande Mosquée de La Mecque, apprécié pour sa lecture de Hafs posée et claire. Son mushaf complet est publié par MP3Quran en flux par sourate.",
  "Saad Al-Meqren is a Saudi reciter and preacher, imam of the Grand Mosque of Mecca, appreciated for his measured and clear Hafs reading. His complete mushaf is published by MP3Quran as surah-length streams.",
  "سعد المقرن قارئ وداعية سعودي، إمام المسجد الحرام، يتميز بتلاوة حفص متأنية واضحة. مصحفه الكامل منشور على مكتبة القرآن الصوتية بتلاوة كل سورة كاملة.",
);
add(
  "ali_hajjaj_alsoaesi",
  "Ali Hajjaj Al-Souaessi est un récitant égyptien, imam et prédicateur de la Mosquée du Prophète à Médine, reconnu pour sa lecture de Hafs à la mélodie singulière. Son mushaf complet est diffusé par MP3Quran en flux par sourate.",
  "Ali Hajjaj Al-Souaessi is an Egyptian reciter, imam and preacher of the Prophet's Mosque in Medina, known for his distinctive melodic Hafs reading. His complete mushaf is streamed surah by surah on MP3Quran.",
  "علي حجاج السويسي قارئ مصري، إمام وخطيب المسجد النبوي بالمدينة المنورة، يتميز بتلاوة حفص ذات لحن خاص. مصحفه الكامل متاح سورًا سورًا على مكتبة القرآن الصوتية.",
);
fs.writeFileSync(path, JSON.stringify(j, null, 2) + "\n");
console.log("profiles now:", Object.keys(j).length);
