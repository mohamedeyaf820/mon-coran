// Responsive sweep: horizontal overflow, partly off-screen elements, small touch
// targets and clipped text, on every screen x viewport x theme x language.
//
//   node .claude/skills/app-full-review/scripts/responsive-sweep.mjs \
//     [base=http://127.0.0.1:4173] [vp=320,390,1440] [theme=light,dark] [lang=fr,ar] [only=home,surah2] [shots=1]
//
// Needs a production build served at `base` (npm run build && npx vite preview).
// The reader screens call the public Quran APIs: mock them with
// tests/e2e/helpers/quran-network-fixtures.mjs when the result must be deterministic.
import { chromium } from "playwright";
import fs from "node:fs";

const arg = Object.fromEntries(process.argv.slice(2).map((a) => a.split("=")));
const BASE = arg.base || "http://127.0.0.1:4173";
const VIEWPORTS = [[320, 640], [360, 740], [375, 667], [390, 844], [430, 932], [768, 1024], [1024, 768], [1440, 900], [1920, 1080], [2560, 1440]];
const widths = (arg.vp || VIEWPORTS.map((v) => v[0]).join(",")).split(",").map(Number);
const themes = (arg.theme || "light").split(",");
const langs = (arg.lang || "fr").split(",");
const only = arg.only ? arg.only.split(",") : null;
// [name, path, key pressed once loaded]. The shortcuts exist on keyboard shells only.
const SCREENS = [
  ["home", "/"], ["surah2", "/surah/2"], ["surah1", "/surah/1"], ["page1", "/page/1"], ["juz1", "/juz/1"],
  ["duas", "/duas"], ["prieres", "/prieres"], ["about", "/about"], ["privacy", "/privacy"],
  ["sources", "/sources"], ["surahs", "/surahs"], ["404", "/xyz-nope"],
  ["search", "/surah/1", "/"], ["settings", "/surah/1", ","], ["library", "/surah/1", "b"],
];

function audit() {
  const vw = innerWidth;
  const vh = innerHeight;
  const sig = (el) => {
    const c = [...el.classList].slice(0, 3).join(".");
    const l = el.getAttribute("aria-label") || el.getAttribute("title") || (el.textContent || "").trim().slice(0, 24);
    return el.tagName.toLowerCase() + (c ? "." + c : "") + (l ? ` «${l}»` : "");
  };
  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || +cs.opacity === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const insideClip = (el) => {
    for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
      if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(p).overflowX) && p.scrollWidth >= p.clientWidth) return p !== document.body;
    }
    return false;
  };
  const res = { docOverflow: document.documentElement.scrollWidth - vw, over: [], small: [], clip: [] };
  const all = [...document.querySelectorAll("body *")];
  for (const el of all) {
    if (!visible(el) || el.closest("svg")) continue;
    const r = el.getBoundingClientRect();
    if (((r.right > vw + 1 && r.left < vw - 1) || (r.left < -1 && r.right > 1)) && !insideClip(el)) {
      res.over.push(sig(el) + ` [${Math.round(r.left)}..${Math.round(r.right)}]`);
    }
  }
  if (vw <= 1024) {
    const controls = "button,[role=button],[role=tab],[role=menuitem],input:not([type=hidden]),select,textarea,a[href]";
    for (const el of document.querySelectorAll(controls)) {
      if (!visible(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;
      if (r.width < 40 || r.height < 40) res.small.push(sig(el) + ` ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
  }
  for (const el of all) {
    if (!visible(el) || el.children.length) continue;
    if (!(el.textContent || "").trim()) continue;
    const cs = getComputedStyle(el);
    if (el.scrollWidth > el.clientWidth + 2 && /(hidden|clip)/.test(cs.overflowX) && cs.textOverflow !== "ellipsis") {
      res.clip.push(sig(el) + ` ${el.scrollWidth}>${el.clientWidth}`);
    }
  }
  return res;
}

const browser = await chromium.launch();
const results = [];
fs.mkdirSync("test-results/responsive-sweep", { recursive: true });
for (const w of widths) {
  const h = VIEWPORTS.find((v) => v[0] === w)?.[1] || 800;
  for (const theme of themes) {
    for (const lang of langs) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w <= 1024, hasTouch: w <= 1024, serviceWorkers: "block" });
      const page = await ctx.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message.slice(0, 120)));
      await page.addInitScript(([t, l]) => {
        localStorage.setItem("mushaf-plus-settings", JSON.stringify({ skipSplashAnimation: true, theme: t, lang: l, riwaya: "hafs", sidebarOpen: false }));
      }, [theme, lang]);
      for (const [name, url, key] of SCREENS) {
        if (only && !only.includes(name)) continue;
        if (key && w <= 1024) continue; // keyboard shortcuts are for keyboard shells
        await page.goto(BASE + url, { waitUntil: "load" });
        await page.waitForFunction(() => document.documentElement.dataset.deferredStyles === "ready", null, { timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(/^(surah|page|juz)/.test(name) ? 3500 : 1200);
        if (key) {
          await page.keyboard.press(key);
          await page.waitForTimeout(1000);
        }
        const r = await page.evaluate(audit);
        if (arg.shots === "1" || r.docOverflow > 1 || r.over.length) {
          await page.screenshot({ path: `test-results/responsive-sweep/${name}_${w}_${theme}_${lang}.png` });
        }
        results.push({ name, w, theme, lang, ...r, errors: errors.splice(0) });
      }
      await ctx.close();
    }
  }
}
await browser.close();

const group = (k) => {
  const m = new Map();
  for (const r of results) {
    for (const s of r[k]) {
      const key = s.replace(/ \[.*\]| \d+x\d+| \d+>\d+/, "");
      const e = m.get(key) || { n: 0, ex: s, at: new Set() };
      e.n += 1;
      e.at.add(`${r.name}@${r.w}`);
      m.set(key, e);
    }
  }
  return [...m.values()].sort((a, b) => b.n - a.n);
};
console.log(`pages: ${results.length}`);
const overflowing = results.filter((r) => r.docOverflow > 1).map((r) => `${r.name}@${r.w}/${r.theme}/${r.lang} +${r.docOverflow}`);
console.log("DOCUMENT OVERFLOW:", overflowing.join(", ") || "none");
for (const [title, k] of [["OFF-SCREEN ELEMENTS", "over"], ["SMALL TARGETS (<40px)", "small"], ["CLIPPED TEXT", "clip"]]) {
  console.log(`\n${title}:`);
  const g = group(k).slice(0, 25);
  if (!g.length) console.log("  none");
  for (const e of g) console.log(`  ${String(e.n).padStart(3)}x ${e.ex.slice(0, 100)} | ${[...e.at].slice(0, 5).join(",")}`);
}
const withErrors = results.filter((r) => r.errors.length).map((r) => `${r.name}@${r.w}: ${r.errors.join(" ; ")}`);
console.log("\nPAGE ERRORS:", withErrors.join("\n") || "none");
// Known, accepted noise: the skip link is visually hidden until focused, sr-only
// text is clipped on purpose, and Quran words are inline text, not 44px controls.
process.exitCode = results.some((r) => r.docOverflow > 1 || r.errors.length) ? 1 : 0;
