// Scratch probe: inventory the in-app reading DOM and check the basmala band.
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
  const qcm = new Set();
  for (const el of document.querySelectorAll('[class*="qcm-"]')) {
    for (const c of String(el.className).split(/\s+/)) if (c.startsWith("qcm-")) qcm.add(c);
  }
  const rows = [];
  for (const el of document.querySelectorAll(".qcm-line--basmala, .qcm-basmala, .qcm-line--surah-header")) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    rows.push({
      cls: String(el.className),
      text: (el.textContent || "").trim().slice(0, 25),
      w: +r.width.toFixed(1), h: +r.height.toFixed(1), top: +r.top.toFixed(1),
      fontSize: cs.fontSize, opacity: cs.opacity, visibility: cs.visibility,
      display: cs.display, color: cs.color, fontFamily: cs.fontFamily.slice(0, 30),
    });
  }
  return {
    view: document.querySelector(".app-root")?.getAttribute("data-view"),
    qcmClasses: [...qcm].sort(),
    basmalaRows: rows,
    lineCount: document.querySelectorAll(".qcm-line").length,
    hasSurahTitle: !!document.querySelector(".qcm-surah-title"),
    ayahTexts: document.querySelectorAll(".qc-ayah-text-ar").length,
  };
};

const b = await chromium.launch();
for (const delay of [1500, 5000]) {
  const ctx = await b.newContext({ serviceWorkers: "block", viewport: { width: 320, height: 780 }, deviceScaleFactor: 2 });
  await ctx.addInitScript(seedFn(), { key: KEY });
  const p = await ctx.newPage();
  await p.goto(BASE + "/surah/2", { waitUntil: "domcontentloaded" });
  await p.waitForSelector(".app-view-reading", { timeout: 25_000 }).catch(() => {});
  await p.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 15_000 }).catch(() => {});
  await p.waitForTimeout(delay);
  console.log(`--- ${delay}ms ---`);
  console.log(JSON.stringify(await p.evaluate(PROBE), null, 1));
  await p.screenshot({ path: `.scratch-diag/resp/shots-regress/basmala-probe-${delay}.png` });
  await ctx.close();
}
await b.close();
