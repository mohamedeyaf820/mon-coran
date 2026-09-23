import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
async function boot(layout, riwaya) {
  await page.addInitScript(({ r }) => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
    splashCompleted: true, skipSplashAnimation: true, showHome: false,
    displayMode: "page", mushafLayout: layout, lang: "ar", riwaya: r,
    fontFamily: "qpc-hafs", quranFontSize: 30, showTajwid: false,
  })), { r: riwaya });
  await page.goto("http://127.0.0.1:4173/page/3", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("[class*='mushaf-page-wrapper'], .qc-ayah-text-ar", { timeout: 20000 });
  await page.waitForTimeout(2500);
}
await boot("mushaf", "warsh");
const dump = await page.evaluate(() => {
  const mush = document.querySelector("[data-stream-page] [class*='mushaf-page-wrapper']");
  const t = mush?.textContent || "";
  return {
    badge: document.querySelector(".reader-context-card__riwaya")?.textContent?.trim(),
    card: document.querySelector(".reader-context-card")?.textContent?.replace(/\s+/g," ").trim(),
    latinDigits: (t.match(/[0-9]+/g) || []),
    head: t.replace(/\s+/g," ").trim().slice(0, 60),
    tail: t.replace(/\s+/g," ").trim().slice(-80),
  };
});
console.log(JSON.stringify(dump, null, 1));
await page.screenshot({ path: ".scratch-diag/p3-ar-warsh-mushaf.png", clip: { x: 0, y: 0, width: 390, height: 500 } });
await browser.close();
