import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
  splashCompleted: true, skipSplashAnimation: true, showHome: false,
  displayMode: "page", mushafLayout: "mushaf", lang: "fr", riwaya: "hafs",
  fontFamily: "qpc-hafs", quranFontSize: 30, showTajwid: false, warshStrictMode: true,
})));
await page.goto("http://127.0.0.1:4173/page/3", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".qcm-page-shell", { timeout: 25000 });
await page.waitForTimeout(7000);
await page.screenshot({ path: ".scratch-diag/p15-t7.png", clip: { x: 0, y: 0, width: 390, height: 844 } });
const fonts = await page.evaluate(() => Array.from(document.fonts).filter(f => /qcf/.test(f.family)).map(f => f.family + ":" + f.status).slice(0, 8));
console.log("qcf fonts:", JSON.stringify(fonts));
await browser.close();
