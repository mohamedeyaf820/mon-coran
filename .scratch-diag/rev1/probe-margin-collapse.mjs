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

const out = await page.evaluate(() => {
  const shells = [...document.querySelectorAll(".virtual-mushaf-page")];
  const rows = shells.slice(0, 6).map((s, i) => {
    const next = shells[i + 1];
    const cs = getComputedStyle(s);
    const child = s.firstElementChild;
    const ccs = child ? getComputedStyle(child) : null;
    return {
      i,
      rendered: s.dataset.rendered,
      offsetH: Math.round(s.offsetHeight),
      gapToNext: next ? Math.round(next.offsetTop - s.offsetTop) : null,
      shellMargin: [cs.marginTop, cs.marginBottom],
      childTag: child?.tagName,
      childClass: child?.className?.toString().slice(0, 60),
      childMargin: ccs ? [ccs.marginTop, ccs.marginBottom] : null,
      grandMargin: child?.firstElementChild
        ? [
            getComputedStyle(child.firstElementChild).marginTop,
            getComputedStyle(child.firstElementChild).marginBottom,
          ]
        : null,
    };
  });
  return rows;
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
