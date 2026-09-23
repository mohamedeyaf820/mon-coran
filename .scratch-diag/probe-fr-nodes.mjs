import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 393, height: 851 }, deviceScaleFactor: 2 });
const page = await context.newPage();
await page.addInitScript(() => {
  localStorage.setItem("mushaf-plus-settings", JSON.stringify({
    skipSplashAnimation: true, showHome: false, showDuas: false, sidebarOpen: false,
    displayMode: "page", mushafLayout: "mushaf", lang: "fr", riwaya: "hafs",
    fontFamily: "qpc-hafs", fontFamilyByRiwaya: { hafs: "qpc-hafs", warsh: "qpc-warsh" },
    showTranslation: true, showTransliteration: false, showTajwid: false,
    currentSurah: 1, currentPage: 1, currentJuz: 1,
    lastPosition: { surah: 1, ayah: 1, page: 1, juz: 1 },
  }));
});
await page.goto("http://127.0.0.1:4173/page/1", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".quran-display--platform", { timeout: 45000 });
await page.waitForTimeout(3000);
const nodes = await page.locator('.quran-mode-pane--mushaf [lang="fr"], .quran-mode-pane--mushaf [lang="en"]').all();
for (const n of nodes) {
  console.log(await n.evaluate((el) => `${el.tagName}.${el.className} | ancestor=${el.parentElement?.className} | text="${el.textContent.slice(0, 80)}"`));
}
await browser.close();
