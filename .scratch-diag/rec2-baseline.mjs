/**
 * Baseline render of the two recitation surfaces across viewports.
 * Measures: horizontal overflow, clipped text, touch targets under 44px,
 * and captures screenshots for visual review.
 */
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://127.0.0.1:4394";
const OUT = ".scratch-diag/rec2";

const VIEWPORTS = [
  { name: "360", width: 360, height: 740 },
  { name: "420", width: 420, height: 880 },
  { name: "760", width: 760, height: 900 },
  { name: "1024", width: 1024, height: 800 },
  { name: "1440", width: 1440, height: 900 },
];

const PROBE = () => {
  const doc = document.documentElement;
  const out = {
    hOverflow: doc.scrollWidth - doc.clientWidth,
    clipped: [],
    small: [],
    deadControls: [],
  };
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || !el.getBoundingClientRect().width) continue;
    const r = el.getBoundingClientRect();
    if (r.right > doc.clientWidth + 1 || r.left < -1) {
      out.clipped.push(`${el.className || el.tagName} @${Math.round(r.left)}..${Math.round(r.right)}`);
    }
    const interactive = el.matches("button,a,input,select,[role=button],[role=tab]");
    if (interactive && (r.height < 43.5 || r.width < 43.5)) {
      out.small.push(`${el.className || el.tagName} ${Math.round(r.width)}x${Math.round(r.height)} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 22)}"`);
    }
    // Something that looks like a control but cannot be operated.
    const cls = String(el.className || "");
    if (/pill|button|chip|tab/i.test(cls) && !interactive) {
      out.deadControls.push(`${cls} "${(el.textContent || "").trim().slice(0, 26)}" cursor:${cs.cursor}`);
    }
  }
  out.clipped = [...new Set(out.clipped)].slice(0, 8);
  out.small = [...new Set(out.small)].slice(0, 12);
  out.deadControls = [...new Set(out.deadControls)].slice(0, 8);
  return out;
};

const browser = await chromium.launch();
const results = [];

for (const vp of VIEWPORTS) {
  for (const surface of ["hub", "detail"]) {
    const ctx = await browser.newContext({
      serviceWorkers: "block",
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    await ctx.addInitScript(() => {
      localStorage.setItem(
        "mushaf-plus-settings",
        JSON.stringify({
          skipSplashAnimation: true, showHome: true, sidebarOpen: false,
          homeSection: "audio", riwaya: "hafs", fontFamily: "qpc-hafs", lang: "fr", theme: "light",
        }),
      );
      localStorage.setItem("mushaf-plus-onboarded", "1");
    });
    const page = await ctx.newPage();
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector('.home-content-toolbar [role="tab"]', { timeout: 30000 });
    await page.locator('.home-content-toolbar [role="tab"]').nth(2).click();
    await page.waitForTimeout(1600);

    if (surface === "detail") {
      await page.locator(".reciter-card__main").first().click();
      await page.waitForSelector(".reciter-detail", { timeout: 15000 });
      await page.waitForTimeout(1400);
    }

    const probe = await page.evaluate(PROBE);
    const shot = `${OUT}/${surface}-${vp.name}.png`;
    if (surface === "hub") await page.screenshot({ path: shot });
    else await page.locator(".reciter-detail").screenshot({ path: shot }).catch(() => page.screenshot({ path: shot }));
    results.push({ surface, vp: vp.name, ...probe });
    await ctx.close();
  }
}

for (const r of results) {
  console.log(`\n### ${r.surface} @${r.vp}  hOverflow=${r.hOverflow}px`);
  if (r.clipped.length) console.log("  clipped:", r.clipped.join(" ; "));
  if (r.small.length) console.log("  <44px:", r.small.join(" ; "));
  if (r.deadControls.length) console.log("  look-like-control:", r.deadControls.join(" ; "));
}
await browser.close();
