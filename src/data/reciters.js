/**
 * Reciters catalogue for Hafs + Warsh riwayat.
 *
 * CDN types:
 *   - 'islamic'   → cdn.islamic.network/quran/audio/128/{cdn}/{globalAyahNum}.mp3
 *   - 'everyayah' → everyayah.com/data/{cdn}/{SSSAAA}.mp3  (SSS=surah, AAA=ayahInSurah)
 */

const SUPPLEMENTAL_HAFS_RECITERS = [
  {
    id: "badr_al_turki",
    name: "بدر التركي",
    nameEn: "Badr Al-Turki",
    nameFr: "Badr Al-Turki",
    style: "murattal",
    cdn: "Badr_Al-Turki_128kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    country: "KSA",
    source: "everyayah",
  },
  {
    id: "abu_bakr_ash_shaatree",
    name: "أبو بكر الشاطري",
    nameEn: "Abu Bakr Ash-Shaatree",
    nameFr: "Abou Bakr Ach-Chaatri",
    style: "murattal",
    cdn: "Abu_Bakr_Ash-Shaatree_128kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    country: "KSA",
    source: "everyayah",
  },
  {
    id: "ahmed_neana",
    name: "أحمد نعناع",
    nameEn: "Ahmed Neana",
    nameFr: "Ahmed Neana",
    style: "murattal",
    cdn: "Ahmed_Neana_128kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    country: "Egypt",
    source: "everyayah",
  },
  {
    id: "akram_alalaqimy",
    name: "أكرم العلاقمي",
    nameEn: "Akram Al-Alaqimy",
    nameFr: "Akram Al-Alaqimi",
    style: "murattal",
    cdn: "Akram_AlAlaqimy_128kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    source: "everyayah",
  },
  {
    id: "ghamadi_40",
    name: "سعد الغامدي",
    nameEn: "Saad Al-Ghamdi",
    nameFr: "Saad Al-Ghamdi",
    style: "murattal",
    cdn: "Ghamadi_40kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    country: "KSA",
    source: "everyayah",
  },
  {
    id: "husary_muallim",
    name: "الحصري المعلم",
    nameEn: "Al-Husary Muallim",
    nameFr: "Al-Housri Muallim",
    style: "murattal",
    cdn: "Husary_Muallim_128kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    country: "Egypt",
    source: "everyayah",
  },
  {
    id: "husary_mujawwad_hafs",
    name: "الحصري مجود",
    nameEn: "Al-Husary Mujawwad",
    nameFr: "Al-Housri Mujawwad",
    style: "mujawwad",
    cdn: "Husary_Mujawwad_64kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    country: "Egypt",
    source: "everyayah",
  },
  {
    id: "khalid_abdullaah_qahtani_hafs",
    name: "خالد عبد الله القحطاني",
    nameEn: "Khalid Abdullah Al-Qahtani",
    nameFr: "Khaled Abdullah Al-Qahtani",
    style: "murattal",
    cdn: "Khaalid_Abdullaah_al-Qahtaanee_192kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    country: "KSA",
    source: "everyayah",
  },
  {
    id: "mustafa_ismail",
    name: "مصطفى إسماعيل",
    nameEn: "Mustafa Ismail",
    nameFr: "Mustafa Ismail",
    style: "mujawwad",
    cdn: "Mustafa_Ismail_48kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    country: "Egypt",
    source: "everyayah",
  },
  {
    id: "nabil_rifai",
    name: "نبيل الرفاعي",
    nameEn: "Nabil Ar-Rifai",
    nameFr: "Nabil Ar-Rifaï",
    style: "murattal",
    cdn: "Nabil_Rifa3i_48kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    source: "everyayah",
  },
  {
    id: "salah_al_budair",
    name: "صلاح البدير",
    nameEn: "Salah Al-Budair",
    nameFr: "Salah Al-Budaïr",
    style: "murattal",
    cdn: "Salah_Al_Budair_128kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    country: "KSA",
    source: "everyayah",
  },
  {
    id: "mahmoud_ali_al_banna",
    name: "محمود علي البنا",
    nameEn: "Mahmoud Ali Al-Banna",
    nameFr: "Mahmoud Ali Al-Banna",
    style: "mujawwad",
    cdn: "mahmoud_ali_al_banna_32kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    country: "Egypt",
    source: "everyayah",
  },
  {
    id: "karim_mansoori",
    name: "كريم منصوري",
    nameEn: "Karim Mansoori",
    nameFr: "Karim Mansouri",
    style: "murattal",
    cdn: "Karim_Mansoori_40kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    source: "everyayah",
  },
  {
    id: "muhsin_al_qasim",
    name: "محسن القاسم",
    nameEn: "Muhsin Al-Qasim",
    nameFr: "Mohcine Al-Qasim",
    style: "murattal",
    cdn: "Muhsin_Al_Qasim_192kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    country: "KSA",
    source: "everyayah",
  },
  {
    id: "salaah_bukhatir",
    name: "صلاح بوخاطر",
    nameEn: "Salah Abdul Rahman Bukhatir",
    nameFr: "Salah Boukhatir",
    style: "murattal",
    cdn: "Salaah_AbdulRahman_Bukhatir_128kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    source: "everyayah",
  },
  {
    id: "yaser_salamah",
    name: "ياسر سلامة",
    nameEn: "Yaser Salamah",
    nameFr: "Yasser Salamah",
    style: "murattal",
    cdn: "Yaser_Salamah_128kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    source: "everyayah",
  },
  {
    id: "aziz_alili",
    name: "عزيز عليلي",
    nameEn: "Aziz Alili",
    nameFr: "Aziz Alili",
    style: "murattal",
    cdn: "aziz_alili_128kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    source: "everyayah",
  },
  {
    id: "khalefa_al_tunaiji",
    name: "خليفة الطنيجي",
    nameEn: "Khalefa Al-Tunaiji",
    nameFr: "Khalifa Al-Tunaiji",
    style: "murattal",
    cdn: "khalefa_al_tunaiji_64kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    source: "everyayah",
  },
  {
    id: "ahmed_ibn_ali_al_ajamy_64",
    name: "أحمد بن علي العجمي",
    nameEn: "Ahmed ibn Ali al-Ajmy",
    nameFr: "Ahmed ibn Ali al-Ajmi",
    style: "murattal",
    cdn: "Ahmed_ibn_Ali_al-Ajamy_64kbps_QuranExplorer.Com",
    cdnType: "everyayah",
    audioMode: "ayah",
    country: "KSA",
    source: "everyayah",
  },
  {
    id: "abdullah_awwad_al_juhaynee",
    name: "عبد الله عواد الجهني",
    nameEn: "Abdullah Awwad Al-Juhaynee",
    nameFr: "Abdullah Awwad Al-Juhaynee",
    style: "murattal",
    cdn: "Abdullaah_3awwaad_Al-Juhaynee_128kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    country: "KSA",
    source: "everyayah",
  },
];

