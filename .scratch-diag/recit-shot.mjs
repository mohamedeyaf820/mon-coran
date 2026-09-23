// Scratch probe: reciter-card stacking at narrow widths. Not for commit.
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://127.0.0.1:4192";
const KEY = "mushaf-plus-settings";
const seed = (args) => {
  localStorage.setItem(
    args.key,
    JSON.stringify({
      skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false,
      displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
      quranFontSize: 34, lang: args.lang, theme: args.theme,
      lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 },
    }),
  );
};

const PROBE = () => {
  const cards = [...document.querySelectorAll(".reciter-card")].slice(0, 4);
  return cards.map((c) => {
    const r = c.getBoundingClientRect();
    const meta = c.querySelector(".reciter-card__meta");
    const acts = c.querySelector(".reciter-card__actions");
    const spans = [...meta.querySelectorAll("span")].map((s) => ({
      t: s.innerText.trim().slice(0, 18),
      lost: s.scrollWidth - s.clientWidth,
      w: +s.getBoundingClientRect().width.toFixed(1),
    }));
    const ar = acts.getBoundingClientRect();
    return {
      card: `${r.width.toFixed(1)}x${r.height.toFixed(1)}`,
      cols: getComputedStyle(c).gridTemplateColumns,
      spans,
      actsBelowName: ar.top > meta.getBoundingClientRect().bottom - 2,
      actsRight: +(r.right - ar.right).toFixed(1),
      taps: [...acts.querySelectorAll("button")].map((b) => {
        const x = b.getBoundingClientRect();
        return `${x.width.toFixed(1)}x${x.height.toFixed(1)}`;
      }),
    };
  });
};

const browser = await chromium.launch();
for (const w of [280, 320, 360, 400]) {
  for (const [lang, theme] of [["fr", "light"], ["ar", "dark"]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 860 } });
    const page = await ctx.newPage();
    await page.addInitScript(seed, { key: KEY, lang, theme });
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
    await page.waitForSelector(".home-content-toolbar [role=tab]", { timeout: 15000 }).catch(() => {});
    const tabs = await page.$$(".home-content-toolbar [role=tab]");
    if (tabs[2]) await tabs[2].click();
    await page.waitForSelector(".reciter-card__meta", { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(600);
    const res = await page.evaluate(PROBE);
    console.log(`\n### ${w}px ${lang}-${theme}`);
    for (const c of res.slice(0, 2)) console.log(" ", JSON.stringify(c));
    await page.screenshot({ path: `.scratch-diag/resp/card-${w}-${lang}.png` });
    await ctx.close();
  }
}
await browser.close();
