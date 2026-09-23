// Scratch: screenshot the elements whose dead utilities leave a property unset.
import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const KEY = "mushaf-plus-settings";
const browser = await chromium.launch();
for (const theme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript((a) => localStorage.setItem(a.k, JSON.stringify({
    skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false,
    displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
    quranFontSize: 34, lang: "fr", theme: a.theme, lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } })), { k: KEY, theme });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1200);
  const box = await page.evaluate(() => {
    const tb = document.querySelector(".home-content-toolbar");
    const b = tb && tb.getBoundingClientRect();
    return b ? { x: Math.max(0, b.x - 8), y: Math.max(0, b.y - 8), width: Math.min(1280, b.width + 16), height: b.height + 16 } : null;
  });
  if (box) await page.screenshot({ path: `.scratch-diag/resp/dead-toolbar-${theme}.png`, clip: box });
  const btn = await page.$('button:has-text("Charger plus")');
  if (btn) { await btn.scrollIntoViewIfNeeded(); await page.waitForTimeout(200); const b = await btn.boundingBox(); if (b) await page.screenshot({ path: `.scratch-diag/resp/dead-loadmore-${theme}.png`, clip: { x: Math.max(0, b.x - 20), y: Math.max(0, b.y - 20), width: Math.min(1280 - Math.max(0, b.x - 20), b.width + 40), height: Math.min(900 - Math.max(0, b.y - 20), b.height + 40) } }); }
  await ctx.close();
}
await browser.close();
