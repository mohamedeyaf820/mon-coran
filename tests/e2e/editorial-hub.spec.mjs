import { expect, test } from "@playwright/test";

const SETTINGS_KEY = "mushaf-plus-settings";

async function openHome(page, viewport) {
  await page.addInitScript((key) => {
    localStorage.setItem(key, JSON.stringify({
      skipSplashAnimation: true,
      showHome: true,
      showDuas: false,
      sidebarOpen: false,
      lang: "fr",
      theme: "light",
      riwaya: "hafs",
    }));
  }, SETTINGS_KEY);
  await page.setViewportSize(viewport);
  await page.goto("/");
  await expect(page.locator(".app-view-home")).toBeVisible({ timeout: 30_000 });
}

test("footer and surah directory remain usable on a phone", async ({ page }) => {
  await openHome(page, { width: 375, height: 812 });
  const footer = page.locator(".mp-footer-v2");
  await footer.scrollIntoViewIfNeeded();
  await expect(footer.locator(".mp-footer-v2__legal a")).toHaveCount(5);
  await expect(footer.locator(".mp-footer-v2__brand")).toHaveText("MushafPlus");
  expect(await footer.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);

  await footer.getByRole("link", { name: "Liste des sourates" }).click();
  await expect(page).toHaveURL(/\/surahs$/);
  await expect(page.locator(".surah-directory__grid li")).toHaveCount(114);
  await expect(page.getByRole("button", { name: "Liste des sourates" })).toHaveAttribute("aria-current", "page");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(await page.locator(".surah-directory__grid").evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(" ").length)).toBe(1);

  await page.getByRole("button", { name: "Médinoises" }).click();
  await expect(page.locator(".surah-directory__grid li")).toHaveCount(28);
});

test("editorial navigation exposes complete project information", async ({ page }) => {
  await openHome(page, { width: 1280, height: 900 });
  await page.locator(".mp-footer-v2").scrollIntoViewIfNeeded();
  await page.getByRole("link", { name: "À propos" }).last().click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole("heading", { name: /compagnon de lecture/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Responsable du projet" })).toBeVisible();
  await expect(page.getByRole("link", { name: /projet sur GitHub/i })).toBeVisible();

  await page.getByRole("button", { name: "Sources" }).click();
  await expect(page).toHaveURL(/\/sources$/);
  await expect(page.locator(".legal-page__attribution-item")).toHaveCount(7);
  await expect(page.getByRole("heading", { name: /sources nommées/i })).toBeVisible();
});
