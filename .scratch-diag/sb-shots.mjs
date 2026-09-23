// Scratch: screenshot the sidebar header/footer dividers. Not for commit.
import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const KEY = "mushaf-plus-settings";
const browser = await chromium.launch();
for (const theme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript((a) => localStorage.setItem(a.k, JSON.stringify({
    skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: true,
    displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
    quranFontSize: 34, lang: "fr", theme: a.theme, lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } })), { k: KEY, theme });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.click('button[aria-controls="sidebar"]').catch((e) => console.log("no menu btn"));
  await page.waitForTimeout(900);
  await page.screenshot({ path: `.scratch-diag/resp/sb-${theme}-top.png`, clip: { x: 0, y: 0, width: 380, height: 320 } });
  const foot = await page.evaluate(() => { const el = document.querySelector(".sb-wrapper > div:last-child"); if (!el) return null; const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height }; });
  console.log(theme, "footer", JSON.stringify(foot));
  if (foot && foot.y > 0 && foot.y < 900) await page.screenshot({ path: `.scratch-diag/resp/sb-${theme}-foot.png`, clip: { x: Math.max(0, foot.x - 4), y: Math.max(0, foot.y - 4), width: Math.min(380, foot.width + 8), height: Math.min(900 - Math.max(0, foot.y - 4), foot.height + 8) } });
  await ctx.close();
}
await browser.close();
