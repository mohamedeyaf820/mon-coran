// Scratch responsive probe. Not for commit.
// Usage: node .scratch-diag/resp-sweep.mjs [--profiles=fr-light,ar-dark] [--views=home,reading]
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://127.0.0.1:4187";
const SETTINGS_KEY = "mushaf-plus-settings";
const OUT = ".scratch-diag/resp";
mkdirSync(OUT, { recursive: true });

const DEFAULT_SIZES = [280, 320, 360, 390, 414, 768, 1024, 1280, 1440, 1920];
const PROFILES = {
  "fr-light": { lang: "fr", theme: "light", dir: "ltr" },
  "ar-dark": { lang: "ar", theme: "dark", dir: "rtl" },
};

const argv = process.argv.slice(2).reduce((a, s) => {
  const m = s.match(/^--(\w+)=(.*)$/);
  if (m) a[m[1]] = m[2];
  return a;
}, {});

const RAW = argv.raw || "raw.json";
const profiles = (argv.profiles || Object.keys(PROFILES).join(",")).split(",");
const viewFilter = argv.views ? argv.views.split(",") : null;
const SIZES = argv.sizes ? argv.sizes.split(",").map(Number) : DEFAULT_SIZES;

// `skipSplashAnimation` n'est honoré que sous navigator.webdriver (Playwright).
function seedFn() {
  return (args) => {
    const { key, overrides } = args;
    try {
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
          lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 },
          ...overrides,
        }),
      );
      window.__seedError = null;
    } catch (e) {
      window.__seedError = String(e);
    }
  };
}

// The measurement core: runs in the page and returns raw findings.
function collect() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const doc = document.documentElement;

  const visible = (el, cs) => {
    if (cs.display === "none" || cs.visibility === "hidden") return false;
    if (Number(cs.opacity) < 0.05) return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  };

  const label = (el) => {
    const text = (el.innerText || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
    const cls = typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".") : "";
    return `${el.tagName.toLowerCase()}${cls}${text ? ` “${text}”` : ""}`;
  };

  const res = {
    w: vw,
    h: vh,
    seed: window.__seedError || null,
    appView: doc.querySelector(".app-root")?.getAttribute("data-view") || null,
    theme: doc.getAttribute("data-theme"),
    dir: doc.getAttribute("dir") || doc.querySelector(".app-root")?.getAttribute("data-dir"),
    rootFs: Number.parseFloat(getComputedStyle(doc).fontSize),
    scrollH: doc.scrollHeight,
    overflowX: Math.max(0, doc.scrollWidth - vw),
    overflowers: [],
    small: [],
    clipped: [],
    tinyText: [],
    outside: [],
    tallFixed: [],
  };

  const all = [...doc.querySelectorAll("body *")];

  const INTERACTIVE =
    'button,a[href],area,[role="button"],[role="tab"],[role="checkbox"],[role="switch"],[role="menuitem"],[role="menuitemcheckbox"],[role="option"],[role="slider"],[role="link"],summary,input:not([type="hidden"]),select,textarea,[onclick],[data-action]';

  // Elements deliberately parked off-screen (closed drawers, skip links).
  const OFFSCREEN = (el, r) =>
    el.closest(".app-skip-link, [class*='sr-only']") ||
    r.left < -20 ||
    r.right > vw + 20 && getComputedStyle(el).position === "fixed";

  for (const el of all) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    if (Number(cs.opacity) < 0.05) continue;
    const r = el.getBoundingClientRect();
    if (r.width <= 1 || r.height <= 1) continue;

    if (cs.position === "fixed") {
      if (r.height > vh + 1 || r.width > vw + 1) {
        res.tallFixed.push({ el: label(el), w: +r.width.toFixed(1), h: +r.height.toFixed(1) });
      }
    }

    if (r.right > vw + 1) {
      const hasText = (el.innerText || "").trim().length > 0;
      const flow = cs.position !== "absolute" && cs.position !== "fixed";
      const clips = cs.overflowX !== "visible" || el.closest("[style*='overflow']");
      if ((hasText || flow) && !clips) {
        res.outside.push({ el: label(el), left: +r.left.toFixed(1), right: +r.right.toFixed(1), pos: cs.position });
      }
    }
  }

  for (const el of doc.querySelectorAll(INTERACTIVE)) {
    const cs = getComputedStyle(el);
    if (cs.display === "inline" && el.tagName === "A") continue; // prose links
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    if (r.width >= 43.5 && r.height >= 43.5) continue;
    if (r.width < 5 || r.height < 5) continue; // display:none via media query
    if (OFFSCREEN(el, r)) continue;
    if (el.matches(".quran-word-item, .native-ayah-marker, .word-item, [data-word-index]")) {
      res.small.push({ el: label(el), w: +r.width.toFixed(1), h: +r.height.toFixed(1), kind: "word" });
      continue;
    }
    // Ancestor already gives a 44px+ hit area covering this element?
    let anc = el.parentElement, covered = false;
    while (anc) {
      if (anc.matches && anc.matches(INTERACTIVE)) {
        const acs = getComputedStyle(anc);
        const ar = anc.getBoundingClientRect();
        if (acs.display !== "inline" && ar.width >= 43.5 && ar.height >= 43.5 &&
            ar.left <= r.left + 1 && ar.right >= r.right - 1 &&
            ar.top <= r.top + 1 && ar.bottom >= r.bottom - 1) covered = true;
        break;
      }
      anc = anc.parentElement;
    }
    if (covered) continue;
    res.small.push({
      el: label(el),
      w: +r.width.toFixed(1),
      h: +r.height.toFixed(1),
      kind: el.disabled === true || el.getAttribute("aria-disabled") === "true" ? "disabled" : "control",
      minHeight: cs.minHeight,
      inHashRoot: !!el.closest("#root"),
      bodyChild: (() => { let a = el; while (a.parentElement && a.parentElement !== document.body) a = a.parentElement; return a.id || a.className.split(" ")[0] || a.tagName; })(),
      height: cs.height,
      inRoot: !!el.closest(".app-root"),
    });
  }

  for (const el of all) {
    const cs = getComputedStyle(el);
    if (!visible(el, cs)) continue;
    const hasOwnText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);
    if (!hasOwnText) continue;
    const r = el.getBoundingClientRect();
    if (OFFSCREEN(el, r)) continue;
    if (el.scrollWidth > el.clientWidth + 1 && cs.overflowX !== "visible") {
      res.clipped.push({
        el: label(el),
        lost: el.scrollWidth - el.clientWidth,
        ellipsis: cs.textOverflow === "ellipsis",
        ws: cs.whiteSpace,
        w: +r.width.toFixed(1),
      });
    }
    if (el.scrollHeight > el.clientHeight + 2 && cs.overflowY === "hidden" && cs.lineClamp === "none") {
      res.clipped.push({ el: label(el), lost: el.scrollHeight - el.clientHeight, axis: "y", ellipsis: false, w: +r.width.toFixed(1) });
    }
    const fs = Number.parseFloat(cs.fontSize);
    if (fs > 0 && fs < 10.5) res.tinyText.push({ el: label(el), fs: +fs.toFixed(2) });
  }

  if (res.overflowX > 1) {
    for (const el of all) {
      const cs = getComputedStyle(el);
      if (!visible(el, cs)) continue;
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1) {
        const kidsInside = [...el.children].some((c) => c.getBoundingClientRect().right > vw + 1);
        if (!kidsInside) res.overflowers.push({ el: label(el), right: +r.right.toFixed(1) });
      }
    }
  }

  res.tallFixed = res.tallFixed.slice(0, 10);
  res.overflowers = res.overflowers.slice(0, 12);
  res.outside = res.outside.slice(0, 12);
  res.small = res.small.slice(0, 60);
  res.clipped = res.clipped.slice(0, 40);
  res.tinyText = res.tinyText.slice(0, 40);
  return res;
}

