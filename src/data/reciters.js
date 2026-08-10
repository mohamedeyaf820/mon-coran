/**
 * Reciters catalogue for Hafs + Warsh riwayat.
 *
 * CDN types:
 *   - 'islamic'   → cdn.islamic.network/quran/audio/128/{cdn}/{globalAyahNum}.mp3
 *   - 'everyayah' → everyayah.com/data/{cdn}/{SSSAAA}.mp3  (SSS=surah, AAA=ayahInSurah)
 */

const SUPPLEMENTAL_HAFS_RECITERS = [
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
    country: "Syria",
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
  {
    id: "idris_abkar",
    name: "إدريس أبكر",
    nameEn: "Idris Abkar",
    nameFr: "Idris Abkar",
    style: "murattal",
    cdn: "https://server6.mp3quran.net/abkr/",
    cdnType: "mp3quran-surah",
    audioMode: "surah",
    country: "KSA",
    source: "mp3quran",
  },
  {
    id: "bandar_baleela",
    name: "بندر بليلة",
    nameEn: "Bandar Baleela",
    nameFr: "Bandar Baleela",
    style: "murattal",
    cdn: "https://server6.mp3quran.net/balilah/",
    cdnType: "mp3quran-surah",
    audioMode: "surah",
    country: "KSA",
    source: "mp3quran",
  },
  {
    id: "ahmad_al_hawashi",
    name: "أحمد الحواشي",
    nameEn: "Ahmad Al-Hawashi",
    nameFr: "Ahmad Al-Hawashi",
    style: "murattal",
    cdn: "https://server11.mp3quran.net/hawashi/",
    cdnType: "mp3quran-surah",
    audioMode: "surah",
    country: "KSA",
    source: "mp3quran",
  },
  {
    id: "ibrahim_al_akhdar",
    name: "إبراهيم الأخضر",
    nameEn: "Ibrahim Al-Akhdar",
    nameFr: "Ibrahim Al-Akhdar",
    style: "murattal",
    cdn: "https://server6.mp3quran.net/akdr/",
    cdnType: "mp3quran-surah",
    audioMode: "surah",
    country: "KSA",
    source: "mp3quran",
  },
  {
    id: "mohamed_al_luhaidan",
    name: "محمد اللحيدان",
    nameEn: "Mohamed Al-Luhaidan",
    nameFr: "Mohamed Al-Luhaidan",
    style: "murattal",
    cdn: "https://server8.mp3quran.net/lhdan/",
    cdnType: "mp3quran-surah",
    audioMode: "surah",
    country: "KSA",
    source: "mp3quran",
  },
  {
    id: "khaled_al_jalil",
    name: "خالد الجليل",
    nameEn: "Khaled Al-Jalil",
    nameFr: "Khaled Al-Jalil",
    style: "murattal",
    cdn: "https://server10.mp3quran.net/jleel/",
    cdnType: "mp3quran-surah",
    audioMode: "surah",
    country: "KSA",
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
      country: "Kuwait",
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
      cdn: "ar.husary",
      cdnType: "islamic",
      country: "Egypt",
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
      country: "KSA",
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
      name: "عبد الباسط عبد الصمد (رواية بديلة)",
      nameEn: "Abdul Basit (Alt. Recording)",
      nameFr: "Abdul Basit (Enregistrement alternatif)",
      style: "murattal",
      cdn: "AbdulSamad_64kbps_QuranExplorer.Com",
      cdnType: "everyayah",
      country: "Egypt",
    },
    {
      id: "ar.abdurrahmaansudais",
      name: "عبد الرحمن السديس",
      nameEn: "Abdur-Rahman as-Sudais",
      nameFr: "Abdur-Rahman as-Sudais",
      style: "murattal",
      cdn: "Abdurrahmaan_As-Sudais_192kbps",
      cdnType: "everyayah",
      country: "KSA",
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
      country: "KSA",
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
      country: "Egypt",
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
      country: "KSA",
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
      cdn: "https://server7.mp3quran.net/basit/Rewayat-Warsh-A-n-Nafi/",
      cdnType: "mp3quran-surah",
      audioMode: "surah",
      country: "Egypt",
      verifiedWarsh: true,
    },
    {
      id: "warsh_ibrahim_aldosari",
      name: "إبراهيم الدوسري (ورش)",
      nameEn: "Ibrahim Al-Dosari (Warsh)",
      nameFr: "Ibrahim Al-Dosari (Warsh)",
      style: "murattal",
      cdn: "https://server10.mp3quran.net/ibrahim_dosri/Rewayat-Warsh-A-n-Nafi/",
      cdnType: "mp3quran-surah",
      audioMode: "surah",
      country: "KSA",
      verifiedWarsh: true,
    },
    {
      id: "warsh_abdelmoujib_benkirane",
      name: "عبد المجيب بن كيران (ورش)",
      nameEn: "Abdelmoujib Benkirane (Warsh)",
      nameFr: "Abdelmoujib Benkirane (Warsh)",
      style: "murattal",
      cdn: "https://server16.mp3quran.net/A-Benkirane/Rewayat-Warsh-A-n-Nafi/",
      cdnType: "mp3quran-surah",
      audioMode: "surah",
      country: "Morocco",
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
      country: "Algeria",
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
      country: "Egypt",
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
      country: "Morocco",
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
      country: "Morocco",
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
      country: "Algeria",
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
      country: "Morocco",
      verifiedWarsh: true,
    },
    {
      id: "warsh_rachid_belalya",
      name: "رشيد بلعالية (ورش)",
      nameEn: "Rachid Belalia (Warsh)",
      nameFr: "Rachid Belalia (Warsh)",
      style: "murattal",
      cdn: "https://server6.mp3quran.net/bl3/Rewayat-Warsh-A-n-Nafi/",
      cdnType: "mp3quran-surah",
      audioMode: "surah",
      country: "Algeria",
      verifiedWarsh: true,
    },
  ],
};

