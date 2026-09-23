// Scratch screenshot probe. Not for commit.
import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:4187";
const KEY = "mushaf-plus-settings";

function seedFn() {
  return (args) => {
    localStorage.setItem(
      args.key,
      JSON.stringify({
        skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false,
        displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
        quranFontSize: 34, lang: "fr", theme: "light",
        lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 }, ...args.overrides,
      }),
    );
  };
}

const SHOTS = [
  { name: "home-library", url: "/", w: 280, h: 900, ovr: { showHome: true }, wait: ".home-resume-panel__library", clip: ".home-resume-panel" },
  { name: "mode-nav", url: "/surah/2", w: 280, h: 900, ovr: { showHome: false, mushafLayout: "list" }, wait: ".reader-mode-nav", clip: ".reader-mode-nav" },
  { name: "bismillah", url: "/surah/2", w: 320, h: 900, ovr: { showHome: false, mushafLayout: "mushaf" }, wait: ".bismillah-translation", clip: ".bismillah-translation" },
  { name: "audio-track", url: "/surah/2", w: 768, h: 900, ovr: { showHome: false, mushafLayout: "mushaf" }, wait: ".app-view-reading", btn: ".srh-fullscreen-btn, .reader-fullscreen-trigger", clip: ".mfp-audio-track" },
];

const b = await chromium.launch();
for (const s of SHOTS) {
  const ctx = await b.newContext({ serviceWorkers: "block", viewport: { width: s.w, height: s.h }, deviceScaleFactor: 2 });
  await ctx.addInitScript(seedFn(), { key: KEY, overrides: s.ovr });
  const p = await ctx.newPage();
  await p.goto(BASE + s.url, { waitUntil: "domcontentloaded" });
  await p.waitForSelector(s.wait, { timeout: 25_000 }).catch(() => {});
  await p.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 15_000 }).catch(() => {});
  if (s.btn) {
    await p.locator(s.btn).first().click({ timeout: 5000 }).catch(() => {});
    await p.waitForTimeout(2500);
  }
  await p.waitForTimeout(1200);
  const info = await p.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const leaf = [...el.querySelectorAll("*")].find((n) => n.children.length === 0) || el;
    return { box: [r.width, r.height], fs: getComputedStyle(leaf).fontSize, scrollW: leaf.scrollWidth, clientW: leaf.clientWidth };
  }, s.clip);
  console.log(s.name, JSON.stringify(info));
  const target = await p.locator(s.clip).first();
  await target.screenshot({ path: `.scratch-diag/resp/shot-${s.name}.png` }).catch(async (e) => {
    console.log(s.name, "clip failed:", e.message.slice(0, 60));
    await p.screenshot({ path: `.scratch-diag/resp/shot-${s.name}.png` });
  });
  await ctx.close();
}
await b.close();
