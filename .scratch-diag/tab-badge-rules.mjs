// Scratch: which rules match the Audio-tab dot. Not for commit.
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
  const btn = [...document.querySelectorAll('button[role="tab"]')].find((b) => /Audio/.test(b.innerText));
  const badge = btn.querySelector("span[aria-hidden]");
  const hits = [];
  const sheets = [...document.styleSheets].map((s) => ({ s, href: (s.href || "inline").split("/").pop() }));
  for (const { s, href } of sheets) {
    let rules; try { rules = s.cssRules; } catch { continue; }
    const walk = (list, media) => {
      for (const rule of list) {
        if (rule.cssRules && !rule.selectorText) { walk(rule.cssRules, rule.conditionText || media); continue; }
        if (!rule.selectorText) continue;
        let m = false; try { m = badge.matches(rule.selectorText); } catch { m = false; }
        if (m && /background|opacity|display|width|height/.test(rule.style?.cssText || "")) hits.push(`${href} :: ${rule.selectorText} {${rule.style.cssText.slice(0, 110)}}${media ? ` @${media}` : ""}`);
      }
    };
    walk(rules, null);
  }
  return { cls: badge.className, hits, sheets: sheets.map((x) => x.href).join(" ") };
});
console.log("badge class:", r.cls);
console.log("sheets:", r.sheets);
for (const h of r.hits) console.log("  " + h);
await browser.close();
