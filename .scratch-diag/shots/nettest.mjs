import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 546, height: 900 } });
const page = await ctx.newPage();
page.on('console', (m) => console.log(`[${m.type()}]`, m.text().slice(0, 160)));
page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 200)));
await page.goto('http://localhost:3002/page/566', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(6000);
const r = await page.evaluate(async () => {
  const out = {};
  try {
    const res = await fetch('https://api.alquran.cloud/v1/page/566/quran-uthmani');
    const j = await res.json();
    out.status = res.status;
    out.ayahs = j?.data?.ayahs?.length;
  } catch (e) { out.err = String(e); }
  out.sw = navigator.serviceWorker ? (await navigator.serviceWorker.getRegistrations()).length : -1;
  out.idb = indexedDB ? (await indexedDB.databases?.() || 'n/a') : 'n/a';
  return out;
});
console.log(JSON.stringify(r));
await browser.close();
