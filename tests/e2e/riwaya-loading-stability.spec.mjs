import { test, expect } from "@playwright/test";

const SETTINGS_KEY = "mushaf-plus-settings";

function quranComVerses(count = 7, juz = 1, surah = 1) {
  return Array.from({ length: count }, (_, index) => ({
    id: surah * 1000 + index + 1,
    chapter_id: surah,
    verse_key: `${surah}:${index + 1}`,
    verse_number: index + 1,
    page_number: 1,
    juz_number: juz,
    text_uthmani: `نَصُّ حَفْصٍ التَّجْرِيبِيُّ ${index + 1}`,
    text_qpc_hafs: `نَصُّ حَفْصٍ التَّجْرِيبِيُّ ${index + 1}`,
    words: [],
  }));
}

function warshVerses(count = 7, surah = 1) {
  return Array.from({ length: count }, (_, index) => ({
    sura_no: surah,
    aya_no: index + 1,
    aya_text: `نَصُّ وَرْشٍ التَّجْرِيبِيُّ ${index + 1}`,
  }));
}

async function seedReader(page, overrides = {}) {
  await page.addInitScript(
    ({ key, overrides }) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          skipSplashAnimation: true,
          showHome: false,
          showDuas: false,
          showTranslation: false,
          sidebarOpen: false,
          displayMode: "surah",
          mushafLayout: "list",
          lang: "fr",
          riwaya: "hafs",
          fontFamily: "qpc-hafs",
          lastPosition: { surah: 1, ayah: 1, page: 1, juz: 1 },
          ...overrides,
        }),
      );
    },
    { key: SETTINGS_KEY, overrides },
  );
}

async function mockQuranComScope(page, scope, handler) {
  await page.route(
    (url) =>
      url.hostname === "api.quran.com" &&
      url.pathname.endsWith(`/verses/${scope}`),
    handler,
  );
}

async function mockWarshSurah(page, surah, handler) {
  const paddedSurah = String(surah).padStart(3, "0");
  await page.route(
    (url) => url.pathname.endsWith(`/warsh_text/${paddedSurah}.json`),
    handler,
  );
}

test("a riwaya switch stays atomic until the requested text is ready", async ({ page }) => {
  const surah = 104;
  const ayahCount = 9;
  await seedReader(page, {
    lastPosition: { surah, ayah: 1, page: 601, juz: 30 },
  });
  await page.setViewportSize({ width: 1280, height: 900 });

  await mockQuranComScope(page, `by_chapter/${surah}`, (route) =>
    route.fulfill({
      json: {
        verses: quranComVerses(ayahCount, 30, surah),
        pagination: { total_pages: 1 },
      },
    }),
  );

  let releaseWarsh;
  const warshGate = new Promise((resolve) => {
    releaseWarsh = resolve;
  });
  await mockWarshSurah(page, surah, async (route) => {
    await warshGate;
    await route.fulfill({ json: warshVerses(ayahCount, surah) });
  });

  await page.goto(`/surah/${surah}/1`);
  await expect(page.locator(".qc-ayah-text-ar").first()).toBeVisible();

  await page.getByRole("button", { name: "Changer de riwaya" }).click();
  await expect(page.locator('.app-root[data-riwaya="hafs"]')).toBeVisible();
  await expect(page.locator(".ayah-skeleton-list")).toHaveCount(0);
  await expect(page.locator(".qc-ayah-text-ar").first()).toBeVisible();

  releaseWarsh();
  await expect(page.locator(".quran-display--warsh")).toBeVisible();
  await expect(page.locator(".qc-ayah-text-ar").first()).toContainText("وَرْشٍ");

  await page.keyboard.press("w");
  await expect(page.locator(".quran-display--word-by-word")).toHaveCount(0);

  const readerTools = page.locator(".srh-identity__disclosure:visible").first();
  await expect(readerTools).toBeVisible();
  if ((await readerTools.getAttribute("aria-expanded")) !== "true") {
    await readerTools.focus();
    await readerTools.press("Enter");
  }
  // Warsh riwaya must not expose a word-by-word study toggle
  await expect(
    page.locator(".srh-study-toggles button[aria-label*='Mot à mot'], .srh-study-toggles button[aria-label*='Word by word']"),
  ).toHaveCount(0);
});

test("surah arrows keep the current text visible until the neighbour is ready", async ({
  page,
}) => {
  const currentSurah = 104;
  const nextSurah = 105;
  await seedReader(page, {
    lastPosition: { surah: currentSurah, ayah: 1, page: 601, juz: 30 },
  });
  await page.setViewportSize({ width: 1280, height: 900 });

  await mockQuranComScope(page, `by_chapter/${currentSurah}`, (route) =>
    route.fulfill({
      json: {
        verses: quranComVerses(9, 30, currentSurah),
        pagination: { total_pages: 1 },
      },
    }),
  );

  let releaseNextSurah;
  const nextSurahGate = new Promise((resolve) => {
    releaseNextSurah = resolve;
  });
  await mockQuranComScope(page, `by_chapter/${nextSurah}`, async (route) => {
    await nextSurahGate;
    await route.fulfill({
      json: {
        verses: quranComVerses(5, 30, nextSurah),
        pagination: { total_pages: 1 },
      },
    });
  });

  await page.goto(`/surah/${currentSurah}/1`);
  await expect(page.locator(".qc-ayah-text-ar").first()).toBeVisible();

  await page.locator(".mp-header__nav-arrow").last().click();
  await expect(page).toHaveURL(new RegExp(`/surah/${currentSurah}(?:/1)?$`));
  await expect(page.locator(".ayah-skeleton-list")).toHaveCount(0);
  await expect(page.locator(".qc-ayah-text-ar").first()).toBeVisible();

  releaseNextSurah();
  await expect(page).toHaveURL(new RegExp(`/surah/${nextSurah}$`));
  await expect(page.locator('.quran-display[aria-busy="false"]')).toBeVisible();
  await expect(page.locator(".qc-ayah-text-ar").first()).toBeVisible();
});

test("Warsh juz loading uses scoped surah files before the legacy full Quran", async ({ page }) => {
  const surah = 67;
  const ayahCount = 30;
  const juz = 29;
  await seedReader(page, {
    displayMode: "juz",
    riwaya: "warsh",
    fontFamily: "qpc-warsh",
    lastPosition: { surah, ayah: 1, page: 562, juz },
  });
  await page.setViewportSize({ width: 1280, height: 900 });

  await mockQuranComScope(page, `by_juz/${juz}`, (route) =>
    route.fulfill({
      json: {
        verses: quranComVerses(ayahCount, juz, surah),
        pagination: { total_pages: 1 },
      },
    }),
  );
  await mockWarshSurah(page, surah, (route) =>
    route.fulfill({ json: warshVerses(ayahCount, surah) }),
  );

  let legacyRequestCount = 0;
  await page.route(
    (url) => url.pathname.endsWith("/warshData_v2-1.json"),
    (route) => {
      legacyRequestCount += 1;
      return route.fulfill({ json: [] });
    },
  );

  await page.goto(`/juz/${juz}`);
  await expect(page.locator(".quran-display--warsh")).toBeVisible();
  await expect(page.locator(".qc-ayah-text-ar").first()).toContainText("وَرْشٍ");
  expect(legacyRequestCount).toBe(0);
});
