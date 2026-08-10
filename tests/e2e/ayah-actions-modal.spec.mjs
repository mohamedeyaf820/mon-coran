import { expect, test } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";

const SETTINGS_KEY = "mushaf-plus-settings";

test("verse actions open as a compact, usable mobile sheet", async ({ page }) => {
  await installQuranNetworkFixtures(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript((settingsKey) => {
    window.localStorage.setItem(
      settingsKey,
      JSON.stringify({
        lang: "fr",
        theme: "dark",
        riwaya: "hafs",
        reciter: "ar.alafasy",
        showHome: false,
        displayMode: "surah",
        mushafLayout: "mushaf",
      }),
    );
  }, SETTINGS_KEY);

  await page.goto("/surah/8");
  const firstVerse = page.getByRole("button", { name: "Verset 1" }).first();
  await expect(firstVerse).toBeVisible({ timeout: 20_000 });
  await firstVerse.click();

  const dialog = page.locator(".ayah-actions-modal[role='dialog']");
  const panel = dialog.locator(".ayah-actions-modal__panel");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".ayah-action-card")).toHaveCount(3);
  await expect(dialog.locator(".ayah-actions__grid")).toHaveCSS(
    "grid-template-columns",
    /^\d+(?:\.\d+)?px \d+(?:\.\d+)?px$/,
  );
  await expect(dialog.getByRole("button", { name: /couter$/ })).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Favori/ })).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Plus d.actions/ })).toBeVisible();
  // Browsers may report either the identity matrix or "none" — both mean no translation.
  const panelTransform = await panel.evaluate((el) => getComputedStyle(el).transform);
  expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(panelTransform);

  const panelBox = await panel.boundingBox();
  expect(panelBox?.y).toBeGreaterThanOrEqual(0);
  expect((panelBox?.y || 0) + (panelBox?.height || 0)).toBeLessThanOrEqual(844);

  const badges = dialog.locator(".ayah-actions__badge");
  await expect(badges.first()).toHaveCSS("display", "flex");
  await expect(badges.first()).toHaveCSS("white-space", "nowrap");
  const firstBadgeBox = await badges.nth(0).boundingBox();
  expect(firstBadgeBox?.height || 0).toBeGreaterThan(20);

  await dialog.getByRole("button", { name: "Favori" }).click();
  await expect(dialog.getByRole("button", { name: "Favori" })).toHaveAttribute("aria-pressed", "true");

  await page.screenshot({
    path: "test-results/ayah-actions-modal-mobile.png",
    fullPage: false,
  });
});

test("verse sharing creates and shares a real PNG card", async ({ page }) => {
  await installQuranNetworkFixtures(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript((settingsKey) => {
    window.localStorage.setItem(
      settingsKey,
      JSON.stringify({
        lang: "fr",
        theme: "dark",
        riwaya: "hafs",
        reciter: "ar.alafasy",
        showHome: false,
        displayMode: "surah",
        mushafLayout: "mushaf",
      }),
    );
    window.__sharedImage = null;
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (payload) => {
        const file = payload.files?.[0];
        const bytes = file ? new Uint8Array(await file.arrayBuffer()) : [];
        window.__sharedImage = {
          type: file?.type,
          name: file?.name,
          size: file?.size,
          signature: Array.from(bytes.slice(0, 4)),
          includesText: Boolean(payload.text),
        };
      },
    });
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: (payload) => payload.files?.[0]?.type === "image/png",
    });
  }, SETTINGS_KEY);

  await page.goto("/surah/8");
  await page.getByRole("button", { name: "Verset 1" }).first().click();

  const actionsDialog = page.locator(".ayah-actions-modal[role='dialog']");
  await actionsDialog.getByRole("button", { name: /Plus d.actions/ }).click();
  await page.getByRole("menuitem", { name: "Partager en image" }).click();

  const studio = page.getByRole("dialog", { name: "Partager le verset en image" });
  await expect(studio).toBeVisible();
  await expect(studio.locator(".share-studio__preview-frame img")).toBeVisible();
  await expect(studio.locator(".share-format-picker button")).toHaveCount(3);
  await expect(studio.locator(".share-theme-picker button")).toHaveCount(3);
  await expect(studio.locator(".share-studio__quick-setting")).toBeVisible();
  await expect(studio.locator("textarea, .share-editor")).toHaveCount(0);
  await page.screenshot({
    path: "test-results/verse-share-studio-mobile.png",
    fullPage: false,
  });

  await page.setViewportSize({ width: 768, height: 900 });
  await expect(studio.locator(".share-studio__workspace")).toHaveCSS(
    "grid-template-columns",
    /^\d+(?:\.\d+)?px$/,
  );
  await page.screenshot({
    path: "test-results/verse-share-studio-tablet.png",
    fullPage: false,
  });

  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(studio.locator(".share-studio__workspace")).toHaveCSS(
    "grid-template-columns",
    /^\d+(?:\.\d+)?px \d+(?:\.\d+)?px$/,
  );
  const studioBox = await studio.boundingBox();
  expect(studioBox?.width || 0).toBeLessThanOrEqual(880);
  await page.screenshot({
    path: "test-results/verse-share-studio-desktop.png",
    fullPage: false,
  });

  await studio.getByRole("button", { name: "Partager l’image" }).click();
  await expect.poll(() => page.evaluate(() => window.__sharedImage)).not.toBeNull();
  const shared = await page.evaluate(() => window.__sharedImage);
  expect(shared.type).toBe("image/png");
  expect(shared.name).toMatch(/^mushafplus-8-1-square\.png$/);
  expect(shared.size).toBeGreaterThan(10_000);
  expect(shared.signature).toEqual([137, 80, 78, 71]);
  expect(shared.includesText).toBe(false);
});
