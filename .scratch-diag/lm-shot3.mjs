import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const KEY = "mushaf-plus-settings";
const browser = await chromium.launch();
for (const theme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 700 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript((a) => localStorage.setItem(a.k, JSON.stringify({ skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false, displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs", quranFontSize: 34, lang: "fr", theme: a.theme, lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } })), { k: KEY, theme });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1400);
  const scroller = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((e) => /Charger plus/.test(e.textContent || ""));
    if (!b) return "no button";
    let n = b;
    while (n && n !== document.documentElement) {
      const cs = getComputedStyle(n);
      if (/(auto|scroll)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight + 4) {
        n.style.scrollBehavior="auto"; n.scrollTop = 999999;
        return n.tagName + "." + String(n.className).slice(0, 40);
      }
      n = n.parentElement;
    }
    return "no scroller";
  });
  await page.waitForTimeout(900);
  const rect = await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((e) => /Charger plus/.test(e.textContent || "")); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  console.log(theme, scroller, JSON.stringify(rect));
  if (rect && rect.y > 0 && rect.y < 640) await page.screenshot({ path: `.scratch-diag/resp/lm-${theme}-v2.png`, clip: { x: Math.max(0, rect.x - 40), y: Math.max(0, rect.y - 30), width: Math.min(1280, rect.w + 80), height: Math.min(700, rect.h + 60) } });
  await ctx.close();
}
await browser.close();
