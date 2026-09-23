import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://127.0.0.1:4173";
const OUT = ".scratch-diag/captures/batchc";
fs.mkdirSync(OUT, { recursive: true });
const P = process.argv[2] || "572";

const VARIANTS = {
  base: "",
  "band-140": `#root ~ .mfp-portal-root .mfp-book .qcm-surah-title__name{font-size:1.4em !important}`,
  "band-140-h": `#root ~ .mfp-portal-root .mfp-book .qcm-surah-title__name{font-size:1.4em !important}
                 #root ~ .mfp-portal-root .mfp-book .qcm-surah-title{height:1.55em !important}`,
  "band-160-h": `#root ~ .mfp-portal-root .mfp-book .qcm-surah-title__name{font-size:1.6em !important}
                 #root ~ .mfp-portal-root .mfp-book .qcm-surah-title{height:1.6em !important}`,
  "folio-lg": `#root ~ .mfp-portal-root .qcm-page-footer .qcm-page-folio{font-size:1rem !important;min-width:2.35rem !important;height:2.35rem !important}`,
  "folio-lg2": `#root ~ .mfp-portal-root .qcm-page-footer .qcm-page-folio{font-size:1.15rem !important;min-width:2.35rem !important;height:2.35rem !important}`,
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
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
  s.id = "probe-variant";
  document.head.append(s);
});

async function clipTo(sel, pad, file) {
  const box = await page.evaluate(
    ({ s, p }) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { x: b.x - p, y: b.y - p, width: b.width + 2 * p, height: b.height + 2 * p };
    },
    { s: sel, p: pad },
  );
  if (!box) return console.log("missing", sel);
  await page.screenshot({ path: file, clip: box });
}

for (const [name, css] of Object.entries(VARIANTS)) {
  await page.evaluate(({ c }) => {
    document.getElementById("probe-variant").textContent = c;
  }, { c: css });
  await page.waitForTimeout(350);
  await clipTo(".qcm-line--surah-header", 26, `${OUT}/${name}-band.png`);
  await clipTo(".qcm-page-folio", 18, `${OUT}/${name}-folio.png`);
}
await browser.close();
console.log("ok");