export const RECITER_SOURCE_INFO = Object.freeze({
  islamic: Object.freeze({
    id: "islamic",
    label: "Islamic Network",
    audioMode: "ayah",
    directDownload: false,
  }),
  everyayah: Object.freeze({
    id: "everyayah",
    label: "EveryAyah",
    audioMode: "ayah",
    directDownload: false,
  }),
  "mp3quran-surah": Object.freeze({
    id: "mp3quran",
    label: "MP3Quran",
    audioMode: "surah",
    directDownload: true,
  }),
});

const TRUSTED_MP3QURAN_HOST = /^server\d+\.mp3quran\.net$/i;
const SAFE_CDN_PATH = /^[a-z0-9._/-]+$/i;

function normalizeReciterProfile(reciter, riwaya) {
  const cdnType = reciter.cdnType || "islamic";
  const sourceInfo = RECITER_SOURCE_INFO[cdnType] || RECITER_SOURCE_INFO.islamic;

  return {
    ...reciter,
    cdnType,
    audioMode: reciter.audioMode || sourceInfo.audioMode,
    source: reciter.source || sourceInfo.id,
    country: reciter.country || null,
    riwaya,
    verifiedWarsh: riwaya === "warsh" && reciter.verifiedWarsh === true,
  };
}

const AVAILABLE_RECITERS = {
  hafs: RECITERS.hafs.map((reciter) => normalizeReciterProfile(reciter, "hafs")),
  warsh: RECITERS.warsh.map((reciter) => normalizeReciterProfile(reciter, "warsh")),
};

const ALL_AVAILABLE_RECITERS = [
  ...AVAILABLE_RECITERS.hafs,
  ...AVAILABLE_RECITERS.warsh,
];

const QURAN_RECITER_IMAGE_BASE = "https://static.qurancdn.com/images/reciters/";
const quranPhoto = (path) => `${QURAN_RECITER_IMAGE_BASE}${path}`;
const ASSABILE_IMAGE_BASE = "https://www.assabile.com/media/person/280x219/";
const assabilePhoto = (path) => `${ASSABILE_IMAGE_BASE}${path}`;

