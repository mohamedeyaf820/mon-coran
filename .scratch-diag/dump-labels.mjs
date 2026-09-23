import { webkit } from "playwright";
const BASE = "http://127.0.0.1:4173";
const browser = await webkit.launch();
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
await page.goto(`${BASE}/surah/113`, { waitUntil: "domcontentloaded" });
if (await page.locator(".splash-screen").count()) {
  await page.locator(".splash-screen button", { hasText: /Passer|Skip/ }).first().click().catch(() => {});
  await page.waitForSelector(".splash-screen", { state: "detached", timeout: 10000 }).catch(() => {});
}
await page.waitForTimeout(2500);
const labels = await page.evaluate(() => [...document.querySelectorAll("button")].map((b) => b.getAttribute("aria-label") || b.title || b.textContent.trim().slice(0, 18)).filter(Boolean));
console.log(JSON.stringify(labels));
await browser.close();
process.exit(0);
