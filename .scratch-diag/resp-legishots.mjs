// Scratch element captures for the legibility lot. Not for commit.
import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:4187";
const KEY = "mushaf-plus-settings";
const OUT = process.env.OUTDIR || ".scratch-diag/resp/shots-legi";
import { mkdirSync } from "node:fs";
mkdirSync(OUT, { recursive: true });

function seedFn() {
  return (args) => {
    localStorage.setItem(
      args.key,
      JSON.stringify({
        skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false,
        displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
        quranFontSize: 34, lang: "fr", theme: "light",
        lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 }, ...args.ovr,
      }),
    );
  };
}

const shots = [
  { name: "footer", url: "/", ovr: { showHome: true }, sel: ".mp-footer-v2", w: [280, 320, 390] },
  { name: "hero", url: "/", ovr: { showHome: true }, sel: ".home-today-verse", w: [280, 320, 360] },
  { name: "resume", url: "/", ovr: { showHome: true }, sel: ".home-resume-panel", w: [280, 320] },
  { name: "tabs", url: "/", ovr: { showHome: true }, sel: ".home-content-toolbar", w: [320, 768, 1280] },
  { name: "header-home", url: "/", ovr: { showHome: true }, sel: ".mp-header__bar", w: [280] },
];

const b = await chromium.launch();
for (const s of shots) {
  for (const w of s.w) {
    const ctx = await b.newContext({ serviceWorkers: "block", viewport: { width: w, height: 900 }, deviceScaleFactor: 3 });
    await ctx.addInitScript(seedFn(), { key: KEY, ovr: s.ovr });
    const p = await ctx.newPage();
    await p.goto(BASE + s.url, { waitUntil: "domcontentloaded" });
    await p.waitForSelector(".hp-card", { timeout: 25_000 }).catch(() => {});
    await p.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 15_000 }).catch(() => {});
    await p.waitForTimeout(2000);
    if (s.name === "footer") await p.locator(s.sel).scrollIntoViewIfNeeded().catch(() => {});
    await p.waitForTimeout(400);
    const el = p.locator(s.sel).first();
    const box = await el.boundingBox().catch(() => null);
    await el.screenshot({ path: `${OUT}/${s.name}-${w}.png` }).catch(async (e) => {
      console.log(`!! ${s.name}-${w}: ${String(e.message).slice(0, 70)}`);
    });
    console.log(`${s.name}-${w}: ${box ? `${box.width.toFixed(1)}x${box.height.toFixed(1)}` : "n/a"}`);
    await ctx.close();
  }
}
await b.close();
