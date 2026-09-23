// Scratch regression captures for the app-wide 44px touch-target floor. Not for commit.
// Usage: node .scratch-diag/resp-regress.mjs [--w=320,1280] [--views=home-surah,settings]
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = "http://127.0.0.1:4187";
const SETTINGS_KEY = "mushaf-plus-settings";
const OUT = process.env.OUTDIR || ".scratch-diag/resp/shots-regress";
mkdirSync(OUT, { recursive: true });

const argv = process.argv.slice(2).reduce((a, s) => {
  const m = s.match(/^--(\w+)=(.*)$/);
  if (m) a[m[1]] = m[2];
  return a;
}, {});
const WIDTHS = (argv.w || "320,1280").split(",").map(Number);
const VIEWFILTER = argv.views ? argv.views.split(",") : null;

function seedFn() {
  return (args) => {
    const { key, overrides } = args;
    localStorage.setItem(
      key,
      JSON.stringify({
        skipSplashAnimation: true,
        showHome: true,
        showDuas: false,
        sidebarOpen: false,
        displayMode: "surah",
        mushafLayout: "list",
        homeSection: "surah",
        riwaya: "hafs",
        fontFamily: "qpc-hafs",
        quranFontSize: 34,
        lang: "fr",
        theme: "light",
        lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 },
        ...overrides,
      }),
    );
  };
}

// Same click paths the measurement sweep uses, so both look at identical states.
const views = [
  { key: "home-surah", url: "/", ovr: { showHome: true }, wait: ".hp-card" },
  { key: "home-audio", url: "/", ovr: { showHome: true }, wait: '.home-content-toolbar [role="tab"]', tab: 2 },
  {
    key: "reciter-detail",
    url: "/",
    ovr: { showHome: true },
    wait: '.home-content-toolbar [role="tab"]',
    pre: [{ tab: 2 }, { wait: ".reciter-card__main" }, { click: ".reciter-card__main" }],
  },
  { key: "read-list", url: "/surah/2", ovr: { showHome: false, mushafLayout: "list" }, wait: ".qc-ayah-text-ar" },
  { key: "read-mushaf", url: "/surah/2", ovr: { showHome: false, mushafLayout: "mushaf" }, wait: ".app-view-reading" },
  {
    key: "fullscreen",
    url: "/surah/2",
    ovr: { showHome: false, mushafLayout: "mushaf" },
    wait: ".app-view-reading",
    btn: ".srh-fullscreen-btn, .reader-fullscreen-trigger",
  },
  { key: "search", url: "/surah/2", ovr: { showHome: false }, wait: ".mp-header__search", btn: ".mp-header__search" },
  { key: "library", url: "/surah/2", ovr: { showHome: false }, wait: ".mp-header__more", btn: ".mp-header__more", then: '[data-key="library"]' },
  { key: "settings", url: "/surah/2", ovr: { showHome: false }, wait: ".mp-header__more", btn: ".mp-header__more", then: '[data-key="settings"]' },
  { key: "sidebar", url: "/surah/2", ovr: { showHome: false }, wait: ".mp-header__icon-btn", btn: ".mp-header__icon-btn" },
  { key: "duas", url: "/duas", ovr: { showHome: false, showDuas: true }, wait: ".duas-page" },
  { key: "about", url: "/about", ovr: { showHome: false }, wait: ".app-view-legal" },
];

const browser = await chromium.launch();

for (const view of views) {
  if (VIEWFILTER && !VIEWFILTER.includes(view.key)) continue;
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({
      serviceWorkers: "block",
      viewport: { width: w, height: w < 500 ? 780 : 1000 },
      deviceScaleFactor: 2,
    });
    await ctx.addInitScript(seedFn(), { key: SETTINGS_KEY, overrides: view.ovr });
    const page = await ctx.newPage();
    const name = `${view.key}-${w}`;
    try {
      await page.goto(BASE + view.url, { waitUntil: "domcontentloaded" });
      await page.waitForSelector(view.wait, { timeout: 25_000 });
      await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 15_000 }).catch(() => {});
      await page.waitForTimeout(700);

      for (const step of view.pre || []) {
        if (step.tab != null) await page.locator('.home-content-toolbar [role="tab"]').nth(step.tab).click({ timeout: 5000 }).catch(() => {});
        else if (step.wait) await page.waitForSelector(step.wait, { timeout: 15_000 }).catch(() => {});
        else if (step.click) await page.locator(step.click).first().click({ timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(800);
      }
      if (typeof view.tab === "number") {
        await page.locator('.home-content-toolbar [role="tab"]').nth(view.tab).click({ timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(900);
      }
      for (const sel of [view.btn, view.then].filter(Boolean)) {
        const loc = page.locator(sel).first();
        if (await loc.isVisible().catch(() => false)) {
          await loc.click({ timeout: 4000 }).catch(() => {});
          await page.waitForTimeout(700);
        }
      }
      await page.waitForTimeout(500);

      // Report what the floor actually did to the pressables on screen, so the
      // image and the numbers are read together.
      const summary = await page.evaluate(() => {
        const q = 'button,a[href],[role="button"],[role="tab"],[role="switch"],[role="menuitem"],summary,select,textarea,input:not([type="hidden"])';
        let n = 0;
        const under = new Set();
        for (const el of document.querySelectorAll(q)) {
          const cs = getComputedStyle(el);
          if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) < 0.05) continue;
          const r = el.getBoundingClientRect();
          if (r.width <= 1 || r.height <= 1) continue;
          n++;
          if (r.height < 43.5 && !el.closest(".qcm-line,.qcm-word,.quran-text,.ayah-text")) {
            const cls = typeof el.className === "string" ? el.className.trim().split(/\s+/)[0] : "";
            under.add(`${el.tagName.toLowerCase()}.${cls} ${r.height.toFixed(1)}`);
          }
        }
        return { count: n, under: [...under].slice(0, 12), overflowX: document.documentElement.scrollWidth - window.innerWidth };
      });
      await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
      console.log(
        `${name}: pressables=${summary.count} overflowX=${summary.overflowX}${summary.under.length ? " UNDER:" + summary.under.join(" | ") : ""}`,
      );
    } catch (e) {
      console.log(`!! ${name}: ${String(e.message).slice(0, 100)}`);
    }
    await ctx.close();
  }
}

await browser.close();
console.log("OK");
