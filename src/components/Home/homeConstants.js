import SURAHS from "../../data/surahs";

/* ─── Pagination / layout ─────────────────────────────────────────────────── */
export const HOME_INITIAL_SURAHS     = 36;
export const HOME_INITIAL_SURAHS_LOW = 18;
export const HOME_SURAHS_BATCH       = 24;

export const HOME_DEFERRED_SECTION_STYLE = {
  contentVisibility: "auto",
  containIntrinsicSize: "1px 360px",
};
export const HOME_FOOTER_SECTION_STYLE = {
  contentVisibility: "auto",
  containIntrinsicSize: "1px 280px",
};

/* ─── Accès rapide ────────────────────────────────────────────────────────── */
export const QUICK_ACCESS = [
  { n: 1,   icon: "fa-mosque",         label_fr: "Al-Fatiha",  label_en: "The Opening"  },
  { n: 18,  icon: "fa-mountain-sun",   label_fr: "Al-Kahf",    label_en: "The Cave"     },
  { n: 36,  icon: "fa-star-and-crescent", label_fr: "Ya-Sin",  label_en: "Ya-Sin"       },
  { n: 55,  icon: "fa-leaf",           label_fr: "Ar-Rahman",  label_en: "The Merciful" },
  { n: 67,  icon: "fa-moon",           label_fr: "Al-Mulk",    label_en: "Sovereignty"  },
  { n: 112, icon: "fa-infinity",       label_fr: "Al-Ikhlas",  label_en: "Sincerity"    },
  { n: 113, icon: "fa-sun",            label_fr: "Al-Falaq",   label_en: "The Dawn"     },
  { n: 114, icon: "fa-shield-halved",  label_fr: "An-Nas",     label_en: "Mankind"      },
];

/* ─── Significations anglaises des sourates ──────────────────────────────── */
export const SURAH_EN_MEANINGS = {
  1:   "The Opening",
  2:   "The Cow",
  3:   "Family of Imran",
  4:   "The Women",
  5:   "The Table Spread",
  6:   "The Cattle",
  7:   "The Heights",
  8:   "The Spoils of War",
  9:   "The Repentance",
  10:  "Jonah",
  11:  "Hud",
  12:  "Joseph",
  13:  "The Thunder",
  14:  "Abraham",
  15:  "The Rocky Tract",
  16:  "The Bee",
  17:  "The Night Journey",
  18:  "The Cave",
  19:  "Mary",
  20:  "Ta Ha",
  21:  "The Prophets",
  22:  "The Pilgrimage",
  23:  "The Believers",
  24:  "The Light",
  25:  "The Criterion",
  26:  "The Poets",
  27:  "The Ant",
  28:  "The Stories",
  29:  "The Spider",
  30:  "The Romans",
  31:  "Luqman",
  32:  "The Prostration",
  33:  "The Confederates",
  34:  "Sheba",
  35:  "Originator",
  36:  "Ya Sin",
  37:  "Those Who Set the Ranks",
  38:  "Sad",
  39:  "The Groups",
  40:  "The Forgiver",
  41:  "Explained in Detail",
  42:  "Consultation",
  43:  "Gold Adornments",
  44:  "The Smoke",
  45:  "The Kneeling",
  46:  "The Dunes",
  47:  "Muhammad",
  48:  "The Victory",
  49:  "The Rooms",
  50:  "Qaf",
  51:  "The Winnowing Winds",
  52:  "The Mount",
  53:  "The Star",
  54:  "The Moon",
  55:  "The Most Merciful",
  56:  "The Inevitable",
  57:  "The Iron",
  58:  "The Pleading Woman",
  59:  "The Exile",
  60:  "She That Is To Be Examined",
  61:  "The Ranks",
  62:  "The Congregation",
  63:  "The Hypocrites",
  64:  "Mutual Disillusion",
  65:  "Divorce",
  66:  "The Prohibition",
  67:  "The Sovereignty",
  68:  "The Pen",
  69:  "The Reality",
  70:  "The Ascending Stairways",
  71:  "Noah",
  72:  "The Jinn",
  73:  "The Enshrouded One",
  74:  "The Cloaked One",
  75:  "The Resurrection",
  76:  "Man",
  77:  "Those Sent Forth",
  78:  "The Great News",
  79:  "Those Who Drag Forth",
  80:  "He Frowned",
  81:  "The Overthrowing",
  82:  "The Cleaving",
  83:  "Defrauding",
  84:  "The Splitting Open",
  85:  "The Mansions of the Stars",
  86:  "The Morning Star",
  87:  "The Most High",
  88:  "The Overwhelming",
  89:  "The Dawn",
  90:  "The City",
  91:  "The Sun",
  92:  "The Night",
  93:  "The Morning Hours",
  94:  "The Relief",
  95:  "The Fig",
  96:  "The Clot",
  97:  "The Power",
  98:  "The Clear Proof",
  99:  "The Earthquake",
  100: "The Courser",
  101: "The Calamity",
  102: "Rivalry in World Increase",
  103: "The Declining Day",
  104: "The Traducer",
  105: "The Elephant",
  106: "Quraysh",
  107: "Small Kindnesses",
  108: "Abundance",
  109: "The Disbelievers",
  110: "Divine Support",
  111: "The Palm Fiber",
  112: "Sincerity",
  113: "The Daybreak",
  114: "Mankind",
};

