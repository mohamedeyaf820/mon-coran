import { chromium } from "playwright";
const BASE = "http://localhost:3003";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 546, height: 720 }, deviceScaleFactor: 2 });
await page.addInitScript(() => {
  const origCheck = FontFaceSet.prototype.check;
  FontFaceSet.prototype.check = function (family, text) {
    if (String(family).includes("surahnames")) return false;
    return origCheck.call(this, family, text);
  };
});
await page.goto(BASE + "/page/566", { waitUntil: "domcontentloaded" });
await page.waitForSelector('.app-loading-fallback', { state: 'detached', timeout: 30000 }).catch(() => {});
await page.waitForFunction(() => {
  if (document.querySelector('.qcm-page-shell')) return 'shell';
  const b = [...document.querySelectorAll('.qc-reader-toolbar__modes button')].find(x => /mushaf/i.test(x.textContent));
  return b && b.getAttribute('aria-pressed') === 'false' ? 'btn' : false;
}, null, { timeout: 90000, polling: 1000 }).then(h => h.jsonValue()).then(async (state) => {
  if (state === 'btn') {
    await page.locator('.qc-reader-toolbar__modes button', { hasText: 'Mushaf' }).first().click();
    await page.waitForSelector('.qcm-page-shell', { timeout: 20000 });
  }
}).catch(() => {});
await page.waitForTimeout(2500);
const fb = page.locator('.qcm-surah-title__name--fallback');
console.log('fallback count:', await fb.count());
if (await fb.count()) {
  console.log('fallback text:', await fb.first().textContent());
  await page.locator('.qcm-line--surah-header').first().screenshot({ path: '.design-shots/v2-566-band-fallback.png' });
}
await browser.close();
console.log('done');
