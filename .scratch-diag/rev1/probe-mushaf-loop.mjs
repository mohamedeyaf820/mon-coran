import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";

const BASE = process.argv[2] || "http://127.0.0.1:4191";
const log = (...a) => console.log(...a);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on("pageerror", (e) => log("PAGEERROR", e.message));

await page.addInitScript(() => {
  window.__probe = { long: 0, longMs: 0, styleWrites: 0, layoutForces: 0, frames: 0, rafReschedules: 0 };
  const po = new PerformanceObserver((list) => {
    for (const e of list.getEntries()) { window.__probe.long += 1; window.__probe.longMs += e.duration; }
  });
  try { po.observe({ type: "longtask", buffered: true }); } catch {}
  const count = (...fns) => {
    for (const fn of fns) {
      const orig = fn;
      fn = null;
      void orig;
    }
  };
  void count;
  const kick = () => { window.__probe.frames += 1; requestAnimationFrame(kick); };
  requestAnimationFrame(kick);
});

await page.goto(BASE + "/page/303", { waitUntil: "domcontentloaded" });
for (let i = 0; i < 20; i++) {
  if (await page.evaluate(() => !!document.querySelector(".qcm-flow, [data-ayah-number], .app-main"))) break;
  await page.waitForTimeout(2000);
}
await page.waitForTimeout(2500);

const clicked = await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => x.offsetParent && x.textContent.trim() === "Mushaf");
  if (!b) return null;
  b.setAttribute("data-probe-m", "1");
  return true;
});
log("mushaf toggle found:", clicked);
if (!clicked) { await browser.close(); process.exit(1); }

// instrument the fit loop: every style write on the flow root + forced layouts
await page.evaluate(() => {
  const p = window.__probe;
  const origGSBCS = window.getComputedStyle;
  let rafPending = 0;
  const origRaf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => origRaf((t) => { rafPending += 1; return cb(t); });
  const proto = Element.prototype;
  for (const prop of ["offsetHeight", "offsetWidth", "clientHeight", "scrollHeight"]) {
    const d = Object.getOwnPropertyDescriptor(proto, prop) || Object.getOwnPropertyDescriptor(HTMLElement.prototype, prop);
    if (!d?.get) continue;
    const g = d.get;
    Object.defineProperty(proto, prop, {
      ...d,
      get() { p.layoutForces += 1; return g.call(this); },
    });
  }
  const sd = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "style");
  void sd;
});

await page.evaluate(() => document.querySelector("button[data-probe-m]")?.click());
await page.waitForTimeout(6000);
const after = await page.evaluate(() => ({ ...window.__probe, flow: !!document.querySelector(".qcm-flow"), lines: document.querySelectorAll(".qcm-line").length }));
log("6s after switching to Mushaf:", JSON.stringify(after));
await page.waitForTimeout(6000);
log("12s:", JSON.stringify(await page.evaluate(() => ({ ...window.__probe, fit: getComputedStyle(document.querySelector(".qcm-flow")?.parentElement || document.body).getPropertyValue("--qcm-flow-fit") }))));
await page.screenshot({ path: ".scratch-diag/rev1/mushaf-loop.png" });
await browser.close();
