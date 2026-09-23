// scratch: chip strip proof shots, both themes and both directions
import { chromium } from "@playwright/test";

const br = await chromium.launch();
for (const theme of ["light", "dark"]) {
  for (const lang of ["fr", "ar"]) {
    const c = await br.newContext({ serviceWorkers: "block", viewport: { width: 360, height: 880 } });
    await c.addInitScript((a) => {
      localStorage.setItem("mushaf-plus-settings", JSON.stringify({
        skipSplashAnimation: true, showHome: true, sidebarOpen: false,
        homeSection: "audio", riwaya: "hafs", fontFamily: "qpc-hafs", lang: a.lang, theme: a.theme,
      }));
      localStorage.setItem("mushaf-plus-onboarded", "1");
    }, { theme, lang });
    const p = await c.newPage();
    await p.goto("http://127.0.0.1:4394/", { waitUntil: "domcontentloaded" });
    await p.waitForSelector('.home-content-toolbar [role="tab"]');
    await p.locator('.home-content-toolbar [role="tab"]').nth(2).click();
    await p.waitForSelector(".home-style-filter.is-active");
    await p.waitForTimeout(900);
    const el = p.locator(".home-style-filters");
    await el.scrollIntoViewIfNeeded();
    await p.waitForTimeout(400);
    const b = await el.boundingBox();
    await p.screenshot({
      path: `.scratch-diag/rec3/chips-${theme}-${lang}.png`,
      clip: { x: 0, y: Math.max(0, b.y - 8), width: 360, height: b.height + 16 },
    });
    console.log("shot", theme, lang, JSON.stringify(b));
    await c.close();
  }
}
await br.close();
