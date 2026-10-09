import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import SURAHS from "../src/data/surahs.js";
import { COPY, duasCrumbNames, duasRouteSeo, surahSeo } from "../src/data/seoCopy.js";
import { SHELL } from "../src/data/seoShellCopy.js";
import QURAN_DUAS from "../src/data/duas.js";
import RABBANA_DUAS from "../src/data/rabbanaDuas.js";
import duasHub from "../src/i18n/duasHub.js";
import { LOCALES, localizePath } from "../src/utils/localePath.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// SEO_DIST_DIR lets the output be checked against a scratch build: the generator
// is not idempotent (it fills the empty #root of a fresh vite build).
const distDir = process.env.SEO_DIST_DIR
  ? path.resolve(process.env.SEO_DIST_DIR)
  : path.join(rootDir, "dist");
const siteConfig = JSON.parse(
  await readFile(path.join(rootDir, "site.config.json"), "utf8"),
);
const template = await readFile(path.join(distDir, "index.html"), "utf8");
const siteUrl = new URL(`${siteConfig.siteUrl.replace(/\/+$/, "")}/`);
const socialImageUrl = new URL("/og-image.jpg", siteUrl).href;
const logoUrl = new URL("/logo-512.png", siteUrl).href;
const brand = siteConfig.brandName;

