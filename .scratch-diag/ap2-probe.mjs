// Scratch: tag + screenshot the home audio resume/history rows, both themes.
import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const browser = await chromium.launch();
for (const theme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript((a) => {
    localStorage.setItem("mushaf-plus-settings", JSON.stringify({ skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false, displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs", quranFontSize: 34, lang: "fr", theme: a.theme, lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } }));
    localStorage.setItem("mushaf_listening_history_v1", JSON.stringify([{ reciterId: "abu_bakr_ash_shaatree", surah: 2, updatedAt: Date.now() }, { reciterId: "ahmed_neana", surah: 18, updatedAt: Date.now() - 1000 }]));
    localStorage.setItem("mushaf_recitation_resume_v1", JSON.stringify({ surah: 2, ayah: 1, reciterId: "ghamadi_40", source: "manual", updatedAt: Date.now() }));
  }, { theme });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1200);
  await page.locator('[role="tab"]:has-text("Audio")').first().click();
  await page.waitForTimeout(1200);
  const info = await page.evaluate(() => {
    const section = document.querySelector(".home-content-section");
    const out = { buttons: [] };
    const panel = [...section.querySelectorAll("div")].find((d) => /Reprendre/.test(d.textContent || "") && d.className.includes("rounded-2xl"));
    if (panel) panel.id = "probe-panel";
    const row = [...section.querySelectorAll("div")].find((d) => /Récemment/.test(d.textContent || "") && !d.querySelector("div div"));
    if (row) row.id = "probe-history";
    for (const b of section.querySelectorAll("button")) {
      const t = (b.textContent || "").trim().replace(/\s+/g, " ");
      if (/Reprendre|Récemment|écouté|Al-|Ach|Neina|Nu/i.test(t) && t.length < 80) out.buttons.push(t);
    }
    const measure = (e) => { if (!e) return null; const c = getComputedStyle(e); return { bg: c.backgroundColor, bd: `${c.borderTopWidth} ${c.borderTopColor}`, color: c.color }; };
    out.panel = measure(panel);
    out.btn = measure(panel?.querySelector("button"));
    out.btnChip = measure([...(panel?.querySelectorAll("span") || [])].find((s) => /Vache|Fatiha/.test(s.textContent || "")));
    out.historyRow = measure(row);
    out.historyLabel = measure([...(row?.querySelectorAll("span") || [])][0]);
    out.historyChip = measure(row?.querySelector("button"));
    out.historyChipInner = measure([...(row?.querySelectorAll("span") || [])].find((s) => /Vache|Fatiha|Caverne/.test(s.textContent || "")));
    return out;
  });
  console.log(theme, JSON.stringify(info, null, 1));
  for (const [sel, name] of [["#probe-panel", "panel"], ["#probe-history", "history"]]) {
    const loc = page.locator(sel);
    if (await loc.count()) {
      await loc.screenshot({ path: `.scratch-diag/resp/ap2-${name}-${theme}.png` }).catch((e) => console.log("shot fail", name, e.message));
    } else console.log("missing", name);
  }
  await ctx.close();
}
await browser.close();
