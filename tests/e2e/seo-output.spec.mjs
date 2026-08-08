import { test, expect } from "@playwright/test";

const SITE_URL = "https://mushafplus.netlify.app";

test.use({ serviceWorkers: "block" });

function schemaTypes(schema) {
  return schema["@graph"].map((node) => node["@type"]);
}

test("production pages expose coherent crawl and social metadata", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveTitle(/Coran en ligne.+MushafPlus/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "index,follow",
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    `${SITE_URL}/og-image.jpg`,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${SITE_URL}/`,
  );

  const homeSchema = JSON.parse(
    await page.locator('script[type="application/ld+json"]').textContent(),
  );
  expect(schemaTypes(homeSchema)).toEqual(
    expect.arrayContaining([
      "Organization",
      "WebSite",
      "WebPage",
      "SoftwareApplication",
    ]),
  );
});

test("surah pages are indexable while deep reading states use runtime noindex", async ({
  page,
  request,
}) => {
  const surahResponse = await request.get("/surah/2/index.html");
  expect(surahResponse.ok()).toBe(true);
  const surahHtml = await surahResponse.text();
  expect(surahHtml).toContain('<meta name="robots" content="index,follow"');
  expect(surahHtml).toContain('"@type":"BreadcrumbList"');
  expect(surahHtml).toContain('href="/surah/1"');
  expect(surahHtml).toContain('href="/surah/3"');

  await page.goto("/surah/2/2", { waitUntil: "domcontentloaded" });
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex,follow",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${SITE_URL}/surah/2/2`,
  );
});

test("the static surah hub exposes all 114 crawlable links", async ({
  page,
  request,
}) => {
  const response = await request.get("/surahs/index.html");
  expect(response.ok()).toBe(true);
  const html = await response.text();
  expect(html).not.toContain('<script type="module"');

  await page.goto("/surahs/index.html", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle(/Liste des 114 sourates/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "index,follow",
  );
  await expect(page.locator('main a[href^="/surah/"]')).toHaveCount(114);
});

test("sitemap and social image stay within the SEO contract", async ({
  request,
}) => {
  const sitemapResponse = await request.get("/sitemap.xml");
  expect(sitemapResponse.ok()).toBe(true);
  const sitemap = await sitemapResponse.text();
  expect((sitemap.match(/<url>/g) || []).length).toBe(121);
  expect(sitemap).not.toContain("/page/");
  expect(sitemap).not.toContain("/juz/");
  expect(sitemap).not.toMatch(/\/surah\/\d+\/\d+/);

  const imageResponse = await request.get("/og-image.jpg");
  expect(imageResponse.ok()).toBe(true);
  expect(imageResponse.headers()["content-type"]).toContain("image/jpeg");
  expect((await imageResponse.body()).byteLength).toBeLessThan(150 * 1024);
});

test("about page publishes project identity and correction policy", async ({ page }) => {
  await page.goto("/about", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1, name: /compagnon de lecture/i })).toBeVisible();
  await expect(page.getByText("Mohamed Eyaf", { exact: false })).toBeVisible();
  await expect(page.getByText("Version 1.1.0", { exact: false })).toBeVisible();
  await expect(page.getByRole("link", { name: "Signaler une correction" })).toHaveAttribute("href", /github\.com\/mohamedeyaf820\/mon-coran\/issues/);
});
