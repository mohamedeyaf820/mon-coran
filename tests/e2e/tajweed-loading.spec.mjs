import { test, expect } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";

for (const [riwaya, fontFile] of [
  ["hafs", "uthmanic-hafs-v18.woff2"],
  ["warsh", "kfgqpc-warsh-21.woff2"],
]) {
  test(`${riwaya}: le texte de la page reste lisible si la police tarde`, async ({ page }) => {
    await installQuranNetworkFixtures(page);
    await page.route(`**/fonts/${fontFile}`, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 4000));
      await route.continue();
    });
    await page.addInitScript((selectedRiwaya) => {
      localStorage.setItem("mushaf-plus-settings", JSON.stringify({
        skipSplashAnimation: true,
        showHome: false,
        displayMode: "page",
        mushafLayout: "mushaf",
        currentPage: 4,
        currentSurah: 2,
        currentJuz: 1,
        riwaya: selectedRiwaya,
        fontFamily: selectedRiwaya === "hafs" ? "qpc-hafs" : "qpc-warsh",
        showTajwid: true,
        lang: "fr",
      }));
    }, riwaya);
    await page.goto("/page/4", { waitUntil: "domcontentloaded" });
    const root = page.locator('[data-stream-page="4"]');
    const words = root.locator(".qcm-word");
    await expect(words.first()).toBeAttached({ timeout: 30_000 });
    await expect(root.locator('[data-font-ready="true"]')).toBeVisible({ timeout: 3000 });
    expect(await words.count()).toBeGreaterThan(0);
    expect(await words.first().textContent()).not.toBe("");
  });
}
