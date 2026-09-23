import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => {
  localStorage.setItem(
    "mushaf-plus-settings",
    JSON.stringify({ mushafLayout: "mushaf", language: "fr" }),
  );
  window.__big = [];
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      if (e.hadRecentInput || e.value < 0.02) continue;
      window.__big.push({
        v: +e.value.toFixed(4),
        t: Math.round(e.startTime),
        sources: (e.sources || []).map((s) => ({
          node: `${s.node?.tagName}.${String(s.node?.className).slice(0, 40)}`,
          prev: s.previousRect && [Math.round(s.previousRect.x), Math.round(s.previousRect.y), Math.round(s.previousRect.width), Math.round(s.previousRect.height)],
          cur: s.currentRect && [Math.round(s.currentRect.x), Math.round(s.currentRect.y), Math.round(s.currentRect.width), Math.round(s.currentRect.height)],
        })),
      });
    }
  }).observe({ type: "layout-shift", buffered: true });
});
await page.goto("http://127.0.0.1:4191/surah/2", { waitUntil: "domcontentloaded" });
for (let i = 0; i < 25; i++) {
  if (await page.evaluate(() => !!document.querySelector(".virtual-mushaf-page[data-rendered='true'] [data-ayah-number]"))) break;
  await page.waitForTimeout(2000);
}
await page.waitForTimeout(4000);
const out = await page.evaluate(() => {
  const el = document.querySelector(".app-main");
  el.scrollTop = 900;
  return { big: window.__big, scrollH: Math.round(el.scrollHeight) };
});
await page.waitForTimeout(4000);
const after = await page.evaluate(() => ({ big: window.__big, scrollH: Math.round(document.querySelector(".app-main").scrollHeight) }));
console.log(JSON.stringify({ at900: out, after }, null, 1));
await browser.close();
