/**
 * Which CSS rule actually decides the download button's label visibility?
 */
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://127.0.0.1:4394";
const browser = await chromium.launch();
const ctx = await browser.newContext({ serviceWorkers: "block", viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => {
  localStorage.setItem(
    "mushaf-plus-settings",
    JSON.stringify({
      skipSplashAnimation: true, showHome: true, sidebarOpen: false, homeSection: "audio",
      riwaya: "hafs", fontFamily: "qpc-hafs", lang: "fr", theme: "light",
    }),
  );
  localStorage.setItem("mushaf-plus-onboarded", "1");
});
const page = await ctx.newPage();
await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForSelector('.home-content-toolbar [role="tab"]', { timeout: 30000 });
await page.locator('.home-content-toolbar [role="tab"]').nth(2).click();
await page.waitForTimeout(1400);
await page.locator(".reciter-card__main").first().click();
await page.waitForSelector(".recitation-row", { timeout: 15000 });
await page.waitForTimeout(1000);

const out = await page.evaluate(() => {
  const btn = document.querySelector(".recitation-action-btn--download");
  const label = btn?.querySelector(".recitation-action-btn__label");
  if (!btn) return { error: "no download button" };
  const cs = getComputedStyle(btn);
  const ls = getComputedStyle(label);
  return {
    btnClass: btn.className,
    btnWidth: `${Math.round(btn.getBoundingClientRect().width)}px`,
    btnDisplay: cs.display,
    labelDisplay: ls.display,
    labelWidth: `${Math.round(label.getBoundingClientRect().width)}px`,
    rowColumns: getComputedStyle(document.querySelector(".recitation-row")).gridTemplateColumns,
    copyWidth: `${Math.round(document.querySelector(".recitation-row__copy").getBoundingClientRect().width)}px`,
    sheets: [...document.styleSheets]
      .filter((s) => /recitation|app-system|responsive|device/.test(s.href || ""))
      .map((s) => s.href.split("/").pop()),
  };
});
console.log(JSON.stringify(out, null, 1));

// Does the source rule exist in the shipped CSS at all?
const css = await page.evaluate(async () => {
  const hits = [];
  for (const s of document.styleSheets) {
    if (!s.href) continue;
    let rules;
    try { rules = s.cssRules; } catch { continue; }
    for (const r of rules) {
      if (r.selectorText && r.selectorText.includes("recitation-action-btn--download")) {
        hits.push(`${s.href.split("/").pop()} :: ${r.cssText.slice(0, 130)}`);
      }
    }
  }
  return hits;
});
console.log(css.join("\n") || "(aucune règle --download dans le CSS servi)");
await ctx.close();
await browser.close();
