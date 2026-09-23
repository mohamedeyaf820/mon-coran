// Scratch probe: home header row anatomy at narrow widths. Not for commit.
import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const KEY = "mushaf-plus-settings";
const seed = (a) => localStorage.setItem(a.key, JSON.stringify({
  skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false,
  displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
  quranFontSize: 34, lang: a.lang, theme: "light",
  lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } }));
const browser = await chromium.launch();
for (const w of [280, 300, 320]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 780 } });
  const page = await ctx.newPage();
  await page.addInitScript(seed, { key: KEY, lang: "fr" });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    const bar = document.querySelector(".mp-header__bar");
    const dump = (n, d) => {
      const cs = getComputedStyle(n);
      const rect = n.getBoundingClientRect();
      const lines = [`${"  ".repeat(d)}${n.tagName.toLowerCase()}.${(n.className || "").toString().split(" ").filter(Boolean).join(".")} w=${Math.round(rect.width)} h=${Math.round(rect.height)} disp=${cs.display} shrink=${cs.flexShrink} basis=${cs.flexBasis} pad=${cs.paddingInline} gap=${cs.gap}${cs.display === "none" ? " NONE" : ""}`];
      if (d < 3) for (const c of n.children) lines.push(...dump(c, d + 1));
      return lines;
    };
    return { bar: dump(bar, 0).join("\n"), css: (() => {
      const s = document.querySelector(".mp-header__home-summary-clean");
      const b = document.querySelector(".mp-header__home-summary");
      const m = document.querySelector(".mp-header__home-meta-clean");
      const f = (e) => { const c = getComputedStyle(e); return `${c.fontSize}/${c.fontWeight} ws=${c.whiteSpace} lh=${c.lineHeight}`; };
      return { s: f(s), b: f(b), m: m ? f(m) : null, bp: `${s.clientWidth}vs${s.scrollWidth}` };
    })() };
  });
  console.log(`\n### ${w}px\n${r.bar}\n  summary ${JSON.stringify(r.css)}`);
  await ctx.close();
}
await browser.close();
