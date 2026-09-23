import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://127.0.0.1:4173";
const OUT = ".scratch-diag/captures/marker572";
fs.mkdirSync(OUT, { recursive: true });

const pageParam = process.argv[2] || "572";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("pageerror", e.message));

await page.goto(`${BASE}/page/${pageParam}`, { waitUntil: "domcontentloaded" });
const skip = page.locator(".splash-screen button", { hasText: /Passer|Skip|تخطّي/ });
if (await skip.count()) {
  await skip.first().click().catch(() => {});
  await page.waitForSelector(".splash-screen", { state: "detached", timeout: 10000 }).catch(() => {});
}
await page.waitForSelector(".qcm-lines, .mushaf-page-wrapper, .qc-ayah-text-ar", { timeout: 20000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1500);

const trigger = page.locator(".reader-fullscreen-trigger, .srh-fullscreen-btn, button[aria-label*='lein']").first();
await trigger.click();
await page.waitForSelector(".mfp-portal-root", { timeout: 10000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/overlay.png` });

const report = await page.evaluate(() => {
  const cps = (s) => Array.from(s).map((c) => `U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`).join(" ");
  const lines = Array.from(document.querySelectorAll(".mfp-portal-root .qcm-line"));
  return lines.map((line) => {
    const items = Array.from(line.children).map((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        cls: el.className,
        ayah: el.dataset.ayahNumber,
        text: el.textContent.slice(0, 28),
        codepoints: cps(el.textContent).slice(0, 90),
        x: Math.round(r.x),
        right: Math.round(r.right),
        w: Math.round(r.width),
        h: Math.round(r.height),
        bg: cs.backgroundColor,
        color: cs.color,
        ff: cs.fontFamily.slice(0, 40),
        fs: cs.fontSize,
      };
    });
    return { line: line.dataset.lineNumber, count: items.length, first: items[0], last: items[items.length - 1], items };
  });
});

for (const line of report) {
  console.log(`\n=== line ${line.line} (${line.count} items) ===`);
  for (const it of line.items) {
    const marker = /marker/.test(it.cls) ? " <MARKER>" : "";
    console.log(
      `  ayah=${it.ayah ?? "-"} x=${it.x} r=${it.right} w=${it.w} h=${it.h} bg=${it.bg} color=${it.color} ff=${it.ff} fs=${it.fs}${marker}\n    "${it.text}" [${it.codepoints}]`,
    );
  }
}

// Gap analysis: distance between consecutive items on the same line, and where
// a marker sits relative to the ayah numbers around it.
const gaps = [];
for (const line of report) {
  for (let i = 1; i < line.items.length; i += 1) {
    const prev = line.items[i - 1];
    const cur = line.items[i];
    if (!/marker/.test(cur.cls) && !/marker/.test(prev.cls)) continue;
    gaps.push({
      line: line.line,
      marker: /marker/.test(cur.cls) ? cur : prev,
      neighbour: /marker/.test(cur.cls) ? prev : cur,
      gapPx: Math.round(Math.abs((/marker/.test(cur.cls) ? cur.x : prev.x) - (/marker/.test(cur.cls) ? prev.right : cur.right))),
    });
  }
}
console.log("\n=== marker gaps ===");
for (const g of gaps) {
  console.log(`line ${g.line}: marker ayah=${g.marker.ayah ?? "?"} "${g.marker.text.trim()}" gap-to-neighbour=${g.gapPx}px neighbourAyah=${g.neighbour.ayah ?? "?"}`);
}

const loaded = await page.evaluate(() =>
  Array.from(document.fonts).map((f) => `${f.family} ${f.status}`).filter((s) => /QPC|QCF|Uthmanic|Amiri|Scheherazade/i.test(s)),
);
console.log("\n=== fonts ===\n", loaded.join("\n"));
await browser.close();