const LOCALE_META = {
  fr: { og: "fr_FR", dir: "ltr" },
  en: { og: "en_US", dir: "ltr" },
  ar: { og: "ar_SA", dir: "rtl" },
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

/** Absolute address of a logical path in one language. */
const canonicalFor = (pathname, lang) => new URL(localizePath(pathname, lang), siteUrl).href;

async function readJson(relativePath) {
  try {
    return JSON.parse(await readFile(path.join(rootDir, relativePath), "utf8"));
  } catch {
    return null;
  }
}

// The Hisn al-Muslim files are the ones the app loads at runtime; reading them
// here keeps one source. Missing data only skips the chapter pages.
const hisn = await readJson("public/data/hisn/hisn.json");
const hisnTranslations = {
  fr: await readJson("public/data/hisn/fr.json"),
  en: await readJson("public/data/hisn/en.json"),
};

const surahName = (surah, lang) => (lang === "ar" ? surah.ar : lang === "en" ? surah.en : surah.fr);
const surahRef = (surah, ayah, lang) => `${surahName(SURAHS[surah - 1] || { fr: surah, en: surah, ar: surah }, lang)} ${surah}:${ayah}`;
const hubOf = (lang) => duasHub[lang] || duasHub.fr;

// ── Shell building blocks ──────────────────────────────────────────────────
const href = (pathname, lang) => localizePath(pathname, lang);

function linkList(entries, lang) {
  return `<ul style="padding-inline-start:1.2rem">${entries
    .map(([to, label]) => `<li><a href="${href(to, lang)}">${escapeHtml(label)}</a></li>`)
    .join("")}</ul>`;
}

function duaItemsHtml(items) {
  return `<ol style="padding-inline-start:1.2rem">${items
    .map(
      (item) =>
        `<li style="margin-bottom:1.25rem"><p lang="ar" dir="rtl" style="font-size:1.35rem;line-height:2">${escapeHtml(
          item.arabic,
        )}</p>${item.translation ? `<p>${escapeHtml(item.translation)}</p>` : ""}${
          item.ref ? `<p><small>${escapeHtml(item.ref)}</small></p>` : ""
        }</li>`,
    )
    .join("")}</ol>`;
}

function homeExtra(lang) {
  const text = SHELL[lang];
  return `<p>${escapeHtml(text.homeIntro)}</p>
    <nav aria-label="${escapeHtml(text.allSurahs)}"><h2>${escapeHtml(text.allSurahs)}</h2><ol style="columns:14rem;padding-inline-start:0;list-style:none;margin:0">${SURAHS.map(
      (surah) => `<li><a href="${href(`/surah/${surah.n}`, lang)}">${escapeHtml(text.surahLink(surah))}</a></li>`,
    ).join("")}</ol></nav>`;
}

function surahExtra(surah, lang) {
  const text = SHELL[lang];
  const previous = SURAHS[surah.n - 2];
  const next = SURAHS[surah.n];
  const neighbours = SURAHS.filter(
    (item) => item.n !== surah.n && Math.abs(item.n - surah.n) <= 3,
  );
  // Prev/next plus a few neighbours: a crawlable path through the whole Quran
  // without repeating all 114 links on every page (the home page carries those).
  return `<p>${escapeHtml(text.facts(surah))}</p>
    <nav aria-label="${escapeHtml(text.adjacent)}" style="display:flex;justify-content:space-between;gap:1rem;margin-top:2rem">${
      previous
        ? `<a href="${href(`/surah/${previous.n}`, lang)}">${escapeHtml(text.previous(previous))}</a>`
        : "<span></span>"
    }${
      next
        ? `<a href="${href(`/surah/${next.n}`, lang)}">${escapeHtml(text.next(next))}</a>`
        : "<span></span>"
    }</nav>
    <nav aria-label="${escapeHtml(text.neighbours)}"><h2>${escapeHtml(text.neighbours)}</h2><ul style="padding-inline-start:1.2rem">${neighbours
      .map(
        (item) =>
          `<li><a href="${href(`/surah/${item.n}`, lang)}">${escapeHtml(text.surahLink(item))}</a></li>`,
      )
      .join("")}</ul></nav>`;
}

function siteLinks(lang) {
  const labels = COPY[lang];
  const links = [
    ["/duas", SHELL[lang].duasLink],
    ["/about", labels.legal.about],
    ["/sources", labels.legal.sources],
    ["/privacy", labels.legal.privacy],
    ["/legal", labels.legal.legal],
  ];
  return `<nav aria-label="${escapeHtml(SHELL[lang].info)}" style="display:flex;flex-wrap:wrap;gap:.45rem 1.2rem;margin-top:2rem">${links
    .map(([to, label]) => `<a href="${href(to, lang)}">${escapeHtml(label)}</a>`)
    .join("")}</nav>`;
}

// ── Pages: one logical page, built for each language ───────────────────────
// build(lang) -> { title, heading, description, crumbs: [[name, path]], extra }
const pages = [];

function addPage(pathname, kind, build) {
  pages.push({ pathname, kind, indexable: true, build });
}

const homeCrumb = (lang) => [COPY[lang].home, "/"];

addPage("/", "home", (lang) => ({
  title: `${COPY[lang].homeTitle} | ${brand}`,
  heading: SHELL[lang].homeHeading,
  description: COPY[lang].homeDescription,
  crumbs: [],
  extra: homeExtra(lang),
}));

addPage("/duas", "duas", (lang) => {
  const hub = hubOf(lang);
  const sections = [
    ["/duas/hisn", hub.hisnTitle],
    ["/duas/coran", hub.quranTitle],
    ["/duas/rabbana", hub.rabbanaTitle],
    ["/duas/khatm", hub.khatmTitle],
  ];
  return {
    title: `${COPY[lang].duasTitle} | ${brand}`,
    heading: COPY[lang].duasTitle,
    description: COPY[lang].duasDescription,
    crumbs: [homeCrumb(lang), [duasCrumbNames(lang).hub, "/duas"]],
    extra: `<nav aria-label="${escapeHtml(hub.title)}"><h2>${escapeHtml(hub.browseTitle)}</h2>${linkList(sections, lang)}</nav>`,
  };
});

for (const key of ["about", "privacy", "legal", "sources"]) {
  addPage(`/${key}`, "legal", (lang) => ({
    title: `${COPY[lang].legal[key]} | ${brand}`,
    heading: COPY[lang].legal[key],
    description: COPY[lang].legalDescriptions[key],
    crumbs: [homeCrumb(lang), [COPY[lang].legal[key], `/${key}`]],
    extra: "",
  }));
}

for (const surah of SURAHS) {
  addPage(`/surah/${surah.n}`, "surah", (lang) => {
    const seo = surahSeo(surah, lang);
    return {
      title: `${seo.title} | ${brand}`,
      heading: seo.title,
      description: seo.description,
      crumbs: [homeCrumb(lang), [SHELL[lang].surahWord(surah), `/surah/${surah.n}`]],
      extra: surahExtra(surah, lang),
    };
  });
}

// Invocations: sub-pages of /duas with real content.
function subPage(pathname, view, items) {
  addPage(pathname, "duas-sub", (lang) => {
    const seo = duasRouteSeo(view, lang);
    return {
      title: `${seo.title} | ${brand}`,
      heading: seo.title,
      description: seo.description,
      crumbs: [
        homeCrumb(lang),
        [duasCrumbNames(lang).hub, "/duas"],
        [seo.title.split(/[:：]/)[0].trim(), pathname],
      ],
      extra: items ? items(lang) : "",
    };
  });
}

if (hisn && hisnTranslations.fr && hisnTranslations.en) {
  const chapterName = (chapter, lang) =>
    lang === "ar" ? chapter.ar : hisnTranslations[lang].chapters?.[chapter.id] || chapter.ar;

  subPage("/duas/hisn", "hisn", (lang) =>
    `<nav aria-label="${escapeHtml(hubOf(lang).chaptersTitle)}"><h2>${escapeHtml(hubOf(lang).chaptersTitle)}</h2>${linkList(
      hisn.chapters.map((chapter) => [`/duas/hisn/${chapter.id}`, chapterName(chapter, lang)]),
      lang,
    )}</nav>`,
  );

  for (const chapter of hisn.chapters) {
    addPage(`/duas/hisn/${chapter.id}`, "duas-sub", (lang) => {
      const name = chapterName(chapter, lang);
      const seo = duasRouteSeo("chapter", lang, { chapterName: name, itemCount: chapter.items.length });
      // Arabic readers get the Arabic text alone, as in the app's Arabic interface.
      const items = chapter.items.map((item) => ({
        arabic: item.ar,
        translation: lang === "ar" ? "" : hisnTranslations[lang].items?.[item.id] || "",
      }));
      const names = duasCrumbNames(lang);
      return {
        title: `${seo.title} | ${brand}`,
        heading: name,
        description: seo.description,
        crumbs: [
          homeCrumb(lang),
          [names.hub, "/duas"],
          [names.hisn, "/duas/hisn"],
          [name, `/duas/hisn/${chapter.id}`],
        ],
        extra: `<p lang="ar" dir="rtl">${escapeHtml(chapter.ar)}</p>${duaItemsHtml(items)}<p><small>${escapeHtml(
          SHELL[lang].sourceLine(hubOf(lang)),
        )}</small></p>`,
      };
    });
  }
}

const withRef = (list, lang) =>
  list.map((dua) => ({
    arabic: dua.arabic,
    translation: lang === "ar" ? "" : dua[lang] || "",
    ref: surahRef(dua.surah, dua.ayah, lang),
  }));
subPage("/duas/coran", "quran", (lang) => duaItemsHtml(withRef(QURAN_DUAS, lang)));
subPage("/duas/rabbana", "rabbana", (lang) => duaItemsHtml(withRef(RABBANA_DUAS, lang)));
subPage("/duas/khatm", "khatm", null);

// ── Head, schema, body ─────────────────────────────────────────────────────
function schemaFor(page, built, lang, canonical) {
  const organizationId = `${siteUrl.href}#organization`;
  const websiteId = `${siteUrl.href}#website`;
  const webpageId = `${canonical}#webpage`;
  const graph = [
    {
      "@type": "Organization",
      "@id": organizationId,
      name: siteConfig.brandName,
      url: siteUrl.href,
      logo: logoUrl,
      sameAs: [siteConfig.repositoryUrl].filter(Boolean),
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      name: siteConfig.brandName,
      alternateName: "MushafPlus Quran",
      url: siteUrl.href,
      inLanguage: siteConfig.supportedLocales,
      publisher: { "@id": organizationId },
    },
    {
      "@type": "WebPage",
      "@id": webpageId,
      name: built.title,
      description: built.description,
      url: canonical,
      inLanguage: lang,
      isPartOf: { "@id": websiteId },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: socialImageUrl,
        width: 1200,
        height: 630,
      },
    },
  ];

  if (page.kind === "home") {
    const appId = `${siteUrl.href}#app`;
    graph.push({
      "@type": "SoftwareApplication",
      "@id": appId,
      name: siteConfig.brandName,
      url: siteUrl.href,
      applicationCategory: "EducationApplication",
      operatingSystem: "Any",
      isAccessibleForFree: true,
      inLanguage: siteConfig.supportedLocales,
      description: COPY[lang].appDescription,
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    });
    graph.find((node) => node["@id"] === webpageId).about = { "@id": appId };
  }

  if (built.crumbs.length > 1) {
    const breadcrumbId = `${canonical}#breadcrumb`;
    graph.push({
      "@type": "BreadcrumbList",
      "@id": breadcrumbId,
      itemListElement: built.crumbs.map(([name, pathname], index) => ({
        "@type": "ListItem",
        position: index + 1,
        name,
        item: canonicalFor(pathname, lang),
      })),
    });
    graph.find((node) => node["@id"] === webpageId).breadcrumb = { "@id": breadcrumbId };
  }

  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replaceAll(
    "<",
    "\\u003c",
  );
}

