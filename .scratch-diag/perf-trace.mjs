// scratch: Chrome trace of a scripted scroll — aggregates devtools.timeline events so the
// cost shows up as UpdateLayoutTree / Layout / Paint / styleRecalc element counts.
// Usage: node .scratch-diag/perf-trace.mjs <view> [--w=390] [--steps=25] [--label=after]
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://127.0.0.1:4294";
const SETTINGS_KEY = "mushaf-plus-settings";
const view = process.argv[2] || "read-list";
const argv = process.argv.slice(3).reduce((a, s) => {
  const m = s.match(/^--(\w+)=(.*)$/);
  if (m) a[m[1]] = m[2];
  return a;
}, {});
const W = Number(argv.w || 390);
const H = Number(argv.h || 780);
const STEPS = Number(argv.steps || 25);
const DIST = Number(argv.dist || 160);
const LABEL = argv.label || "";
const OVERRIDE = argv.css || "";

const VIEWS = {
  "read-list": { url: "/surah/2", ovr: { showHome: false, mushafLayout: "list" }, wait: ".qc-ayah-text-ar", sel: ".app-main" },
  "read-mushaf": { url: "/surah/2", ovr: { showHome: false, mushafLayout: "mushaf" }, wait: ".app-view-reading", sel: ".app-main" },
  "read-page": { url: "/page/50", ovr: { showHome: false, displayMode: "page" }, wait: ".app-view-reading", sel: ".app-main" },
  "reciter-hub": { url: "/", ovr: { showHome: true }, wait: '.home-content-toolbar [role="tab"]', tab: 2, sel: ".app-main" },
  "reciter-detail": {
    url: "/",
    ovr: { showHome: true },
    wait: '.home-content-toolbar [role="tab"]',
    pre: [{ tab: 2 }, { wait: ".reciter-card__main" }, { click: ".reciter-card__main" }],
    sel: ".rd-scrollable-body",
  },
  fullscreen: {
    url: "/surah/2",
    ovr: { showHome: false, mushafLayout: "mushaf" },
    wait: ".app-view-reading",
    btn: ".srh-fullscreen-btn, .reader-fullscreen-trigger",
    sel: ".mfp-book",
  },
};

const SCROLL = (a) => {
  const el = document.querySelector(a.sel) || document.scrollingElement;
  const isWin = el === document.scrollingElement;
  const raf = () => new Promise((r) => requestAnimationFrame(() => r()));
  return (async () => {
    const steps = [];
    for (let i = 0; i < a.steps; i++) {
      const t0 = performance.now();
      if (isWin) window.scrollBy(0, a.dist);
      else el.scrollTop += a.dist;
      await raf();
      await raf();
      steps.push(+(performance.now() - t0).toFixed(1));
    }
    return steps;
  })();
};

