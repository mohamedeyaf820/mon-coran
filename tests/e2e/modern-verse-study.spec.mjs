import { test, expect } from "@playwright/test";
test("tafsir and word by word open from verse options", async ({ page }) => {
  await page.goto("/surah/1");
  const firstVerse = page.locator(".modern-reader-verse").first();
  await firstVerse.getByRole("button", { name: "Plus d'options" }).click();
  await firstVerse.getByRole("menuitem", { name: "Etudier ce verset" }).click();
  const panel = page.getByRole("dialog", { name: "Etudier le verset 1:1" });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("heading", { name: "Etudier le verset" })).toBeVisible();
  await panel.getByRole("button", { name: "Mot a mot" }).click();
  await expect(panel.locator(".modern-study-panel__words")).toBeVisible();
  await panel.getByRole("button", { name: "Fermer l'etude" }).click();
  await expect(panel).toBeHidden();
});
