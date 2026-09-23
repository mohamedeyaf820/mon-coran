// Scratch probe: does the basmala of Al-Baqara page 1 paint reliably?
// Finds the element by its text rather than by class, because the in-app page
// engine does not use the qcm-* classes.
import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:4187";
const KEY = "mushaf-plus-settings";

function seedFn() {
  return (args) => {
    localStorage.setItem(
      args.key,
      JSON.stringify({
        skipSplashAnimation: true, showHome: false, showDuas: false, sidebarOpen: false,
        displayMode: "surah", mushafLayout: "mushaf", riwaya: "hafs", fontFamily: "qpc-hafs",
        quranFontSize: 34, lang: "fr", theme: "light",
        lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 },
      }),
    );
  };
}

const PROBE = () => {
  const hits = [];
  // Harakat sit between the base letters, so match on the undiacritised stem.
  const bare = (s) => s.replace(/[ً-ْٰۖ-ۭ]/g, "");
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walk.nextNode()) {
    const n = walk.currentNode;
    if (!/بسم/.test(bare(n.nodeValue))) continue;
    let el = n.parentElement;
    const depth = [];
    while (el && el !== document.body) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      depth.push({
        tag: el.tagName.toLowerCase(),
        cls: String(el.className || "").slice(0, 55),
        w: +r.width.toFixed(1),
        h: +r.height.toFixed(1),
        top: +r.top.toFixed(1),
        fs: cs.fontSize,
        color: cs.color,
        opacity: cs.opacity,
        vis: cs.visibility,
        disp: cs.display,
        ff: cs.fontFamily.slice(0, 28),
      });
      el = el.parentElement;
      if (depth.length > 3) break;
    }
    hits.push({ text: n.nodeValue.trim().slice(0, 40), chain: depth });
  }
  return { hits: hits.slice(0, 4), fonts: document.fonts.status };
};

const b = await chromium.launch();
for (let i = 0; i < 4; i++) {
  const ctx = await b.newContext({ serviceWorkers: "block", viewport: { width: 320, height: 780 }, deviceScaleFactor: 2 });
  await ctx.addInitScript(seedFn(), { key: KEY });
  const p = await ctx.newPage();
  await p.goto(BASE + "/surah/2", { waitUntil: "domcontentloaded" });
  await p.waitForSelector(".app-view-reading", { timeout: 25_000 }).catch(() => {});
  await p.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 15_000 }).catch(() => {});
  await p.waitForTimeout(1200);
  const r = await p.evaluate(PROBE);
  console.log(`run ${i}: basmalaNodes=${r.hits.length}`);
  for (const h of r.hits) {
    console.log(`  "${h.text}" -> ${h.chain.map((c) => `${c.tag}.${c.cls.split(" ")[0]} ${c.w}x${c.h}@${c.top} fs=${c.fs} op=${c.opacity} vis=${c.vis}`).join(" | ")}`);
  }
  await p.screenshot({ path: `.scratch-diag/resp/shots-regress/basmala-run${i}.png` });
  await ctx.close();
}
await b.close();
