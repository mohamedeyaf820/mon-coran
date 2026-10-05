import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

test('a slow annotation download leaves Warsh text readable and updates mounted colours', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('mushaf-plus-settings', JSON.stringify({
    skipSplashAnimation: true, showHome: false, sidebarOpen: false, displayMode: 'page',
    mushafLayout: 'mushaf', riwaya: 'warsh', showTajwid: true, fontFamily: 'qpc-warsh',
    lastPosition: { surah: 4, ayah: 44, page: 85, juz: 5 },
  })));
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  await page.route('**/data/warsh-tajweed-archive.json', async route => { await pending; await route.continue(); });
  await page.route(url => ['raw.githubusercontent.com', 'api.quran.com'].includes(url.hostname), route => route.abort());
  try {
    await page.goto('/page/85', { waitUntil: 'domcontentloaded' });
    const sheet = page.locator('[data-stream-page="85"]');
    await expect(sheet).toBeVisible();
    const before = await sheet.textContent();
    await expect(page.locator('[data-source-status="warsh-dabt"]')).not.toHaveCount(0);
    release();
    await expect(page.locator('[data-source-status="warsh-user-archive"]')).not.toHaveCount(0);
    await expect.poll(() => sheet.locator('[data-tajwid-color="var(--tajwid-tafkhim)"]').count()).toBeGreaterThan(0);
    expect(await sheet.textContent()).toEqual(before);
  } finally { release(); }
});

for (const [width, lang, layout] of [[390, 'fr', 'mushaf'], [1440, 'ar', 'mushaf'], [820, 'fr', 'list']]) {
  test(`supplied Warsh annotations preserve real text at ${width} ${layout}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(settings => {
      localStorage.setItem('mushaf-plus-settings', JSON.stringify(settings));
      sessionStorage.setItem('mushafplus-reader-tools-open', 'true');
    }, { skipSplashAnimation: true, showHome: false, displayMode: 'page', mushafLayout: layout,
      riwaya: 'warsh', lang, showTajwid: true, sidebarOpen: false, fontFamily: 'qpc-warsh',
      lastPosition: { surah: 4, ayah: 44, page: 85, juz: 5 } });
    await page.route(url => ['raw.githubusercontent.com', 'api.quran.com'].includes(url.hostname), route => route.abort());
    await page.goto('/page/85');
    const sheet = page.locator('[data-stream-page="85"]');
    await expect(sheet).toBeVisible({ timeout: 20000 });
    const legend = page.getByTestId('tajweed-legend').first();
    await expect(page.locator('[data-source-status="warsh-user-archive"]')).not.toHaveCount(0);
    await legend.click();
    await expect(page.locator('[data-visual-group]')).toHaveCount(8);
    await page.keyboard.press('Escape');
    await expect.poll(() => sheet.locator('.is-tajweed-painted').count()).toBeGreaterThan(0);
    const colours = await sheet.locator('[data-tajwid-color]').evaluateAll(nodes => [...new Set(nodes.map(node => node.getAttribute('data-tajwid-color')))]);
    expect(colours.length).toBeGreaterThan(3);
    const before = await sheet.textContent();
    await page.evaluate(() => document.fonts.ready);
    mkdirSync('.codex-artifacts/warsh-archive', { recursive: true });
    await page.screenshot({ path: `.codex-artifacts/warsh-archive/${width}-${lang}.png` });
    await page.screenshot({ path: info.outputPath(`warsh-archive-${width}-${lang}.png`), fullPage: false });
    const cached = await page.evaluate(async () => {
      const request = indexedDB.open('mushafplus');
      const db = await new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
      const read = db.transaction('cache').objectStore('cache').getAll();
      const rows = await new Promise(resolve => { read.onsuccess = () => resolve(read.result); });
      db.close();
      return rows.some(row => row.key.startsWith('warsh-tajweed-archive-') && typeof row.data === 'string');
    });
    expect(cached).toBe(true);
    await page.route('**/data/warsh-tajweed-archive.json', route => route.abort());
    await page.reload();
    await expect(page.locator('[data-source-status="warsh-user-archive"]')).not.toHaveCount(0);
    await expect(sheet).toBeVisible();
    await page.context().setOffline(true);
    expect(await sheet.textContent()).toEqual(before);
  });
}
