import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 632, height: 840 }, deviceScaleFactor: 3 });
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
await page.locator(":is(.reader-fullscreen-trigger, .srh-fullscreen-btn):visible").first().click();
await page.waitForSelector(".mfp-portal-root", { timeout: 30_000 });
await page.waitForTimeout(6000);
// Full sheet clip of the right leaf (page 3) at 3x.
const leaf = page.locator(".mfp-portal-root .qcm-page").first();
await leaf.screenshot({ path: ".scratch-diag/captures/clip-leaf.png" });
// Geometry probe: do any word boxes extend past their line box, and what
// ancestor clips them?
const probe = await page.evaluate(() => {
  const flow = document.querySelector('.mfp-portal-root .qcm-flow');
  const words = [...flow.querySelectorAll(".qcm-word")].slice(0, 60);
  const out = [];
  for (const w of words) {
    const r = w.getBoundingClientRect();
    // find ancestor that clips (overflow not visible)
    let clipper = null;
    for (let el = w.parentElement; el; el = el.parentElement) {
      const ov = getComputedStyle(el).overflow;
      if (ov !== "visible") { clipper = `${el.className}`.slice(0, 60) + " [" + ov + "]"; break; }
    }
    out.push({ text: w.textContent.slice(0, 10), h: +r.height.toFixed(1), clipper });
    if (out.length >= 8) break;
  }
  const cs = getComputedStyle(flow.querySelector(".qcm-word"));
  return {
    lineHeight: cs.lineHeight, fontSize: cs.fontSize, display: cs.display,
    flowLineHeight: getComputedStyle(flow).lineHeight,
    samples: out,
  };
});
console.log(JSON.stringify(probe, null, 1));
await browser.close();
