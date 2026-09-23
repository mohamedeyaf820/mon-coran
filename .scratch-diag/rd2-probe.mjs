// Scratch: measure the reader title popover and the reciter detail hero. Not for commit.
import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const KEY = "mushaf-plus-settings";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.addInitScript((k) => localStorage.setItem(k, JSON.stringify({
  skipSplashAnimation: true, showHome: false, showDuas: false, sidebarOpen: false,
  displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
  quranFontSize: 34, lang: "fr", theme: "light", lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } })), KEY);
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(2000);

const m = (sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return "MISS"; const c = getComputedStyle(e); return { color: c.color, bg: c.backgroundColor, bt: c.borderTopWidth + " " + c.borderTopColor }; }, sel);

console.log("view:", await page.evaluate(() => document.querySelector(".app-root")?.dataset.view));
await page.locator(".mp-header__title-btn").first().click();
await page.waitForTimeout(900);
console.log("popover:", JSON.stringify(await m('[role="dialog"], .popover-content, [data-slot="popover-content"]')));
console.log("goto input:", JSON.stringify(await m("#header-goto-input")));
await page.screenshot({ path: ".scratch-diag/resp/rd-popover.png" });
await page.keyboard.press("Escape");

// reciter detail
await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("mushaf-plus-settings")); s.showHome = true; s.displayMode = "surah"; localStorage.setItem("mushaf-plus-settings", JSON.stringify(s)); });
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1600);
await page.locator('[role="tab"]:has-text("Audio")').first().click();
await page.waitForTimeout(1800);
const info = await page.evaluate(() => {
  const cands = [...document.querySelectorAll("button, a")].filter((e) => /récitateur|reciter/i.test(e.textContent || "") === false && e.querySelector("img"));
  const el = cands[0];
  return { n: cands.length, cls: el ? String(el.className).slice(0, 70) : null, txt: el ? el.textContent.trim().slice(0, 30) : null };
});
console.log("reciter buttons:", JSON.stringify(info));
if (info.cls !== null) {
  await page.locator("button").filter({ has: page.locator("img") }).first().click().catch((e) => console.log("click fail"));
  await page.waitForTimeout(2200);
  console.log("avatar:", JSON.stringify(await m(".reciter-hero__avatar")));
  console.log("chip:", JSON.stringify(await m(".reciter-hero__meta span")));
  await page.screenshot({ path: ".scratch-diag/resp/rd-reciter2.png" });
}
await browser.close();
