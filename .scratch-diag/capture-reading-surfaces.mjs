import { chromium } from "playwright";
import fs from "node:fs";
const BASE = "http://127.0.0.1:4173";
const OUT = ".scratch-diag/captures/reading-review";
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
async function shot(label, url, vw, vh, fn) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded" });
  if (await page.locator(".splash-screen").count()) {
    await page.locator(".splash-screen button", { hasText: /Passer|Skip|تخطّي/ }).first().click().catch(() => {});
    await page.waitForSelector(".splash-screen", { state: "detached", timeout: 10000 }).catch(() => {});
  }
  await page.waitForSelector(".qc-ayah-text-ar, .qcm-lines, .mushaf-page-wrapper", { timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  if (fn) await fn(page);
  await page.screenshot({ path: `${OUT}/${label}.png` });
  await ctx.close();
  console.log("ok", label);
}
await shot("list-390", "/surah/113", 390, 844);
await shot("mushaf-390", "/surah/2", 390, 844);
await shot("mushaf-820", "/surah/2", 820, 1180);
await shot("page-604-390", "/page/604", 390, 844);
await shot("list-dark-390", "/surah/78", 390, 844, async (page) => {
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  await page.waitForTimeout(500);
});
await browser.close();