function breadcrumbHtml(built, lang) {
  if (built.crumbs.length < 2) return "";
  return `<nav aria-label="${escapeHtml(SHELL[lang].breadcrumb)}"><ol style="display:flex;flex-wrap:wrap;gap:.45rem;list-style:none;padding:0;margin:0 0 1.5rem">${built.crumbs
    .map(([name, pathname], index) => {
      const separator =
        index === 0 ? "" : '<span aria-hidden="true" style="margin-inline-end:.45rem">›</span>';
      return `<li>${separator}<a href="${href(pathname, lang)}">${escapeHtml(name)}</a></li>`;
    })
    .join("")}</ol></nav>`;
}

const SHELL_STYLE =
  "max-width:48rem;margin:4rem auto;padding:1.5rem;font-family:system-ui,sans-serif;line-height:1.65;color:#173d2d";

// data-seo-shell marks markup that exists only for crawlers and no-JS readers:
// React replaces it on mount, and boot-recovery.js treats a shell that is still
// there after load as a failed boot.
function staticBody(page, built, lang) {
  const text = SHELL[lang];
  return `<main data-seo-shell dir="${LOCALE_META[lang].dir}" lang="${lang}" style="${SHELL_STYLE}">
    ${breadcrumbHtml(built, lang)}
    <h1>${escapeHtml(built.heading)}</h1>
    <p>${escapeHtml(built.description)}</p>
    ${built.extra}
    ${page.kind === "home" ? "" : `<p style="margin-top:2rem"><a href="${href("/", lang)}">${escapeHtml(text.openApp)}</a></p>`}
    ${siteLinks(lang)}
  </main>`;
}

