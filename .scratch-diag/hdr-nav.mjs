// Scratch: why is the title still 44px at 280? Not for commit.
import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const KEY = "mushaf-plus-settings";
const seed = (a) => localStorage.setItem(a.key, JSON.stringify({
  skipSplashAnimation: true, showHome: true, sidebarOpen: false,
  displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
  quranFontSize: 34, lang: a.lang, theme: "light", lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } }));
const browser = await chromium.launch();
for (const w of [280]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 780 } });
  const page = await ctx.newPage();
  await page.addInitScript(seed, { key: KEY, lang: "fr" });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(300);
  await page.evaluate(() => { const b = [...document.querySelectorAll(".home-quick-row, .home-resume-panel__primary")];
    (b.find(n => /reprendre|lecture/i.test(n.innerText)) || b[0])?.click(); });
  await page.waitForSelector(".mp-header__nav", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(900);
  const r = await page.evaluate(() => {
    const bar = document.querySelector(".mp-header__bar");
    const nav = document.querySelector(".mp-header__nav");
    const t = document.querySelector(".mp-header__title-btn");
    const a = document.querySelectorAll(".mp-header__nav-arrow");
    const rect = (n) => n ? +n.getBoundingClientRect().width.toFixed(1) : null;
    return { view: document.querySelector(".app-root").dataset.view,
      barCols: getComputedStyle(bar).gridTemplateColumns, barW: rect(bar),
      navCols: getComputedStyle(nav).gridTemplateColumns, navW: rect(nav), navLeft: +nav.getBoundingClientRect().left.toFixed(1),
      titleW: rect(t), titleMax: getComputedStyle(t).maxWidth, titleFlex: getComputedStyle(t).flex,
      arrows: [...a].map(n => `${rect(n)}/${getComputedStyle(n).display}`),
      kids: [...nav.children].map(n => `${n.className.split(" ").pop()}:${rect(n)}`) };
  });
  console.log(w, JSON.stringify(r, null, 1));
  await ctx.close();
}
await browser.close();
