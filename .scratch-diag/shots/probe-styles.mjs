import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 546, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.setDefaultTimeout(120000);
await page.goto('http://localhost:3002/page/559', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.reader-fullscreen-trigger', { timeout: 90000 });
await page.waitForTimeout(4000);
await page.evaluate(() => document.querySelector('.sidebar-close-button')?.click());
await page.waitForTimeout(1200);
for (let i = 0; i < 8 && !(await page.evaluate(() => !!document.querySelector('.mfp-portal-root .qcm-page-shell'))); i++) {
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(500);
  await page.evaluate(() => document.querySelector('.reader-fullscreen-trigger')?.click());
  await page.waitForTimeout(800);
  await page.keyboard.press('f').catch(() => {});
  await page.waitForTimeout(3000);
}
await page.waitForTimeout(3000);
const probe = () => page.evaluate(() => {
  const root = document.querySelector('.mfp-portal-root');
  if (!root) return null;
  const book = root.querySelector('.mfp-book--exact');
  const lines = root.querySelector('.qcm-lines');
  const folio = root.querySelector('.qcm-page-folio');
  const marker = root.querySelector('.ayah-marker-wrap');
  const cs = (el) => el && getComputedStyle(el);
  const rr = root.getBoundingClientRect();
  return {
    zoom: cs(book)?.zoom,
    mfpFont: cs(root)?.getPropertyValue('--mfp-font'),
    mfpChrome: cs(root)?.getPropertyValue('--mfp-chrome'),
    linesFont: cs(lines)?.fontSize,
    folioSize: folio && { w: folio.getBoundingClientRect().width, h: folio.getBoundingClientRect().height, css: cs(folio).width + '/' + cs(folio).height, box: cs(folio).boxSizing, padding: cs(folio).padding },
    markerMargin: marker && { ml: cs(marker).marginInlineStart, mr: cs(marker).marginInlineEnd, fontSize: cs(marker).fontSize },
    bookRect: { y: book.getBoundingClientRect().y, h: book.getBoundingClientRect().height },
    viewportH: innerHeight,
  };
});
let out=null; for(let k=0;k<10 && !out;k++){ out=await probe().catch(()=>null); if(!out) await page.waitForTimeout(1500);} console.log(JSON.stringify(out, null, 1));
await browser.close();