function alternatesFor(pathname) {
  return [
    ...LOCALES.map((code) => ({ hreflang: code, href: canonicalFor(pathname, code) })),
    { hreflang: "x-default", href: canonicalFor(pathname, "fr") },
  ];
}

function replaceOnce(html, pattern, replacement, label) {
  if (!pattern.test(html)) throw new Error(`[seo] template has no ${label}`);
  return html.replace(pattern, () => replacement);
}

function renderPage(page, lang) {
  const built = page.build(lang);
  const canonical = canonicalFor(page.pathname, lang);
  const title = escapeHtml(built.title);
  const description = escapeHtml(built.description);
  const alternates = alternatesFor(page.pathname)
    .map(({ hreflang, href: target }) => `<link rel="alternate" hreflang="${hreflang}" href="${target}" />`)
    .join("\n        ");
  const localeMeta = LOCALES.filter((code) => code !== lang)
    .map((code) => `<meta property="og:locale:alternate" content="${LOCALE_META[code].og}" />`)
    .join("\n        ");

  let html = template;
  const swap = (pattern, replacement, label) => {
    html = replaceOnce(html, pattern, replacement, label);
  };
  swap(/<html lang="[^"]*" dir="[^"]*">/i, `<html lang="${lang}" dir="${LOCALE_META[lang].dir}">`, "<html> element");
  swap(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`, "<title>");
  swap(
    /<link rel="canonical"[^>]*>/i,
    `<link rel="canonical" href="${canonical}" />\n        ${alternates}`,
    "canonical",
  );
  swap(/<meta name="description"[^>]*>/i, `<meta name="description" content="${description}" />`, "description");
  swap(/<meta name="robots"[^>]*>/i, '<meta name="robots" content="index,follow" />', "robots");
  swap(/<meta property="og:title"[^>]*>/i, `<meta property="og:title" content="${title}" />`, "og:title");
  swap(
    /<meta property="og:description"[^>]*>/i,
    `<meta property="og:description" content="${description}" />`,
    "og:description",
  );
  swap(/<meta property="og:url"[^>]*>/i, `<meta property="og:url" content="${canonical}" />`, "og:url");
  swap(
    /<meta property="og:locale"[^>]*>/i,
    `<meta property="og:locale" content="${LOCALE_META[lang].og}" />\n        ${localeMeta}`,
    "og:locale",
  );
  swap(/<meta name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${title}" />`, "twitter:title");
  swap(
    /<meta name="twitter:description"[^>]*>/i,
    `<meta name="twitter:description" content="${description}" />`,
    "twitter:description",
  );
  swap(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/i,
    `<script type="application/ld+json">${schemaFor(page, built, lang, canonical)}</script>`,
    "JSON-LD",
  );
  swap(/<div id="root"><\/div>/, `<div id="root">${staticBody(page, built, lang)}</div>`, "empty #root");
  return html;
}

