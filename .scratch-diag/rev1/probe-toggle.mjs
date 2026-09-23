import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";

const BASE = "http://127.0.0.1:4191";
const log = (...a) => console.log(...a);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
page.on("pageerror", (e) => log("PAGEERROR", e.message));

await page.goto(BASE + "/surah/2/40", { waitUntil: "domcontentloaded" });
for (let i = 0; i < 20; i++) { if (await page.evaluate(() => !!document.querySelector("[data-ayah-number]"))) break; await page.waitForTimeout(2000); }
await page.waitForTimeout(2500);

const topVerse = () => page.evaluate(() => {
  const els = [...document.querySelectorAll("[data-ayah-number]")];
  const vis = els.map((e) => ({ n: Number(e.getAttribute("data-ayah-number")), top: e.getBoundingClientRect().top }))
    .filter((x) => x.top > -2000);
  vis.sort((a, b) => Math.abs(a.top - 120) - Math.abs(b.top - 120));
  return vis[0]?.n ?? null;
});
const scroller = () => page.evaluate(() => {
  const el = [...document.querySelectorAll(".app-main, main, [class*='scroll']")].find((x) => x.scrollHeight > x.clientHeight + 200);
  return el ? (el.className || el.tagName).slice(0, 40) : null;
});

log("scroller:", await scroller(), "top verse at load:", await topVerse());
await page.waitForTimeout(2500);
const before = await topVerse();
log("currentAyah anchor present:", await page.evaluate(() => !!document.getElementById("ayah-40")));
log("after scrolling:", before);

const pill = async (label) => page.evaluate((l) => {
  const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === l);
  if (!b) return false;
  b.click();
  return true;
}, label);

log("click Mushaf:", await pill("Mushaf"));
await page.waitForTimeout(3500);
log("in mushaf, verse near top:", await topVerse(), "| page marker:", await page.evaluate(() => document.querySelector("[data-page-number], .qcm-page")?.getAttribute("data-page-number") ?? null));
await page.screenshot({ path: ".scratch-diag/rev1/toggle-mushaf.png" });

log("click Liste:", await pill("Liste"));
await page.waitForTimeout(3000);
const after = await topVerse();
log("back in list, verse near top:", after, before === after ? "(kept)" : `(LOST: was ${before})`);
await browser.close();
