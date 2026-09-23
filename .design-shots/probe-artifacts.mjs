import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 546, height: 720 } });
await page.goto("http://localhost:3003/page/565", { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => document.querySelector('.qcm-page-shell'), null, { timeout: 60000 });
await page.waitForSelector('.app-loading-fallback', { state: 'detached', timeout: 60000 }).catch(() => console.log('splash never detached'));
await page.waitForTimeout(1500);
const probe = await page.evaluate(() => {
  const at = (x, y) => {
    const els = document.elementsFromPoint(x, y).slice(0, 4).map(e => ({
      tag: e.tagName, cls: (e.className||'').toString().slice(0,80), z: getComputedStyle(e).zIndex, pos: getComputedStyle(e).position,
      bg: getComputedStyle(e).backgroundColor, opacity: getComputedStyle(e).opacity }));
    return els;
  };
  return { topleft: at(100, 5), topright: at(535, 40), splashPresent: !!document.querySelector('.app-loading-fallback') };
});
console.log(JSON.stringify(probe, null, 1));
await page.screenshot({ path: '.design-shots/p-565-clean.png' });
await browser.close();
