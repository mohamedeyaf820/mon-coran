// Scratch probe: reader header centering delta across phone widths. Not for commit.
import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4192";
const KEY = "mushaf-plus-settings";
const seed = (a) => localStorage.setItem(a.key, JSON.stringify({
  skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false,
  displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
  quranFontSize: 34, lang: a.lang, theme: a.theme, lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } }));
const P = () => {
  const nav = document.querySelector(".mp-header__nav");
  const r = nav.getBoundingClientRect();
  const bar = document.querySelector(".mp-header__bar");
  const kid = (s) => { const n = bar.querySelector(s); if (!n) return "0"; const b = n.getBoundingClientRect();
    const vis = [...n.querySelectorAll("button")].filter(x => x.getBoundingClientRect().width > 0).length;
    return `${b.width.toFixed(1)}/${vis}btn`; };
  const t = document.querySelector(".mp-header__title-btn");
  return { dx: +(r.left + r.width / 2 - innerWidth / 2).toFixed(2), cols: getComputedStyle(bar).gridTemplateColumns,
    brand: kid(".mp-header__brand-row"), acts: kid(".mp-header__actions"), titleW: +t.getBoundingClientRect().width.toFixed(1),
    titleVisible: t.getBoundingClientRect().height > 0 && [...t.querySelectorAll("*")].some(n => n.getBoundingClientRect().height > 0) };
};
const browser = await chromium.launch();
for (const lang of ["fr", "ar"]) {
  let out = [];
  for (const w of [280, 300, 320, 321, 360, 390]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 780 } });
    const page = await ctx.newPage();
    await page.addInitScript(seed, { key: KEY, lang, theme: lang === "ar" ? "dark" : "light" });
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(350);
    await page.evaluate(() => { const b = [...document.querySelectorAll(".home-quick-row, .home-resume-panel__primary")];
      (b.find(n => /reprendre|lecture/i.test(n.innerText)) || b[0])?.click(); });
    await page.waitForSelector(".mp-header__nav", { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(900);
    const r = await page.evaluate(P);
    out.push(`${w}: dx=${r.dx} title=${r.titleW} vis=${r.titleVisible} brand=${r.brand} acts=${r.acts}`);
    await ctx.close();
  }
  console.log(`### ${lang}\n` + out.join("\n"));
}
await browser.close();
