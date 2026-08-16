import { chromium } from '@playwright/test';
import { installQuranNetworkFixtures } from './tests/e2e/helpers/quran-network-fixtures.mjs';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ 
  baseURL: 'http://127.0.0.1:4173',
  viewport: { width: 1280, height: 800 }
});
const page = await ctx.newPage();

// Same setup as the actual test
await installQuranNetworkFixtures(page);

await page.addInitScript(({ key }) => {
  try { sessionStorage.removeItem("mushafplus-reader-tools-open"); } catch {}
  localStorage.setItem(key, JSON.stringify({
    skipSplashAnimation: true,
    showHome: false,
    showDuas: false,
    sidebarOpen: false,
    displayMode: 'surah',
    mushafLayout: 'list',
    lang: 'fr',
    riwaya: 'hafs',
    fontFamily: 'qpc-hafs',
    quranFontSize: 34,
    showTajwid: true,
    lastPosition: { surah: 3, ayah: 1, page: 50, juz: 3 },
  }));
}, { key: 'mushaf-plus-settings' });

await page.setViewportSize({ width: 1280, height: 800 });
await page.goto('/surah/3');
await page.locator('.mp-header').first().waitFor({ timeout: 30000 });
await page.locator('.quran-display--platform').first().waitFor({ timeout: 30000 });
await page.locator('.qc-ayah-text-ar').first().waitFor({ timeout: 30000 });

// Wait a bit more to allow all renders to stabilize
await page.waitForTimeout(1000);

const legend = page.getByTestId("tajweed-legend");
const legendVisible = await legend.isVisible();
console.log('Legend visible:', legendVisible);

const hasOpen = await legend.getAttribute('open');
console.log('Has open attr before click:', hasOpen);

const rulesHidden = await legend.locator(".tajweed-legend__rules").isHidden();
console.log('Rules hidden:', rulesHidden);

const box = await legend.boundingBox();
console.log('Legend height:', box?.height);

// Click summary
console.log('Clicking summary...');
await legend.locator("summary").click();
await page.waitForTimeout(200);

const hasOpenAfter = await legend.getAttribute('open');
console.log('Has open attr after click:', hasOpenAfter);

// Check if any React render happens after click
await page.waitForTimeout(500);
const hasOpenAfter2 = await legend.getAttribute('open');
console.log('Has open attr 700ms after click:', hasOpenAfter2);

await browser.close();
