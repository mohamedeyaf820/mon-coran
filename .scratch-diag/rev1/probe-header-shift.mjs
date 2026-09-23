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
await page.waitForTimeout(2000);

const tree = () =>
  page.evaluate(() => {
    const walk = (el, depth, out) => {
      for (const child of el.children) {
        const r = child.getBoundingClientRect();
        if (r.height > 0 || r.y !== 0) {
          out.push({
            d: depth,
            n: `${child.tagName}.${String(child.className).slice(0, 44)}`,
            y: Math.round(r.y),
            h: Math.round(r.height),
            pos: getComputedStyle(child).position,
          });
        }
        if (depth < 2) walk(child, depth + 1, out);
      }
    };
    const out = [];
    walk(document.querySelector(".app-root") || document.body, 0, out);
    return out.filter((r) => r.h > 8 && r.h < 200);
  });

console.log("--- scrollTop 0 ---");
console.log(JSON.stringify(await tree(), null, 0));
await page.evaluate(() => { document.querySelector(".app-main").scrollTop = 900; });
await page.waitForTimeout(5000);
console.log("--- scrollTop 900 (after 5s) ---");
console.log(JSON.stringify(await tree(), null, 0));
await browser.close();
