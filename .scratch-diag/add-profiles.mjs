import fs from "node:fs";
const path = "public/data/reciter-profiles.json";
const j = JSON.parse(fs.readFileSync(path, "utf8"));
const src = { provider: "QuranPedia", url: "https://api.quranpedia.net/v1/reciters" };
const add = (id, fr, en, ar) => {
  j[id] = { bio: { fr, en, ar }, bioSource: src, reviewedAt: "2026-09-20" };
};
add(
  "warsh_rachid_belalaya",
  "Rachid Belalaya est un récitant algérien qui lit selon la lecture de Warsh ʿan Nafi par la voie d’Al‑Asbahani. La QuranPedia diffuse sa récitation complète, verset par verset, sur les 114 sourates.",
  "Rachid Belalaya is an Algerian reciter reading according to Warsh ʿan Nafi through the Al‑Asbahani transmission. QuranPedia publishes his complete verse-by-verse recitation across all 114 surahs.",
  "رشيد بلعالية قارئ جزائري يقرأ برواية ورش عن نافع من طريق الأصبهاني. تنشر الموسوعة القرآنية تلاوته الكاملة آية بآية في السور الأربع عشرة والمائة.",
);
add(
  "warsh_omar_al_qazabri",
  "Omar Al‑Qazabri est un récitant marocain, imam de la mosquée Hassan II de Casablanca, connu pour sa lecture selon Warsh ʿan Nafi. Son mushaf complet est diffusé par MP3Quran en flux par sourate.",
  "Omar Al‑Qazabri is a Moroccan reciter and imam of the Hassan II Mosque in Casablanca, known for his Warsh ʿan Nafi reading. His complete mushaf is streamed surah by surah on MP3Quran.",
  "عمر القزابري قارئ مغربي وإمام في مسجد الحسن الثاني بالدار البيضاء، يقرأ برواية ورش عن نافع. مصحفه الكامل متاح سورًا سورًا على مكتبة القرآن الصوتية.",
);
add(
  "warsh_al_qaria_yassen",
  "Al‑Qari Yassine est un récitant qui a enregistré le mushaf complet selon la lecture de Warsh ʿan Nafi. Sa récitation est publiée par la QuranPedia et MP3Quran, avec un découpage mot à mot.",
  "Al‑Qari Yassine recorded the complete mushaf according to the Warsh reading of Nafi. His recitation is published by QuranPedia and MP3Quran, with a word-by-word timing edition.",
  "القارئ ياسين سجل مصحفًا كاملًا برواية ورش عن نافع. تلاوته منشورة في الموسوعة القرآنية ومكتبة القرآن الصوتية، مع نسخة توقيت كلمة بكلمة.",
);
add(
  "warsh_mohammad_saayed",
  "Mohammad Saayed est un récitant indonésien qui lit selon la lecture de Warsh ʿan Nafi. Son mushaf complet, publié par MP3Quran et la QuranPedia, est accompagné d’un découpage mot à mot.",
  "Mohammad Saayed is an Indonesian reciter reading according to Warsh ʿan Nafi. His complete mushaf, published on MP3Quran and QuranPedia, comes with a word-by-word timing edition.",
  "محمد سعيد قارئ إندونيسي يقرأ برواية ورش عن نافع. مصحفه الكامل المنشور على مكتبة القرآن الصوتية والموسوعة القرآنية مقترن بنسخة توقيت كلمة بكلمة.",
);
add(
  "warsh_ahmed_diban",
  "Ahmed Diban est un récitant syrien qui lit selon la lecture de Warsh ʿan Nafi par la voie d’Al‑Azreq. Son mushaf complet est diffusé par MP3Quran en flux par sourate.",
  "Ahmed Diban is a Syrian reciter reading according to Warsh ʿan Nafi through the Al‑Azraq transmission. His complete mushaf is streamed surah by surah on MP3Quran.",
  "أحمد ديبان قارئ سوري يقرأ برواية ورش عن نافع من طريق الأزرق. مصحفه الكامل متاح سورًا سورًا على مكتبة القرآن الصوتية.",
);
fs.writeFileSync(path, JSON.stringify(j, null, 2) + "\n");
console.log("keys now:", Object.keys(j).length);
