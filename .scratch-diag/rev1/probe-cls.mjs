import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => {
  localStorage.setItem(
    "mushaf-plus-settings",
    JSON.stringify({ mushafLayout: "mushaf", language: "fr" }),
  );
  window.__cls = 0;
  window.__shifts = [];
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      if (e.hadRecentInput) continue;
      window.__cls += e.value;
      const el = document.querySelector(".app-main");
      window.__shifts.push({
        v: +e.value.toFixed(4),
        y: el ? Math.round(el.scrollTop) : Math.round(window.scrollY),
        t: Math.round(e.startTime),
        src: (e.sources || [])
          .slice(0, 2)
          .map((s) => `${s.node?.className || s.node?.nodeName || "?"}`.slice(0, 48)),
      });
    }
  }).observe({ type: "layout-shift", buffered: true });
});
await page.goto("http://127.0.0.1:4191/surah/2", { waitUntil: "domcontentloaded" });
for (let i = 0; i < 25; i++) {
  if (await page.evaluate(() => !!document.querySelector(".virtual-mushaf-page[data-rendered='true'] [data-ayah-number]"))) break;
  await page.waitForTimeout(2000);
}
await page.waitForTimeout(1500);
const first = await page.evaluate(() => ({ cls: +window.__cls.toFixed(4), shifts: window.__shifts.slice(0, 12) }));
console.log("after load:", JSON.stringify(first));
const loadShiftCount = first.shifts.length;

const max = await page.evaluate(() => document.querySelector(".app-main").scrollHeight);
for (let y = 0; y <= max; y += 900) {
  await page.evaluate((v) => { document.querySelector(".app-main").scrollTop = v; }, y);
  await page.waitForTimeout(400);
}
const after = await page.evaluate((from) => ({
  cls: +window.__cls.toFixed(4),
  worst: window.__shifts.slice(from).sort((a, b) => b.v - a.v).slice(0, 6),
  count: window.__shifts.length - from,
}), loadShiftCount);
console.log("after walk:", JSON.stringify(after));
await browser.close();
