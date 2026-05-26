// e2e/visual-debug.spec.js
import { test, expect } from '@playwright/test';

test('visual debug - capture screenshots of Warsh mode', async ({ page }) => {
  // Enable verbose logging
  page.on('console', msg => console.log(`[Console] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => console.error(`[PageError] ${err.message}`));
  
  // Navigate to app
  await page.goto('/');
  await page.waitForTimeout(2000);
  
  // Screenshot 1: Initial load
  await page.screenshot({ path: 'test-results/01-initial-load.png' });
  
  // Look for and click WARSH button
  const warshButton = page.locator('text=WARSH').first();
  const hafsButton = page.locator('text=HAFS').first();
  
  console.log('Looking for WARSH/HAFS buttons...');
  
  if (await warshButton.isVisible().catch(() => false)) {
    console.log('Found WARSH button, clicking it...');
    await warshButton.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/02-after-warsh-click.png' });
  }
  
  // Try to navigate to Surah 4
  console.log('Attempting to navigate to Surah 4...');
  
  // Method 1: Look for Surah 4 in the list
  const surah4Links = [
    'text=An-Nisa',
    'text=Les Femmes',
    'text=The Women',
    'text=4',
    '[data-surah="4"]',
    'a:has-text("An-Nisa")',
  ];
  
  for (const selector of surah4Links) {
    const element = page.locator(selector).first();
    if (await element.isVisible().catch(() => false)) {
      console.log(`Found Surah 4 with selector: ${selector}`);
      await element.click();
      break;
    }
  }
  
  await page.waitForTimeout(3000);
  
  // Screenshot 3: After navigation
  await page.screenshot({ path: 'test-results/03-after-navigation.png', fullPage: true });
  
  // Check for error modal
  const errorText = await page.locator('text=Failed to load').first().textContent().catch(() => null);
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
  const arabicText = await page.locator('text=/[\u0600-\u06FF]/').first().textContent().catch(() => null);
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
