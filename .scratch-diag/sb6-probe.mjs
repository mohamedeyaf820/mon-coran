import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const browser = await chromium.launch();
for (const theme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript((a) => {
    localStorage.setItem("mushaf-plus-settings", JSON.stringify({ skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: true, displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs", quranFontSize: 34, lang: "fr", theme: a.theme, lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } }));
  }, { theme });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.locator('button[aria-label*="menu" i], button[aria-label*="Menu" i], .mp-header__menu, #header-menu-toggle').first().click().catch(() => {});
  await page.waitForTimeout(900);
  const out = await page.evaluate(() => {
    const sb = document.getElementById("sidebar") || document.querySelector(".sb-wrapper");
    if (!sb) return { missing: true };
    const m = (el) => { if (!el) return null; const s = getComputedStyle(el); return { bg: s.backgroundColor, bt: `${s.borderTopWidth} ${s.borderTopColor}`, bb: `${s.borderBottomWidth} ${s.borderBottomColor}`, bl: `${s.borderLeftWidth} ${s.borderLeftColor}`, color: s.color }; };
    const pick = (sel) => m(sb.querySelector(sel));
    return {
      header: m([...sb.querySelectorAll("div")].find((d) => d.className.includes("border-b") && d.className.includes("border-border"))),
      closeBtn: m(sb.querySelector(".sidebar-close-button")),
      tabList: m(sb.querySelector(".sidebar-tab-list")),
      input: m(sb.querySelector("input")),
      badge: m([...sb.querySelectorAll("div")].find((d) => d.className.includes("border-border/40"))),
    };
  });
  console.log(theme, JSON.stringify(out));
  await page.locator("#sidebar, .sb-wrapper").first().screenshot({ path: `.scratch-diag/resp/sb6-${theme}.png`, timeout: 4000 }).catch((e) => console.log("shot fail", e.message.split("\n")[0]));
  await ctx.close();
}
await browser.close();
