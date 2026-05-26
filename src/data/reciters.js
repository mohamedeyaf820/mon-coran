/**
 * Reciters catalogue for Hafs + Warsh riwayat.
 *
 * CDN types:
 *   - 'islamic'   → cdn.islamic.network/quran/audio/128/{cdn}/{globalAyahNum}.mp3
 *   - 'everyayah' → everyayah.com/data/{cdn}/{SSSAAA}.mp3  (SSS=surah, AAA=ayahInSurah)
 */

const RECITERS = {
  hafs: [
    {
      id: "ar.alafasy",
      name: "مشاري العفاسي",
      nameEn: "Mishary Rashid Alafasy",
      nameFr: "Mishary Rashid Alafasy",
      style: "murattal",
      cdn: "Alafasi_128kbps",
      cdnType: "everyayah",
    },
    {
      id: "ar.abdulbasitmurattal",
      name: "عبد الباسط عبد الصمد (مرتل)",
      nameEn: "Abdul Basit (Murattal)",
      nameFr: "Abdul Basit (Murattal)",
      style: "murattal",
      cdn: "Abdul_Basit_Murattal_192kbps",
      cdnType: "everyayah",
    },
    {
      id: "ar.abdulbasitmujawwad",
      name: "عبد الباسط عبد الصمد (مجود)",
      nameEn: "Abdul Basit (Mujawwad)",
      nameFr: "Abdul Basit (Mujawwad)",
      style: "mujawwad",
      cdn: "Abdul_Basit_Mujawwad_128kbps",
      cdnType: "everyayah",
    },
    {
      id: "ar.husary",
      name: "محمود خليل الحصري",
      nameEn: "Mahmoud Khalil Al-Husary",
      nameFr: "Mahmoud Khalil Al-Husary",
      style: "murattal",
      cdn: "Husary_128kbps",
      cdnType: "everyayah",
    },
    {
      id: "ar.minshawi",
      name: "محمد صديق المنشاوي (مرتل)",
      nameEn: "Muhammad Siddiq al-Minshawi",
      nameFr: "Muhammad Siddiq al-Minshawi",
      style: "murattal",
      cdn: "Minshawy_Murattal_128kbps",
      cdnType: "everyayah",
    },
    {
      id: "ar.minshawimujawwad",
      name: "المنشاوي (مجود)",
      nameEn: "Al-Minshawi (Mujawwad)",
      nameFr: "Al-Minshawi (Mujawwad)",
      style: "mujawwad",
      cdn: "Minshawy_Mujawwad_192kbps",
      cdnType: "everyayah",
    },
    {
      id: "ar.saoodshuraym",
      name: "سعود الشريم",
      nameEn: "Saud ash-Shuraym",
      nameFr: "Saud ash-Shuraym",
      style: "murattal",
      cdn: "Saood_ash-Shuraym_128kbps",
      cdnType: "everyayah",
    },
    {
      id: "abdullaah_matrood",
      name: "عبدالله المطرود",
      nameEn: "Abdullah Al-Matrood",
      nameFr: "Abdullah Al-Matrood",
      style: "murattal",
      cdn: "Abdullah_Matroud_128kbps",
      cdnType: "everyayah",
    },
    {
      id: "abdullaah_basfar",
      name: "عبدالله بصفر",
      nameEn: "Abdullah Basfar",
      nameFr: "Abdullah Basfar",
      style: "murattal",
      cdn: "Abdullah_Basfar_192kbps",
      cdnType: "everyayah",
    },
    {
      id: "abdulsamad",
      name: "عبدالصمد",
      nameEn: "Abdul Samad",
      nameFr: "Abdul Samad",
      style: "murattal",
      cdn: "AbdulSamad_64kbps_QuranExplorer.Com",
      cdnType: "everyayah",
    },
    {
      id: "ar.abdurrahmaansudais",
      name: "عبد الرحمن السديس",
      nameEn: "Abdur-Rahman as-Sudais",
      nameFr: "Abdur-Rahman as-Sudais",
      style: "murattal",
      cdn: "Abdurrahmaan_As-Sudais_192kbps",
      cdnType: "everyayah",
    },
    {
      id: "ar.maaboralmeem",
      name: "سعد الغامدي",
      nameEn: "Saad Al-Ghamdi",
      nameFr: "Saad Al-Ghamdi",
      style: "murattal",
      cdn: "Saad_Al-Ghamdi_128kbps",
      cdnType: "everyayah",
    },
    {
      id: "ahmed_ajmy",
      name: "أحمد العجمي",
      nameEn: "Ahmed Al-Ajmy",
      nameFr: "Ahmed Al-Ajmy",
      style: "murattal",
      cdn: "Ahmed_ibn_Ali_al-Ajamy_128kbps",
      cdnType: "everyayah",
    },
    {
      id: "maher_almuaiqly",
      name: "ماهر المعيقلي",
      nameEn: "Maher Al-Muaiqly",
      nameFr: "Maher Al-Muaiqly",
      style: "murattal",
      cdn: "MaherAlMuaiqly128kbps",
      cdnType: "everyayah",
    },
    {
      id: "abdulbari_thubayti",
      name: "عبد الباري الثبيتي",
      nameEn: "Abdul Bari ath-Thubaity",
      nameFr: "Abdul Bari ath-Thubaity",
      style: "murattal",
      cdn: "Abdulbari_ath-Thubaity_128kbps",
      cdnType: "everyayah",
    },
    {
      id: "ali_jabir",
      name: "علي جابر",
      nameEn: "Ali Jabir",
      nameFr: "Ali Jabir",
      style: "murattal",
      cdn: "Ali_Jaber_64kbps",
      cdnType: "everyayah",
    },
    {
      id: "hudhaify",
      name: "علي الحذيفي",
      nameEn: "Ali Al-Hudhaify",
      nameFr: "Ali Al-Hudhaify",
      style: "murattal",
      cdn: "Hudhaify_128kbps",
      cdnType: "everyayah",
    },
    {
      id: "ar.muhammadjibreel",
      name: "محمد جبريل",
      nameEn: "Muhammad Jibreel",
      nameFr: "Muhammad Jibreel",
      style: "murattal",
      cdn: "Muhammad_Jibreel_128kbps",
      cdnType: "everyayah",
    },
    {
      id: "muhammad_ayyoub",
      name: "محمد أيوب",
      nameEn: "Muhammad Ayyoub",
      nameFr: "Muhammad Ayyoub",
      style: "murattal",
      cdn: "Muhammad_Ayyoub_128kbps",
      cdnType: "everyayah",
    },
    {
      id: "muhammad_tablawi",
      name: "محمد الطبلاوي",
      nameEn: "Muhammad Al-Tablawi",
      nameFr: "Muhammad Al-Tablawi",
      style: "murattal",
      cdn: "Mohammad_al_Tablaway_128kbps",
      cdnType: "everyayah",
    },
    {
      id: "hani_rifai",
      name: "هاني الرفاعي",
      nameEn: "Hani Ar-Rifai",
      nameFr: "Hani Ar-Rifai",
      style: "murattal",
      cdn: "Hani_Rifai_192kbps",
      cdnType: "everyayah",
    },
    {
      id: "fares_abbad",
      name: "فارس عباد",
      nameEn: "Fares Abbad",
      nameFr: "Fares Abbad",
      style: "murattal",
      cdn: "Fares_Abbad_64kbps",
      cdnType: "everyayah",
    },
    {
      id: "yasser_dossari_hafs",
      name: "ياسر الدوسري",
      nameEn: "Yasser Ad-Dossari",
      nameFr: "Yasser Ad-Dossari",
      style: "murattal",
      cdn: "Yasser_Ad-Dussary_128kbps",
      cdnType: "everyayah",
    },
    {
      id: "nasser_alqatami",
      name: "ناصر القطامي",
      nameEn: "Nasser Al-Qatami",
      nameFr: "Nasser Al-Qatami",
      style: "murattal",
      cdn: "Nasser_Alqatami_128kbps",
      cdnType: "everyayah",
    },
    {
      id: "ibrahim_akhdar",
      name: "إبراهيم الأخضر",
      nameEn: "Ibrahim Al-Akhdar",
      nameFr: "Ibrahim Al-Akhdar",
      style: "murattal",
      cdn: "Ibrahim_Akhdar_128kbps",
      cdnType: "everyayah",
    },
    {
      id: "khalid_qahtani",
      name: "خالد القحطاني",
      nameEn: "Khalid Al-Qahtani",
      nameFr: "Khalid Al-Qahtani",
      style: "murattal",
      cdn: "Khalid_Qahtani_128kbps",
      cdnType: "everyayah",
    },
    {
      id: "sahl_yassin",
      name: "سهل ياسين",
      nameEn: "Sahl Yassin",
      nameFr: "Sahl Yassin",
      style: "murattal",
      cdn: "Sahl_Yassin_128kbps",
      cdnType: "everyayah",
    },
  ],
  warsh: [
    {
      id: "warsh_abdulbasit",
      name: "عبد الباسط (ورش)",
      nameEn: "Abdul Basit (Warsh)",
      nameFr: "Abdul Basit (Warsh)",
      style: "murattal",
      cdn: "warsh/warsh_Abdul_Basit_128kbps",
      cdnType: "everyayah",
      audioMode: "ayah",
      verifiedWarsh: true,
    },
    {
      id: "warsh_ibrahim_aldosari",
      name: "إبراهيم الدوسري (ورش)",
      nameEn: "Ibrahim Al-Dosari (Warsh)",
      nameFr: "Ibrahim Al-Dosari (Warsh)",
      style: "murattal",
      cdn: "warsh/warsh_ibrahim_aldosary_128kbps",
      cdnType: "everyayah",
      audioMode: "ayah",
      verifiedWarsh: true,
    },
    {
      id: "warsh_yassin",
      name: "ياسين الجزائري (ورش)",
      nameEn: "Yassin Al-Jazaery (Warsh)",
      nameFr: "Yassin Al-Jazaery (Warsh)",
      style: "murattal",
      cdn: "warsh/warsh_yassin_al_jazaery_64kbps",
      cdnType: "everyayah",
      audioMode: "ayah",
      verifiedWarsh: true,
    },
    {
      id: "warsh_hussary",
      name: "محمود خليل الحصري (ورش)",
      nameEn: "Mahmoud Khalil Al-Husary (Warsh)",
      nameFr: "Mahmoud Khalil Al-Husary (Warsh)",
      style: "murattal",
      cdn: "https://server13.mp3quran.net/husr/Rewayat-Warsh-A-n-Nafi/",
      cdnType: "mp3quran-surah",
      audioMode: "surah",
      verifiedWarsh: true,
    },
    {
      id: "warsh_omar_al_qazabri",
      name: "عمر القزابري (ورش)",
      nameEn: "Omar Al-Qazabri (Warsh)",
      nameFr: "Omar Al-Qazabri (Warsh)",
      style: "murattal",
      cdn: "https://server9.mp3quran.net/omar_warsh/",
      cdnType: "mp3quran-surah",
      audioMode: "surah",
      verifiedWarsh: true,
    },
    {
      id: "warsh_mohammad_saayed",
      name: "محمد السايد (ورش)",
      nameEn: "Mohammad Saayed (Warsh)",
      nameFr: "Mohammad Saayed (Warsh)",
      style: "murattal",
      cdn: "https://server16.mp3quran.net/m_sayed/Rewayat-Warsh-A-n-Nafi/",
      cdnType: "mp3quran-surah",
      audioMode: "surah",
      verifiedWarsh: true,
    },
    {
      id: "warsh_al_qaria_yassen",
      name: "القارئ ياسين (ورش)",
      nameEn: "Al-Qaria Yassen (Warsh)",
      nameFr: "Al-Qaria Yassen (Warsh)",
      style: "murattal",
      cdn: "https://server11.mp3quran.net/qari/",
      cdnType: "mp3quran-surah",
      audioMode: "surah",
      verifiedWarsh: true,
    },
    {
      id: "warsh_aloyoon_al_koshi",
      name: "العيون الكوشي (ورش)",
      nameEn: "Aloyoon Al-Koshi (Warsh)",
      nameFr: "Aloyoon Al-Koshi (Warsh)",
      style: "murattal",
      cdn: "https://server11.mp3quran.net/koshi/",
      cdnType: "mp3quran-surah",
      audioMode: "surah",
      verifiedWarsh: true,
    },
    {
      id: "warsh_rachid_belalya",
      name: "رشيد بلعالية (ورش)",
      nameEn: "Rachid Belalya (Warsh)",
      nameFr: "Rachid Belalya (Warsh)",
      style: "murattal",
      cdn: "https://server6.mp3quran.net/bl3/Rewayat-Warsh-A-n-Nafi/",
      cdnType: "mp3quran-surah",
      audioMode: "surah",
      verifiedWarsh: true,
    },
  ],
};

