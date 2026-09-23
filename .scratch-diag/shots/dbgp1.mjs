import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 546, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.setDefaultTimeout(60000);
await page.goto('http://localhost:3002/page/1', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.reader-fullscreen-trigger', { timeout: 90000 });
await page.waitForTimeout(4000);
const up = () => page.evaluate(() => !!document.querySelector('.mfp-portal-root .qcm-page-shell'));
for (let i = 0; i < 8 && !(await up()); i++) {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  await page.evaluate(() => document.querySelector('.reader-fullscreen-trigger')?.click());
  await page.waitForTimeout(800);
  await page.keyboard.press('f');
  await page.waitForTimeout(3500);
}
await page.waitForTimeout(6000);
const st = await page.evaluate(() => {
  const root = document.querySelector('.mfp-portal-root');
  const lines = root.querySelectorAll('.qcm-line');
  return {
    lineCount: lines.length,
    wordCount: root.querySelectorAll('.qcm-word').length,
    linesInfo: Array.from(lines).slice(0, 5).map(l => l.className.replace('qcm-line','L') + ' kids=' + l.children.length + ' txt=' + JSON.stringify((l.textContent||'').slice(0, 15))),
    fontWarning: !!root.querySelector('.qcm-font-warning'),
    opening: !!root.querySelector('[data-page-kind="opening"]'),
    shellH: Math.round(root.querySelector('.qcm-page-shell')?.getBoundingClientRect().height ?? 0),
  };
});
console.log(JSON.stringify(st, null, 1));
await page.screenshot({ path: '.scratch-diag/shots/dbgp1.png' });
await browser.close();
