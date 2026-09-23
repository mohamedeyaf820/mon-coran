import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
await page.addInitScript(() => {
  localStorage.setItem('mushaf-plus-settings', JSON.stringify({
    skipSplashAnimation: true, showHome: false, showDuas: false, sidebarOpen: false,
    displayMode: 'surah', mushafLayout: 'list', lang: 'fr', riwaya: 'hafs',
    fontFamily: 'qpc-hafs', quranFontSize: 26, showTajwid: false, showTranslation: false,
  }));
});
// Kill every audio request (CDN mp3 + timing) — the Quran API stays alive.
await page.route(/everyayah|\.mp3/i, (route) => route.abort());
await page.goto('http://127.0.0.1:4173/surah/1', { waitUntil: 'domcontentloaded' });
if (await page.locator('.splash-screen').count()) {
  await page.locator('.splash-screen button', { hasText: /Passer|Skip/ }).first().click().catch(() => {});
  await page.waitForSelector('.splash-screen', { state: 'detached', timeout: 10000 }).catch(() => {});
}
await page.waitForTimeout(2500);
const textBefore = await page.locator('.qc-ayah-text-ar').count();
const listen = page.locator('.qc-list-card button[aria-label="Écouter"]').first();
console.log('ayahs before play:', textBefore, '| listen btn:', await listen.count());
await listen.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
await listen.click({ timeout: 8000 }).catch((e) => console.log('click failed:', e.message.split('\n')[0]));
await page.waitForTimeout(6000);
const toast = await page.locator('.toast-notification').count();
const textAfter = await page.locator('.qc-ayah-text-ar').count();
const errorScreen = await page.locator('button', { hasText: /réessayer|retry/i }).count();
console.log('toasts:', toast, '| ayahs after play-fail:', textAfter, '| retry-screen visible:', errorScreen);
console.log(textAfter > 0 && textBefore > 0 ? 'PASS: Quran text survives audio outage' : 'FAIL: text erased');
await browser.close();
process.exit(0);