const views = [
  { key: "home-surah", url: "/", ovr: { showHome: true }, wait: ".hp-card" },
  { key: "home-juz", url: "/", ovr: { showHome: true }, wait: '.home-content-toolbar [role="tab"]', tab: 1 },
  { key: "home-audio", url: "/", ovr: { showHome: true }, wait: '.home-content-toolbar [role="tab"]', tab: 2 },
  { key: "reciter-detail", url: "/", ovr: { showHome: true }, wait: '.home-content-toolbar [role="tab"]', pre: [{ tab: 2 }, { wait: ".reciter-card__main" }, { click: ".reciter-card__main" }] },
  { key: "read-list", url: "/surah/2", ovr: { showHome: false, mushafLayout: "list" }, wait: ".qc-ayah-text-ar" },
  { key: "read-mushaf", url: "/surah/2", ovr: { showHome: false, mushafLayout: "mushaf" }, wait: ".app-view-reading" },
  { key: "read-page", url: "/page/50", ovr: { showHome: false, displayMode: "page" }, wait: ".app-view-reading" },
  { key: "read-juz", url: "/juz/3", ovr: { showHome: false, displayMode: "juz" }, wait: ".app-view-reading" },
  { key: "fullscreen", url: "/surah/2", ovr: { showHome: false, mushafLayout: "mushaf" }, wait: ".app-view-reading", btn: ".srh-fullscreen-btn, .reader-fullscreen-trigger" },
  { key: "search", url: "/surah/2", ovr: { showHome: false }, wait: ".mp-header__search", btn: ".mp-header__search" },
  { key: "library", url: "/surah/2", ovr: { showHome: false }, wait: ".mp-header__more", btn: ".mp-header__more", then: '[data-key="library"]' },
  { key: "settings", url: "/surah/2", ovr: { showHome: false }, wait: ".mp-header__more", btn: ".mp-header__more", then: '[data-key="settings"]' },
  { key: "sidebar", url: "/surah/2", ovr: { showHome: false }, wait: ".mp-header__icon-btn", btn: ".mp-header__icon-btn" },
  { key: "duas", url: "/duas", ovr: { showHome: false, showDuas: true }, wait: ".duas-page" },
  { key: "about", url: "/about", ovr: { showHome: false }, wait: ".app-view-legal" },
  { key: "notfound", url: "/zz-404", ovr: { showHome: false }, wait: ".app-view-not-found" },
];

