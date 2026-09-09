import { test, expect } from '@playwright/test';

function composition(root) {
  const lines = [];
  const scale = root.getBoundingClientRect().width / root.offsetWidth;
  for (const verse of root.querySelectorAll('.cpv-verse')) {
    const walker = document.createTreeWalker(verse, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      for (const match of node.textContent.matchAll(/\S+/gu)) {
        const range = document.createRange();
        range.setStart(node, match.index);
        range.setEnd(node, match.index + match[0].length);
        const rect = range.getBoundingClientRect();
        if (!rect.width) continue;
        const y = Math.round(rect.top / scale * 10) / 10;
        let line = lines.find((item) => Math.abs(item.y - y) < 3);
        if (!line) { line = { y, words: [] }; lines.push(line); }
        line.words.push(`${verse.dataset.surahNumber}:${verse.dataset.ayahNumber}:${match[0]}`);
      }
    }
  }
  return lines.sort((a, b) => a.y - b.y).map((line) => line.words);
}

for (const riwaya of ['hafs', 'warsh']) {
  for (const width of [320, 1280]) {
    test(`${riwaya} page 3 composition at ${width}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((riwaya) => {
        localStorage.setItem("mushafplus-page-layout", "1");
    localStorage.setItem('mushaf-plus-settings', JSON.stringify({
          skipSplashAnimation: true, showHome: false, sidebarOpen: false,
          displayMode: 'page', mushafLayout: 'mushaf', lang: 'fr', riwaya,
          fontFamily: riwaya === 'warsh' ? 'kfgqpc-warsh' : 'qpc-hafs',
          reciter: riwaya === 'warsh' ? 'warsh_yassin' : 'alafasy',
          quranFontSize: 34, showTajwid: true, showTranslation: false,
          lastPosition: { surah: 2, ayah: 6, page: 3, juz: 1 },
        }));
      }, riwaya);
      await page.goto('/page/3');
      // Wait for deferred reader chrome before attempting keyboard entry.
      await expect(page.getByRole('button', { name: 'Plein écran', exact: true })).toBeVisible();
      const normal = page.locator('[data-stream-page="3"] .cpv-container');
      await expect(normal.locator('.cpv-verse').first()).toBeVisible({ timeout: 30000 });
      await page.evaluate(() => document.fonts.ready);
      await expect.poll(async () => page.evaluate(() => [...document.fonts].filter(face => face.family.includes('QPC') && face.status === 'loaded').length)).toBeGreaterThan(0);
      await page.screenshot({ path: testInfo.outputPath('normal.png') });
      const normalText = await normal.locator('.cpv-verse').allTextContents();
      const open = page.getByRole('button', { name: 'Plein écran', exact: true });
      await open.dispatchEvent('click');
      const immersive = page.locator('.mfp-shared-page .cpv-container');
      await expect(immersive).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath('fullscreen.png') });
      // Portrait paper has its own line measure; zoom must preserve that
      // composition, while the Quran text stays identical to normal reading.
      expect(await immersive.locator('.cpv-verse').allTextContents()).toEqual(normalText);
      const baseline = await immersive.evaluate(composition);
      const overlay = page.locator('.mfp-portal-root');
      for (const target of [125, 150, 100, 75]) {
        if (target === 100) await overlay.getByRole('button', { name: 'Taille de police 100%', exact: true }).click();
        else await overlay.getByRole('button', { name: `Taille de police ${target === 75 ? '-' : '+'}`, exact: true }).click();
        await page.screenshot({ path: testInfo.outputPath(`zoom-${target}.png`) });
        expect(await immersive.evaluate(composition)).toEqual(baseline);
      }
      await page.keyboard.press('Escape');
      await expect(overlay).toHaveCount(0);
      expect(await normal.locator('.cpv-verse').allTextContents()).toEqual(normalText);
    });
  }
}
