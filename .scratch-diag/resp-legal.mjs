// Scratch probe: every interactive target box on the legal/about surface. Not for commit.
import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:4187";
const KEY = "mushaf-plus-settings";
const VIEWS = (process.env.VIEWS || "about,duas,notfound").split(",");
const WIDTHS = (process.env.WS || "280,320,360,390,768").split(",").map(Number);

const seedFn = (args) => {
  localStorage.setItem(args.key, JSON.stringify({
    skipSplashAnimation: true, showHome: false, showDuas: args.view === "duas", sidebarOpen: false,
    displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
    quranFontSize: 34, lang: "fr", theme: "light",
    lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 },
  }));
};

const PROBE = () => {
  const out = [];
  for (const el of document.querySelectorAll("a, button, [role='button'], input, select, textarea, summary")) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    out.push({
      tag: el.tagName.toLowerCase(),
      cls: (el.className || "").toString().split(/\s+/).slice(0, 2).join("."),
      label: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 26),
      w: +r.width.toFixed(1),
      h: +r.height.toFixed(1),
      fs: +parseFloat(cs.fontSize).toFixed(2),
    });
  }
  return out;
};

const browser = await chromium.launch();
for (const w of WIDTHS) {
  for (const view of VIEWS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    await page.addInitScript(seedFn, { key: KEY, view });
    await page.goto(`${BASE}/${view === "notfound" ? "zz-404" : view}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1000);
    const res = await page.evaluate(PROBE);
    const bad = res.filter((o) => o.h < 44 || o.w < 44 || o.fs < 10);
    console.log(`\n##### ${view} @${w}px — ${res.length} interactifs, ${bad.length} sous 44px/10px`);
    for (const o of bad) {
      console.log(`   ${String(o.h).padStart(5)}h ${String(o.w).padStart(6)}w ${String(o.fs).padStart(6)}px  ${o.tag}.${o.cls} “${o.label}”`);
    }
    await ctx.close();
  }
}
await browser.close();
