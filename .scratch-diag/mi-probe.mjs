// scratch probe: measure candidate micro-labels (size + truncation room) across views
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const SETTINGS_KEY = "mushaf-plus-settings";
const OUT = ".scratch-diag/resp";
const SIZES = [280, 320, 390, 768, 1280];

const TARGETS = [
  ".settings-tab-button__label",
  ".mp-footer-v2__nav-label",
  ".mp-footer-v2__verse-translation",
  ".mp-footer-v2__credit",
  ".cpv-surah-name-tr",
  ".mp-header__title-transliteration",
  ".mp-header__title-meaning",
  ".home-today-verse__label",
  ".home-today-verse__reference",
  ".home-resume-panel__eyebrow",
  ".hp-card-type",
];

const browser = await chromium.launch();

async function boot(ovr) {
  const ctx = await browser.newContext({ serviceWorkers: "block", viewport: { width: 390, height: 780 } });
  await ctx.addInitScript(
    (a) => {
      localStorage.setItem(a.key, JSON.stringify({ skipSplashAnimation: true, showHome: true, sidebarOpen: false, homeSection: "surah", riwaya: "hafs", fontFamily: "qpc-hafs", ...a.ovr }));
    },
    { key: SETTINGS_KEY, ovr },
  );
  const page = await ctx.newPage();
  return { ctx, page };
}

const measure = (sel) => {
  const out = [];
  for (const s of sel) {
    for (const el of document.querySelectorAll(s)) {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (!r.width || cs.display === "none" || Number(cs.opacity) < 0.05) continue;
      out.push({
        s: s.replace(".", ""),
        t: (el.textContent || "").trim().slice(0, 22),
        fs: +parseFloat(cs.fontSize).toFixed(2),
        sw: el.scrollWidth,
        cw: Math.round(r.width),
        ell: cs.textOverflow,
        trunc: el.scrollWidth > Math.round(r.width) + 1,
      });
    }
  }
  const seen = new Set();
  return out.filter((x) => {
    const k = `${x.s}|${x.t}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

async function run(name, url, prep, shotPrefix) {
  const { ctx, page } = await boot({ lang: "fr", theme: "light" });
  await page.goto(BASE + url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 15000 }).catch(() => {});
  if (prep) await prep(page);
  for (const w of SIZES) {
    await page.setViewportSize({ width: w, height: w < 500 ? 780 : 1000 });
    await page.waitForTimeout(420);
    const res = await page.evaluate(measure, TARGETS);
    console.log(`\n## ${name} @${w}`);
    for (const x of res) console.log(`   ${x.fs}px ${x.trunc ? "TRUNC" : "  ok  "} ${x.sw}/${x.cw} ${x.s} “${x.t}”`);
    if (shotPrefix) await page.screenshot({ path: `${OUT}/${shotPrefix}-${w}.png`, timeout: 8000 }).catch(() => {});
  }
  await ctx.close();
}

await run("home", "/", async (p) => {
  await p.waitForSelector(".home-content-toolbar", { timeout: 25000 }).catch(() => {});
  await p.waitForTimeout(800);
}, "mi-home");

await run("read-mushaf", "/surah/2", async (p) => {
  await p.waitForSelector(".app-view-reading, .hp-card", { timeout: 25000 }).catch(() => {});
  await p.waitForTimeout(1200);
  const cont = p.locator("button", { hasText: /Continuer|Continue/ }).first();
  if (await cont.isVisible().catch(() => false)) {
    await cont.click().catch(() => {});
    await p.waitForTimeout(1500);
  }
  await p.waitForSelector(".quran-mode-pane--mushaf, .app-view-reading", { timeout: 15000 }).catch(() => {});
}, "mi-mushaf");

await run("settings", "/surah/2", async (p) => {
  await p.waitForSelector(".hp-card, .app-view-reading", { timeout: 25000 }).catch(() => {});
  await p.waitForTimeout(1200);
  const cont = p.locator("button", { hasText: /Continuer|Continue/ }).first();
  if (await cont.isVisible().catch(() => false)) {
    await cont.click().catch(() => {});
    await p.waitForTimeout(1500);
  }
  await p.waitForSelector(".mp-header__more", { timeout: 25000 }).catch(() => {});
  await p.locator(".mp-header__more").first().click().catch(() => {});
  await p.waitForTimeout(500);
  await p.locator('[data-key="settings"]').first().click().catch(() => {});
  await p.waitForTimeout(900);
}, "mi-settings");

await browser.close();
