// Scratch: test the wrap fix live before editing sources. Not for commit.
import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const KEY = "mushaf-plus-settings";
const seed = (a) => localStorage.setItem(a.key, JSON.stringify({
  skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false,
  displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
  quranFontSize: 34, lang: a.lang, theme: "light",
  lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } }));
const FIX = `
@media (max-width: 360px) {
  html body .app-root > .mp-header .mp-header__home-summary-clean {
    white-space: normal !important;
    overflow: visible !important;
    text-overflow: clip !important;
    text-align: center !important;
    line-height: 1.05 !important;
  }
}`;
const browser = await chromium.launch();
for (const fixed of [false, true]) {
  for (const w of [280, 300, 320, 360, 390]) {
    for (const lang of ["fr", "ar"]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 780 } });
      const page = await ctx.newPage();
      await page.addInitScript(seed, { key: KEY, lang });
      await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
      if (fixed) await page.addStyleTag({ content: FIX });
      await page.waitForTimeout(350);
      const r = await page.evaluate(() => {
        const s = document.querySelector(".mp-header__home-summary-clean");
        const b = document.querySelector(".mp-header__home-summary");
        const bar = document.querySelector(".mp-header__bar");
        if (!s) return { missing: true };
        const cs = getComputedStyle(s), bs = getComputedStyle(b);
        const rh = s.getClientRects();
        return {
          text: s.innerText.trim(), sw: s.scrollWidth, cw: s.clientWidth,
          sh: Math.round(s.getBoundingClientRect().height),
          bh: Math.round(b.getBoundingClientRect().height),
          barH: Math.round(bar.getBoundingClientRect().height),
          lines: rh.length, align: cs.textAlign, ta: bs.alignItems, jc: bs.justifyContent,
          ovf: b.scrollHeight > b.clientHeight,
          docScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        };
      });
      console.log(`${fixed ? "FIX " : "RAW "} ${w}px ${lang} ${JSON.stringify(r)}`);
      if (fixed && (w === 280 || w === 360)) {
        await page.screenshot({ path: `.scratch-diag/resp/home-fix-${w}-${lang}.png`, clip: { x: 0, y: 0, width: w, height: 60 } });
      }
      await ctx.close();
    }
  }
}
await browser.close();
