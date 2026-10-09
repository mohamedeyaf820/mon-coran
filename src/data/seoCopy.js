// Single source of the search-facing copy. The build (scripts/generate-seo-pages.mjs)
// and the running app (services/seoService.js) both import it: the prerendered
// <title>/<meta description> and the ones React sets after mount must be the same
// text, otherwise Google sees the head change between crawl and render.
// Plain ESM with no JSON or Vite-only imports so Node can load it.

export const COPY = {
  fr: {
    homeTitle: "Coran en ligne — Lecture, écoute & Tajwid",
    homeDescription:
      "Lisez, écoutez et comprenez gratuitement le Saint Coran en ligne avec Tajwid, traductions et récitations Hafs et Warsh sur MushafPlus.",
    duasTitle: "Douas en arabe avec traduction",
    duasDescription:
      "Découvrez une sélection de douas en arabe avec traduction française, références et accès rapide depuis MushafPlus.",
    prayersTitle: "Horaires de prière",
    prayersDescription:
      "Les cinq prières du jour pour votre ville et la prochaine en un coup d’œil. Rappels et suivi facultatifs, conservés sur votre appareil.",
    appDescription:
      "Application de lecture du Coran avec récitations audio, Tajwid, traductions, favoris et notes.",
    page: "Page",
    juz: "Juz",
    ayah: "verset",
    home: "Accueil",
    legal: {
      about: "À propos",
      privacy: "Confidentialité",
      legal: "Mentions légales",
      sources: "Sources",
    },
    legalDescriptions: {
      about: "Responsable du projet, contact, version et politique de correction de MushafPlus.",
      privacy: "Politique de confidentialité et traitement local des données dans MushafPlus.",
      legal: "Mentions légales et informations de publication de MushafPlus.",
      sources: "Sources coraniques, audio, typographiques et techniques utilisées par MushafPlus.",
    },
  },
  en: {
    homeTitle: "Quran online — Read, listen & learn Tajweed",
    homeDescription:
      "Read, listen to and understand the Holy Quran online with Tajweed, translations, Hafs and Warsh recitations on MushafPlus.",
    duasTitle: "Duas in Arabic with translation",
    duasDescription:
      "Explore a selection of duas with Arabic text, translation and references.",
    prayersTitle: "Prayer times",
    prayersDescription:
      "Today’s five prayers for your city and the next one at a glance. Optional reminders and tracking, kept on your device.",
    appDescription:
      "Quran reading app with audio recitations, Tajweed, translations, favourites and notes.",
    page: "Page",
    juz: "Juz",
    ayah: "verse",
    home: "Home",
    legal: {
      about: "About",
      privacy: "Privacy",
      legal: "Legal notice",
      sources: "Sources",
    },
    legalDescriptions: {
      about: "Who runs MushafPlus, how to get in touch, the current version and how corrections are handled.",
      privacy: "Privacy policy and local data handling in MushafPlus.",
      legal: "Legal notice and publication details for MushafPlus.",
      sources: "Quran text, audio, typography and technical sources used by MushafPlus.",
    },
  },
  ar: {
    homeTitle: "القرآن الكريم — قراءة واستماع وأحكام التجويد",
    homeDescription:
      "اقرأ واستمع وتدبّر القرآن الكريم عبر الإنترنت مع أحكام التجويد والترجمات وروايتي حفص وورش على MushafPlus.",
    duasTitle: "أدعية بالنص العربي والترجمة",
    duasDescription: "مجموعة من الأدعية بالنص العربي والترجمة والمراجع.",
    prayersTitle: "مواقيت الصلاة",
    prayersDescription:
      "صلوات اليوم الخمس لمدينتك والصلاة القادمة في لمحة. التذكيرات والمتابعة اختيارية ومحفوظة على جهازك.",
    appDescription:
      "تطبيق لقراءة القرآن الكريم مع التلاوات الصوتية وأحكام التجويد والترجمات والمفضلة والملاحظات.",
    page: "صفحة",
    juz: "الجزء",
    ayah: "الآية",
    home: "الرئيسية",
    legal: {
      about: "حول التطبيق",
      privacy: "الخصوصية",
      legal: "إشعار قانوني",
      sources: "المصادر",
    },
    legalDescriptions: {
      about: "مسؤول المشروع وطرق التواصل والإصدار الحالي وسياسة تصحيح الأخطاء في MushafPlus.",
      privacy: "سياسة الخصوصية والمعالجة المحلية للبيانات في MushafPlus.",
      legal: "الإشعار القانوني ومعلومات النشر الخاصة بـ MushafPlus.",
      sources: "مصادر النص القرآني والصوت والخطوط والمصادر التقنية المستخدمة في MushafPlus.",
    },
  },
};

const REVELATION = {
  fr: { Meccan: "mecquoise", Medinan: "médinoise" },
  en: { Meccan: "Meccan", Medinan: "Medinan" },
  ar: { Meccan: "مكية", Medinan: "مدنية" },
};

/**
 * Title (without brand suffix) and meta description of a surah page.
 * The verse count is the Hafs one, and says so: a few surahs are counted
 * differently in Warsh, and the page must not claim a figure for both.
 */
