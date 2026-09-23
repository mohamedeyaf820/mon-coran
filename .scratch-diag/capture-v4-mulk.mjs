import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 393, height: 851 }, deviceScaleFactor: 4 });
const pg = await context.newPage();
await pg.addInitScript(() => {
  localStorage.setItem("mushaf-plus-settings", JSON.stringify({
    skipSplashAnimation: true, showHome: false, showDuas: false, sidebarOpen: false,
    displayMode: "page", mushafLayout: "mushaf", lang: "fr", riwaya: "hafs",
    fontFamily: "qpc-hafs", fontFamilyByRiwaya: { hafs: "qpc-hafs", warsh: "qpc-warsh" },
    showTranslation: false, showTajwid: true, showTransliteration: false,
    currentSurah: 67, currentPage: 561, currentJuz: 29,
    lastPosition: { surah: 67, ayah: 3, page: 561, juz: 29 },
  }));
});
await pg.goto("http://127.0.0.1:4173/page/560", { waitUntil: "domcontentloaded" });
await pg.waitForSelector(".quran-display--platform", { timeout: 45000 });
await pg.waitForTimeout(2500);
await pg.locator(":is(.reader-fullscreen-trigger, .srh-fullscreen-btn):visible").first().click();
await pg.waitForSelector(".mfp-portal-root .qcm-page", { timeout: 30000 });
await pg.waitForTimeout(5000);
await pg.locator(".mfp-portal-root .qcm-page").first().screenshot({ path: ".scratch-diag/captures/v4-hafs-p561.png" });
console.log("done");
await browser.close();
