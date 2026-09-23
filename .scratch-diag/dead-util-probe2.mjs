// Scratch: measure the load-more button and the audio discovery panel. Not for commit.
import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const KEY = "mushaf-plus-settings";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.addInitScript((k) => localStorage.setItem(k, JSON.stringify({
  skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false,
  displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
  quranFontSize: 34, lang: "fr", theme: "light", lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } })), KEY);
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(1200);

const report = (label) => page.evaluate((label) => {
  const rows = [];
  for (const e of document.querySelectorAll("button,div,span")) {
    const cl = typeof e.className === "string" ? e.className : "";
    if (!/\b(bg-bg-secondary|bg-bg-card\/\d+|bg-bg-tertiary|border-border|border-primary\/\d+|bg-primary\/\d+)\b/.test(cl)) continue;
    const c = getComputedStyle(e);
    rows.push({ label, cls: cl.slice(0, 78), bg: c.backgroundColor, bd: c.borderTopWidth + " " + c.borderTopColor, txt: (e.textContent || "").trim().slice(0, 22) });
  }
  return rows;
}, label);

console.log(JSON.stringify(await report("surah"), null, 0).replace(/\},\{/g, "},\n{"));
const loadMore = page.locator('button:has-text("Charger plus")').first();
if (await loadMore.count()) {
  await loadMore.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await loadMore.screenshot({ path: ".scratch-diag/resp/dead-loadmore2.png" }).catch((e) => console.log("shot skipped: " + e.message.slice(0, 50)));
}

await page.locator('[role="tab"]:has-text("Audio")').first().click();
await page.waitForTimeout(1500);
console.log(JSON.stringify(await report("audio"), null, 0).replace(/\},\{/g, "},\n{"));
await page.screenshot({ path: ".scratch-diag/resp/dead-audio-panel.png", clip: { x: 0, y: 0, width: 1280, height: 900 } });
await browser.close();
