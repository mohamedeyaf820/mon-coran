/**
 * Reciters catalogue for Hafs + Warsh riwayat.
 *
 * CDN types (all per-ayah unless noted):
 *   - 'everyayah'  → everyayah.com/data/{cdn}/{SSSAAA}.mp3  (AAA = Hafs verse number)
 *   - 'quran-cdn'  → audio.qurancdn.com/{cdn}/{SSSAAA}.mp3  (Quran.com CDN; cdn ends with '/')
 *   - 'quranpedia' → files.quranpedia.net/recitations/{cdn}/{SSSAAA}.mp3  (AAA = riwaya verse number)
 *   - 'mp3quran-surah' → {cdn}{SSS}.mp3 whole-surah streams (legacy, no catalog entry)
 */

import { RECITER_PORTRAITS } from "./reciterPortraits.js";

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
    country: "Yemen",
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
    // EveryAyah publishes this as a distinct teaching recitation (Husary_Muallim),
    // slower and word-by-word oriented than his murattal — the hub's "Muallim"
    // filter exists for exactly this voice.
    style: "muallim",
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
    // The catalogue spells his name with a hyphen, but readers search the
    // unhyphenated and shortened forms they heard.
    searchAliases: ["Albanna", "Al Banna", "Banna", "Mahmoud Banna", "البنا"],
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
    country: "Iran",
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
    country: "UAE",
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
    country: "Jordan",
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
    country: "Algeria",
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
    country: "UAE",
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
    id: "abdulbar_althubaity",
    name: "عبدالبارئ الثبيتي",
    nameEn: "Abdul Bara Al-Thubaiti",
    nameFr: "Abdul Bara Al-Thubaiti",
    style: "murattal",
    cdn: "https://server6.mp3quran.net/thubti/",
    cdnType: "mp3quran-surah",
    audioMode: "surah",
    country: "KSA",
    source: "mp3quran",
  },
  {
    id: "saad_almoqren",
    name: "سعد المقرن",
    nameEn: "Saad Al-Meqren",
    nameFr: "Saad Al-Meqren",
    style: "murattal",
    cdn: "https://server16.mp3quran.net/saad/Rewayat-Hafs-A-n-Assem/",
    cdnType: "mp3quran-surah",
    audioMode: "surah",
    country: "KSA",
    source: "mp3quran",
  },
  {
    id: "adel_al_kalbani",
    name: "عادل الكلباني",
    nameEn: "Adel Al-Kalbani",
    nameFr: "Adel Al-Kalbani",
    style: "murattal",
    // No approved provider publishes him verse by verse, so he streams whole
    // surahs from MP3Quran and the reader cannot follow along ayah per ayah.
    searchAliases: ["Kalbani", "Kalbanni", "Al Kalbani", "Adel Kalbani", "الكلباني"],
    cdn: "https://server8.mp3quran.net/a_klb/",
    cdnType: "mp3quran-surah",
    audioMode: "surah",
    country: "KSA",
    source: "mp3quran",
  },
  {
    id: "ali_hajjaj_alsoaesi",
    name: "علي حجاج السويسي",
    nameEn: "Ali Hajjaj Al-Souaessi",
    nameFr: "Ali Hajjaj Al-Souaessi",
    style: "murattal",
    cdn: "Ali_Hajjaj_AlSuesy_128kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    country: "Egypt",
    source: "everyayah",
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
      cdn: "Alafasy/mp3/",
      cdnType: "quran-cdn",
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
      country: "Egypt",
    },
    {
      id: "ar.abdulbasitmujawwad",
      name: "عبد الباسط عبد الصمد (مجود)",
      nameEn: "Abdul Basit (Mujawwad)",
      nameFr: "Abdul Basit (Mujawwad)",
      style: "mujawwad",
      cdn: "Abdul_Basit_Mujawwad_128kbps",
      cdnType: "everyayah",
      country: "Egypt",
    },
    {
      id: "ar.husary",
      name: "محمود خليل الحصري",
      nameEn: "Mahmoud Khalil Al-Husary",
      nameFr: "Mahmoud Khalil Al-Husary",
      style: "murattal",
      cdn: "Husary_128kbps",
      cdnType: "everyayah",
      country: "Egypt",
    },
    {
      id: "ar.minshawi",
      name: "محمد صديق المنشاوي (مرتل)",
      nameEn: "Muhammad Siddiq al-Minshawi",
      nameFr: "Muhammad Siddiq al-Minshawi",
      style: "murattal",
      searchAliases: ["Minshawi", "Minshawy", "Minshawwi", "Menshawi", "Manshawi", "Menchaoui", "المنشاوي"],
      cataloguePriority: 10,
      cdn: "Minshawi/Murattal/mp3/",
      cdnType: "quran-cdn",
      country: "Egypt",
    },
    {
      id: "ar.minshawimujawwad",
      name: "المنشاوي (مجود)",
      nameEn: "Al-Minshawi (Mujawwad)",
      nameFr: "Al-Minshawi (Mujawwad)",
      style: "mujawwad",
      searchAliases: ["Minshawi", "Minshawy", "Minshawwi", "Menshawi", "Manshawi", "Menchaoui", "المنشاوي"],
      cataloguePriority: 11,
      cdn: "Minshawy_Mujawwad_192kbps",
      cdnType: "everyayah",
      country: "Egypt",
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
      country: "KSA",
    },
    {
      id: "abdullaah_basfar",
      name: "عبدالله بصفر",
      nameEn: "Abdullah Basfar",
      nameFr: "Abdullah Basfar",
      style: "murattal",
      cdn: "Abdullah_Basfar_192kbps",
      cdnType: "everyayah",
      country: "KSA",
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
      country: "KSA",
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
      country: "KSA",
    },
    {
      id: "hudhaify",
      name: "علي الحذيفي",
      nameEn: "Ali Al-Hudhaify",
      nameFr: "Ali Al-Hudhaify",
      style: "murattal",
      searchAliases: ["Hudhaifi", "Huthaify", "Houzaifi", "Houdeifi", "الحذيفي"],
      cataloguePriority: 12,
      cdn: "Hudhaify_128kbps",
      cdnType: "everyayah",
      country: "KSA",
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
      searchAliases: ["Muhammad Ayoub", "Mohamed Ayoub", "Ayyub", "Ayoub", "محمد أيوب"],
      cataloguePriority: 13,
      cdn: "Muhammad_Ayyoub_128kbps",
      cdnType: "everyayah",
      country: "KSA",
    },
    {
      id: "muhammad_tablawi",
      name: "محمد الطبلاوي",
      nameEn: "Muhammad Al-Tablawi",
      nameFr: "Muhammad Al-Tablawi",
      style: "murattal",
      cdn: "Mohammad_al_Tablaway_128kbps",
      cdnType: "everyayah",
      country: "Egypt",
    },
    {
      id: "hani_rifai",
      name: "هاني الرفاعي",
      nameEn: "Hani Ar-Rifai",
      nameFr: "Hani Ar-Rifai",
      style: "murattal",
      cdn: "Hani_Rifai_192kbps",
      cdnType: "everyayah",
      country: "KSA",
    },
    {
      id: "fares_abbad",
      name: "فارس عباد",
      nameEn: "Fares Abbad",
      nameFr: "Fares Abbad",
      style: "murattal",
      cdn: "Fares_Abbad_64kbps",
      cdnType: "everyayah",
      country: "Algeria",
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
      country: "Kuwait",
    },
    {
      id: "sahl_yassin",
      name: "سهل ياسين",
      nameEn: "Sahl Yassin",
      nameFr: "Sahl Yassin",
      style: "murattal",
      cdn: "Sahl_Yassin_128kbps",
      cdnType: "everyayah",
      country: "KSA",
    },
    ...SUPPLEMENTAL_HAFS_RECITERS,
  ],
  warsh: [
    {
      id: "warsh_abdulbasit",
      name: "عبد الباسط عبد الصمد (ورش)",
      nameEn: "Abdul Basit (Warsh)",
      nameFr: "Abdul Basit (Warsh)",
      style: "murattal",
      cdn: "262",
      cdnType: "quranpedia",
      country: "Egypt",
      verifiedWarsh: true,
    },
    {
      id: "warsh_hussary",
      name: "محمود خليل الحصري (ورش)",
      nameEn: "Mahmoud Khalil Al-Husary (Warsh)",
      nameFr: "Mahmoud Khalil Al-Husary (Warsh)",
      style: "murattal",
      cdn: "261",
      cdnType: "quranpedia",
      country: "Egypt",
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
      country: "KSA",
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
      id: "warsh_dagous",
      name: "عبد الكريم الدغوش (ورش)",
      nameEn: "Abdelkrim Ad-Dagous (Warsh)",
      nameFr: "Abdelkrim Ad-Dagous (Warsh)",
      style: "murattal",
      cdn: "264",
      cdnType: "quranpedia",
      country: null,
      verifiedWarsh: true,
    },
    {
      id: "warsh_aloyoon_al_koshi",
      name: "العيون الكوشي (ورش)",
      nameEn: "Aloyoon Al-Koshi (Warsh)",
      nameFr: "Aloyoon Al-Koshi (Warsh)",
      style: "murattal",
      cdn: "265",
      cdnType: "quranpedia",
      country: "Morocco",
      verifiedWarsh: true,
    },
    {
      id: "warsh_mohamed_abdulkarim",
      name: "محمد عبد الكريم (ورش)",
      nameEn: "Mohamed Abdul Karim (Warsh)",
      nameFr: "Mohamed Abdelkarim (Warsh)",
      style: "murattal",
      cdn: "267",
      cdnType: "quranpedia",
      country: null,
      verifiedWarsh: true,
    },
    {
      id: "warsh_rachid_belalaya",
      name: "رشيد بلعالية (ورش)",
      nameEn: "Rachid Belalaya (Warsh)",
      nameFr: "Rachid Belalaya (Warsh)",
      style: "murattal",
      cdn: "266",
      cdnType: "quranpedia",
      country: "Algeria",
      verifiedWarsh: true,
    },
  ],
};

