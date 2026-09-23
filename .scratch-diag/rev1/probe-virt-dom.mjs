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
  if (await page.evaluate(() => !!document.querySelector("[data-ayah-number]"))) break;
  await page.waitForTimeout(2000);
}
await page.waitForTimeout(1500);

const snap = async (label) => {
  const r = await page.evaluate(() => {
    const shells = [...document.querySelectorAll(".virtual-mushaf-page")];
    const rendered = shells.filter((s) => s.dataset.rendered === "true");
    return {
      shells: shells.length,
      rendered: rendered.length,
      dom: document.querySelectorAll("*").length,
      spans: document.querySelectorAll(".quran-text span, .mushaf-word, [data-word-index]").length,
      scrollY: Math.round(window.scrollY),
      docH: Math.round(document.documentElement.scrollHeight),
    };
  });
  console.log(label, JSON.stringify(r));
};

await snap("top   ");
const scroller = await page.evaluate(() => {
  const el = document.querySelector(".app-main") || document.querySelector(".app-main-shell");
  return el ? (el.className || "el") : null;
});
console.log("scroller:", scroller);

for (let i = 1; i <= 8; i++) {
  await page.evaluate((frac) => {
    const el = document.querySelector(".app-main") || document.querySelector(".app-main-shell") || document.scrollingElement;
    el.scrollTop = el.scrollHeight * frac;
    window.scrollTo(0, document.body.scrollHeight * frac);
  }, i / 8);
  await page.waitForTimeout(1200);
  await snap(`scroll ${i}/8`);
}
await browser.close();
