// scratch: verify settings tab rail after the 2x2 fix
import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:4194";
const SETTINGS_KEY = "mushaf-plus-settings";
const OUT = ".scratch-diag/resp";
const browser = await chromium.launch();

for (const prof of [
  { lang: "fr", theme: "light", dir: "ltr" },
  { lang: "ar", theme: "dark", dir: "rtl" },
]) {
  for (const w of [336, 341, 360, 390, 414]) {
    const ctx = await browser.newContext({ serviceWorkers: "block", viewport: { width: w, height: 780 } });
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
      { key: SETTINGS_KEY, ovr: { lang: prof.lang, theme: prof.theme } },
    );
    const page = await ctx.newPage();
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForSelector(".hp-card, .home-content-toolbar", { timeout: 25000 }).catch(() => {});
    await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(900);
    const cont = page.locator("button", { hasText: /Continuer|متابعة|Continue/ }).first();
    if (await cont.isVisible().catch(() => false)) {
      await cont.click().catch(() => {});
      await page.waitForTimeout(1400);
    }
    await page.locator(".mp-header__more").first().click().catch(() => {});
    await page.waitForTimeout(600);
    await page.locator('[data-key="settings"]').first().click().catch(() => {});
    await page.waitForTimeout(1000);

    const info = await page.evaluate(() => {
      const tabs = document.querySelector(".settings-drawer__tabs");
      const cs = getComputedStyle(tabs);
      const labels = [...document.querySelectorAll(".settings-tab-button__label")].map((el) => ({
        t: (el.textContent || "").trim().slice(0, 16),
        fs: getComputedStyle(el).fontSize,
        trunc: el.scrollWidth > Math.round(el.getBoundingClientRect().width) + 1,
        w: Math.round(el.getBoundingClientRect().width),
        sw: el.scrollWidth,
      }));
      const btns = [...document.querySelectorAll(".settings-tab-button")].map((b) => {
        const r = b.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height) };
      });
      const sheet = document.querySelector(".settings-drawer")?.getBoundingClientRect();
      const body = document.querySelector(".settings-drawer__content")?.getBoundingClientRect();
      return {
        cols: cs.gridTemplateColumns,
        tabsH: Math.round(tabs.getBoundingClientRect().height),
        sheetH: sheet ? Math.round(sheet.height) : null,
        bodyH: body ? Math.round(body.height) : null,
        labels,
        btns,
      };
    });
    console.log(prof.lang, prof.theme, w, JSON.stringify(info));
    await page.screenshot({ path: `${OUT}/st-${prof.lang}${prof.theme === "dark" ? "d" : "l"}-${w}.png`, timeout: 8000 }).catch(() => {});
    await ctx.close();
  }
}
await browser.close();
