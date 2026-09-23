import { chromium } from "playwright";
const BASE = "http://localhost:3003";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 280, height: 844 } });
await page.goto(BASE + "/page/3", { waitUntil: "domcontentloaded" });
await page.waitForSelector('.app-loading-fallback', { state: 'detached', timeout: 30000 }).catch(() => {});
await page.waitForFunction(() => document.querySelector('.qcm-page-shell') ||
  [...document.querySelectorAll('.qc-reader-toolbar__modes button')].find(x => /mushaf/i.test(x.textContent)), null, { timeout: 90000, polling: 1000 }).catch(() => {});
for (let i = 0; i < 5; i++) {
  if (await page.locator('.qcm-page-shell').count()) break;
  const mb = page.locator('.qc-reader-toolbar__modes button', { hasText: 'Mushaf' }).first();
  if (await mb.count()) await mb.click().catch(() => {});
  await page.waitForTimeout(3000);
}
if (!(await page.locator('.qcm-page-shell').count())) {
  console.log('NO SHELL; modes buttons:', await page.locator('.qc-reader-toolbar__modes button').count(),
    'view attr:', await page.evaluate(() => document.querySelector('.app-root')?.dataset.view));
  await browser.close();
  process.exit(1);
}
await page.waitForTimeout(1500);
const trig = page.locator('button.reader-fullscreen-trigger, .srh-fullscreen-btn');
await trig.first().click().catch(async () => {
  await page.locator('[aria-label="Commandes de lecture"]').first().click().catch(() => {});
  await page.waitForTimeout(600);
  await trig.first().click().catch(() => {});
});
await page.waitForSelector('.mfp-portal-root', { timeout: 10000 });
await page.waitForTimeout(2500);
const clipped = await page.locator('.mfp-portal-root').evaluate((root) => {
  const out = [];
  for (const b of root.querySelectorAll("button")) {
    if (!b.getClientRects().length) continue;
    const x = b.getBoundingClientRect();
    if (x.left < -1 || x.right > innerWidth + 1 || x.top < -1 || x.bottom > innerHeight + 1) {
      out.push({ label: b.getAttribute('aria-label') || b.textContent.trim(), cls: b.className, left: x.left, right: x.right, top: x.top, bottom: x.bottom });
    }
  }
  return { clipped: out, innerWidth, footerW: root.querySelector('.mfp-mobile-footer')?.getBoundingClientRect().width, pag: root.querySelector('.mfp-mobile-pagination')?.getBoundingClientRect().width };
});
console.log(JSON.stringify(clipped, null, 1));
await browser.close();
