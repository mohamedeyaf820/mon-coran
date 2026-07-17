import { expect, test } from "@playwright/test";

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

test("compatibilité: accueil, route légale et lecteur", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Coran|Quran/);
  await expect(page.locator(".hp-card--surah").first()).toBeVisible();

  await page.goto("/privacy");
  await expect(page.locator(".legal-page")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/lecture|reading|بيانات/i);

  await page.goto("/surah/1");
  await expect(page.locator(".qc-ayah-text-ar").first()).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
});
