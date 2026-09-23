import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
  splashCompleted: true, skipSplashAnimation: true, showHome: false,
  displayMode: "page", mushafLayout: "list", lang: "ar", riwaya: "hafs",
  fontFamily: "qpc-hafs", quranFontSize: 30, showTajwid: false,
})));
await page.goto("http://127.0.0.1:4173/page/3", { waitUntil: "domcontentloaded" });
const s = page.locator(".splash-screen button").filter({ hasText: /تخطي|Passer|Skip/ }).first();
if (await s.count()) await s.click({ force: true }).catch(() => {});
await page.waitForSelector(".qc-ayah-text-ar", { timeout: 15000 });
await page.waitForTimeout(1500);

const card = await page.evaluate(() => document.querySelector(".reader-context-card")?.textContent?.replace(/\s+/g, " ").trim());
console.log("LIST card:", card);

// switch to mushaf layout via toolbar pill
await page.evaluate(() => {
  const pill = Array.from(document.querySelectorAll(".qc-reader-toolbar__modes button")).find((b) => /Mushaf|مصحف/.test(b.textContent || ""));
  pill?.click();
});
await page.waitForTimeout(2500);
const shell = await page.evaluate(() => {
  const el = document.querySelector("[data-stream-page='3'] .qcm-page-shell");
  return {
    aria: el?.getAttribute("aria-label"),
    header: el?.querySelector(".qcm-page-header")?.textContent?.replace(/\s+/g, " ").trim(),
    footer: el?.querySelector(".qcm-page-footer")?.textContent?.trim(),
    badge: document.querySelector(".reader-context-card__riwaya")?.textContent?.trim(),
  };
});
console.log("MUSHAF shell:", JSON.stringify(shell));
await page.screenshot({ path: ".scratch-diag/p3-ar-mushaf.png", clip: { x: 0, y: 0, width: 390, height: 500 } });
await browser.close();
