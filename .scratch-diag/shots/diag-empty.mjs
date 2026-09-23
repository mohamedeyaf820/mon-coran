import { chromium } from 'playwright';

const pageNum = process.argv[2] || '566';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 546, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.setDefaultTimeout(120000);
const logs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text().slice(0, 200)}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${String(e).slice(0, 300)}`));
page.on('requestfailed', (r) => logs.push(`[reqfail] ${r.url().slice(0, 120)} ${r.failure()?.errorText}`));
page.on('response', (r) => {
  const u = r.url();
  if (/api\.quran|gquran|\.json|pages?\/|word/i.test(u) && !/\.(?:js|css|woff2?)(\?|$)/i.test(u)) {
    logs.push(`[resp] ${r.status()} ${u.slice(0, 140)}`);
  }
});

await page.goto(`http://localhost:3002/page/${pageNum}`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.reader-fullscreen-trigger', { timeout: 90000 });
await page.waitForTimeout(4000);
await page.evaluate(() => document.querySelector('.sidebar-close-button')?.click());
await page.waitForTimeout(1200);
const under = await page.evaluate(() => ({
  rootLines: document.querySelectorAll('#root .qcm-page-shell').length,
  rootWords: document.querySelectorAll('#root .qcm-word').length,
  rootMarkers: document.querySelectorAll('#root .qcm-ayah-marker, #root .ayat-marker').length,
  displayText: document.querySelector('#root')?.innerText?.slice(0, 120),
}));
console.log('underlying:', JSON.stringify(under));

const lines = () => page.evaluate(() => document.querySelectorAll('.mfp-portal-root .qcm-line').length);
const shell = () => page.evaluate(() => !!document.querySelector('.mfp-portal-root .qcm-page-shell'));

await page.evaluate(() => document.querySelector('.reader-fullscreen-trigger')?.click());
await page.waitForTimeout(800);
await page.keyboard.press('f');
// poll for up to 25s
let opened = false;
for (let i = 0; i < 50; i++) {
  if (await shell()) { opened = true; break; }
  if (i === 5) { await page.keyboard.press('f').catch(() => {}); }
  await page.waitForTimeout(500);
}
console.log('opened:', opened);
if (opened) {
  for (let i = 0; i < 50; i++) {
    const n = await lines();
    if (i % 5 === 0) console.log(`t+${(i * 0.5).toFixed(1)}s lines=${n}`);
    if (n > 0 && i > 6) break;
    await page.waitForTimeout(500);
  }
  console.log('final lines:', await lines());
  const meta = await page.evaluate(() => {
    const root = document.querySelector('.mfp-portal-root');
    return {
      head: root?.querySelector('.qcm-page-header')?.textContent?.slice(0, 60) ?? null,
      bookHTMLLen: root?.querySelector('.mfp-book')?.innerHTML.length ?? 0,
      portalWords: root?.querySelectorAll('.qcm-word').length ?? -1,
      underlyingWords: document.querySelectorAll('#root .qcm-word').length,
    };
  });
  console.log(JSON.stringify(meta));
  await page.screenshot({ path: `.scratch-diag/shots/empty-${pageNum}.png` });
}
console.log('--- logs ---');
console.log(logs.slice(0, 40).join('\n') || '(none)');
await browser.close();
