import { expect, test } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";

// Al-Baqarah is six pages of fifty verses on Quran.com. The first page is
// readable as soon as it lands; the other five arrive later in these tests.
const TOTAL_VERSES = 286;
const OTHER_PAGES_DELAY_MS = 5000;

function verse(number) {
  const text = `آية ${number} ٱلْحَمْدُ لِلَّهِ`;
  return {
    id: number,
    chapter_id: 2,
    verse_key: `2:${number}`,
    verse_number: number,
    page_number: 2 + Math.floor(number / 20),
    juz_number: 1,
    hizb_number: 1,
    rub_el_hizb_number: 1,
    text_uthmani: text,
    text_uthmani_tajweed: text,
    text_indopak: text,
    text_qpc_hafs: text,
    words: [
      { id: number * 10 + 1, position: 1, text_uthmani: "ٱلْحَمْدُ", text_qpc_hafs: "ٱلْحَمْدُ", char_type_name: "word", line_number: 3 },
      { id: number * 10 + 2, position: 2, text_uthmani: "لِلَّهِ", text_qpc_hafs: "لِلَّهِ", char_type_name: "word", line_number: 3 },
    ],
  };
}

async function installSlowSurah(page) {
  await installQuranNetworkFixtures(page);
  const state = { released: false };
  await page.route(
    (url) => url.hostname === "api.quran.com" && url.pathname.endsWith("/verses/by_chapter/2"),
    async (route) => {
      const pageNumber = Number(new URL(route.request().url()).searchParams.get("page") || 1);
      if (pageNumber > 1) {
        await new Promise((resolve) => setTimeout(resolve, OTHER_PAGES_DELAY_MS));
        state.released = true;
      }
      const from = (pageNumber - 1) * 50 + 1;
      const to = Math.min(pageNumber * 50, TOTAL_VERSES);
      await route.fulfill({
        json: {
          verses: Array.from({ length: Math.max(0, to - from + 1) }, (_, index) => verse(from + index)),
          pagination: { current_page: pageNumber, total_pages: 6 },
        },
      });
    },
  );
  return state;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "mushaf-plus-settings",
      JSON.stringify({
        skipSplashAnimation: true,
        lang: "fr",
        riwaya: "hafs",
        mushafLayout: "list",
        showTranslation: false,
        lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 },
      }),
    );
  });
});

test("the first fifty verses are readable before the other pages arrive", async ({ page }) => {
  const state = await installSlowSurah(page);
  await page.goto("/surah/2");

  const firstVerse = page.locator('[data-ayah-number="1"] .qc-ayah-text-ar').first();
  await expect(firstVerse).toBeVisible({ timeout: 4000 });
  expect(state.released, "verse 1 was shown while the other pages were still pending").toBe(false);
  // Only the first page is in the list; a loading placeholder follows it.
  expect(await page.locator("[data-ayah-number]").count()).toBeLessThanOrEqual(50);
  await expect(page.locator(".quran-display")).toHaveAttribute("aria-busy", "true");

  // Then the rest is appended without replacing what the reader is looking at.
  await expect.poll(() => page.locator("[data-ayah-number]").count(), { timeout: 20_000 }).toBe(TOTAL_VERSES);
  await expect(page.locator(".quran-display")).toHaveAttribute("aria-busy", "false");
  await expect(page.locator('[data-ayah-number="1"] .qc-ayah-text-ar').first()).toBeVisible();
});

test("a link to a verse past the first page waits for the whole surah", async ({ page }) => {
  const state = await installSlowSurah(page);
  await page.goto("/surah/2/120");

  await page.waitForTimeout(1500);
  expect(state.released).toBe(false);
  // Nothing to land on yet: no half-list that the view would have to jump from.
  expect(await page.locator("[data-ayah-number]").count()).toBe(0);

  await expect.poll(() => page.locator("[data-ayah-number]").count(), { timeout: 20_000 }).toBe(TOTAL_VERSES);
});
