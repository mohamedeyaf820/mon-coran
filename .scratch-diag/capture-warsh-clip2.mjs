import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 632, height: 840 }, deviceScaleFactor: 3 });
const page = await context.newPage();
page.on("console", (m) => { if (m.type() === "error") console.log("[err]", m.text().slice(0, 200)); });
page.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 200)));
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
await page.waitForSelector(".mfp-portal-root", { timeout: 30_000 });
await page.waitForSelector(".mfp-portal-root .qcm-flow .qcm-word", { timeout: 30_000 });
await page.waitForTimeout(4000);
const leaf = page.locator(".mfp-portal-root .qcm-page").filter({ has: page.locator(".qcm-flow .qcm-word") }).first();
await leaf.screenshot({ path: ".scratch-diag/captures/clip-leaf2.png" });
const probe = await page.evaluate(() => {
  const f = document.querySelector(".mfp-portal-root .qcm-flow");
  const words = [...f.querySelectorAll(".qcm-word")];
  const cs = getComputedStyle(words[0]);
  const out = [];
  for (const w of words.slice(0, 200)) {
    let clipper = null;
    for (let el = w.parentElement; el && el !== document.body; el = el.parentElement) {
      const ov = getComputedStyle(el).overflow;
      if (ov !== "visible") { clipper = `${el.className}`.slice(0, 50) + " [" + ov + "]"; break; }
    }
    if (clipper) { out.push({ text: w.textContent.slice(0, 8), clipper }); break; }
  }
  // ink vs box: compare rendered glyph extents via canvas? Instead measure
  // client rects of word vs its line's top.
  const r0 = words[0].getBoundingClientRect();
  const fr = f.getBoundingClientRect();
  return {
    fontSize: cs.fontSize, lineHeight: cs.lineHeight, display: cs.display,
    flowLH: getComputedStyle(f).lineHeight,
    firstWordTop: r0.top - fr.top, clippedSample: out,
    wordCount: words.length,
  };
});
console.log(JSON.stringify(probe));
await browser.close();