async function writePage(page, lang) {
  const html = renderPage(page, lang);
  const publicPath = localizePath(page.pathname, lang);
  const outputDir = path.join(distDir, publicPath.replace(/^\/+|\/+$/g, ""));
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, "index.html"), html, "utf8");
}

// The root page is written last: the template above is dist/index.html itself.
const homePage = pages.find((page) => page.pathname === "/");
for (const page of pages) {
  for (const lang of LOCALES) {
    if (page === homePage && lang === "fr") continue;
    await writePage(page, lang);
  }
}
await writePage(homePage, "fr");

// 404: one page for every language, never indexed.
const notFoundCanonical = canonicalFor("/404", "fr");
const notFoundHtml = template
  .replace(/<title>[\s\S]*?<\/title>/i, "<title>Page introuvable | MushafPlus</title>")
  .replace(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${notFoundCanonical}" />`)
  .replace(
    /<meta name="description"[^>]*>/i,
    '<meta name="description" content="Cette page n’existe pas ou a été déplacée." />',
  )
  .replace(/<meta name="robots"[^>]*>/i, '<meta name="robots" content="noindex,nofollow" />')
  .replace(
    '<div id="root"></div>',
    `<main style="max-width:42rem;margin:12vh auto;padding:2rem;font-family:system-ui,sans-serif;text-align:center;line-height:1.65;color:#173d2d">
      <p style="font-weight:800;letter-spacing:.12em;color:#0d6b52">ERREUR 404</p>
      <h1>Cette page est introuvable</h1>
      <p>Le lien est peut-être incorrect ou la page a été déplacée.</p>
      <p><a href="/">Retourner à l’accueil MushafPlus</a></p>
    </main>`,
  )
  .replace(/\s*<script src="\/boot-recovery\.js"><\/script>/i, "")
  .replace(/\s*<script type="module"[^>]*src="[^"]+"[^>]*><\/script>/i, "");
await writeFile(path.join(distDir, "404.html"), notFoundHtml, "utf8");

// Sitemap: one entry per language, each listing its alternates (hreflang).
const lastmod = siteConfig.seoLastModified
  ? `<lastmod>${escapeXml(siteConfig.seoLastModified)}</lastmod>`
  : "";
const entries = pages.flatMap((page) =>
  LOCALES.map((lang) => {
    const links = alternatesFor(page.pathname)
      .map(
        ({ hreflang, href: target }) =>
          `<xhtml:link rel="alternate" hreflang="${hreflang}" href="${escapeXml(target)}"/>`,
      )
      .join("");
    return `  <url><loc>${escapeXml(canonicalFor(page.pathname, lang))}</loc>${lastmod}${links}</url>`;
  }),
);
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ...entries,
  "</urlset>",
  "",
].join("\n");
await writeFile(path.join(distDir, "sitemap.xml"), sitemap, "utf8");

console.log(
  `[seo] ${pages.length} pages x ${LOCALES.length} langues + 404 générées, ${entries.length} URLs dans le sitemap.`,
);
