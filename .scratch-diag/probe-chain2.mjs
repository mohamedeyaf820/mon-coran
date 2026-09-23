import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 393, height: 851 }, deviceScaleFactor: 3 });
const page = await context.newPage();
await page.addInitScript(() => {
  localStorage.setItem("mushaf-plus-settings", JSON.stringify({
    skipSplashAnimation: true, showHome: false, showDuas: false, sidebarOpen: false,
    displayMode: "page", mushafLayout: "mushaf", lang: "fr", riwaya: "warsh",
    fontFamily: "qpc-warsh", fontFamilyByRiwaya: { hafs: "qpc-hafs", warsh: "qpc-warsh" },
    currentSurah: 2, currentPage: 3, currentJuz: 1,
    lastPosition: { surah: 2, ayah: 1, page: 3, juz: 1 },
  }));
});
await page.goto("http://127.0.0.1:4173/page/3", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".quran-display--platform", { timeout: 45_000 });
await page.waitForTimeout(3000);
await page.locator(":is(.reader-fullscreen-trigger, .srh-fullscreen-btn):visible").first().click();
await page.waitForSelector(".mfp-portal-root .qcm-flow .qcm-word", { timeout: 30_000 });
await page.waitForTimeout(4000);

const chain = await page.evaluate(() => {
  const lines = document.querySelector(".mfp-portal-root .qcm-lines[data-warsh]");
  const lrect = lines.getBoundingClientRect();
  // last word of line 2 (leftmost ink in RTL)
  const flows = [...lines.querySelectorAll(".qcm-flow")];
  const ws = [...flows[0].querySelectorAll(".qcm-word")];
  let word = null;
  for (const w of ws) {
    for (const r of w.getClientRects()) {
      if (r.top > lrect.top + 60 && (!word || r.left < word.r.left)) word = { el: w, r };
    }
  }
  word = word.el;
  const wordRect = word.getBoundingClientRect();
  const out = [];
  let el = word;
  while (el && el !== document.documentElement) {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    out.push({
      tag: el.tagName.toLowerCase(), cls: (el.className || "").toString().slice(0, 40),
      ovx: cs.overflowX, ovy: cs.overflowY, contain: cs.contain,
      l: +r.left.toFixed(1), r: +r.right.toFixed(1), t: +r.top.toFixed(1), b: +r.bottom.toFixed(1),
      pad: `${cs.paddingLeft}/${cs.paddingRight}`,
    });
    el = el.parentElement;
  }
  return { word: word.textContent, wordRect: wordRect.toJSON(), lineLeft: lrect.left, lineRight: lrect.right, chain: out };
});
console.log(JSON.stringify(chain, null, 1));
await browser.close();
