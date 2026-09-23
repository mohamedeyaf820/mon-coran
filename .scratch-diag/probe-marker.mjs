import { chromium } from "playwright";

const BASE = "http://127.0.0.1:4173";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 490, height: 900 } });
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
await page.locator(".qc-reader-toolbar__modes button", { hasText: "Mushaf" }).first().click();
await page.waitForTimeout(1200);
await page.click(".reader-typography-trigger");
await page.locator(".reader-typography-panel .afc-select").selectOption("amiri-quran");
await page.waitForTimeout(1500);

const report = await page.evaluate(() => {
  const markers = [...document.querySelectorAll(".native-ayah-marker")];
  const anchor = document.querySelector("[data-quran-font]");
  const sample = markers.slice(0, 3).map((m) => ({
    html: m.outerHTML.slice(0, 160),
    text: JSON.stringify(m.textContent),
    computedFamily: getComputedStyle(m).fontFamily,
    inAncestor: anchor ? anchor.contains(m) : null,
  }));
  return {
    markerCount: markers.length,
    anchorTag: anchor ? anchor.className : "none",
    anchorFontAttr: anchor?.dataset?.quranFont ?? "none",
    sample,
  };
});
console.log(JSON.stringify(report, null, 2));
await browser.close();