/* ─── Index de recherche (calculé une seule fois au chargement du module) ─── */
export const SURAH_SEARCH_INDEX = SURAHS.map((surah) => ({
  surah,
  number:  String(surah.n),
  ar:      String(surah.ar || ""),
  enLower: String(surah.en || "").toLowerCase(),
  frLower: String(surah.fr || "").toLowerCase(),
}));

/* ─── Versets du jour — cycle de 30 jours ────────────────────────────────── */
export const DAILY_VERSES = [
  {
    text:     "إن مع العسر يسرا",
    ref:      "Al-Inshirah  94:6",
    trans_fr: "Certes, avec la difficulté vient la facilité",
  },
  {
    text:     "ومن يتق الله يجعل له مخرجا",
    ref:      "At-Talaq  65:2",
    trans_fr: "Qui craint Allah, Il lui accordera une issue",
  },
  {
    text:     "ألا بذكر الله تطمئن القلوب",
    ref:      "Ar-Ra'd  13:28",
    trans_fr: "C'est par le rappel d'Allah que les coeurs trouvent la quiétude",
  },
  {
    text:     "إن الله مع الصابرين",
    ref:      "Al-Baqara  2:153",
    trans_fr: "Certes, Allah est avec ceux qui endurent",
  },
  {
    text:     "إن الله لطيف بعباده",
    ref:      "Ash-Shura  42:19",
    trans_fr: "Allah est plein de mansuétude envers Ses serviteurs",
  },
  {
    text:     "قل هو الله أحد",
    ref:      "Al-Ikhlas  112:1",
    trans_fr: "Dis : Il est Allah, Unique",
  },
];

/* ─── Type de sourate ─────────────────────────────────────────────────────── */
export const TYPE_INFO = {
  Meccan:  { fr: "Mecquoise", en: "Meccan",  ar: "مكية"  },
  Medinan: { fr: "Medinoise", en: "Medinan", ar: "مدنية" },
};

/* ─── Articles de blog (données de démonstration) ────────────────────────── */
export const MOCK_BLOG_POSTS = [
  {
    id:       1,
    tag:      "Reflections",
    title:    "Les bienfaits spirituels de la lecture quotidienne du Coran",
    date:     "30 Mars 2026",
    readTime: "5 min",
    img:      "/quran_reflection_blog_thumb_1774927526673.png",
  },
  {
    id:       2,
    tag:      "Apprentissage",
    title:    "Guide pratique : Perfectionner son Tajwid en 5 étapes",
    date:     "28 Mars 2026",
    readTime: "8 min",
    img:      "/tajweed_learning_blog_thumb_1774927566373.png",
  },
  {
    id:       3,
    tag:      "Conseils",
    title:    "Mémoriser le Coran : Stratégies pour une rétention durable",
    date:     "25 Mars 2026",
    readTime: "6 min",
    img:      "/hifz_tips_blog_thumb_1774927620229.png",
  },
];

/* ─── Photos des récitateurs ─────────────────────────────────────────────── */
export const RECITER_PHOTOS = {
  "ar.alafasy":            "https://static.quran.com/images/reciters/7/mishary-rashid-alafasy.png",
  "ar.abdulbasitmurattal": "https://static.quran.com/images/reciters/1/abdul-basit.png",
  "ar.abdulbasitmujawwad": "https://static.quran.com/images/reciters/1/abdul-basit.png",
  "ar.husary":             "https://static.quran.com/images/reciters/10/mahmoud-khalil-al-husary.png",
  "ar.minshawi":           "https://static.quran.com/images/reciters/12/muhammad-siddiq-al-minshawi.png",
  "ar.minshawimujawwad":   "https://static.quran.com/images/reciters/12/muhammad-siddiq-al-minshawi.png",
  "ar.saoodshuraym":       "https://static.quran.com/images/reciters/8/saud-ash-shuraym.png",
  "ar.abdurrahmaansudais": "https://static.quran.com/images/reciters/3/abdur-rahman-as-sudais.png",
  "ahmed_ajmy":            "https://static.quran.com/images/reciters/5/ahmed-al-ajamy.png",
  "maher_almuaiqly":       "https://static.quran.com/images/reciters/11/maher-al-muaiqly.png",
  "yasser_dossari_hafs":   "https://static.quran.com/images/reciters/14/yasser-ad-dussary.png",
  "nasser_alqatami":       "https://static.quran.com/images/reciters/13/nasser-al-qatami.png",
  "ali_jabir":             "https://static.quran.com/images/reciters/2/ali-jaber.png",
  "hudhaify":              "https://static.quran.com/images/reciters/4/ali-al-hudhaify.png",
  "muhammad_ayyoub":       "https://static.quran.com/images/reciters/9/muhammad-ayyoub.png",
  "fares_abbad":           "https://static.quran.com/images/reciters/6/fares-abbad.png",
};

/* ─── Fonctions utilitaires ──────────────────────────────────────────────── */

