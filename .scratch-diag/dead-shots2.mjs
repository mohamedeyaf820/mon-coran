// Scratch: element screenshots of suspected dead-utility defects. Not for commit.
import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const KEY = "mushaf-plus-settings";
const browser = await chromium.launch();
for (const theme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript((a) => localStorage.setItem(a.k, JSON.stringify({
    skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false,
    displayMode: "surah", mushafLayout: "grid", riwaya: "hafs", fontFamily: "qpc-hafs",
    quranFontSize: 34, lang: "fr", theme: a.theme, lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } })), { k: KEY, theme });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const shots = [
    ["num", ".hp-card-num"],
    ["loadmore", 'button:has-text("Charger plus")'],
  ];
  for (const [name, sel] of shots) {
    const loc = page.locator(sel).first();
    if (await loc.count() === 0) { console.log(`missing ${name}`); continue; }
    await loc.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(250);
    await loc.screenshot({ path: `.scratch-diag/resp/dead-${name}-${theme}.png` }).catch((e) => console.log(`skip ${name}: ${e.message.slice(0, 60)}`));
  }
  await ctx.close();
}
await browser.close();
