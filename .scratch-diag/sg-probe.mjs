// scratch probe: settings segmented clip @280 and reciter-card__name clip @280/320
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const SETTINGS_KEY = "mushaf-plus-settings";
const OUT = ".scratch-diag/resp";
const browser = await chromium.launch();

async function boot(ovr) {
  const ctx = await browser.newContext({ serviceWorkers: "block", viewport: { width: 390, height: 780 } });
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
    { key: SETTINGS_KEY, ovr },
  );
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".hp-card, .home-content-toolbar", { timeout: 25000 });
  await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(800);
  return { ctx, page };
}

const probe = () => {
  const out = [];
  for (const el of document.querySelectorAll("button, span")) {
    const txt = (el.textContent || "").trim();
    const cls = el.className || "";
    const isSeg = el.classList.contains("settings-segmented__item");
    const isName = el.classList.contains("reciter-card__name");
    if (!isSeg && !isName) continue;
    if (isSeg && !/Fran|Angl|English|العرب/.test(txt)) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || !el.getBoundingClientRect().width) continue;
    out.push({
      cls: isSeg ? "seg" : "name",
      txt: txt.slice(0, 26),
      sw: el.scrollWidth,
      cw: el.clientWidth,
      ox: cs.overflowX,
      ws: cs.whiteSpace,
      fs: cs.fontSize,
      lw: cs.letterSpacing,
      pad: cs.paddingInline,
      w: +el.getBoundingClientRect().width.toFixed(1),
      box: el.getBoundingClientRect().width > 0 ? Math.round(el.getBoundingClientRect().width) : 0,
    });
  }
  return out;
};

// settings modal
{
  const { ctx, page } = await boot({ lang: "fr", theme: "light" });
  await page.setViewportSize({ width: 280, height: 700 });
  await page.waitForTimeout(300);
  const more = page.locator(".mp-header__more").first();
  if (await more.isVisible().catch(() => false)) {
    await more.click().catch(() => {});
    await page.waitForTimeout(600);
    await page.locator('[data-key="settings"]').first().click().catch(() => {});
    await page.waitForTimeout(900);
  }
  const ready = await page.locator(".settings-segmented__item").count();
  console.log("segmented present:", ready);
  if (ready) {
    console.log("280", JSON.stringify(await page.evaluate(probe), null, 0));
    await page.locator(".settings-segmented").first().screenshot({ path: `${OUT}/sg-280.png` }).catch((e) => console.log("shot", String(e).slice(0, 80)));
  }
  await ctx.close();
}

// reciter cards
for (const w of [280, 320]) {
  const { ctx, page } = await boot({ lang: "fr", theme: "light", homeSection: "audio" });
  await page.locator('.home-content-toolbar [role="tab"]').nth(2).click({ timeout: 5000 }).catch(() => {});
  await page.waitForSelector(".reciter-card__name", { timeout: 15000 }).catch(() => {});
  await page.setViewportSize({ width: w, height: 780 });
  await page.waitForTimeout(500);
  console.log(w, JSON.stringify(await page.evaluate(probe), null, 0));
  await page.screenshot({ path: `${OUT}/rn-${w}.png` }).catch(() => {});
  await ctx.close();
}

await browser.close();
