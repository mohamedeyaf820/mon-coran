import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const KEY = "mushaf-plus-settings";
const browser = await chromium.launch();
for (const theme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 700 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript((a) => localStorage.setItem(a.k, JSON.stringify({ skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false, displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs", quranFontSize: 34, lang: "fr", theme: a.theme, lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } })), { k: KEY, theme });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1400);
  await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((e) => /Charger plus/.test(e.textContent)); if (b) b.scrollIntoView({ block: "center" }); });
  await page.waitForTimeout(600);
  const y = await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((e) => /Charger plus/.test(e.textContent)); if (!b) return -1; b.scrollIntoView({ block: "center" }); return Math.round(b.getBoundingClientRect().top); });
  await page.waitForTimeout(500);
  const clip = { x: 340, y: Math.max(0, Math.min(700 - 160, y - 60)), width: 600, height: 160 };
  await page.screenshot({ path: `.scratch-diag/resp/lm-${theme}-view.png`, clip });
  console.log(theme, "top", y, JSON.stringify(clip));
  await ctx.close();
}
await browser.close();
