import { chromium } from "playwright";

const BASE = "http://127.0.0.1:4173";
const P = process.argv[2] || "572";
const M = Number(process.argv[3] || 0.18);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(`${BASE}/page/${P}`, { waitUntil: "domcontentloaded" });
const skip = page.locator(".splash-screen button", { hasText: /Passer|Skip|تخطّي/ });
if (await skip.count()) {
  await skip.first().click().catch(() => {});
  await page.waitForSelector(".splash-screen", { state: "detached", timeout: 8000 }).catch(() => {});
}
await page.waitForSelector(".mushaf-page-wrapper, .qc-ayah-text-ar", { timeout: 20000 });
await page.locator(".reader-fullscreen-trigger, .srh-fullscreen-btn, button[aria-label*='lein']").first().click();
await page.waitForSelector(".mfp-portal-root .qcm-lines", { timeout: 20000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1200);

const r = await page.evaluate(async ({ margin }) => {
  const s = document.createElement("style");
  s.textContent = `#root ~ .mfp-portal-root .mfp-book .qcm-line :is(.qcm-ayah-marker,.ayah-marker,.ayat-marker){margin-inline:${margin}em !important}`;
  document.head.append(s);
  await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
  const wordGaps = [];
  const markerGaps = [];
  let markerFont = null;
  let wordFont = null;
  for (const line of document.querySelectorAll(".mfp-portal-root .qcm-line")) {
    const kids = Array.from(line.children);
    for (let i = 1; i < kids.length; i += 1) {
      const a = kids[i - 1].getBoundingClientRect();
      const b = kids[i].getBoundingClientRect();
      const gap = Math.round(a.left - b.right);
      const isMarker = (el) => /marker/.test(el.className);
      if (isMarker(kids[i]) || isMarker(kids[i - 1])) markerGaps.push(gap);
      else wordGaps.push(gap);
    }
    const m = line.querySelector(":is(.qcm-ayah-marker,.ayah-marker,.ayat-marker)");
    if (m && !markerFont) {
      const cs = getComputedStyle(m);
      const bb = m.getBoundingClientRect();
      markerFont = { ff: cs.fontFamily, fs: cs.fontSize, w: Math.round(bb.width), h: Math.round(bb.height), pad: cs.padding, mw: cs.minWidth };
    }
    const w = line.querySelector(".qcm-word");
    if (w && !wordFont) {
      const cs = getComputedStyle(w);
      const bb = w.getBoundingClientRect();
      wordFont = { ff: cs.fontFamily.slice(0, 30), fs: cs.fontSize, w: Math.round(bb.width), h: Math.round(bb.height) };
    }
  }
  const stat = (a) => {
    if (!a.length) return null;
    const s = [...a].sort((x, y) => x - y);
    return { n: s.length, min: s[0], p25: s[Math.floor(s.length * 0.25)], med: s[Math.floor(s.length / 2)], max: s[s.length - 1] };
  };
  return { wordGaps: stat(wordGaps), markerGaps: stat(markerGaps), markerFont, wordFont };
}, { margin: M });

console.log(JSON.stringify(r, null, 1));
await browser.close();
