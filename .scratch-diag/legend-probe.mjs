// Scratch: why is the tajweed legend 151.6px at 1280? Not for commit.
import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const KEY = "mushaf-plus-settings";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
await page.addInitScript(() => localStorage.setItem(KEY, JSON.stringify({
  skipSplashAnimation: true, showHome: true, sidebarOpen: false, showTajwid: true,
  displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
  quranFontSize: 34, lang: "fr", theme: "light", lastPosition: { surah: 53, ayah: 4, page: 531, juz: 27 } })));
await page.goto(`${BASE}/surah/53`, { waitUntil: "domcontentloaded" });
await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 25000 }).catch(() => {});
await page.waitForTimeout(1500);
const r = await page.evaluate(() => {
  const l = document.querySelector('.tajweed-legend');
  if (!l) return { missing: true };
  l.open = true;
  const box = l.getBoundingClientRect();
  const kids = [...l.querySelectorAll(':scope > *')].map(n => `${n.className||n.tagName}:${+n.getBoundingClientRect().height.toFixed(1)}`);
  const rules = [...l.querySelectorAll('.tajweed-legend-item')].slice(0,4).map(n => +n.getBoundingClientRect().height.toFixed(1));
  const cs = getComputedStyle(l);
  return { h: +box.height.toFixed(2), pad: cs.padding, kids, rules, n: l.querySelectorAll('.tajweed-legend-item').length };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
