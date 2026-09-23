import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 546, height: 900 } })).newPage();
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
page.on('pageerror', (e) => errs.push('PAGEERROR ' + String(e).slice(0, 200)));
await page.goto('http://localhost:3002/page/559', { waitUntil: 'load' });
await page.waitForSelector('.reader-fullscreen-trigger', { timeout: 90000 });
await page.waitForTimeout(5000);
await page.locator('.reader-fullscreen-trigger').first().click();
await page.waitForTimeout(6000);
const st = await page.evaluate(() => ({
  portal: !!document.querySelector('.mfp-portal-root'),
  shell: !!document.querySelector('.mfp-portal-root .qcm-page-shell'),
  markers: document.querySelectorAll('.mfp-portal-root .qcm-line').length,
  bodyEnd: document.body.innerText.slice(0, 120),
}));
console.log(JSON.stringify(st), '\nERRORS:', errs.slice(0, 8).join('\n  '));
await page.screenshot({ path: '.scratch-diag/shots/tryopen.png' });
await browser.close();