const SUPPLEMENTAL_WARSH_RECITERS = [
  {
    id: "warsh_muhammad_hifnawi",
    name: "محمد الحفناوي",
    nameEn: "Muhammad Al-Hifnawi",
    nameFr: "Muhammad Al-Hifnawi",
    style: "murattal",
    cdn: "https://server7.mp3quran.net/hifnawi/",
    cdnType: "mp3quran-surah",
    audioMode: "surah",
    verifiedWarsh: true,
    country: "Egypt",
    source: "mp3quran",
  },
  {
    id: "warsh_ahmed_mesairi",
    name: "أحمد المصيري",
    nameEn: "Ahmed Al-Mesairi",
    nameFr: "Ahmed Al-Mesairi",
    style: "murattal",
    cdn: "https://server10.mp3quran.net/mesairi/",
    cdnType: "mp3quran-surah",
    audioMode: "surah",
    verifiedWarsh: true,
    source: "mp3quran",
  },
  {
    id: "warsh_bilal_jaabir",
    name: "بلال جابر",
    nameEn: "Bilal Jaabir",
    nameFr: "Bilal Jaabir",
    style: "murattal",
    cdn: "https://server14.mp3quran.net/bilal/",
    cdnType: "mp3quran-surah",
    audioMode: "surah",
    verifiedWarsh: true,
    source: "mp3quran",
  },
  {
    id: "warsh_muhammad_abdullah",
    name: "محمد عبد الله",
    nameEn: "Muhammad Abdullah",
    nameFr: "Muhammad Abdullah",
    style: "murattal",
    cdn: "https://server15.mp3quran.net/abdullah/",
    cdnType: "mp3quran-surah",
    audioMode: "surah",
    verifiedWarsh: true,
    source: "mp3quran",
  },
  {
    id: "warsh_saad_ghamidi",
    name: "سعد الغامدي (ورش)",
    nameEn: "Saad Al-Ghamdi (Warsh)",
    nameFr: "Saad Al-Ghamdi (Warsh)",
    style: "murattal",
    cdn: "https://server8.mp3quran.net/s_gmd/",
    cdnType: "mp3quran-surah",
    audioMode: "surah",
    verifiedWarsh: true,
    country: "KSA",
    source: "mp3quran",
  },
  {
    id: "warsh_mahmoud_shuraym",
    name: "محمود الشريم (ورش)",
    nameEn: "Mahmoud Ash-Shuraym (Warsh)",
    nameFr: "Mahmoud Ash-Shuraym (Warsh)",
    style: "murattal",
    cdn: "https://server7.mp3quran.net/shur/",
    cdnType: "mp3quran-surah",
    audioMode: "surah",
    verifiedWarsh: true,
    source: "mp3quran",
  },
];

