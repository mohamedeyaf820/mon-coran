import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 546, height: 900 } })).newPage();
const cssReqs = [];
page.on('response', (r) => { if (/\.css|type=css|mushaf/i.test(r.url())) cssReqs.push([r.status(), r.url().slice(0, 120)]); });
await page.goto('http://localhost:3002/page/559', { waitUntil: 'load' });
await page.waitForTimeout(6000);
const found = await page.evaluate(() => {
  const hits = [];
  for (const ss of document.styleSheets) {
    let rules; try { rules = ss.cssRules; } catch { continue; }
    for (const r of rules) {
      if (r.selectorText && /qcm-page-folio|\.qcm-line .ayah-marker|ayat-marker/.test(r.selectorText)) {
        hits.push({ sel: r.selectorText.slice(0, 90), ml: r.style?.marginInline || (r.style?.marginInlineStart + '|' + r.style?.marginInlineEnd), w: r.style?.width || r.style?.minWidth, href: (ss.href || 'inline').slice(-60) });
      }
    }
  }
  return { hits, sheets: [...document.styleSheets].map((s) => (s.href || 'inline').slice(-50)) };
});
console.log(JSON.stringify(found, null, 1));
console.log(cssReqs.slice(0, 20).map((x) => x.join(' ')).join('\n'));
await browser.close();
