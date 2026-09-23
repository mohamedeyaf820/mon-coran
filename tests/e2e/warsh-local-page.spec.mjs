import { test, expect } from "@playwright/test";

test("a cold Warsh page reads local verified text and keeps a boundary ayah", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("mushaf-plus-settings", JSON.stringify({
      skipSplashAnimation: true,
      showHome: false,
      displayMode: "page",
      mushafLayout: "mushaf",
      riwaya: "warsh",
      lang: "fr",
      lastPosition: { surah: 4, ayah: 44, page: 85, juz: 5 },
    }));
  });
  await page.route((url) => url.hostname === "raw.githubusercontent.com", (route) => route.abort());
  await page.route((url) => url.hostname === "api.quran.com", (route) => route.abort());

  const sourceResponse = page.waitForResponse((response) =>
    new URL(response.url()).pathname === "/data/warsh-page-source.json",
  );
  await page.goto("/page/85");
  expect((await sourceResponse).ok()).toBe(true);
  const printedPage = page.locator('[data-stream-page="85"]');
  await expect(printedPage).toBeVisible({ timeout: 12_000 });
  await expect(printedPage.locator('[data-ayah-number="44"]')).not.toHaveCount(0);
  await expect(page.locator(".reader-data-state")).toHaveCount(0);
});

test("a cold mobile Warsh page stays stable as verified text arrives", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem("mushaf-plus-settings", JSON.stringify({
      skipSplashAnimation: true,
      showHome: false,
      displayMode: "page",
      mushafLayout: "mushaf",
      riwaya: "warsh",
      lang: "fr",
      lastPosition: { surah: 77, ayah: 1, page: 565, juz: 29 },
    }));
    window.__readerLayoutShift = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__readerLayoutShift += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.route((url) => url.hostname === "raw.githubusercontent.com", (route) => route.abort());
  await page.route((url) => url.hostname === "api.quran.com", (route) => route.abort());

  await page.goto("/page/565", { waitUntil: "domcontentloaded" });
  const printedPage = page.locator('[data-stream-page="565"]');
  await expect(printedPage).toBeVisible({ timeout: 12_000 });
  await expect(printedPage.locator('.qcm-word').first()).toBeVisible();
  await page.waitForTimeout(1_000);
  expect(await page.evaluate(() => window.__readerLayoutShift)).toBeLessThan(0.1);
});
