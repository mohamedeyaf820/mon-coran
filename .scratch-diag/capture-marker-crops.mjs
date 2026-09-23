import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://127.0.0.1:4173";
const OUT = ".scratch-diag/captures/markergap";
fs.mkdirSync(OUT, { recursive: true });
const P = process.argv[2] || "572";
const MARGINS = (process.argv[3] || "0.18,0.26,0.34").split(",");

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 4 });
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
await page.waitForTimeout(1500);

await page.evaluate(() => {
  const s = document.createElement("style");
  s.id = "probe-margin";
  document.head.append(s);
});

for (const m of MARGINS) {
  await page.evaluate(async ({ margin }) => {
    document.getElementById("probe-margin").textContent =
      `#root ~ .mfp-portal-root .mfp-book .qcm-line :is(.qcm-ayah-marker,.ayah-marker,.ayat-marker){margin-inline:${margin}em !important}`;
    await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
  }, { margin: m });
  const idxs = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll(".mfp-portal-root .qcm-line").forEach((line, i) => {
      if (line.querySelector(":is(.qcm-ayah-marker,.ayah-marker,.ayat-marker)")) out.push(i + 1);
    });
    return out.slice(0, 3);
  });
  for (const i of idxs) {
    await page
      .locator(`.mfp-portal-root .qcm-line >> nth=${i - 1}`)
      .screenshot({ path: `${OUT}/p${P}-m${m.replace(".", "")}-l${i}.png` })
      .catch(() => {});
  }
}
await browser.close();
console.log("ok");
