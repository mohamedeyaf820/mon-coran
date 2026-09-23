// Scratch: measure the reader title popover + reciter hero via UI clicks. Not for commit.
import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const KEY = "mushaf-plus-settings";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.addInitScript((k) => localStorage.setItem(k, JSON.stringify({
  skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false,
  displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
  quranFontSize: 34, lang: "fr", theme: "light", lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } })), KEY);
const boot = async () => {
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1600);
};
const m = (sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return "MISS"; const c = getComputedStyle(e); return { color: c.color, bg: c.backgroundColor, bt: c.borderTopWidth + " " + c.borderTopColor }; }, sel);

await boot();
await page.locator(".hp-card").first().click();
await page.waitForTimeout(2500);
const title = page.locator('button[aria-label*="Al-Fatiha"], .mp-header__title-btn').first();
await title.click().catch((e) => console.log("title click fail"));
await page.waitForTimeout(900);
console.log("popover:", JSON.stringify(await m('[role="dialog"]')));
console.log("goto input:", JSON.stringify(await m("#header-goto-input")));
await page.screenshot({ path: ".scratch-diag/resp/rd-popover.png" });
await page.keyboard.press("Escape");
await page.waitForTimeout(500);

await boot();
await page.locator('[role="tab"]:has-text("Audio")').first().click();
await page.waitForTimeout(2000);
const btns = page.locator('button:has(img), a:has(img)');
console.log("img buttons:", await btns.count());
if (await btns.count()) {
  await btns.first().click().catch(() => console.log("click fail"));
  await page.waitForTimeout(2500);
  console.log("view:", await page.evaluate(() => document.querySelector(".app-root")?.dataset.view));
  console.log("avatar:", JSON.stringify(await m(".reciter-hero__avatar")));
  console.log("hero chip:", JSON.stringify(await m(".reciter-hero span")));
  await page.screenshot({ path: ".scratch-diag/resp/rd-reciter2.png" });
}
await browser.close();
