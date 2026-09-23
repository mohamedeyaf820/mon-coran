// Scratch: which CSS rule sets overflow:hidden on the Audio tab button. Not for commit.
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
await page.waitForTimeout(700);
const r = await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button[role="tab"]')].find((b) => /Audio|الصوتيات/.test(b.innerText));
  if (!btn) return { missing: true };
  const hits = [];
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch { continue; }
    const walk = (list, media) => {
      for (const rule of list) {
        if (rule.cssRules && !(rule.selectorText)) { walk(rule.cssRules, rule.conditionText || media); continue; }
        if (!rule.selectorText) continue;
        let m = false;
        try { m = btn.matches(rule.selectorText); } catch { m = false; }
        if (m && /overflow/.test(rule.style?.cssText || "")) hits.push({ sel: rule.selectorText, css: rule.style.cssText.match(/[^;]*overflow[^;]*/g), media: media || null, href: (sheet.href || "inline").split("/").pop() });
      }
    };
    walk(rules, null);
  }
  const badge = btn.querySelector("span[aria-hidden]");
  return {
    hits,
    btn: { w: +btn.getBoundingClientRect().width.toFixed(1), sw: btn.scrollWidth, cw: btn.clientWidth },
    badge: badge ? { exists: true, r: badge.getBoundingClientRect().toJSON(), ov: getComputedStyle(badge).overflow } : { exists: false },
    visible: btn.innerText.trim(),
  };
});
console.log(JSON.stringify(r, null, 1));
await page.screenshot({ path: ".scratch-diag/resp/audiotab-1024.png", clip: { x: 380, y: 0, width: 640, height: 260 } });
await browser.close();
