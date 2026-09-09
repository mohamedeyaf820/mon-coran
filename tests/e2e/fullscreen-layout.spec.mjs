import { test, expect } from '@playwright/test';

async function seed(page, riwaya = 'hafs') {
  await page.addInitScript(riwaya => {
    localStorage.setItem('mushafplus-page-layout', '2');
    localStorage.setItem('mushaf-plus-settings', JSON.stringify({
      skipSplashAnimation: true, showHome: false, sidebarOpen: false,
      displayMode: 'page', mushafLayout: 'mushaf', lang: 'fr', riwaya,
      fontFamily: riwaya === 'warsh' ? 'kfgqpc-warsh' : 'qpc-hafs',
      quranFontSize: 34, showTajwid: true, showTranslation: false,
    }));
  }, riwaya);
}

for (const riwaya of ['hafs', 'warsh']) {
  test(`${riwaya} complete spread fits above controls and width mode remains scrollable`, async ({ page }, testInfo) => {
    await seed(page, riwaya);
    await page.setViewportSize({ width: 1900, height: 1000 });
    await page.goto('/page/186');
    await expect(page.locator('[data-stream-page="186"] .cpv-verse').first()).toBeVisible();
    await page.getByRole('button', { name: 'Plein écran', exact: true }).click();
    const overlay = page.locator('.mfp-portal-root');
    await expect(overlay.locator('[data-immersive-page="187"] .cpv-verse').first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const overflow = () => overlay.locator('main').evaluate(el => Math.max(el.scrollHeight - el.clientHeight, el.scrollWidth - el.clientWidth));
    await expect.poll(overflow).toBeLessThanOrEqual(2);
    for (const number of [186, 187]) await expect(overlay.locator(`[data-immersive-page="${number}"] .mushaf-page-number-medallion`)).toHaveText(String(number));
    await page.screenshot({ path: testInfo.outputPath('whole-spread.png') });
    // A short landscape viewport makes width fitting require scrolling even
    // when the chosen font happens to fit a tall desktop without shrinking.
    await page.setViewportSize({ width: 1900, height: 500 });
    await expect.poll(overflow).toBeLessThanOrEqual(2);
    await overlay.locator('summary').click();
    await overlay.getByRole('button', { name: 'Largeur', exact: true }).click();
    await expect(overlay.locator('main')).toHaveAttribute('data-fit', 'width');
    await expect.poll(overflow).toBeGreaterThan(20);
    await overlay.getByRole('button', { name: 'Page entière', exact: true }).click();
    await expect.poll(overflow).toBeLessThanOrEqual(2);
    await page.setViewportSize({ width: 393, height: 852 });
    await expect(overlay.locator('.mfp-spread')).toHaveAttribute('data-page-count', '1');
    await overlay.getByRole('button', { name: 'Largeur', exact: true }).click();
    await overlay.locator('summary').click();
    await expect.poll(() => overlay.locator('main').evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(2);
    await page.screenshot({ path: testInfo.outputPath('mobile-width.png') });
  });
}

test('Al-Baqara coloured Lam-Alef keeps its complete glyph in normal and fullscreen reading', async ({ page }, testInfo) => {
  await seed(page);
  await page.goto('/page/3');
  const checkRanges = root => root.evaluate(el => {
    const word = [...el.querySelectorAll('[data-tajwid-word]')].find(word => word.textContent === 'أَلَآ');
    if (!word) return [];
    return [...CSS.highlights].flatMap(([name, highlight]) => name.startsWith('tajwid-madd')
      ? [...highlight].filter(range => range.startContainer === word.firstChild).map(range => ({ start: range.startOffset, end: range.endOffset, text: word.textContent })) : []);
  });
  const normal = page.locator('[data-stream-page="3"]');
  await expect(normal.locator('.cpv-verse').first()).toBeVisible();
  await expect.poll(() => checkRanges(normal)).toContainEqual({ start: 2, end: 6, text: 'أَلَآ' });
  await page.getByRole('button', { name: 'Plein écran', exact: true }).click();
  const overlay = page.locator('.mfp-portal-root');
  await expect.poll(() => checkRanges(overlay)).toContainEqual({ start: 2, end: 6, text: 'أَلَآ' });
  await page.screenshot({ path: testInfo.outputPath('baqara-ligatures.png') });
});

test('Fullscreen overlay uses adequate line height so diacritics are not clipped', async ({ page }, testInfo) => {
  await seed(page);
  await page.goto('/page/3');
  await page.getByRole('button', { name: 'Plein écran', exact: true }).click();
  const overlay = page.locator('.mfp-portal-root');
  await overlay.locator('[data-immersive-page="3"] .cpv-verse').first().waitFor();
  const lineHeight = await overlay.locator('[data-immersive-page="3"] .mushaf-text-block').evaluate(el => {
    const raw = getComputedStyle(el).lineHeight;
    const num = parseFloat(raw);
    return Number.isFinite(num) ? num : null;
  });
  expect(lineHeight).not.toBeNull();
  expect(lineHeight).toBeGreaterThan(1);
  await page.screenshot({ path: testInfo.outputPath('line-height-check.png') });
});
