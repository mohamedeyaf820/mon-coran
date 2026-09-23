// Scratch probe: does the global 44px floor ever clamp an owner's LARGER
// min-height down? A floor must only raise.
import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:4187";
const KEY = "mushaf-plus-settings";
const FLOOR = "max(2.75rem, 44px)";

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

// Disable the two floor rules, then read the owner min-height back.
const PROBE = (FLOOR) => {
  const floorSel = (r) =>
    r.selectorText &&
    /min-height/.test(r.cssText || "") &&
    /max\(2\.75rem, 44px\)/.test(r.cssText || "") &&
    /#root#root|html:root:root/.test(r.selectorText);

  // Deleting is the only honest neutralisation: `unset`/`revert` on the floor
  // still outrank the non-important owner declarations it is meant to expose.
  const doomed = [];
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch { continue; }
    for (let i = rules.length - 1; i >= 0; i--) {
      if (floorSel(rules[i])) doomed.push({ sheet, i });
    }
  }
  for (const d of doomed) d.sheet.deleteRule(d.i);
  const wanted = new Map();
  for (const el of document.querySelectorAll('button,a[href],[role="button"],[role="tab"],[role="switch"],[role="menuitem"],summary,select,textarea,input')) {
    const cs = getComputedStyle(el);
    const mh = parseFloat(cs.minHeight);
    if (!Number.isFinite(mh) || mh <= 44.5) continue;
    const cls = String(el.className || "").trim().split(/\s+/)[0] || el.tagName.toLowerCase();
    const k = `${el.tagName.toLowerCase()}.${cls}`;
    if (!wanted.has(k) || wanted.get(k) < mh) wanted.set(k, mh);
  }
  // The floor rules are gone from this page; re-add them so the second pass
  // measures what the shipped cascade actually produces.
  const host = document.styleSheets[document.styleSheets.length - 1];
  for (const sel of [
    'html body #root#root :is(button, summary, [role="button"], [role="tab"], [role="checkbox"], [role="switch"], [role="menuitem"], [role="option"], [role="link"], a[href], select, textarea)',
    "html:root:root body > * :is(button, summary, [role=button], [role=tab], [role=checkbox], [role=switch], [role=menuitem], [role=option], [role=link], a[href], select, textarea)",
  ]) {
    try { host.insertRule(`${sel} { min-height: ${FLOOR} !important; }`, host.cssRules.length); } catch { /* ignore */ }
  }

  const now = [];
  for (const el of document.querySelectorAll('button,a[href],[role="button"],[role="tab"],[role="switch"],[role="menuitem"],summary,select,textarea,input')) {
    const cs = getComputedStyle(el);
    const mh = parseFloat(cs.minHeight);
    const r = el.getBoundingClientRect();
    if (Number.isFinite(mh) && mh > 44.5 && r.height < mh - 0.5) {
      const cls = String(el.className || "").trim().split(/\s+/)[0] || el.tagName.toLowerCase();
      now.push(`${el.tagName.toLowerCase()}.${cls} asks ${mh}px gets ${r.height.toFixed(1)}`);
    }
  }
  return {
    floorRulesDeleted: doomed.length,
    ownersAbove44: [...wanted].sort((a, b) => b[1] - a[1]).slice(0, 25),
    clampedNow: [...new Set(now)].slice(0, 25),
  };
};

const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: "block", viewport: { width: 390, height: 900 } });
await ctx.addInitScript(seedFn(), { key: KEY });
const p = await ctx.newPage();
await p.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await p.waitForSelector(".hp-card", { timeout: 25_000 }).catch(() => {});
await p.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 15_000 }).catch(() => {});
await p.waitForTimeout(2000);
const r = await p.evaluate(PROBE, FLOOR);
console.log("floor rules deleted:", r.floorRulesDeleted);
console.log("\nowners asking > 44px (floor neutralised):");
for (const [k, v] of r.ownersAbove44) console.log(`  ${String(v).padStart(6)}px  ${k}`);
console.log("\nstill clamped after restoring the floor:");
for (const x of r.clampedNow) console.log("  " + x);
await b.close();
