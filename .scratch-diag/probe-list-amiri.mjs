import { chromium } from "playwright";

const BASE = "http://127.0.0.1:4173";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 490, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

async function settle() {
  if (await page.locator(".splash-screen").count()) {
    const skip = page.locator(".splash-screen button", { hasText: /Passer|Skip|تخطّي/ });
    await skip.first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
    await skip.first().click().catch(() => {});
    await page.waitForSelector(".splash-screen", { state: "detached", timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(900);
  }
  await page.waitForSelector(".cpv-flow, .mushaf-text-block, .qc-ayah-text-ar", { timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
}

await page.goto(`${BASE}/page/1`, { waitUntil: "domcontentloaded" });
await settle();
await page.locator(".qc-reader-toolbar__modes button", { hasText: "Liste" }).first().click();
await page.waitForTimeout(1200);
await page.click(".reader-typography-trigger");
await page.locator(".reader-typography-panel .afc-select").selectOption("amiri-quran");
await page.waitForTimeout(1500);
await page.screenshot({ path: ".scratch-diag/captures/fonts/list-p1-amiri.png" });
const info = await page.evaluate(() => {
  const m = document.querySelector(".qc-ayah-text-ar .native-ayah-marker, .rd-arabic .native-ayah-marker");
  return m ? { text: JSON.stringify(m.textContent), family: getComputedStyle(m).fontFamily } : "no-marker";
});
console.log(JSON.stringify(info));
await browser.close();
