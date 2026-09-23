import { chromium } from 'playwright';

const pageNum = process.argv[2] || '565';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 546, height: 900 }, deviceScaleFactor: 3 });
const page = await ctx.newPage();
page.setDefaultTimeout(120000);

await page.goto(`http://localhost:3002/page/${pageNum}`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.reader-fullscreen-trigger', { timeout: 90000 });
await page.waitForTimeout(4000);
await page.evaluate(() => document.querySelector('.sidebar-close-button')?.click());
await page.waitForTimeout(800);

const has = async (sel) => page.evaluate((s) => !!document.querySelector(s), sel);
await page.evaluate(() => document.querySelector('.reader-fullscreen-trigger')?.click());
await page.waitForTimeout(600);
await page.keyboard.press('f');
for (let i = 0; i < 40; i++) {
  if (await has('.mfp-portal-root .qcm-ayah-marker')) break;
  if (i === 8 || i === 20) { await page.keyboard.press('Escape').catch(() => {}); await page.waitForTimeout(400); await page.evaluate(() => document.querySelector('.reader-fullscreen-trigger')?.click()); await page.waitForTimeout(500); await page.keyboard.press('f'); }
  await page.waitForTimeout(500);
}
const info = await page.evaluate(() => {
  const m = document.querySelector('.mfp-portal-root .qcm-ayah-marker');
  if (!m) return null;
  const r = m.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height, zoom: getComputedStyle(document.querySelector('.mfp-book')).zoom };
});
console.log('marker:', JSON.stringify(info));
if (info) {
  await page.screenshot({ path: `.scratch-diag/shots/crop-${pageNum}.png`, clip: { x: Math.max(0, info.x - 170), y: Math.max(0, info.y - 45), width: 340, height: 90 } });
  const info2 = await page.evaluate(() => {
    const ms = document.querySelectorAll('.mfp-portal-root .qcm-ayah-marker');
    const m = ms[Math.min(2, ms.length - 1)];
    const r = m.getBoundingClientRect();
    return { x: r.x, y: r.y };
  });
  await page.screenshot({ path: `.scratch-diag/shots/crop-${pageNum}-2.png`, clip: { x: Math.max(0, info2.x - 170), y: Math.max(0, info2.y - 45), width: 340, height: 90 } });
}
await page.screenshot({ path: `.scratch-diag/shots/full-${pageNum}.png` });
await browser.close();
