// Copy of the welcome page (/). Kept beside the page so the French/English/Arabic
// wording ships with the landing chunk only, not with the app entry.
// Every claim here has a source (docs/design/landing-direction.md, section 11).

const COPY = {
  fr: {
    brandAria: "MushafPlus, accueil",
    langLabel: "Langue",
    folios: ["I", "II", "III", "IV", "V"],
    hero: {
      kicker: "Coran · Invocations · Récitations",
      title: ["Le Coran,", "tel que", "vous le"],
      word: "lisez.",
      lead: "Hafs ou Warsh, 54 récitateurs, la Citadelle du musulman. Gratuit, même hors ligne.",
      start: "Commencer la lecture",
      resume: "Continuer · {surah} v.{ayah}",
      resumePage: "Continuer · page {page}",
      resumeJuz: "Continuer · juz {juz}",
      openApp: "Ouvrir MushafPlus",
      alt: "L’accueil de l’application mobile MushafPlus",
    },
    colophon: ["2 lectures", "54 récitateurs", "267 invocations", "FR · EN · AR"],
    demo: {
      kicker: "Trois entrées",
      title: "Que voulez-vous faire ?",
      pause: "Mettre les démonstrations en pause",
      entries: {
        read: {
          intent: "Je veux lire.",
          text: "Pages de mushaf à cadre doré, ou verset par verset avec traduction et translittération. Votre place est gardée.",
          cta: "Lire le Coran",
        },
        duas: {
          intent: "Je veux invoquer.",
          text: "La Citadelle du musulman : 132 chapitres, 267 invocations, avec leurs sources.",
          cta: "Ouvrir les invocations",
        },
        listen: {
          intent: "Je veux écouter.",
          text: "Choisissez une voix : la sourate entière ou verset par verset, avec le lecteur qui suit.",
          cta: "Écouter",
        },
      },
    },
    themes: {
      kicker: "Application mobile",
      title: "Cinq thèmes dans l’application mobile.",
      text: "Du jour clair à la nuit bleue. Rose de l’aube et Nuit océan sont les deux derniers arrivés.",
      fresh: "Nouveau",
      names: {
        fajr: "Lueur du Fajr",
        parchemin: "Parchemin du Mushaf",
        rose: "Rose de l’aube",
        medine: "Nuit de Médine",
        ocean: "Nuit océan",
      },
      videoAlt: "Choisir un thème dans les réglages de l’application mobile",
      pickerAlt: "Le sélecteur de thèmes dans les réglages de l’application mobile",
    },
    mobile: {
      kicker: "Sur mobile",
      title: "La même lecture, dans la poche.",
      text: "Votre place retrouvée, des radios thématiques, les téléchargements par sourate pour écouter hors connexion.",
      soon: "Bientôt sur Android et iOS",
      android: "Télécharger pour Android",
      ios: "Télécharger pour iOS",
      playerAlt: "Le lecteur audio de l’application mobile",
      radioAlt: "L’onglet Radio de l’application mobile",
    },
    footer: {
      note: "Gratuit, sans compte, sans publicité.",
      links: { about: "À propos", privacy: "Confidentialité", sources: "Sources" },
    },
  },
  en: {
    brandAria: "MushafPlus, home",
    langLabel: "Language",
    folios: ["I", "II", "III", "IV", "V"],
    hero: {
      kicker: "Quran · Supplications · Recitations",
      title: ["The Quran,", "the way"],
      word: "you read it.",
      lead: "Hafs or Warsh, 54 reciters, the Fortress of the Muslim. Free, even offline.",
      start: "Start reading",
      resume: "Continue · {surah} v.{ayah}",
      resumePage: "Continue · page {page}",
      resumeJuz: "Continue · juz {juz}",
      openApp: "Open MushafPlus",
      alt: "The home screen of the MushafPlus mobile app",
    },
    colophon: ["2 readings", "54 reciters", "267 supplications", "FR · EN · AR"],
    demo: {
      kicker: "Three ways in",
      title: "What would you like to do?",
      pause: "Pause the demonstrations",
      entries: {
        read: {
          intent: "I want to read.",
          text: "Mushaf pages with a golden frame, or verse by verse with translation and transliteration. Your place is kept.",
          cta: "Read the Quran",
        },
        duas: {
          intent: "I want to supplicate.",
          text: "The Fortress of the Muslim: 132 chapters, 267 supplications, with their sources.",
          cta: "Open the supplications",
        },
        listen: {
          intent: "I want to listen.",
          text: "Pick a voice: the whole surah or verse by verse, with the player following along.",
          cta: "Listen",
        },
      },
    },
    themes: {
      kicker: "Mobile app",
      title: "Five themes in the mobile app.",
      text: "From bright day to blue night. Dawn Rose and Ocean Night are the two newest.",
      fresh: "New",
      names: {
        fajr: "Fajr Glow",
        parchemin: "Mushaf Parchment",
        rose: "Dawn Rose",
        medine: "Madinah Night",
        ocean: "Ocean Night",
      },
      videoAlt: "Choosing a theme in the settings of the mobile app",
      pickerAlt: "The theme picker in the settings of the mobile app",
    },
    mobile: {
      kicker: "On mobile",
      title: "The same reading, in your pocket.",
      text: "Your place kept, themed radio stations, downloads by surah to listen offline.",
      soon: "Coming soon on Android and iOS",
      android: "Get it for Android",
      ios: "Get it for iOS",
      playerAlt: "The audio player of the mobile app",
      radioAlt: "The Radio tab of the mobile app",
    },
    footer: {
      note: "Free, no account, no ads.",
      links: { about: "About", privacy: "Privacy", sources: "Sources" },
    },
  },
  ar: {
    brandAria: "مصحف بلس، الرئيسية",
    langLabel: "اللغة",
    folios: ["١", "٢", "٣", "٤", "٥"],
    hero: {
      kicker: "القرآن · الأدعية · التلاوات",
      title: ["القرآن،", "كما"],
      word: "تقرؤه أنت.",
      lead: "حفص أو ورش، ٥٤ قارئًا، وحصن المسلم. مجاني، وحتى دون اتصال.",
      start: "ابدأ القراءة",
      resume: "متابعة · {surah} آية {ayah}",
      resumePage: "متابعة · الصفحة {page}",
      resumeJuz: "متابعة · الجزء {juz}",
      openApp: "افتح مصحف بلس",
      alt: "الشاشة الرئيسية لتطبيق مصحف بلس على الجوال",
    },
    colophon: ["روايتان", "٥٤ قارئًا", "٢٦٧ دعاءً", "عربي · فرنسي · إنجليزي"],
    demo: {
      kicker: "ثلاثة مداخل",
      title: "ماذا تريد أن تفعل؟",
      pause: "إيقاف العروض مؤقتًا",
      entries: {
        read: {
          intent: "أريد أن أقرأ.",
          text: "صفحات المصحف بإطار ذهبي، أو آية آية مع الترجمة والنقل الصوتي. مكانك محفوظ.",
          cta: "اقرأ القرآن",
        },
        duas: {
          intent: "أريد أن أدعو.",
          text: "حصن المسلم: ١٣٢ بابًا، ٢٦٧ دعاءً، مع مصادرها.",
          cta: "افتح الأدعية",
        },
        listen: {
          intent: "أريد أن أستمع.",
          text: "اختر صوتًا: السورة كاملة أو آية آية، والمشغّل يتابع معك.",
          cta: "استمع",
        },
      },
    },
    themes: {
      kicker: "تطبيق الجوال",
      title: "خمسة مظاهر في تطبيق الجوال.",
      text: "من النهار الساطع إلى الليل الأزرق. وردة الفجر وليل المحيط أحدث مظهرين.",
      fresh: "جديد",
      names: {
        fajr: "نور الفجر",
        parchemin: "رق المصحف",
        rose: "وردة الفجر",
        medine: "ليل المدينة",
        ocean: "ليل المحيط",
      },
      videoAlt: "اختيار مظهر من إعدادات تطبيق الجوال",
      pickerAlt: "منتقي المظاهر في إعدادات تطبيق الجوال",
    },
    mobile: {
      kicker: "على الجوال",
      title: "القراءة نفسها، في جيبك.",
      text: "مكانك محفوظ، وإذاعات موضوعية، وتنزيل بحسب السورة للاستماع دون اتصال.",
      soon: "قريبًا على أندرويد وآيفون",
      android: "حمّل لأندرويد",
      ios: "حمّل لآيفون",
      playerAlt: "مشغّل الصوت في تطبيق الجوال",
      radioAlt: "تبويب الإذاعة في تطبيق الجوال",
    },
    footer: {
      note: "مجاني، بلا حساب، بلا إعلانات.",
      links: { about: "حول", privacy: "الخصوصية", sources: "المصادر" },
    },
  },
};

export function landingCopy(lang) {
  return COPY[lang] || COPY.fr;
}

export default COPY;
