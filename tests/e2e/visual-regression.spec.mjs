import { expect, test } from "@playwright/test";

const THEMES = ["light", "sepia", "dark"];

for (const theme of THEMES) {
  test(`régression visuelle: carte sourate ${theme}`, async ({ page }) => {
    await page.addInitScript((selectedTheme) => {
      localStorage.setItem(
        "mushaf-plus-settings",
        JSON.stringify({
          skipSplashAnimation: true,
          showHome: true,
          showDuas: false,
          lang: "fr",
          theme: selectedTheme,
          riwaya: "hafs",
        }),
      );
    }, theme);
    await page.setViewportSize({ width: 1280, height: 820 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const card = page.locator(".hp-card--surah").first();
    await expect(card).toBeVisible();
    await expect(card).toHaveScreenshot(`surah-card-${theme}.png`, {
      animations: "disabled",
      caret: "hide",
      // Font metrics vary by one CSS pixel between Windows and Linux. Keep
      // the captured box aligned with the reviewed 102px reference so the
      // screenshot comparison measures styling rather than runner rounding.
      style: ".hp-card--surah { height: 102px !important; }",
    });
  });
}
