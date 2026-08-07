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
        "Application de lecture du Coran avec récitations audio, Tajwid, traductions, favoris et notes.",
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
      `<li><a href="/surah/${surah.n}"><span class="n">${String(surah.n).padStart(3, "0")}</span><span class="names"><strong>${escapeHtml(
        surah.fr,
      )}</strong><small>${escapeHtml(surah.en)} · ${surah.ayahs} versets</small></span><span class="ar" lang="ar" dir="rtl">${escapeHtml(
        surah.ar,
      )}</span><span class="open">Lire →</span></a></li>`,
  ).join("");
  return `<style>
    :root{color-scheme:light dark}*{box-sizing:border-box}body{margin:0;background:#f3f8f5;color:#17271f;font-family:ui-sans-serif,system-ui,sans-serif}.hub{width:min(100% - 2rem,76rem);margin:auto;padding:2rem 0 4rem}.hero{text-align:center;padding:2rem 1rem}.eyebrow{color:#0d6b52;font-size:.72rem;font-weight:800;letter-spacing:.15em;text-transform:uppercase}.hero h1{max-width:48rem;margin:.5rem auto;font:500 clamp(2.2rem,6vw,4.5rem)/1.03 Georgia,serif;letter-spacing:-.04em}.hero p{max-width:42rem;margin:1rem auto;color:#5d6d64;line-height:1.7}.actions{display:flex;justify-content:center;gap:.5rem;flex-wrap:wrap}.actions a{padding:.65rem .85rem;border:1px solid #bdd1c6;border-radius:.75rem;color:#0d6b52;text-decoration:none;font-size:.78rem;font-weight:750}.panel{padding:1rem;border:1px solid #cbd9d1;border-radius:1.4rem;background:#fff;box-shadow:0 18px 50px #183d2920}.panel-head{display:flex;align-items:end;justify-content:space-between;gap:1rem;padding:.3rem .3rem 1rem}.panel-head p{margin:0;color:#0d6b52;font-size:.7rem;font-weight:800}.panel-head h2{margin:.2rem 0 0;font-size:1.2rem}.legend{color:#6a786f;font-size:.72rem}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.55rem;margin:0;padding:0;list-style:none}.grid a{display:grid;grid-template-columns:2.7rem minmax(0,1fr) auto;grid-template-areas:'n names ar' 'n names open';align-items:center;gap:.2rem .7rem;min-height:5.8rem;padding:.8rem;border:1px solid #d8e2dc;border-radius:.95rem;color:inherit;text-decoration:none}.grid a:hover{border-color:#4b9a73;background:#eef7f1;box-shadow:0 10px 24px #173d2d16}.n{grid-area:n;display:grid;width:2.7rem;height:2.7rem;place-items:center;border:1px solid #a8cbb8;border-radius:.8rem;color:#0d6b52;font:800 .68rem ui-monospace,monospace}.names{grid-area:names;display:grid;min-width:0}.names strong,.names small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.names strong{font-size:.8rem}.names small{color:#69786f;font-size:.63rem}.ar{grid-area:ar;font:1.15rem/1.5 'Scheherazade New',serif}.open{grid-area:open;justify-self:end;color:#0d6b52;font-size:.62rem;font-weight:750}.foot{display:flex;justify-content:space-between;gap:1rem;margin-top:1rem;padding:.8rem;color:#68776e;font-size:.7rem}.foot a{color:#0d6b52;font-weight:750;text-decoration:none}@media(max-width:850px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.hub{width:min(100% - 1rem,76rem);padding-top:.5rem}.hero{padding-inline:.2rem}.grid{grid-template-columns:1fr}.panel{padding:.55rem;border-radius:1rem}.legend{display:none}.foot{flex-direction:column}}@media(prefers-color-scheme:dark){body{background:#0d1712;color:#edf5f0}.hero p,.legend,.names small,.foot{color:#aabbb1}.panel{border-color:#2b4537;background:#13231a}.grid a{border-color:#2c4939;background:#16271e}.grid a:hover{border-color:#4f9c75;background:#193126}.actions a{border-color:#335742;color:#72c997}}
  </style><main class="hub">
    <header class="hero"><p class="eyebrow">Bibliothèque coranique</p><h1>Les 114 sourates, réunies en un seul répertoire</h1><p>Accédez à chaque sourate avec son nom arabe, sa traduction française, son texte, le Tajwid et les récitations Hafs et Warsh.</p><nav class="actions" aria-label="Navigation"><a href="/">Accueil</a><a href="/about">À propos</a><a href="/sources">Sources</a></nav></header>
    <section class="panel"><div class="panel-head"><div><p>114 / 114</p><h2>Liste des sourates</h2></div><span class="legend">Nom français · translittération · nombre de versets</span></div><ol class="grid">${list}</ol></section>
    <footer class="foot"><span>Lecture privée, sans compte</span><a href="/">MushafPlus</a></footer>
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
