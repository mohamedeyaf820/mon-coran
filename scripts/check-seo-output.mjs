import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");
const siteConfig = JSON.parse(
  await readFile(path.join(rootDir, "site.config.json"), "utf8"),
);

function check(condition, message) {
  if (!condition) throw new Error(`[seo-check] ${message}`);
}

async function readDist(relativePath) {
  return readFile(path.join(distDir, relativePath), "utf8");
}

function robotsContent(html) {
  return html.match(/<meta name="robots" content="([^"]+)"/i)?.[1] || "";
}

function structuredData(html) {
  const raw = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/i,
  )?.[1];
  check(raw, "JSON-LD missing");
  return JSON.parse(raw);
}

const home = await readDist("index.html");
const surah = await readDist(path.join("surah", "2", "index.html"));
const surahIndex = await readDist(path.join("surahs", "index.html"));
const notFound = await readDist("404.html");
const sitemap = await readDist("sitemap.xml");

check(robotsContent(home) === "index,follow", "homepage must be indexable");
check(robotsContent(surah) === "index,follow", "surah pages must be indexable");
check(robotsContent(notFound) === "noindex,nofollow", "404 page must not be indexable");

for (const relativePath of [
  path.join("surah", "2", "2", "index.html"),
  path.join("page", "1", "index.html"),
  path.join("juz", "1", "index.html"),
]) {
  let exists = true;
  try {
    await access(path.join(distDir, relativePath));
  } catch {
    exists = false;
  }
  check(!exists, `${relativePath} must use the SPA fallback instead of generated HTML`);
}

check(
  home.includes(`property="og:image" content="${siteConfig.siteUrl}/og-image.jpg"`),
  "dedicated OG image missing",
);
check(home.includes('property="og:image:width" content="1200"'), "OG width missing");
check(home.includes('property="og:image:height" content="630"'), "OG height missing");
check(home.includes('property="og:locale" content="fr_FR"'), "OG locale missing");
check(home.includes('property="og:site_name" content="MushafPlus"'), "OG site name missing");

const homeTypes = structuredData(home)["@graph"].map((node) => node["@type"]);
for (const type of [
  "Organization",
  "WebSite",
  "SoftwareApplication",
  "WebPage",
]) {
  check(homeTypes.includes(type), `${type} schema missing from homepage`);
}
const surahTypes = structuredData(surah)["@graph"].map((node) => node["@type"]);
check(
  surahTypes.includes("BreadcrumbList"),
  "BreadcrumbList schema missing from surah page",
);
check(surah.includes('href="/surah/1"'), "previous-surah link missing");
check(surah.includes('href="/surah/3"'), "next-surah link missing");
check(surah.includes(`href="${siteConfig.siteUrl}/surahs"`), "surah hub breadcrumb missing");

const sitemapLocations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  (match) => match[1],
);
check(sitemapLocations.length === 121, "sitemap must contain exactly 121 useful URLs");
check(
  !sitemapLocations.some((url) => /\/surah\/\d+\/\d+$/.test(url)),
  "ayah deep links must not be listed in sitemap",
);
check(
  !sitemapLocations.some((url) => /\/(?:page|juz)\/\d+$/.test(url)),
  "thin page and juz routes must not be listed in sitemap",
);
check(
  sitemapLocations.includes(`${siteConfig.siteUrl}/surahs`),
  "surah hub missing from sitemap",
);
const lastmods = [...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map(
  (match) => match[1],
);
check(lastmods.length === sitemapLocations.length, "lastmod missing from sitemap entries");
check(
  lastmods.every((value) => value === siteConfig.seoLastModified),
  "sitemap lastmod must match the verified content date",
);

const surahLinks = new Set(
  [...surahIndex.matchAll(/href="\/surah\/(\d+)"/g)].map((match) => match[1]),
);
check(surahLinks.size === 114, "static surah hub must link all 114 surahs");
check(
  !/<script type="module"/i.test(surahIndex),
  "static surah hub must remain readable without SPA replacement",
);

const socialImage = await stat(path.join(distDir, "og-image.jpg"));
check(socialImage.size < 150 * 1024, "OG image must stay below 150 kB");

console.log(
  `[seo-check] OK — ${sitemapLocations.length} indexable URLs, 114 surah links, OG image ${(socialImage.size / 1024).toFixed(1)} kB.`,
);
