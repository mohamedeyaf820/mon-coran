import { chromium } from 'playwright';
const browser = await chromium.launch();
for (const n of [1, 566, 559]) {
  const ctx = await browser.newContext({ viewport: { width: 546, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.setDefaultTimeout(120000);
  await page.goto(`http://localhost:3002/page/${n}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(9000);
  const r = await page.evaluate(() => ({
    words: document.querySelectorAll('#root .qcm-word').length,
    lines: document.querySelectorAll('#root .qcm-line').length,
    shells: document.querySelectorAll('#root .qcm-page-shell').length,
    body: document.body.innerText.slice(0, 80).replace(/\n/g, '|'),
  }));
  console.log(n, JSON.stringify(r));
  await ctx.close();
}
await browser.close();
