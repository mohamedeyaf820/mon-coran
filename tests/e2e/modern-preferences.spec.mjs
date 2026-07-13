import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => { await page.goto("/surah/1"); await page.getByRole("button", { name: "Ouvrir les reglages" }).click(); });

test("persists reading preferences across routes", async ({ page }) => {
  await expect(page.getByRole("dialog", { name: "Preferences" })).toBeVisible();
  await page.getByRole("slider", { name: "Taille du texte arabe" }).fill("42");
  await page.getByText("Afficher la traduction").click();
  await page.getByRole("button", { name: "Terminer" }).click();
  await page.goto("/surah/114");
  await expect(page.locator(".modern-reader-verse__translation")).toHaveCount(0);
  await expect(page.locator(".modern-reader-verse__arabic").first()).toHaveCSS("font-size", "42px");
});

test("changes theme immediately and closes with escape", async ({ page }) => {
  await page.getByRole("button", { name: /Apparence/ }).click();
  await page.getByRole("button", { name: /Sombre/ }).click();
  await expect(page.locator(".modern-app")).toHaveAttribute("data-modern-theme", "dark");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Preferences" })).toHaveCount(0);
});

test("preferences remain usable without horizontal overflow on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: /Accessibilite/ }).click();
  await expect(page.getByText("Mode lecture concentree")).toBeVisible();
  const width = await page.evaluate(() => [document.body.scrollWidth, innerWidth]);
  expect(width[0]).toBeLessThanOrEqual(width[1]);
});

test("persists a Mushaf profile and a controlled accent palette", async ({ page }) => {
  await page.getByRole("button", { name: "Etude" }).click();
  await page.getByRole("button", { name: /Apparence/ }).click();
  await page.getByRole("button", { name: "Bordeaux" }).click();
  await page.getByRole("button", { name: "Terminer" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-mushaf-profile", "study");
  await expect(page.locator("html")).toHaveAttribute("data-modern-palette", "burgundy");
});

test("places page translation beside the Mushaf on wide screens", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Terminer" }).click();
  await page.goto("/page/3");
  const positions = await page.locator(".modern-mushaf-page, .modern-mushaf-translations").evaluateAll((items) => items.map((item) => Math.round(item.getBoundingClientRect().top)));
  expect(positions[0]).toBe(positions[1]);
});
