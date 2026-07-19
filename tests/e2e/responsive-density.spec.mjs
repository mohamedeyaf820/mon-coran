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

async function openDuas(page, viewport) {
  await openHome(page, viewport);
  await page.locator(".mp-header__more").first().click();
  await page.locator('.mp-header-menu__item[data-key="duas"]').click();
  await expect(page.locator(".app-view-duas").first()).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".duas-page").first()).toBeVisible({ timeout: 30_000 });
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

async function openAudioPlayer(page) {
  const compactPlayer = page.getByTestId("audio-player-compact");
  if (await compactPlayer.isVisible().catch(() => false)) {
    await compactPlayer.locator(".mp-player-minimized-open").click();
  }

  const openPlayer = page.getByTestId("audio-player-open");
  await expect(openPlayer).toBeVisible();
  return openPlayer;
}

test("home density: mobile and tablet text, icons and cards scale with viewport", async ({ page }) => {
  await openHome(page, { width: 390, height: 844 });

  expect(await overflowX(page)).toBeLessThanOrEqual(2);
  expect((await box(page, ".mp-header__icon-btn"))?.width || 0).toBeGreaterThanOrEqual(44);
  expect((await box(page, ".mp-header__more"))?.width || 0).toBeGreaterThanOrEqual(44);
  expect(await fontSizePx(page, ".home-hero-title")).toBeLessThanOrEqual(34);
  expect(await fontSizePx(page, ".hp-card-name")).toBeGreaterThanOrEqual(12);
  expect(await fontSizePx(page, ".hp-card-meta")).toBeGreaterThanOrEqual(11);

  await openHome(page, { width: 820, height: 920 });

  expect(await overflowX(page)).toBeLessThanOrEqual(2);
  expect((await box(page, ".mp-header__icon-btn"))?.width || 0).toBeGreaterThanOrEqual(44);
  expect(await fontSizePx(page, ".hp-card-name")).toBeGreaterThanOrEqual(14);
});

test("mobile density: header, reading toolbar and audio player fit without horizontal overflow", async ({ page }) => {
  await openReader(page, { width: 390, height: 844 });

  const header = await box(page, ".mp-header");
  const toolbar = await box(page, ".srh-root");
  const audioDock = await box(page, ".mp-audio-player--mobile");
  const firstAction = await box(page, ".mp-header__icon-btn");
  const settingsButton = await box(page, ".mp-header__more");
  const moreButton = await box(page, ".mp-header__more");
  const typographyTrigger = await box(page, ".srh-typography-trigger");

  expect(header?.height || 0).toBeLessThanOrEqual(62);
  expect(toolbar?.height || 0).toBeLessThanOrEqual(220);
  expect(audioDock?.height || 0).toBeLessThanOrEqual(152);
  expect(firstAction?.width || 0).toBeGreaterThanOrEqual(44);
  expect(firstAction?.height || 0).toBeGreaterThanOrEqual(44);
  expect(settingsButton?.width || 0).toBeGreaterThanOrEqual(44);
  expect(moreButton?.width || 0).toBeGreaterThanOrEqual(44);
  expect(typographyTrigger?.width || 0).toBeGreaterThanOrEqual(44);
  expect(typographyTrigger?.height || 0).toBeGreaterThanOrEqual(44);
  await expect(page.locator(".srh-typography-panel")).toBeHidden();
  await page.locator(".srh-typography-trigger").click();
  await expect(page.locator(".srh-typography-panel")).toBeVisible();
  const fontControls = await box(page, ".srh-root .arabic-font-controls--compact");
  const fontSelect = await box(page, ".srh-root .afc-select");
  const sizeControls = await box(page, ".srh-root .afc-size-group");
  expect(fontControls?.height || 0).toBeGreaterThanOrEqual(38);
  expect(fontSelect?.width || 0).toBeGreaterThanOrEqual(88);
  expect(sizeControls?.width || 0).toBeGreaterThanOrEqual(145);
  await openAudioPlayer(page);
  const audioOptionsButton = await box(page, ".mp-player-options-trigger");
  expect(audioOptionsButton?.width || 0).toBeGreaterThanOrEqual(44);
  expect(audioOptionsButton?.height || 0).toBeGreaterThanOrEqual(44);
  expect(await overflowX(page)).toBeLessThanOrEqual(2);
});

