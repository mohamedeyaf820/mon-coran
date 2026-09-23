import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 546, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.setDefaultTimeout(60000);
await page.goto('http://localhost:3002/page/566', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.reader-fullscreen-trigger', { timeout: 90000 });
await page.waitForTimeout(4000);
// JS-dispatched click, bypassing actionability
const r = await page.evaluate(() => {
  const b = document.querySelector('.reader-fullscreen-trigger');
  const rect = b?.getBoundingClientRect();
  b?.click();
  return { found: !!b, rect: rect && { x: rect.x, y: rect.y, w: rect.width, h: rect.height } };
});
console.log('click:', JSON.stringify(r));
await page.waitForTimeout(6000);
console.log('portal after js click:', await page.evaluate(() => !!document.querySelector('.mfp-portal-root')));
await page.keyboard.press('f');
await page.waitForTimeout(6000);
console.log('portal after F key:', await page.evaluate(() => !!document.querySelector('.mfp-portal-root')));
await page.screenshot({ path: '.scratch-diag/shots/dbg3.png' });
await browser.close();
