import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const pg = await browser.newPage({ viewport: { width: 393, height: 851 }, deviceScaleFactor: 4 });
await pg.addInitScript(() => {
  localStorage.setItem("mushaf-plus-settings", JSON.stringify({
    skipSplashAnimation: true, showHome: false, showDuas: false, sidebarOpen: false,
    displayMode: "page", mushafLayout: "mushaf", lang: "fr", riwaya: "hafs",
    fontFamily: "qpc-hafs", showTranslation: false, showTajwid: true, showTransliteration: false,
    currentSurah: 2, currentPage: 3, currentJuz: 1,
    lastPosition: { surah: 2, ayah: 19, page: 3, juz: 1 },
  }));
});
await pg.goto("http://127.0.0.1:4173/page/3", { waitUntil: "domcontentloaded" });
await pg.waitForSelector(".quran-display--platform", { timeout: 45000 });
await pg.waitForTimeout(3500);

const found = await pg.evaluate(() => {
  const strip = (t) => t.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u06DD\u0640]/g, "");
  const el = [...document.querySelectorAll("[data-tajwid-word]")].find((e) => strip(e.textContent).includes("صبع"));
  if (!el) return false;
  el.setAttribute("data-probe", "1");
  return true;
});
console.log("found:", found);
const loc = pg.locator("[data-probe]").first();
await loc.scrollIntoViewIfNeeded();
await pg.waitForTimeout(400);
const box = await loc.boundingBox();
console.log("box", JSON.stringify(box));
await pg.screenshot({
  path: ".scratch-diag/captures/tj-page-word.png",
  clip: { x: Math.max(0, box.x - 60), y: Math.max(0, box.y - 60), width: box.width + 120, height: box.height + 120 },
});
const geo = await loc.evaluate((el) => {
  const line = el.getClientRects()[0];
  const cs = getComputedStyle(el);
  const root = el.closest(".quran-tajwid-text");
  const scroller = el.closest("[class*='overflow'], .page-stream, .quran-display--platform");
  const ay = el.closest("[class*='ayah']");
  return {
    lineTop: line.top, lineH: line.height,
    wordLH: cs.lineHeight, wordFS: cs.fontSize,
    rootOverflow: getComputedStyle(root).overflow, rootLH: getComputedStyle(root).lineHeight,
    ayClass: ay?.className, ayOverflow: ay ? getComputedStyle(ay).overflow : null, ayLH: ay ? getComputedStyle(ay).lineHeight : null,
    scrollerClass: scroller?.className?.slice(0, 60), scrollerOverflow: scroller ? getComputedStyle(scroller).overflow : null,
  };
});
console.log("geo", JSON.stringify(geo, null, 1));
await browser.close();