const REMOVED_RECITER_IDS = new Set([
  "ar.abdulbasitmurattal",
  "ar.abdulbasitmujawwad",
  "ar.minshawimujawwad",
  "ar.saoodshuraym",
  "ar.abdurrahmaansudais",
  "ar.maaboralmeem",
  "abdulbari_thubayti",
  "ibrahim_akhdar",
  "khalid_qahtani",
]);

function filterRemovedReciters(list = []) {
  return list.filter((reciter) => !REMOVED_RECITER_IDS.has(reciter.id));
}

const AVAILABLE_RECITERS = {
  hafs: filterRemovedReciters(RECITERS.hafs),
  warsh: filterRemovedReciters(RECITERS.warsh),
};

const ALL_AVAILABLE_RECITERS = [
  ...AVAILABLE_RECITERS.hafs,
  ...AVAILABLE_RECITERS.warsh,
];

export const RECITER_PHOTOS_MAP = {
  "ar.alafasy": "https://static.qurancdn.com/images/reciters/6/mishary-rashid-alafasy-profile.jpeg",
  "ar.abdulbasitmurattal": "https://static.qurancdn.com/images/reciters/1/abdelbasset-profile.jpeg",
  "ar.abdulbasitmujawwad": "https://static.qurancdn.com/images/reciters/1/abdelbasset-profile.jpeg",
  "ar.husary": "https://static.qurancdn.com/images/reciters/5/mahmoud-khalil-al-hussary-profile.png",
  "ar.minshawi": "https://static.qurancdn.com/images/reciters/14/muhammad-siddiq-al-minshawi-profile.jpeg",
  "ar.minshawimujawwad": "https://static.qurancdn.com/images/reciters/14/muhammad-siddiq-al-minshawi-profile.jpeg",
  "ahmed_ajmy": "https://static.qurancdn.com/images/reciters/22/Ahmed-ibn-Ali-al-Ajmy-profile.png",
  "maher_almuaiqly": "https://static.qurancdn.com/images/reciters/11/maher-al-muaiqly-profile.jpeg",
  "yasser_dossari_hafs": "https://static.qurancdn.com/images/reciters/20/yasser-profile.png",
  "nasser_alqatami": "https://static.qurancdn.com/images/reciters/13/nasser-al-qatami-profile.jpeg",
  "ali_jabir": "https://static.qurancdn.com/images/reciters/7/ali-jaber-profile.jpeg",
  "hudhaify": "https://static.qurancdn.com/images/reciters/10/ali-al-hudhaifi-profile.jpeg",
  "muhammad_ayyoub": "https://static.qurancdn.com/images/reciters/12/muhammad-ayyoub-profile.jpeg",
  "fares_abbad": "https://static.qurancdn.com/images/reciters/21/fares-abbad-profile.png",
  "ar.saoodshuraym": "https://static.qurancdn.com/images/reciters/3/saud-ash-shuraym-profile.jpeg",
  "ar.abdurrahmaansudais": "https://static.qurancdn.com/images/reciters/2/abdul-rahman-al-sudais-profile.jpeg",
  "ar.muhammadjibreel": "https://static.qurancdn.com/images/reciters/15/muhammad-jibreel-profile.png",
  "warsh_abdulbasit": "https://static.qurancdn.com/images/reciters/1/abdelbasset-profile.jpeg",
  "warsh_hussary": "https://static.qurancdn.com/images/reciters/5/mahmoud-khalil-al-hussary-profile.png",
  "warsh_omar_al_qazabri": "https://static.qurancdn.com/images/reciters/18/omar-al-qazabri-profile.png",
};

