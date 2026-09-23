import { chromium } from 'playwright';
import fs from 'node:fs';

const pageNum = process.argv[2] || '565';
const shotDir = '.scratch-diag/shots';
fs.mkdirSync(shotDir, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 546, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.setDefaultTimeout(120000);

await page.goto(`http://localhost:3002/page/${pageNum}`, { waitUntil: 'domcontentloaded' });
try {
  await page.waitForSelector('.reader-fullscreen-trigger', { timeout: 90000 });
} catch (e) {
  await page.screenshot({ path: `${shotDir}/p${pageNum}-notrigger.png` });
  const t = await page.evaluate(() => document.body.innerText.slice(0, 300));
  throw new Error(`no trigger; text=${t}`);
}
await page.waitForTimeout(4000);
await page.evaluate(() => document.querySelector('.sidebar-close-button')?.click());
await page.waitForTimeout(1200);
const portalUp = () => page.evaluate(() => !!document.querySelector('.mfp-portal-root .qcm-page-shell'));
for (let i = 0; i < 8 && !(await portalUp()); i++) {
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(600);
  await page.evaluate(() => document.querySelector('.reader-fullscreen-trigger')?.click());
  await page.waitForTimeout(800);
  await page.keyboard.press('f').catch(() => {});
  await page.waitForTimeout(3500);
}
if (!(await portalUp())) {
  await page.screenshot({ path: `${shotDir}/p${pageNum}-noopen.png` });
  const t = await page.evaluate(() => ({ text: document.body.innerText.slice(0, 200), portal: !!document.querySelector('.mfp-portal-root'), zen: !!document.querySelector('.mfp-portal-root--zen') }));
  throw new Error(`overlay never opened for page ${pageNum}: ${JSON.stringify(t)}`);
}
await page.evaluate(() => document.fonts.ready.catch(() => {}));
await page.waitForTimeout(3500);
await page.screenshot({ path: `${shotDir}/p${pageNum}-overlay.png` });

const diag = await page.evaluate(() => {
  const root0 = document.querySelector('.mfp-portal-root');
  // styleProbe: decisive computed values (zoom-free)
  let diagStyle = null;
  {
    const book = root0.querySelector('.mfp-book--exact');
    const folio = root0.querySelector('.qcm-page-folio');
    const marker = root0.querySelector('.qcm-ayah-marker, .ayah-marker');
    const lines = root0.querySelector('.qcm-lines');
    const cs = (el) => el && getComputedStyle(el);
    diagStyle = { zoom: cs(book)?.zoom, linesFont: cs(lines)?.fontSize,
      folioW: cs(folio)?.width, folioH: cs(folio)?.height, folioFs: cs(folio)?.fontSize,
      markerFs: cs(marker)?.fontSize, markerMl: cs(marker)?.marginInlineStart, markerMr: cs(marker)?.marginInlineEnd,
      rootFontVar: getComputedStyle(root0).getPropertyValue('--mfp-font') };
  }
  const root = document.querySelector('.mfp-portal-root') || document;
  const out = { markers: [], rects: {}, style: diagStyle };
  for (const el of root.querySelectorAll('.qcm-ayah-marker')) {
    const line = el.closest('.qcm-line');
    const kids = Array.from(line?.children ?? []).map((k) => {
      const r = k.getBoundingClientRect();
      const cs = getComputedStyle(k);
      return { cls: k.className.toString().slice(0, 30), txt: (k.textContent || '').slice(0, 8), x: Math.round(r.x), w: Math.round(r.width), ml: cs.marginInlineStart, mr: cs.marginInlineEnd };
    });
    out.markers.push({ line: line?.dataset.lineNumber, kids });
    if (out.markers.length >= 2) break;
  }
  const r = (sel) => { const e = root.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; };
  out.rects.folio = r('.qcm-page-footer');
  out.rects.folioCircle = r('.qcm-page-folio');
  out.rects.surahTitle = r('.qcm-line--surah-header');
  out.rects.header = r('.mfp-header');
  out.rects.footer = r('.mfp-mobile-footer');
  out.rects.book = r('.mfp-book');
  return out;
});
console.log(JSON.stringify(diag, null, 1));
await browser.close();
