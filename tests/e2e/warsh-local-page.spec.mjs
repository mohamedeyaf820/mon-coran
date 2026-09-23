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
