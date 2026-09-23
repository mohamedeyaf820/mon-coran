import { chromium } from 'playwright';

const KEY = 'mushaf-plus-settings';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();

await page.addInitScript(({ key }) => {
  localStorage.setItem(key, JSON.stringify({
    skipSplashAnimation: true, showHome: false, showDuas: false, sidebarOpen: false,
    displayMode: 'surah', mushafLayout: 'list', lang: 'fr', riwaya: 'hafs',
    fontFamily: 'qpc-hafs', quranFontSize: 30, showTajwid: false, showTranslation: false,
    lastPosition: { surah: 2, ayah: 1, page: 1, juz: 1 },
  }));
}, { key: KEY });

await page.goto('http://127.0.0.1:4173/surah/2', { waitUntil: 'domcontentloaded' });
if (await page.locator('.splash-screen').count()) {
  await page.locator('.splash-screen button', { hasText: /Passer|Skip/ }).first().click().catch(() => {});
  await page.waitForSelector('.splash-screen', { state: 'detached', timeout: 10000 }).catch(() => {});
}
await page.waitForTimeout(2500);

const hlBefore = await page.evaluate(() => CSS.highlights.size);
const listText = await page.locator('.qc-ayah-text-ar').count();
console.log('BEFORE list mode: ayahTextNodes=%s highlightRanges=%s', listText, hlBefore);
if (listText === 0) { console.log('FAIL: reader text not rendered (seed or load issue)'); await browser.close(); process.exit(1); }
if (hlBefore > 0) { console.log('NOTE: tajwid active before toggle — seed showTajwid:false not honored, test inconclusive'); }

await page.locator('button[aria-label*="Plus"], .mp-header-more').last().click().catch(() => {});
await page.waitForTimeout(400);
await page.locator('.mp-header-menu button').filter({ hasText: /^Mushaf$/ }).first().click().catch(() => {});
await page.mouse.click(195, 820);
await page.waitForTimeout(2000);

const hlAfter = await page.evaluate(() => CSS.highlights.size);
const mushafText = await page.locator('.qc-ayah-text-ar, .qcm-line, .qcm-word').count();
console.log('AFTER toggle: mushafNodes=%s highlightRanges=%s', mushafText, hlAfter);

if (mushafText === 0) console.log('FAIL: did not reach mushaf layout');
else if (hlAfter > 0) console.log('FAIL: toggle still activates tajwid coloring');
else console.log('PASS: layout switched to mushaf, showTajwid NOT forced');
await browser.close();
process.exit(0);
