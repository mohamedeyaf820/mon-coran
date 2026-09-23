// Scratch: measure reciter hero ring + header "go to" popover. Not for commit.
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
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(1200);

const m = (sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return "MISS"; const c = getComputedStyle(e); return { color: c.color, bg: c.backgroundColor, bt: c.borderTopWidth + " " + c.borderTopColor }; }, sel);

// 1) Audio tab -> reciter sheet
await page.locator('[role="tab"]:has-text("Audio")').first().click();
await page.waitForTimeout(1500);
const card = page.locator(".qc-list-card, .reciter-card, [class*='reciter']").first();
console.log("audio view cards:", await page.locator("[class*='reciter']").count());
await page.screenshot({ path: ".scratch-diag/resp/rd-audio-tab.png" });
if (await card.count()) {
  await card.click().catch(() => {});
  await page.waitForTimeout(1800);
  console.log("hero avatar:", JSON.stringify(await m(".reciter-hero__avatar")));
  console.log("hero chip:", JSON.stringify(await m(".reciter-hero__meta span, .reciter-hero span")));
  await page.screenshot({ path: ".scratch-diag/resp/rd-reciter.png" });
}

// 2) Reader header popover
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1000);
await page.locator(".hp-card").first().click().catch(() => {});
await page.waitForTimeout(2500);
console.log("view:", await page.evaluate(() => document.querySelector(".app-root")?.dataset.view));
const trig = await page.evaluate(() => { const b = [...document.querySelectorAll(".mp-header button")].map((e) => e.getAttribute("aria-label") || e.textContent.trim().slice(0, 18)); return b; });
console.log("header buttons:", JSON.stringify(trig));
await page.screenshot({ path: ".scratch-diag/resp/rd-reader.png" });
await browser.close();
