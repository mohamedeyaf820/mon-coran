/**
 * Geometry of one surate row inside the reciter sheet, to see what overlaps what.
 */
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://127.0.0.1:4394";
const browser = await chromium.launch();
const ctx = await browser.newContext({ serviceWorkers: "block", viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => {
  localStorage.setItem(
    "mushaf-plus-settings",
    JSON.stringify({
      skipSplashAnimation: true, showHome: true, sidebarOpen: false, homeSection: "audio",
      riwaya: "hafs", fontFamily: "qpc-hafs", lang: "fr", theme: "light",
    }),
  );
  localStorage.setItem("mushaf-plus-onboarded", "1");
});
const page = await ctx.newPage();
await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForSelector('.home-content-toolbar [role="tab"]', { timeout: 30000 });
await page.locator('.home-content-toolbar [role="tab"]').nth(2).click();
await page.waitForTimeout(1500);
await page.locator(".reciter-card__main").first().click();
await page.waitForSelector(".recitation-row", { timeout: 15000 });
await page.waitForTimeout(1200);

const info = await page.evaluate(() => {
  const row = [...document.querySelectorAll(".recitation-row")].find((r) => !/load-more/.test(r.className));
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return `${Math.round(r.left)}..${Math.round(r.right)} ×${Math.round(r.height)}`;
  };
  const parts = [...row.querySelectorAll("*")]
    .filter((el) => el.children.length === 0 || el.className.toString().match(/__(name|title|meta|actions|number|surah)/))
    .map((el) => ({
      cls: String(el.className).slice(0, 46),
      tag: el.tagName,
      txt: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 26),
      box: box(el),
      overflow: getComputedStyle(el).overflow,
      flex: getComputedStyle(el).flex,
      minW: getComputedStyle(el).minWidth,
    }));
  return { rowBox: box(row), rowCls: row.className, parts: parts.slice(0, 24) };
});
console.log("ROW", info.rowBox, "|", info.rowCls);
for (const p of info.parts) {
  console.log(`${p.tag.padEnd(6)} ${p.cls.padEnd(46)} ${p.box.padEnd(18)} minW=${p.minW.padEnd(7)} "${p.txt}"`);
}
await page.locator(".recitation-row").first().screenshot({ path: ".scratch-diag/rec2/row-1440.png" });
await ctx.close();
await browser.close();
