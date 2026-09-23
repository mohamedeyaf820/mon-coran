import { chromium } from "playwright";
import fs from "node:fs";
const BASE = "http://127.0.0.1:4173";
const OUT = ".scratch-diag/captures/reading-review";
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(`${BASE}/surah/2`, { waitUntil: "domcontentloaded" });
if (await page.locator(".splash-screen").count()) {
  await page.locator(".splash-screen button", { hasText: /Passer|Skip/ }).first().click().catch(() => {});
  await page.waitForSelector(".splash-screen", { state: "detached", timeout: 10000 }).catch(() => {});
}
await page.waitForTimeout(2000);
const dots = page.locator('button[aria-label*="Plus"], button[aria-label*="menu"], button[aria-label*="More"], .mp-header-more').last();
await dots.click();
await page.waitForTimeout(500);
await page.locator('.mp-header-menu button').filter({ hasText: /^Mushaf$/ }).first().click();
await page.waitForTimeout(400);
await page.locator('.mp-header-menu button').first().press("Escape").catch(() => {});
await page.mouse.click(195, 800);
await page.waitForTimeout(2200);
await page.evaluate(() => document.fonts.ready);
const info = await page.evaluate(() => {
  const words = document.querySelectorAll(".qcm-word");
  const el = words[0] || document.querySelector(".cpv-flow span");
  return {
    qcmWords: words.length,
    cls: el?.className?.slice?.(0, 40),
    font: el ? getComputedStyle(el).fontFamily.slice(0, 60) : null,
    pane: document.querySelector(".quran-mode-pane--mushaf")?.className || document.querySelector('[class*="mode-pane"]')?.className,
  };
});
console.log(JSON.stringify(info));
await page.screenshot({ path: `${OUT}/mushaf-clean-390.png` });
await browser.close();