test("mobile surfaces: sidebar, settings drawer and audio modal fit the viewport", async ({ page }) => {
  await openReader(page, { width: 390, height: 844 });

  await page.locator(".mp-header__icon-btn").first().click();
  const sidebar = page.locator(".sb-wrapper").first();
  await expect(sidebar).toBeVisible();
  const sidebarBox = await sidebar.boundingBox();
  const sidebarClose = await box(page, ".sb-wrapper button");
  const sidebarCloseIcon = await box(page, ".sidebar-close-button svg");
  expect(sidebarBox?.width || 0).toBeLessThanOrEqual(390);
  expect(sidebarBox?.height || 0).toBeLessThanOrEqual(844);
  expect(sidebarClose?.width || 0).toBeGreaterThanOrEqual(43.9);
  expect(sidebarClose?.height || 0).toBeGreaterThanOrEqual(43.9);
  expect(sidebarCloseIcon?.width || 0).toBeGreaterThanOrEqual(17);
  expect(sidebarCloseIcon?.height || 0).toBeGreaterThanOrEqual(17);
  await page.locator('.sb-wrapper button[aria-label="Fermer"]').first().click();
  await expect(sidebar).not.toHaveClass(/open/);

  await page.locator(".mp-header__more").first().click();
  await page.getByRole("button", { name: /Paramètres|Settings|الإعدادات/i }).last().click();
  const settingsDrawer = page.locator(".settings-drawer").first();
  await expect(settingsDrawer).toBeVisible();
  const settingsBox = await settingsDrawer.boundingBox();
  const settingsClose = await box(page, '.settings-drawer button[aria-label="Fermer les paramètres"]');
  const settingsCloseIcon = await box(page, ".settings-close-button svg");
  expect(settingsBox?.width || 0).toBeLessThanOrEqual(390);
  expect(settingsBox?.height || 0).toBeLessThanOrEqual(844);
  expect(settingsClose?.width || 0).toBeGreaterThanOrEqual(44);
  expect(settingsClose?.height || 0).toBeGreaterThanOrEqual(44);
  expect(settingsCloseIcon?.width || 0).toBeGreaterThanOrEqual(19);
  expect(settingsCloseIcon?.height || 0).toBeGreaterThanOrEqual(19);
  await page.locator('.settings-drawer button[aria-label="Fermer les paramètres"]').first().click();
  await expect(settingsDrawer).toBeHidden();

  await openAudioPlayer(page);
  await page.locator(".mp-player-options-trigger").first().click();
  const audioModal = page.locator(".audio-player-modal__surface--settings").first();
  await expect(audioModal).toBeVisible();
  const audioModalBox = await audioModal.boundingBox();
  const audioClose = await box(page, ".audio-player-modal__close");
  const audioCloseIcon = await box(page, ".audio-player-modal__close svg");
  expect(audioModalBox?.width || 0).toBeLessThanOrEqual(390);
  expect(audioModalBox?.height || 0).toBeLessThanOrEqual(844);
  expect(audioClose?.width || 0).toBeGreaterThanOrEqual(40);
  expect(audioClose?.height || 0).toBeGreaterThanOrEqual(40);
  expect(audioCloseIcon?.width || 0).toBeGreaterThanOrEqual(17);
  expect(audioCloseIcon?.height || 0).toBeGreaterThanOrEqual(17);
  expect(await overflowX(page)).toBeLessThanOrEqual(2);
});

