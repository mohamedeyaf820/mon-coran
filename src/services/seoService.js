import siteConfig from "../../site.config.json";
import { getSurah } from "../data/surahs";
import { COPY, duasCrumbNames, duasRouteSeo, surahSeo } from "../data/seoCopy";
import { parseDuasRoute } from "../components/duas/duasRoute";
import { loadHisn, loadHisnTranslation } from "./hisnService";
import { LOCALES, localizePath } from "../utils/localePath";

const SITE_URL = `${siteConfig.siteUrl.replace(/\/+$/, "")}/`;
const SOCIAL_IMAGE_URL = new URL("/og-image.jpg", SITE_URL).href;
const LOGO_URL = new URL("/logo-512.png", SITE_URL).href;
const OG_LOCALES = { fr: "fr_FR", en: "en_US", ar: "ar_SA" };

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
  if (state.routeNotFound) return "/404";
  if (state.legalPage) return `/${state.legalPage}`;
  if (state.showHome) return "/";
  if (state.showDuas) return `/duas${state.duasRoute || ""}`;
  if (state.showPrayers) return "/prieres";
  if (state.displayMode === "page") return `/page/${state.currentPage}`;
  if (state.displayMode === "juz") return `/juz/${state.currentJuz}`;
  return Number(state.currentAyah) > 1
    ? `/surah/${state.currentSurah}/${state.currentAyah}`
    : `/surah/${state.currentSurah}`;
}

export function buildSeoMetadata(state = {}, extra = {}) {
  const lang = localeOf(state.lang);
  const copy = COPY[lang];
  const suffix = siteConfig.brandName;
  let title = `${copy.homeTitle} | ${suffix}`;
  let description = copy.homeDescription;
  let kind = "home";

  if (state.routeNotFound) {
    title = lang === "fr" ? `Page introuvable | ${suffix}` : lang === "ar" ? `الصفحة غير موجودة | ${suffix}` : `Page not found | ${suffix}`;
    description = lang === "fr" ? "La page demandée n’existe pas." : lang === "ar" ? "الصفحة المطلوبة غير موجودة." : "The requested page does not exist.";
    kind = "not-found";
  } else if (state.legalPage) {
    const label = copy.legal[state.legalPage] || copy.legal.legal;
    title = `${label} | ${suffix}`;
    description =
      copy.legalDescriptions?.[state.legalPage] || `${label} — ${suffix}`;
    kind = "legal";
  } else if (state.showDuas) {
    const { view } = parseDuasRoute(state.duasRoute);
    // A chapter keeps the list's wording until its name has loaded (see
    // updateSeoMetadata); the build prerenders the full title for crawlers.
    const sub = view === "hub" ? null : duasRouteSeo(view === "chapter" && extra.chapterName ? view : view === "chapter" ? "hisn" : view, lang, extra);
    title = `${sub ? sub.title : copy.duasTitle} | ${suffix}`;
    description = sub ? sub.description : copy.duasDescription;
    kind = view === "hub" ? "duas" : `duas-${view}`;
    if (extra.missing) kind = "not-found";
  } else if (state.showPrayers) {
    title = `${copy.prayersTitle} | ${suffix}`;
    description = copy.prayersDescription;
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
    kind = ayah ? "ayah" : "surah";
    if (!ayah && surah) {
      // Same text the build prerenders, so the head does not change after mount.
      const seo = surahSeo(surah, lang);
      title = `${seo.title} | ${suffix}`;
      description = seo.description;
    } else {
      const arabicName = surah?.ar ? ` (${surah.ar})` : "";
      title = `${name}${arabicName}${ayah ? ` — ${copy.ayah} ${ayah}` : ""} | ${suffix}`;
      description = `${name}${ayah ? `, ${copy.ayah} ${ayah}` : ""} — texte, traduction, Tajwid et récitation audio.`;
    }
  }

  const path = statePath(state);
  // Each language has its own address; a not-found address keeps what was typed.
  const url = new URL(kind === "not-found" ? path : localizePath(path, lang), SITE_URL).href;
  const indexable = !["ayah", "page", "juz", "not-found"].includes(kind) && !extra.missing;
  // Same page in every language, only for pages that are indexed.
  const alternates = indexable
    ? [
        ...LOCALES.map((code) => ({ hreflang: code, href: new URL(localizePath(path, code), SITE_URL).href })),
        { hreflang: "x-default", href: new URL(localizePath(path, "fr"), SITE_URL).href },
      ]
    : [];
  return {
    lang,
    title,
    description,
    path,
    url,
    kind,
    indexable,
    alternates,
  };
}

function breadcrumbItems(metadata, state, copy) {
  const at = (path) => new URL(localizePath(path, metadata.lang), SITE_URL).href;
  const items = [{ name: copy.home, item: at("/") }];
  if (metadata.kind === "surah" || metadata.kind === "ayah") {
    items.push({
      name: surahName(state.currentSurah || 1, metadata.lang),
      item: at(`/surah/${state.currentSurah || 1}`),
    });
    if (metadata.kind === "ayah") {
      items.push({
        name: `${copy.ayah} ${state.currentAyah}`,
        item: metadata.url,
      });
    }
  } else if (metadata.kind.startsWith("duas-")) {
    const hub = duasCrumbNames(metadata.lang);
    items.push({ name: hub.hub, item: at("/duas") });
    if (metadata.kind === "duas-chapter") {
      items.push({ name: hub.hisn, item: at("/duas/hisn") });
    }
    items.push({ name: metadata.title.split("|")[0].split(":")[0].trim(), item: metadata.url });
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
      logo: LOGO_URL,
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
      description: copy.appDescription,
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

let seoToken = 0;

export function updateSeoMetadata(state = {}) {
  if (typeof document === "undefined") return;
  const token = ++seoToken;
  applySeoMetadata(buildSeoMetadata(state), state);

  const route = state.showDuas ? parseDuasRoute(state.duasRoute) : null;
  if (route?.view !== "chapter") return;
  const lang = localeOf(state.lang);
  // The chapter name lives in the Hisn data the page loads anyway (same
  // request cache), so the title can name the chapter once it is known.
  Promise.all([loadHisn(), loadHisnTranslation(lang)])
    .then(([library, translation]) => {
      if (token !== seoToken) return;
      const chapter = library.chapterById.get(route.chapterId);
      if (!chapter) {
        applySeoMetadata(buildSeoMetadata(state, { missing: true }), state);
        return;
      }
      const chapterName =
        lang === "ar" ? chapter.ar : translation.chapters?.[chapter.id] || chapter.ar;
      applySeoMetadata(
        buildSeoMetadata(state, { chapterName, itemCount: chapter.items.length }),
        state,
      );
    })
    .catch(() => {});
}

function applySeoMetadata(metadata, state) {
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

  document.head
    .querySelectorAll('link[rel="alternate"][hreflang]')
    .forEach((node) => node.remove());
  metadata.alternates.forEach(({ hreflang, href }) => {
    const link = document.createElement("link");
    link.rel = "alternate";
    link.hreflang = hreflang;
    link.href = href;
    canonical.after(link);
  });
  document.head
    .querySelectorAll('meta[property="og:locale:alternate"]')
    .forEach((node) => node.remove());
  LOCALES.filter((code) => code !== metadata.lang).forEach((code) => {
    const meta = document.createElement("meta");
    meta.setAttribute("property", "og:locale:alternate");
    meta.content = OG_LOCALES[code];
    document.head.appendChild(meta);
  });

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
