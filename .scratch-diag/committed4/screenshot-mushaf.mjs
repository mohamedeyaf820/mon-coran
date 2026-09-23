import { chromium } from '@playwright/test';

const SETTINGS = JSON.stringify({
  skipSplashAnimation: true, showHome: true, lang: 'fr', theme: 'light',
  riwaya: 'hafs', displayMode: 'page', mushafLayout: 'mushaf'
});

async function measure(viewport, label) {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    baseURL: 'http://127.0.0.1:4174',
    storageState: { origins: [{ origin: 'http://127.0.0.1:4174', localStorage: [{ name: 'mushaf-plus-settings', value: SETTINGS }] }] },
    viewport,
    isMobile: viewport.width < 768,
    hasTouch: viewport.width < 768,
  });
  const page = await ctx.newPage();
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const btn = page.getByRole('button', { name: /Continuer|Commencer|Reprendre|Lire|lecture/i }).first();
  await btn.click();
  await page.waitForSelector('.quran-mode-pane--mushaf, .mushaf-page-wrapper', { timeout: 12000 });
  await page.waitForTimeout(2000);
  
  const w = await page.evaluate(() => {
    const sel = (s) => { const el = document.querySelector(s); return el ? Math.round(el.getBoundingClientRect().width) : null; };
    return {
      mushafPage: sel('.mushaf-page-wrapper'),
      contextCard: sel('.reader-context-card'),
      controlDeck: sel('.reader-control-deck'),
      commandBar: sel('.reader-command-bar'),
      modeNav: sel('.reader-mode-nav'),
    };
  });
  
  await page.screenshot({ path: `screenshot-${label}.png`, fullPage: false });
  await browser.close();
  return { label, viewport, widths: w };
}

const r1 = await measure({ width: 390, height: 844 }, 'mobile');
console.log(`=== ${r1.label} (${r1.viewport.width}px) ===`, JSON.stringify(r1.widths));
const r2 = await measure({ width: 768, height: 1024 }, 'tablet');
console.log(`=== ${r2.label} (${r2.viewport.width}px) ===`, JSON.stringify(r2.widths));
const r3 = await measure({ width: 1280, height: 900 }, 'desktop');
console.log(`=== ${r3.label} (${r3.viewport.width}px) ===`, JSON.stringify(r3.widths));
