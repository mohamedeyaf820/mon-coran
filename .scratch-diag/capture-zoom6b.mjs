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
const info = await page.evaluate(() => {
  const f = document.querySelector(".mfp-portal-root .qcm-flow");
  const ws = [...f.querySelectorAll(".qcm-word")];
  const r0 = ws[0].getBoundingClientRect();
  const fr = f.getBoundingClientRect();
  // find the word containing السَّفَهَاءُ (line ~11)
  const w11 = ws.find((w) => w.textContent.includes("السَّفَهَاءُ"));
  const r11 = w11?.getBoundingClientRect();
  return { first: { t: r0.top, b: r0.bottom, l: r0.left }, flowTop: fr.top, flowLeft: fr.left, w11: r11 ? { t: r11.top, b: r11.bottom, l: r11.left, r: r11.right } : null, text11: w11?.textContent };
});
console.log(JSON.stringify(info));
await page.screenshot({ path: ".scratch-diag/captures/zoom6-first.png", clip: { x: info.first.l - 30, y: info.flowTop - 12, width: 420, height: 70 } });
if (info.w11) await page.screenshot({ path: ".scratch-diag/captures/zoom6-safaha.png", clip: { x: info.w11.l - 20, y: info.w11.t - 32, width: 320, height: 90 } });
await browser.close();
