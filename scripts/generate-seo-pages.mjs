import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import SURAHS from "../src/data/surahs.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");
const siteConfig = JSON.parse(
  await readFile(path.join(rootDir, "site.config.json"), "utf8"),
);
const template = await readFile(path.join(distDir, "index.html"), "utf8");
const siteUrl = new URL(`${siteConfig.siteUrl.replace(/\/+$/, "")}/`);
const socialImageUrl = new URL("/og-image.jpg", siteUrl).href;

const routes = [
  {
    pathname: "/",
    kind: "home",
    indexable: true,
    title: "Coran en ligne — Lecture, écoute & Tajwid | MushafPlus",
    description:
      "Lisez, écoutez et mémorisez gratuitement le Saint Coran en ligne avec Tajwid, traductions et récitations Hafs et Warsh sur MushafPlus.",
  },
  {
    pathname: "/surahs",
    kind: "surah-index",
    indexable: true,
    staticOnly: true,
    title: "Liste des 114 sourates du Saint Coran | MushafPlus",
    description:
      "Consultez la liste complète des 114 sourates du Saint Coran avec leurs noms arabes, traductions et nombre de versets.",
  },
  {
    pathname: "/duas",
    kind: "duas",
    indexable: true,
    title: "Douas en arabe avec traduction | MushafPlus",
    description:
      "Découvrez une sélection de douas en arabe avec traduction française, références et accès rapide depuis MushafPlus.",
  },
  {
    pathname: "/about",
    kind: "legal",
    indexable: true,
    title: "À propos de MushafPlus | MushafPlus",
    description:
      "Responsable du projet, contact, version et politique de correction de MushafPlus.",
  },
  {
    pathname: "/privacy",
    kind: "legal",
    indexable: true,
    title: "Confidentialité | MushafPlus",
    description:
      "Politique de confidentialité et traitement local des données dans MushafPlus.",
  },
  {
    pathname: "/legal",
    kind: "legal",
    indexable: true,
    title: "Mentions légales | MushafPlus",
    description:
      "Mentions légales et informations de publication de MushafPlus.",
  },
  {
    pathname: "/sources",
    kind: "legal",
    indexable: true,
    title: "Sources coraniques et techniques | MushafPlus",
    description:
      "Sources coraniques, audio, typographiques et techniques utilisées par MushafPlus.",
  },
];

for (const surah of SURAHS) {
  const baseDescription = `Sourate ${surah.en} (${surah.ar}), ${surah.fr} : ${surah.ayahs} versets avec texte arabe, traduction, Tajwid et récitation audio.`;
  routes.push({
    pathname: `/surah/${surah.n}`,
    kind: "surah",
    indexable: true,
    surah,
    title: `Sourate ${surah.en} (${surah.ar}) — ${surah.fr} | MushafPlus`,
    description: baseDescription,
  });
}

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

function canonicalFor(pathname) {
  return new URL(pathname, siteUrl).href;
}

function breadcrumbItems(route) {
  const items = [
    {
      name: "Accueil",
      url: canonicalFor("/"),
    },
  ];

  if (route.kind === "surah-index") {
    items.push({ name: "Liste des sourates", url: canonicalFor("/surahs") });
  } else if (route.surah) {
    items.push({ name: "Sourates", url: canonicalFor("/surahs") });
    items.push({
      name: `Sourate ${route.surah.en}`,
      url: canonicalFor(`/surah/${route.surah.n}`),
    });
    if (route.kind === "ayah") {
      items.push({
        name: `Verset ${route.ayah}`,
        url: canonicalFor(route.pathname),
      });
    }
  } else if (route.kind !== "home") {
    items.push({ name: route.title.split("|")[0].trim(), url: canonicalFor(route.pathname) });
  }

  return items;
}

function schemaFor(route, canonical) {
  const organizationId = `${siteUrl.href}#organization`;
  const websiteId = `${siteUrl.href}#website`;
  const webpageId = `${canonical}#webpage`;
  const breadcrumbs = breadcrumbItems(route);
  const graph = [
    {
      "@type": "Organization",
      "@id": organizationId,
      name: siteConfig.brandName,
      url: siteUrl.href,
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
      name: route.title,
      description: route.description,
      url: canonical,
      inLanguage: siteConfig.defaultLocale,
      isPartOf: { "@id": websiteId },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: socialImageUrl,
        width: 1200,
        height: 630,
      },
    },
  ];

  if (route.kind === "home") {
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

  if (breadcrumbs.length > 1) {
    const breadcrumbId = `${canonical}#breadcrumb`;
    graph.push({
      "@type": "BreadcrumbList",
      "@id": breadcrumbId,
      itemListElement: breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    });
    graph.find((node) => node["@id"] === webpageId).breadcrumb = {
      "@id": breadcrumbId,
    };
  }

  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": graph,
  }).replaceAll("<", "\\u003c");
}

function breadcrumbHtml(route) {
  const items = breadcrumbItems(route);
  if (items.length < 2) return "";
  return `<nav aria-label="Fil d’Ariane"><ol style="display:flex;flex-wrap:wrap;gap:.45rem;list-style:none;padding:0;margin:0 0 1.5rem">${items
    .map((item, index) => {
      const label = escapeHtml(item.name);
      const separator =
        index === 0
          ? ""
          : '<span aria-hidden="true" style="margin-right:.45rem">›</span>';
      return `<li>${separator}<a href="${item.url}">${label}</a></li>`;
    })
    .join("")}</ol></nav>`;
}

