import { expect, test } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";

// The IndoPak face is remote and its text uses private-use glyph codes that no
// other face draws (they showed as black discs). When it cannot be loaded the
// reader must say so and show the Hafs text instead of broken glyphs.
test("an unreachable IndoPak font falls back to the Hafs font with a notice", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "mushaf-plus-settings",
      JSON.stringify({
        skipSplashAnimation: true,
        lang: "fr",
        riwaya: "hafs",
        theme: "light",
        showHome: false,
        displayMode: "surah",
        mushafLayout: "list",
        fontFamily: "qpc-indopak",
        fontFamilyByRiwaya: { hafs: "qpc-indopak", warsh: "qpc-warsh" },
      }),
    );
  });
  await installQuranNetworkFixtures(page);
  await page.route(/indopak-nastaleeq/, (route) => route.abort());

  await page.goto("/surah/1");
  await expect(page.getByText("La police IndoPak n'a pas pu être chargée")).toBeVisible({ timeout: 20_000 });
  // The text is drawn again (no empty reader) with the Hafs face.
  await expect(page.locator(".qc-ayah-text-ar, .qcm-line").first()).toBeVisible();

});
