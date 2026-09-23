import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 393, height: 851 }, deviceScaleFactor: 6 });
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
const r = await page.evaluate(() => {
  const ws = [...document.querySelectorAll(".mfp-portal-root .qcm-flow .qcm-word")];
  const w = ws.find((x) => x.textContent.includes("مَعَكُمُ") || x.textContent.includes("مَعَكُم"));
  const b = w.getBoundingClientRect();
  return { text: w.textContent, x: b.left, y: b.top, w: b.width, h: b.height };
});
console.log(JSON.stringify(r));
await page.screenshot({
  path: ".scratch-diag/captures/maakum-fixed.png",
  clip: { x: Math.max(0, r.x - 60), y: r.y - 30, width: r.w + 120, height: r.h + 45 },
});
await browser.close();
