import { webkit } from "playwright";
const BASE = "http://127.0.0.1:4173";
const browser = await webkit.launch();
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
await page.goto(`${BASE}/surah/113`, { waitUntil: "domcontentloaded" });
if (await page.locator(".splash-screen").count()) {
  await page.locator(".splash-screen button", { hasText: /Passer|Skip/ }).first().click().catch(() => {});
  await page.waitForSelector(".splash-screen", { state: "detached", timeout: 10000 }).catch(() => {});
}
await page.waitForTimeout(2000);
await page.locator('button[aria-label*="Plus"], .mp-header-more').last().click().catch(() => {});
await page.waitForTimeout(400);
await page.locator(".mp-header-menu button").filter({ hasText: /^Warsh$/ }).first().click().catch(() => {});
await page.waitForTimeout(2500);
await page.mouse.click(195, 820).catch(() => {});
await page.waitForTimeout(600);
const labels = await page.evaluate(() => [...document.querySelectorAll("button")].map((b) => b.getAttribute("aria-label")).filter(Boolean));
console.log(JSON.stringify(labels));
await browser.close();
process.exit(0);
