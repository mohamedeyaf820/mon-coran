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
  await expect(footer.locator(".mp-footer-v2__nav-btn")).toHaveCount(4);
  await expect(footer.locator(".mp-footer-v2__verse-translation")).toBeVisible();
  await expect(footer.locator(".mp-footer-v2__legal a")).toHaveCount(4);
  await expect(footer.locator(".mp-footer-v2__brand")).toHaveText("MushafPlus");
  expect(await footer.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
});

test("home hero separates the promise from the next reading without crowding small screens", async ({ page }) => {
  await openHome(page, { width: 642, height: 698 });
  await expect(page.getByRole("heading", { name: "Lire, écouter et comprendre le Coran" })).toBeVisible();
  await expect(page.locator(".home-resume-panel__primary")).toBeVisible();
  await expect(page.getByRole("button", { name: "Invocations" })).toBeVisible();

  const desktopishLayout = await page.evaluate(() => {
    const title = document.querySelector(".home-resume-panel h1").getBoundingClientRect();
    const target = document.querySelector(".home-resume-panel__target").getBoundingClientRect();
    return { titleRight: title.right, targetLeft: target.left };
  });
  expect(desktopishLayout.targetLeft).toBeGreaterThanOrEqual(desktopishLayout.titleRight - 1);

  await page.setViewportSize({ width: 320, height: 698 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(2);
  expect((await page.locator(".home-resume-panel").boundingBox())?.height || 0).toBeLessThanOrEqual(360);
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
  await expect(page.locator(".legal-page__attribution-item")).toHaveCount(8);
  await expect(page.getByRole("heading", { name: /sources nommées/i })).toBeVisible();
});

test("about page is compact on mobile and prepares a complete correction report", async ({ page }) => {
  await openHome(page, { width: 423, height: 698 });
  await page.goto("/about");
  await expect(page.locator(".legal-page")).toBeVisible({ timeout: 30_000 });

  const grid = page.locator(".legal-page__grid");
  expect(await grid.evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(" ").length)).toBe(1);
  expect(await page.locator(".legal-page").evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);

  const repositoryLink = page.getByRole("link", { name: /projet sur GitHub/i });
  await expect(repositoryLink).toHaveAttribute("href", "https://github.com/mohamedeyaf820/mon-coran");

  await page.evaluate(() => {
    window.open = (url) => {
      window.__mushafPlusIssueUrl = String(url);
      return null;
    };
  });
  await page.getByRole("button", { name: "Signaler une correction", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByLabel("Page ou référence concernée").fill("Sourate 3, verset 7");
  await page.getByLabel("Description").fill("Le marqueur de fin du verset apparaît deux fois sur petit écran.");
  await page.getByRole("button", { name: "Continuer sur GitHub" }).click();

  const issueUrl = new URL(await page.evaluate(() => window.__mushafPlusIssueUrl));
  expect(issueUrl.pathname).toBe("/mohamedeyaf820/mon-coran/issues/new");
  expect(issueUrl.searchParams.get("title")).toContain("Sourate 3, verset 7");
  expect(issueUrl.searchParams.get("body")).toContain("Le marqueur de fin du verset apparaît deux fois");

  await page.getByRole("button", { name: "Revenir à l’accueil" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator(".app-view-home")).toBeVisible();
});
