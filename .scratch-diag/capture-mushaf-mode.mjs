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
// open the "..." quick menu, then tap the Mushaf item
const dots = page.locator('button[aria-label*="Plus"], button[aria-label*="menu"], button[aria-label*="More"], .mp-header-more').last();
await dots.click().catch((e) => console.log("dots fail", e.message.split("\n")[0]));
await page.waitForTimeout(600);
const item = page.locator('.mp-header-menu button, [role="menu"] button').filter({ hasText: /Mushaf/ }).first();
console.log("menu items:", await page.locator('.mp-header-menu button').allTextContents());
await item.click().catch((e) => console.log("item fail", e.message.split("\n")[0]));
await page.waitForTimeout(2500);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: `${OUT}/mushafmode-390.png` });
const info = await page.evaluate(() => ({
  hasQcm: !!document.querySelector(".qcm-lines"),
  hasCpv: !!document.querySelector(".cpv-flow"),
  font: getComputedStyle(document.querySelector(".qcm-word") || document.querySelector(".cpv-flow span") || document.body).fontFamily.slice(0, 70),
}));
console.log(JSON.stringify(info));
await browser.close();
