/**
 * One-off probe for the list-mode ayah reference chip. Not part of the test suite.
 * Usage: VERIFY_WIDTHS=320,360,768 node .scratch-diag/resp-ref.mjs
 */
import { chromium } from "@playwright/test";
const KEY = "mushaf-plus-settings";
const WIDTHS = (process.env.VERIFY_WIDTHS || "280,320,360,390,768,1440").split(",").map(Number);

function seed(a) {
  localStorage.setItem(
    a.key,
    JSON.stringify({
      skipSplashAnimation: true,
      showHome: false,
      showDuas: false,
      sidebarOpen: false,
      lang: "fr",
      theme: "light",
      riwaya: "hafs",
      displayMode: "surah",
      mushafLayout: "list",
      quranFontSize: 34,
      fontFamily: "qpc-hafs",
      lastPosition: { surah: 2, ayah: 253, page: 34, juz: 1 },
    }),
  );
}

const b = await chromium.launch();
const ctx = await b.newContext({
  serviceWorkers: "block",
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
});
await ctx.addInitScript(seed, { key: KEY });
const p = await ctx.newPage();
await p.goto("http://127.0.0.1:4187/surah/2", { waitUntil: "domcontentloaded" });
await p.waitForSelector(".qc-ayah-text-ar", { timeout: 40000 });
await p
  .waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 })
  .catch(() => {});
await p.waitForTimeout(1200);

for (const w of WIDTHS) {
  await p.setViewportSize({ width: w, height: 800 });
  await p.waitForTimeout(500);
  // Walk the virtualised list so 3-digit references are measured too.
  await p.evaluate(async () => {
    const sc =
      document.querySelector(".app-view-reading .overflow-y-auto") ||
      document.querySelector(".app-view-reading") ||
      document.scrollingElement;
    for (let i = 0; i < 26; i++) {
      sc.scrollTop += 700;
      window.dispatchEvent(new Event("scroll"));
      await new Promise((r) => setTimeout(r, 60));
    }
  });
  await p.waitForTimeout(400);
  const rows = await p.evaluate(() => {
    const out = [];
    for (const e of document.querySelectorAll(".qc-list-card__reference")) {
      const r = e.getBoundingClientRect();
      if (r.width < 4) continue;
      const pr = getComputedStyle(e).paddingInline;
      const txt = (e.innerText || "").trim();
      const avail = e.clientWidth - parseFloat(pr.split(" ")[0]) * 2;
      const needed = e.scrollWidth - parseFloat(pr.split(" ")[0]) * 2;
      out.push(
        `${txt.padEnd(8)} ${r.width.toFixed(1)}x${r.height.toFixed(1)} pad=${pr} besoin=${needed.toFixed(1)} dispo=${avail.toFixed(1)} ${needed <= avail + 0.5 ? "" : "<<ROGNE"}`,
      );
    }
    out.sort((a, c) => c.length - a.length);
    return out.slice(0, 4);
  });
  console.log(`\n@${w}`);
  console.log(rows.map((x) => "  " + x).join("\n"));
  const first = p.locator(".qc-list-card").first();
  await first
    .screenshot({ path: `.scratch-diag/resp/shots/ref-${w}.png` })
    .catch((e) => console.log("  shot fail: " + e.message.split("\n")[0]));
}
await b.close();
