// Scratch probe: header allocation at very narrow widths (Lot R4).
import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:4187";
const KEY = "mushaf-plus-settings";
const seedFn = (args) => {
  localStorage.setItem(args.key, JSON.stringify({
    skipSplashAnimation: true, showHome: false, showDuas: false, sidebarOpen: false,
    displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
    quranFontSize: 34, lang: args.lang, theme: args.theme,
    lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 },
  }));
};

const PROBE = () => {
  const q = (s) => document.querySelector(s);
  const box = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return `${r.width.toFixed(1)}x${r.height.toFixed(1)}@${r.x.toFixed(0)}`;
  };
  const bar = q(".mp-header__bar");
  const kids = bar
    ? [...bar.children].map((c) => `${c.className.split(/\s+/)[0]}:${c.getBoundingClientRect().width.toFixed(1)}`)
    : [];
  const nav = q(".mp-header__nav");
  const navKids = nav ? [...nav.children].map((c) => `${(c.className || "").split(/\s+/)[0] || c.tagName.toLowerCase()}:${c.getBoundingClientRect().width.toFixed(1)}`) : [];
  const acts = q(".mp-header__actions");
  const actKids = acts ? [...acts.children].map((c) => {
    const r = c.getBoundingClientRect();
    const cs = getComputedStyle(c);
    return `${(c.className || "").split(/\s+/)[0] || c.tagName.toLowerCase()}:${r.width.toFixed(1)}${cs.display === "none" ? "(hidden)" : ""}`;
  }) : [];
  const compact = q(".mp-header__title-compact-la");
  const compactAr = q(".mp-header__title-compact-ar");
  return {
    barDisplay: bar ? getComputedStyle(bar).display : "",
    barPad: bar ? getComputedStyle(bar).paddingInline : "",
    gap: bar ? getComputedStyle(bar).gap : "",
    kids, navKids, actKids,
    navW: nav?.getBoundingClientRect().width,
    navCols: nav ? getComputedStyle(nav).gridTemplateColumns : "",
    titleBtn: box(q(".mp-header__title-btn")),
    compactLa: compact ? { box: box(compact), sw: compact.scrollWidth, dx: compact.scrollWidth - compact.clientWidth } : null,
    compactAr: compactAr ? { box: box(compactAr), sw: compactAr.scrollWidth, dx: compactAr.scrollWidth - compactAr.clientWidth } : null,
  };
};

const browser = await chromium.launch();
for (const w of [280, 320, 360, 390]) {
  for (const lang of ["fr", "ar"]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    await page.addInitScript(seedFn, { key: KEY, lang, theme: "light" });
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
    await page.waitForSelector(".mp-header__bar", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(500);
    const r = await page.evaluate(PROBE);
    console.log(`\n### ${w}px ${lang} bar=${r.barDisplay} pad=${r.barPad} gap=${r.gap}`);
    console.log(`  bar kids: ${r.kids?.join(" | ")}`);
    console.log(`  actions : ${r.actKids?.join(" | ")}`);
    console.log(`  nav w=${r.navW} cols=${r.navCols} kids=${r.navKids?.join(" | ")}`);
    console.log(`  titleBtn=${r.titleBtn} compactLa=${JSON.stringify(r.compactLa)} compactAr=${JSON.stringify(r.compactAr)}`);
    await ctx.close();
  }
}
await browser.close();
