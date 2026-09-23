// Scratch probe: which stylesheet rules actually set a property on an element?
// CSS cascade in this app is deep enough that grep cannot answer it.
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

const PROBE = (args) => {
  const { sel, props } = args;
  const el = document.querySelector(sel);
  if (!el) return { error: `no ${sel}` };
  const out = [];
  const walk = (rules, href, media) => {
    for (const rule of rules) {
      // Grouping rules (media, supports) nest without a selector. Style rules
      // also carry cssRules now that nesting ships, so test the selector first.
      if (rule.cssRules && !rule.selectorText) { walk(rule.cssRules, href, rule.conditionText || media); continue; }
      if (!rule.selectorText) continue;
      let hit = false;
      for (const part of rule.selectorText.split(",")) {
        try { if (el.matches(part.trim())) { hit = true; break; } } catch { /* :has etc. */ }
      }
      if (!hit) continue;
      const declared = props.filter((p) => rule.style.getPropertyValue(p));
      if (declared.length) {
        out.push({
          href: (href || "inline").split("/").pop(),
          media: media || null,
          sel: rule.selectorText.replace(/\s+/g, " ").slice(0, 90),
          decl: declared.map((p) => `${p}:${rule.style.getPropertyValue(p)}${rule.style.getPropertyPriority(p) ? "!" : ""}`).join(" "),
        });
      }
      if (rule.cssRules) walk(rule.cssRules, href, media);
    }
  };
  for (const sheet of document.styleSheets) {
    try { walk(sheet.cssRules, sheet.href); } catch { /* cross-origin */ }
  }
  return { computed: Object.fromEntries(props.map((p) => [p, getComputedStyle(el)[p]])), rules: out };
};

const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: "block", viewport: { width: 280, height: 900 } });
await ctx.addInitScript(seedFn(), { key: KEY });
const p = await ctx.newPage();
await p.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await p.waitForSelector(".mp-footer-v2__nav", { timeout: 25_000 }).catch(() => {});
await p.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 15_000 }).catch(() => {});
await p.waitForTimeout(1500);

for (const [sel, props] of [
  [".mp-footer-v2__nav-btn", ["padding", "padding-inline", "min-height", "height"]],
  [".mp-footer-v2__nav-label", ["font-size", "max-width", "white-space", "overflow"]],
  [".home-today-verse", ["grid-template-columns", "padding"]],
  [".home-today-verse__translation", ["font-size", "white-space", "overflow", "text-overflow"]],
]) {
  const r = await p.evaluate(PROBE, { sel, props });
  console.log(`\n### ${sel}`);
  console.log("  computed:", JSON.stringify(r.computed));
  for (const x of r.rules || []) console.log(`   ${x.href}${x.media ? ` @${x.media.slice(0, 26)}` : ""}  ${x.sel}  { ${x.decl} }`);
}
await b.close();
