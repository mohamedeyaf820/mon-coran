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
await page.locator(".reader-fullscreen-trigger").first().click();
await page.waitForSelector(".mfp-portal-root .qcm-lines", { timeout: 20000 });
for (const ms of [500, 1500, 3000, 5000]) {
  await page.waitForTimeout(ms);
  const s = await page.evaluate(() => ({
    heads: Array.from(document.querySelectorAll(".mfp-portal-root .qcm-page-header")).map((e) => e.textContent.replace(/\s+/g, " ").slice(0, 40)),
    chrome: document.querySelector(".mfp-header__copy h2")?.textContent,
  }));
  console.log(ms, JSON.stringify(s));
}
await browser.close();
