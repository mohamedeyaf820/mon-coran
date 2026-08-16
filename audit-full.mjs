import { chromium } from '@playwright/test';

const SETTINGS_HOME = JSON.stringify({ skipSplashAnimation: true, showHome: true, lang: 'fr', theme: 'light', riwaya: 'hafs' });
const SETTINGS_READER = JSON.stringify({ skipSplashAnimation: true, showHome: true, lang: 'fr', theme: 'light', riwaya: 'hafs', displayMode: 'page', mushafLayout: 'mushaf' });

async function auditPage(label, settings, afterNav) {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    baseURL: 'http://127.0.0.1:4174',
    storageState: { origins: [{ origin: 'http://127.0.0.1:4174', localStorage: [{ name: 'mushaf-plus-settings', value: settings }] }] },
    viewport: { width: 1280, height: 900 },
  });
  const page = await ctx.newPage();
  const errors = [];
  const warnings = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text().slice(0, 200));
    if (msg.type() === 'warning') warnings.push(msg.text().slice(0, 150));
  });
  const t0 = Date.now();
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const loadTime = Date.now() - t0;
  if (afterNav) await afterNav(page);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `audit-${label}.png`, fullPage: false });
  
  // Measure layout shift / paint timing
  const perf = await page.evaluate(() => {
    const entries = performance.getEntriesByType('navigation');
    const nav = entries[0] || {};
    return {
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0),
      loadEvent: Math.round(nav.loadEventEnd || 0),
      transferSize: nav.transferSize || 0,
    };
  });
  
  await browser.close();
  return { label, loadTime, perf, errors: errors.slice(0, 8), warnings: warnings.slice(0, 5) };
}

// Home page
const r1 = await auditPage('home', SETTINGS_HOME, null);
console.log('\n=== HOME ===');
console.log('Load time:', r1.loadTime + 'ms');
console.log('DOMContentLoaded:', r1.perf.domContentLoaded + 'ms');
console.log('Errors:', JSON.stringify(r1.errors));
console.log('Warnings:', JSON.stringify(r1.warnings));

// Reader page
const r2 = await auditPage('reader', SETTINGS_READER, async (page) => {
  const btn = page.getByRole('button', { name: /Continuer|Commencer|Reprendre/i }).first();
  if (await btn.isVisible().catch(() => false)) await btn.click();
  await page.waitForSelector('.mushaf-page-wrapper, .qc-ayah-text-ar', { timeout: 10000 }).catch(() => {});
});
console.log('\n=== READER ===');
console.log('Load time:', r2.loadTime + 'ms');
console.log('Errors:', JSON.stringify(r2.errors));

