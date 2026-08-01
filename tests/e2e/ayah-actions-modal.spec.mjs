import { expect, test } from "@playwright/test";

const SETTINGS_KEY = "mushaf-plus-settings";

test("verse actions open as a compact, usable mobile sheet", async ({ page }) => {
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
  await expect(dialog.locator(".ayah-action-card")).toHaveCount(6);
  await expect(dialog.locator(".ayah-actions__grid")).toHaveCSS(
    "grid-template-columns",
    /^\d+(?:\.\d+)?px \d+(?:\.\d+)?px$/,
  );
  await expect(dialog.getByRole("button", { name: /couter$/ })).toBeVisible();
  await expect(dialog.getByRole("button", { name: /tude$/ })).toBeVisible();

  const panelBox = await panel.boundingBox();
  expect(panelBox?.y).toBeGreaterThanOrEqual(0);
  expect((panelBox?.y || 0) + (panelBox?.height || 0)).toBeLessThanOrEqual(844);

  const badges = dialog.locator(".ayah-actions__badge");
  await expect(badges.first()).toHaveCSS("display", "flex");
  await expect(badges.first()).toHaveCSS("white-space", "nowrap");
  const firstBadgeBox = await badges.nth(0).boundingBox();
  const secondBadgeBox = await badges.nth(1).boundingBox();
  expect(Math.abs((firstBadgeBox?.y || 0) - (secondBadgeBox?.y || 0))).toBeLessThan(3);

  await dialog.getByRole("button", { name: "Ajouter aux favoris" }).click();
  await expect(dialog.getByRole("button", { name: "Retirer le favori" })).toBeVisible();

  await page.screenshot({
    path: "test-results/ayah-actions-modal-mobile.png",
    fullPage: false,
  });
});
