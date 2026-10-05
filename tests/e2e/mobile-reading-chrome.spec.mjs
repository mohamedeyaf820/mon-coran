import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { installQuranNetworkFixtures } from './helpers/quran-network-fixtures.mjs';

for (const [width, lang] of [[390, 'fr'], [820, 'ar']]) {
  test(`mobile reading hides chrome and retains riwaya switching (${width} ${lang})`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await installQuranNetworkFixtures(page, { withWarshDabt: true });
    await page.addInitScript(({ lang }) => {
      localStorage.setItem('mushaf-plus-settings', JSON.stringify({ skipSplashAnimation: true,
        showHome: false, sidebarOpen: false, lang, riwaya: 'hafs', displayMode: 'surah', mushafLayout: 'list',
        lastPosition: { surah: 3, ayah: 1, page: 50, juz: 3 },
      }));
      const NativeAudio = window.Audio;
      const elements = [];
      window.Audio = function (...args) { const audio = new NativeAudio(...args); elements.push(audio); return audio; };
      Object.defineProperty(window, '__chromeMedia', { get() { return elements.find(audio => audio.hasAttribute('webkit-playsinline') && audio.src); } });
      const paused = new WeakMap();
      Object.defineProperty(HTMLMediaElement.prototype, 'paused', { configurable: true, get() { return paused.get(this) !== false; } });
      HTMLMediaElement.prototype.play = function () { paused.set(this, false); this.dispatchEvent(new Event('play')); return Promise.resolve(); };
      HTMLMediaElement.prototype.pause = function () { paused.set(this, true); this.dispatchEvent(new Event('pause')); };
    }, { lang });
    await page.goto('/surah/3');
    await expect(page.locator('.qc-ayah-text-ar').first()).toBeVisible();
    const reveal = () => page.locator('#main-content').click({ position: { x: 4, y: 180 } });
    const nav = page.locator('.mobile-navigation');
    await reveal();
    await nav.locator('[data-destination="more"]').click();
    await expect(page.locator('[data-riwaya-choice="hafs"]')).toHaveAttribute('aria-pressed', 'true');
    // The popover scales in; measure the settled target, not a frame mid-animation.
    await page.locator('.mobile-navigation-menu').evaluate(node => Promise.all(node.getAnimations().map(animation => animation.finished)));
    for (const choice of await page.locator('[data-riwaya-choice]').all()) {
      const bounds = await choice.boundingBox();
      expect(bounds.height).toBeGreaterThanOrEqual(44);
      expect(bounds.width).toBeGreaterThanOrEqual(44);
    }
    await page.waitForTimeout(3100);
    await expect(nav).toBeVisible();
    mkdirSync('.codex-artifacts/mobile-reading-chrome', { recursive: true });
    await page.screenshot({ path: `.codex-artifacts/mobile-reading-chrome/riwaya-${width}.png` });
    await page.locator('[data-riwaya-choice="warsh"]').click();
    await expect(page.locator('.app-root')).toHaveAttribute('data-riwaya', 'warsh');
    await reveal();
    await nav.locator('[data-destination="more"]').click();
    await expect(page.locator('[data-riwaya-choice="warsh"]')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('[data-riwaya-choice="hafs"]').click();
    await expect(page.locator('.app-root')).toHaveAttribute('data-riwaya', 'hafs');
    await page.keyboard.press('Tab');
    await page.locator('#main-content').focus();
    await reveal();
    await page.locator('.qc-list-card__start .ayah-action--play').first().click();
    await expect.poll(() => page.evaluate(() => window.__chromeMedia?.paused)).toBe(false);
    await page.evaluate(() => { window.__initialChromeMedia = window.__chromeMedia; });
    await reveal();
    await page.locator('#main-content').evaluate(node => node.scrollTo({ top: 400, behavior: 'instant' }));
    await expect.poll(() => page.locator('#main-content').evaluate(node => node.scrollTop)).toBeGreaterThan(0);
    const before = await page.locator('#main-content').evaluate(node => node.scrollTop);
    await expect(nav).toBeHidden({ timeout: 6000 });
    await expect(page.locator('.mp-audio-player').first()).toBeHidden();
    expect(await page.evaluate(() => window.__chromeMedia?.paused)).toBe(false);
    expect(await page.locator('#main-content').evaluate(node => node.scrollTop)).toBe(before);
    mkdirSync('.codex-artifacts/mobile-reading-chrome', { recursive: true });
    await page.screenshot({ path: `.codex-artifacts/mobile-reading-chrome/hidden-${width}.png` });
    await reveal();
    await expect(nav).toBeVisible();
    await expect(page.locator('.mp-audio-player').first()).toBeVisible();
    expect(await page.evaluate(() => window.__initialChromeMedia === window.__chromeMedia)).toBe(true);
    await page.screenshot({ path: `.codex-artifacts/mobile-reading-chrome/visible-${width}.png` });
    await nav.locator('[data-destination="home"]').click();
    await expect(page.locator('.home-resume-panel')).toBeVisible();
    await expect(nav).toBeVisible();
  });
}
