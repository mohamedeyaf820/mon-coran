import { chromium } from "playwright";
const BASE = "http://127.0.0.1:4173";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({ theme: "light", riwaya: "hafs", showTajwid: true, displayMode: "page", mushafLayout: "list", currentPage: 572 })));
await page.goto(`${BASE}/page/572`, { waitUntil: "domcontentloaded" });
const skip = page.locator(".splash-screen button", { hasText: /Passer|Skip/ });
if (await skip.count()) { await skip.first().click().catch(() => {}); }
await page.waitForTimeout(6000);
const info = await page.evaluate(() => {
  const set = new Set();
  document.querySelectorAll("[class]").forEach((el) => el.classList.forEach((c) => { if (/mushaf|qcm|page|mode-pane/i.test(c)) set.add(c); }));
  return { classes: Array.from(set).sort().slice(0, 60), hasQcmLines: !!document.querySelector(".qcm-lines"), url: location.pathname };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
