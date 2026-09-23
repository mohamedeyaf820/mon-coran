// Scratch: measure the collection-count dot + toolbar tabs. Not for commit.
import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const KEY = "mushaf-plus-settings";
const browser = await chromium.launch();
for (const theme of ["light", "dark"]) {
  for (const w of [390, 1024]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    await page.addInitScript((a) => localStorage.setItem(a.k, JSON.stringify({
      skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false,
      displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
      quranFontSize: 34, lang: "fr", theme: a.theme, lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } })), { k: KEY, theme });
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(700);
    const r = await page.evaluate(() => {
      const d = document.querySelector(".home-collection-heading__eyebrow span[aria-hidden]");
      if (!d) return "no-dot";
      const cs = getComputedStyle(d), b = d.getBoundingClientRect();
      return { bg: cs.backgroundColor, w: +b.width.toFixed(1), h: +b.height.toFixed(1), radius: cs.borderRadius };
    });
    console.log(`${theme} ${w}px dot=${JSON.stringify(r)}`);
    await ctx.close();
  }
}
await browser.close();
