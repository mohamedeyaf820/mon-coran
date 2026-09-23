import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const browser = await chromium.launch();
for (const c of [
  { theme: "light", w: 1280, h: 900, tag: "wide-light" },
  { theme: "dark", w: 1280, h: 900, tag: "wide-dark" },
  { theme: "light", w: 390, h: 844, tag: "390-light" },
  { theme: "dark", w: 390, h: 844, tag: "390-dark" },
]) {
  const ctx = await browser.newContext({ viewport: { width: c.w, height: c.h }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript((a) => {
    localStorage.setItem("mushaf-plus-settings", JSON.stringify({ skipSplashAnimation: true, showHome: false, showDuas: false, sidebarOpen: false, displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs", quranFontSize: 34, lang: "fr", theme: a.theme, lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } }));
  }, c);
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1800);
  await page.locator('button:has-text("Continuer"), button:has-text("Resume reading"), button:has-text("استئناف القراءة")').first().click().catch(() => {});
  await page.waitForTimeout(2000);
  const info = await page.evaluate(() => {
    const e = document.querySelector(".reader-data-state");
    if (!e) return { missing: true, view: document.querySelector(".app-root")?.dataset.view };
    e.id = "probe-state";
    const m = (el) => { if (!el) return null; const s = getComputedStyle(el); return { bg: s.backgroundColor, bd: `${s.borderTopWidth} ${s.borderTopColor}`, color: s.color }; };
    return {
      card: m(e),
      msg: m([...e.querySelectorAll("p")][0]),
      btn1: m(e.querySelectorAll("button")[0]),
      btn2: m(e.querySelectorAll("button")[1]),
      src: m(e.querySelector(".reader-data-state__source")),
    };
  });
  console.log(c.tag, JSON.stringify(info));
  await page.locator("#probe-state").screenshot({ path: `.scratch-diag/resp/ds-${c.tag}.png`, timeout: 3000 }).catch((e) => console.log("shot fail", e.message.split("\n")[0]));
  await ctx.close();
}
await browser.close();
