import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://127.0.0.1:4173";
const OUT = ".scratch-diag/captures/fonts";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 490, height: 900 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

await page.goto(`${BASE}/page/1`, { waitUntil: "domcontentloaded" });
await settle();
await page.locator(".qc-reader-toolbar__modes button", { hasText: "Mushaf" }).first().click();
await page.waitForTimeout(1500);
await page.waitForSelector(".reader-typography-trigger", { timeout: 15000 });
await page.click(".reader-typography-trigger");
const select = page.locator(".reader-typography-panel .afc-select");
const fontIds = await select.locator("option").evaluateAll((os) => os.map((o) => o.value));
console.log("options:", fontIds.join(","));

async function settle() {
  if (await page.locator(".splash-screen").count()) {
    const skip = page.locator(".splash-screen button", { hasText: /Passer|Skip|تخطّي/ });
    await skip.first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
    await skip.first().click().catch(() => {});
    await page.waitForSelector(".splash-screen", { state: "detached", timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(900);
  }
  await page.waitForSelector(".mushaf-page-wrapper, .cpv-flow, .qc-ayah-text-ar", { timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
}

for (const font of fontIds) {
  await select.selectOption(font);
  await page.waitForTimeout(1200);
  for (const pageNum of [1, 2]) {
    await page.goto(`${BASE}/page/${pageNum}`, { waitUntil: "domcontentloaded" });
    await settle();
    await page.screenshot({ path: `${OUT}/p${pageNum}-${font}.png` });
    const info = await page.evaluate(() => {
      const el =
        document.querySelector(".cpv-flow") ||
        document.querySelector(".mushaf-text-block") ||
        document.querySelector(".qc-ayah-text-ar");
      return el ? getComputedStyle(el).fontFamily : "no-el";
    });
    console.log(font, "p" + pageNum, "=>", info.slice(0, 90));
  }
  await page.goto(`${BASE}/page/1`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".reader-typography-trigger");
  await page.click(".reader-typography-trigger");
}
await browser.close();
console.log("done");