function adjacentSurahLinks(route) {
  if (!route.surah) return "";
  const previous = SURAHS[route.surah.n - 2];
  const next = SURAHS[route.surah.n];
  return `<nav aria-label="Sourates adjacentes" style="display:flex;justify-content:space-between;gap:1rem;margin-top:2rem">${
    previous
      ? `<a href="/surah/${previous.n}">← Sourate ${escapeHtml(previous.en)}</a>`
      : "<span></span>"
  }${
    next
      ? `<a href="/surah/${next.n}">Sourate ${escapeHtml(next.en)} →</a>`
      : "<span></span>"
  }</nav>`;
}

function surahIndexBody() {
  const list = SURAHS.map(
    (surah) =>
      `<li><a href="/surah/${surah.n}"><strong>${surah.n}. ${escapeHtml(
        surah.en,
      )}</strong> <span lang="ar" dir="rtl">${escapeHtml(
        surah.ar,
      )}</span></a> — ${escapeHtml(surah.fr)}, ${surah.ayahs} versets</li>`,
  ).join("");
  return `<main style="max-width:64rem;margin:2rem auto;padding:1.5rem;font-family:system-ui,sans-serif;line-height:1.65;color:#173d2d">
    ${breadcrumbHtml(routes.find((route) => route.kind === "surah-index"))}
    <h1>Liste des 114 sourates du Saint Coran</h1>
    <p>Accédez à chaque sourate avec son nom arabe, sa traduction française, son texte, le Tajwid et les récitations Hafs et Warsh.</p>
    <ol style="columns:3 16rem;column-gap:2rem;padding-left:1.5rem">${list}</ol>
    <p style="margin-top:2rem"><a href="/">Ouvrir l’application MushafPlus</a></p>
  </main>`;
}

function staticBody(route, title, description) {
  if (route.kind === "surah-index") return surahIndexBody();
  return `<main style="max-width:48rem;margin:4rem auto;padding:1.5rem;font-family:system-ui,sans-serif;line-height:1.65;color:#173d2d">
    ${breadcrumbHtml(route)}
    <h1>${title}</h1>
    <p>${description}</p>
    ${adjacentSurahLinks(route)}
    <p style="margin-top:2rem"><a href="/">Ouvrir MushafPlus</a></p>
  </main>`;
}

function renderPage(route) {
  const canonical = canonicalFor(route.pathname);
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);
  const robots = route.indexable ? "index,follow" : "noindex,follow";
  const schema = schemaFor(route, canonical);

  let html = template
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`)
    .replace(
      /<link rel="canonical"[^>]*>/i,
      `<link rel="canonical" href="${canonical}" />`,
    )
    .replace(
      /<meta name="description"[^>]*>/i,
      `<meta name="description" content="${description}" />`,
    )
    .replace(
      /<meta name="robots"[^>]*>/i,
      `<meta name="robots" content="${robots}" />`,
    )
    .replace(
      /<meta property="og:title"[^>]*>/i,
      `<meta property="og:title" content="${title}" />`,
    )
    .replace(
      /<meta property="og:description"[^>]*>/i,
      `<meta property="og:description" content="${description}" />`,
    )
    .replace(
      /<meta property="og:url"[^>]*>/i,
      `<meta property="og:url" content="${canonical}" />`,
    )
    .replace(
      /<meta name="twitter:title"[^>]*>/i,
      `<meta name="twitter:title" content="${title}" />`,
    )
    .replace(
      /<meta name="twitter:description"[^>]*>/i,
      `<meta name="twitter:description" content="${description}" />`,
    )
    .replace(
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/i,
      `<script type="application/ld+json">${schema}</script>`,
    );

  if (route.pathname !== "/") {
    html = html.replace(
      '<div id="root"></div>',
      `<div id="root">${staticBody(route, title, description)}</div>`,
    );
  }

  if (route.staticOnly) {
    html = html
      .replace(/\s*<script src="\/boot-recovery\.js"><\/script>/i, "")
      .replace(
        /\s*<script type="module"[^>]*src="[^"]+"[^>]*><\/script>/i,
        "",
      );
  }

  return html;
}

for (const route of routes) {
  if (route.pathname === "/") {
    await writeFile(path.join(distDir, "index.html"), renderPage(route), "utf8");
    continue;
  }
  const outputDir = path.join(distDir, route.pathname.slice(1));
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, "index.html"), renderPage(route), "utf8");
}

const notFoundCanonical = canonicalFor("/404");
const notFoundHtml = template
  .replace(
    /<title>[\s\S]*?<\/title>/i,
    "<title>Page introuvable | MushafPlus</title>",
  )
  .replace(
    /<link rel="canonical"[^>]*>/i,
    `<link rel="canonical" href="${notFoundCanonical}" />`,
  )
  .replace(
    /<meta name="description"[^>]*>/i,
    '<meta name="description" content="Cette page n’existe pas ou a été déplacée." />',
  )
  .replace(
    /<meta name="robots"[^>]*>/i,
    '<meta name="robots" content="noindex,nofollow" />',
  )
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
  .replace(
    /\s*<script type="module"[^>]*src="[^"]+"[^>]*><\/script>/i,
    "",
  );
await writeFile(path.join(distDir, "404.html"), notFoundHtml, "utf8");

const indexableRoutes = routes.filter((route) => route.indexable);
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...indexableRoutes.map((route) => {
    const loc = escapeXml(canonicalFor(route.pathname));
    const lastmod = siteConfig.seoLastModified
      ? `<lastmod>${escapeXml(siteConfig.seoLastModified)}</lastmod>`
      : "";
    return `  <url><loc>${loc}</loc>${lastmod}</url>`;
  }),
  "</urlset>",
  "",
].join("\n");
await writeFile(path.join(distDir, "sitemap.xml"), sitemap, "utf8");

console.log(
  `[seo] ${routes.length} pages indexables + 404 générées, ${indexableRoutes.length} URLs dans le sitemap.`,
);