const v = VIEWS[view];
const browser = await chromium.launch({
  args: ["--disable-gpu-vsync", "--disable-frame-rate-limit", "--disable-renderer-backgrounding"],
});
const ctx = await browser.newContext({ serviceWorkers: "block", viewport: { width: W, height: H } });
await ctx.addInitScript(
  (a) => {
    localStorage.setItem(
      a.key,
      JSON.stringify({
        skipSplashAnimation: true,
        showHome: true,
        sidebarOpen: false,
        homeSection: "surah",
        riwaya: "hafs",
        fontFamily: "qpc-hafs",
        lang: "fr",
        theme: "light",
        ...a.ovr,
      }),
    );
    localStorage.setItem("mushaf-plus-onboarded", "1");
  },
  { key: SETTINGS_KEY, ovr: v.ovr },
);
const page = await ctx.newPage();
await page.goto(BASE + v.url, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForSelector(v.wait, { timeout: 40000 }).catch(() => {});
if (v.tab != null) {
  await page.locator('.home-content-toolbar [role="tab"]').nth(v.tab).click().catch(() => {});
  await page.waitForTimeout(1500);
}
for (const s of v.pre || []) {
  if (s.tab != null) {
    await page.locator('.home-content-toolbar [role="tab"]').nth(s.tab).click().catch(() => {});
    await page.waitForTimeout(1500);
  }
  if (s.wait) await page.waitForSelector(s.wait, { timeout: 20000 }).catch(() => {});
  if (s.click) await page.locator(s.click).first().click().catch(() => {});
  await page.waitForTimeout(1300);
}
if (v.btn) {
  await page.locator(v.btn).first().click().catch(() => {});
  await page.waitForTimeout(3500);
}
await page.waitForTimeout(2500);
if (OVERRIDE) await page.addStyleTag({ content: OVERRIDE });
await page.waitForTimeout(800);

const cdp = await ctx.newCDPSession(page);
const events = [];
cdp.on("Tracing.dataCollected", ({ value }) => events.push(...value));

await cdp.send("Tracing.start", {
  transferMode: "ReportEvents",
  traceConfig: {
    recordMode: "recordAsMuchAsPossible",
    includedCategories: ["devtools.timeline", "disabled-by-default-devtools.timeline", "blink", "cc"],
  },
});
const steps = await page.evaluate(SCROLL, { steps: STEPS, dist: DIST, sel: v.sel });
await cdp.send("Tracing.end");
await new Promise((r) => setTimeout(r, 1500));
await ctx.close();
await browser.close();

const fns = new Map();
const agg = new Map();
let largestRecalc = 0;
let recalcElements = 0;
for (const e of events) {
  if (e.ph !== "X" || !e.dur) continue;
  if (!["UpdateLayoutTree", "Layout", "Paint", "PrePaint", "CompositeLayers", "FunctionCall", "EvaluateScript", "TimerFire", "FireAnimationFrame", "ParseAuthorStyleSheet", "HitTest", "Commit", "RasterTask", "PaintImage"].includes(e.name)) continue;
  const a = agg.get(e.name) || { n: 0, ms: 0, max: 0 };
  a.n += 1;
  a.ms += e.dur / 1000;
  a.max = Math.max(a.max, e.dur / 1000);
  agg.set(e.name, a);
  if (e.name === "FunctionCall" || e.name === "TimerFire" || e.name === "FireAnimationFrame") {
    const d = e.args?.data || {};
    const who = [d.fnName || d.type || e.name, d.url ? String(d.url).split("/").pop() + ":" + (d.lineNumber ?? "") : ""].filter(Boolean).join(" ");
    const a = fns.get(who) || { n: 0, ms: 0, max: 0 };
    a.n += 1;
    a.ms += e.dur / 1000;
    a.max = Math.max(a.max, e.dur / 1000);
    fns.set(who, a);
  }
  if (e.name === "UpdateLayoutTree") {
    const c = e.args?.data?.elementCount || 0;
    recalcElements += c;
    largestRecalc = Math.max(largestRecalc, c);
  }
}
const rows = [...agg.entries()]
  .map(([name, a]) => ({ event: name, calls: a.n, ms: +a.ms.toFixed(0), maxMs: +a.max.toFixed(1) }))
  .sort((x, y) => y.ms - x.ms)
  .slice(0, 12);
const f = [...steps].sort((a, b) => a - b);
console.log(
  `${view} ${LABEL} @${W}x${H} · avg ${(steps.reduce((a, b) => a + b, 0) / steps.length).toFixed(1)}ms · p95 ${f[Math.floor(0.95 * (f.length - 1))]}ms · worst ${f.at(-1)}ms · styleRecalcElements=${recalcElements} largest=${largestRecalc}`,
);
console.table(rows);
const top = [...fns.entries()].sort((a, b) => b[1].ms - a[1].ms).slice(0, 10);
console.table(
  top.map(([who, a]) => ({
    callback: who,
    calls: a.n,
    ms: +a.ms.toFixed(0),
    maxMs: +a.max.toFixed(1),
  })),
);
