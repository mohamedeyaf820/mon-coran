import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
  splashCompleted: true, skipSplashAnimation: true, showHome: false,
  displayMode: "page", mushafLayout: "list", lang: "ar", riwaya: "hafs",
  fontFamily: "qpc-hafs", quranFontSize: 30, showTajwid: false,
})));
await page.goto("http://127.0.0.1:4173/page/3", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".qc-ayah-text-ar", { timeout: 15000 });
await page.waitForTimeout(1200);
await page.evaluate(() => {
  Array.from(document.querySelectorAll(".qc-reader-toolbar__modes button")).find((b) => /مصحف/.test(b.textContent || ""))?.click();
});
await page.waitForTimeout(3500);
const dump = await page.evaluate(() => {
  const sec = document.querySelector("[data-stream-page='3']");
  const mush = sec?.querySelector("[class*='mushaf']");
  return {
    mushClass: mush?.className,
    text: mush?.textContent?.replace(/\s+/g, " ").trim().slice(0, 300),
    aria: mush?.getAttribute("aria-label"),
  };
});
console.log(JSON.stringify(dump, null, 1));
await page.screenshot({ path: ".scratch-diag/p3-ar-mushaf3.png", clip: { x: 0, y: 0, width: 390, height: 500 } });
await browser.close();
