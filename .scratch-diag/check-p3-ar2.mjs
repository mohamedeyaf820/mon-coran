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
await page.waitForTimeout(1500);
const pills = await page.evaluate(() => Array.from(document.querySelectorAll(".qc-reader-toolbar__modes button")).map(b => b.textContent.trim()));
console.log("PILLS:", JSON.stringify(pills));
await page.evaluate(() => {
  const pill = Array.from(document.querySelectorAll(".qc-reader-toolbar__modes button")).find((b) => /Mushaf|mushaf|مصحف|مصحف/i.test(b.textContent || ""));
  pill?.click();
});
await page.waitForTimeout(3000);
const shell = await page.evaluate(() => {
  const el = document.querySelector(".qcm-page-shell");
  return {
    found: !!el,
    aria: el?.getAttribute("aria-label"),
    header: el?.querySelector(".qcm-page-header")?.textContent?.replace(/\s+/g, " ").trim(),
    footer: el?.querySelector(".qcm-page-footer")?.textContent?.trim(),
  };
});
console.log("MUSHAF shell:", JSON.stringify(shell));
await page.screenshot({ path: ".scratch-diag/p3-ar-mushaf2.png", clip: { x: 0, y: 0, width: 390, height: 500 } });
await browser.close();
