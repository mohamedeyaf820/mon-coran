import { expect, test } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";

const SETTINGS_KEY = "mushaf-plus-settings";

// The search takes no language: what is typed decides which source answers.
test("the search asks for no language and understands a transliterated phrase", async ({
  page,
}) => {
  await page.addInitScript((key) => {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(
      key,
      JSON.stringify({
        skipSplashAnimation: true,
        showHome: true,
        sidebarOpen: false,
        lang: "fr",
        riwaya: "hafs",
        theme: "light",
      }),
    );
  }, SETTINGS_KEY);
  await installQuranNetworkFixtures(page);

  const asked = [];
  await page.route("https://api.alquran.cloud/v1/search/**", async (route) => {
    const url = decodeURIComponent(route.request().url());
    asked.push(url);
    const arabic = /\/search\/قل هو الله\/all\/quran-/.test(url) || /\/search\/قل هو الله\//.test(url);
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        code: 200,
        status: "OK",
        data: {
          count: arabic ? 1 : 0,
          matches: arabic
            ? [
                {
                  number: 6222,
                  text: "قُلْ هُوَ ٱللَّهُ أَحَدٌ",
                  numberInSurah: 1,
                  surah: { number: 112 },
                },
              ]
            : [],
        },
      }),
    });
  });

  await page.goto("/");
  await expect(page.locator(".app-view-home")).toBeVisible({ timeout: 30_000 });
  await page.locator(".mp-header__search").first().click();
  await expect(page.locator(".search-pro")).toBeVisible({ timeout: 30_000 });

  await expect(page.locator(".search-pro__voice-langs")).toHaveCount(0);
  await expect(page.locator(".search-pro__voice-lang")).toHaveCount(0);

  const input = page.locator(".search-pro").getByRole("textbox").first();
  await expect(input).toBeVisible();
  await input.fill("kulhuallah");

  const result = page.getByTestId("search-result").first();
  await expect(result).toBeVisible({ timeout: 15_000 });
  await expect(result).toHaveAttribute("data-surah", "112");
  await expect(page.locator(".search-pro__detected")).toBeVisible();
  await expect.poll(() => asked.some((url) => url.includes("قل هو الله"))).toBe(true);
});
