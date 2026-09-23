import { expect, test } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";

async function openReaderWithLegacyWordMode(page, riwaya) {
  await installQuranNetworkFixtures(page);
  await page.addInitScript((activeRiwaya) => {
    localStorage.setItem(
      "mushaf-plus-settings",
      JSON.stringify({
        skipSplashAnimation: true,
        showHome: false,
        displayMode: "surah",
        mushafLayout: "list",
        lang: "fr",
        riwaya: activeRiwaya,
        showWordByWord: true,
        showWordTranslation: true,
      }),
    );
  }, riwaya);
  await page.goto("/surah/1");
  await expect(page.locator(".qc-ayah-text-ar").first()).toBeVisible({
    timeout: 30_000,
  });
}

for (const riwaya of ["hafs", "warsh"]) {
  test(`the removed word-by-word mode stays disabled for ${riwaya}`, async ({
    page,
  }) => {
    await openReaderWithLegacyWordMode(page, riwaya);

    await expect(page.locator(".quran-display--word-by-word")).toHaveCount(0);
    await expect(page.locator(".wbw-word-block")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /Mot à mot|Word by Word|كلمة بكلمة/i }),
    ).toHaveCount(0);
  });
}
