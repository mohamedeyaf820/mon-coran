import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const SUBSET = new Set(JSON.parse(readFileSync(".scratch-diag/subset-cmap.json", "utf8")));
const BASE = "http://127.0.0.1:4188/";
const configs = [
  { name: "home-fr", route: "", lang: "fr" },
  { name: "home-ar", route: "", lang: "ar" },
  { name: "duas-ar", route: "duas", lang: "ar" },
  { name: "surah2-list-fr", route: "surah/2", lang: "fr" },
  { name: "surah2-list-ar", route: "surah/2", lang: "ar" },
  { name: "page299-mushaf", route: "page/299", lang: "fr" },
  { name: "naskh-reading", route: "surah/2", lang: "ar", font: "noto-naskh-arabic" },
  { name: "naskh-reading-fr", route: "surah/2", lang: "fr", font: "noto-naskh-arabic" },
];

const browser = await chromium.launch();
for (const cfg of configs) {
  const ctx = await browser.newContext({ viewport: { width: 430, height: 900 } });
  await ctx.addInitScript(
    ([lang, font]) => {
      window.localStorage.setItem(
        "mushaf-plus-settings",
        JSON.stringify({
          lang,
          theme: "light",
          riwaya: "hafs",
          showHome: true,
          skipSplashAnimation: true,
          ...(font ? { fontFamily: font, fontByRiwaya: { hafs: font } } : {}),
        }),
      );
    },
    [cfg.lang, cfg.font ?? null],
  );
  const fonts = [];
  ctx.on("response", (res) => {
    const u = new URL(res.url());
    if (u.pathname.endsWith(".woff2") && u.pathname.includes("naskh")) fonts.push(u.pathname);
  });
  const page = await ctx.newPage();
  await page.goto(BASE + cfg.route, { waitUntil: "load" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(2500);
  const missing = await page.evaluate(
    ([json]) => {
      const set = new Set(json);
      const found = new Map();
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walker.nextNode())) {
        for (const ch of n.nodeValue) {
          const cp = ch.codePointAt(0);
          if (cp < 0x0600 || cp > 0x08ff) continue;
          if (set.has(cp)) continue;
          if (!found.has(cp)) found.set(cp, n.nodeValue.trim().slice(0, 40));
        }
      }
      return [...found].map(([cp, s]) => `U+${cp.toString(16).toUpperCase()} “${s}”`);
    },
    [[...SUBSET]],
  );
  console.log(
    `${cfg.name.padEnd(20)} naskh files: ${(fonts.length ? [...new Set(fonts)] : ["—"]).join(",")}  uncovered arabic cps: ${missing.length ? "\n    " + missing.join("\n    ") : "none"}`,
  );
  await ctx.close();
}
await browser.close();
