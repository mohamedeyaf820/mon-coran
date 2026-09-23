import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 546, height: 900 } })).newPage();
page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 300)));
await page.goto('http://localhost:3002/page/559', { waitUntil: 'load' });
await page.waitForSelector('.reader-fullscreen-trigger', { timeout: 90000 });
await page.waitForTimeout(4000);
// switch to Mushaf layout if a toggle exists
const switched = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')];
  const m = btns.find((b) => /mushaf/i.test(b.textContent || ''));
  if (m) { m.click(); return m.textContent.trim(); }
  return null;
});
console.log('switched to:', switched);
await page.waitForTimeout(6000);
await page.locator('.reader-fullscreen-trigger').first().click();
await page.waitForTimeout(4000);
console.log(JSON.stringify(await page.evaluate(() => ({ open: document.body.classList.contains('mfp-open'), portal: !!document.querySelector('.mfp-portal-root'), shell: !!document.querySelector('.mfp-portal-root .qcm-page-shell') }))));
await page.screenshot({ path: '.scratch-diag/shots/tryopen3.png' });
await browser.close();
