// scratch: A/B fluidity — same surface, one CSS override per case, vsync off so the
// per-step wall time is real total cost (script + style + layout + paint).
// Usage: node .scratch-diag/perf-ab.mjs --view=reciter-detail [--w=390] [--steps=25]
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://127.0.0.1:4294";
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
const VIEW = argv.view || "reciter-detail";

const VIEWS = {
  "glass-home": {
    url: "/",
    ovr: { showHome: true },
    wait: ".hp-card",
    sel: ".app-main",
  },
  "reciter-detail": {
    url: "/",
    ovr: { showHome: true },
    wait: '.home-content-toolbar [role="tab"]',
    pre: [{ tab: 2 }, { wait: ".reciter-card__main" }, { click: ".reciter-card__main" }, { wait: ".reciter-detail" }],
    sel: ".rd-scrollable-body",
  },
  "read-page": {
    url: "/page/50",
    ovr: { showHome: false, displayMode: "page" },
    wait: ".app-view-reading",
    sel: ".app-main",
  },
  "read-list": {
    url: "/surah/2",
    ovr: { showHome: false, mushafLayout: "list" },
    wait: ".qc-ayah-text-ar",
    sel: ".app-main",
  },
  "read-mushaf": {
    url: "/surah/2",
    ovr: { showHome: false, mushafLayout: "mushaf" },
    wait: ".app-view-reading",
    sel: ".app-main",
  },
};

// Named overrides per surface: each entry is a CSS blob applied at runtime, so the
// number tells me which layer is actually costing the frames.
const CASES = {
  "reciter-detail": [
    ["baseline", ""],
    ["hero-bg off", ".rd-hero-bg{display:none!important}"],
    ["list rows no transition", ".rd-scrollable-body *{transition:none!important}"],
    ["no word/mark highlight anim", ".rd-scrollable-body .surah-reci-row{will-change:auto}"],
  ],
  "glass-home": [
    ["baseline", ""],
    ["mp-header backdrop off", ".mp-header{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}"],
    ["player backdrop off", ".mp-audio-player{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}"],
    ["home shell backdrop off", ".app-view-home{backdrop-filter:none!important}"],
    ["header+player off", ".mp-header,.mp-audio-player{backdrop-filter:none!important}"],
  ],
  "read-page": [
    ["baseline", ""],
    ["header backdrop off", ".mp-header{backdrop-filter:none!important}"],
    ["deck backdrop off", ".reader-control-deck{backdrop-filter:none!important}"],
    ["sheet shadow off", ".mfp-page,.qcm-page,.quran-mode-pane--mushaf .cpv-sheet{box-shadow:none!important}"],
  ],
  "read-list": [
    ["baseline", ""],
    ["header backdrop off", ".mp-header{backdrop-filter:none!important}"],
    ["player backdrop off", ".mp-audio-player{backdrop-filter:none!important}"],
    ["no transitions in list", ".qc-ayah-text-ar,.ayah-block,.verse-list-card{transition:none!important}"],
  ],
  "read-mushaf": [
    ["baseline", ""],
    ["header backdrop off", ".mp-header{backdrop-filter:none!important}"],
    ["sheet shadow off", ".qcm-lines,.mfp-page{box-shadow:none!important}"],
  ],
};

const DRIVER = (a) => {
  const pick = () => {
    if (a.sel) {
      const el = document.querySelector(a.sel);
      if (el) return el;
    }
    const scrollers = [...document.querySelectorAll("*")].filter((el) => {
      const cs = getComputedStyle(el);
      return /(auto|scroll|overlay)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 80 && el.clientHeight > 200;
    });
    scrollers.sort((x, y) => y.clientHeight * y.clientWidth - x.clientHeight * x.clientWidth);
    return scrollers[0] || document.scrollingElement;
  };
  const el = pick();
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
    return { steps, target: isWin ? "window" : el.className.toString().slice(0, 40) };
  })();
};

const browser = await chromium.launch({
  args: ["--disable-gpu-vsync", "--disable-frame-rate-limit", "--disable-renderer-backgrounding"],
});
const view = VIEWS[VIEW];
const rows = [];

for (const [name, css] of CASES[VIEW] || []) {
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
  await page.goto(BASE + view.url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector(view.wait, { timeout: 40000 }).catch(() => {});
  for (const step of view.pre || []) {
    if (step.tab != null) {
      await page.locator('.home-content-toolbar [role="tab"]').nth(step.tab).click().catch(() => {});
      await page.waitForTimeout(1400);
    }
    if (step.wait) await page.waitForSelector(step.wait, { timeout: 15000 }).catch(() => {});
    if (step.click) await page.locator(step.click).first().click().catch(() => {});
    await page.waitForTimeout(1100);
  }
  await page.waitForTimeout(2500);
  if (css) await page.addStyleTag({ content: css });
  await page.waitForTimeout(600);

  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Performance.enable");
  const m0 = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((x) => [x.name, x.value]));
  const res = await page.evaluate(DRIVER, { steps: STEPS, dist: DIST, sel: view.sel });
  const m1 = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((x) => [x.name, x.value]));
  await ctx.close();

  const f = [...res.steps].sort((a, b) => a - b);
  rows.push({
    case: name,
    avg: +(res.steps.reduce((a, b) => a + b, 0) / res.steps.length).toFixed(1),
    p95: f[Math.floor(0.95 * (f.length - 1))],
    worst: f.at(-1),
    bad: res.steps.filter((x) => x > 24).length,
    taskMs: +((m1.TaskDuration - m0.TaskDuration) * 1000).toFixed(0),
    styleMs: +((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000).toFixed(0),
    layoutMs: +((m1.LayoutDuration - m0.LayoutDuration) * 1000).toFixed(0),
    scroller: res.target,
  });
  console.log("·", name, "done");
}
console.log(`A/B ${VIEW} @ ${W}x${H} · ${STEPS} steps × ${DIST}px`);
console.table(rows);
await browser.close();