export function surahSeo(surah, lang = "fr") {
  const locale = Object.prototype.hasOwnProperty.call(COPY, lang) ? lang : "fr";
  const kind = REVELATION[locale][surah.type] || REVELATION[locale].Meccan;
  if (locale === "ar") {
    return {
      title: `سورة ${surah.ar}`,
      description: `سورة ${surah.ar} (${surah.en}) سورة ${kind} عدد آياتها ${surah.ayahs} في رواية حفص. النص العربي والترجمة والتجويد والتلاوة الصوتية بروايتي حفص وورش.`,
    };
  }
  if (locale === "en") {
    return {
      title: `Surah ${surah.en} (${surah.ar})`,
      description: `Surah ${surah.en} (${surah.ar}), a ${kind} surah of ${surah.ayahs} verses (Hafs). Arabic text, translation, Tajweed and audio in Hafs or Warsh.`,
    };
  }
  return {
    title: `Sourate ${surah.en} (${surah.ar}) — ${surah.fr}`,
    description: `Sourate ${surah.en} (${surah.ar}), « ${surah.fr} » : sourate ${kind} de ${surah.ayahs} versets (Hafs). Texte arabe, traduction, Tajwid et audio en Hafs ou Warsh.`,
  };
}

// A long chapter name plus the suffix and the brand overflows the ~65 characters
// a results page shows; the name alone is then the clearer title.
const TITLE_NAME_BUDGET = 52;
const chapterTitle = (name, suffix) =>
  name.length + suffix.length > TITLE_NAME_BUDGET ? name : `${name}${suffix}`;

const DUAS_SEO = {
  fr: {
    hisn: {
      title: "Citadelle du musulman (Hisn al-Muslim) : tous les chapitres",
      description:
        "Les chapitres de la Citadelle du musulman (Hisn al-Muslim) : invocations du quotidien en arabe, avec traduction française et sources (Coran, hadith).",
    },
    quran: {
      title: "Invocations du Coran : douas en arabe avec traduction",
      description:
        "Les invocations tirées des versets du Coran, en arabe avec leur traduction française, la sourate et le verset de chacune.",
    },
    rabbana: {
      title: "Les 40 Rabbana : invocations du Coran en arabe et en français",
      description:
        "Les 40 invocations du Coran qui commencent par « Rabbana » (Notre Seigneur), dans l’ordre du Coran, avec la sourate et le verset de chacune.",
    },
    khatm: {
      title: "Invocation de fin de lecture du Coran (khatm)",
      description:
        "Ce que l’on rapporte sur l’invocation à la fin de la lecture du Coran, et des invocations proposées avec ce que l’on sait de leur source.",
    },
    chapter: (name, count) => ({
      title: chapterTitle(name, " : invocations"),
      description: `${name} : ${count} ${count > 1 ? "invocations" : "invocation"} en arabe avec traduction française et sources, tirées de la Citadelle du musulman (Hisn al-Muslim).`,
    }),
  },
  en: {
    hisn: {
      title: "Fortress of the Muslim (Hisn al-Muslim): all chapters",
      description:
        "The chapters of the Fortress of the Muslim (Hisn al-Muslim): everyday supplications in Arabic with English translation and sources (Quran, hadith).",
    },
    quran: {
      title: "Quranic supplications: duas in Arabic with translation",
      description:
        "Supplications taken from the verses of the Quran, in Arabic with translation, the surah and the verse of each.",
    },
    rabbana: {
      title: "The 40 Rabbana supplications of the Quran",
      description:
        "The 40 supplications of the Quran that begin with “Rabbana” (Our Lord), in Quran order, with the surah and verse of each.",
    },
    khatm: {
      title: "Supplication at the end of reciting the Quran (khatm)",
      description:
        "What is reported about supplicating at the end of the Quran, and supplications offered with what is known of their source.",
    },
    chapter: (name, count) => ({
      title: chapterTitle(name, ": supplications"),
      description: `${name}: ${count} ${count > 1 ? "supplications" : "supplication"} in Arabic with English translation and sources, from the Fortress of the Muslim (Hisn al-Muslim).`,
    }),
  },
  ar: {
    hisn: {
      title: "حصن المسلم: جميع الأبواب",
      description:
        "أبواب حصن المسلم: أدعية وأذكار الحياة اليومية بالنص العربي مع الترجمة والمصادر من القرآن والحديث.",
    },
    quran: {
      title: "أدعية القرآن الكريم بالنص العربي والترجمة",
      description: "الأدعية المأخوذة من آيات القرآن الكريم بالنص العربي والترجمة مع السورة والآية.",
    },
    rabbana: {
      title: "أدعية «ربنا» الأربعون في القرآن الكريم",
      description: "الأدعية الأربعون في القرآن التي تبدأ بـ «ربنا» بترتيب المصحف مع السورة والآية.",
    },
    khatm: {
      title: "دعاء ختم القرآن الكريم",
      description: "ما يُروى في الدعاء عند ختم القرآن، وأدعية مقترحة مع ما يُعرف عن مصدرها.",
    },
    chapter: (name, count) => ({
      title: chapterTitle(name, ": أدعية"),
      description: `${name}: ${count} من الأدعية والأذكار بالنص العربي مع المصادر من حصن المسلم.`,
    }),
  },
};

/**
 * Title (without brand) and description of the invocations sub-pages.
 * `view` is hisn | quran | rabbana | khatm | chapter; a chapter needs its
 * name in the reading language and the number of invocations it holds.
 */
export function duasRouteSeo(view, lang = "fr", { chapterName = "", itemCount = 0 } = {}) {
  const locale = DUAS_SEO[lang] || DUAS_SEO.fr;
  if (view === "chapter") return locale.chapter(chapterName, itemCount);
  return locale[view] || null;
}

// Breadcrumb names of the invocation pages. Kept here (not read from
// i18n/duasHub.js) so the SEO chunk does not drag the whole hub copy along.
const DUAS_CRUMBS = {
  fr: { hub: "Invocations & Adhkar", hisn: "Citadelle du musulman" },
  en: { hub: "Supplications & Adhkar", hisn: "Fortress of the Muslim" },
  ar: { hub: "الأدعية والأذكار", hisn: "حصن المسلم" },
};

export function duasCrumbNames(lang = "fr") {
  return DUAS_CRUMBS[lang] || DUAS_CRUMBS.fr;
}
