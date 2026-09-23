import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 546, height: 900 } });
const page = await ctx.newPage();
page.on('console', (m) => console.log(`[${m.type()}]`, m.text().slice(0, 200)));
page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 300)));
await page.goto('http://localhost:3002/page/566', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(5000);
const r = await page.evaluate(async () => {
  const out = {};
  try {
    const api = await import('/src/services/quranComAPI.js');
    out.can566 = api.canLoadFromQuranCom('page/566', 'hafs');
    out.can559 = api.canLoadFromQuranCom('page/559', 'hafs');
    const t = await api.fetchQuranComText('page/566');
    out.ayahs566 = t?.ayahs?.length;
    out.words566 = t?.ayahs?.[0]?.words?.length;
    out.line566 = t?.ayahs?.[0]?.words?.[0]?.lineNumber;
  } catch (e) { out.err = String(e).slice(0, 300); }
  return out;
});
console.log(JSON.stringify(r));
await browser.close();
