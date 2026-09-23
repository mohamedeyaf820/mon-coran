import { expect, test } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";

async function seedFrenchState(page) {
  await page.addInitScript(() => {
    if (localStorage.getItem("mushaf-plus-settings")) return;
    localStorage.setItem(
      "mushaf-plus-settings",
      JSON.stringify({
        skipSplashAnimation: true,
        showHome: true,
        showDuas: false,
        sidebarOpen: false,
        currentSurah: 1,
        currentAyah: 1,
        displayMode: "surah",
        lang: "fr",
        riwaya: "hafs",
        theme: "light",
      }),
    );
  });
}

async function openSearch(page) {
  await page.goto("/");
  await expect(page.locator(".app-view-home")).toBeVisible();
  await page.locator(".mp-header__search").first().click();
  return page.locator(".search-pro").getByRole("textbox").first();
}

test("une requête de position ouvre la sourate demandée", async ({ page }) => {
  seedFrenchState(page);
  await installQuranNetworkFixtures(page);

  const input = await openSearch(page);
  await input.fill("٢:١٠");

  const jump = page.getByTestId("search-reference");
  await expect(jump).toBeVisible({ timeout: 15_000 });
  await expect(jump).toContainText("Aller au verset 2:10");
  await jump.click();

  await expect(page).toHaveURL(/\/surah\/2\/10$/);
});

test("un numéro de sourate nu et un juz se lisent aussi comme des positions", async ({
  page,
}) => {
  seedFrenchState(page);
  await installQuranNetworkFixtures(page);

  const input = await openSearch(page);
  await input.fill("sourate 36");
  await expect(page.getByTestId("search-reference")).toContainText("Aller à la sourate 36");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/surah\/36(\/1)?$/);

  await page.locator(".mp-header__search").first().click();
  await page.locator(".search-pro").getByRole("textbox").first().fill("juz 5");
  await expect(page.getByTestId("search-reference")).toContainText("Aller au juz 5");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/juz\/5$/);
});

test("une recherche sans correspondance annonce l'absence de résultat, pas une panne", async ({
  page,
}) => {
  seedFrenchState(page);
  await installQuranNetworkFixtures(page);
  await page.route("https://api.alquran.cloud/v1/search/**", async (route) => {
    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({
        code: 404,
        status: "NOT FOUND",
        data: "Nothing matching your search was found..",
      }),
    });
  });

  const input = await openSearch(page);
  await input.fill("firawn");

  await expect(page.locator(".search-pro__no-results")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".search-pro__error")).toHaveCount(0);
});
