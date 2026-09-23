// Scratch: locate the .bg-primary rule in the loaded sheets. Not for commit.
import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const KEY = "mushaf-plus-settings";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 1000 } });
const page = await ctx.newPage();
await page.addInitScript((k) => localStorage.setItem(k, JSON.stringify({
  skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false,
  displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
  quranFontSize: 34, lang: "fr", theme: "light", lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } })), KEY);
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(900);
const r = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll(".bg-primary").forEach((e) => out.push(`used-by: ${e.tagName.toLowerCase()}.${e.className.toString().slice(0, 50)} bg=${getComputedStyle(e).backgroundColor}`));
  const rules = [];
  for (const s of document.styleSheets) {
    const href = (s.href || "inline").split("/").pop();
    let list; try { list = s.cssRules; } catch (e) { rules.push(`${href}: BLOCKED ${e.name}`); continue; }
    let n = list.length, found = 0;
    const walk = (l) => { for (const r of l) { if (r.selectorText && /(^|,)\s*\.bg-primary(\s*,|$|:|\.|\[)/.test(r.selectorText + ",")) { found++; rules.push(`${href} :: ${r.selectorText.slice(0, 80)} {${r.style.cssText.slice(0, 80)}}`); } if (r.cssRules) walk(r.cssRules); } };
    walk(list);
    rules.push(`${href}: topRules=${n} bgPrimaryHits=${found}`);
  }
  return { out, rules };
});
console.log(r.out.join("\n"));
console.log(r.rules.join("\n"));
await browser.close();
