import { chromium } from "playwright";
const browser = await chromium.launch();
async function open(width, height, riwaya, tajwid) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.addInitScript(({ r, tj }) => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
    splashCompleted: true, skipSplashAnimation: true, showHome: false,
    displayMode: "page", mushafLayout: "mushaf", lang: "fr", riwaya: r,
    fontFamily: "qpc-hafs", quranFontSize: 30, showTajwid: tj, warshStrictMode: true,
  })), { r: riwaya, tj: tajwid });
  await page.goto("http://127.0.0.1:4173/page/3", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".qcm-page-shell", { timeout: 25000 });
  await page.waitForTimeout(4000);
  const info = await page.evaluate(() => {
    const shells = document.querySelectorAll("[data-stream-page] .qcm-page-shell");
    const words = document.querySelectorAll(".qcm-word");
    const first = words[0];
    const lines = shells[0]?.parentElement?.querySelectorAll(".qcm-line").length;
    return {
      shells: shells.length,
      words: words.length,
      linesP3: lines,
      font: first ? getComputedStyle(first).fontFamily.slice(0, 40) : null,
      glyphMode: first && /&#x|\uFDD8/.test(first.textContent || "") !== first.textContent.match(/[\u0600-\u06FF]/) ? "text?" : "n/a",
      sample: (first?.textContent || "").slice(0, 12),
      widthOk: shells[0] ? shells[0].getBoundingClientRect().width <= window.innerWidth : null,
      overflowX: shells[0] ? shells[0].scrollWidth > shells[0].clientWidth + 2 : null,
      header: shells[0]?.querySelector(".qcm-page-header")?.textContent?.replace(/\s+/g," ").trim().slice(0,60),
      folio: shells[0]?.querySelector(".qcm-page-folio")?.textContent?.trim(),
    };
  });
  console.log(`${width}x${height} ${riwaya} tajwid=${tajwid}:`, JSON.stringify(info));
  await page.screenshot({ path: `.scratch-diag/p15-${width}-${riwaya}${tajwid ? "-tajwid" : ""}.png`, clip: { x: 0, y: 60, width, height: Math.min(height - 60, 700) } });
  return page;
}
const p1 = await open(390, 844, "hafs", false);
// tap ayah marker -> actions modal
const marker = p1.locator("[data-stream-page='3'] .qcm-ayah-marker").first();
if (await marker.count()) { await marker.click(); await p1.waitForTimeout(800); }
console.log("modal after marker tap:", await p1.evaluate(() => !!document.querySelector("[role='dialog'], .ayah-actions-modal")));
await p1.keyboard.press("Escape"); await p1.waitForTimeout(400);
// double-tap page background -> fullscreen
const shell = p1.locator("[data-stream-page='3'] .qcm-page-header").first();
await shell.dblclick({ force: true }); await p1.waitForTimeout(1500);
console.log("fullscreen after dblclick:", await p1.evaluate(() => !!document.querySelector(".mfp-portal-root")));
await p1.keyboard.press("Escape"); await p1.waitForTimeout(500);
// scroll stream append
await p1.mouse.wheel(0, 3000); await p1.waitForTimeout(2500);
console.log("stream pages:", await p1.evaluate(() => Array.from(document.querySelectorAll("[data-stream-page]")).map(s => s.getAttribute("data-stream-page")).join(",")));
await p1.close();
await open(1100, 800, "hafs", false);
await open(390, 844, "warsh", false);
await open(390, 844, "hafs", true);
await browser.close();
