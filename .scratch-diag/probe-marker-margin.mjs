import { chromium } from "playwright";

const BASE = "http://127.0.0.1:4173";
const PAGES = (process.argv[2] || "572,2,36,55,67,78,93,377").split(",");
const MARGINS = (process.argv[3] || "0.18,0.24,0.3").split(",").map(Number);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.goto(`${BASE}/page/1`, { waitUntil: "domcontentloaded" });
const skip = page.locator(".splash-screen button", { hasText: /Passer|Skip|تخطّي/ });
if (await skip.count()) {
  await skip.first().click().catch(() => {});
  await page.waitForSelector(".splash-screen", { state: "detached", timeout: 8000 }).catch(() => {});
}
await page.waitForSelector(".qc-ayah-text-ar, .mushaf-page-wrapper, .cpv-flow", { timeout: 20000 });
await page.locator(".reader-fullscreen-trigger, .srh-fullscreen-btn, button[aria-label*='lein']").first().click();
await page.waitForSelector(".mfp-portal-root .qcm-lines", { timeout: 20000 });
await page.evaluate(() => document.fonts.ready);

const styleHandle = await page.evaluateHandle(() => {
  const s = document.createElement("style");
  s.id = "probe-margin";
  document.head.append(s);
  return s;
});

for (const p of PAGES) {
  await page.goto(`${BASE}/page/${p}`, { waitUntil: "domcontentloaded" });
  const s = page.locator(".splash-screen button", { hasText: /Passer|Skip|تخطّي/ });
  if (await s.count()) {
    await s.first().click().catch(() => {});
    await page.waitForSelector(".splash-screen", { state: "detached", timeout: 8000 }).catch(() => {});
  }
  await page.waitForSelector(".qc-ayah-text-ar, .mushaf-page-wrapper, .cpv-flow", { timeout: 20000 });
  await page.locator(".reader-fullscreen-trigger, .srh-fullscreen-btn, button[aria-label*='lein']").first().click();
  await page.waitForSelector(".mfp-portal-root .qcm-lines", { timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    if (!document.getElementById("probe-margin")) {
      const el = document.createElement("style");
      el.id = "probe-margin";
      document.head.append(el);
    }
  });
  const ready = await page.locator(".mfp-portal-root .qcm-line").count();
  if (!ready) { console.log(`page ${p}: no lines`); continue; }
  const rows = [];
  for (const m of MARGINS) {
    const r = await page.evaluate(async ({ margin, id }) => {
      document.getElementById(id).textContent =
        `#root ~ .mfp-portal-root .mfp-book .qcm-line :is(.qcm-ayah-marker,.ayah-marker,.ayat-marker){margin-inline:${margin}em !important}`;
      await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
      const linesBox = document.querySelector(".mfp-portal-root .qcm-lines");
      const frame = document.querySelector(".mfp-portal-root .qcm-page");
      const fb = frame.getBoundingClientRect();
      let worst = 0;
      let slack = Infinity;
      let overflowing = 0;
      let crossing = 0;
      for (const line of linesBox.querySelectorAll(".qcm-line")) {
        const kids = Array.from(line.children);
        if (!kids.length) continue;
        const left = Math.min(...kids.map((k) => k.getBoundingClientRect().left));
        const right = Math.max(...kids.map((k) => k.getBoundingClientRect().right));
        const width = line.getBoundingClientRect().width;
        const over = Math.round((right - left) - width);
        slack = Math.min(slack, Math.round(width - (right - left)));
        if (over > 0) overflowing += 1;
        worst = Math.max(worst, over);
        if (left < fb.left + 6 || right > fb.right - 6) crossing += 1;
      }
      return { lines: linesBox.querySelectorAll(".qcm-line").length, overflowing, worst, crossing, slack: Number.isFinite(slack) ? slack : -1 };
    }, { margin: m, id: "probe-margin" });
    rows.push(`margin ${m}em → over-lines ${r.overflowing}/${r.lines} worst ${r.worst}px crossing-frame ${r.crossing} tightest-slack ${r.slack}px`);
  }
  console.log(`page ${p}\n  ${rows.join("\n  ")}`);
}
await browser.close();
