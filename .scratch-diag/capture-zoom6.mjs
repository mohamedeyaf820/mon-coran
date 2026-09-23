import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 632, height: 840 }, deviceScaleFactor: 6 });
const page = await context.newPage();
await page.addInitScript(() => {
  localStorage.setItem("mushaf-plus-settings", JSON.stringify({
    skipSplashAnimation: true, showHome: false, showDuas: false, sidebarOpen: false,
    displayMode: "page", mushafLayout: "mushaf", lang: "fr", riwaya: "warsh",
    fontFamily: "qpc-warsh", fontFamilyByRiwaya: { hafs: "qpc-hafs", warsh: "qpc-warsh" },
    currentSurah: 2, currentPage: 3, currentJuz: 1,
    lastPosition: { surah: 2, ayah: 1, page: 3, juz: 1 },
  }));
});
await page.goto("http://127.0.0.1:4173/page/3", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".quran-display--platform", { timeout: 45_000 });
await page.waitForTimeout(3000);
await page.locator(":is(.reader-fullscreen-trigger, .srh-fullscreen-btn):visible").first().click();
await page.waitForSelector(".mfp-portal-root .qcm-flow .qcm-word", { timeout: 30_000 });
await page.waitForTimeout(4000);
// Pick the word يَخْدَعُونَ (line 5) and screenshot its two-line neighborhood.
const box = await page.evaluate(() => {
  const f = document.querySelector(".mfp-portal-root .qcm-flow");
  const ws = [...f.querySelectorAll(".qcm-word")]; const w = ws[25];
  const r = w.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
});
console.log("word box", JSON.stringify(box));
await page.screenshot({
  path: ".scratch-diag/captures/zoom6-line.png",
  clip: { x: box.x - 10, y: box.y - 45, width: Math.min(600, box.w + 200), height: 100 },
});
await browser.close();
