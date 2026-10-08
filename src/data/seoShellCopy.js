// Text of the crawlable shell (the HTML a search engine or a no-JS reader gets
// before React mounts), in the three reading languages. Used by
// scripts/generate-seo-pages.mjs only; the running app has its own i18n.
// Plain ESM with no imports so Node can load it.

const KIND = {
  fr: { Meccan: "mecquoise", Medinan: "médinoise" },
  en: { Meccan: "Meccan", Medinan: "Medinan" },
  ar: { Meccan: "مكية", Medinan: "مدنية" },
};

export const SHELL = {
  fr: {
    breadcrumb: "Fil d’Ariane",
    homeHeading: "Le Saint Coran en ligne : lire, écouter et comprendre",
    homeIntro:
      "MushafPlus est une application gratuite pour lire le Saint Coran en arabe, en riwaya Hafs ou Warsh, avec les règles de Tajwid, des traductions et des récitations audio de plusieurs récitateurs. Vos favoris, notes et préférences restent sur votre appareil.",
    allSurahs: "Les 114 sourates",
    neighbours: "Sourates proches",
    adjacent: "Sourates adjacentes",
    openApp: "Ouvrir MushafPlus",
    info: "Informations",
    duasLink: "Douas avec traduction",
    surahWord: (surah) => `Sourate ${surah.en}`,
    surahLink: (surah) => `${surah.n}. ${surah.en} — ${surah.fr}`,
    previous: (surah) => `← Sourate ${surah.en}`,
    next: (surah) => `Sourate ${surah.en} →`,
    facts: (surah) =>
      `La sourate ${surah.n} du Coran, ${surah.en} (${surah.ar}), est une sourate ${KIND.fr[surah.type]}. Elle compte ${surah.ayahs} versets dans le décompte de la riwaya Hafs et commence à la page ${surah.page} du Mushaf de 604 pages. MushafPlus la propose en lecture avec le texte arabe, une traduction et les règles de Tajwid, ainsi qu’en récitation audio en Hafs ou en Warsh.`,
    sourceLine: (hub) => `${hub.bookSource}. ${hub.translationNote}`,
  },
  en: {
    breadcrumb: "Breadcrumb",
    homeHeading: "The Holy Quran online: read, listen and understand",
    homeIntro:
      "MushafPlus is a free app for reading the Holy Quran in Arabic, in the Hafs or Warsh riwaya, with Tajweed rules, translations and audio recitations by several reciters. Your favourites, notes and preferences stay on your device.",
    allSurahs: "The 114 surahs",
    neighbours: "Nearby surahs",
    adjacent: "Adjacent surahs",
    openApp: "Open MushafPlus",
    info: "Information",
    duasLink: "Duas with translation",
    surahWord: (surah) => `Surah ${surah.en}`,
    surahLink: (surah) => `${surah.n}. ${surah.en} (${surah.ar})`,
    previous: (surah) => `← Surah ${surah.en}`,
    next: (surah) => `Surah ${surah.en} →`,
    facts: (surah) =>
      `Surah ${surah.n} of the Quran, ${surah.en} (${surah.ar}), is a ${KIND.en[surah.type]} surah. It has ${surah.ayahs} verses in the Hafs count and begins on page ${surah.page} of the 604-page Mushaf. MushafPlus offers it for reading with the Arabic text, a translation and Tajweed rules, as well as audio recitation in Hafs or Warsh.`,
    sourceLine: (hub) => `${hub.bookSource}. ${hub.translationNote}`,
  },
  ar: {
    breadcrumb: "مسار التنقل",
    homeHeading: "القرآن الكريم عبر الإنترنت: اقرأ واستمع وتدبّر",
    homeIntro:
      "MushafPlus تطبيق مجاني لقراءة القرآن الكريم بالعربية بروايتي حفص وورش، مع أحكام التجويد والترجمات وتلاوات صوتية لعدد من القرّاء. تبقى مفضلاتك وملاحظاتك وتفضيلاتك على جهازك.",
    allSurahs: "السور الـ 114",
    neighbours: "سور قريبة",
    adjacent: "السور المجاورة",
    openApp: "افتح MushafPlus",
    info: "معلومات",
    duasLink: "أدعية مترجمة",
    surahWord: (surah) => `سورة ${surah.ar}`,
    surahLink: (surah) => `${surah.n}. ${surah.ar}`,
    previous: (surah) => `→ سورة ${surah.ar}`,
    next: (surah) => `سورة ${surah.ar} ←`,
    facts: (surah) =>
      `السورة رقم ${surah.n} في المصحف هي ${surah.ar} (${surah.en})، وهي سورة ${KIND.ar[surah.type]}. عدد آياتها ${surah.ayahs} في رواية حفص، وتبدأ من الصفحة ${surah.page} من المصحف المكوّن من 604 صفحات. يقدّمها MushafPlus للقراءة بالنص العربي والترجمة وأحكام التجويد، مع تلاوة صوتية بروايتي حفص وورش.`,
    sourceLine: (hub) => `${hub.bookSource}. ${hub.translationNote}`,
  },
};
