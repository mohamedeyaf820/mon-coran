import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import SURAHS from "../src/data/surahs.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");
const siteConfig = JSON.parse(await readFile(path.join(rootDir, "site.config.json"), "utf8"));
const template = await readFile(path.join(distDir, "index.html"), "utf8");

const routes = [
  {
    pathname: "/",
    title: "Le Saint Coran avec MushafPlus",
    description:
      "Lisez, écoutez et mémorisez le Saint Coran avec Tajwid, traductions et récitations Hafs et Warsh.",
  },
  {
    pathname: "/duas",
    title: "Douas · MushafPlus",
    description: "Découvrez une sélection de douas avec texte arabe et traduction.",
  },
  {
    pathname: "/privacy",
    title: "Confidentialité · MushafPlus",
    description: "Politique de confidentialité et traitement local des données dans MushafPlus.",
  },
  {
    pathname: "/legal",
    title: "Mentions légales · MushafPlus",
    description: "Mentions légales et informations de publication de MushafPlus.",
  },
  {
    pathname: "/sources",
    title: "Sources · MushafPlus",
    description: "Sources coraniques, audio, typographiques et techniques utilisées par MushafPlus.",
  },
];

for (const surah of SURAHS) {
  const baseDescription = `Sourate ${surah.fr} (${surah.en}) : texte arabe, traduction, Tajwid et récitation audio.`;
  routes.push({
    pathname: `/surah/${surah.n}`,
    title: `${surah.fr} · MushafPlus`,
    description: baseDescription,
  });
  for (let ayah = 2; ayah <= surah.ayahs; ayah += 1) {
    routes.push({
      pathname: `/surah/${surah.n}/${ayah}`,
      title: `${surah.fr} — verset ${ayah} · MushafPlus`,
      description: `${baseDescription} Accès direct au verset ${ayah}.`,
    });
  }
}

for (let pageNumber = 1; pageNumber <= 604; pageNumber += 1) {
  routes.push({
    pathname: `/page/${pageNumber}`,
    title: `Page ${pageNumber} du Coran · MushafPlus`,
    description: `Page ${pageNumber} du Saint Coran : lecture, traduction, Tajwid et récitation audio.`,
  });
}

for (let juzNumber = 1; juzNumber <= 30; juzNumber += 1) {
  routes.push({
    pathname: `/juz/${juzNumber}`,
    title: `Juz ${juzNumber} du Coran · MushafPlus`,
    description: `Juz ${juzNumber} du Saint Coran : lecture, traduction, Tajwid et récitation audio.`,
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderPage(route) {
  const canonical = new URL(route.pathname, `${siteConfig.siteUrl}/`).href;
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);
  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: route.title,
    description: route.description,
    url: canonical,
    inLanguage: "fr",
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.brandName,
      url: siteConfig.siteUrl,
    },
  }).replaceAll("<", "\\u003c");

  let html = template
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`)
    .replace(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<meta name="description"[^>]*>/i, `<meta name="description" content="${description}" />`)
    .replace(/<meta property="og:title"[^>]*>/i, `<meta property="og:title" content="${title}" />`)
    .replace(/<meta property="og:description"[^>]*>/i, `<meta property="og:description" content="${description}" />`)
    .replace(/<meta property="og:url"[^>]*>/i, `<meta property="og:url" content="${canonical}" />`)
    .replace(/<meta name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${title}" />`)
    .replace(/<meta name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${description}" />`)
    .replace(
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/i,
      `<script type="application/ld+json">${schema}</script>`,
    );

  if (route.pathname !== "/") {
    html = html.replace(
      '<div id="root"></div>',
      `<div id="root"><main style="max-width:48rem;margin:4rem auto;padding:1.5rem;font-family:system-ui,sans-serif"><h1>${title}</h1><p>${description}</p><p><a href="/">Ouvrir MushafPlus</a></p></main></div>`,
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

const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...routes.map(
    (route) => `  <url><loc>${escapeXml(new URL(route.pathname, `${siteConfig.siteUrl}/`).href)}</loc></url>`,
  ),
  "</urlset>",
  "",
].join("\n");
await writeFile(path.join(distDir, "sitemap.xml"), sitemap, "utf8");

console.log(`[seo] ${routes.length} pages et sitemap générés.`);
