import { test, expect } from "@playwright/test";

const verses = [{ id: 1, chapter_id: 1, verse_key: "1:1", verse_number: 1, page_number: 1, juz_number: 1, text_uthmani: "بِسْمِ اللَّهِ" }];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.route("**/api.quran.com/api/v4/verses/**", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ verses: new URL(route.request().url()).searchParams.has("translations") ? verses.map((verse) => ({ ...verse, translations: [{ text: "Au nom d'Allah", resource_name: "Test" }] })) : verses, pagination: { total_pages: 1 } }) }));
  await page.route("**/api.alquran.cloud/v1/search/**", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ code: 200, status: "OK", data: { count: 1, matches: [{ surah: { number: 1 }, numberInSurah: 1, text: "Au nom d'Allah" }] } }) }));
});

test("finds verses and opens a stable reader link", async ({ page }) => {
  await page.goto("/library?tab=search");
  await page.getByLabel("Rechercher dans le Coran").fill("Allah");
  await expect(page.locator(".modern-library-row")).toHaveCount(1);
  await expect(page.locator(".modern-library-row a")).toHaveAttribute("href", "/surah/1/1");
});

test("shows bookmarks and notes created from the reader", async ({ page }) => {
  await page.goto("/surah/1");
  await page.getByRole("button", { name: "Ajouter aux favoris" }).click();
  await page.getByRole("button", { name: "Ajouter une note" }).click();
  await page.getByLabel("Note personnelle").fill("Ma note de lecture");
  await page.getByRole("button", { name: "Enregistrer" }).click();

  await page.goto("/library?tab=bookmarks");
  await expect(page.locator(".modern-library-row")).toHaveCount(1);
  await page.getByRole("button", { name: "Notes" }).click();
  await expect(page.getByText("Ma note de lecture")).toBeVisible();
});

test("library remains usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/library");
  await expect(page.getByRole("navigation", { name: "Bibliotheque" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});
