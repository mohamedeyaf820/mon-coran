import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
  splashCompleted: true, skipSplashAnimation: true, showHome: false,
  displayMode: "surah", mushafLayout: "list", lang: "fr", riwaya: "hafs",
  fontFamily: "qpc-hafs", quranFontSize: 30, showTajwid: false,
})));
await page.goto("http://127.0.0.1:4173/surah/2", { waitUntil: "domcontentloaded" });
const s = page.locator(".splash-screen button").filter({ hasText: /Passer|Skip/ }).first();
if (await s.count()) await s.click({ force: true }).catch(() => {});
await page.waitForSelector(".qc-ayah-text-ar", { timeout: 15000 });
await page.waitForTimeout(1500);
await page.evaluate(() => { document.querySelector(".app-main").scrollTop = 2500; });
await page.waitForTimeout(300);
const before = await page.evaluate(() => document.querySelector(".app-main").scrollTop);
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button[aria-label*="Plus"], .mp-header-more'));
  btns[btns.length - 1]?.click();
});
await page.waitForTimeout(400);
const clicked = await page.evaluate(() => {
  const item = Array.from(document.querySelectorAll(".mp-header-menu button")).find((b) => /Warsh/.test(b.textContent || ""));
  if (!item) return false;
  item.click();
  return true;
});
await page.waitForTimeout(3500);
const after = await page.evaluate(() => document.querySelector(".app-main").scrollTop);
console.log(`surah mode riwaya switch: clicked=${clicked} scrollTop ${before} -> ${after}`);
await browser.close();
