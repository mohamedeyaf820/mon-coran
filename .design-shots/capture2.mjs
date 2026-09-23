import { chromium } from "playwright";

const BASE = "http://localhost:3003";
const shot = (name) => `.design-shots/${name}.png`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 546, height: 720 }, deviceScaleFactor: 2 });

async function goto(p) {
  await page.goto(BASE + p, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
}

// 1. page/565 markers
await goto("/page/565");
await page.screenshot({ path: shot("m-565-full") });
const line = page.locator(".qcm-line:has(.qcm-ayah-marker)").nth(1);
if (await line.count()) await line.screenshot({ path: shot("m-565-line") });

// 2. page/566 surah header cartouche
await goto("/page/566");
const hdr = page.locator(".qcm-page-header").first();
if (await hdr.count()) await hdr.screenshot({ path: shot("m-566-header") });
else await page.screenshot({ path: shot("m-566-header") });
await page.screenshot({ path: shot("m-566-full") });

// 3. page/559 folio + overlay toolbars
await goto("/page/559");
const folio = page.locator(".qcm-page-footer, .page-stream footer").first();
if (await folio.count()) await folio.screenshot({ path: shot("m-559-folio") });
await page.screenshot({ path: shot("m-559-full") });

// 4. fullscreen overlay
const trig = page.locator("button.reader-fullscreen-trigger");
if (await trig.count()) {
  if (!(await trig.first().isVisible().catch(() => false))) {
    const controls = page.locator('[aria-label="Commandes de lecture"]');
    if (await controls.count()) await controls.first().click().catch(() => {});
    await page.waitForTimeout(500);
  }
  await trig.first().click({ timeout: 5000 }).catch((e) => console.log("trigger fail", e.message));
  await page.waitForSelector(".mfp-portal-root", { timeout: 8000 }).catch(() => console.log("no portal"));
  await page.waitForTimeout(2000);
  await page.screenshot({ path: shot("m-559-overlay") });
  const oh = page.locator(".mfp-portal-root header").first();
  const of_ = page.locator(".mfp-portal-root footer").first();
  if (await oh.count()) await oh.screenshot({ path: shot("m-559-overlay-header") });
  if (await of_.count()) await of_.screenshot({ path: shot("m-559-overlay-footer") });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(800);
} else {
  console.log("no fullscreen trigger found");
}

// 5. page/1 anomaly
await goto("/page/1");
await page.screenshot({ path: shot("m-001-full") });

await browser.close();
console.log("done");
