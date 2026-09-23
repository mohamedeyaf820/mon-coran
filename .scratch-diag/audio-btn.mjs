// Scratch: identify the clipped "Audio" button on the home page. Not for commit.
import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const KEY = "mushaf-plus-settings";
const browser = await chromium.launch();
for (const w of [768, 1024, 1440]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 1000 } });
  const page = await ctx.newPage();
  await page.addInitScript((k) => localStorage.setItem(k, JSON.stringify({
    skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false,
    displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
    quranFontSize: 34, lang: "fr", theme: "light", lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } })), KEY);
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => {
    const out = [];
    for (const b of document.querySelectorAll("button")) {
      if (Math.abs(b.clientWidth - b.scrollWidth) < 3) continue;
      const cs = getComputedStyle(b);
      const parent = b.parentElement, pcs = getComputedStyle(parent);
      out.push({
        cls: b.className.toString().slice(0, 90), txt: b.innerText.trim().slice(0, 24),
        cw: b.clientWidth, sw: b.scrollWidth, w: +b.getBoundingClientRect().width.toFixed(1),
        h: +b.getBoundingClientRect().height.toFixed(1), ov: cs.overflow, ws: cs.whiteSpace,
        pad: cs.paddingInline, gap: cs.gap, disp: cs.display,
        kid: [...b.children].map((c) => `${c.tagName.toLowerCase()}.${(c.className||'').toString().split(' ').slice(0,3).join('.')}:${Math.round(c.getBoundingClientRect().width)}${c.scrollWidth>c.clientWidth?'CLIP':''}`).join(" , "),
        par: `${parent.tagName.toLowerCase()}.${(parent.className||'').toString().slice(0,60)} ov=${pcs.overflow} w=${Math.round(parent.getBoundingClientRect().width)}`,
      });
    }
    return out;
  });
  console.log(`\n### ${w}px`);
  for (const o of r) console.log(JSON.stringify(o, null, 1));
  await ctx.close();
}
await browser.close();
