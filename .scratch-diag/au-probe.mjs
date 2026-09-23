// scratch probe: home toolbar Audio tab dot clipping + settings segmented clip
import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:4194";
const SETTINGS_KEY = "mushaf-plus-settings";

const browser = await chromium.launch();

async function openHome(ovr = {}) {
  const ctx = await browser.newContext({ serviceWorkers: "block", viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(
    (a) => {
      localStorage.setItem(
        a.key,
        JSON.stringify({
          skipSplashAnimation: true,
          showHome: true,
          sidebarOpen: false,
          homeSection: "surah",
          riwaya: "hafs",
          fontFamily: "qpc-hafs",
          ...a.ovr,
        }),
      );
    },
    { key: SETTINGS_KEY, ovr: { lang: "fr", theme: "light", ...ovr } },
  );
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".home-content-toolbar [role=tab]", { timeout: 25000 });
  await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(900);
  return { ctx, page };
}

const { ctx, page } = await openHome();
for (const w of [390, 768, 1280, 1920]) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.waitForTimeout(400);
  const info = await page.evaluate(() => {
    const tabs = [...document.querySelectorAll('.home-content-toolbar [role="tab"]')];
    const audio = tabs.find((b) => /Audio|الصوتيات/.test(b.textContent));
    const cs = getComputedStyle(audio);
    const dot = audio.querySelector("span.absolute");
    const dr = dot?.getBoundingClientRect();
    const ar = audio.getBoundingClientRect();
    return {
      ws: cs.whiteSpace,
      ox: cs.overflowX,
      sw: audio.scrollWidth,
      cw: audio.clientWidth,
      rect: Math.round(ar.width),
      dot: dr ? { l: +dr.left.toFixed(1), r: +dr.right.toFixed(1), t: +dr.top.toFixed(1), w: +dr.width.toFixed(1) } : null,
      btnBox: { l: +ar.left.toFixed(1), r: +ar.right.toFixed(1), t: +ar.top.toFixed(1) },
      clipPath: dot ? getComputedStyle(dot).clipPath : null,
    };
  });
  console.log(w, JSON.stringify(info));
  const tabs = page.locator(".home-content-toolbar [role=tablist]");
  await tabs.screenshot({ path: `.scratch-diag/resp/au-tab-${w}.png` });
}
await ctx.close();

await browser.close();
