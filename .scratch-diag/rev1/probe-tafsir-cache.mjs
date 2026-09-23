import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto("http://127.0.0.1:4191/surah/2", { waitUntil: "domcontentloaded" });
for (let i = 0; i < 25; i++) {
  if (await page.evaluate(() => !!document.querySelector("[data-ayah-number]"))) break;
  await page.waitForTimeout(2000);
}
await page.waitForTimeout(1500);

const trigger = page.locator('button[aria-label="Options du verset"]').first();
await trigger.scrollIntoViewIfNeeded();
await trigger.click();
await page.waitForTimeout(1200);
const item = page
  .locator("[role=menuitem], [role=menu] button")
  .filter({ hasText: /afasir|Tafsir/i })
  .first();
console.log("tafsir menu item found:", await item.count());
await item.click();
await page.waitForTimeout(6000);

const out = await page.evaluate(() => {
  const panel = document.querySelector('[aria-labelledby="tafsir-sidebar-title"]');
  const keys = Object.keys(localStorage).filter((k) => k.startsWith("mushafplus:tafsir:v2:"));
  return {
    panel: !!panel,
    text: panel ? panel.innerText.replace(/\s+/g, " ").slice(0, 160) : null,
    cacheKeys: keys.length,
    hasIndex: keys.some((k) => k.endsWith(":index")),
    sample: keys.filter((k) => !k.endsWith(":index")).slice(0, 3),
  };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
