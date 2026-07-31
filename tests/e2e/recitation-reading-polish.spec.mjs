import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

const SETTINGS_KEY = "mushaf-plus-settings";
const OUTPUT_DIR = path.join("test-results", "recitation-reading-polish");

async function seed(page, overrides = {}) {
  await page.addInitScript(
    ({ key, overrides }) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          skipSplashAnimation: true,
          showHome: false,
          showDuas: false,
          sidebarOpen: false,
          displayMode: "surah",
          mushafLayout: "list",
          lang: "fr",
          riwaya: "hafs",
          fontFamily: "qpc-hafs",
          quranFontSize: 34,
          showTranslation: false,
          lastPosition: { surah: 1, ayah: 1, page: 1, juz: 1 },
          ...overrides,
        }),
      );
    },
    { key: SETTINGS_KEY, overrides },
  );
}

async function horizontalOverflow(page) {
  return page.evaluate(() =>
    Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
  );
}

test("opening animation preloads the reciter library before the first click", async ({
  page,
}) => {
  await seed(page, { showHome: true, skipSplashAnimation: false });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.locator(".splash-screen")).toBeVisible();
  await expect(page.locator(".splash-screen")).toBeHidden({ timeout: 6_000 });
  await expect
    .poll(() =>
      page.evaluate(() =>
        performance
          .getEntriesByType("resource")
          .some((entry) => entry.name.includes("/data/reciter-profiles.json")),
      ),
    )
    .toBe(true);

  await page.evaluate(() => {
    window.__reciterFallbackSeen = false;
    window.__reciterFallbackObserver = new MutationObserver(() => {
      if (document.querySelector(".reciter-detail--loading")) {
        window.__reciterFallbackSeen = true;
      }
    });
    window.__reciterFallbackObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });

  const recitationsTab = page
    .getByRole("tab")
    .filter({ hasText: /citations/i })
    .first();
  await expect(recitationsTab).toBeVisible();
  await recitationsTab.click();
  const firstCard = page.locator('[data-reciter-card="true"]').first();
  await expect(firstCard).toBeVisible();
  await firstCard.locator(".reciter-card__main").click();
  await expect(page.locator(".reciter-detail:not(.reciter-detail--loading)")).toBeVisible();

  const fallbackSeen = await page.evaluate(() => {
    window.__reciterFallbackObserver?.disconnect();
    return window.__reciterFallbackSeen;
  });
  expect(fallbackSeen).toBe(false);
});

test("mobile recitation collection and reciter library stay clear and valid", async ({
  page,
}) => {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  await seed(page, { showHome: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.locator(".app-view-home")).toBeVisible({ timeout: 30_000 });
  await page.getByRole("tab", { name: "Récitations" }).click();
  await expect(page.locator('[data-reciter-card="true"]').first()).toBeVisible();
  expect(
    await page
      .getByRole("button", { name: "Tous", exact: true })
      .evaluate((node) => getComputedStyle(node).backgroundColor),
  ).not.toBe("rgba(0, 0, 0, 0)");

  expect(
    await page.locator('[data-reciter-card="true"] button button').count(),
  ).toBe(0);
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(2);

  const firstCard = page.locator('[data-reciter-card="true"]').first();
  const cardBox = await firstCard.boundingBox();
  const favoriteBox = await firstCard.locator(".reciter-card__favorite").boundingBox();
  expect(cardBox?.width || 0).toBeLessThanOrEqual(390);
  expect(favoriteBox?.width || 0).toBeGreaterThanOrEqual(40);
  expect(favoriteBox?.height || 0).toBeGreaterThanOrEqual(40);

  await page.screenshot({
    path: path.join(OUTPUT_DIR, "mobile-recitation-collection.png"),
    fullPage: true,
  });
  await firstCard.scrollIntoViewIfNeeded();
  await page.waitForTimeout(180);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "mobile-recitation-cards.png"),
  });
  await firstCard.screenshot({ path: path.join(OUTPUT_DIR, "mobile-reciter-card.png") });
  await firstCard.locator(".reciter-card__main").click();

  const modal = page.locator(".reciter-detail");
  await expect(modal).toBeVisible();
  await expect(modal.locator(".reciter-detail__source-row").first()).toContainText(
    "EveryAyah",
  );
  await expect(modal.locator(".reciter-detail__source-row").last()).toContainText(
    "Quran.com",
  );
  const modalBox = await modal.boundingBox();
  expect(modalBox?.x || 0).toBeGreaterThanOrEqual(0);
  expect(modalBox?.y || 0).toBeGreaterThanOrEqual(0);
  expect((modalBox?.x || 0) + (modalBox?.width || 0)).toBeLessThanOrEqual(391);
  expect((modalBox?.y || 0) + (modalBox?.height || 0)).toBeLessThanOrEqual(845);
  const overlayBox = await page.locator(".reciter-detail-overlay").boundingBox();
  expect(overlayBox?.y || 0).toBe(0);
  expect(overlayBox?.height || 0).toBeLessThanOrEqual(845);
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(2);

  const librarySearch = page.getByRole("textbox", {
    name: "Rechercher une sourate",
  });
  await expect(librarySearch).toBeVisible();
  await librarySearch.fill("Fatiha");
  await expect(page.locator(".recitation-row")).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Écouter — L'Ouverture (1)" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ouvrir dans le lecteur — L'Ouverture (1)" }),
  ).toBeVisible();
  await modal.screenshot({ path: path.join(OUTPUT_DIR, "mobile-reciter-library.png") });
});

