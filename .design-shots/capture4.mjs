import { chromium } from "playwright";
const BASE = "http://localhost:3003";
const shot = (n) => `.design-shots/${n}.png`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 546, height: 720 }, deviceScaleFactor: 2 });
page.on('pageerror', e => console.log('PAGE ERR:', e.message.slice(0,150)));

async function gotoMushaf(p) {
  await page.goto(BASE + p, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);
  if (!(await page.locator('.qcm-page-shell').count())) {
    const btn = page.locator('.qc-reader-toolbar__modes button', { hasText: 'Mushaf' }).first();
    if (await btn.count()) { await btn.click(); await page.waitForTimeout(2500); }
  }
  await page.waitForSelector('.qcm-page-shell', { timeout: 15000 }).catch(() => console.log('NO SHELL ' + p));
  await page.waitForTimeout(1500);
}

await gotoMushaf('/page/565');
await page.screenshot({ path: shot('m-565-full') });
const lines = page.locator('.qcm-line:has(.qcm-ayah-marker)');
console.log('marker lines 565:', await lines.count());
for (const i of [1, 4]) { const l = lines.nth(i); if (await l.count()) await l.screenshot({ path: shot(`m-565-line${i}`) }); }

await gotoMushaf('/page/566');
await page.screenshot({ path: shot('m-566-full') });
const hdr = page.locator('.qcm-page-header').first();
if (await hdr.count()) await hdr.screenshot({ path: shot('m-566-header') }); else console.log('no header 566');

await gotoMushaf('/page/559');
const foot = page.locator('.qcm-page footer, .qcm-page-footer, [class*="folio"]').first();
console.log('foot class:', await foot.count() ? await foot.getAttribute('class') : 'none');
if (await foot.count()) await foot.screenshot({ path: shot('m-559-folio') });
await page.screenshot({ path: shot('m-559-full') });

const trig = page.locator('button.reader-fullscreen-trigger');
if (await trig.count()) {
  if (!(await trig.first().isVisible().catch(() => false))) {
    await page.locator('[aria-label="Commandes de lecture"]').first().click().catch(() => {});
    await page.waitForTimeout(600);
  }
  await trig.first().click().catch(e => console.log('trig fail', e.message));
  await page.waitForSelector('.mfp-portal-root', { timeout: 10000 }).catch(() => console.log('no portal'));
  await page.waitForTimeout(2500);
  await page.screenshot({ path: shot('m-559-overlay') });
  const h = page.locator('.mfp-header').first(), f = page.locator('.mfp-mobile-footer').first();
  if (await h.count()) await h.screenshot({ path: shot('m-559-overlay-header') });
  if (await f.count()) await f.screenshot({ path: shot('m-559-overlay-footer') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(800);
} else console.log('no fullscreen trigger');

await gotoMushaf('/page/1');
await page.screenshot({ path: shot('m-001-full') });
const pos = await page.evaluate(() => {
  const s = document.querySelector('.qcm-page-shell');
  const r = s?.getBoundingClientRect();
  return r ? { top: r.top, height: r.height } : null;
});
console.log('page1 shell rect:', JSON.stringify(pos));
await browser.close();
console.log('done');
