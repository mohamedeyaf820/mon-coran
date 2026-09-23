import { chromium } from "playwright";
const BASE = "http://127.0.0.1:4173";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({ theme: "light", riwaya: "hafs", showTajwid: false, displayMode: "page", mushafLayout: "mushaf", currentPage: 572 })));
await page.goto(`${BASE}/page/572`, { waitUntil: "domcontentloaded" });
const skip = page.locator(".splash-screen button", { hasText: /Passer|Skip/ });
if (await skip.count()) await skip.first().click().catch(() => {});
await page.waitForSelector(".quran-mode-pane--mushaf .qcm-page", { timeout: 25000 });
await page.waitForTimeout(3500);
const info = await page.evaluate(() =>
  Array.from(document.querySelectorAll(".quran-mode-pane--mushaf .qcm-page, .qcm-page")).map((s) => ({
    head: s.querySelector(".qcm-page-header")?.textContent?.replace(/\s+/g, " ").slice(0, 60),
    band: s.querySelector(".qcm-surah-title__name")?.textContent || null,
    folio: s.querySelector(".qcm-page-folio")?.textContent?.trim(),
    firstLine: s.querySelector(".qcm-lines .qcm-line")?.textContent?.replace(/\s+/g, "").slice(0, 18),
  })),
);
console.log(JSON.stringify(info, null, 1));
await browser.close();
