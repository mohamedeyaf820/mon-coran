import { test, expect } from "@playwright/test";

test("a new reader completes onboarding and keeps preferences", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("mon-coran-force-onboarding", "1"));
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "Bienvenue dans Mon Coran" });
  await expect(dialog).toBeVisible();
  await page.getByRole("button", { name: "Warsh" }).click();
  await page.getByRole("button", { name: "Maghrebin" }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("checkbox", { name: "Afficher la traduction" }).uncheck();
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("button", { name: "Commencer" }).click();
  await expect(dialog).toBeHidden();
  await page.goto("/surah/1");
  await expect(page.locator(".modern-ayah__translation")).toHaveCount(0);
  await page.reload();
  await expect(dialog).toHaveCount(0);
});

test("onboarding remains available from preferences", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Ouvrir les reglages" }).click();
  await page.getByRole("button", { name: "Accessibilite" }).click();
  await page.getByRole("button", { name: "Revoir le parcours de bienvenue" }).click();
  await expect(page.getByRole("dialog", { name: "Bienvenue dans Mon Coran" })).toBeVisible();
});