// Curated portrait URLs must identify the same reciter as their attributed
// profile. The UI keeps a deterministic initials avatar as a network fallback.
export const RECITER_PHOTOS_MAP = {
  "ar.alafasy": quranPhoto("6/mishary-rashid-alafasy-profile.jpeg"),
  "ar.abdulbasitmurattal": quranPhoto("1/abdelbasset-profile.jpeg"),
  "ar.abdulbasitmujawwad": quranPhoto("1/abdelbasset-profile.jpeg"),
  abdulsamad: quranPhoto("1/abdelbasset-profile.jpeg"),
  "ar.husary": quranPhoto("5/mahmoud-khalil-al-hussary-profile.png"),
  husary_muallim: quranPhoto("5/mahmoud-khalil-al-hussary-profile.png"),
  husary_mujawwad_hafs: quranPhoto("5/mahmoud-khalil-al-hussary-profile.png"),
  "ar.minshawi": quranPhoto("7/mohamed-siddiq-el-minshawi-profile.jpeg"),
  "ar.minshawimujawwad": quranPhoto("7/mohamed-siddiq-el-minshawi-profile.jpeg"),
  "ar.saoodshuraym": quranPhoto("8/saoud-shuraim-profile.jpeg"),
  abu_bakr_ash_shaatree: quranPhoto("3/abu-bakr-al-shatri-pofile.jpeg"),
  hani_rifai: quranPhoto("4/hani-ar-rifai-profile.jpeg"),
  "ar.abdurrahmaansudais": quranPhoto("2/abdul-rahman-al-sudais-profile.jpeg"),
  ghamadi_40: quranPhoto("16/saad-al-ghamdi-profile.png"),
  "ar.muhammadjibreel": quranPhoto("10/muhammad-jebril-profile.jpeg"),
  khalefa_al_tunaiji: quranPhoto("11/khalifa-al-tunaiji-profile.jpeg"),
  ali_jabir: quranPhoto("23/Abdullah-Ali-Jabir-profile.png"),
  bandar_baleela: quranPhoto("24/Bandar-Baleela-profile.png"),
  maher_almuaiqly: quranPhoto("25/Maher-al-Muaiqly-profile.png"),
  ahmed_ajmy: quranPhoto("22/Ahmed-ibn-Ali-al-Ajmy-profile.png"),
  ahmed_ibn_ali_al_ajamy_64: quranPhoto("22/Ahmed-ibn-Ali-al-Ajmy-profile.png"),
  yasser_dossari_hafs: quranPhoto("20/yasser-profile.png"),
  abdullaah_matrood:
    "https://www.assabile.com/media/photo/full_size/abdallah-matroud-582.jpg",
  abdullaah_basfar: assabilePhoto("abdullah-ibn-ali-basfar.png"),
  hudhaify: assabilePhoto("ali-alhodaifi.png"),
  muhammad_ayyoub: assabilePhoto("mohamed-ayoub.png"),
  muhammad_tablawi: assabilePhoto("mohamed-tablawi.png"),
  fares_abbad: assabilePhoto("fares-abbad.png"),
  nasser_alqatami: assabilePhoto("nasser-al-qatami.png"),
  sahl_yassin: assabilePhoto("sahl-yassin.png"),
  ahmed_neana: assabilePhoto("ahmed-nuinaa.png"),
  akram_alalaqimy: assabilePhoto("akram-al-aalakmi.png"),
  khalid_abdullaah_qahtani_hafs: assabilePhoto("khaled-al-qahtani.png"),
  mustafa_ismail: assabilePhoto("mustapha-ismail.png"),
  nabil_rifai: assabilePhoto("nabil-ar-rifai.png"),
  salah_al_budair: assabilePhoto("salah-al-budair.png"),
  mahmoud_ali_al_banna: assabilePhoto("mahmud-ali-al-banna.png"),
  karim_mansoori: assabilePhoto("karim-mansouri.jpg"),
  muhsin_al_qasim: assabilePhoto("abdulmohsen-al-qasim.png"),
  salaah_bukhatir: assabilePhoto("salah-bukhatir.png"),
  yaser_salamah: assabilePhoto("yasser-salama.jpg"),
  aziz_alili: assabilePhoto("aziz-alili.jpg"),
  abdullah_awwad_al_juhaynee: assabilePhoto("abdullah-awad-al-juhani.png"),
  idris_abkar: assabilePhoto("idriss-abkar.png"),
  ahmad_al_hawashi: assabilePhoto("ahmad-al-hawashy.png"),
  ibrahim_al_akhdar: assabilePhoto("ibrahim-al-akhdar.png"),
  mohamed_al_luhaidan: assabilePhoto("mohamed-al-haidan.png"),
  khaled_al_jalil: assabilePhoto("khalid-al-jalil.jpg"),
  warsh_abdulbasit: quranPhoto("1/abdelbasset-profile.jpeg"),
  warsh_ibrahim_aldosari:
    "https://storage.googleapis.com/way2quran_storage/imgs/ibrahim-al-dosari.png",
  warsh_abdelmoujib_benkirane:
    "https://static.suratmp3.com/pics/reciters/80.jpg",
  warsh_yassin:
    "https://www.assabile.com/media/person/200x256/al-qari-yassen.png",
  warsh_hussary: quranPhoto("5/mahmoud-khalil-al-hussary-profile.png"),
  warsh_omar_al_qazabri:
    "https://www.assabile.com/media/person/200x256/omar-al-kazabri.png",
  warsh_mohammad_saayed:
    "https://www.assabile.com/media/person/200x256/mohamed-sayed.jpg",
  warsh_al_qaria_yassen:
    "https://www.assabile.com/media/person/200x256/al-qari-yassen.png",
  warsh_aloyoon_al_koshi:
    "https://www.assabile.com/media/person/200x256/laayoun-el-kouchi.png",
  warsh_rachid_belalya:
    "https://surahquran.com/img/quraa/50.png",
};

