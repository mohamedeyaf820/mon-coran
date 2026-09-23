import { webkit } from "playwright";
const BASE = "http://127.0.0.1:4173";
const browser = await webkit.launch();
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
await page.goto(`${BASE}/surah/112`, { waitUntil: "domcontentloaded" });
if (await page.locator(".splash-screen").count()) {
  await page.locator(".splash-screen button", { hasText: /Passer|Skip/ }).first().click().catch(() => {});
  await page.waitForSelector(".splash-screen", { state: "detached", timeout: 10000 }).catch(() => {});
}
await page.waitForTimeout(2500);
await page.locator('button[aria-label*="Plus"], .mp-header-more').last().click().catch(() => {});
await page.waitForTimeout(300);
await page.locator(".mp-header-menu button").filter({ hasText: /^Liste$/ }).first().click().catch(() => {});
await page.mouse.click(195, 820).catch(() => {});
await page.waitForTimeout(1500);
const info = await page.evaluate(() => {
  const el = document.querySelector(".qc-ayah-text-ar");
  return {
    render: el?.querySelector("[data-tajwid-render]")?.getAttribute("data-tajwid-render") ?? null,
    rules: CSS.highlights ? [...CSS.highlights.keys()].filter((k) => k.startsWith("tajwid-")).length : -1,
    sample: el?.textContent.slice(0, 40) ?? null,
  };
});
await page.screenshot({ path: ".scratch-diag/captures/warsh-diag/webkit-hafs-list.png" });
// Mushaf mode
await page.locator('button[aria-label*="Plus"], .mp-header-more').last().click().catch(() => {});
await page.waitForTimeout(300);
await page.locator(".mp-header-menu button").filter({ hasText: /^Mushaf$/ }).first().click().catch(() => {});
await page.waitForTimeout(2500);
await page.mouse.click(195, 820).catch(() => {});
await page.waitForTimeout(800);
await page.screenshot({ path: ".scratch-diag/captures/warsh-diag/webkit-hafs-mushaf.png" });
console.log(JSON.stringify(info));
await browser.close();
process.exit(0);
