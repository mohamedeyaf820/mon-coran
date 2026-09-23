// Scratch probe: given a text fragment, find the leaf element(s) holding it and
// print the stylesheet rules that actually set font-size on it.
// Usage: TEXT="0 Favoris" URL=/ VIEW=home node .scratch-diag/resp-who.mjs
import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:4187";
const KEY = "mushaf-plus-settings";
const TEXT = process.env.TEXT || "0 Favoris";
const URL_PATH = process.env.URL || "/";
const WAIT = process.env.WAIT || ".app-root";
const SEED = JSON.parse(process.env.SEED || "{}");
const W = Number(process.env.W || 320);

function seedFn() {
  return (args) => {
    localStorage.setItem(
      args.key,
      JSON.stringify({
        skipSplashAnimation: true,
        showHome: true,
        showDuas: false,
        sidebarOpen: false,
        displayMode: "surah",
        mushafLayout: "list",
        riwaya: "hafs",
        fontFamily: "qpc-hafs",
        quranFontSize: 34,
        lang: "fr",
        theme: "light",
        lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 },
        ...args.overrides,
      }),
    );
  };
}

const PROBE = (args) => {
  const { text } = args;
  const leaves = [...document.querySelectorAll("*")].filter(
    (el) => el.children.length === 0 || el.matches("button, a"),
  );
  const onlyBareSpan = args.onlyBareSpan === true;
  const hits = leaves
    .filter((el) => (el.textContent || "").trim().includes(text))
    .filter((el) => !onlyBareSpan || (el.tagName === "SPAN" && !el.getAttribute("class")))
    .slice(0, 6);
  const walk = (rules, href, media, el) => {
    const out = [];
    for (const rule of rules) {
      if (rule.cssRules && !rule.selectorText) { out.push(...walk(rule.cssRules, href, rule.conditionText || media, el)); continue; }
      if (!rule.selectorText) continue;
      let hit = false;
      for (const part of rule.selectorText.split(",")) {
        try { if (el.matches(part.trim())) { hit = true; break; } } catch { /* ignore */ }
      }
      if (hit && rule.style.getPropertyValue("font-size")) {
        out.push({
          href: (href || "inline").split("/").pop(),
          media: media || null,
          sel: rule.selectorText.replace(/\s+/g, " ").slice(0, 100),
          decl: `font-size:${rule.style.getPropertyValue("font-size")}${rule.style.getPropertyPriority("font-size") ? "!" : ""}`,
        });
      }
      if (rule.cssRules) out.push(...walk(rule.cssRules, href, media));
    }
    return out;
  };
  return hits.map((el) => {
    const rules = [];
    for (const sheet of document.styleSheets) {
      try { rules.push(...walk(sheet.cssRules, sheet.href, null, el)); } catch { /* cross-origin */ }
    }
    return {
      path: (() => {
        const p = [];
        let n = el;
        while (n && n !== document.body && p.length < 5) {
          p.unshift(n.tagName.toLowerCase() + (n.className ? "." + String(n.className).trim().split(/\s+/).slice(0, 3).join(".") : ""));
          n = n.parentElement;
        }
        return p.join(" > ");
      })(),
      fs: getComputedStyle(el).fontSize,
      text: (el.textContent || "").trim().slice(0, 30),
      rules,
    };
  });
};

const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: "block", viewport: { width: W, height: 900 } });
await ctx.addInitScript(seedFn(), { key: KEY, overrides: SEED });
const p = await ctx.newPage();
await p.goto(BASE + URL_PATH, { waitUntil: "domcontentloaded" });
await p.waitForSelector(WAIT, { timeout: 25_000 }).catch(() => {});
await p.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 15_000 }).catch(() => {});
await p.waitForTimeout(1500);
const out = await p.evaluate(PROBE, { text: TEXT, onlyBareSpan: process.env.BARE === "1" });
if (!out.length) console.log(`no element containing ${JSON.stringify(TEXT)} on ${URL_PATH} @${W}px`);
for (const o of out) {
  console.log(`\n${o.path}\n  computed font-size: ${o.fs}  text: ${JSON.stringify(o.text)}`);
  for (const r of o.rules) console.log(`   ${r.href}${r.media ? ` @${r.media.slice(0, 34)}` : ""}  ${r.sel}  { ${r.decl} }`);
}
await b.close();
