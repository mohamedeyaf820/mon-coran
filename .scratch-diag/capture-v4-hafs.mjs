import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 393, height: 851 }, deviceScaleFactor: 2 });
const pg = await context.newPage();
await pg.addInitScript(() => {
  localStorage.setItem("mushaf-plus-settings", JSON.stringify({
    skipSplashAnimation: true, showHome: false, showDuas: false, sidebarOpen: false,
    displayMode: "page", mushafLayout: "mushaf", lang: "fr", riwaya: "hafs",
    fontFamily: "qpc-hafs", fontFamilyByRiwaya: { hafs: "qpc-hafs", warsh: "qpc-warsh" },
    showTranslation: false, showTajwid: true, showTransliteration: false,
    currentSurah: 2, currentPage: 3, currentJuz: 1,
    lastPosition: { surah: 2, ayah: 19, page: 3, juz: 1 },
  }));
});
await pg.goto("http://127.0.0.1:4173/page/3", { waitUntil: "domcontentloaded" });
await pg.waitForSelector(".quran-display--platform", { timeout: 45000 });
await pg.waitForTimeout(2500);
await pg.locator(":is(.reader-fullscreen-trigger, .srh-fullscreen-btn):visible").first().click();
await pg.waitForSelector(".mfp-portal-root .qcm-page", { timeout: 30000 });
await pg.waitForTimeout(4000);
await pg.locator(".mfp-portal-root .qcm-page").first().screenshot({ path: ".scratch-diag/captures/v4-hafs-p3.png" });
const fonts = await pg.evaluate(() => [...document.fonts].filter((f) => f.family.includes("qcf")).map((f) => `${f.family}:${f.status}`).join(", "));
console.log("qcf fonts:", fonts);
await browser.close();
