import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 546, height: 900 } })).newPage();
page.on('console', (m) => console.log('CONSOLE', m.type(), m.text().slice(0, 200)));
page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 300)));
await page.goto('http://localhost:3002/page/559', { waitUntil: 'load' });
await page.waitForSelector('.reader-fullscreen-trigger', { timeout: 90000 });
await page.waitForTimeout(5000);
const info = await page.evaluate(() => {
  const btn = document.querySelector('.reader-fullscreen-trigger');
  const key = Object.keys(btn).find((k) => k.startsWith('__reactProps'));
  const props = key ? btn[key] : null;
  return { hasKey: !!key, hasOnClick: typeof props?.onClick, reactEventKeys: Object.keys(btn).filter(k=>k.startsWith('__react')).join(',') };
});
console.log('btn:', JSON.stringify(info));
const res = await page.evaluate(() => {
  const btn = document.querySelector('.reader-fullscreen-trigger');
  const key = Object.keys(btn).find((k) => k.startsWith('__reactProps'));
  try { btn[key].onClick({ currentTarget: btn, target: btn, preventDefault() {}, stopPropagation() {} }); return 'called'; } catch (e) { return 'THREW: ' + e.message; }
});
console.log('direct call:', res);
await page.waitForTimeout(3000);
console.log(JSON.stringify(await page.evaluate(() => ({ open: document.body.classList.contains('mfp-open'), portal: !!document.querySelector('.mfp-portal-root') }))));
await browser.close();
