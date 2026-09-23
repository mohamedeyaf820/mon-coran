import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 546, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.setDefaultTimeout(120000);
await page.goto('http://localhost:3002/page/559', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.reader-fullscreen-trigger', { timeout: 90000 });
await page.waitForTimeout(4000);
await page.evaluate(() => document.querySelector('.sidebar-close-button')?.click());
await page.waitForTimeout(800);
for (let i = 0; i < 8; i++) {
  await page.evaluate(() => document.querySelector('.reader-fullscreen-trigger')?.click());
  await page.waitForTimeout(600);
  await page.keyboard.press('f');
  await page.waitForTimeout(3000);
  const ok = await page.evaluate(() => document.querySelectorAll('.mfp-portal-root .qcm-word').length > 0);
  if (ok) break;
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(400);
}
const m = await page.evaluate(() => {
  const vp = document.querySelector('.mfp-viewport');
  const book = document.querySelector('.mfp-book');
  const pageEl = document.querySelector('.mfp-book .qcm-page');
  const lines = document.querySelector('.qcm-lines');
  const head = document.querySelector('.qcm-page-header');
  const foot = document.querySelector('.qcm-page-footer');
  const R = (e) => { const r = e.getBoundingClientRect(); return { y: Math.round(r.y), h: Math.round(r.height) }; };
  return {
    vp: R(vp), vpScrollH: vp.scrollHeight, vpClientH: vp.clientHeight, scrollTop: vp.scrollTop,
    book: R(book), page: R(pageEl), lines: R(lines), head: R(head), foot: R(foot),
    font: getComputedStyle(document.querySelector('.mfp-portal-root')).getPropertyValue('--mfp-font'),
    chrome: getComputedStyle(document.querySelector('.mfp-portal-root')).getPropertyValue('--mfp-chrome'),
  };
});
console.log(JSON.stringify(m, null, 1));
await browser.close();
