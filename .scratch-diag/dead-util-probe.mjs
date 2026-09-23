// Scratch: measure whether each dead token utility leaves its property unset.
// Not for commit.
import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const KEY = "mushaf-plus-settings";

const DEAD = [
  "border-border", "ring-primary", "text-text-secondary", "bg-bg-card/90", "border-border/50",
  "border-border/70", "bg-bg-tertiary", "border-primary/15", "bg-bg-card/70", "border-primary/20",
  "bg-primary/14", "bg-bg-card/80", "text-text-muted/60", "bg-bg-card/60", "bg-primary/10",
  "text-primary/70", "border-border/40", "text-text-main", "bg-gold", "bg-bg-secondary",
  "border-primary", "group-hover:text-primary", "hover:bg-bg-secondary", "hover:bg-bg-tertiary",
  "hover:border-primary/70", "group-hover:border-primary/30", "bg-primary/5", "bg-primary/8",
  "border-gold/50", "bg-bg-card",
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
await page.addInitScript((k) => localStorage.setItem(k, JSON.stringify({
  skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false,
  displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
  quranFontSize: 34, lang: "fr", theme: "light", lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } })), KEY);
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(900);

const probe = async (label) => {
  const out = await page.evaluate((DEAD) => {
    const propFor = (t) => t.startsWith("bg-") ? "backgroundColor" : t.startsWith("border-") ? "borderTopColor" : t.startsWith("text-") || t.startsWith("group-hover:text-") ? "color" : t.startsWith("ring-") ? "boxShadow" : null;
    const res = [];
    for (const el of document.querySelectorAll("*")) {
      const cl = typeof el.className === "string" ? el.className.split(/\s+/) : [];
      for (const raw of cl) {
        const t = raw.replace(/^(?:hover|focus|group-hover|active|disabled):/, "");
        if (!DEAD.includes(t)) continue;
        const p = propFor(raw);
        if (!p) continue;
        const cs = getComputedStyle(el);
        const v = cs[p];
        const isDefault = (p === "backgroundColor" && v === "rgba(0, 0, 0, 0)") ||
          (p === "borderTopColor" && (v === "rgb(0, 0, 0)" || v === cs.color)) ||
          (p === "boxShadow" && v === "none");
        res.push({ tok: raw, prop: p, v: v.slice(0, 40), defaultish: isDefault, cls: cl.join(" ").slice(0, 120), path: (function (e) { const a = []; let n = e; while (n && n.tagName && a.length < 4) { const c = (typeof n.className === "string" ? n.className.split(/\s+/) : []).filter((x) => /^(hp|mp|sb|qc|home|reciter|reader|sidebar|app|legal|settings)/.test(x))[0]; a.unshift(n.tagName.toLowerCase() + (c ? "." + c : "")); n = n.parentElement; } return a.join(">"); })(el), txt: (el.textContent || "").trim().slice(0, 28) });
      }
    }
    return res;
  }, DEAD);
  const bad = out.filter((r) => r.defaultish);
  console.log(`\n## ${label}: ${out.length} matches, ${bad.length} property left at default`);
  const seen = new Set();
  for (const r of bad) { const k = r.tok + r.cls; if (seen.has(k)) continue; seen.add(k); console.log(`  ${r.tok} → ${r.prop}=${r.v} :: ${r.path} :: "${r.txt}" :: ${r.cls}`); }
};

await probe("home");
await page.click('[aria-label*="enu"], .mp-header__menu, button[aria-label*="Menu"]').catch(() => {});
await page.waitForTimeout(700);
await probe("sidebar open");
await browser.close();
