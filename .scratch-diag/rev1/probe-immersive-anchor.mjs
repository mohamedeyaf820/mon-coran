import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => {
  localStorage.setItem(
    "mushaf-plus-settings",
    JSON.stringify({ mushafLayout: "mushaf", language: "fr" }),
  );
  window.__cls = 0;
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      if (e.hadRecentInput) continue;
      window.__cls += e.value;
    }
  }).observe({ type: "layout-shift", buffered: true });
});
await page.goto("http://127.0.0.1:4191/surah/2", { waitUntil: "domcontentloaded" });
for (let i = 0; i < 25; i++) {
  if (await page.evaluate(() => !!document.querySelector(".virtual-mushaf-page[data-rendered='true'] [data-ayah-number]"))) break;
  await page.waitForTimeout(2000);
}
await page.waitForTimeout(2500);

const state = () =>
  page.evaluate(() => {
    const main = document.querySelector(".app-main");
    const anchor = [...document.querySelectorAll("[data-ayah-number]")].find((el) => {
      const r = el.getBoundingClientRect();
      return r.top > 200 && r.top < 500;
    });
    return {
      immersive: document.querySelector(".app-root").classList.contains("immersive-mode"),
      top: Math.round(main.scrollTop),
      mainTop: Math.round(main.getBoundingClientRect().top),
      anchor: anchor ? Math.round(anchor.getBoundingClientRect().top) : null,
      id: anchor ? anchor.getAttribute("data-ayah-number") : null,
      fixed: Math.round(document.querySelector(".virtual-mushaf-page[data-rendered='true']").getBoundingClientRect().top),
      cls: +window.__cls.toFixed(4),
    };
  });

await page.evaluate(() => { document.querySelector(".app-main").scrollTop = 0; });
await page.waitForTimeout(900);
await page.evaluate(() => { document.querySelector(".app-main").scrollTop = 400; });
await page.waitForTimeout(600);
const before = await state();
console.log("before hide:", JSON.stringify(before));

await page.evaluate(() => {
  const main = document.querySelector(".app-main");
  main.dispatchEvent(new Event("scroll"));
  main.scrollTop = 520;
});
await page.waitForTimeout(700);
const after = await state();
console.log("after  hide:", JSON.stringify(after));

await page.waitForTimeout(1500);
const settled = await state();
console.log("settled     :", JSON.stringify(settled));

await page.evaluate(() => { document.querySelector(".app-main").scrollTop = 460; });
await page.waitForTimeout(700);
const revealed = await state();
console.log("after reveal:", JSON.stringify(revealed));

console.log(
  "anchor drift hide:", (after.anchor ?? 0) - (before.anchor ?? 0),
  "| stuck immersive:", settled.immersive,
  "| drift reveal:", (revealed.anchor ?? 0) - (settled.anchor ?? 0),
);
await browser.close();
