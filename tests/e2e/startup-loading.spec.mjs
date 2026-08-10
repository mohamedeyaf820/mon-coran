import { test, expect } from "@playwright/test";
import fs from "node:fs";

let quranReaderAsset;
try {
  const manifest = JSON.parse(
    fs.readFileSync(new URL("../../dist/.vite/manifest.json", import.meta.url), "utf8"),
  );
  quranReaderAsset = manifest["src/components/QuranDisplay.jsx"]?.file;
} catch {
  // manifest not available (e.g. hidden .vite/ dir excluded from artifact)
}

test.use({ serviceWorkers: "block" });

test("first launch keeps the critical network payload compact", async ({ page }) => {
  const initialDocument = await page.request.get("/");
  expect(initialDocument.ok()).toBe(true);
  const initialHtml = await initialDocument.text();
  const initialStylesheets = initialHtml.match(
    /<link\b[^>]*\brel=["']stylesheet["'][^>]*>/gi,
  ) || [];
  const initialModulePreloads = initialHtml.match(
    /<link\b[^>]*\brel=["']modulepreload["'][^>]*>/gi,
  ) || [];

  const requests = [];
  page.on("request", (request) => requests.push(request.url()));

  await page.route(
    (url) => url.hostname === "api.quran.com",
    (route) =>
      route.fulfill({
        json: {
          verses: [
            {
              id: 1,
              chapter_id: 1,
              verse_key: "1:1",
              verse_number: 1,
              page_number: 1,
              juz_number: 1,
              text_uthmani: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
              text_qpc_hafs: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
              words: [],
            },
          ],
          pagination: { total_pages: 1 },
        },
      }),
  );

  const logoResponsePromise = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/logo-ui.webp",
  );

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".splash-logo")).toBeAttached();
  await expect(page.locator("#main-content")).toBeAttached();
  await expect(page.locator(".hp-wrapper")).toBeAttached({ timeout: 5_000 });

  const logoResponse = await logoResponsePromise;
  const logoBody = await logoResponse.body();
  await page.waitForTimeout(1_000);

  expect(initialStylesheets).toHaveLength(1);
  // The entry uses six tiny/shared runtime chunks; keep this bounded so a
  // future feature cannot silently pull a page-level bundle into startup.
  expect(initialModulePreloads.length).toBeLessThanOrEqual(6);
  expect(logoBody.byteLength).toBeLessThan(40 * 1024);

  const parsedRequests = requests.map((url) => new URL(url));
  const firstLaunchJs = parsedRequests.filter((url) => url.pathname.endsWith(".js"));
  const firstLaunchCss = parsedRequests.filter((url) => url.pathname.endsWith(".css"));
  console.info(
    `[startup-metrics] requests=${parsedRequests.length} js=${firstLaunchJs.length} css=${firstLaunchCss.length}`,
  );
  expect(parsedRequests.length).toBeLessThanOrEqual(45);
  expect(firstLaunchJs.length).toBeLessThanOrEqual(30);
  expect(parsedRequests.filter((url) => url.pathname === "/logo.png")).toHaveLength(0);
  expect(
    parsedRequests.filter(
      (url) => url.pathname === `/pwa-home-wide.png` || url.pathname === `/pwa-home-mobile.png`,
    ),
  ).toHaveLength(0);
  expect(parsedRequests.filter((url) => url.hostname === "api.alquran.cloud")).toHaveLength(0);
  expect(quranReaderAsset).toBeTruthy();
  expect(
    parsedRequests.filter((url) => url.pathname === `/${quranReaderAsset}`),
  ).toHaveLength(0);

  const quranTextRequests = parsedRequests.filter(
    (url) =>
      url.hostname === "api.quran.com" &&
      url.pathname.includes("/verses/by_chapter/"),
  );
  expect(quranTextRequests).toHaveLength(0);
});

test("the branded splash runs once and subsequent loads open directly", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  // The splash may already be fading on low-performance CI runners; check for
  // its presence in the DOM rather than requiring it to be fully visible.
  const splash = page.locator(".splash-screen");
  await expect(splash).toBeAttached({ timeout: 3_000 });

  await expect(splash).toHaveCount(0, { timeout: 3_400 });
  await expect(page.locator(".hp-wrapper")).toBeVisible();

  const reloadStartedAt = Date.now();
  await page.reload({ waitUntil: "domcontentloaded" });

  await expect(page.locator(".splash-screen")).toHaveCount(0, { timeout: 3_000 });
  expect(Date.now() - reloadStartedAt).toBeLessThan(3_000);
  await expect(page.locator(".hp-wrapper")).toBeVisible({ timeout: 5_000 });
});