test("desktop reciter library keeps biography and surahs in a balanced layout", async ({
  page,
}) => {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  await seed(page, { showHome: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  await expect(page.locator(".app-view-home")).toBeVisible({ timeout: 30_000 });
  await page.getByRole("tab", { name: "Récitations" }).click();
  const firstCard = page.locator('[data-reciter-card="true"]').first();
  await expect(firstCard).toBeVisible();
  await firstCard.locator(".reciter-card__main").click();

  const modal = page.locator(".reciter-detail");
  await expect(modal).toBeVisible();
  await expect(modal).toHaveAttribute("role", "dialog");
  await expect(modal).toHaveAttribute("aria-modal", "true");
  const bioToggle = modal.getByRole("button", { name: "Voir plus" });
  await expect(bioToggle).toHaveAttribute("aria-expanded", "false");
  await bioToggle.click();
  await expect(modal.getByRole("button", { name: "Voir moins" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  const modalBox = await modal.boundingBox();
  const layoutColumns = await page
    .locator(".reciter-detail__layout")
    .evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(" ").length);
  expect(modalBox?.width || 0).toBeLessThanOrEqual(920);
  expect(modalBox?.height || 0).toBeLessThanOrEqual(900);
  expect(layoutColumns).toBe(2);
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(2);
  await modal.screenshot({
    path: path.join(OUTPUT_DIR, "desktop-reciter-library.png"),
  });
});

test("reader interactions do not trigger a React update loop", async ({ page }) => {
  const renderLoopWarnings = [];
  page.on("console", (message) => {
    if (/Maximum update depth exceeded/i.test(message.text())) {
      renderLoopWarnings.push(message.text());
    }
  });

  await seed(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/surah/1");
  await expect(page.locator(".srh-root")).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Mushaf", exact: true }).click();
  await expect(page.locator(".quran-mode-pane--mushaf")).toBeVisible();
  await page.getByRole("button", { name: "Liste", exact: true }).click();
  await expect(page.locator(".quran-mode-pane--mushaf")).toHaveCount(0);
  await page.waitForTimeout(250);

  expect(renderLoopWarnings).toEqual([]);
});

for (const mode of ["page", "juz"]) {
  test(`mobile ${mode} mode uses compact context and typography disclosure`, async ({
    page,
  }) => {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const isPage = mode === "page";
    await seed(page, {
      displayMode: mode,
      lastPosition: { surah: 1, ayah: 1, page: 1, juz: 1 },
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(isPage ? "/page/1" : "/juz/1");

    const context = page.locator(".reader-context-card");
    await expect(context).toBeVisible({ timeout: 30_000 });
    await expect(context).toContainText(isPage ? "Page" : "Juz");
    await expect(page.locator(".reader-typography-trigger")).toBeVisible();
    await expect(page.locator(".reader-typography-panel")).toBeHidden();
    await expect(page.locator(".reader-mode-nav")).toBeVisible();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(2);

    await page.locator(".reader-typography-trigger").click();
    await expect(page.locator(".reader-typography-panel")).toBeVisible();
    await expect(page.locator(".reader-typography-panel .afc-select")).toBeVisible();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(2);

    await context.screenshot({
      path: path.join(OUTPUT_DIR, `mobile-${mode}-context.png`),
    });
  });
}
