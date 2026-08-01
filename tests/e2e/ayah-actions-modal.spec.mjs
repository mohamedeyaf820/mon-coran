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
  await expect(panel).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");

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

test("verse sharing opens every network with the selected verse link", async ({ page }) => {
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
    window.__shareUrls = [];
    window.__copiedVerse = "";
    window.open = (url) => {
      window.__shareUrls.push(String(url));
      return null;
    };
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value) => {
          window.__copiedVerse = String(value);
        },
      },
    });
  }, SETTINGS_KEY);

  await page.goto("/surah/8");
  await page.getByRole("button", { name: "Verset 1" }).first().click();

  const actionsDialog = page.locator(".ayah-actions-modal[role='dialog']");
  const shareSheet = page.locator(".ayah-action-sheet--share");
  const openShareSheet = async () => {
    await actionsDialog.getByRole("button", { name: "Partager", exact: true }).click();
    await expect(shareSheet).toBeVisible();
    const layers = await page.evaluate(() => ({
      modal: Number.parseInt(getComputedStyle(document.querySelector(".ayah-actions-modal")).zIndex, 10),
      sheet: Number.parseInt(getComputedStyle(document.querySelector(".ayah-action-sheet--share")).zIndex, 10),
    }));
    expect(layers.sheet).toBeGreaterThan(layers.modal);
  };

  const destinations = [
    ["WhatsApp", "https://wa.me/"],
    ["Telegram", "https://t.me/share/url"],
    ["X / Twitter", "https://x.com/intent/tweet"],
    ["Facebook", "https://www.facebook.com/sharer/sharer.php"],
    ["Email", "mailto:?subject="],
  ];

  for (const [label, prefix] of destinations) {
    await openShareSheet();
    await shareSheet.getByRole("button", { name: label, exact: true }).click();
    await expect(shareSheet).toBeHidden();
    const opened = await page.evaluate(() => window.__shareUrls.at(-1));
    expect(opened).toMatch(new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    expect(decodeURIComponent(opened)).toContain("/surah/8/1");
  }

  await openShareSheet();
  await shareSheet.getByRole("button", { name: "Texte de partage" }).click();
  const copied = await page.evaluate(() => window.__copiedVerse);
  expect(copied).toContain("https://mushafplus.netlify.app/surah/8/1");
  expect(copied).toContain("8");
});