const report = [];
const browser = await chromium.launch();

for (const pk of profiles) {
  const prof = PROFILES[pk];
  for (const view of views) {
    if (viewFilter && !viewFilter.includes(view.key)) continue;
    const ctx = await browser.newContext({ serviceWorkers: "block", viewport: { width: 1280, height: 900 } });
    await ctx.addInitScript(seedFn(), {
      key: SETTINGS_KEY,
      overrides: { lang: prof.lang, theme: prof.theme, ...view.ovr },
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 120)));
    try {
      await page.goto(BASE + view.url, { waitUntil: "domcontentloaded" });
      await page.waitForSelector(view.wait, { timeout: 25_000 });
      await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 15_000 }).catch(() => {});
      await page.waitForTimeout(700);

      for (const step of view.pre || []) {
        if (step.tab != null) {
          await page.locator('.home-content-toolbar [role="tab"]').nth(step.tab).click({ timeout: 5000 }).catch(() => {});
        } else if (step.wait) {
          await page.waitForSelector(step.wait, { timeout: 15_000 }).catch(() => {});
        } else if (step.click) {
          await page.locator(step.click).first().click({ timeout: 5000 }).catch(() => {});
        }
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
      if (view.click) await page.locator(view.click).first().click({ timeout: 4000 }).catch(() => {});
      await page.waitForTimeout(500);

      for (const w of SIZES) {
        await page.setViewportSize({ width: w, height: w < 500 ? 780 : 1000 });
        await page.waitForTimeout(450);
        const m = await page.evaluate(collect).catch((e) => ({ error: String(e).slice(0, 150) }));
        report.push({ profile: pk, view: view.key, w, ...m });
      }
    } catch (e) {
      report.push({ profile: pk, view: view.key, w: 0, error: String(e.message).slice(0, 200), errors });
    }
    if (errors.length) report.at(-1).pageErrors = [...new Set(errors)].slice(0, 3);
    await ctx.close();
  }
}

await browser.close();
writeFileSync(`${OUT}/${RAW}`, JSON.stringify(report, null, 1));

// ---- console summary ----
const rows = report.filter((r) => !r.error);
let findings = 0;
for (const r of rows) {
  const small = r.small.filter((x) => x.kind === "control");
  const words = r.small.filter((x) => x.kind === "word");
  const clip = r.clipped.filter((x) => !x.ellipsis && x.axis !== "y");
  const clipY = r.clipped.filter((x) => !x.ellipsis && x.axis === "y");
  const lines = [];
  if (r.overflowX > 1) lines.push(`overflowX ${r.overflowX}px :: ` + JSON.stringify(r.overflowers.slice(0, 3)));
  if (r.overflowX <= 1 && r.outside.length) lines.push(`painted past right edge :: ` + r.outside.slice(0, 3).map((x) => `${x.el} [${x.left}..${x.right}]`).join(" | "));
  if (small.length) lines.push(`targets<44 (${small.length}) ::\n` + small.slice(0, 10).map((x) => `    ${x.w}x${x.h}  ${x.el}`).join("\n"));
  if (clip.length) lines.push(`clipped-x (${clip.length}) ::\n` + clip.slice(0, 6).map((x) => `    -${x.lost}px  ${x.el}`).join("\n"));
  if (clipY.length) lines.push(`clipped-y (${clipY.length}) ::\n` + clipY.slice(0, 4).map((x) => `    -${x.lost}px  ${x.el}`).join("\n"));
  if (r.tinyText.length) lines.push(`tiny text (${r.tinyText.length}) ::\n` + r.tinyText.slice(0, 6).map((x) => `    ${x.fs}px  ${x.el}`).join("\n"));
  if (r.tallFixed.length) lines.push(`fixed > viewport :: ` + r.tallFixed.map((x) => `${x.el} ${x.w}x${x.h}`).join(" | "));
  if (words.length) lines.push(`(mots cliquables <44: ${words.length}, plus petit ${Math.min(...words.map((x) => x.w)).toFixed(1)}px)`);
  if (lines.length) {
    findings += 1;
    console.log(`\n## ${r.profile} / ${r.view} @ ${r.w}px  [app=${r.appView} theme=${r.theme} dir=${r.dir} root=${r.rootFs}px]`);
    console.log(lines.join("\n"));
  }
}
console.log(`\n=== ${rows.length} mesures, ${findings} configurations avec constats, ${report.filter((r) => r.error).length} erreurs de navigation ===`);
const errs = report.filter((r) => r.error || (r.pageErrors && r.pageErrors.length));
if (errs.length) console.log("ERREURS:", JSON.stringify(errs.map((e) => ({ v: e.view, p: e.profile, w: e.w, error: e.error, pe: e.pageErrors })), null, 1));
