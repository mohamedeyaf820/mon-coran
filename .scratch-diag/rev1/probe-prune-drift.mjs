import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => {
  localStorage.setItem(
    "mushaf-plus-settings",
    JSON.stringify({ mushafLayout: "mushaf", language: "fr" }),
  );
});
await page.goto("http://127.0.0.1:4191/surah/2", { waitUntil: "domcontentloaded" });
for (let i = 0; i < 25; i++) {
  if (await page.evaluate(() => !!document.querySelector(".virtual-mushaf-page[data-rendered='true'] [data-ayah-number]"))) break;
  await page.waitForTimeout(2000);
}
await page.waitForTimeout(1500);

const seen = new Map();
const collect = async () => {
  const rows = await page.evaluate(() =>
    [...document.querySelectorAll(".virtual-mushaf-page")].map((s) => ({
      i: Number(s.dataset.virtualPageIndex),
      rendered: s.dataset.rendered === "true",
      h: s.getBoundingClientRect().height,
      min: s.style.minHeight || null,
    })),
  );
  for (const r of rows) {
    const prev = seen.get(r.i) || {};
    if (r.rendered) prev.renderedH = r.h;
    else if (prev.renderedH !== undefined) prev.placeholderH = r.h;
    seen.set(r.i, prev);
  }
};

const step = 700;
const max = await page.evaluate(() => document.querySelector(".app-main").scrollHeight);
for (let y = 0; y <= max; y += step) {
  await page.evaluate((v) => {
    document.querySelector(".app-main").scrollTop = v;
  }, y);
  await page.waitForTimeout(450);
  await collect();
}

const both = [...seen.entries()].filter(
  ([, v]) => v.renderedH !== undefined && v.placeholderH !== undefined,
);
const diffs = both
  .map(([i, v]) => ({ i, d: +(v.placeholderH - v.renderedH).toFixed(2) }))
  .filter((x) => Math.abs(x.d) > 0.5);
console.log(
  JSON.stringify({
    pages: seen.size,
    bothStates: both.length,
    drifted: diffs.length,
    worst: diffs.sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, 8),
    totalDrift: +both.reduce((n, [, v]) => n + (v.placeholderH - v.renderedH), 0).toFixed(1),
  }),
);
await browser.close();
