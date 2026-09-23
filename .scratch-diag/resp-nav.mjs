// Scratch probe: why is the footer nav label 22px wide?
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

const PROBE = () => {
  const nav = document.querySelector(".mp-footer-v2__nav");
  if (!nav) return { error: "no nav" };
  const ncs = getComputedStyle(nav);
  const nr = nav.getBoundingClientRect();
  const btns = [...nav.children].map((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const lab = el.querySelector(".mp-footer-v2__nav-label");
    const lr = lab ? lab.getBoundingClientRect() : null;
    const lcs = lab ? getComputedStyle(lab) : null;
    return {
      btn: `${r.width.toFixed(1)}x${r.height.toFixed(1)}`,
      pad: cs.padding,
      label: lr ? `${lr.width.toFixed(1)}x${lr.height.toFixed(1)}` : null,
      labelScroll: lab ? lab.scrollWidth : null,
      text: lab ? lab.textContent : null,
      fs: lcs ? lcs.fontSize : null,
      maxw: lcs ? lcs.maxWidth : null,
      ws: lcs ? lcs.whiteSpace : null,
    };
  });
  return {
    rootFs: getComputedStyle(document.documentElement).fontSize,
    navBox: `${nr.width.toFixed(1)}x${nr.height.toFixed(1)}`,
    cols: ncs.gridTemplateColumns,
    count: nav.children.length,
    pad: ncs.padding, gap: ncs.gap,
    btns,
  };
};

const b = await chromium.launch();
for (const w of [280, 320, 390]) {
  const ctx = await b.newContext({ serviceWorkers: "block", viewport: { width: w, height: 900 } });
  await ctx.addInitScript(seedFn(), { key: KEY });
  const p = await ctx.newPage();
  await p.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await p.waitForSelector(".mp-footer-v2__nav", { timeout: 25_000 }).catch(() => {});
  await p.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 15_000 }).catch(() => {});
  await p.waitForTimeout(1500);
  await p.locator(".mp-footer-v2__nav").scrollIntoViewIfNeeded().catch(() => {});
  await p.waitForTimeout(400);
  console.log(`### ${w}`);
  console.log(JSON.stringify(await p.evaluate(PROBE), null, 1));
  await p.screenshot({ path: `.scratch-diag/resp/shots-legi/navonly-${w}.png`, clip: await p.locator(".mp-footer-v2__nav").boundingBox().then((r) => r && { x: Math.max(0, r.x - 4), y: Math.max(0, r.y - 4), width: Math.min(w, r.width + 8), height: r.height + 8 }) }).catch((e) => console.log("shot fail " + String(e.message).slice(0, 60)));
  await ctx.close();
}
await b.close();