const RECITERS = {
  hafs: [
    {
      id: "ar.alafasy",
      name: "مشاري العفاسي",
      nameEn: "Mishary Rashid Alafasy",
      nameFr: "Mishary Rashid Alafasy",
      style: "murattal",
      cdn: "ar.alafasy",
      cdnType: "islamic",
    },
    {
      id: "ar.abdulbasitmurattal",
      name: "عبد الباسط عبد الصمد (مرتل)",
      nameEn: "Abdul Basit (Murattal)",
      nameFr: "Abdul Basit (Murattal)",
      style: "murattal",
      cdn: "ar.abdulbasitmurattal",
      cdnType: "islamic",
    },
    {
      id: "ar.abdulbasitmujawwad",
      name: "عبد الباسط عبد الصمد (مجود)",
      nameEn: "Abdul Basit (Mujawwad)",
      nameFr: "Abdul Basit (Mujawwad)",
      style: "mujawwad",
      cdn: "ar.abdulbasitmujawwad",
      cdnType: "islamic",
    },
    {
      id: "ar.husary",
      name: "محمود خليل الحصري",
      nameEn: "Mahmoud Khalil Al-Husary",
      nameFr: "Mahmoud Khalil Al-Husary",
      style: "murattal",
      cdn: "ar.husary",
      cdnType: "islamic",
    },
    {
      id: "ar.minshawi",
      name: "محمد صديق المنشاوي (مرتل)",
      nameEn: "Muhammad Siddiq al-Minshawi",
      nameFr: "Muhammad Siddiq al-Minshawi",
      style: "murattal",
      cdn: "ar.minshawi",
      cdnType: "islamic",
    },
    {
      id: "ar.minshawimujawwad",
      name: "المنشاوي (مجود)",
      nameEn: "Al-Minshawi (Mujawwad)",
      nameFr: "Al-Minshawi (Mujawwad)",
      style: "mujawwad",
      cdn: "ar.minshawimujawwad",
      cdnType: "islamic",
    },
    {
      id: "ar.saoodshuraym",
      name: "سعود الشريم",
      nameEn: "Saud ash-Shuraym",
      nameFr: "Saud ash-Shuraym",
      style: "murattal",
      cdn: "ar.saoodshuraym",
      cdnType: "islamic",
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
      cdn: "ar.abdurrahmaansudais",
      cdnType: "islamic",
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
      cdn: "Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net",
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
    ...SUPPLEMENTAL_HAFS_RECITERS,
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
    ...SUPPLEMENTAL_WARSH_RECITERS,
  ],
};

// Reciters removed from the selectable list because their audio CDN was unreliable.
// Note: ar.abdulbasitmurattal, ar.abdulbasitmujawwad, ar.minshawimujawwad,
// ar.saoodshuraym, ar.abdurrahmaansudais have been migrated to Islamic Network CDN
// and are now re-enabled.
const REMOVED_RECITER_IDS = new Set([
  "badr_al_turki",
  "ar.maaboralmeem",
  "abdulbari_thubayti",
  "ibrahim_akhdar",
  "khalid_qahtani",
  "warsh_muhammad_hifnawi",
  "warsh_ahmed_mesairi",
  "warsh_bilal_jaabir",
  "warsh_muhammad_abdullah",
  "warsh_saad_ghamidi",
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

const QURAN_RECITER_IMAGE_BASE = "https://static.qurancdn.com/images/reciters/";
const quranPhoto = (path) => `${QURAN_RECITER_IMAGE_BASE}${path}`;

export const RECITER_PHOTOS_MAP = {
  "ar.alafasy": quranPhoto("6/mishary-rashid-alafasy-profile.jpeg"),
  "ar.abdulbasitmurattal": quranPhoto("1/abdelbasset-profile.jpeg"),
  "ar.abdulbasitmujawwad": quranPhoto("1/abdelbasset-profile.jpeg"),
  "ar.husary": quranPhoto("5/mahmoud-khalil-al-hussary-profile.png"),
  husary_muallim: quranPhoto("5/mahmoud-khalil-al-hussary-profile.png"),
  husary_mujawwad_hafs: quranPhoto("5/mahmoud-khalil-al-hussary-profile.png"),
  abu_bakr_ash_shaatree: quranPhoto("3/abu-bakr-al-shatri-pofile.jpeg?v=1"),
  ahmed_ajmy: quranPhoto("22/Ahmed-ibn-Ali-al-Ajmy-profile.png"),
  ahmed_ibn_ali_al_ajamy_64: quranPhoto("22/Ahmed-ibn-Ali-al-Ajmy-profile.png"),
  yasser_dossari_hafs: quranPhoto("20/yasser-profile.png"),
  ali_jabir: quranPhoto("23/Abdullah-Ali-Jabir-profile.png?v=1"),
  "ar.abdurrahmaansudais": quranPhoto("2/abdul-rahman-al-sudais-profile.jpeg"),
  "ar.maaboralmeem": quranPhoto("16/saad-al-ghamdi-profile.png?v=1"),
  ghamadi_40: quranPhoto("16/saad-al-ghamdi-profile.png?v=1"),
  warsh_saad_ghamidi: quranPhoto("16/saad-al-ghamdi-profile.png?v=1"),
  "ar.muhammadjibreel": quranPhoto("10/muhammad-jebril-profile.jpeg"),
  hani_rifai: quranPhoto("4/hani-ar-rifai-profile.jpeg?v=1"),
  khalefa_al_tunaiji: quranPhoto("11/khalifa-al-tunaiji-profile.jpeg?v=1"),
  warsh_abdulbasit: quranPhoto("1/abdelbasset-profile.jpeg"),
  warsh_hussary: quranPhoto("5/mahmoud-khalil-al-hussary-profile.png"),
};

const AVATAR_COLORS = [
  "#0f766e",
  "#2563eb",
  "#7c3aed",
  "#be123c",
  "#b45309",
  "#047857",
  "#4338ca",
  "#0369a1",
];

export function getReciterAvatar(reciter) {
  const id = String(reciter?.id || reciter?.nameEn || "reciter");
  const label = String(
    reciter?.nameEn || reciter?.nameFr || reciter?.name || id,
  );
  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.replace(/[^A-Za-z0-9]/g, "")[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const hash = [...id].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const color = AVATAR_COLORS[hash % AVATAR_COLORS.length];
  const colorAlt = AVATAR_COLORS[(hash + 3) % AVATAR_COLORS.length];
  return {
    initials: initials || "MP",
    color,
    colorAlt,
    gradient: `linear-gradient(135deg, ${color}, ${colorAlt})`,
  };
}

export function getReciterPhoto(reciterOrId) {
  const id =
    typeof reciterOrId === "string"
      ? reciterOrId
      : String(reciterOrId?.id || "");
  if (!id) return null;
  return RECITER_PHOTOS_MAP[id] || null;
}

export function getReciterVisual(reciter) {
  const photo = getReciterPhoto(reciter);
  return {
    type: photo ? "photo" : "avatar",
    photo,
    avatar: getReciterAvatar(reciter),
  };
}

export function getReciterBio(reciter, lang = "fr") {
  if (!reciter) return "";
  if (typeof reciter.bio === "string") return reciter.bio;
  if (reciter.bio && typeof reciter.bio === "object") {
    return (
      reciter.bio[lang] ||
      reciter.bio.fr ||
      reciter.bio.en ||
      reciter.bio.ar ||
      ""
    );
  }

  const name =
    lang === "ar"
      ? reciter.name
      : lang === "fr"
        ? reciter.nameFr || reciter.nameEn
        : reciter.nameEn || reciter.nameFr;
  const style =
    reciter.style === "mujawwad"
      ? lang === "fr"
        ? "mujawwad"
        : "mujawwad"
      : lang === "ar"
        ? "مرتل"
        : "murattal";
  const sourceLabel =
    reciter.source === "mp3quran"
      ? "MP3Quran"
      : reciter.source === "everyayah"
        ? "EveryAyah"
        : reciter.cdnType || "audio";

  if (lang === "ar") {
    return `${name} قارئ متاح في MushafPlus بنمط ${style}. مصدر الصوت: ${sourceLabel}.`;
  }
  if (lang === "en") {
    return `${name} is available in MushafPlus with a ${style} recitation profile. Audio source: ${sourceLabel}.`;
  }
  return `${name} est disponible dans MushafPlus avec un profil de récitation ${style}. Source audio : ${sourceLabel}.`;
}

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
  return String(reciter.cdn || "")
    .toLowerCase()
    .includes("warsh");
}

export function isSurahOnlyReciter(reciterOrId, riwaya = null) {
  const reciter =
    typeof reciterOrId === "string"
      ? getReciter(reciterOrId, riwaya) || getReciter(reciterOrId)
      : reciterOrId;
  return reciter?.audioMode === "surah";
}
