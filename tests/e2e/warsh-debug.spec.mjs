// e2e/warsh-debug.spec.js
import { test, expect } from '@playwright/test';

test.describe('Warsh Debug Tests', () => {
  test('should load Warsh surah 4 without errors', async ({ page }) => {
    // Capture console logs
    const consoleLogs = [];
    const errors = [];
    
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push({ type: msg.type(), text });
      console.log(`[${msg.type()}] ${text}`);
    });
    
    page.on('pageerror', err => {
      errors.push(err.message);
      console.error('[PAGE ERROR]', err.message);
    });
    
    // Navigate to app
    await page.goto('/');
    
    // Wait for splash screen to finish
    await page.waitForTimeout(3000);
    
    // Check if we're on the home page
    await expect(page.locator('text=Mushaf.plus')).toBeVisible();
    
    // Click on Warsh mode if available
    const warshButton = page.locator('text=WARSH').first();
    if (await warshButton.isVisible().catch(() => false)) {
      await warshButton.click();
      await page.waitForTimeout(500);
    }
    
    // Navigate to Surah 4 (An-Nisa)
    // Look for "Les Femmes" or navigate via search
    const searchButton = page.locator('[aria-label="Search"], button:has-text("Rechercher"), .search-icon').first();
    if (await searchButton.isVisible().catch(() => false)) {
      await searchButton.click();
      await page.waitForTimeout(500);
      
      // Type surah 4
      await page.keyboard.type('4');
      await page.waitForTimeout(500);
      
      // Press enter to select
      await page.keyboard.press('Enter');
    } else {
      // Try clicking on Surah 4 directly if on home page
      const surah4 = page.locator('text=An-Nisa, text=Les Femmes').first();
      if (await surah4.isVisible().catch(() => false)) {
        await surah4.click();
      }
    }
    
    // Wait for content to load
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/warsh-surah4.png', fullPage: true });
    
    // Check for error modal
    const errorModal = page.locator('text=Failed to load warsh').first();
    const hasError = await errorModal.isVisible().catch(() => false);
    
    if (hasError) {
      console.log('ERROR: Warsh loading error detected!');
      console.log('Console logs:', consoleLogs);
      console.log('Page errors:', errors);
    }
    
    // Check IndexedDB for Warsh cache
    const warshCache = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const request = indexedDB.open('MushafPlusDB');
        request.onsuccess = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('cache')) {
            resolve({ error: 'No cache store found' });
            return;
          }
          const transaction = db.transaction('cache', 'readonly');
          const store = transaction.objectStore('cache');
          const getAll = store.getAll();
          getAll.onsuccess = () => {
            const warshKeys = getAll.result
              .filter(item => item.key && item.key.includes('warsh'))
              .map(item => ({
                key: item.key,
                dataLength: Array.isArray(item.data) ? item.data.length : 'not array',
                firstItem: Array.isArray(item.data) && item.data[0] ? {
                  ayahNumber: item.data[0].ayahNumber,
                  text: item.data[0].text?.substring(0, 50)
                } : null
              }));
            resolve(warshKeys);
          };
        };
        request.onerror = () => resolve({ error: 'Failed to open DB' });
      });
    });
    
    console.log('Warsh cache in IndexedDB:', JSON.stringify(warshCache, null, 2));
    
    // Assertions
    expect(errors).toHaveLength(0);
    expect(hasError).toBe(false);
  });
  
  test('should check network requests for Warsh data', async ({ page }) => {
    const networkRequests = [];
    
    page.on('request', request => {
      const url = request.url();
      if (url.includes('warsh') || url.includes('github')) {
        networkRequests.push({
          method: request.method(),
          url: url,
          resourceType: request.resourceType()
        });
      }
    });
    
    page.on('response', response => {
      const url = response.url();
      if (url.includes('warsh') || url.includes('github')) {
        console.log(`[Network] ${response.status()} ${url}`);
      }
    });
    
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Switch to Warsh
    const warshButton = page.locator('text=WARSH').first();
    if (await warshButton.isVisible().catch(() => false)) {
      await warshButton.click();
    }
    
    await page.waitForTimeout(2000);
    
    console.log('Network requests:', networkRequests);
    
    // Check if the Warsh JSON was requested
    const warshJsonRequest = networkRequests.find(r => 
      r.url.includes('warshData_v2-1.json')
    );
    
    if (warshJsonRequest) {
      console.log('✓ Warsh JSON was requested:', warshJsonRequest.url);
    } else {
      console.log('✗ Warsh JSON was NOT requested');
    }
    
    await page.screenshot({ path: 'test-results/network-debug.png', fullPage: true });
  });
  
  test('should clear cache and retry loading Warsh', async ({ page }) => {
    // First, clear the cache
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Clear IndexedDB cache via console
    await page.evaluate(async () => {
      return new Promise((resolve) => {
        const request = indexedDB.open('MushafPlusDB');
        request.onsuccess = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('cache')) {
            resolve('No cache store');
            return;
          }
          const transaction = db.transaction('cache', 'readwrite');
          const store = transaction.objectStore('cache');
          
          // Clear all warsh keys
          const getAll = store.getAll();
          getAll.onsuccess = () => {
            const warshItems = getAll.result.filter(item => 
              item.key && item.key.includes('warsh')
            );
            warshItems.forEach(item => store.delete(item.key));
            resolve(`Cleared ${warshItems.length} Warsh cache entries`);
          };
        };
      });
    });
    
    console.log('Cache cleared');
    
    // Now try loading Warsh
    await page.reload();
    await page.waitForTimeout(3000);
    
    const warshButton = page.locator('text=WARSH').first();
    if (await warshButton.isVisible().catch(() => false)) {
      await warshButton.click();
    }
    
    await page.waitForTimeout(3000);
    
    // Navigate to surah 4
    // ... navigation logic
    
    await page.screenshot({ path: 'test-results/warsh-after-clear.png', fullPage: true });
  });
});
