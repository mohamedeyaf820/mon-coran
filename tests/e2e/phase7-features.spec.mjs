import { expect, test } from "@playwright/test";

test("les outils de progression retirés ne sont plus accessibles", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "mushaf-plus-settings",
      JSON.stringify({
        skipSplashAnimation: true,
        lang: "fr",
        theme: "light",
        riwaya: "hafs",
        showHome: true,
        toolsHubOpen: true,
        futureHubOpen: "cloud",
        historyOpen: true,
        tajweedQuizOpen: true,
      }),
    );
  });

  await page.goto("/");
  await expect(page.locator(".app-view-home")).toBeVisible({ timeout: 20_000 });

  await page.getByRole("button", { name: "Plus d'options" }).click();
  await expect(
    page.getByRole("button", { name: /Espace outils|Tools hub|مركز الأدوات/i }),
  ).toHaveCount(0);

  await expect(
    page.getByRole("dialog", {
      name: /Bibliothèque pratique|Bibliothèque personnelle|Historique|Quiz Tajweed/i,
    }),
  ).toHaveCount(0);

  await page.locator('.mp-header-menu__item[data-key="settings"]').click();
  await expect(
    page.getByRole("button", { name: /Espace outils|Tools Hub|مركز الأدوات/i }),
  ).toHaveCount(0);
});
