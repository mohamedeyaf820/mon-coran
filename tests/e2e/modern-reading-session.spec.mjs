import { expect, test } from "@playwright/test";

const verses = [1, 2, 3].map((number) => ({ id: number, chapter_id: 1, verse_key: `1:${number}`, verse_number: number, page_number: 1, juz_number: 1, text_uthmani: `Texte ${number}` }));

test.beforeEach(async ({ page }) => {
  await page.route("**/api.quran.com/api/v4/verses/**", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ verses, pagination: { total_pages: 1 } }) }));
});

test("records an explicit reading interval from verse 1 to verse 3", async ({ page }) => {
  await page.goto("/surah/1");
  await page.getByRole("button", { name: "Plus d'options" }).first().click();
  await page.getByRole("menuitem", { name: "Commencer ici" }).click();
  await expect(page.getByText("Lecture depuis 1:1")).toBeVisible();
  await page.getByRole("button", { name: "Lu jusqu'ici" }).nth(2).click();
  await expect(page.getByText("1:1 a 1:3 enregistres")).toBeVisible();
});

test("opens reader options as a mobile bottom panel", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/surah/1");
  await expect(page.getByRole("heading", { name: "Al-Fatiha" })).toBeHidden();
  const options = page.getByRole("button", { name: "Options" });
  await options.click();
  await expect(page.getByRole("region", { name: "Navigation de lecture" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Navigation principale" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});
