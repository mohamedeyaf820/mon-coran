import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
await page.addInitScript(() => {
  localStorage.setItem("mushaf-plus-settings", JSON.stringify({ skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false, displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs", quranFontSize: 34, lang: "fr", theme: "light", lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } }));
  localStorage.setItem("mushaf_recitation_resume_v1", JSON.stringify({ surah: 2, ayah: 1, reciterId: "ghamadi_40", source: "manual", updatedAt: Date.now() }));
});
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(1200);
await page.locator('[role="tab"]:has-text("Audio")').first().click();
await page.waitForTimeout(1200);
console.log(
  JSON.stringify(
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find((b) => /Reprendre/.test(b.textContent || ""));
      const hits = [];
      for (const sheet of document.styleSheets) {
        let rules;
        try {
          rules = sheet.cssRules;
        } catch {
          continue;
        }
        const walk = (list, layer) => {
          for (const r of list) {
            if (r.cssRules) {
              walk(r.cssRules, r.name ? `${layer || ""}/${r.name}` : layer);
              continue;
            }
            if (!r.selectorText || !r.style) continue;
            const bw = r.style.getPropertyValue("border-width") || r.style.getPropertyValue("border");
            if (!bw) continue;
            for (const sel of r.selectorText.split(",").map((s) => s.trim())) {
              const base = sel.replace(/:hover|:focus|:active|:where\([^)]*\)|::?[a-z-]+[^)]*/gi, "").trim();
              if (!base) continue;
              let m = false;
              try {
                m = btn.matches(base);
              } catch {}
              if (m) hits.push({ layer: layer || "(unlayered)", sel, bw, imp: r.style.getPropertyPriority("border-width") || r.style.getPropertyPriority("border") });
            }
          }
        };
        walk(rules, null);
      }
      return { width: getComputedStyle(btn).borderTopWidth, hits };
    }),
    null,
    1,
  ),
);
await browser.close();
