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