/** Normalise les apostrophes et espaces dans un nom de sourate latin. */
export function normalizeLatinSurahName(name = "") {
  return String(name).replace(/['`´]/g, "'").replace(/\s+/g, " ").trim();
}

/** Retourne la signification anglaise d'une sourate. */
export function getSurahEnglishMeaning(surahNumber) {
  return SURAH_EN_MEANINGS[surahNumber] || "Surah";
}

/** Retourne l'index du verset selon le jour de l'année (change à minuit). */
export function getDailyVerseIndex(date = new Date()) {
  const start     = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date - start) / 86400000);
  return dayOfYear % DAILY_VERSES.length;
}

/** Retourne la photo d'un récitateur, avec fallback avatar. */
export function getReciterPhoto(id) {
  if (RECITER_PHOTOS[id]) return RECITER_PHOTOS[id];
  return `https://ui-avatars.com/api/?name=${id}&background=105a30&color=fff&size=128&bold=true`;
}

/**
 * Suggestions contextuelles selon l'heure / le jour de la semaine.
 * @param {Date} date
 */
export function getSuggestedSurahs(date = new Date()) {
  const h   = date.getHours();
  const day = date.getDay(); // 0=Dim, 5=Ven

  if (day === 5)
    return {
      period: { fr: "Sunna du vendredi", en: "Friday Sunnah", ar: "سنة الجمعة" },
      icon:   "fa-star-and-crescent",
      surahs: [
        { n: 18,  fr: "Sunna du vendredi",  en: "Friday Sunnah",   ar: "سنة الجمعة"   },
        { n: 1,   fr: "L'Ouverture",        en: "The Opening",      ar: "الفاتحة"      },
        { n: 36,  fr: "Coeur du Coran",     en: "Heart of Quran",   ar: "قلب القرآن"   },
        { n: 55,  fr: "Ar-Rahman",          en: "The Merciful",     ar: "الرحمن"       },
        { n: 67,  fr: "Al-Mulk",            en: "Sovereignty",      ar: "الملك"        },
      ],
    };

  if (h >= 4 && h < 12)
    return {
      period: { fr: "Lecture du matin", en: "Morning Reading", ar: "ورد الصباح" },
      icon:   "fa-sun",
      surahs: [
        { n: 1,   fr: "L'Ouverture",        en: "The Opening",      ar: "الفاتحة"      },
        { n: 112, fr: "Sincerite pure",      en: "Pure Sincerity",   ar: "الإخلاص"     },
        { n: 113, fr: "Protection de l'aube", en: "Dawn Guard",      ar: "الفلق"       },
        { n: 114, fr: "Protection du mal",   en: "Against Evil",     ar: "الناس"        },
        { n: 36,  fr: "Coeur du Coran",      en: "Heart of Quran",   ar: "قلب القرآن"  },
      ],
    };

  if (h >= 12 && h < 17)
    return {
      period: { fr: "Lecture du midi", en: "Midday Reading", ar: "قراءة الظهر" },
      icon:   "fa-cloud-sun",
      surahs: [
        { n: 55, fr: "Ar-Rahman - La Grace", en: "Ar-Rahman - Grace", ar: "الرحمن"    },
        { n: 25, fr: "Le Critere",            en: "The Criterion",     ar: "الفرقان"   },
        { n: 18, fr: "Al-Kahf",              en: "The Cave",           ar: "الكهف"     },
        { n: 56, fr: "L'Evenement",          en: "The Event",          ar: "الواقعة"   },
        { n: 2,  fr: "Al-Baqara",            en: "The Cow",            ar: "البقرة"    },
      ],
    };

  if (h >= 17 && h < 21)
    return {
      period: { fr: "Lecture du soir", en: "Evening Reading", ar: "ورد المساء" },
      icon:   "fa-cloud-moon",
      surahs: [
        { n: 36,  fr: "Coeur du Coran",  en: "Heart of Quran",      ar: "قلب القرآن" },
        { n: 67,  fr: "Rappel du soir",  en: "Evening Reminder",    ar: "الملك"      },
        { n: 55,  fr: "Ar-Rahman",       en: "The Merciful",        ar: "الرحمن"     },
        { n: 59,  fr: "Al-Hashr",        en: "The Gathering",       ar: "الحشر"      },
        { n: 103, fr: "Le Temps",        en: "Time",                ar: "العصر"      },
      ],
    };

  return {
    period: { fr: "Lecture de nuit", en: "Night Reading", ar: "ورد الليل" },
    icon:   "fa-moon",
    surahs: [
      { n: 67,  fr: "Al-Mulk - Avant le sommeil", en: "Al-Mulk - Before Sleep", ar: "الملك"   },
      { n: 32,  fr: "As-Sajda",                   en: "The Prostration",         ar: "السجدة"  },
      { n: 36,  fr: "Ya-Sin du soir",             en: "Ya-Sin at Night",         ar: "يس"      },
      { n: 112, fr: "Al-Ikhlas",                  en: "Sincerity",               ar: "الإخلاص" },
      { n: 113, fr: "Al-Falaq",                   en: "The Dawn",                ar: "الفلق"   },
    ],
  };
}
