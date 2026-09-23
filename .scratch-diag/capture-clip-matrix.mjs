import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://127.0.0.1:4173";
const OUT = ".scratch-diag/captures/clip";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
const page = await ctx.newPage();

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
  await page.waitForTimeout(1200);
}

await page.goto(`${BASE}/page/1`, { waitUntil: "domcontentloaded" });
await settle();
await page.locator(".qc-reader-toolbar__modes button", { hasText: "Mushaf" }).first().click();
await page.waitForTimeout(1200);
await page.click(".reader-typography-trigger");
const select = page.locator(".reader-typography-panel .afc-select");
const fontIds = await select.locator("option").evaluateAll((os) => os.map((o) => o.value));

for (const font of fontIds) {
  await select.selectOption(font);
  await page.waitForTimeout(1200);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  const card = page.locator(".mushaf-page-wrapper").first();
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await card.screenshot({ path: `${OUT}/p1-${font}.png` });
  const metrics = await page.evaluate(() => {
    const el = document.querySelector(".mushaf-text-block .quran-arabic-text, .cpv-flow, .mushaf-text-block");
    if (!el) return "no-el";
    const cs = getComputedStyle(el);
    const m = document.querySelector(".native-ayah-marker");
    const mcs = m ? getComputedStyle(m) : null;
    return {
      family: cs.fontFamily.slice(0, 40),
      fontSize: cs.fontSize,
      lineHeight: cs.lineHeight,
      overflow: cs.overflow,
      markerLH: mcs?.lineHeight,
      markerSize: mcs?.fontSize,
    };
  });
  console.log(font, JSON.stringify(metrics));
  await page.click(".reader-typography-trigger");
}
await browser.close();
console.log("done");
