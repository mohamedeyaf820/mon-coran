import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://127.0.0.1:4173";
const OUT = ".scratch-diag/captures/markergap";
fs.mkdirSync(OUT, { recursive: true });

const PAGES = (process.argv[2] || "572").split(",");
const MARGINS = (process.argv[3] || "0.18,0.26,0.34").split(",").map(Number);
const SHOT = process.argv[4] === "shot";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

async function openFullscreen(p) {
  await page.goto(`${BASE}/page/${p}`, { waitUntil: "domcontentloaded" });
  const skip = page.locator(".splash-screen button", { hasText: /Passer|Skip|تخطّي/ });
  if (await skip.count()) {
    await skip.first().click().catch(() => {});
    await page.waitForSelector(".splash-screen", { state: "detached", timeout: 8000 }).catch(() => {});
  }
  await page.waitForSelector(".qc-ayah-text-ar, .mushaf-page-wrapper, .cpv-flow", { timeout: 20000 });
  await page.locator(".reader-fullscreen-trigger, .srh-fullscreen-btn, button[aria-label*='lein']").first().click();
  await page.waitForSelector(".mfp-portal-root .qcm-lines", { timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
  await page.evaluate(() => {
    if (!document.getElementById("probe-margin")) {
      const el = document.createElement("style");
      el.id = "probe-margin";
      document.head.append(el);
    }
  });
}

for (const p of PAGES) {
  await openFullscreen(p);
  const rows = [];
  for (const m of MARGINS) {
    const r = await page.evaluate(async ({ margin }) => {
      document.getElementById("probe-margin").textContent =
        `#root ~ .mfp-portal-root .mfp-book .qcm-line :is(.qcm-ayah-marker,.ayah-marker,.ayat-marker){margin-inline:${margin}em !important}`;
      await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
      const out = [];
      const lines = document.querySelectorAll(".mfp-portal-root .qcm-line");
      for (const line of lines) {
        const kids = Array.from(line.children);
        for (let i = 0; i < kids.length; i += 1) {
          if (!/marker/.test(kids[i].className)) continue;
          const b = kids[i].getBoundingClientRect();
          const prev = kids[i - 1]?.getBoundingClientRect();
          const next = kids[i + 1]?.getBoundingClientRect();
          // RTL flow: the previous item sits to the right, the next to the left.
          out.push({
            line: line.dataset.lineNumber,
            ayah: kids[i].dataset.ayahNumber,
            gapRight: prev ? Math.round(prev.left - b.right) : null,
            gapLeft: next ? Math.round(b.left - next.right) : null,
            w: Math.round(b.width),
          });
        }
      }
      const g = (k) => out.map((o) => o[k]).filter((v) => v != null);
      const min = (a) => (a.length ? Math.min(...a) : null);
      return { count: out.length, minRight: min(g("gapRight")), minLeft: min(g("gapLeft")), items: out };
    }, { margin: m });
    rows.push(
      `margin ${m}em → markers ${r.count} min-gap-toward-prev-word ${r.minRight}px min-gap-toward-next-word ${r.minLeft}px`,
    );
    if (SHOT && m === MARGINS[MARGINS.length - 1]) {
      const idx = MARGINS.indexOf(m);
      await page
        .locator(".mfp-portal-root .qcm-line", { has: page.locator("[class*='marker']") })
        .first()
        .screenshot({ path: `${OUT}/p${p}-m${String(MARGINS[idx]).replace(".", "")}-line.png` })
        .catch(() => {});
    }
  }
  console.log(`page ${p}\n  ${rows.join("\n  ")}`);
  if (SHOT) await page.screenshot({ path: `${OUT}/p${p}-full.png` });
}
await browser.close();
