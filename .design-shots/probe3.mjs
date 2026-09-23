import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 546, height: 720 }, deviceScaleFactor: 2 });
await page.goto("http://localhost:3003/page/1", { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => {
  if (document.querySelector('.qcm-page-shell')) return 'shell';
  const b = [...document.querySelectorAll('.qc-reader-toolbar__modes button')].find(x => /mushaf/i.test(x.textContent));
  return b && b.getAttribute('aria-pressed') === 'false' ? 'btn' : false;
}, null, { timeout: 90000, polling: 1500 }).then(h => h.jsonValue()).then(async (s) => {
  if (s === 'btn') { await page.locator('.qc-reader-toolbar__modes button', { hasText: 'Mushaf' }).first().click(); await page.waitForSelector('.qcm-page-shell', { timeout: 30000 }); }
});
await page.waitForSelector('.app-loading-fallback', { state: 'detached', timeout: 90000 }).catch(() => console.log('splash never detached'));
await page.waitForTimeout(2500);
await page.screenshot({ path: '.design-shots/p-001-clean.png' });
const geo = await page.evaluate(() => {
  const shell = document.querySelector('.qcm-page-shell');
  const r = shell?.getBoundingClientRect();
  const stream = document.querySelector('.page-stream');
  return { shellTop: r?.top, shellH: r?.height, scrollTop: stream?.parentElement?.scrollTop ?? window.scrollY,
    fixedEls: [...document.querySelectorAll('body *')].filter(e => { const s = getComputedStyle(e); return s.position === 'fixed' && e.getBoundingClientRect().top < 30 && e.getBoundingClientRect().width > 0 && !e.closest('.app-loading-fallback'); }).map(e => ({ cls: (e.className||'').toString().slice(0,60), rect: e.getBoundingClientRect().toJSON(), z: getComputedStyle(e).zIndex })).slice(0, 8) };
});
console.log(JSON.stringify(geo, null, 1));
await browser.close();
