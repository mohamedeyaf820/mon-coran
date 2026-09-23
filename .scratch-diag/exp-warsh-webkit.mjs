import { webkit } from "playwright";
import fs from "node:fs";
const BASE = "http://127.0.0.1:4173";
const OUT = ".scratch-diag/captures/warsh-diag";
fs.mkdirSync(OUT, { recursive: true });

const ctx = await webkit.newContext ? null : null;
const browser = await webkit.launch();
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
await page.goto(`${BASE}/surah/113`, { waitUntil: "domcontentloaded" });
if (await page.locator(".splash-screen").count()) {
  await page.locator(".splash-screen button", { hasText: /Passer|Skip/ }).first().click().catch(() => {});
  await page.waitForSelector(".splash-screen", { state: "detached", timeout: 10000 }).catch(() => {});
}
await page.waitForTimeout(1500);
await page.locator('button[aria-label*="Plus"], .mp-header-more').last().click().catch(() => {});
await page.waitForTimeout(400);
await page.locator(".mp-header-menu button").filter({ hasText: /^Liste$/ }).first().click().catch(() => {});
await page.mouse.click(195, 820).catch(() => {});
await page.waitForTimeout(600);
await page.locator('button[aria-label*="Plus"], .mp-header-more').last().click().catch(() => {});
await page.waitForTimeout(400);
await page.locator(".mp-header-menu button").filter({ hasText: /^Warsh$/ }).first().click().catch(() => {});
await page.waitForTimeout(3000);
await page.mouse.click(195, 820).catch(() => {});
await page.waitForTimeout(800);

// helper to measure ayah-1 layout stability
const measure = () => page.evaluate(() => {
  const el = document.querySelector(".qc-ayah-text-ar");
  const words = [...el.querySelectorAll("[data-tajwid-word]")];
  return {
    rects: words.map((w) => { const r = w.getBoundingClientRect(); return `${w.textContent.slice(0,6)}@${Math.round(r.x)},${Math.round(r.y)}w${Math.round(r.width)}h${Math.round(r.height)}`; }),
    containerH: Math.round(el.getBoundingClientRect().height),
  };
});

console.log("baseline(highlighted)", JSON.stringify(await measure()));
await page.screenshot({ path: `${OUT}/exp-0-baseline.png` });

// EXP A: remove all tajwid highlight ranges, force relayout
await page.evaluate(() => {
  for (const k of [...CSS.highlights.keys()]) if (k.startsWith("tajwid")) CSS.highlights.delete(k);
  const el = document.querySelector(".qc-ayah-text-ar");
  el.style.paddingBottom = "0.1px";
  void el.offsetHeight;
});
await page.waitForTimeout(500);
console.log("A: highlights removed", JSON.stringify(await measure()));
await page.screenshot({ path: `${OUT}/exp-a-nohighlights.png` });

// EXP B: replace word spans with plain text nodes (keep structure minimal)
await page.evaluate(() => {
  const root = document.querySelector(".quran-tajwid-text");
  const wordsEl = root.querySelector("[data-tajwid-words]");
  const text = [...wordsEl.querySelectorAll("[data-tajwid-word]")].map((w) => w.textContent).join(" ");
  wordsEl.textContent = text;
});
await page.waitForTimeout(500);
const b = await page.evaluate(() => { const el = document.querySelector(".qc-ayah-text-ar"); const r = el.getBoundingClientRect(); return `plain h${Math.round(r.height)}`; });
console.log("B: plain text node", b);
await page.screenshot({ path: `${OUT}/exp-b-plaintext.png` });

await browser.close();
process.exit(0);
