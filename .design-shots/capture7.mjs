import { chromium } from "playwright";
const BASE = "http://localhost:3003";
const shot = (n) => `.design-shots/${n}.png`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 546, height: 720 }, deviceScaleFactor: 2 });
page.on('pageerror', e => console.log('PAGE ERR:', e.message.slice(0, 150)));

async function gotoMushaf(p) {
  await page.goto(BASE + p, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('.app-loading-fallback', { state: 'detached', timeout: 30000 }).catch(() => {});
  await page.waitForFunction(() => {
    if (document.querySelector('.qcm-page-shell')) return 'shell';
    const b = [...document.querySelectorAll('.qc-reader-toolbar__modes button')].find(x => /mushaf/i.test(x.textContent));
    return b && b.getAttribute('aria-pressed') === 'false' ? 'btn' : false;
  }, null, { timeout: 90000, polling: 1000 }).then(h => h.jsonValue()).catch(() => 'timeout')
    .then(async (state) => {
      console.log(p, 'ready via', state);
      if (state === 'btn') {
        await page.locator('.qc-reader-toolbar__modes button', { hasText: 'Mushaf' }).first().click();
        await page.waitForSelector('.qcm-page-shell', { timeout: 20000 });
      }
    });
  await page.waitForTimeout(2000);
}

// Band + folio on 566
await gotoMushaf('/page/566');
await page.screenshot({ path: shot('v2-566-full') });
const band = page.locator('.qcm-line--surah-header').first();
if (await band.count()) await band.screenshot({ path: shot('v2-566-band') });
else console.log('no band 566');
const foot = page.locator('.qcm-page-footer').first();
if (await foot.count()) await foot.screenshot({ path: shot('v2-566-folio') });

// Folio on 559 + overlay chrome
await gotoMushaf('/page/559');
const foot559 = page.locator('.qcm-page-footer').first();
if (await foot559.count()) await foot559.screenshot({ path: shot('v2-559-folio') });
const trig = page.locator('button.reader-fullscreen-trigger');
if (await trig.count()) {
  if (!(await trig.first().isVisible().catch(() => false))) {
    await page.locator('[aria-label="Commandes de lecture"]').first().click().catch(() => {});
    await page.waitForTimeout(600);
  }
  await trig.first().click().catch(e => console.log('trig fail', e.message));
  await page.waitForSelector('.mfp-portal-root', { timeout: 10000 }).catch(() => console.log('no portal'));
  await page.waitForTimeout(2500);
  await page.screenshot({ path: shot('v2-559-overlay') });
  const h = page.locator('.mfp-header').first(), f = page.locator('.mfp-mobile-footer').first();
  if (await h.count()) await h.screenshot({ path: shot('v2-559-overlay-header') });
  if (await f.count()) await f.screenshot({ path: shot('v2-559-overlay-footer') });
  else console.log('no mobile footer visible');
  const bandP = page.locator('.qcm-page-shell:not([data-page-kind="opening"]) .qcm-line--surah-header').first();
  if (await bandP.count()) await bandP.screenshot({ path: shot('v2-559-overlay-band') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(800);
} else console.log('no fullscreen trigger');

// Opening page 1
await gotoMushaf('/page/1');
await page.screenshot({ path: shot('v2-001-full') });
const shell = page.locator('.qcm-page-shell').first();
if (await shell.count()) await shell.screenshot({ path: shot('v2-001-sheet') });
console.log('done');
await browser.close();