export const RECITER_SOURCE_INFO = Object.freeze({
  everyayah: Object.freeze({
    id: "everyayah",
    label: "EveryAyah",
    audioMode: "ayah",
    directDownload: false,
  }),
  "quran-cdn": Object.freeze({
    id: "quran",
    label: "Quran.com",
    audioMode: "ayah",
    directDownload: false,
  }),
  quranpedia: Object.freeze({
    id: "quranpedia",
    label: "QuranPedia",
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
  const cdnType = reciter.cdnType || "everyayah";
  const sourceInfo = RECITER_SOURCE_INFO[cdnType] || RECITER_SOURCE_INFO.everyayah;

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
const WAY2QURAN_IMAGE_BASE = "https://media.way2quran.com/imgs/";
const way2quranPhoto = (path) => `${WAY2QURAN_IMAGE_BASE}${path}`;

// The third-party file each portrait was fetched from. scripts/build-reciter-images.mjs
// turns every entry here into a local 256px WebP under public/images/reciters/ and
// records its provenance in reciterPortraits.js, which is what the UI actually loads.
// A curated URL must identify the same reciter as its attributed profile; the initials
// avatar remains as the fallback when a local file is missing.
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
  // Assabile page 37 « Yassen Al Jazairi » carries this portrait as its own
  // profile image, and mp3quran.net/qari titles the same reciter القارئ ياسين
  // in the Warsh riwaya — the two agree, so the face is attributed, not guessed.
  warsh_yassin: assabilePhoto("al-qari-yassen.png"),
  ahmed_neana: assabilePhoto("ahmed-nuinaa.png"),
  akram_alalaqimy: assabilePhoto("akram-al-aalakmi.png"),
  khalid_abdullaah_qahtani_hafs: assabilePhoto("khaled-al-qahtani.png"),
  nabil_rifai: assabilePhoto("nabil-ar-rifai.png"),
  salah_al_budair: assabilePhoto("salah-al-budair.png"),
  mahmoud_ali_al_banna: assabilePhoto("mahmud-ali-al-banna.png"),
  adel_al_kalbani: assabilePhoto("adel-al-kalbani.png"),
  karim_mansoori: assabilePhoto("karim-mansouri.jpg"),
  muhsin_al_qasim: assabilePhoto("abdulmohsen-al-qasim.png"),
  salaah_bukhatir: assabilePhoto("salah-bukhatir.png"),
  yaser_salamah: assabilePhoto("yasser-salama.jpg"),
  aziz_alili: assabilePhoto("aziz-alili.jpg"),
  abdullah_awwad_al_juhaynee: assabilePhoto("abdullah-awad-al-juhani.png"),
  warsh_abdulbasit: quranPhoto("1/abdelbasset-profile.jpeg"),
  warsh_ibrahim_aldosari:
    "https://storage.googleapis.com/way2quran_storage/imgs/ibrahim-al-dosari.png",
  warsh_hussary: quranPhoto("5/mahmoud-khalil-al-hussary-profile.png"),
  warsh_aloyoon_al_koshi:
    "https://www.assabile.com/media/person/200x256/laayoun-el-kouchi.png",
  abdulbar_althubaity: assabilePhoto("abdul-bari-ath-thobaity.png"),
  ali_hajjaj_alsoaesi: assabilePhoto("ali-hajjaj-souissi.png"),
  // Assabile hosts this on the page that names the reciter, and the file is a
  // real photograph rather than the name card Assabile uses for the Warsh
  // reciters it has no picture of.
  warsh_mohamed_abdulkarim: assabilePhoto("muhammad-abdulkareem.png"),
  // Way2Quran keeps the only verifiable portraits of these two: the reciter page
  // names him in the h1 and embeds this exact file. Assabile has no photograph of
  // either man — it serves a grey name card — and Quran.com does not cover Maghribi
  // Warsh reciters, so this is the sourced face rather than a guess.
  saad_almoqren: way2quranPhoto("saad-almqren.jpg"),
  warsh_rachid_belalaya: way2quranPhoto("rasheed-bel-alia.jpg"),
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
  nabil_rifai: assabileProfile("/nabil-ar-rifai-36/nabil-ar-rifai.htm"),
  salah_al_budair: assabileProfile("/salah-al-budair-17/salah-al-budair.htm"),
  mahmoud_ali_al_banna: assabileProfile("/mahmoud-ali-al-banna-25/mahmoud-ali-al-banna.htm"),
  karim_mansoori: assabileProfile("/karim-mansouri-397/karim-mansouri.htm"),
  muhsin_al_qasim: assabileProfile("/abdulmohsen-al-qasim-45/abdulmohsen-al-qasim.htm"),
  salaah_bukhatir: assabileProfile("/salah-bukhatir-23/salah-bukhatir.htm"),
  yaser_salamah: assabileProfile("/yasser-salama-314/yasser-salama.htm"),
  aziz_alili: assabileProfile("/aziz-alili-507/aziz-alili.htm"),
  abdullah_awwad_al_juhaynee: assabileProfile("/abdullah-awad-al-juhani-93/abdullah-awad-al-juhani.htm"),
  abdulbar_althubaity: assabileProfile("/abdul-bari-ath-thobaity-38/abdul-bari-ath-thobaity.htm"),
  adel_al_kalbani: assabileProfile("/adel-al-kalbani-44/adel-al-kalbani.htm"),
  ali_hajjaj_alsoaesi: assabileProfile("/ali-hajjaj-souissi-78/ali-hajjaj-souissi.htm"),
  warsh_aloyoon_al_koshi: assabileProfile("/laayoun-el-kouchi-22/laayoun-el-kouchi.htm"),
  warsh_yassin: assabileProfile("/yassen-al-jazairi-37/yassen-al-jazairi.htm"),
  warsh_mohamed_abdulkarim: assabileProfile("/muhammad-abdulkareem-50/muhammad-abdulkareem.htm"),
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
  warsh_yassin: Object.freeze({
    provider: "Assabile",
    url: "https://www.assabile.com/yassen-al-jazairi-37/yassen-al-jazairi.htm",
  }),
  warsh_mohamed_abdulkarim: Object.freeze({
    provider: "Assabile",
    url: "https://www.assabile.com/muhammad-abdulkareem-50/muhammad-abdulkareem.htm",
  }),
  saad_almoqren: Object.freeze({
    provider: "Way2Quran",
    url: "https://way2quran.com/ar/reciters/saad-almqren",
  }),
  warsh_rachid_belalaya: Object.freeze({
    provider: "Way2Quran",
    url: "https://way2quran.com/ar/reciters/rasheed-bel-alia",
  }),
});

// Fallback discs only: a real photo covers these (see getReciterPhoto). They stay
// inside the manuscript's green/teal/brass family so an avatar never fights the
// mushaf palette, and every entry keeps white initials above AA contrast.
const AVATAR_COLORS = [
  "#0b6235",
  "#0f766e",
  "#166534",
  "#155e75",
  "#3f6212",
  "#7c5a12",
  "#134e4a",
  "#1e4d2b",
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
  Kuwait: Object.freeze({
    fr: "Koweït",
    en: "Kuwait",
    ar: "الكويت",
  }),
  Syria: Object.freeze({
    fr: "Syrie",
    en: "Syria",
    ar: "سوريا",
  }),
  Iran: Object.freeze({
    fr: "Iran",
    en: "Iran",
    ar: "إيران",
  }),
  UAE: Object.freeze({
    fr: "Émirats arabes unis",
    en: "UAE",
    ar: "الإمارات",
  }),
  Jordan: Object.freeze({
    fr: "Jordanie",
    en: "Jordan",
    ar: "الأردن",
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
  const local = RECITER_PORTRAITS[id];
  if (local) return local.src;
  return RECITER_PHOTOS_MAP[id] || null;
}

// Where the face sits inside the remote file. scripts/build-reciter-images.mjs uses
// this to square the source; once the portrait is local the crop is baked in, so the
// UI centres it.
const RECITER_PHOTO_FOCUS = Object.freeze({
  "ar.husary": "50% 30%",
  husary_muallim: "50% 30%",
  husary_mujawwad_hafs: "50% 30%",
  warsh_hussary: "50% 30%",
  abdullaah_matrood: "50% 24%",
});

const focusForSourceUrl = (url) => {
  if (url.includes("/200x256/")) return "50% 22%";
  if (url.includes("/280x219/")) return "50% 28%";
  if (url.includes("static.qurancdn.com")) return "50% 32%";
  return "50% 28%";
};

export function getSourcePhotoFocus(reciterOrId) {
  const id =
    typeof reciterOrId === "string"
      ? reciterOrId
      : String(reciterOrId?.id || "");
  return (
    RECITER_PHOTO_FOCUS[id] || focusForSourceUrl(RECITER_PHOTOS_MAP[id] || "")
  );
}

export function getReciterPhotoFocus(reciterOrId) {
  const id =
    typeof reciterOrId === "string"
      ? reciterOrId
      : String(reciterOrId?.id || "");
  // A local portrait is already squared around the face.
  if (RECITER_PORTRAITS[id]) return "50% 50%";
  return getSourcePhotoFocus(id);
}

// Who hosts the file behind a portrait, derived from the catalogue rather than from
// the generated manifest: the local WebP records this, so rebuilding can never
// inherit an attribution that a later edit to the maps has invalidated.
export function getReciterPortraitSource(reciterOrId) {
  const id =
    typeof reciterOrId === "string"
      ? reciterOrId
      : String(reciterOrId?.id || "");
  const photo = RECITER_PHOTOS_MAP[id];
  if (!photo) return null;
  const explicit = RECITER_PHOTO_SOURCES[id];
  if (explicit) return { provider: explicit.provider, url: explicit.url };
  if (photo.includes("assabile.com")) {
    return {
      provider: "Assabile",
      url: RECITER_PROFILE_SOURCES[id] || "https://www.assabile.com/",
    };
  }
  return { provider: "Quran.com", url: "https://quran.com/reciters" };
}

export function getReciterVisual(reciter) {
  const photo = getReciterPhoto(reciter);
  const attribution = getReciterPortraitSource(reciter?.id);
  return {
    type: photo ? "photo" : "avatar",
    photo,
    focalPoint: getReciterPhotoFocus(reciter),
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
  const cdnType = reciter?.cdnType || "everyayah";
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
  } else if (sourceInfo.cdnType === "quranpedia") {
    if (!/^\d+$/.test(cdn)) errors.push("cdn");
  } else if (
    !cdn ||
    !SAFE_CDN_PATH.test(cdn) ||
    cdn.startsWith("/") ||
    cdn.includes("..") ||
    cdn.includes("//") ||
    (sourceInfo.cdnType === "quran-cdn" && !cdn.endsWith("/"))
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
  if (!["murattal", "mujawwad", "tartil", "muallim"].includes(reciter?.style)) errors.push("style");
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
    reciter.source === "quran"
      ? "Quran.com"
      : reciter.source === "quranpedia"
        ? "QuranPedia"
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

// The audio hub filters the list by these ids, so a style that exists on a
// reciter but has no chip here is unreachable, and a chip with no reciter
// behind it promises a list that is always empty. Both are asserted against
// the catalogue in tests/reciters-audio.test.mjs.
export const RECITER_STYLE_FILTERS = Object.freeze([
  { id: "all", label: { fr: "Tous", en: "All", ar: "الكل" } },
  {
    id: "murattal",
    label: { fr: "Murattal", en: "Murattal", ar: "مرتل" },
    hint: { fr: "posé", en: "measured", ar: "قراءة هادئة" },
  },
  {
    id: "mujawwad",
    label: { fr: "Mujawwad", en: "Mujawwad", ar: "مجود" },
    hint: { fr: "orné", en: "ornamented", ar: "أداء مزخرف" },
  },
  {
    id: "muallim",
    label: { fr: "Muallim", en: "Muallim", ar: "معلم" },
    hint: { fr: "apprentissage", en: "learning", ar: "للتعلّم" },
  },
  { id: "favorites", label: { fr: "Favoris", en: "Favorites", ar: "المفضلة" } },
]);

export function countRecitersByStyle(reciters = []) {
  const counts = { all: reciters.length };
  for (const filter of RECITER_STYLE_FILTERS) {
    if (filter.id === "all" || filter.id === "favorites") continue;
    counts[filter.id] = reciters.filter((r) => r.style === filter.id).length;
  }
  return counts;
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
