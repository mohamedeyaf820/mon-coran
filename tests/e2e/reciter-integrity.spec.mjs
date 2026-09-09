import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('detail retains one focused dialog through chunk failure and retry', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('mushaf-plus-settings', JSON.stringify({
    skipSplashAnimation: true, showHome: true, lang: 'fr', theme: 'light', riwaya: 'hafs', sidebarOpen: false,
  })));
  let fail = true;
  const manifest = JSON.parse(readFileSync('dist/.vite/manifest.json', 'utf8'));
  const detailAssets = Object.entries(manifest).filter(([key]) => key.startsWith('src/components/recitation/ReciterDetailPage.jsx')).map(([, entry]) => '/' + entry.file);
  await page.route(url => detailAssets.includes(url.pathname) || url.pathname.includes('/recitation/ReciterDetailPage'), async route => {
    if (fail) await route.abort(); else await route.continue();
  });
  await page.goto('/');
  await page.getByRole('tab', { name: 'Audio', exact: true }).click();
  const trigger = page.locator('.reciter-card__main').first();
  await trigger.click();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  const close = page.getByRole('button', { name: 'Fermer', exact: true });
  await expect(close).toBeFocused();
  await expect(page.getByRole('alert')).toContainText('Impossible de charger');
  await page.screenshot({ path: 'test-results/recitation/detail-error.png' });
  fail = false;
  await page.getByRole('button', { name: 'Réessayer', exact: true }).click();
  await expect(page.locator('.recitation-row').first()).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await page.screenshot({ path: 'test-results/recitation/detail-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/recitation/detail-mobile.png' });
  await close.focus();
  await page.keyboard.press('Shift+Tab');
  expect(await page.getByRole('dialog').evaluate(node => node.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('profile failure retains fallback and retry uses the precached URL', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('mushaf-plus-settings', JSON.stringify({
    skipSplashAnimation: true, showHome: true, lang: 'en', theme: 'dark', riwaya: 'hafs', sidebarOpen: false,
  })));
  let fail = true;
  const urls = [];
  await page.route('**/data/reciter-profiles.json*', async route => {
    urls.push(route.request().url());
    if (fail) await route.abort(); else await route.continue();
  });
  await page.goto('/');
  await page.getByRole('tab', { name: 'Audio', exact: true }).click();
  await page.locator('.reciter-card__main').first().click();
  await expect(page.locator('.reciter-profile-error')).toBeVisible();
  await expect(page.locator('.reciter-bio-collapse__content')).not.toBeEmpty();
  fail = false;
  await page.locator('.reciter-profile-error').getByRole('button', { name: 'Retry' }).click();
  await expect(page.locator('.reciter-profile-error')).toHaveCount(0);
  expect(urls.every(url => new URL(url).search === '')).toBe(true);
  await page.screenshot({ path: 'test-results/recitation/detail-dark-en.png' });
});

test('download activity remains cancellable after detail remount during startup', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('mushaf-plus-settings', JSON.stringify({
      skipSplashAnimation: true, showHome: true, lang: 'en', theme: 'light', riwaya: 'hafs', sidebarOpen: false,
    }));
    navigator.storage.estimate = () => new Promise(resolve => { window.releaseQuota = () => resolve({ usage: 0, quota: 10 * 1024 ** 3 }); });
  });
  await page.goto('/');
  await page.getByRole('tab', { name: 'Audio', exact: true }).click();
  const trigger = page.locator('.reciter-card__main').first();
  await trigger.click();
  await page.locator('.recitation-row').first().locator('.recitation-action-btn--download').click();
  await expect(page.locator('.recitation-row').first().locator('.is-downloading')).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await trigger.click();
  const download = page.locator('.recitation-row').first().locator('.recitation-action-btn--download');
  await expect(download).toHaveAccessibleName(/Cancel download/);
  await download.click();
  await page.evaluate(() => window.releaseQuota());
  await expect(download).not.toHaveClass(/is-downloading/);
});

test('Arabic Warsh detail keeps RTL, portrait fallback and riwaya share identity', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('mushaf-plus-settings', JSON.stringify({
      skipSplashAnimation: true, showHome: true, lang: 'ar', theme: 'sepia', riwaya: 'warsh', sidebarOpen: false,
    }));
    navigator.share = async payload => { window.sharedRecitation = payload.url; };
  });
  await page.route('**/*', route => route.request().resourceType() === 'image' ? route.abort() : route.continue());
  await page.goto('/');
  await page.getByRole('tab').last().click();
  await page.locator('.reciter-card__main').first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('.reciter-hero__avatar--fallback')).toBeVisible();
  await page.locator('.recitation-row').first().getByRole('button', { name: /مشاركة التلاوة/ }).click();
  const url = new URL(await page.evaluate(() => window.sharedRecitation));
  expect(url.searchParams.get('riwaya')).toBe('warsh');
  expect(url.searchParams.get('surah')).toBe('1');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/recitation/detail-ar-warsh.png' });
});
