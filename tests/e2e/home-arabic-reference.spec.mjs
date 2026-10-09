import { expect, test } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";

test("the verse of the day names its surah in Arabic in the Arabic interface", async ({ page }) => {
  await installQuranNetworkFixtures(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem(
      "mushaf-plus-settings",
      JSON.stringify({ lang: "ar", theme: "light", riwaya: "hafs", showHome: true, skipSplashAnimation: true }),
    );
  });
  await page.goto("/");
  const reference = page.locator(".home-today-verse__reference");
  await expect(reference).toBeVisible({ timeout: 20_000 });
  const text = (await reference.innerText()).trim();
  expect(text).not.toMatch(/[A-Za-z]/);
  expect(text).toMatch(/[\u0600-\u06FF]/);
  expect(text).toMatch(/[\u0660-\u0669]+:[\u0660-\u0669]+/);
});

test("the verse of the day keeps its Latin reference in French and English", async ({ page }) => {
  await installQuranNetworkFixtures(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem(
      "mushaf-plus-settings",
      JSON.stringify({ lang: "fr", theme: "light", riwaya: "hafs", showHome: true, skipSplashAnimation: true }),
    );
  });
  await page.goto("/");
  await expect(page.locator(".home-today-verse__reference")).toContainText(/\d+:\d+/, { timeout: 20_000 });
});
