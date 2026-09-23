// Scratch probe: home header summary truncation. Not for commit.
import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const KEY = "mushaf-plus-settings";
const seed = (a) => localStorage.setItem(a.key, JSON.stringify({
  skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false,
  displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
  quranFontSize: 34, lang: a.lang, theme: "light",
  lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } }));
const browser = await chromium.launch();
for (const w of [280, 300, 320, 360, 390]) {
  for (const lang of ["fr", "ar"]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 780 } });
    const page = await ctx.newPage();
    await page.addInitScript(seed, { key: KEY, lang });
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => {
      const s = document.querySelector(".mp-header__home-summary-clean");
      if (!s) return { missing: true, view: document.querySelector(".app-root")?.dataset.view };
      const chain = [];
      let n = s;
      while (n && n !== document.body) {
        const cs = getComputedStyle(n);
        const rect = n.getBoundingClientRect();
        chain.push({
          sel: `${n.tagName.toLowerCase()}.${(n.className || "").toString().split(" ").filter(Boolean).slice(0, 2).join(".")}`,
          w: +rect.width.toFixed(1), clip: cs.textOverflow, ov: cs.overflow,
          flex: cs.flex, minW: cs.minWidth, ws: cs.whiteSpace,
          sw: n.scrollWidth, cw: n.clientWidth,
        });
        n = n.parentElement;
      }
      const cs = getComputedStyle(s);
      const rect = s.getBoundingClientRect();
      return {
        text: s.innerText.trim().slice(0, 40), w: +rect.width.toFixed(1),
        sw: s.scrollWidth, cw: s.clientWidth, delta: s.scrollWidth - s.clientWidth,
        font: `${cs.fontSize}/${cs.fontWeight}`, chain,
      };
    });
    if (r.missing) { console.log(`### ${w}px ${lang} — no summary element (view=${r.view})`); }
    else {
      console.log(`\n### ${w}px ${lang} "${r.text}" w=${r.w} scrollW=${r.sw} clientW=${r.cw} delta=${r.delta} font=${r.font}`);
      for (const c of r.chain) console.log(`   ${c.sel} w=${c.w} sw=${c.sw} cw=${c.cw} ov=${c.ov} clip=${c.clip} flex=${c.flex} minW=${c.minW} ws=${c.ws}`);
    }
    await ctx.close();
  }
}
await browser.close();
