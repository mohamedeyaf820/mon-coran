// Scratch probe 3: title button internals. Not for commit.
import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4192";
const KEY = "mushaf-plus-settings";
const seed = (a) => localStorage.setItem(a.key, JSON.stringify({
  skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false,
  displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
  quranFontSize: 34, lang: a.lang, theme: a.theme, lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } }));
const P = () => [...document.querySelectorAll(".mp-header__title-btn *")].map((n) => {
  const r = n.getBoundingClientRect(); const c = getComputedStyle(n);
  return `${n.tagName.toLowerCase()}.${(n.className||'').toString().split(' ').slice(0,3).join('.')} ${r.width.toFixed(1)}x${r.height.toFixed(1)} disp=${c.display} vis=${c.visibility} op=${c.opacity} fs=${c.fontSize} col=${c.color} txt="${(n.innerText||n.textContent||'').trim().replace(/\s+/g,' ').slice(0,24)}"`;
});
const browser = await chromium.launch();
for (const w of [320, 390, 768]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 780 } });
  const page = await ctx.newPage();
  await page.addInitScript(seed, { key: KEY, lang: "fr", theme: "light" });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(400);
  await page.evaluate(() => { const b = [...document.querySelectorAll(".home-quick-row, .home-resume-panel__primary")];
    (b.find(n => /reprendre|lecture/i.test(n.innerText)) || b[0])?.click(); });
  await page.waitForSelector(".mp-header__title-btn", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1500);
  console.log(`\n### ${w}px`);
  for (const l of await page.evaluate(P)) console.log("  " + l);
  await ctx.close();
}
await browser.close();
