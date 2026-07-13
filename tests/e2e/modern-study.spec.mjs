import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/study");
  await page.evaluate(() => {
    localStorage.removeItem("mushaf_khatma_v1");
    localStorage.removeItem("mushafplus_memorization_v1");
  });
  await page.reload();
});

test("study navigation and daily goal are usable", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Votre espace d'etude." })).toBeVisible();
  await expect(page.getByRole("link", { name: /Etudier/ })).toHaveClass(/is-active/);
  await page.getByRole("button", { name: "Marquer termine" }).click();
  await expect(page.getByRole("heading", { name: "Objectif accompli" })).toBeVisible();
});

test("creates khatma and memorization goals from the interface", async ({ page }) => {
  await page.getByRole("button", { name: /Khatma/ }).click();
  await page.getByRole("button", { name: /1 mois/ }).click();
  await expect(page.getByText("21", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: /Memorisation/ }).click();
  await page.getByLabel("Ajouter une reference").fill("1:1");
  await page.getByRole("button", { name: "Ajouter" }).click();
  await expect(page.getByText("1:1", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Niveau 5" }).click();
  await expect(page.getByText("5/5", { exact: true })).toBeVisible();
});

test("quiz gives immediate feedback and mobile layout does not overflow", async ({ page }) => {
  await page.getByRole("button", { name: /Quiz tajwid/ }).click();
  const firstChoice = page.locator(".modern-study-choices button").first();
  await firstChoice.click();
  await expect(page.getByRole("button", { name: /Question suivante/ })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  const dimensions = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: innerWidth }));
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
});
