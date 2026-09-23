// Scratch: verify the committed home-summary wrap rule on the rebuilt export. Not for commit.
import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const KEY = "mushaf-plus-settings";
const seed = (a) => localStorage.setItem(a.key, JSON.stringify({
  skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false,
  displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
  quranFontSize: 34, lang: a.lang, theme: "light",
  lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } }));
const browser = await chromium.launch();
for (const w of [280, 300, 301, 320, 360, 390, 412]) {
  for (const lang of ["fr", "ar"]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 780 } });
    const page = await ctx.newPage();
    await page.addInitScript(seed, { key: KEY, lang });
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => {
      const s = document.querySelector(".mp-header__home-summary-clean");
      const b = document.querySelector(".mp-header__home-summary");
      const bar = document.querySelector(".mp-header__bar");
      const de = document.documentElement;
      const rects = [...s.getClientRects()];
      const overlaps = [...bar.querySelectorAll("button")].filter((o) => o !== b && o.getBoundingClientRect().width > 0)
        .map((o) => { const a = b.getBoundingClientRect(), c = o.getBoundingClientRect();
          return Math.max(0, Math.min(a.right, c.right) - Math.max(a.left, c.left)) *
                 Math.max(0, Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top)); })
        .reduce((m, v) => Math.max(m, v), 0);
      return {
        txt: s.innerText.trim().replace(/\s+/g, " "), cut: s.scrollWidth - s.clientWidth,
        lines: rects.length || 1, sh: +s.getBoundingClientRect().height.toFixed(1),
        bh: +b.getBoundingClientRect().height.toFixed(1), barH: +bar.getBoundingClientRect().height.toFixed(1),
        ov: +overlaps.toFixed(1), ox: de.scrollWidth - de.clientWidth,
      };
    });
    console.log(`${w}px ${lang} ${JSON.stringify(r)}`);
    if (lang === "fr" && (w === 280 || w === 320)) {
      await page.screenshot({ path: `.scratch-diag/resp/hs-${w}-${lang}.png`, clip: { x: 0, y: 0, width: w, height: 60 } });
    }
    await ctx.close();
  }
}
await browser.close();
