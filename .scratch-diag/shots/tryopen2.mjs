import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 546, height: 900 } })).newPage();
page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 300)));
await page.goto('http://localhost:3002/page/559', { waitUntil: 'load' });
await page.waitForSelector('.reader-fullscreen-trigger', { timeout: 90000 });
await page.waitForTimeout(5000);
console.log('triggers:', await page.evaluate(() => document.querySelectorAll('.reader-fullscreen-trigger').length));
await page.evaluate(() => { window.__clicks = 0; document.querySelectorAll('.reader-fullscreen-trigger').forEach(b => b.addEventListener('click', () => window.__clicks++, true)); });
await page.locator('.reader-fullscreen-trigger').first().click();
for (const wait of [100, 500, 2000, 5000]) {
  await page.waitForTimeout(wait);
  const st = await page.evaluate(() => ({ clicks: window.__clicks, open: document.body.classList.contains('mfp-open'), portal: !!document.querySelector('.mfp-portal-root') }));
  console.log(wait, JSON.stringify(st));
  if (st.portal) break;
}
await browser.close();