const ASSABILE_PROFILE_BASE = "https://www.assabile.com";
const assabileProfile = (path) => `${ASSABILE_PROFILE_BASE}${path}`;

const RECITER_PROFILE_SOURCES = Object.freeze({
  abdullaah_matrood: assabileProfile("/abdullah-matrood-5/abdullah-matrood.htm"),
  abdullaah_basfar: assabileProfile("/abdullah-ibn-ali-basfar-6/abdullah-ibn-ali-basfar.htm"),
  hudhaify: assabileProfile("/ali-al-huthaify-19/ali-al-huthaify.htm"),
  muhammad_ayyoub: assabileProfile("/muhammad-ayyub-14/muhammad-ayyub.htm"),
  muhammad_tablawi: assabileProfile("/mohamed-tablawi-31/mohamed-tablawi.htm"),
  fares_abbad: assabileProfile("/fares-abbad-18/fares-abbad.htm"),
  nasser_alqatami: assabileProfile("/nasser-al-qatami-61/nasser-al-qatami.htm"),
  sahl_yassin: assabileProfile("/sahl-yasin-20/sahl-yasin.htm"),
  ahmed_neana: assabileProfile("/ahmed-nuinaa-75/ahmed-nuinaa.htm"),
  akram_alalaqimy: assabileProfile("/akram-al-aalakmi-80/akram-al-aalakmi.htm"),
  khalid_abdullaah_qahtani_hafs: assabileProfile("/khaled-al-qahtani-46/khaled-al-qahtani.htm"),
  mustafa_ismail: assabileProfile("/mustafa-ismail-48/mustafa-ismail.htm"),
  nabil_rifai: assabileProfile("/nabil-ar-rifai-36/nabil-ar-rifai.htm"),
  salah_al_budair: assabileProfile("/salah-al-budair-17/salah-al-budair.htm"),
  mahmoud_ali_al_banna: assabileProfile("/mahmoud-ali-al-banna-25/mahmoud-ali-al-banna.htm"),
  karim_mansoori: assabileProfile("/karim-mansouri-397/karim-mansouri.htm"),
  muhsin_al_qasim: assabileProfile("/abdulmohsen-al-qasim-45/abdulmohsen-al-qasim.htm"),
  salaah_bukhatir: assabileProfile("/salah-bukhatir-23/salah-bukhatir.htm"),
  yaser_salamah: assabileProfile("/yasser-salama-314/yasser-salama.htm"),
  aziz_alili: assabileProfile("/aziz-alili-507/aziz-alili.htm"),
  abdullah_awwad_al_juhaynee: assabileProfile("/abdullah-awad-al-juhani-93/abdullah-awad-al-juhani.htm"),
  idris_abkar: assabileProfile("/idriss-abkar-90/idriss-abkar.htm"),
  ahmad_al_hawashi: assabileProfile("/ahmad-al-hawashy-71/ahmad-al-hawashy.htm"),
  ibrahim_al_akhdar: assabileProfile("/ibrahim-al-akhdar-16/ibrahim-al-akhdar.htm"),
  mohamed_al_luhaidan: assabileProfile(
    "/muhammad-al-luhaidan-95/muhammad-al-luhaidan.htm",
  ),
  khaled_al_jalil: assabileProfile("/khalid-al-jalil-307/khalid-al-jalil.htm"),
  warsh_abdelmoujib_benkirane: assabileProfile(
    "/abdelmoujib-benkirane-310/abdelmoujib-benkirane.htm",
  ),
});

