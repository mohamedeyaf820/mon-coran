// Scratch probe 2: header track + brand-row children. Not for commit.
import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4192";
const KEY = "mushaf-plus-settings";
const seed = (a) => localStorage.setItem(a.key, JSON.stringify({
  skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false,
  displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
  quranFontSize: 34, lang: a.lang, theme: a.theme, lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } }));
const P = () => {
  const bar = document.querySelector(".mp-header__bar");
  const dump = (n) => { const r = n.getBoundingClientRect(); const c = getComputedStyle(n);
    return `${n.tagName.toLowerCase()}.${(n.className||'').toString().split(' ').slice(0,2).join('.')} ${r.width.toFixed(1)}w x=${r.x.toFixed(1)} disp=${c.display} flex=${c.flex} grid=${c.gridTemplateColumns} aria="${n.getAttribute('aria-label')||''}" txt="${(n.innerText||'').trim().replace(/\s+/g,' ').slice(0,18)}"`; };
  const kids = (s) => [...(document.querySelector(s)?.children || [])].map(dump);
  return { cols: getComputedStyle(bar).gridTemplateColumns, bar: kids('.mp-header__bar').length,
    brand: kids('.mp-header__brand-row'), center: kids('.mp-header__center'), actions: kids('.mp-header__actions'),
    nav: kids('.mp-header__nav') };
};
const browser = await chromium.launch();
for (const w of [320, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 780 } });
  const page = await ctx.newPage();
  await page.addInitScript(seed, { key: KEY, lang: "fr", theme: "light" });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(400);
  await page.evaluate(() => { const b = [...document.querySelectorAll(".home-quick-row, .home-resume-panel__primary")];
    (b.find(n => /reprendre|lecture/i.test(n.innerText)) || b[0])?.click(); });
  await page.waitForSelector(".mp-header__nav", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(800);
  const r = await page.evaluate(P);
  console.log(`\n### ${w}px  cols=${r.cols}`);
  for (const [k, v] of Object.entries(r)) if (Array.isArray(v)) { console.log(` ${k}:`); v.forEach(x => console.log("   " + x)); }
  await ctx.close();
}
await browser.close();
