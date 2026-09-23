import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 546, height: 720 } });
page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE ERR:', m.text().slice(0,200)); });
page.on('pageerror', e => console.log('PAGE ERR:', e.message.slice(0,200)));
await page.goto("http://localhost:3003/page/565", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(9000);
const info = await page.evaluate(() => ({
  splash: !!document.querySelector('[class*=splash], [class*=loading-screen], [id*=splash]'),
  appRootClass: document.querySelector('.app-root')?.className?.slice(0,120),
  hasShell: !!document.querySelector('.qcm-page-shell'),
  hasStream: !!document.querySelector('.page-stream'),
  hasDisplay: !!document.querySelector('.quran-display--platform'),
  modes: [...document.querySelectorAll('.qc-reader-toolbar__modes button')].map(b => b.textContent + '|' + b.getAttribute('aria-pressed')),
  bodyChildren: [...document.body.children].map(e => e.tagName + '.' + (e.className||'').toString().slice(0,40)),
}));
console.log(JSON.stringify(info, null, 1));
await browser.close();
