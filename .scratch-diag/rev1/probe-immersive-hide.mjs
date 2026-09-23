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
await page.waitForTimeout(2500);

const probe = (wantId) =>
  page.evaluate((id) => {
    const main = document.querySelector(".app-main");
    const marks = [...document.querySelectorAll("[data-ayah-number]")];
    const pick =
      (id ? marks.find((el) => el.getAttribute("data-ayah-number") === id) : null) ||
      marks.find((el) => { const r = el.getBoundingClientRect(); return r.top > 250 && r.top < 450; });
    return {
      immersive: document.querySelector(".app-root").classList.contains("immersive-mode"),
      top: Math.round(main.scrollTop),
      y: pick ? Math.round(pick.getBoundingClientRect().top) : null,
      id: pick ? pick.getAttribute("data-ayah-number") : null,
    };
  }, wantId ?? null);

// Chrome visible, nothing moving. Below 160 px the state machine keeps it shown.
await page.evaluate(() => { document.querySelector(".app-main").scrollTop = 0; });
await page.waitForTimeout(1200);
await page.evaluate(() => { document.querySelector(".app-main").scrollTop = 100; });
await page.waitForTimeout(1200);
const a0 = await probe();
console.log("chrome shown :", JSON.stringify(a0));

// One deliberate 200 px scroll down: this is what hides the chrome.
await page.evaluate(() => { document.querySelector(".app-main").scrollTop += 200; });
await page.waitForTimeout(1200);
const a1 = await probe(a0.id);
console.log("after -200   :", JSON.stringify(a1));
console.log(
  "same marker:", a0.id === a1.id,
  "| moved:", a1.y === null || a0.y === null ? "n/a" : a1.y - a0.y,
  "(expect about -200 when the line is preserved, -263 when it jolts)",
);
await browser.close();
