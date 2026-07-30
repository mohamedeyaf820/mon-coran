import siteConfig from "../../site.config.json";
import { getSurah } from "../data/surahs";

const SITE_URL = `${siteConfig.siteUrl.replace(/\/+$/, "")}/`;
const SOCIAL_IMAGE_URL = new URL("/og-image.jpg", SITE_URL).href;
const OG_LOCALES = { fr: "fr_FR", en: "en_US", ar: "ar_SA" };

const COPY = {
  fr: {
    homeTitle: "Coran en ligne — Lecture, écoute & Tajwid",
    homeDescription:
      "Lisez, écoutez et mémorisez gratuitement le Saint Coran en ligne avec Tajwid, traductions et récitations Hafs et Warsh sur MushafPlus.",
    duasTitle: "Douas en arabe avec traduction",
    duasDescription:
      "Découvrez une sélection de douas en arabe avec traduction française et références.",
    page: "Page",
    juz: "Juz",
    ayah: "verset",
    surahs: "Sourates",
    home: "Accueil",
    legal: {
      privacy: "Confidentialité",
      legal: "Mentions légales",
      sources: "Sources",
    },
  },
  en: {
    homeTitle: "Quran online — Read, listen & learn Tajweed",
    homeDescription:
      "Read, listen to and memorize the Holy Quran online with Tajweed, translations, Hafs and Warsh recitations on MushafPlus.",
    duasTitle: "Duas in Arabic with translation",
    duasDescription:
      "Explore a selection of duas with Arabic text, translation and references.",
    page: "Page",
    juz: "Juz",
    ayah: "verse",
    surahs: "Surahs",
    home: "Home",
    legal: {
      privacy: "Privacy",
      legal: "Legal notice",
      sources: "Sources",
    },
  },
  ar: {
    homeTitle: "القرآن الكريم — قراءة واستماع وأحكام التجويد",
    homeDescription:
      "اقرأ واستمع واحفظ القرآن الكريم عبر الإنترنت مع أحكام التجويد والترجمات وروايتي حفص وورش على MushafPlus.",
    duasTitle: "أدعية بالنص العربي والترجمة",
    duasDescription: "مجموعة من الأدعية بالنص العربي والترجمة والمراجع.",
    page: "صفحة",
    juz: "الجزء",
    ayah: "الآية",
    surahs: "السور",
    home: "الرئيسية",
    legal: {
      privacy: "الخصوصية",
      legal: "إشعار قانوني",
      sources: "المصادر",
    },
  },
};

function localeOf(lang) {
  return Object.prototype.hasOwnProperty.call(COPY, lang)
    ? lang
    : siteConfig.defaultLocale;
}

function surahName(number, lang) {
  const surah = getSurah(Number(number));
  if (!surah) return `Sourate ${number}`;
  return lang === "ar" ? surah.ar : lang === "en" ? surah.en : surah.fr;
}

function statePath(state) {
  if (state.legalPage) return `/${state.legalPage}`;
  if (state.showHome) return "/";
  if (state.showDuas) return "/duas";
  if (state.displayMode === "page") return `/page/${state.currentPage}`;
  if (state.displayMode === "juz") return `/juz/${state.currentJuz}`;
  return Number(state.currentAyah) > 1
    ? `/surah/${state.currentSurah}/${state.currentAyah}`
    : `/surah/${state.currentSurah}`;
}

export function buildSeoMetadata(state = {}) {
  const lang = localeOf(state.lang);
  const copy = COPY[lang];
  const suffix = siteConfig.brandName;
  let title = `${copy.homeTitle} | ${suffix}`;
  let description = copy.homeDescription;
  let kind = "home";

  if (state.legalPage) {
    const label = copy.legal[state.legalPage] || copy.legal.legal;
    title = `${label} | ${suffix}`;
    description = `${label} — ${suffix}`;
    kind = "legal";
  } else if (state.showDuas) {
    title = `${copy.duasTitle} | ${suffix}`;
    description = copy.duasDescription;
    kind = "duas";
  } else if (!state.showHome && state.displayMode === "page") {
    title = `${copy.page} ${state.currentPage} du Saint Coran | ${suffix}`;
    description = `${copy.page} ${state.currentPage} du Saint Coran — lecture et récitation avec ${suffix}.`;
    kind = "page";
  } else if (!state.showHome && state.displayMode === "juz") {
    title = `${copy.juz} ${state.currentJuz} du Saint Coran | ${suffix}`;
    description = `${copy.juz} ${state.currentJuz} du Saint Coran — lecture et récitation avec ${suffix}.`;
    kind = "juz";
  } else if (!state.showHome) {
    const playingSurah = state.isPlaying && state.currentPlayingAyah?.surah;
    const number = playingSurah || state.currentSurah || 1;
    const surah = getSurah(Number(number));
    const name = surahName(number, lang);
    const ayah = playingSurah
      ? state.currentPlayingAyah?.ayah
      : Number(state.currentAyah) > 1
        ? state.currentAyah
        : null;
    const arabicName = surah?.ar ? ` (${surah.ar})` : "";
    title = `${name}${arabicName}${ayah ? ` — ${copy.ayah} ${ayah}` : ""} | ${suffix}`;
    description = `${name}${ayah ? `, ${copy.ayah} ${ayah}` : ""} — texte, traduction, Tajwid et récitation audio.`;
    kind = ayah ? "ayah" : "surah";
  }

  const path = statePath(state);
  const url = new URL(path, SITE_URL).href;
  const indexable = !["ayah", "page", "juz"].includes(kind);
  return {
    lang,
    title,
    description,
    path,
    url,
    kind,
    indexable,
  };
}

