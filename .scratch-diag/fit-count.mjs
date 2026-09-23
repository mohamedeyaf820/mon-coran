// scratch: count how many times the mushaf fit gets rewritten during a scroll,
// and how many React re-renders that costs. Lower is better; a cached sheet
// should settle after one pass.
import { chromium } from "@playwright/test";

const PORTS = [4294, 4295];
const STEPS = 24;
const DIST = 160;

const WATCH = (a) => {
  let writes = 0;
  let mounts = 0;
  const seen = new Set();
  const obs = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === "attributes" && r.attributeName === "style") {
        const v = r.target.style.getPropertyValue("--qcm-flow-fit");
        writes += 1;
        void v;
      }
    }
  });
  const sheetObs = new MutationObserver((records) => {
    for (const r of records) {
      for (const n of r.addedNodes) {
        if (n.nodeType === 1 && n.classList?.contains("qcm-lines")) {
          mounts += 1;
          obs.observe(n, { attributes: true, attributeFilter: ["style"] });
          if (!seen.has(n)) seen.add(n);
        }
      }
    }
  });
  sheetObs.observe(document.body, { childList: true, subtree: true });
  // Existing sheets too.
  document.querySelectorAll(".qcm-lines").forEach((el) => obs.observe(el, { attributes: true, attributeFilter: ["style"] }));

  const el = document.querySelector(a.sel) || document.scrollingElement;
  const raf = () => new Promise((r) => requestAnimationFrame(() => r()));
  return (async () => {
    const steps = [];
    for (let i = 0; i < a.steps; i++) {
      const t0 = performance.now();
      el.scrollTop += a.dist;
      await raf();
      await raf();
      steps.push(+(performance.now() - t0).toFixed(1));
    }
    sheetObs.disconnect();
    obs.disconnect();
    const f = [...steps].sort((x, y) => x - y);
    return {
      writes,
      mounts,
      avg: +(steps.reduce((s, x) => s + x, 0) / steps.length).toFixed(1),
      p95: f[Math.floor(0.95 * (f.length - 1))],
      worst: f.at(-1),
      bad: steps.filter((x) => x > 24).length,
    };
  })();
};

const browser = await chromium.launch({
  args: ["--disable-gpu-vsync", "--disable-frame-rate-limit", "--disable-renderer-backgrounding"],
});
const out = [];
for (const port of PORTS) {
  for (const view of ["read-page", "read-mushaf"]) {
    const ovr =
      view === "read-page"
        ? { showHome: false, displayMode: "page" }
        : { showHome: false, mushafLayout: "mushaf" };
    const url = view === "read-page" ? "/page/50" : "/surah/2";
    const ctx = await browser.newContext({ serviceWorkers: "block", viewport: { width: 390, height: 780 } });
    await ctx.addInitScript(
      (init) => {
        localStorage.setItem(
          "mushaf-plus-settings",
          JSON.stringify({
            skipSplashAnimation: true,
            showHome: true,
            sidebarOpen: false,
            homeSection: "surah",
            riwaya: "hafs",
            fontFamily: "qpc-hafs",
            lang: "fr",
            theme: "light",
            ...init.ovr,
          }),
        );
        localStorage.setItem("mushaf-plus-onboarded", "1");
      },
      { ovr },
    );
    const page = await ctx.newPage();
    await page.goto(`http://127.0.0.1:${port}${url}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector(".app-view-reading", { timeout: 40000 }).catch(() => {});
    await page.waitForTimeout(3000);
    const res = await page.evaluate(WATCH, { steps: STEPS, dist: DIST, sel: ".app-main" });
    out.push({ port, view, ...res });
    await ctx.close();
  }
}
console.log(`scroll ${STEPS}×${DIST}px @390x780 — 4294 = base build, 4295 = fit-cache build`);
console.table(out);
await browser.close();
