import { chromium } from "playwright";
const BASE = "http://127.0.0.1:4173";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.addInitScript(([r]) => localStorage.setItem("mushaf-plus-settings", JSON.stringify({ theme: "light", riwaya: r, showTajwid: false, displayMode: "page", mushafLayout: "mushaf", currentPage: 572 })), ["hafs"]);
await page.goto(`${BASE}/page/572`, { waitUntil: "domcontentloaded" });
const skip = page.locator(".splash-screen button", { hasText: /Passer|Skip/ });
if (await skip.count()) await skip.first().click().catch(() => {});
await page.waitForSelector(".qcm-lines, .mushaf-page-wrapper", { timeout: 20000 });
await page.locator(".reader-fullscreen-trigger").first().click();
await page.waitForSelector(".mfp-portal-root .qcm-lines", { timeout: 20000 });
await page.waitForTimeout(2000);
const info = await page.evaluate(() => {
  const sheets = Array.from(document.querySelectorAll(".mfp-portal-root .qcm-page"));
  return sheets.map((s) => {
    const b = s.getBoundingClientRect();
    const name = s.querySelector(".qcm-surah-title__name");
    const head = s.querySelector(".qcm-page-header");
    return {
      visible: b.top >= 0 && b.bottom <= innerHeight && b.width > 0,
      top: Math.round(b.top),
      page: s.dataset.page || s.getAttribute("data-page-number") || "?",
      head: head?.textContent?.replace(/\s+/g, " ").slice(0, 60),
      band: name?.textContent,
    };
  });
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
