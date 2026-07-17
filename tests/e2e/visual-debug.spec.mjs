// tests/e2e/visual-debug.spec.mjs
import { test, expect } from '@playwright/test';

test('visual debug - capture screenshots of Warsh mode', async ({ page }) => {
  // Enable verbose logging
  page.on('console', msg => console.log(`[Console] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => console.error(`[PageError] ${err.message}`));
  
  // Navigate to app
  await page.addInitScript(() => {
    try {
      localStorage.setItem('mushaf-plus-settings', JSON.stringify({ splashDone: true }));
    } catch {}
  });
  await page.goto('/surah/4');
  await page.waitForTimeout(2000);
  
  // Screenshot 1: Initial load
  await page.screenshot({ path: 'test-results/01-initial-load.png' });
  
  // Look for and click WARSH button
  const warshButton = page.locator('text=WARSH').first();
  
  console.log('Looking for WARSH/HAFS buttons...');
  
  if (await warshButton.isVisible().catch(() => false)) {
    console.log('Found WARSH button, clicking it...');
    await warshButton.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/02-after-warsh-click.png' });
  }
  
  // The test already opened Surah 4 directly; verify that navigation settled.
  await expect(page.locator('.quran-display--platform')).toBeVisible();
  await page.waitForTimeout(3000);
  
  // Screenshot 3: After navigation
  await page.screenshot({ path: 'test-results/03-after-navigation.png', fullPage: true });
  
  // Check for error modal
  const errorLocator = page.locator('text=Failed to load').first();
  const errorText = await errorLocator.isVisible().catch(() => false) ? await errorLocator.textContent().catch(() => null) : null;
  if (errorText) {
    console.log('ERROR FOUND:', errorText);
    await page.screenshot({ path: 'test-results/04-error-state.png', fullPage: true });
    
    // Try to capture the full error message
    const errorDetails = await page.locator('.text-lg, .error-message, [role="alert"]').allTextContents();
    console.log('Error details:', errorDetails);
  } else {
    console.log('No error modal detected');
  }
  
  // Check what's actually displayed
  const pageContent = await page.content();
  console.log('Page has content length:', pageContent.length);
  
  // Look for Arabic text
  const arabicLocator = page.locator('text=/[\u0600-\u06FF]/').first();
  const arabicText = await arabicLocator.isVisible().catch(() => false) ? await arabicLocator.textContent().catch(() => null) : null;
  if (arabicText) {
    console.log('Found Arabic text:', arabicText.substring(0, 100));
  }
});

test('debug IndexedDB state', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(3000);
  
  // Get IndexedDB state
  const dbState = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const request = indexedDB.open('MushafPlusDB');
      request.onsuccess = async (event) => {
        const db = event.target.result;
        const result = {
          objectStoreNames: Array.from(db.objectStoreNames),
          cacheEntries: []
        };
        
        if (db.objectStoreNames.contains('cache')) {
          const transaction = db.transaction('cache', 'readonly');
          const store = transaction.objectStore('cache');
          const getAll = store.getAll();
          getAll.onsuccess = () => {
            result.cacheEntries = getAll.result.map(item => ({
              key: item.key,
              hasData: !!item.data,
              dataType: typeof item.data,
              isArray: Array.isArray(item.data),
              length: Array.isArray(item.data) ? item.data.length : null
            }));
            resolve(result);
          };
        } else {
          resolve(result);
        }
      };
      request.onerror = () => resolve({ error: 'Failed to open DB' });
    });
  });
  
  console.log('IndexedDB State:', JSON.stringify(dbState, null, 2));
});
