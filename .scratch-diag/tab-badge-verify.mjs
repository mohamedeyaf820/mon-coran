// Scratch: verify the Audio-tab badge is no longer clipped. Not for commit.
import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const KEY = "mushaf-plus-settings";
const browser = await chromium.launch();
for (const w of [390, 640, 768, 1024, 1440, 1920]) {
  for (const lang of ["fr", "ar"]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 1000 } });
    const page = await ctx.newPage();
    await page.addInitScript((a) => localStorage.setItem(a.k, JSON.stringify({
      skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false,
      displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
      quranFontSize: 34, lang: a.lang, theme: "light", lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } })), { k: KEY, lang });
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(600);
    const r = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button[role="tab"]')].find((b) => /Audio|الصوتيات/.test(b.innerText));
      const de = document.documentElement;
      if (!btn) return { missing: true, ox: de.scrollWidth - de.clientWidth };
      const badge = btn.querySelector("span[aria-hidden]");
      const br = btn.getBoundingClientRect();
      const gr = badge ? badge.getBoundingClientRect() : null;
      const list = btn.closest('[role="tablist"]')?.getBoundingClientRect();
      return {
        ov: getComputedStyle(btn).overflow, cut: btn.scrollWidth - btn.clientWidth,
        badge: gr ? { past: +(gr.right - br.right).toFixed(1), above: +(br.top - gr.top).toFixed(1), w: +gr.width.toFixed(1) } : null,
        bleed: list ? +(gr ? gr.right - list.right : 0).toFixed(1) : null,
        ox: de.scrollWidth - de.clientWidth,
        tabs: [...document.querySelectorAll('button[role="tab"]')].map((b) => `${b.innerText.trim().slice(0, 7)}:${Math.round(b.getBoundingClientRect().width)}x${Math.round(b.getBoundingClientRect().height)}`).join(" "),
      };
    });
    console.log(`${w}px ${lang} ${JSON.stringify(r)}`);
    if (w === 1024 && lang === "fr") {
      const btn = await page.$('button[role="tab"]:has-text("Audio")');
      const box = await btn.boundingBox();
      await page.screenshot({ path: ".scratch-diag/resp/tab-badge-1024.png", clip: { x: box.x - 14, y: box.y - 12, width: box.width + 30, height: box.height + 24 } });
    }
    await ctx.close();
  }
}
await browser.close();
