import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 546, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.setDefaultTimeout(60000);
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0,200)));
page.on('requestfailed', r => errs.push('REQFAIL: ' + r.url().slice(0,120)));
await page.goto('http://localhost:3002/page/566', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.reader-fullscreen-trigger', { timeout: 90000 });
await page.waitForTimeout(4000);
console.log('pane:', await page.evaluate(() => document.querySelector('.quran-mode-pane')?.className.slice(0,60)));
await page.locator('.reader-fullscreen-trigger').first().click();
await page.waitForTimeout(8000);
const st = await page.evaluate(() => ({
  portal: !!document.querySelector('.mfp-portal-root'),
  shell: !!document.querySelector('.mfp-portal-root .qcm-page-shell'),
  book: !!document.querySelector('.mfp-book')?.innerHTML.length,
  portalSnippet: document.querySelector('.mfp-portal-root')?.innerText.slice(0,150),
}));
console.log(JSON.stringify(st));
await page.screenshot({ path: '.scratch-diag/shots/dbg2.png' });
console.log(errs.slice(0,10).join('\n'));
await browser.close();
