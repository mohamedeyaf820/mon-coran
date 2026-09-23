import { chromium } from 'playwright';
import fs from 'node:fs';

const pageNum = process.argv[2] || '559';
const shotDir = '.scratch-diag/shots';
fs.mkdirSync(shotDir, { recursive: true });

const SETTINGS_KEY = 'mushaf-plus-settings';
const n = Number(pageNum);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 546, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.setDefaultTimeout(60000);
page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 200)));
await page.addInitScript(({ key, page: p }) => {
  localStorage.setItem(key, JSON.stringify({
    skipSplashAnimation: true,
    showHome: false,
    showDuas: false,
    sidebarOpen: false,
    displayMode: 'page',
    mushafLayout: 'mushaf',
    lang: 'fr',
    riwaya: 'hafs',
    currentSurah: 65,
    currentPage: p,
    lastPosition: { surah: 65, ayah: 1, page: p, juz: 28 },
  }));
}, { key: SETTINGS_KEY, page: n });

await page.goto(`http://localhost:3002/page/${pageNum}`, { waitUntil: 'load' });
await page.locator('.quran-display--platform').waitFor({ timeout: 30000 });
const trigger = page.locator(':is(.reader-fullscreen-trigger, .srh-fullscreen-btn):visible').first();
await trigger.waitFor({ timeout: 30000 });
await page.waitForTimeout(3000);
await trigger.click();
await page.locator('.mfp-portal-root').waitFor({ timeout: 30000 });
await page.waitForTimeout(6000);
await page.screenshot({ path: `${shotDir}/c3-${pageNum}.png` });

const diag = await page.evaluate(() => {
  const root = document.querySelector('.mfp-portal-root');
  const book = root.querySelector('.mfp-book--exact');
  const folio = root.querySelector('.qcm-page-folio');
  const marker = root.querySelector('.qcm-line .ayat-marker, .qcm-line .ayah-marker, .qcm-ayah-marker');
  const lines = root.querySelector('.qcm-lines');
  const title = root.querySelector('.qcm-surah-title');
  const cs = (el) => el && getComputedStyle(el);
  const rr = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; };
  return {
    style: {
      zoom: cs(book)?.zoom,
      linesFont: cs(lines)?.fontSize,
      folioW: cs(folio)?.width, folioH: cs(folio)?.height, folioFs: cs(folio)?.fontSize,
      markerFs: cs(marker)?.fontSize, markerMl: cs(marker)?.marginInlineStart, markerMr: cs(marker)?.marginInlineEnd,
    },
    rects: {
      book: rr(book), folio: rr(folio), header: rr(root.querySelector('.mfp-header')),
      footer: rr(root.querySelector('.mfp-mobile-footer')), surahTitle: rr(title),
    },
    counts: {
      lines: root.querySelectorAll('.qcm-line').length,
      words: root.querySelectorAll('.qcm-word').length,
      markers: root.querySelectorAll('.qcm-ayah-marker, .ayat-marker').length,
    },
    titleText: title ? title.textContent : null,
    viewportH: innerHeight,
  };
});
console.log(JSON.stringify(diag, null, 1));
fs.writeFileSync(`${shotDir}/c3-${pageNum}.json`, JSON.stringify(diag, null, 1));
await browser.close();
