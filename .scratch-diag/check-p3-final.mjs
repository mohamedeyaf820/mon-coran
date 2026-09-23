import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
  splashCompleted: true, skipSplashAnimation: true, showHome: false,
  displayMode: "page", mushafLayout: "mushaf", lang: "ar", riwaya: "warsh",
  fontFamily: "qpc-hafs", quranFontSize: 30, showTajwid: false, warshStrictMode: true,
})));
await page.goto("http://127.0.0.1:4173/page/3", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".page-stream__page", { timeout: 25000 });
await page.waitForTimeout(4000);
const ar = await page.evaluate(() => {
  const sec = document.querySelector("[data-stream-page='3']");
  const t = (sec?.textContent || "").replace(/\s+/g, " ");
  return { latinRuns: (t.match(/[0-9]+/g) || []), head: t.slice(0, 40) };
});
console.log("AR mushaf page3:", JSON.stringify(ar));
await page.screenshot({ path: ".scratch-diag/p3-ar-mushaf-final.png", clip: { x: 0, y: 0, width: 390, height: 300 } });

const page2 = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page2.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
  splashCompleted: true, skipSplashAnimation: true, showHome: false,
  displayMode: "page", mushafLayout: "list", lang: "fr", riwaya: "hafs",
  fontFamily: "qpc-hafs", quranFontSize: 30, showTajwid: false,
})));
await page2.goto("http://127.0.0.1:4173/page/3", { waitUntil: "domcontentloaded" });
await page2.waitForSelector(".qc-ayah-text-ar", { timeout: 25000 });
await page2.waitForTimeout(2000);
const fr = await page2.evaluate(() => ({
  card: document.querySelector(".reader-context-card")?.textContent?.replace(/\s+/g," ").trim(),
  badge: document.querySelector(".reader-context-card__riwaya")?.textContent?.trim(),
  playTitle: document.querySelector("[title]")?.title,
}));
console.log("FR list card:", JSON.stringify(fr));
await browser.close();