function breadcrumbItems(metadata, state, copy) {
  const items = [{ name: copy.home, item: SITE_URL }];
  if (metadata.kind === "surah" || metadata.kind === "ayah") {
    items.push({ name: copy.surahs, item: new URL("/surahs", SITE_URL).href });
    items.push({
      name: surahName(state.currentSurah || 1, metadata.lang),
      item: new URL(`/surah/${state.currentSurah || 1}`, SITE_URL).href,
    });
    if (metadata.kind === "ayah") {
      items.push({
        name: `${copy.ayah} ${state.currentAyah}`,
        item: metadata.url,
      });
    }
  } else if (metadata.kind !== "home") {
    items.push({ name: metadata.title.split("|")[0].trim(), item: metadata.url });
  }
  return items;
}

function buildSchemaGraph(metadata, state) {
  const copy = COPY[metadata.lang];
  const organizationId = `${SITE_URL}#organization`;
  const websiteId = `${SITE_URL}#website`;
  const webpageId = `${metadata.url}#webpage`;
  const graph = [
    {
      "@type": "Organization",
      "@id": organizationId,
      name: siteConfig.brandName,
      url: SITE_URL,
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      name: siteConfig.brandName,
      alternateName: "MushafPlus Quran",
      url: SITE_URL,
      inLanguage: siteConfig.supportedLocales,
      publisher: { "@id": organizationId },
    },
    {
      "@type": "WebPage",
      "@id": webpageId,
      name: metadata.title,
      description: metadata.description,
      url: metadata.url,
      inLanguage: metadata.lang,
      isPartOf: { "@id": websiteId },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: SOCIAL_IMAGE_URL,
        width: 1200,
        height: 630,
      },
    },
  ];

  if (metadata.kind === "home") {
    const appId = `${SITE_URL}#app`;
    graph.push({
      "@type": "SoftwareApplication",
      "@id": appId,
      name: siteConfig.brandName,
      url: SITE_URL,
      applicationCategory: "EducationApplication",
      operatingSystem: "Any",
      isAccessibleForFree: true,
      inLanguage: siteConfig.supportedLocales,
      description:
        "Application de lecture du Coran avec récitations audio, Tajwid, traductions et mémorisation.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EUR",
      },
    });
    graph.find((node) => node["@id"] === webpageId).about = { "@id": appId };
  }

  const breadcrumbs = breadcrumbItems(metadata, state, copy);
  if (breadcrumbs.length > 1) {
    const breadcrumbId = `${metadata.url}#breadcrumb`;
    graph.push({
      "@type": "BreadcrumbList",
      "@id": breadcrumbId,
      itemListElement: breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.item,
      })),
    });
    graph.find((node) => node["@id"] === webpageId).breadcrumb = {
      "@id": breadcrumbId,
    };
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([name, value]) =>
    element.setAttribute(name, value),
  );
}

export function updateSeoMetadata(state = {}) {
  if (typeof document === "undefined") return;
  const metadata = buildSeoMetadata(state);
  document.title = metadata.title;
  document.documentElement.lang = metadata.lang;
  document.documentElement.dir = metadata.lang === "ar" ? "rtl" : "ltr";

  upsertMeta('meta[name="description"]', {
    name: "description",
    content: metadata.description,
  });
  upsertMeta('meta[name="robots"]', {
    name: "robots",
    content: metadata.indexable ? "index,follow" : "noindex,follow",
  });
  upsertMeta('meta[property="og:title"]', {
    property: "og:title",
    content: metadata.title,
  });
  upsertMeta('meta[property="og:description"]', {
    property: "og:description",
    content: metadata.description,
  });
  upsertMeta('meta[property="og:url"]', {
    property: "og:url",
    content: metadata.url,
  });
  upsertMeta('meta[property="og:locale"]', {
    property: "og:locale",
    content: OG_LOCALES[metadata.lang] || OG_LOCALES.fr,
  });
  upsertMeta('meta[property="og:image"]', {
    property: "og:image",
    content: SOCIAL_IMAGE_URL,
  });
  upsertMeta('meta[name="twitter:title"]', {
    name: "twitter:title",
    content: metadata.title,
  });
  upsertMeta('meta[name="twitter:description"]', {
    name: "twitter:description",
    content: metadata.description,
  });
  upsertMeta('meta[name="twitter:image"]', {
    name: "twitter:image",
    content: SOCIAL_IMAGE_URL,
  });

  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = metadata.url;

  let schema = document.head.querySelector(
    'script[type="application/ld+json"]',
  );
  if (!schema) {
    schema = document.createElement("script");
    schema.type = "application/ld+json";
    document.head.appendChild(schema);
  }
  schema.textContent = JSON.stringify(buildSchemaGraph(metadata, state));
}
