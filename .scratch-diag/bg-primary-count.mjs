// Scratch: count elements whose bg-primary utility resolves to nothing. Not for commit.
import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const KEY = "mushaf-plus-settings";
const VIEWS = [
  { key: "home", url: "/" },
  { key: "reading", url: "/", click: ".home-quick-row button, .home-resume-panel__primary" },
];
const browser = await chromium.launch();
for (const w of [390, 1024]) {
  for (const v of VIEWS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    await page.addInitScript((k) => localStorage.setItem(k, JSON.stringify({
      skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false,
      displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
      quranFontSize: 34, lang: "fr", theme: "light", lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } })), KEY);
    await page.goto(`${BASE}${v.url}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(500);
    if (v.click) await page.click(v.click).catch(() => {});
    await page.waitForTimeout(1200);
    const r = await page.evaluate(() => {
      const dead = [];
      const ok = [];
      for (const e of document.querySelectorAll("[class*='bg-primary']")) {
        const cls = e.className.toString();
        if (!/(^|\s)bg-primary(\/\d+)?(\s|$)/.test(cls)) continue;
        const bg = getComputedStyle(e).backgroundColor;
        const rect = e.getBoundingClientRect();
        const painted = rect.width > 0 && rect.height > 0;
        (bg === "rgba(0, 0, 0, 0)" || bg === "transparent" ? dead : ok).push(
          `${e.tagName.toLowerCase()}.${cls.split(" ").filter(Boolean).slice(0, 3).join(".")}${painted ? "" : "(hidden)"} bg=${bg}`);
      }
      return { dead, okCount: ok.length, sample: ok.slice(0, 3) };
    });
    console.log(`\n### ${w}px ${v.key}: dead=${r.dead.length} ok=${r.okCount}`);
    for (const d of r.dead.slice(0, 12)) console.log("   DEAD " + d);
    for (const s of r.sample) console.log("   ok   " + s);
    await ctx.close();
  }
}
await browser.close();
