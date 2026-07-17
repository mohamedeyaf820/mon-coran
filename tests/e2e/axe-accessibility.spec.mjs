import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function expectNoSeriousViolations(page, label) {
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
        splashDone: true,
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
  await expect(page.getByRole("dialog")).toBeVisible();
  await expectNoSeriousViolations(page, "Recherche");
});

test("Axe: confidentialité", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.locator(".legal-page")).toBeVisible();
  await expectNoSeriousViolations(page, "Confidentialité");
});
