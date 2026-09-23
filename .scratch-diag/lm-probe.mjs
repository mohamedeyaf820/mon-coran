import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const KEY = "mushaf-plus-settings";
const browser = await chromium.launch();
for (const theme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript((a) => localStorage.setItem(a.k, JSON.stringify({ skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false, displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs", quranFontSize: 34, lang: "fr", theme: a.theme, lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } })), { k: KEY, theme });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1400);
  const loc = page.locator('button:has-text("Charger plus")').first();
  if (await loc.count() === 0) { console.log(theme, "no button"); await ctx.close(); continue; }
  await loc.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  console.log(theme, JSON.stringify(await loc.evaluate((e) => { const c = getComputedStyle(e); return { bg: c.backgroundColor, color: c.color, bd: c.borderTopWidth + " " + c.borderTopColor, r: c.borderRadius }; })));
  await loc.screenshot({ path: `.scratch-diag/resp/lm-${theme}.png` }).catch(() => {});
  await ctx.close();
}
await browser.close();