const RECITER_PHOTO_SOURCES = Object.freeze({
  abdullaah_matrood: Object.freeze({
    provider: "Assabile",
    url: "https://www.assabile.com/abdullah-matrood-5/photos",
  }),
  warsh_ibrahim_aldosari: Object.freeze({
    provider: "Way2Quran",
    url: "https://way2quran.com/ar/reciters/ibrahim-al-dosari?recitationSlug=warsh-an-nafi",
  }),
  warsh_abdelmoujib_benkirane: Object.freeze({
    provider: "SuratMP3",
    url: "https://suratmp3.com/fr/quran/reciters/80",
  }),
  warsh_rachid_belalya: Object.freeze({
    provider: "SurahQuran",
    url: "https://surahquran.com/mp3/Rachid-Belalia/",
  }),
});

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

const COUNTRY_LABELS = Object.freeze({
  KSA: Object.freeze({
    fr: "Arabie saoudite",
    en: "Saudi Arabia",
    ar: "السعودية",
  }),
  Egypt: Object.freeze({
    fr: "Égypte",
    en: "Egypt",
    ar: "مصر",
  }),
  Algeria: Object.freeze({
    fr: "Algérie",
    en: "Algeria",
    ar: "الجزائر",
  }),
  Morocco: Object.freeze({
    fr: "Maroc",
    en: "Morocco",
    ar: "المغرب",
  }),
});

