import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
  splashCompleted: true, skipSplashAnimation: true, showHome: false,
  displayMode: "surah", mushafLayout: "list", lang: "fr", riwaya: "hafs",
  fontFamily: "qpc-hafs", quranFontSize: 30, showTajwid: false,
})));
await page.goto("http://127.0.0.1:4173/surah/2", { waitUntil: "domcontentloaded" });
const s = page.locator(".splash-screen button").filter({ hasText: /Passer|Skip/ }).first();
if (await s.count()) await s.click({ force: true }).catch(() => {});
await page.waitForSelector(".qc-ayah-text-ar", { timeout: 15000 });
await page.waitForTimeout(1500);
const probe = () => page.evaluate(() => {
  const cands = {
    ".app-main": document.querySelector(".app-main"),
    scrollingElement: document.scrollingElement,
    documentElement: document.documentElement,
    ".app-main-shell": document.querySelector(".app-main-shell"),
    ".quran-display--platform": document.querySelector(".quran-display--platform"),
  };
  return {
    bar: document.querySelector(".app-scroll-progress__bar")?.style.width ?? null,
    dir: document.documentElement.dir + "/" + (document.querySelector(".app-root")?.getAttribute("dir") || "-"),
    cands: Object.fromEntries(Object.entries(cands).filter(([, e]) => e).map(([k, e]) => [k, { room: e.scrollHeight - e.clientHeight, top: e.scrollTop }])),
  };
});
console.log("BEFORE:", JSON.stringify(await probe()));
await page.mouse.move(195, 500);
await page.mouse.wheel(0, 4000);
await page.waitForTimeout(1200);
console.log("AFTER: ", JSON.stringify(await probe()));
await browser.close();
