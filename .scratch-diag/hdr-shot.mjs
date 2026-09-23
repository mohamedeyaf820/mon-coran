// Scratch: header height + overflow + screenshot after the :has() guard. Not for commit.
import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4192";
const KEY = "mushaf-plus-settings";
const seed = (a) => localStorage.setItem(a.key, JSON.stringify({
  skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false,
  displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
  quranFontSize: 34, lang: a.lang, theme: a.theme, lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } }));
const browser = await chromium.launch();
for (const [w, lang] of [[280, "fr"], [320, "fr"], [360, "fr"], [430, "fr"], [320, "ar"]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 780 } });
  const page = await ctx.newPage();
  await page.addInitScript(seed, { key: KEY, lang, theme: lang === "ar" ? "dark" : "light" });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(350);
  await page.evaluate(() => { const b = [...document.querySelectorAll(".home-quick-row, .home-resume-panel__primary")];
    (b.find(n => /reprendre|lecture/i.test(n.innerText)) || b[0])?.click(); });
  await page.waitForSelector(".mp-header__nav", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1200);
  const r = await page.evaluate(() => {
    const bar = document.querySelector(".mp-header__bar");
    const sub = document.querySelector(".mp-header__title-sub");
    return { barH: +bar.getBoundingClientRect().height.toFixed(1),
      ovf: document.documentElement.scrollWidth - window.innerWidth,
      subFs: sub ? getComputedStyle(sub).fontSize : "none",
      titleTxt: sub ? (sub.innerText || '').trim().slice(0, 10) : "none",
      translit: document.querySelector(".mp-header__title-transliteration")?.innerText?.trim() };
  });
  console.log(`${w}px ${lang}: barH=${r.barH} overflowX=${r.ovf} arabicFs=${r.subFs} "${r.titleTxt}" "${r.translit}"`);
  await page.screenshot({ path: `.scratch-diag/resp/hdr3-${w}-${lang}.png`, clip: { x: 0, y: 0, width: w, height: 60 } });
  await ctx.close();
}
await browser.close();
