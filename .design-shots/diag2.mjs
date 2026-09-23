import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 546, height: 720 } });
await page.goto("http://localhost:3003/page/559", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(5000);
const before = await page.evaluate(() => ({
  modes: [...document.querySelectorAll('.qc-reader-toolbar__modes button')].map(b => b.textContent + '|' + b.getAttribute('aria-pressed')),
  streamChildren: [...(document.querySelector('.page-stream')?.children || [])].map(c => c.className.toString().slice(0,60)).slice(0,6),
  hasFooter: !!document.querySelector('.qcm-page-footer'),
  hasShell: !!document.querySelector('.qcm-page-shell'),
  hasQcmPage: !!document.querySelector('.qcm-page'),
}));
console.log('before:', JSON.stringify(before, null, 1));
await page.locator('.qc-reader-toolbar__modes button', { hasText: 'Mushaf' }).first().click();
await page.waitForTimeout(3000);
const after = await page.evaluate(() => ({
  modes: [...document.querySelectorAll('.qc-reader-toolbar__modes button')].map(b => b.textContent + '|' + b.getAttribute('aria-pressed')),
  streamChildren: [...(document.querySelector('.page-stream')?.children || [])].map(c => c.className.toString().slice(0,60)).slice(0,6),
  hasFooter: !!document.querySelector('.qcm-page-footer'),
  hasShell: !!document.querySelector('.qcm-page-shell'),
  hasQcmPage: !!document.querySelector('.qcm-page'),
  markers: document.querySelectorAll('.qcm-ayah-marker').length,
}));
console.log('after:', JSON.stringify(after, null, 1));
await page.screenshot({ path: '.design-shots/diag-after.png' });
await browser.close();
