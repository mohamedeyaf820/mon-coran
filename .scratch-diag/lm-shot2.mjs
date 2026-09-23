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
  const info = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((e) => /Charger plus/.test(e.textContent || ""));
    if (!b) return null;
    b.scrollIntoView({ block: "center", behavior: "instant" });
    return { txt: b.textContent.trim().slice(0, 30) };
  });
  await page.waitForTimeout(900);
  const rect = await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((e) => /Charger plus/.test(e.textContent || "")); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  console.log(theme, JSON.stringify(info), JSON.stringify(rect));
  if (rect && rect.y > 0 && rect.y < 640) await page.screenshot({ path: `.scratch-diag/resp/lm-${theme}-v2.png`, clip: { x: Math.max(0, rect.x - 30), y: Math.max(0, rect.y - 25), width: Math.min(1280, rect.w + 60), height: Math.min(700, rect.h + 50) } });
  await ctx.close();
}
await browser.close();
