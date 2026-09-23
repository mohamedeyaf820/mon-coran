import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 546, height: 720 } });
await page.goto("http://localhost:3003/page/565", { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => {
  if (document.querySelector('.qcm-page-shell')) return 'shell';
  const b = [...document.querySelectorAll('.qc-reader-toolbar__modes button')].find(x => /mushaf/i.test(x.textContent));
  return b && b.getAttribute('aria-pressed') === 'false' ? 'btn' : false;
}, null, { timeout: 90000, polling: 1500 }).then(h => h.jsonValue()).then(async (s) => {
  if (s === 'btn') { await page.locator('.qc-reader-toolbar__modes button', { hasText: 'Mushaf' }).first().click(); await page.waitForSelector('.qcm-page-shell', { timeout: 30000 }); }
});
await page.waitForSelector('.app-loading-fallback', { state: 'detached', timeout: 90000 }).catch(() => console.log('splash never detached'));
await page.waitForTimeout(2000);
const probe = await page.evaluate(() => {
  const at = (x, y) => document.elementsFromPoint(x, y).slice(0, 5).map(e => ({
    tag: e.tagName, cls: (e.className||'').toString().slice(0,90), z: getComputedStyle(e).zIndex, pos: getComputedStyle(e).position,
    bg: getComputedStyle(e).backgroundColor, op: getComputedStyle(e).opacity }));
  return { topleft: at(100, 5), topright: at(535, 40), splash: !!document.querySelector('.app-loading-fallback') };
});
console.log(JSON.stringify(probe, null, 1));
await page.screenshot({ path: '.design-shots/p-565-clean.png' });
await browser.close();
