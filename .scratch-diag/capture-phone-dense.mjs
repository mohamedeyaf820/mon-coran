import { chromium } from "playwright";
const BASE = "http://127.0.0.1:4173";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(`${BASE}/page/4`, { waitUntil: "domcontentloaded" });
if (await page.locator(".splash-screen").count()) {
  await page.locator(".splash-screen button", { hasText: /Passer|Skip|تخطّي/ }).first().click().catch(() => {});
  await page.waitForSelector(".splash-screen", { state: "detached", timeout: 10000 }).catch(() => {});
}
await page.waitForSelector(".mushaf-page-wrapper, .cpv-flow, .qc-ayah-text-ar", { timeout: 20000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1200);
await page.locator(".reader-fullscreen-trigger, .srh-fullscreen-btn, button[aria-label*='lein']").first().click();
await page.waitForSelector(".mfp-portal-root", { timeout: 10000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1800);
const m = await page.evaluate(() => {
  const vp = document.querySelector(".mfp-viewport");
  const r = document.querySelector(".mfp-book").getBoundingClientRect();
  return { folio: document.querySelector(".qcm-page-folio")?.textContent, sheetW: r.width, sheetH: r.height,
    overflowX: vp.scrollWidth - vp.clientWidth, overflowY: vp.scrollHeight - vp.clientHeight };
});
console.log(JSON.stringify(m));
await page.screenshot({ path: ".scratch-diag/captures/fullscreen/phone-390-p4.png" });
await browser.close();
