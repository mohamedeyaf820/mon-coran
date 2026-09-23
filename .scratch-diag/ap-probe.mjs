// Scratch: seed listening history + resume state, then measure the audio panel.
import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const browser = await chromium.launch();
for (const theme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1100 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript((a) => {
    localStorage.setItem("mushaf-plus-settings", JSON.stringify({ skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false, displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs", quranFontSize: 34, lang: "fr", theme: a.theme, lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } }));
    localStorage.setItem("mushaf_listening_history_v1", JSON.stringify([{ reciterId: "abu_bakr_ash_shaatree", surah: 2, updatedAt: Date.now() }, { reciterId: "ahmed_neana", surah: 18, updatedAt: Date.now() - 1000 }]));
    localStorage.setItem("mushaf_recitation_resume_v1", JSON.stringify({ surah: 2, ayah: 1, reciterId: "ghamadi_40", source: "manual", updatedAt: Date.now() }));
  }, { theme });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.locator('[role="tab"]:has-text("Audio")').first().click();
  await page.waitForTimeout(1500);
  const rows = await page.evaluate(() => {
    const out = [];
    const push = (tag, e) => { if (!e) return; const c = getComputedStyle(e); out.push({ tag, bg: c.backgroundColor, bd: c.borderTopWidth + " " + c.borderTopColor, color: c.color }); };
    const section = document.querySelector(".home-content-section");
    push("resume-panel", [...section.querySelectorAll("div")].find((d) => /Reprendre/.test(d.textContent || "") && d.className.includes("rounded-2xl")));
    push("resume-btn", [...section.querySelectorAll("button")].find((b) => /Reprendre/.test(b.textContent || "")));
    push("resume-chip", [...section.querySelectorAll("button span")].find((b) => /Vache|Al-Fatiha/.test(b.textContent || "")));
    push("history-chip", [...section.querySelectorAll("button")].find((b) => /Sha'atree|Chaatri|neana|Neana/i.test(b.textContent || "")));
    return out;
  });
  console.log(theme, JSON.stringify(rows, null, 1));
  await page.screenshot({ path: `.scratch-diag/resp/audio-panel-${theme}.png` });
  await ctx.close();
}
await browser.close();
