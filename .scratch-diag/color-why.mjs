import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
await page.addInitScript(() => {
  localStorage.setItem("mushaf-plus-settings", JSON.stringify({ skipSplashAnimation: true, showHome: false, showDuas: false, sidebarOpen: false, displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs", quranFontSize: 34, lang: "fr", theme: "light", lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } }));
  localStorage.setItem("forceState", "error");
});
await page.goto(process.env.BASE_URL || "http://127.0.0.1:4194/", { waitUntil: "domcontentloaded" });
await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(2500);
await page.locator('button:has-text("Continuer")').first().click().catch(() => {});
await page.waitForTimeout(2000);
console.log(JSON.stringify(await page.evaluate(() => {
  const el = document.querySelector(".reader-data-state p");
  if (!el) return { missing: true };
  const hits = [];
  const walk = (rules, layer) => {
    for (const r of rules) {
      if (r.cssRules && !(r instanceof CSSStyleRule)) { walk(r.cssRules, r.name ? `${layer}|${r.name}` : layer); continue; }
      if (!r.selectorText || !r.style) continue;
      const c = r.style.getPropertyValue("color");
      if (!c) continue;
      for (const sel of r.selectorText.split(",").map((s) => s.trim())) {
        const base = sel.replace(/:hover|:focus-visible|:focus|:active|:not\([^)]*\)|::?[a-z-]+(\([^)]*\))?/gi, "").trim();
        if (!base) continue;
        let m = false; try { m = el.matches(base); } catch {}
        if (m) hits.push({ layer: layer || "unlayered", sel, c, imp: r.style.getPropertyPriority("color") });
      }
    }
  };
  for (const s of document.styleSheets) { try { walk(s.cssRules, ""); } catch {} }
  return { color: getComputedStyle(el).color, cls: el.className, mpLight: getComputedStyle(document.documentElement).getPropertyValue("--mp-light-primary"), themeAttr: [document.documentElement.dataset.theme, document.querySelector(".app-root")?.dataset.theme], hits };
})));
await browser.close();
