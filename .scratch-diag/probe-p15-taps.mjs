import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
  splashCompleted: true, skipSplashAnimation: true, showHome: false,
  displayMode: "page", mushafLayout: "mushaf", lang: "fr", riwaya: "hafs",
  fontFamily: "qpc-hafs", quranFontSize: 30, showTajwid: false, warshStrictMode: true,
})));
await page.goto("http://127.0.0.1:4173/page/3", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".qcm-page-shell", { timeout: 25000 });
await page.waitForTimeout(5000);
const lines = await page.evaluate(() => {
  const l = document.querySelector("[data-stream-page='3'] .qcm-lines");
  return { fs: getComputedStyle(l).fontSize, w: Math.round(l.getBoundingClientRect().width) };
});
console.log("wide scale:", JSON.stringify(lines));
await page.screenshot({ path: ".scratch-diag/p15v-wide2.png", clip: { x: 0, y: 120, width: 1100, height: 680 } });
// marker tap -> verse actions
const marker = page.locator("[data-stream-page='3'] .qcm-ayah-marker").first();
await marker.scrollIntoViewIfNeeded();
await marker.click();
await page.waitForTimeout(900);
const modal = await page.evaluate(() => {
  const d = document.querySelector("[role='dialog']");
  return { present: !!d, text: (d?.textContent || "").replace(/\s+/g, " ").slice(0, 60) };
});
console.log("marker tap:", JSON.stringify(modal));
await page.keyboard.press("Escape");
await page.close();
// page 1 opening leaf
const p2 = await browser.newPage({ viewport: { width: 390, height: 844 } });
await p2.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
  splashCompleted: true, skipSplashAnimation: true, showHome: false,
  displayMode: "page", mushafLayout: "mushaf", lang: "fr", riwaya: "hafs",
  fontFamily: "qpc-hafs", quranFontSize: 30, showTajwid: false, warshStrictMode: true,
})));
await p2.goto("http://127.0.0.1:4173/page/1", { waitUntil: "domcontentloaded" });
await p2.waitForSelector(".qcm-page-shell", { timeout: 25000 });
await p2.waitForTimeout(5000);
const open = await p2.evaluate(() => ({
  surahTitle: !!document.querySelector(".qcm-surah-title"),
  basmala: !!document.querySelector(".qcm-basmala"),
  lines: document.querySelectorAll("[data-stream-page='1'] .qcm-line").length,
}));
console.log("page1 opening:", JSON.stringify(open));
await p2.screenshot({ path: ".scratch-diag/p15v-page1.png", clip: { x: 0, y: 130, width: 390, height: 700 } });
await browser.close();
