import { expect, test } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";
import { openQuickMenuItem } from "./helpers/quick-menu.mjs";

async function open(page, path, { width = 390, height = 844, lang = "fr", theme = "light" } = {}) {
  await page.setViewportSize({ width, height });
  await installQuranNetworkFixtures(page);
  await page.addInitScript(({ lang, theme }) => {
    localStorage.setItem(
      "mushaf-plus-settings",
      JSON.stringify({ skipSplashAnimation: true, lang, theme, riwaya: "hafs", sidebarOpen: false }),
    );
  }, { lang, theme });
  await page.goto(path);
}

const horizontalOverflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

for (const width of [320, 390, 768, 1280]) {
  test(`the four information pages fit a ${width}px screen`, async ({ page }) => {
    await open(page, "/about", { width });
    await expect(page.locator(".legal-page")).toBeVisible({ timeout: 30_000 });
    for (const [tab, heading] of [["À propos", /compagnon/i], ["Confidentialité", /données de lecture/i], ["Mentions légales", /publication/i], ["Sources", /sources nommées/i]]) {
      await page.locator(".legal-page__tabs").getByRole("button", { name: tab, exact: true }).click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
      expect(await horizontalOverflow(page), `${tab} at ${width}px`).toBeLessThanOrEqual(1);
      // Every control of the page switcher stays a full touch target.
      for (const button of await page.locator(".legal-page__tabs button").all()) {
        expect((await button.boundingBox()).height).toBeGreaterThanOrEqual(44);
      }
    }
  });
}

test("privacy lays out what is stored and opens the data settings", async ({ page }) => {
  await open(page, "/privacy");
  await expect(page.locator(".legal-page__glance li")).toHaveCount(3);
  await expect(page.locator(".legal-page__datamap tbody tr")).toHaveCount(6);
  await expect(page.locator(".legal-page__datamap")).toContainText("Cache Storage");
  // Location is disclosed: where it goes and that it is only asked on request.
  await expect(page.locator("#privacy-3")).toContainText("Aladhan");
  await expect(page.locator("#privacy-4")).toContainText("La position n’est demandée que lorsque vous la demandez");

  await page.getByRole("button", { name: "Gérer mes données" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("tab", { name: "Données", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByTestId("offline-downloads")).toBeVisible();
});

test("legal notice names the publisher and sources are grouped with a link each", async ({ page }) => {
  await open(page, "/legal", { width: 1280, height: 900 });
  await expect(page.locator(".legal-page__facts")).toContainText("Mohamed Eyaf");
  await expect(page.locator(".legal-page__facts")).toContainText("mon-coran-kappa.vercel.app");
  await page.locator(".legal-page__tabs").getByRole("button", { name: "Sources", exact: true }).click();
  const groups = page.locator(".legal-page__source-group");
  expect(await groups.count()).toBeGreaterThan(3);
  const links = page.locator(".legal-page__attribution-item a");
  expect(await links.count()).toBeGreaterThan(8);
  for (const link of await links.all()) {
    await expect(link).toHaveAttribute("rel", /noopener/);
    expect((await link.boundingBox()).width).toBeGreaterThanOrEqual(44);
  }
});

test("the contents list jumps to a section on a wide screen and is absent on a phone", async ({ page }) => {
  await open(page, "/privacy", { width: 1280, height: 900 });
  const toc = page.locator(".legal-page__toc");
  await expect(toc).toBeVisible();
  await toc.getByRole("link", { name: /Durée de conservation/ }).click();
  await expect(page.locator("#privacy-6")).toBeInViewport();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(toc).toBeHidden();
});

test("Arabic information pages read right to left without overflow", async ({ page }) => {
  await open(page, "/privacy", { lang: "ar" });
  await expect(page.locator(".legal-page")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".legal-page__datamap tbody tr")).toHaveCount(6, { timeout: 15_000 });
  expect(await page.locator(".app-root").getAttribute("data-dir")).toBe("rtl");
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
});

for (const width of [320, 390, 768, 1280]) {
  test(`the footer groups the project's links and fits ${width}px`, async ({ page }) => {
    await open(page, "/", { width, height: 900 });
    await expect(page.locator(".app-view-home")).toBeVisible({ timeout: 30_000 });
    const footer = page.locator(".mp-footer-v2");
    await footer.scrollIntoViewIfNeeded();
    await expect(footer.locator(".mp-footer-v2__legal a")).toHaveCount(4);
    await expect(footer.locator(".mp-footer-v2__group--popular a")).toHaveCount(7);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
    for (const control of await footer.locator("a, button").all()) {
      if (!(await control.isVisible())) continue;
      expect((await control.boundingBox()).height, await control.innerText()).toBeGreaterThanOrEqual(43);
    }
  });
}

test("a popular surah in the footer opens that surah", async ({ page }) => {
  await open(page, "/", { width: 1280, height: 900 });
  await expect(page.locator(".app-view-home")).toBeVisible({ timeout: 30_000 });
  await page.locator(".mp-footer-v2").scrollIntoViewIfNeeded();
  const link = page.locator(".mp-footer-v2__group--popular a").nth(1);
  await expect(link).toHaveAttribute("href", "/surah/36");
  await link.click();
  await expect(page).toHaveURL(/\/surah\/36/);
});

test("settings: downloads moved to Data, with the other tabs improved", async ({ page }) => {
  await open(page, "/", { width: 1280, height: 900 });
  await expect(page.locator(".app-view-home")).toBeVisible({ timeout: 30_000 });
  await openQuickMenuItem(page, "settings");
  const tabs = page.getByRole("tab");
  await expect(tabs).toHaveCount(5);
  await expect(page.getByRole("tab", { name: /Téléchargements/ })).toHaveCount(0);

  await page.getByRole("tab", { name: "Affichage", exact: true }).click();
  const preview = page.locator(".sp-preview__arabic");
  const before = await preview.evaluate((node) => parseFloat(getComputedStyle(node).fontSize));
  await page.locator("#settings-font-size-quran").fill("48");
  const after = await preview.evaluate((node) => parseFloat(getComputedStyle(node).fontSize));
  expect(after).toBeGreaterThan(before);

  await page.getByRole("tab", { name: "Audio", exact: true }).click();
  await expect(page.locator(".sp-current")).toContainText("Récitateur actuel");
  await expect(page.locator("#settings-audio-speed")).toBeVisible();
  await page.getByRole("button", { name: "Gérer les téléchargements" }).click();
  await expect(page.getByTestId("offline-downloads")).toBeVisible();
  await expect(page.getByRole("button", { name: "Vider le cache de l'application" })).toBeVisible();

  await page.getByRole("tab", { name: "Général", exact: true }).click();
  await page.getByRole("button", { name: "Confidentialité", exact: true }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
