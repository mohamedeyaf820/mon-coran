import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function expectNoSeriousViolations(page, label) {
  // Entrance fades blend the colours axe samples: freeze motion first.
  await page.addStyleTag({
    content: "*, *::before, *::after { animation: none !important; transition: none !important; }",
  });
  await page.waitForTimeout(200);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const blocking = results.violations.filter(
    (violation) => violation.impact === "critical" || violation.impact === "serious",
  );
  expect(blocking, `${label}: ${blocking.map((item) => `${item.id} (${item.nodes.length})`).join(", ")}`).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "mushaf-plus-settings",
      JSON.stringify({
        skipSplashAnimation: true,
        showHome: true,
        showDuas: false,
        lang: "fr",
        theme: "light",
        riwaya: "hafs",
      }),
    );
  });
});

test("Axe: accueil", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".app-view-home")).toBeVisible();
  await expectNoSeriousViolations(page, "Accueil");
});

test("Axe: lecteur et recherche", async ({ page }) => {
  await page.goto("/surah/1");
  await expect(page.locator(".qc-ayah-text-ar").first()).toBeVisible({ timeout: 30_000 });
  await expectNoSeriousViolations(page, "Lecteur");

  await page.getByRole("button", { name: /Rechercher|Search|بحث/i }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  // Let the opening fade finish: axe reads the blended colours otherwise.
  await expect(dialog).toHaveCSS("opacity", "1");
  await page.waitForTimeout(350);
  await expectNoSeriousViolations(page, "Recherche");
});

test("Axe: confidentialité", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.locator(".legal-page")).toBeVisible();
  await expectNoSeriousViolations(page, "Confidentialité");
});

test("Axe: invocations", async ({ page }) => {
  await page.goto("/duas");
  await expect(page.locator("[class*=dua]").first()).toBeVisible({ timeout: 30_000 });
  await expectNoSeriousViolations(page, "Invocations");
});

test("Axe: lecteur en arabe (RTL)", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "mushaf-plus-settings",
      JSON.stringify({ skipSplashAnimation: true, showHome: false, lang: "ar", theme: "light", riwaya: "hafs" }),
    );
  });
  await page.goto("/surah/1");
  await expect(page.locator(".qc-ayah-text-ar").first()).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expectNoSeriousViolations(page, "Lecteur arabe");
});

test("Axe: panneaux réglages et bibliothèque", async ({ page }) => {
  await page.goto("/surah/2");
  await expect(page.locator(".qc-ayah-text-ar").first()).toBeVisible({ timeout: 30_000 });

  const openFromMenu = async (label) => {
    await page.getByRole("button", { name: /Plus d'options|More options/i }).first().click();
    const item = page
      .locator('[role="dialog"] button, [role="menu"] button')
      .filter({ hasText: label })
      .first();
    await item.click();
  };

  await openFromMenu(/Paramètres|Settings/i);
  const settings = page.getByRole("dialog").last();
  await expect(settings).toBeVisible();
  await expectNoSeriousViolations(page, "Réglages");
  await page.keyboard.press("Escape");
  await expect(settings).toBeHidden({ timeout: 5_000 });

  await openFromMenu(/Bibliothèque|Library/i);
  const library = page.locator('[aria-labelledby="library-title"]').first();
  await expect(library).toBeVisible({ timeout: 10_000 });
  await expectNoSeriousViolations(page, "Bibliothèque");
});
