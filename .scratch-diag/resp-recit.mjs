// Scratch probe: reciter-detail surah-row title clipping. Not for commit.
import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:4187";
const KEY = "mushaf-plus-settings";

const seedFn = (args) => {
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
      lang: args.lang,
      theme: args.theme,
      lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 },
    }),
  );
};

const PROBE = () => {
  const rows = [...document.querySelectorAll(".recitation-row")].slice(0, 6);
  const out = [];
  for (const row of rows) {
    const title = row.querySelector(".recitation-row__title");
    const name = row.querySelector(".recitation-row__name");
    const badge = row.querySelector(".recitation-row__type");
    const copy = row.querySelector(".recitation-row__copy");
    const arab = row.querySelector(".recitation-row__arabic");
    const acts = row.querySelector(".recitation-row__actions");
    if (!title) continue;
    const tr = title.getBoundingClientRect();
    const nr = name ? name.getBoundingClientRect() : null;
    const br = badge ? badge.getBoundingClientRect() : null;
    const cr = copy.getBoundingClientRect();
    const ar = arab ? arab.getBoundingClientRect() : null;
    const rr = row.getBoundingClientRect();
    const acr = acts ? acts.getBoundingClientRect() : null;
    out.push({
      title: (name?.innerText || title.innerText || "").trim().replace(/\s+/g, " ").slice(0, 40),
      nameBox: nr ? `${nr.width.toFixed(1)}x${nr.height.toFixed(1)}` : "no-span",
      nameDx: name ? name.scrollWidth - name.clientWidth : -1,
      titleBox: `${tr.width.toFixed(1)}x${tr.height.toFixed(1)}`,
      rowH: +rr.height.toFixed(1),
      // actions on their own line => their top is below the title's top
      actsWrapped: acr && nr ? acr.top > nr.bottom - 2 : null,
      badgeVisible: br ? br.x + br.width <= tr.right + 0.5 && br.x >= tr.left - 0.5 : null,
      actsMin: acts ? Math.min(...[...acts.querySelectorAll("button")].map((b) => b.getBoundingClientRect().height)) : null,
      arab: ar ? `${ar.width.toFixed(1)} dx=${arab.scrollWidth - arab.clientWidth}` : "none",
    });
  }
  return {
    rowWidth: document.querySelector(".recitation-row")?.getBoundingClientRect().width,
    gridCols: getComputedStyle(document.querySelector(".recitation-row") || document.body).gridTemplateColumns,
    rows: out,
  };
};

const browser = await chromium.launch();
for (const w of [901, 1024, 1100]) {
  for (const [lang, theme] of [["fr", "light"], ["ar", "dark"]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    await page.addInitScript(seedFn, { key: KEY, lang, theme });
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
    console.log(`\n### ${w}px ${lang}-${theme} rowW=${res.rowWidth?.toFixed(1)} cols=${res.gridCols}`);
    for (const r of res.rows) {
      console.log(
        `  "${r.title}" name=${r.nameBox} nameDx=${r.nameDx} | rowH=${r.rowH} actsWrapped=${r.actsWrapped} minBtn=${r.actsMin} badgeVis=${r.badgeVisible} | ar ${r.arab}`,
      );
    }
    await page.screenshot({ path: `.scratch-diag/resp/recit-${w}-${lang}.png`, fullPage: false });
    await ctx.close();
  }
}
await browser.close();
