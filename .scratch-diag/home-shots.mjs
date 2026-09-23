// Scratch: home screenshots to judge the missing chip backgrounds. Not for commit.
import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const KEY = "mushaf-plus-settings";
const browser = await chromium.launch();
for (const w of [390, 1024]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript((k) => localStorage.setItem(k, JSON.stringify({
    skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false,
    displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
    quranFontSize: 34, lang: "fr", theme: "light", lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } })), KEY);
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(900);
  const el = await page.$(".home-content-toolbar");
  if (el) { const b = await el.boundingBox(); await page.screenshot({ path: `.scratch-diag/resp/home-${w}.png`, clip: { x: 0, y: b.y - 8, width: w, height: Math.min(420, 900 - b.y) } }); }
  await ctx.close();
}
await browser.close();
