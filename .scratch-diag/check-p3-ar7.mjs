import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
  splashCompleted: true, skipSplashAnimation: true, showHome: false,
  displayMode: "page", mushafLayout: "list", lang: "ar", riwaya: "warsh",
  fontFamily: "qpc-hafs", quranFontSize: 30, showTajwid: false, warshStrictMode: true,
})));
await page.goto("http://127.0.0.1:4173/page/3", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".qc-ayah-text-ar", { timeout: 25000 });
await page.waitForTimeout(3000);
const dump = await page.evaluate(() => ({
  badge: document.querySelector(".reader-context-card__riwaya")?.textContent?.trim(),
  card: document.querySelector(".reader-context-card")?.textContent?.replace(/\s+/g," ").trim(),
}));
console.log(JSON.stringify(dump));
await browser.close();
