import { chromium, expect } from '@playwright/test';
import { installQuranNetworkFixtures } from './tests/e2e/helpers/quran-network-fixtures.mjs';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ 
  baseURL: 'http://127.0.0.1:4173',
  viewport: { width: 1280, height: 800 }
});
const page = await ctx.newPage();

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

// Exactly replicate the openReader conditions
const mpHeader = page.locator('.mp-header').first();
await mpHeader.waitFor({ timeout: 30000, state: 'visible' });
const platform = page.locator('.quran-display--platform').first();
await platform.waitFor({ timeout: 30000, state: 'visible' });
const ayahText = page.locator('.qc-ayah-text-ar').first();
await ayahText.waitFor({ timeout: 30000, state: 'visible' });

// Replicate the exact assertions before click
const legend = page.getByTestId("tajweed-legend");
await expect(legend).toBeVisible();
await expect(legend).not.toHaveAttribute("open", "");
await expect(legend.locator(".tajweed-legend__rules")).toBeHidden();
const collapsedLegendBox = await legend.boundingBox();
console.log('Legend height:', collapsedLegendBox?.height, '(need <=56)');

console.log('Clicking summary...');
await legend.locator("summary").click();

// Check immediately
await page.waitForTimeout(50);
const attr50 = await legend.getAttribute('open');
console.log('open attr 50ms after click:', attr50);

await page.waitForTimeout(200);
const attr250 = await legend.getAttribute('open');
console.log('open attr 250ms after click:', attr250);

// Replicate the Playwright assertion with timeout
try {
  await expect(legend).toHaveAttribute("open", "", { timeout: 3000 });
  console.log('SUCCESS: open attr found');
} catch(_e) {
  console.log('FAILED: open attr not found within 3s');
  const attrFinal = await legend.getAttribute('open');
  console.log('Final open attr:', attrFinal);
}

await browser.close();
