import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://127.0.0.1:4173";
const OUT = ".scratch-diag/captures/marker572";
fs.mkdirSync(OUT, { recursive: true });
const pageParam = process.argv[2] || "572";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
const page = await ctx.newPage();
await page.goto(`${BASE}/page/${pageParam}`, { waitUntil: "domcontentloaded" });
const skip = page.locator(".splash-screen button", { hasText: /Passer|Skip|تخطّي/ });
if (await skip.count()) {
  await skip.first().click().catch(() => {});
  await page.waitForSelector(".splash-screen", { state: "detached", timeout: 10000 }).catch(() => {});
}
await page.waitForSelector(".mushaf-page-wrapper, .cpv-flow, .qc-ayah-text-ar", { timeout: 20000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1500);
await page.locator(".reader-fullscreen-trigger, .srh-fullscreen-btn, button[aria-label*='lein']").first().click();
await page.waitForSelector(".mfp-portal-root .qcm-lines", { timeout: 20000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(2500);

const dump = await page.evaluate(() => {
  const cps = (s) => Array.from(s).map((c) => `U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`).join(" ");
  const out = [];
  const lines = Array.from(document.querySelectorAll(".mfp-portal-root .qcm-line"));
  for (const line of lines) {
    const items = Array.from(line.children)
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .sort((a, b) => b.r.x - a.r.x); // reading order for RTL
    out.push({
      n: line.dataset.lineNumber,
      items: items.map(({ el, r }) => ({
        marker: /marker/.test(el.className),
        ayah: el.dataset.ayahNumber ?? null,
        txt: el.textContent,
        cps: cps(el.textContent),
        x: Math.round(r.x),
        w: Math.round(r.width),
        h: Math.round(r.height),
        ff: getComputedStyle(el).fontFamily.slice(0, 28),
        html: /marker/.test(el.className) ? el.outerHTML.slice(0, 260) : undefined,
      })),
    });
  }
  const latinDigitMarkers = out
    .flatMap((l) => l.items.filter((i) => i.marker).map((i) => ({ line: l.n, ...i })))
    .filter((i) => /[0-9]/.test(i.txt));
  return { out, latinDigitMarkers, allMarkers: out.flatMap((l) => l.items.filter((i) => i.marker).map((i) => ({ line: l.n, txt: i.txt, cps: i.cps, w: i.w, h: i.h, ff: i.ff }))) };
});

for (const line of dump.out.slice(0, Number(process.argv[3] || 6))) {
  console.log(`\n=== line ${line.n} (reading order) ===`);
  for (const it of line.items) {
    console.log(`  ${it.marker ? "MARKER" : `w${it.ayah}`} x=${it.x} w=${it.w} ff=${it.ff} [${it.cps}]`);
    if (it.html) console.log(`    ${it.html}`);
  }
}
console.log("\n=== markers with LATIN digits ===", JSON.stringify(dump.latinDigitMarkers, null, 1));
console.log("\n=== all markers ===");
for (const m of dump.allMarkers) console.log(`  line ${m.line}: [${m.cps}] w=${m.w} h=${m.h} ff=${m.ff}`);

// crop the first 6 lines for a visual look
const lines = page.locator(".mfp-portal-root .qcm-line");
for (let i = 1; i <= Number(process.argv[3] || 6); i += 1) {
  const loc = lines.nth(i - 1);
  if (await loc.count()) await loc.screenshot({ path: `${OUT}/line-${i}.png` }).catch(() => {});
}
await page.screenshot({ path: `${OUT}/overlay-${pageParam}.png` });
await browser.close();
