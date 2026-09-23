import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 546, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.setDefaultTimeout(60000);
await page.goto('http://localhost:3002/page/565', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(8000);
await page.keyboard.press('Escape');
await page.waitForTimeout(2000);
const info = await page.evaluate(() => {
  const d = document.querySelector('.quran-display--platform');
  return {
    sidebarOpen: !!document.querySelector('.sidebar-close-button'),
    displayHTML: d ? d.innerHTML.slice(0, 300) : null,
    classes: d ? Array.from(d.querySelectorAll('*')).slice(0,40).map(e=>e.className.toString().split(' ')[0]).filter(Boolean).slice(0,25) : [],
    fullscreenTrigger: !!document.querySelector('.reader-fullscreen-trigger'),
    modePane: document.querySelector('.quran-mode-pane--mushaf')?.children.length ?? -1,
    mushafText: !!document.querySelector('.mushaf-text-block'),
    pageShell: !!document.querySelector('.qcm-page-shell'),
  };
});
console.log(JSON.stringify(info, null, 1));
await page.screenshot({ path: '.scratch-diag/shots/probe2.png' });
await browser.close();
