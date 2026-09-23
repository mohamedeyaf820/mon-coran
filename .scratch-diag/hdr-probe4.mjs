// Scratch probe 4: title button HTML. Not for commit.
import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4192";
const KEY = "mushaf-plus-settings";
const seed = (a) => localStorage.setItem(a.key, JSON.stringify({
  skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false,
  displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
  quranFontSize: 34, lang: a.lang, theme: a.theme, lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } }));
const browser = await chromium.launch();
for (const w of [320, 420, 640, 700]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 780 } });
  const page = await ctx.newPage();
  await page.addInitScript(seed, { key: KEY, lang: "fr", theme: "light" });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(400);
  await page.evaluate(() => { const b = [...document.querySelectorAll(".home-quick-row, .home-resume-panel__primary")];
    (b.find(n => /reprendre|lecture/i.test(n.innerText)) || b[0])?.click(); });
  await page.waitForSelector(".mp-header__title-btn", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1200);
  const r = await page.evaluate(() => {
    const btn = document.querySelector(".mp-header__title-btn");
    const vis = [...btn.querySelectorAll("*")].filter(n => n.getBoundingClientRect().height > 0)
      .map(n => `${n.className.toString().split(' ')[0]}:${Math.round(n.getBoundingClientRect().height)}h "${(n.innerText||'').trim().slice(0,14)}"`);
    return { html: btn.innerHTML.replace(/\s+/g, " ").slice(0, 260), vis, compact: document.querySelectorAll(".mp-header__title-compact").length,
      stackH: btn.querySelector(".mp-header__title-stack")?.getBoundingClientRect().height };
  });
  console.log(`\n### ${w}px compactEls=${r.compact} stackH=${r.stackH} visible=[${r.vis.join(" | ")}]`);
  console.log("  " + r.html);
  await ctx.close();
}
await browser.close();