export default AVAILABLE_RECITERS;

export function getRecitersByRiwaya(riwaya = "hafs") {
  return AVAILABLE_RECITERS[riwaya] || AVAILABLE_RECITERS.hafs;
}

export function getDefaultReciterId(riwaya = "hafs") {
  const reciterId = getRecitersByRiwaya(riwaya)?.[0]?.id;
  if (reciterId) return reciterId;
  return getRecitersByRiwaya("hafs")?.[0]?.id || "ar.alafasy";
}

export function ensureReciterForRiwaya(reciterId, riwaya = "hafs") {
  const list = getRecitersByRiwaya(riwaya);
  return list.some((r) => r.id === reciterId)
    ? reciterId
    : getDefaultReciterId(riwaya);
}

export function getReciter(id, riwaya = null) {
  if (riwaya && AVAILABLE_RECITERS[riwaya]) {
    return getRecitersByRiwaya(riwaya).find((r) => r.id === id) || null;
  }
  return ALL_AVAILABLE_RECITERS.find((r) => r.id === id) || null;
}

export function reciterName(id, lang = "ar") {
  const r = getReciter(id);
  if (!r) return "";
  if (lang === "en") return r.nameEn;
  if (lang === "fr") return r.nameFr;
  return r.name;
}

export function isWarshVerifiedReciter(reciterOrId, riwaya = "warsh") {
  const reciter =
    typeof reciterOrId === "string"
      ? getReciter(reciterOrId, riwaya) || getReciter(reciterOrId)
      : reciterOrId;
  if (!reciter) return false;
  if (reciter.verifiedWarsh) return true;
  return String(reciter.cdn || "").toLowerCase().includes("warsh");
}

export function isSurahOnlyReciter(reciterOrId, riwaya = null) {
  const reciter =
    typeof reciterOrId === "string"
      ? getReciter(reciterOrId, riwaya) || getReciter(reciterOrId)
      : reciterOrId;
  return reciter?.audioMode === "surah";
}
