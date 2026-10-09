import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = process.env.SEO_DIST_DIR
  ? path.resolve(process.env.SEO_DIST_DIR)
  : path.join(rootDir, "dist");
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

function organizationLogo(html) {
  return structuredData(html)["@graph"].find((node) => node["@type"] === "Organization")?.logo;
}

const home = await readDist("index.html");
const surah = await readDist(path.join("surah", "2", "index.html"));
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
const sitemapLocations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  (match) => match[1],
);
// Per language: 6 site pages + 114 surahs + the invocation sub-pages (hisn list, quran, rabbana,
// khatm and one page per Hisn chapter).
const hisnLibrary = JSON.parse(
  await readFile(path.join(rootDir, "public", "data", "hisn", "hisn.json"), "utf8"),
);
// Each page exists in French, English and Arabic.
const expectedUrls = 3 * (120 + 4 + hisnLibrary.chapters.length);
check(
  sitemapLocations.length === expectedUrls,
  `sitemap must contain exactly ${expectedUrls} useful URLs, found ${sitemapLocations.length}`,
);
check(
  !sitemapLocations.some((url) => /\/surah\/\d+\/\d+$/.test(url)),
  "ayah deep links must not be listed in sitemap",
);
check(
  !sitemapLocations.some((url) => /\/(?:page|juz)\/\d+$/.test(url)),
  "thin page and juz routes must not be listed in sitemap",
);
const lastmods = [...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map(
  (match) => match[1],
);
check(lastmods.length === sitemapLocations.length, "lastmod missing from sitemap entries");
check(
  lastmods.every((value) => value === siteConfig.seoLastModified),
  "sitemap lastmod must match the verified content date",
);

// Crawlable content, in every language (French at the root, English under /en,
// Arabic under /ar): the home page links every surah, each surah page has its own
// heading, and titles/descriptions are unique per language and of a displayable length.
const LANGUAGES = [
  { code: "fr", prefix: "", dir: "ltr" },
  { code: "en", prefix: "/en", dir: "ltr" },
  { code: "ar", prefix: "/ar", dir: "rtl" },
];
const pageFile = (prefix, ...segments) => path.join(prefix.replace(/^\//, ""), ...segments, "index.html");
const titleOf = (html) => html.match(/<title>([^<]+)<\/title>/i)?.[1] || "";
const descriptionOf = (html) =>
  html.match(/<meta name="description" content="([^"]+)"/i)?.[1] || "";

for (const { code, prefix, dir } of LANGUAGES) {
  const label = code.toUpperCase();
  const localHome = await readDist(pageFile(prefix));
  check(localHome.includes(`<html lang="${code}" dir="${dir}">`), `${label} home: <html lang/dir>`);
  check(localHome.includes("data-seo-shell"), `${label} home must carry the crawlable shell`);
  check(/<h1>[^<]+<\/h1>/.test(localHome), `${label} home must have one h1`);
  const links = new Set(
    [...localHome.matchAll(/href="[^"]*\/surah\/(\d+)"/g)].map((match) => match[1]),
  );
  check(links.size === 114, `${label} home must link all 114 surahs`);
  check(
    organizationLogo(localHome) === `${siteConfig.siteUrl}/logo-512.png`,
    `${label} home: Organization logo missing from schema`,
  );

  const titles = new Map();
  const descriptions = new Map();
  for (let number = 1; number <= 114; number += 1) {
    const html = await readDist(pageFile(prefix, "surah", String(number)));
    const title = titleOf(html);
    const description = descriptionOf(html);
    const name = `${label} surah ${number}`;
    check(/<h1>[^<]+<\/h1>/.test(html), `${name} has no h1`);
    check(html.includes("data-seo-shell"), `${name} has no crawlable shell`);
    check(title.length > 0 && title.length <= 75, `${name} title length ${title.length}`);
    check(
      description.length >= 80 && description.length <= 165,
      `${name} description length ${description.length}`,
    );
    check(!titles.has(title), `${name} repeats the title of surah ${titles.get(title)}`);
    check(
      !descriptions.has(description),
      `${name} repeats the description of surah ${descriptions.get(description)}`,
    );
    titles.set(title, number);
    descriptions.set(description, number);
  }

  // Invocation chapters: own title, description and the Arabic text itself.
  const chapterTitles = new Set();
  for (const chapter of hisnLibrary.chapters) {
    const html = await readDist(pageFile(prefix, "duas", "hisn", String(chapter.id)));
    const title = titleOf(html);
    const description = descriptionOf(html);
    const name = `${label} hisn ${chapter.id}`;
    check(title.length > 0 && title.length <= 90, `${name} title length ${title.length}`);
    check(
      description.length >= 40 && description.length <= 260,
      `${name} description length ${description.length}`,
    );
    check(!chapterTitles.has(title), `${name} repeats a title`);
    chapterTitles.add(title);
    check(html.includes('lang="ar"'), `${name} has no Arabic text`);
    check(
      html.includes(`rel="canonical" href="${siteConfig.siteUrl}${prefix}/duas/hisn/${chapter.id}"`),
      `${name} canonical`,
    );
  }
  const hisnList = await readDist(pageFile(prefix, "duas", "hisn"));
  check(
    new Set([...hisnList.matchAll(/href="[^"]*\/duas\/hisn\/(\d+)"/g)].map((match) => match[1])).size ===
      hisnLibrary.chapters.length,
    `${label}: the Hisn list must link every chapter`,
  );
}

// hreflang: every page of the sitemap names itself as canonical, lists the same
// four alternates as its siblings, and each alternate exists on disk.
const fileOfUrl = (url) => {
  const pathname = new URL(url).pathname;
  return path.join(pathname.replace(/^\/+|\/+$/g, ""), "index.html");
};
for (const location of sitemapLocations) {
  const html = await readDist(fileOfUrl(location));
  check(
    html.includes(`<link rel="canonical" href="${location}" />`),
    `${location}: canonical must be the page itself`,
  );
  const alternates = [
    ...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)" \/>/g),
  ].map((match) => `${match[1]}=${match[2]}`);
  check(alternates.length === 4, `${location}: expected 4 hreflang alternates, found ${alternates.length}`);
  check(
    alternates.some((entry) => entry.endsWith(`=${location}`)),
    `${location}: hreflang must include the page itself`,
  );
  for (const entry of alternates) {
    const target = entry.slice(entry.indexOf("=") + 1);
    check(sitemapLocations.includes(target), `${location}: alternate ${target} is not in the sitemap`);
  }
}
check(
  sitemapLocations.every((url) => (sitemap.match(new RegExp(`href="${url}"`, "g")) || []).length >= 1),
  "every sitemap URL must be declared as an alternate",
);

const socialImage = await stat(path.join(distDir, "og-image.jpg"));
check(socialImage.size < 150 * 1024, "OG image must stay below 150 kB");

console.log(
  `[seo-check] OK — ${sitemapLocations.length} indexable URLs, OG image ${(socialImage.size / 1024).toFixed(1)} kB.`,
);
