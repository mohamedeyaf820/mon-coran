// Scratch probe: why is the recitation row narrow? Ancestor chain + actions track demand.
import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:4187";
const KEY = "mushaf-plus-settings";
const seedFn = (args) => {
  localStorage.setItem(args.key, JSON.stringify({
    skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false,
    displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
    quranFontSize: 34, lang: "fr", theme: "light",
    lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 },
  }));
};

const PROBE = () => {
  const row = document.querySelector(".recitation-row");
  if (!row) return { err: "no row" };
  const chain = [];
  for (let el = row; el && el !== document.documentElement; el = el.parentElement) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    chain.push({
      el: el.tagName.toLowerCase() + "." + (el.className || "").toString().split(/\s+/).slice(0, 2).join("."),
      w: +r.width.toFixed(1),
      disp: cs.display,
      gtc: cs.gridTemplateColumns === "none" ? "" : cs.gridTemplateColumns,
      cType: cs.containerType !== "normal" ? cs.containerType : "",
      ovf: cs.overflowX !== "visible" ? cs.overflowX : "",
      pad: cs.paddingInline,
    });
  }
  const acts = row.querySelector(".recitation-row__actions");
  const btns = acts ? [...acts.children].map((b) => {
    const r = b.getBoundingClientRect();
    return `${b.className.split(/\s+/)[0].slice(0, 26)}:${r.width.toFixed(0)}`;
  }) : [];
  return {
    chain: chain.slice(0, 9),
    actsW: acts ? +acts.getBoundingClientRect().width.toFixed(1) : null,
    actsScroll: acts?.scrollWidth,
    btns,
    rowCols: getComputedStyle(row).gridTemplateColumns,
  };
};

const browser = await chromium.launch();
for (const w of [320, 768, 1024, 1280]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(seedFn, { key: KEY });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
  await page.waitForSelector('.home-content-toolbar [role="tab"]', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(400);
  const tabs = await page.$$('.home-content-toolbar [role="tab"]');
  if (tabs[2]) await tabs[2].click();
  await page.waitForSelector(".reciter-card__main", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(500);
  const cards = await page.$$(".reciter-card__main");
  if (cards[0]) await cards[0].click();
  await page.waitForSelector(".recitation-row", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(700);
  const res = await page.evaluate(PROBE);
  console.log(`\n### viewport ${w}`);
  if (res.err) { console.log("  " + res.err); await ctx.close(); continue; }
  console.log(`  cols=${res.rowCols}  acts=${res.actsW} (scroll ${res.actsScroll})  btns=${res.btns.join(" ")}`);
  for (const c of res.chain) console.log(`    ${c.el.padEnd(34)} ${String(c.w).padStart(7)}  ${c.disp}${c.gtc ? " [" + c.gtc + "]" : ""}${c.cType ? " c:" + c.cType : ""}${c.ovf ? " ovf:" + c.ovf : ""}${c.pad !== "0px" ? " pad:" + c.pad : ""}`);
  await ctx.close();
}
await browser.close();
