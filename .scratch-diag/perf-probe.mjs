// scratch: objective fluidity baseline — in-page scroll driver, vsync off, so each step's
// wall time is main-thread cost (script + style + layout + paint), not a 60Hz tick.
// Usage: node .scratch-diag/perf-probe.mjs [--views=read-mushaf,read-list] [--w=390] [--steps=25]
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const SETTINGS_KEY = "mushaf-plus-settings";
const argv = process.argv.slice(2).reduce((a, s) => {
  const m = s.match(/^--(\w+)=(.*)$/);
  if (m) a[m[1]] = m[2];
  return a;
}, {});
const W = Number(argv.w || 390);
const H = Number(argv.h || 780);
const STEPS = Number(argv.steps || 25);
const DIST = Number(argv.dist || 160);
const viewFilter = argv.views ? argv.views.split(",") : null;

const views = [
  { key: "read-mushaf", url: "/surah/2", ovr: { showHome: false, mushafLayout: "mushaf" }, wait: ".app-view-reading" },
  { key: "read-list", url: "/surah/2", ovr: { showHome: false, mushafLayout: "list" }, wait: ".qc-ayah-text-ar" },
  { key: "read-page", url: "/page/50", ovr: { showHome: false, displayMode: "page" }, wait: ".app-view-reading" },
  { key: "reciter-hub", url: "/", ovr: { showHome: true }, wait: '.home-content-toolbar [role="tab"]', tab: 2 },
  {
    key: "reciter-detail",
    url: "/",
    ovr: { showHome: true },
    wait: '.home-content-toolbar [role="tab"]',
    pre: [{ tab: 2 }, { wait: ".reciter-card__main" }, { click: ".reciter-card__main" }],
  },
];

// Finds the real scrolling box (the reader scrolls an inner element, not the window).
const DRIVER = (a) => {
  const scrollers = [...document.querySelectorAll("*")].filter((el) => {
    const cs = getComputedStyle(el);
    return (
      /(auto|scroll|overlay)/.test(cs.overflowY) &&
      el.scrollHeight > el.clientHeight + 80 &&
      el.clientHeight > 200
    );
  });
  scrollers.sort((x, y) => y.clientHeight * y.clientWidth - x.clientHeight * x.clientWidth);
  const el = scrollers[0] || document.scrollingElement;
  const box = el === document.scrollingElement ? window : el;
  const raf = () => new Promise((r) => requestAnimationFrame(() => r()));

  window.__p = { steps: [], long: [], node: 0, target: "", max: 0 };
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__p.long.push(Math.round(e.duration));
    }).observe({ entryTypes: ["longtask"] });
  } catch {}
  window.__p.target =
    el === document.scrollingElement
      ? "window"
      : `${el.tagName.toLowerCase()}.${String(el.className).split(" ").slice(0, 2).join(".")}`;
  window.__p.max = el.scrollHeight;
  window.__p.node = document.getElementsByTagName("*").length;

  return (async () => {
    for (let i = 0; i < a.steps; i++) {
      const t0 = performance.now();
      if (box === window) window.scrollBy(0, a.dist);
      else el.scrollTop += a.dist;
      await raf();
      await raf();
      window.__p.steps.push(+(performance.now() - t0).toFixed(1));
    }
    return { steps: window.__p.steps, long: window.__p.long, target: window.__p.target, node: window.__p.node, max: window.__p.max };
  })();
};

const browser = await chromium.launch({
  args: [
    "--disable-gpu-vsync",
    "--disable-frame-rate-limit",
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
  ],
});
const rows = [];

for (const view of views) {
  if (viewFilter && !viewFilter.includes(view.key)) continue;
  const ctx = await browser.newContext({ serviceWorkers: "block", viewport: { width: W, height: H } });
  await ctx.addInitScript(
    (a) => {
      window.localStorage.setItem(
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
      window.localStorage.setItem("mushaf-plus-onboarded", "1");
    },
    { key: SETTINGS_KEY, ovr: view.ovr },
  );
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 90)));

  await page.goto(BASE + view.url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector(view.wait, { timeout: 40000 }).catch(() => errors.push("wait:" + view.wait));
  if (view.tab != null) {
    await page.locator('.home-content-toolbar [role="tab"]').nth(view.tab).click().catch(() => {});
    await page.waitForTimeout(1500);
  }
  for (const step of view.pre || []) {
    if (step.tab != null) {
      await page.locator('.home-content-toolbar [role="tab"]').nth(step.tab).click().catch(() => {});
      await page.waitForTimeout(1500);
    }
    if (step.wait) await page.waitForSelector(step.wait, { timeout: 15000 }).catch(() => {});
    if (step.click) await page.locator(step.click).first().click().catch(() => {});
    await page.waitForTimeout(1200);
  }
  await page.waitForTimeout(3000);

  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Performance.enable");
  const m0 = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((x) => [x.name, x.value]));
  const res = await page.evaluate(DRIVER, { steps: STEPS, dist: DIST });
  const m1 = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((x) => [x.name, x.value]));
  await ctx.close();

  const f = [...res.steps].sort((a, b) => a - b);
  const pct = (p) => (f.length ? f[Math.min(f.length - 1, Math.floor((p / 100) * f.length))] : 0);
  rows.push({
    view: view.key,
    scroller: res.target,
    avg: +(res.steps.reduce((a, b) => a + b, 0) / res.steps.length).toFixed(1),
    p50: pct(50),
    p95: pct(95),
    worst: f.at(-1),
    bad: res.steps.filter((x) => x > 24).length,
    long: res.long.length,
    longMs: res.long.reduce((a, b) => a + b, 0),
    taskMs: +((m1.TaskDuration - m0.TaskDuration) * 1000).toFixed(0),
    scriptMs: +((m1.ScriptDuration - m0.ScriptDuration) * 1000).toFixed(0),
    styleMs: +((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000).toFixed(0),
    layoutMs: +((m1.LayoutDuration - m0.LayoutDuration) * 1000).toFixed(0),
    recalc: Math.round(m1.RecalcStyleCount - m0.RecalcStyleCount),
    layout: Math.round(m1.LayoutCount - m0.LayoutCount),
    nodes: res.node,
    h: res.max,
    errors: errors.length ? [...new Set(errors)].slice(0, 4) : [],
  });
}

console.log(`viewport ${W}x${H} · ${STEPS} steps × ${DIST}px · vsync off`);
console.table(rows);
await browser.close();
