import { chromium } from "playwright";

const BASE = "http://localhost:3003";
const shot = (name) => `.design-shots/${name}.png`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 546, height: 720 }, deviceScaleFactor: 2 });

async function goto(p) {
  await page.goto(BASE + p, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".qcm-page-shell", { timeout: 30000 });
  await page.waitForTimeout(3000);
}

await goto("/page/565");
await page.screenshot({ path: shot("m-565-full") });
const line = page.locator(".qcm-line:has(.qcm-ayah-marker)").nth(1);
if (await line.count()) await line.screenshot({ path: shot("m-565-line") });
else console.log("no marker line on 565");

await goto("/page/566");
await page.screenshot({ path: shot("m-566-full") });
const hdr = page.locator(".qcm-page-header").first();
if (await hdr.count()) await hdr.screenshot({ path: shot("m-566-header") });
else console.log("no qcm-page-header on 566");

await goto("/page/559");
await page.screenshot({ path: shot("m-559-full") });
const folio = page.locator(".qcm-page-footer").first();
if (await folio.count()) await folio.screenshot({ path: shot("m-559-folio") });
else {
  const names = await page.evaluate(() =>
    [...document.querySelectorAll(".qcm-page [class*=footer], .qcm-page [class*=folio], .qcm-page footer")]
      .map((e) => e.className.toString()).slice(0, 8));
  console.log("no .qcm-page-footer; candidates:", JSON.stringify(names));
}

const trig = page.locator("button.reader-fullscreen-trigger");
console.log("trigger count:", await trig.count());
if (!(await trig.count())) {
  const cands = await page.evaluate(() =>
    [...document.querySelectorAll("button")].map((b) => [b.className.toString().slice(0, 40), b.getAttribute("aria-label")])
      .filter(([c, a]) => /fullscreen|écran|immersive|expand/i.test(c + (a || ""))));
  console.log("button candidates:", JSON.stringify(cands));
} else {
  if (!(await trig.first().isVisible().catch(() => false))) {
    const controls = page.locator('[aria-label="Commandes de lecture"]');
    if (await controls.count()) await controls.first().click().catch(() => {});
    await page.waitForTimeout(600);
  }
  await trig.first().click({ timeout: 5000 }).catch((e) => console.log("trigger fail", e.message));
  await page.waitForSelector(".mfp-portal-root", { timeout: 10000 }).catch(() => console.log("no portal"));
  await page.waitForTimeout(2500);
  await page.screenshot({ path: shot("m-559-overlay") });
  const oh = page.locator(".mfp-portal-root header").first();
  const of_ = page.locator(".mfp-portal-root footer").first();
  if (await oh.count()) await oh.screenshot({ path: shot("m-559-overlay-header") });
  if (await of_.count()) await of_.screenshot({ path: shot("m-559-overlay-footer") });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(800);
}

await goto("/page/1");
await page.screenshot({ path: shot("m-001-full") });

await browser.close();
console.log("done");
