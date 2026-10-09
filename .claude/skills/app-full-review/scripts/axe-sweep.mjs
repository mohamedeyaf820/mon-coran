// axe-core over the screens, themes and languages that matter.
//
//   node .claude/skills/app-full-review/scripts/axe-sweep.mjs [base=http://127.0.0.1:4173]
//
// Prints findings grouped by rule and selector. Exit code 1 when a critical or
// serious finding exists. Known open items are listed in SKILL.md.
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const arg = Object.fromEntries(process.argv.slice(2).map((a) => a.split("=")));
const BASE = arg.base || "http://127.0.0.1:4173";
const COMBOS = [[390, "light", "fr"], [390, "dark", "ar"], [1440, "light", "fr"], [1440, "sepia", "en"], [1440, "dark", "fr"]];
const SCREENS = [
  ["home", "/"], ["surah2", "/surah/2"], ["page1", "/page/1"], ["duas", "/duas"], ["prieres", "/prieres"],
  ["about", "/about"], ["privacy", "/privacy"], ["sources", "/sources"], ["surahs", "/surahs"], ["404", "/xyz"],
  ["search", "/surah/1", "/"], ["library", "/surah/1", "b"], ["settings", "/surah/1", ","],
];

const browser = await chromium.launch();
const findings = new Map();
let pages = 0;
for (const [w, theme, lang] of COMBOS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, isMobile: w < 500, hasTouch: w < 500, serviceWorkers: "block" });
  const page = await ctx.newPage();
  await page.addInitScript(([t, l]) => {
    localStorage.setItem("mushaf-plus-settings", JSON.stringify({ skipSplashAnimation: true, theme: t, lang: l, riwaya: "hafs" }));
  }, [theme, lang]);
  for (const [name, url, key] of SCREENS) {
    if (key && w < 500) continue;
    await page.goto(BASE + url, { waitUntil: "load" });
    await page.waitForFunction(() => document.documentElement.dataset.deferredStyles === "ready", null, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(/^(surah|page)/.test(name) ? 3500 : 1200);
    if (key) {
      await page.keyboard.press(key);
      await page.waitForTimeout(1000);
    }
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
      .analyze();
    pages += 1;
    for (const v of result.violations) {
      for (const n of v.nodes) {
        const k = `${v.id} | ${v.impact} | ${n.target.join(" ").slice(0, 90)}`;
        const e = findings.get(k) || { n: 0, at: new Set(), html: n.html.slice(0, 120) };
        e.n += 1;
        e.at.add(`${name}@${w}/${theme}/${lang}`);
        findings.set(k, e);
      }
    }
  }
  await ctx.close();
}
await browser.close();
console.log(`pages scanned: ${pages}, distinct findings: ${findings.size}`);
for (const [k, v] of [...findings].sort((a, b) => b[1].n - a[1].n)) {
  console.log(`\n${v.n}x ${k}\n   ${v.html}\n   at ${[...v.at].slice(0, 4).join(", ")}`);
}
process.exitCode = [...findings.keys()].some((k) => /\| (critical|serious) \|/.test(k)) ? 1 : 0;
