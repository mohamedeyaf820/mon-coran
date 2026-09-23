import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const pg = await browser.newPage({ viewport: { width: 393, height: 851 }, deviceScaleFactor: 4 });
await pg.addInitScript(() => {
  localStorage.setItem("mushaf-plus-settings", JSON.stringify({
    skipSplashAnimation: true, showHome: false, showDuas: false, sidebarOpen: false,
    displayMode: "page", mushafLayout: "mushaf", lang: "fr", riwaya: "hafs",
    fontFamily: "qpc-hafs", showTranslation: false, showTajwid: true, showTransliteration: false,
    currentSurah: 2, currentPage: 1, currentJuz: 1,
    lastPosition: { surah: 2, ayah: 1, page: 1, juz: 1 },
  }));
});

const DIACRITICS = /[\u064B-\u065F\u0670\u06D6-\u06ED\u06DD\u0640]/g;
let hits = 0;
for (let page = 1; page <= 10 && hits < 6; page += 1) {
  await pg.goto(`http://127.0.0.1:4173/page/${page}`, { waitUntil: "domcontentloaded" });
  await pg.waitForSelector(".quran-display--platform", { timeout: 45000 });
  await pg.waitForTimeout(2500);
  const found = await pg.evaluate(({ page, diacritics }) => {
    const strip = (t) => t.replace(new RegExp(diacritics, "g"), "");
    const els = [...document.querySelectorAll("[data-tajwid-word]")].filter((e) => strip(e.textContent).includes("ترى"));
    els.forEach((e, i) => e.setAttribute("data-probe", `${page}-${i}`));
    return els.length;
  }, { page, diacritics: DIACRITICS.source });
  for (let i = 0; i < found; i += 1) {
    const loc = pg.locator(`[data-probe="${page}-${i}"]`).first();
    await loc.scrollIntoViewIfNeeded();
    await pg.waitForTimeout(250);
    const box = await loc.boundingBox();
    if (!box) continue;
    hits += 1;
    await pg.screenshot({
      path: `.scratch-diag/captures/tara-p${page}-${i}.png`,
      clip: { x: Math.max(0, box.x - 40), y: Math.max(0, box.y - 45), width: box.width + 80, height: box.height + 90 },
    });
    console.log(`captured p${page}-${i}`, JSON.stringify(box));
  }
}
console.log("total hits:", hits);
await browser.close();
