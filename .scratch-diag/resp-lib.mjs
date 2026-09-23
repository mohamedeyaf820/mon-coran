// Scratch probe: measure the home library buttons across narrow widths.
import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:4187";
const KEY = "mushaf-plus-settings";

function seedFn() {
  return (args) => {
    localStorage.setItem(args.key, JSON.stringify({
      skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false,
      displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
      quranFontSize: 34, lang: "fr", theme: "light",
      lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 }, ...args.overrides,
    }));
  };
}

const LANGS = (process.env.LANGS || "fr,ar").split(",");
const b = await chromium.launch();
for (const lang of LANGS)
for (const w of [280, 320, 360, 390, 414]) {
  const ctx = await b.newContext({ serviceWorkers: "block", viewport: { width: w, height: 900 } });
  await ctx.addInitScript(seedFn(), { key: KEY, overrides: { lang } });
  const p = await ctx.newPage();
  await p.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await p.waitForSelector(".home-resume-panel__library", { timeout: 25_000 });
  await p.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 15_000 }).catch(() => {});
  await p.waitForTimeout(1200);
  const rows = await p.evaluate(() => [...document.querySelectorAll(".home-resume-panel__library > button")].map((btn) => {
    const span = btn.querySelector("span");
    const svgs = [...btn.querySelectorAll("svg")];
    const r = btn.getBoundingClientRect();
    const s = span.getBoundingClientRect();
    return {
      text: span.textContent.trim(),
      btn: Math.round(r.width),
      span: `${Math.round(s.width)}/${span.scrollWidth}`,
      svgs: svgs.map((x) => Math.round(x.getBoundingClientRect().width)),
      gap: getComputedStyle(btn).gap,
      pad: getComputedStyle(btn).padding,
      truncated: span.scrollWidth > Math.ceil(s.width),
    };
  }));
  console.log(`${lang}@${w}px`, JSON.stringify(rows));
  await ctx.close();
}
await b.close();
