// Scratch probe: containers that scroll horizontally inside themselves.
// Document-level overflowX misses these, but they still paint a scrollbar on
// desktop-width pointers and let Quran text slide out of view on a phone.
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";

const BASE = "http://127.0.0.1:4187";
const KEY = "mushaf-plus-settings";
const OUT = ".scratch-diag/resp";

function seedFn() {
  return (args) => {
    localStorage.setItem(
      args.key,
      JSON.stringify({
        skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false,
        displayMode: "surah", mushafLayout: "mushaf", riwaya: "hafs", fontFamily: "qpc-hafs",
        quranFontSize: 34, lang: "fr", theme: "light",
        lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 }, ...args.ovr,
      }),
    );
  };
}

const PROBE = () => {
  const out = [];
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const dx = el.scrollWidth - el.clientWidth;
    if (dx <= 1) continue;
    if (cs.overflowX === "visible") continue; // clips without scrolling: different bug
    const r = el.getBoundingClientRect();
    if (r.width < 20 || r.height < 8) continue;
    const cls = String(el.className || "").trim().split(/\s+/).slice(0, 3).join(".");
    out.push({
      el: `${el.tagName.toLowerCase()}.${cls}`,
      dx,
      w: +r.width.toFixed(1),
      h: +r.height.toFixed(1),
      top: +r.top.toFixed(0),
      ox: cs.overflowX,
      text: (el.innerText || "").trim().replace(/\s+/g, " ").slice(0, 34),
      // A row of pressables that overflows is a navigation defect; a text block
      // that overflows is a legibility defect.
      scrollable: el.querySelectorAll("button,a[href],[role=tab]").length,
    });
  }
  return out.sort((a, b) => b.dx - a.dx).slice(0, 14);
};

const views = [
  { key: "home", url: "/", ovr: { showHome: true }, wait: ".hp-card" },
  { key: "read-mushaf", url: "/surah/2", ovr: { showHome: false, mushafLayout: "mushaf" }, wait: ".app-view-reading" },
  { key: "read-list", url: "/surah/2", ovr: { showHome: false, mushafLayout: "list" }, wait: ".qc-ayah-text-ar" },
  { key: "duas", url: "/duas", ovr: { showHome: false, showDuas: true }, wait: ".duas-page" },
];

const b = await chromium.launch();
const result = {};
for (const w of [280, 320, 360, 768, 1280]) {
  for (const v of views) {
    const ctx = await b.newContext({ serviceWorkers: "block", viewport: { width: w, height: 800 } });
    await ctx.addInitScript(seedFn(), { key: KEY, ovr: v.ovr });
    const p = await ctx.newPage();
    await p.goto(BASE + v.url, { waitUntil: "domcontentloaded" });
    await p.waitForSelector(v.wait, { timeout: 25_000 }).catch(() => {});
    await p.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 15_000 }).catch(() => {});
    await p.waitForTimeout(2200);
    const rows = await p.evaluate(PROBE);
    result[`${v.key}@${w}`] = rows;
    console.log(`\n### ${v.key} @ ${w}`);
    for (const r of rows) console.log(`  +${r.dx}px ${r.el} [${r.w}x${r.h} top=${r.top}] btn=${r.scrollable} "${r.text}"`);
    await ctx.close();
  }
}
await b.close();
writeFileSync(`${OUT}/internal-scroll.json`, JSON.stringify(result, null, 1));
