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

async function openHome(page, viewport) {
  await page.addInitScript((key) => {
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          splashDone: true,
          showHome: true,
          showDuas: false,
          sidebarOpen: false,
          lang: "fr",
          riwaya: "hafs",
        }),
      );
    } catch {
      // The visible assertions below will fail if the state cannot be seeded.
    }
  }, SETTINGS_KEY);
  await page.setViewportSize(viewport);
  await page.goto("/");
  await expect(page.locator(".mp-header").first()).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".app-view-home").first()).toBeVisible({ timeout: 30_000 });
}

async function box(page, selector) {
  return page.locator(selector).first().boundingBox();
}

async function fontSizePx(page, selector) {
  return page.locator(selector).first().evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize));
}

async function overflowX(page) {
  return page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth));
}

test("home density: mobile and tablet text, icons and cards scale with viewport", async ({ page }) => {
  await openHome(page, { width: 390, height: 844 });

  expect(await overflowX(page)).toBeLessThanOrEqual(2);
  expect((await box(page, ".mp-header__icon-btn"))?.width || 0).toBeGreaterThanOrEqual(38);
  expect((await box(page, ".mp-header__more"))?.width || 0).toBeGreaterThanOrEqual(38);
  expect(await fontSizePx(page, ".home-hero-title")).toBeLessThanOrEqual(34);
  expect(await fontSizePx(page, ".hp-card-name")).toBeGreaterThanOrEqual(12);
  expect(await fontSizePx(page, ".hp-card-meta")).toBeGreaterThanOrEqual(11);

  await openHome(page, { width: 820, height: 920 });

  expect(await overflowX(page)).toBeLessThanOrEqual(2);
  expect((await box(page, ".mp-header__icon-btn"))?.width || 0).toBeGreaterThanOrEqual(40);
  expect(await fontSizePx(page, ".hp-card-name")).toBeGreaterThanOrEqual(14);
});

test("mobile density: header, reading toolbar and audio dock fit without horizontal overflow", async ({ page }) => {
  await openReader(page, { width: 390, height: 844 });

  const header = await box(page, ".mp-header");
  const toolbar = await box(page, ".srh-root");
  const audioDock = await box(page, ".mp-audio-player--mobile.mp-audio-player--dock");
  const firstAction = await box(page, ".mp-header__icon-btn");
  const settingsButton = await box(page, ".mp-header__more");
  const moreButton = await box(page, ".mp-header__more");
  const fontControls = await box(page, ".srh-root .arabic-font-controls--compact");
  const fontSelect = await box(page, ".srh-root .afc-select");
  const sizeControls = await box(page, ".srh-root .afc-size-group");
  const audioOptionsButton = await box(
    page,
    ".mp-audio-player--mobile.mp-audio-player--dock .mp-player-options-trigger",
  );

  expect(header?.height || 0).toBeLessThanOrEqual(62);
  expect(toolbar?.height || 0).toBeLessThanOrEqual(220);
  expect(audioDock?.height || 0).toBeLessThanOrEqual(152);
  expect(firstAction?.width || 0).toBeGreaterThanOrEqual(38);
  expect(firstAction?.height || 0).toBeGreaterThanOrEqual(38);
  expect(settingsButton?.width || 0).toBeGreaterThanOrEqual(38);
  expect(moreButton?.width || 0).toBeGreaterThanOrEqual(38);
  expect(fontControls?.height || 0).toBeGreaterThanOrEqual(38);
  expect(fontSelect?.width || 0).toBeGreaterThanOrEqual(88);
  expect(sizeControls?.width || 0).toBeGreaterThanOrEqual(145);
  expect(audioOptionsButton?.width || 0).toBeGreaterThanOrEqual(35);
  expect(audioOptionsButton?.height || 0).toBeGreaterThanOrEqual(35);
  expect(await overflowX(page)).toBeLessThanOrEqual(2);
});

test("mobile surfaces: sidebar, settings drawer and audio modal fit the viewport", async ({ page }) => {
  await openReader(page, { width: 390, height: 844 });

  await page.locator(".mp-header__icon-btn").first().click();
  const sidebar = page.locator(".sb-wrapper").first();
  await expect(sidebar).toBeVisible();
  const sidebarBox = await sidebar.boundingBox();
  const sidebarClose = await box(page, ".sb-wrapper button");
  expect(sidebarBox?.width || 0).toBeLessThanOrEqual(390);
  expect(sidebarBox?.height || 0).toBeLessThanOrEqual(844);
  expect(sidebarClose?.width || 0).toBeGreaterThanOrEqual(38);
  expect(sidebarClose?.height || 0).toBeGreaterThanOrEqual(38);
  await page.locator('.sb-wrapper button[aria-label="Fermer"]').first().click();
  await expect(sidebar).not.toHaveClass(/open/);

  await page.locator(".mp-header__more").first().click();
  await page.getByRole("button", { name: /Paramètres|Settings|الإعدادات/i }).last().click();
  const settingsDrawer = page.locator(".settings-drawer").first();
  await expect(settingsDrawer).toBeVisible();
  const settingsBox = await settingsDrawer.boundingBox();
  const settingsClose = await box(page, '.settings-drawer button[aria-label="Fermer les paramètres"]');
  expect(settingsBox?.width || 0).toBeLessThanOrEqual(390);
  expect(settingsBox?.height || 0).toBeLessThanOrEqual(844);
  expect(settingsClose?.width || 0).toBeGreaterThanOrEqual(38);
  expect(settingsClose?.height || 0).toBeGreaterThanOrEqual(38);
  await page.locator('.settings-drawer button[aria-label="Fermer les paramètres"]').first().click();
  await expect(settingsDrawer).toBeHidden();

  await page.locator(".mp-player-options-trigger").first().click();
  const audioModal = page.locator(".audio-player-modal__surface--settings").first();
  await expect(audioModal).toBeVisible();
  const audioModalBox = await audioModal.boundingBox();
  expect(audioModalBox?.width || 0).toBeLessThanOrEqual(390);
  expect(audioModalBox?.height || 0).toBeLessThanOrEqual(844);
  expect(await overflowX(page)).toBeLessThanOrEqual(2);
});

test("tablet density: header controls and audio options modal remain compact", async ({ page }) => {
  await openReader(page, { width: 820, height: 920 });

  const header = await box(page, ".mp-header");
  const toolbar = await box(page, ".srh-root");
  const settingsButton = await box(page, ".mp-header__settings");
  const fontControls = await box(page, ".srh-root .arabic-font-controls--compact");
  const audioOptionsButton = await box(page, ".mp-player-options-trigger");

  expect(header?.height || 0).toBeLessThanOrEqual(70);
  expect(toolbar?.height || 0).toBeLessThanOrEqual(280);
  expect(settingsButton?.width || 0).toBeGreaterThanOrEqual(40);
  expect(fontControls?.height || 0).toBeGreaterThanOrEqual(38);
  expect(audioOptionsButton?.width || 0).toBeGreaterThanOrEqual(38);
  expect(audioOptionsButton?.height || 0).toBeGreaterThanOrEqual(38);
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