test("tablet density: header controls and audio options modal remain compact", async ({ page }) => {
  await openReader(page, { width: 820, height: 920 });

  const header = await box(page, ".mp-header");
  const toolbar = await box(page, ".srh-root");
  const settingsButton = await box(page, ".mp-header__more");
  const fontControls = await box(page, ".srh-root .arabic-font-controls--compact");
  await openAudioPlayer(page);
  const audioOptionsButton = await box(page, ".mp-player-options-trigger");

  expect(header?.height || 0).toBeLessThanOrEqual(70);
  expect(toolbar?.height || 0).toBeLessThanOrEqual(280);
  expect(settingsButton?.width || 0).toBeGreaterThanOrEqual(44);
  expect(fontControls?.height || 0).toBeGreaterThanOrEqual(38);
  expect(audioOptionsButton?.width || 0).toBeGreaterThanOrEqual(44);
  expect(audioOptionsButton?.height || 0).toBeGreaterThanOrEqual(44);
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

test("small phone: verse actions and search stay usable inside the viewport", async ({ page }) => {
  const viewport = { width: 320, height: 568 };
  await openReader(page, viewport);

  const reference = await box(page, ".qc-list-card__reference");
  expect(reference?.width || 0).toBeGreaterThanOrEqual(44);
  expect(reference?.height || 0).toBeGreaterThanOrEqual(44);

  const visibleActionSizes = await page
    .locator(".qc-list-card__top .ayah-actions button")
    .evaluateAll((buttons) =>
      buttons
        .filter((button) => button.getClientRects().length > 0)
        .map((button) => {
          const rect = button.getBoundingClientRect();
          return { width: rect.width, height: rect.height };
        }),
    );
  expect(visibleActionSizes.length).toBeGreaterThanOrEqual(3);
  for (const action of visibleActionSizes) {
    expect(action.width).toBeGreaterThanOrEqual(44);
    expect(action.height).toBeGreaterThanOrEqual(44);
  }

  await page.locator(".mp-header__more").first().click();
  await page.locator('.mp-header-menu__item[data-key="search"]').click();

  const overlay = page.locator(".search-pro-overlay").first();
  const searchSurface = page.locator(".search-pro").first();
  await expect(searchSurface).toBeVisible();

  const overlayPosition = await overlay.evaluate((node) => getComputedStyle(node).position);
  const overlayBox = await overlay.boundingBox();
  const searchBox = await searchSurface.boundingBox();
  expect(overlayPosition).toBe("fixed");
  expect(overlayBox?.x || 0).toBeGreaterThanOrEqual(0);
  expect(overlayBox?.y || 0).toBeGreaterThanOrEqual(0);
  expect((overlayBox?.x || 0) + (overlayBox?.width || 0)).toBeLessThanOrEqual(viewport.width + 1);
  expect((overlayBox?.y || 0) + (overlayBox?.height || 0)).toBeLessThanOrEqual(viewport.height + 1);
  expect(searchBox?.x || 0).toBeGreaterThanOrEqual(0);
  expect(searchBox?.y || 0).toBeGreaterThanOrEqual(0);
  expect((searchBox?.x || 0) + (searchBox?.width || 0)).toBeLessThanOrEqual(viewport.width + 1);
  expect((searchBox?.y || 0) + (searchBox?.height || 0)).toBeLessThanOrEqual(viewport.height + 1);
  expect(await overflowX(page)).toBeLessThanOrEqual(2);
});

test("device typography: interface and Quran text scale progressively", async ({ page }) => {
  const samples = [];
  const viewports = [
    { width: 320, height: 568 },
    { width: 768, height: 900 },
    { width: 1366, height: 900 },
    { width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    await openReader(page, viewport);
    samples.push({
      root: await fontSizePx(page, "html"),
      quran: await fontSizePx(page, ".qc-ayah-text-ar"),
    });
    expect(await overflowX(page)).toBeLessThanOrEqual(2);
  }

  expect(samples[0].root).toBeGreaterThanOrEqual(15);
  expect(samples.at(-1).root).toBeLessThanOrEqual(17.1);
  expect(samples[0].quran).toBeGreaterThanOrEqual(24);
  expect(samples.at(-1).quran).toBeGreaterThanOrEqual(34);

  for (let index = 1; index < samples.length; index += 1) {
    expect(samples[index].root).toBeGreaterThanOrEqual(samples[index - 1].root);
    expect(samples[index].quran).toBeGreaterThanOrEqual(samples[index - 1].quran);
  }
});

test("duas page: cards, Arabic text and controls adapt to phone and tablet", async ({ page }) => {
  await openDuas(page, { width: 320, height: 568 });

  expect(await overflowX(page)).toBeLessThanOrEqual(2);
  expect(await fontSizePx(page, ".duas-title")).toBeGreaterThanOrEqual(21);
  expect(await fontSizePx(page, ".dua-arabic")).toBeGreaterThanOrEqual(22);
  const phoneColumns = await page
    .locator(".gallery-grid")
    .first()
    .evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(" ").length);
  expect(phoneColumns).toBe(1);

  const visibleControls = await page.locator(".duas-page button").evaluateAll((buttons) =>
    buttons
      .filter((button) => button.getClientRects().length > 0)
      .slice(0, 8)
      .map((button) => button.getBoundingClientRect().height),
  );
  expect(visibleControls.length).toBeGreaterThan(0);
  for (const height of visibleControls) {
    expect(height).toBeGreaterThanOrEqual(38);
  }

  await openDuas(page, { width: 820, height: 920 });
  expect(await overflowX(page)).toBeLessThanOrEqual(2);
  expect(await fontSizePx(page, ".dua-arabic")).toBeGreaterThanOrEqual(24);
});

test("short landscape: reader search remains fully reachable", async ({ page }) => {
  const viewport = { width: 844, height: 390 };
  await openReader(page, viewport);

  await page.locator(".mp-header__more").first().click();
  await page.locator('.mp-header-menu__item[data-key="search"]').click();
  const overlay = page.locator(".search-pro-overlay").first();
  const searchSurface = page.locator(".search-pro").first();
  await expect(searchSurface).toBeVisible();

  const overlayBox = await overlay.boundingBox();
  const searchBox = await searchSurface.boundingBox();
  expect(await overlay.evaluate((node) => getComputedStyle(node).position)).toBe("fixed");
  expect((overlayBox?.width || 0)).toBeLessThanOrEqual(viewport.width);
  expect((overlayBox?.height || 0)).toBeLessThanOrEqual(viewport.height);
  expect(searchBox?.y || 0).toBeGreaterThanOrEqual(0);
  expect((searchBox?.y || 0) + (searchBox?.height || 0)).toBeLessThanOrEqual(viewport.height + 1);
  expect(await overflowX(page)).toBeLessThanOrEqual(2);
});
