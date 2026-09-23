import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const pg = await browser.newPage({ viewport: { width: 393, height: 851 } });
await pg.addInitScript(() => {
  localStorage.setItem("mushaf-plus-settings", JSON.stringify({
    skipSplashAnimation: true, showHome: false, showDuas: false, sidebarOpen: false,
    displayMode: "page", mushafLayout: "mushaf", lang: "fr", riwaya: "hafs",
    fontFamily: "qpc-hafs", showTranslation: false, showTajwid: true, showTransliteration: false,
    currentSurah: 2, currentPage: 3, currentJuz: 1,
    lastPosition: { surah: 2, ayah: 19, page: 3, juz: 1 },
  }));
});
await pg.goto("http://127.0.0.1:4173/page/3", { waitUntil: "domcontentloaded" });
await pg.waitForSelector(".quran-display--platform", { timeout: 45000 });
await pg.waitForTimeout(3500);
const dump = await pg.evaluate(() => {
  const roots = [...document.querySelectorAll(".quran-tajwid-text")];
  return roots.map((r, i) => `${i}: ${r.textContent.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u06DD]/g, "").slice(0, 90)}`);
});
console.log(dump.join("\n"));
await browser.close();
