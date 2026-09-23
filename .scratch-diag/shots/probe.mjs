import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 546, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.setDefaultTimeout(60000);
await page.goto('http://localhost:3002/page/565', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(15000);
const info = await page.evaluate(() => ({
  url: location.href,
  text: document.body.innerText.slice(0, 400),
  shell: !!document.querySelector('.qcm-page-shell'),
  display: !!document.querySelector('.quran-display--platform'),
  mode: document.querySelector('.app-root')?.dataset.view,
  buttons: Array.from(document.querySelectorAll('button')).slice(0,20).map(b => (b.className+'|'+b.textContent).slice(0,50)),
}));
console.log(JSON.stringify(info, null, 1));
await page.screenshot({ path: '.scratch-diag/shots/probe.png' });
await browser.close();
