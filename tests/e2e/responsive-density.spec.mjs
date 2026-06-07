import { test, expect } from "@playwright/test";

const SETTINGS_KEY = "mushaf-plus-settings";

async function seedReadingState(page) {
  await page.addInitScript((key) => {
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          splashDone: true,
          showHome: false,
          showDuas: false,
          sidebarOpen: false,
          displayMode: "surah",
          mushafLayout: "list",
          lang: "fr",
          riwaya: "hafs",
          fontFamily: "qpc-hafs",
          quranFontSize: 34,
          lastPosition: {
            surah: 3,
            ayah: 1,
            page: 50,
            juz: 3,
          },
        }),
      );
    } catch {
      // The visible assertions below will fail if the state cannot be seeded.
    }
  }, SETTINGS_KEY);
}

async function openReader(page, viewport) {
  await seedReadingState(page);
  await page.setViewportSize(viewport);
  await page.goto("/surah/3");
  await expect(page.locator(".mp-header").first()).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".quran-display--platform").first()).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".qc-ayah-text-ar").first()).toBeVisible({ timeout: 30_000 });
}

async function box(page, selector) {
  return page.locator(selector).first().boundingBox();
}

async function overflowX(page) {
  return page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth));
}

test("mobile density: header, reading toolbar and audio dock fit without horizontal overflow", async ({ page }) => {
  await openReader(page, { width: 390, height: 844 });

  const header = await box(page, ".mp-header");
  const toolbar = await box(page, ".qc-reader-toolbar");
  const audioDock = await box(page, ".mp-audio-player--mobile.mp-audio-player--dock");
  const firstAction = await box(page, ".mp-header__icon-btn");

  expect(header?.height || 0).toBeLessThanOrEqual(62);
  expect(toolbar?.height || 0).toBeLessThanOrEqual(190);
  expect(audioDock?.height || 0).toBeLessThanOrEqual(118);
  expect(firstAction?.width || 0).toBeGreaterThanOrEqual(38);
  expect(firstAction?.height || 0).toBeGreaterThanOrEqual(38);
  expect(await overflowX(page)).toBeLessThanOrEqual(2);
});

test("tablet density: header controls and audio options modal remain compact", async ({ page }) => {
  await openReader(page, { width: 820, height: 920 });

  const header = await box(page, ".mp-header");
  const toolbar = await box(page, ".qc-reader-toolbar");

  expect(header?.height || 0).toBeLessThanOrEqual(68);
  expect(toolbar?.height || 0).toBeLessThanOrEqual(180);
  expect(await overflowX(page)).toBeLessThanOrEqual(2);

  const optionsTrigger = page.locator(".mp-player-options-trigger").first();
  if (await optionsTrigger.isVisible().catch(() => false)) {
    await optionsTrigger.click();
    const modal = page.locator(".audio-player-modal__surface--settings").first();
    await expect(modal).toBeVisible();
    const modalBox = await modal.boundingBox();
    expect(modalBox?.width || 0).toBeLessThanOrEqual(820);
    expect(modalBox?.height || 0).toBeLessThanOrEqual(860);
  }
});
