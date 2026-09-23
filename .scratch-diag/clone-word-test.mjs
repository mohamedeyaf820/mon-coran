import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 393, height: 851 }, deviceScaleFactor: 6 });
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

const info = await page.evaluate(() => {
  const lines = document.querySelector(".mfp-portal-root .qcm-lines[data-warsh]");
  const ws = [...lines.querySelectorAll(".qcm-word")];
  const target = ws.find((w) => w.textContent.includes("غِش"));
  const r = target.getBoundingClientRect();
  const clone = target.cloneNode(true);
  clone.style.cssText += ";position:fixed;left:150px;top:400px;z-index:99999;background:#fff;overflow:visible;";
  document.body.appendChild(clone);
  // also a bare-text control with the same font/size
  const ctrl = document.createElement("div");
  const cs = getComputedStyle(target);
  ctrl.style.cssText = `position:fixed;left:20px;top:400px;z-index:99999;background:#fff;direction:rtl;font-family:${cs.fontFamily};font-size:${cs.fontSize};unicode-bidi:isolate;white-space:nowrap;`;
  ctrl.textContent = target.textContent;
  document.body.appendChild(ctrl);
  return { text: target.textContent, font: cs.fontFamily, fontSize: cs.fontSize, origRect: r.toJSON() };
});
console.log(JSON.stringify(info));
await page.waitForTimeout(400);
const r = info.origRect;
await page.screenshot({ path: ".scratch-diag/captures/clone-orig.png", clip: { x: 0, y: r.top - 25, width: 393, height: 80 } });
await page.screenshot({ path: ".scratch-diag/captures/clone-fixed.png", clip: { x: 0, y: 385, width: 393, height: 80 } });
await browser.close();
