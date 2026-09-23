// Scratch: compare computed styles of suspected dead-utility elements with tokens.
import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const KEY = "mushaf-plus-settings";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
await page.addInitScript((k) => localStorage.setItem(k, JSON.stringify({
  skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false,
  displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
  quranFontSize: 34, lang: "fr", theme: "light", lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } })), KEY);
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(1200);
const out = await page.evaluate(() => {
  const tk = getComputedStyle(document.documentElement);
  const tokens = {};
  for (const n of ["--text-secondary", "--text-primary", "--text-muted", "--border", "--bg-secondary", "--bg-tertiary", "--bg-card", "--bg-primary", "--primary"]) tokens[n] = tk.getPropertyValue(n).trim();
  const q = (sel) => { const e = document.querySelector(sel); if (!e) return "MISS"; const c = getComputedStyle(e); return { color: c.color, bg: c.backgroundColor, bt: c.borderTopWidth + " " + c.borderTopColor }; };
  return {
    tokens,
    subtitleP: q(".home-collection-heading__copy p"),
    tabJuz: q('[role="tab"]:nth-child(2)'),
    tabs: [...document.querySelectorAll('[role="tab"]')].map((e) => ({ t: e.innerText.trim().slice(0, 8), c: getComputedStyle(e).color })),
    group: q(".home-content-toolbar > div:first-child"),
    toolbar: q(".home-content-toolbar"),
    search: q(".home-content-toolbar input"),
    sortGroup: q(".home-content-toolbar > div:nth-child(3)"),
    all: [...document.querySelectorAll(".home-content-toolbar div")].map((e) => { const c = getComputedStyle(e); return { cls: (e.className || "").slice(0, 60), bg: c.backgroundColor, bd: c.borderTopWidth + " " + c.borderTopColor }; }).filter((r) => r.bd.startsWith("1px") || r.bg !== "rgba(0, 0, 0, 0)"),
  };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
