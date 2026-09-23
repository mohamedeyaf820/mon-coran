import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const browser = await chromium.launch();
const cases = [
  { theme: "light", lang: "fr", w: 390, h: 844, tag: "390-light" },
  { theme: "dark", lang: "fr", w: 390, h: 844, tag: "390-dark" },
  { theme: "light", lang: "ar", w: 390, h: 844, tag: "390-ar" },
  { theme: "light", lang: "fr", w: 1280, h: 900, tag: "wide-light" },
];
for (const c of cases) {
  const ctx = await browser.newContext({ viewport: { width: c.w, height: c.h }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript((a) => {
    localStorage.setItem("mushaf-plus-settings", JSON.stringify({ skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false, displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs", quranFontSize: 34, lang: a.lang, theme: a.theme, lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } }));
    localStorage.setItem("mushaf_listening_history_v1", JSON.stringify([{ reciterId: "abu_bakr_ash_shaatree", surah: 2, updatedAt: Date.now() }, { reciterId: "ahmed_neana", surah: 18, updatedAt: Date.now() - 1000 }]));
    localStorage.setItem("mushaf_recitation_resume_v1", JSON.stringify({ surah: 2, ayah: 1, reciterId: "ghamadi_40", source: "manual", updatedAt: Date.now() }));
  }, c);
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1200);
  await page.locator('[role="tab"]:has-text("Audio"), [role="tab"]:has-text("الصوت"), [role="tab"]:has-text("Audio")').first().click();
  await page.waitForTimeout(1200);
  await page.evaluate(() => {
    const section = document.querySelector(".home-content-section");
    const panel = [...section.querySelectorAll("div")].find((d) => /Reprendre|استئناف|Resume/.test(d.textContent || "") && d.className.includes("rounded-2xl"));
    if (panel) panel.id = "probe-panel";
    const row = [...section.querySelectorAll("div")].find((d) => /Récemment|المستمع|Recently/.test(d.textContent || "") && !d.querySelector("div div"));
    if (row) row.id = "probe-history";
  });
  const overflow = await page.evaluate(() => {
    const out = [];
    for (const id of ["probe-panel", "probe-history"]) {
      const e = document.getElementById(id);
      if (!e) { out.push({ id, missing: true }); continue; }
      for (const el of [e, ...e.querySelectorAll("*")]) {
        const clipped = el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== "visible";
        const outside = el.getBoundingClientRect().right > window.innerWidth + 1 || el.getBoundingClientRect().left < -1;
        if (clipped || outside) out.push({ id, tag: el.tagName, cls: (el.className || "").slice(0, 60), text: (el.textContent || "").trim().slice(0, 40), clipped, outside, sw: el.scrollWidth, cw: el.clientWidth });
      }
      const b = e.querySelector("button");
      if (b) {
        const r = b.getBoundingClientRect();
        out.push({ id, touch: `${Math.round(r.width)}x${Math.round(r.height)}`, font: getComputedStyle(b).fontSize });
      }
    }
    return out;
  });
  console.log(c.tag, JSON.stringify(overflow));
  for (const id of ["probe-panel", "probe-history"]) {
    const loc = page.locator(`#${id}`);
    if (await loc.count()) await loc.screenshot({ path: `.scratch-diag/resp/ap4-${id}-${c.tag}.png` }).catch((e) => console.log("shot fail", id, e.message));
  }
  await ctx.close();
}
await browser.close();
