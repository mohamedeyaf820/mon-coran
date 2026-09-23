// Scratch probe: geometry + padding for every clipped-text suspect.
import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:4187";
const KEY = "mushaf-plus-settings";

function seedFn() {
  return (args) => {
    localStorage.setItem(args.key, JSON.stringify({
      skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false,
      displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
      quranFontSize: 34, lang: "fr", theme: "light",
      lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 },
    }));
  };
}

const TARGETS = [
  ".home-content-toolbar",
  ".home-content-toolbar [role=tab]",
  ".home-today-verse",
  ".home-today-verse__translation",
  ".home-resume-panel",
  ".home-resume-panel__target",
  ".mp-header__home-summary",
  ".mp-header__home-summary-clean",
  ".mp-header__title-btn",
  ".mp-header__title-stack",
];

const PROBE = (targets) => {
  const out = [];
  for (const sel of targets) {
    for (const el of document.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect();
      if (r.width < 1) continue;
      const cs = getComputedStyle(el);
      out.push({
        sel,
        box: `${r.width.toFixed(1)}x${r.height.toFixed(1)}`,
        sw: el.scrollWidth,
        dx: el.scrollWidth - el.clientWidth,
        text: (el.innerText || "").trim().replace(/\s+/g, " ").slice(0, 26),
        fs: cs.fontSize,
        pad: cs.padding,
        ws: cs.whiteSpace,
        ovf: cs.overflow,
        disp: cs.display,
        gtc: cs.gridTemplateColumns.slice(0, 40),
        flex: cs.flex.slice(0, 24),
        minw: cs.minWidth,
      });
      if (sel === ".home-content-toolbar [role=tab]") break;
    }
  }
  return out;
};

const b = await chromium.launch();
for (const w of [280, 320, 768, 1280]) {
  const ctx = await b.newContext({ serviceWorkers: "block", viewport: { width: w, height: 900 } });
  await ctx.addInitScript(seedFn(), { key: KEY });
  const p = await ctx.newPage();
  await p.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await p.waitForSelector(".hp-card", { timeout: 25_000 }).catch(() => {});
  await p.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 15_000 }).catch(() => {});
  await p.waitForTimeout(1800);
  console.log(`\n### ${w}`);
  for (const r of await p.evaluate(PROBE, TARGETS)) {
    console.log(`  ${r.sel.padEnd(38)} ${r.box.padEnd(13)} dx=${String(r.dx).padStart(4)} fs=${r.fs.padEnd(7)} pad=${r.pad.padEnd(14)} ws=${r.ws.padEnd(7)} gtc=${r.gtc} "${r.text}"`);
  }
  await ctx.close();
}
await b.close();