export function getReciterAvatar(reciter) {
  const id = String(reciter?.id || reciter?.nameEn || "reciter");
  const label = String(
    reciter?.nameEn || reciter?.nameFr || reciter?.name || id,
  );
  const initials = label
    .replace(/[^a-zA-Z0-9\s؀-ۿ]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
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

const RECITER_PHOTO_FOCUS = Object.freeze({
  "ar.husary": "50% 30%",
  husary_muallim: "50% 30%",
  husary_mujawwad_hafs: "50% 30%",
  warsh_hussary: "50% 30%",
  abdullaah_matrood: "50% 24%",
  warsh_abdelmoujib_benkirane: "50% 22%",
  warsh_rachid_belalya: "50% 24%",
});

export function getReciterPhotoFocus(reciterOrId, photo = null) {
  const id =
    typeof reciterOrId === "string"
      ? reciterOrId
      : String(reciterOrId?.id || "");
  if (RECITER_PHOTO_FOCUS[id]) return RECITER_PHOTO_FOCUS[id];

  const source = photo || getReciterPhoto(reciterOrId) || "";
  if (source.includes("/200x256/")) return "50% 22%";
  if (source.includes("/280x219/")) return "50% 28%";
  if (source.includes("static.qurancdn.com")) return "50% 32%";
  return "50% 28%";
}

export function getReciterVisual(reciter) {
  const photo = getReciterPhoto(reciter);
  const explicitSource = RECITER_PHOTO_SOURCES[reciter?.id];
  const defaultSource = photo?.includes("assabile.com")
    ? {
        provider: "Assabile",
        url:
          RECITER_PROFILE_SOURCES[reciter?.id] ||
          "https://www.assabile.com/",
      }
    : {
        provider: "Quran.com",
        url: "https://quran.com/reciters",
      };
  const attribution = explicitSource || defaultSource;
  return {
    type: photo ? "photo" : "avatar",
    photo,
    focalPoint: getReciterPhotoFocus(reciter, photo),
    avatar: getReciterAvatar(reciter),
    attribution: photo
      ? {
          provider: attribution.provider,
          label: `Portrait · ${attribution.provider}`,
          url: attribution.url,
        }
      : null,
  };
}

export function getReciterProfileSource(reciterOrId) {
  const id =
    typeof reciterOrId === "string"
      ? reciterOrId
      : String(reciterOrId?.id || "");
  const url = RECITER_PROFILE_SOURCES[id];
  return url ? { provider: "Assabile", url } : null;
}

export function getReciterCountryLabel(reciterOrCountry, lang = "fr") {
  const country =
    typeof reciterOrCountry === "string"
      ? reciterOrCountry
      : reciterOrCountry?.country;
  if (!country) return "";
  return COUNTRY_LABELS[country]?.[lang] || COUNTRY_LABELS[country]?.fr || country;
}

export function getReciterSourceInfo(reciterOrId, riwaya = null) {
  const reciter =
    typeof reciterOrId === "string"
      ? getReciter(reciterOrId, riwaya) || getReciter(reciterOrId)
      : reciterOrId;
  const cdnType = reciter?.cdnType || "islamic";
  const sourceInfo = RECITER_SOURCE_INFO[cdnType] || null;
  return sourceInfo ? { ...sourceInfo, cdnType } : null;
}

export function validateReciterAudioConfig(reciter) {
  const errors = [];
  const sourceInfo = getReciterSourceInfo(reciter);
  const cdn = String(reciter?.cdn || "").trim();

  if (!sourceInfo) {
    errors.push("cdnType");
    return { valid: false, errors };
  }
  if (reciter.audioMode !== sourceInfo.audioMode) errors.push("audioMode");
  if (reciter.source !== sourceInfo.id) errors.push("source");

  if (sourceInfo.cdnType === "mp3quran-surah") {
    try {
      const url = new URL(cdn);
      if (
        url.protocol !== "https:" ||
        !TRUSTED_MP3QURAN_HOST.test(url.hostname) ||
        !url.pathname.endsWith("/") ||
        url.search ||
        url.hash
      ) {
        errors.push("cdn");
      }
    } catch {
      errors.push("cdn");
    }
  } else if (
    !cdn ||
    !SAFE_CDN_PATH.test(cdn) ||
    cdn.startsWith("/") ||
    cdn.includes("..") ||
    cdn.includes("//")
  ) {
    errors.push("cdn");
  }

  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

export function validateReciterProfile(reciter) {
  const errors = [];
  const requiredTextFields = ["id", "name", "nameEn", "nameFr", "style", "riwaya"];

  for (const field of requiredTextFields) {
    if (!String(reciter?.[field] || "").trim()) errors.push(field);
  }
  if (!/^[a-z0-9_.-]+$/i.test(String(reciter?.id || ""))) errors.push("id");
  if (!["murattal", "mujawwad", "tartil"].includes(reciter?.style)) errors.push("style");
  if (!["hafs", "warsh"].includes(reciter?.riwaya)) errors.push("riwaya");
  if (reciter?.riwaya === "warsh" && reciter?.verifiedWarsh !== true) {
    errors.push("verifiedWarsh");
  }
  if (reciter?.country !== null && typeof reciter?.country !== "string") {
    errors.push("country");
  }
  if (getReciterBio(reciter, "fr").length < 20) errors.push("bio");
  errors.push(...validateReciterAudioConfig(reciter).errors);

  return { valid: errors.length === 0, errors: [...new Set(errors)] };
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
