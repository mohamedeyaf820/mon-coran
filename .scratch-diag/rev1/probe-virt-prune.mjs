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

const snap = async (label) => {
  const r = await page.evaluate(() => {
    const shells = [...document.querySelectorAll(".virtual-mushaf-page")];
    const root = document.querySelector(".app-main");
    return {
      rendered: shells.filter((s) => s.dataset.rendered === "true").length,
      dom: document.querySelectorAll("*").length,
      scrollH: Math.round(root.scrollHeight),
      top: Math.round(root.scrollTop),
      firstRect: (() => {
        const b = shells[0].getBoundingClientRect();
        return [Math.round(b.top), Math.round(b.height)];
      })(),
      lastRenderedRect: (() => {
        const rendered = shells.filter((s) => s.dataset.rendered === "true");
        const b = rendered[rendered.length - 1].getBoundingClientRect();
        return [Math.round(b.top), Math.round(b.height)];
      })(),
    };
  });
  console.log(label, JSON.stringify(r));
  return r;
};

const scrollTo = async (frac) => {
  await page.evaluate((f) => {
    const el = document.querySelector(".app-main");
    el.scrollTop = el.scrollHeight * f;
  }, frac);
  await page.waitForTimeout(1400);
};

await snap("top      ");
await scrollTo(0.5);
const mid = await snap("middle   ");
await scrollTo(1);
const bottom = await snap("bottom   ");
await scrollTo(0);
const backTop = await snap("back-top ");

// Same anchor twice: the middle page must sit at the same offset from the top
// of the scroll container whether or not pages were pruned behind it.
await scrollTo(0.5);
const midAgain = await snap("middle2  ");
console.log(
  "drift(px):",
  midAgain.lastRenderedRect[1] - mid.lastRenderedRect[1],
  "scrollHeight:",
  bottom.scrollH,
  "->",
  backTop.scrollH,
  "->",
  midAgain.scrollH,
);
await page.screenshot({ path: ".scratch-diag/rev1/virt-prune.png" });
await browser.close();
