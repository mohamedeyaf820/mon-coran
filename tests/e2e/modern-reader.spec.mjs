import { test, expect } from "@playwright/test";

const arabic = [
  { id: 1, chapter_id: 1, verse_key: "1:1", verse_number: 1, page_number: 1, juz_number: 1, text_uthmani: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", text_uthmani_tajweed: 'بِسْمِ <tajweed class=ham_wasl>ٱ</tajweed>للَّهِ <tajweed class=ghunnah>الرَّحْمَٰنِ</tajweed> <span class=end>١</span>' },
  { id: 2, chapter_id: 1, verse_key: "1:2", verse_number: 2, page_number: 1, juz_number: 1, text_uthmani: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", text_uthmani_tajweed: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ" },
];

const translated = arabic.map((verse) => ({
  ...verse,
  translations: [{ text: verse.verse_number === 1 ? "Au nom d'Allah, le Tout Misericordieux." : "Louange a Allah, Seigneur de l'univers.", resource_name: "Test FR" }],
}));

const pageThree = [
  { id: 13, chapter_id: 2, verse_key: "2:6", verse_number: 6, page_number: 3, juz_number: 1, text_uthmani: "إِنَّ الَّذِينَ كَفَرُوا" },
  { id: 14, chapter_id: 2, verse_key: "2:7", verse_number: 7, page_number: 3, juz_number: 1, text_uthmani: "خَتَمَ اللَّهُ عَلَىٰ قُلُوبِهِمْ" },
];

test.beforeEach(async ({ page }) => {
  await page.route("**/api.quran.com/api/v4/verses/**", async (route) => {
    const url = new URL(route.request().url());
    const source = url.pathname.includes("/by_page/3") ? pageThree : arabic;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        verses: url.searchParams.has("translations")
          ? source.map((verse) => ({ ...verse, translations: [{ text: "Traduction", resource_name: "Test FR" }] }))
          : source,
        pagination: { total_pages: 1 },
      }),
    });
  });
});

test("reads a surah with translation, tajwid and verse actions", async ({ page }) => {
  await page.goto("/surah/1");
  await expect(page.getByRole("heading", { name: "Al-Fatiha" })).toBeVisible();
  await expect(page.locator(".modern-reader-verse")).toHaveCount(2);
  await expect(page.getByText("Traduction", { exact: true }).first()).toBeVisible();

  const readerStyle = await page.locator(".modern-reader-verse__arabic").first().evaluate((element) => ({
    fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
    selectRadius: Number.parseFloat(getComputedStyle(document.querySelector(".modern-reader-picker select")).borderRadius),
  }));
  expect(readerStyle.fontSize).toBeGreaterThanOrEqual(36);
  expect(readerStyle.selectRadius).toBeGreaterThanOrEqual(11);

  const tajwid = page.getByRole("button", { name: "Tajwid" });
  if (await tajwid.getAttribute("aria-pressed") !== "true") await tajwid.click();
  await expect(page.locator('[data-tajwid="ham-wasl"]')).toBeVisible();
  await expect(page.locator(".modern-reader-verse__arabic").first()).not.toContainText("tajweed class");

  const actionRows = await page.locator(".modern-verse-actions").first().getByRole("button").evaluateAll(
    (buttons) => buttons.map((button) => Math.round(button.getBoundingClientRect().top)),
  );
  expect(new Set(actionRows).size).toBe(1);
  expect(actionRows).toHaveLength(3);

  await page.getByRole("button", { name: "Plus d'options" }).first().click();
  await page.getByRole("menuitem", { name: "Ajouter aux favoris" }).click();

  await page.getByRole("button", { name: "Plus d'options" }).first().click();
  await page.getByRole("menuitem", { name: "Ajouter une note" }).click();
  await page.getByLabel("Note personnelle").fill("A relire attentivement");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByLabel("Note personnelle")).toHaveCount(0);
});

test("switches between page and juz modes", async ({ page }) => {
  await page.goto("/page/1");
  await expect(page.getByRole("heading", { name: "Page 1" })).toBeVisible();
  await expect(page.locator(".modern-mushaf-page")).toBeVisible();
  await expect(page.locator(".modern-reader-verse")).toHaveCount(0);
  await expect(page.locator(".modern-mushaf-ayah")).toHaveCount(2);
  await expect(page.locator(".modern-mushaf-surah")).toContainText("Al-Fatiha");
  await page.getByRole("button", { name: "Verset 1" }).click();
  await expect(page.getByLabel("Verset selectionne 1")).toBeVisible();
  await expect(page.getByLabel("Verset selectionne 1").getByRole("button")).toHaveCount(3);

  await page.getByRole("button", { name: "Juz" }).click();
  await expect(page).toHaveURL(/\/juz\/1$/);
  await expect(page.getByRole("heading", { name: "Juz 1" })).toBeVisible();
});

test("keeps the reader usable on a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/surah/1/2");
  await expect(page.locator("#ayah-1-2")).toHaveClass(/is-target/);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  await page.getByRole("button", { name: "Options", exact: true }).click();
  await expect(page.getByRole("button", { name: "Traduction" })).toBeVisible();
});

test("keeps the mushaf page intact on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/page/1");
  await expect(page.locator(".modern-mushaf-page")).toBeVisible();
  const metrics = await page.locator(".modern-mushaf-page").evaluate((element) => ({
    width: element.getBoundingClientRect().width,
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }));
  expect(metrics.width).toBeLessThanOrEqual(390);
  expect(metrics.overflow).toBe(false);
});

test("only shows basmala at a real surah start and joins regular page verses", async ({ page }) => {
  await page.goto("/page/3");
  await expect(page.locator(".modern-mushaf-basmala")).toHaveCount(0);
  await expect(page.locator(".modern-mushaf-surah")).toHaveCount(0);
  const mushafPage = page.getByRole("region", { name: "Page du Coran 3" });
  await expect(mushafPage).toContainText(pageThree[0].text_uthmani);
  await expect(mushafPage).toContainText(pageThree[1].text_uthmani);
});

test("persists display preferences across reader modes and reloads", async ({ page }) => {
  await page.goto("/surah/1");
  const translation = page.getByRole("button", { name: "Traduction" });
  await expect(translation).toHaveAttribute("aria-pressed", "true");
  await translation.click();
  await expect(page.locator(".modern-reader-verse__translation")).toHaveCount(0);

  await page.getByRole("button", { name: "Page" }).click();
  await expect(page).toHaveURL(/\/page\/1$/);
  await expect(page.getByRole("button", { name: "Traduction" })).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".modern-mushaf-translations")).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("button", { name: "Traduction" })).toHaveAttribute("aria-pressed", "false");

  await page.getByRole("button", { name: "Juz" }).click();
  await expect(page.getByRole("button", { name: "Traduction" })).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".modern-reader-verse__translation")).toHaveCount(0);
});
