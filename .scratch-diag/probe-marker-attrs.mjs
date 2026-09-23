import { chromium } from "playwright";

const BASE = "http://127.0.0.1:4173";
const P = process.argv[2] || "572";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.goto(`${BASE}/page/${P}`, { waitUntil: "domcontentloaded" });
const skip = page.locator(".splash-screen button", { hasText: /Passer|Skip|تخطّي/ });
if (await skip.count()) {
  await skip.first().click().catch(() => {});
  await page.waitForSelector(".splash-screen", { state: "detached", timeout: 8000 }).catch(() => {});
}
await page.waitForSelector(".mushaf-page-wrapper, .qc-ayah-text-ar", { timeout: 20000 });
await page.locator(".reader-fullscreen-trigger, .srh-fullscreen-btn, button[aria-label*='lein']").first().click();
await page.waitForSelector(".mfp-portal-root .qcm-lines", { timeout: 20000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1200);

const r = await page.evaluate(() => {
  const m = Array.from(document.querySelectorAll(".mfp-portal-root :is(.qcm-ayah-marker,.ayah-marker,.ayat-marker)"));
  return {
    markers: m.length,
    withTitle: m.filter((el) => el.getAttribute("title")).length,
    sample: m.slice(0, 3).map((el) => ({
      title: el.getAttribute("title"),
      aria: el.getAttribute("aria-label"),
      role: el.getAttribute("role"),
      text: el.textContent.trim(),
      cls: el.className,
    })),
  };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
