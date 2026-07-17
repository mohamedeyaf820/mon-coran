import siteConfig from "../../site.config.json";
import { getSurah } from "../data/surahs";

const COPY = {
  fr: {
    homeTitle: "Le Saint Coran avec MushafPlus",
    homeDescription:
      "Lisez, écoutez et mémorisez le Saint Coran avec Tajwid, traductions et récitations Hafs et Warsh.",
    duasTitle: "Douas",
    duasDescription: "Découvrez une sélection de douas avec texte arabe et traduction.",
    page: "Page",
    juz: "Juz",
    ayah: "verset",
    legal: { privacy: "Confidentialité", legal: "Mentions légales", sources: "Sources" },
  },
  en: {
    homeTitle: "The Holy Quran with MushafPlus",
    homeDescription:
      "Read, listen to and memorize the Holy Quran with Tajweed, translations, Hafs and Warsh recitations.",
    duasTitle: "Duas",
    duasDescription: "Explore a selection of duas with Arabic text and translation.",
    page: "Page",
    juz: "Juz",
    ayah: "verse",
    legal: { privacy: "Privacy", legal: "Legal notice", sources: "Sources" },
  },
  ar: {
    homeTitle: "القرآن الكريم مع MushafPlus",
    homeDescription:
      "اقرأ واستمع واحفظ القرآن الكريم مع أحكام التجويد والترجمات وروايتي حفص وورش.",
    duasTitle: "الأدعية",
    duasDescription: "مجموعة من الأدعية بالنص العربي والترجمة.",
    page: "صفحة",
    juz: "الجزء",
    ayah: "الآية",
    legal: { privacy: "الخصوصية", legal: "إشعار قانوني", sources: "المصادر" },
  },
};

function localeOf(lang) {
  return Object.prototype.hasOwnProperty.call(COPY, lang) ? lang : siteConfig.defaultLocale;
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
  let title = `${copy.homeTitle} · ${suffix}`;
  let description = copy.homeDescription;

  if (state.legalPage) {
    const label = copy.legal[state.legalPage] || copy.legal.legal;
    title = `${label} · ${suffix}`;
    description = `${label} — ${suffix}`;
  } else if (state.showDuas) {
    title = `${copy.duasTitle} · ${suffix}`;
    description = copy.duasDescription;
  } else if (!state.showHome && state.displayMode === "page") {
    title = `${copy.page} ${state.currentPage} · ${suffix}`;
    description = `${copy.page} ${state.currentPage} du Saint Coran — lecture et récitation avec ${suffix}.`;
  } else if (!state.showHome && state.displayMode === "juz") {
    title = `${copy.juz} ${state.currentJuz} · ${suffix}`;
    description = `${copy.juz} ${state.currentJuz} du Saint Coran — lecture et récitation avec ${suffix}.`;
  } else if (!state.showHome) {
    const playingSurah = state.isPlaying && state.currentPlayingAyah?.surah;
    const number = playingSurah || state.currentSurah || 1;
    const name = surahName(number, lang);
    const ayah = playingSurah
      ? state.currentPlayingAyah?.ayah
      : Number(state.currentAyah) > 1
        ? state.currentAyah
        : null;
    title = `${name}${ayah ? ` — ${copy.ayah} ${ayah}` : ""} · ${suffix}`;
    description = `${name}${ayah ? `, ${copy.ayah} ${ayah}` : ""} — texte, traduction, Tajwid et récitation audio.`;
  }

  const path = statePath(state);
  const url = new URL(path, siteConfig.siteUrl).href;
  return { lang, title, description, path, url };
}

function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
}

export function updateSeoMetadata(state = {}) {
  if (typeof document === "undefined") return;
  const metadata = buildSeoMetadata(state);
  document.title = metadata.title;
  document.documentElement.lang = metadata.lang;
  document.documentElement.dir = metadata.lang === "ar" ? "rtl" : "ltr";

  upsertMeta('meta[name="description"]', { name: "description", content: metadata.description });
  upsertMeta('meta[property="og:title"]', { property: "og:title", content: metadata.title });
  upsertMeta('meta[property="og:description"]', {
    property: "og:description",
    content: metadata.description,
  });
  upsertMeta('meta[property="og:url"]', { property: "og:url", content: metadata.url });
  upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: metadata.title });
  upsertMeta('meta[name="twitter:description"]', {
    name: "twitter:description",
    content: metadata.description,
  });

  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = metadata.url;

  const schema = document.head.querySelector('script[type="application/ld+json"]');
  if (schema) {
    schema.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: metadata.title,
      description: metadata.description,
      url: metadata.url,
      inLanguage: metadata.lang,
      isPartOf: {
        "@type": "WebSite",
        name: siteConfig.brandName,
        url: siteConfig.siteUrl,
      },
    });
  }
}
