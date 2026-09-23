import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
  splashCompleted: true, skipSplashAnimation: true, showHome: false,
  displayMode: "page", mushafLayout: "list", lang: "fr", riwaya: "hafs",
  fontFamily: "qpc-hafs", quranFontSize: 30, showTajwid: false,
})));
await page.goto("http://127.0.0.1:4173/page/3", { waitUntil: "domcontentloaded" });
const s = page.locator(".splash-screen button").filter({ hasText: /Passer|Skip/ }).first();
if (await s.count()) await s.click({ force: true }).catch(() => {});
await page.waitForSelector(".qc-ayah-text-ar", { timeout: 15000 });
await page.waitForTimeout(1200);

const layout0 = await page.evaluate(() => document.querySelector(".quran-display")?.className);
await page.evaluate(() => { document.querySelector(".app-main").scrollTop = 3000; });
await page.waitForTimeout(300);
console.log("before toggle:", await page.evaluate(() => document.querySelector(".app-main").scrollTop), layout0);

const menuBtn = page.locator('button[aria-label*="Plus"], .mp-header-more').last();
console.log("menu found:", await menuBtn.count());
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button[aria-label*="Plus"], .mp-header-more'));
  btns[btns.length - 1]?.click();
});
await page.waitForTimeout(400);
await page.evaluate(() => {
  window.__scrollCalls = [];
  const orig = Element.prototype.scrollTo;
  Element.prototype.scrollTo = function (...args) {
    if (this.classList?.contains("app-main")) window.__scrollCalls.push(`${performance.now().toFixed(0)}:${JSON.stringify(args)}`);
    return orig.apply(this, args);
  };
});
const found = await page.evaluate(() => {
  const item = Array.from(document.querySelectorAll(".mp-header-menu button")).find((b) => /Mushaf/.test(b.textContent || ""));
  if (!item) return false;
  item.click();
  return true;
});
console.log("mushaf item clicked:", found);

const samples = [];
for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(50);
  samples.push(await page.evaluate(() => {
    const el = document.querySelector(".app-main");
    const active = document.querySelector('.mp-header-menu button[aria-pressed="true"] span, .qc-reader-toolbar__modes .is-active span');
    return `${el?.scrollTop}|${el?.scrollHeight}|${active?.textContent || "?"}`;
  }));
}
console.log("scrollTop|scrollHeight|active samples:", samples.join("\n"));
console.log("programmatic scrollTo calls:", await page.evaluate(() => window.__scrollCalls.join(", ")));
const layout1 = await page.evaluate(() => document.querySelector(".quran-display")?.className);
console.log("after toggle:", layout1);
await browser.close();
