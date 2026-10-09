import { test } from "@playwright/test";

test.use({ serviceWorkers: "block" });

test("diagnostic: computed scroll-behavior across the app", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("mushaf-plus-settings", JSON.stringify({
      skipSplashAnimation: true, showHome: false, sidebarOpen: false,
      displayMode: "surah", mushafLayout: "list", lang: "fr", riwaya: "hafs",
    }));
  });
  await page.goto("/surah/2");
  await page.waitForSelector("#main-content", { timeout: 20000 });
  await page.waitForSelector(".quran-display--platform", { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1500);

  const result = await page.evaluate(() => {
    const pick = (el) => el ? getComputedStyle(el).scrollBehavior : "MISSING";
    const main = document.getElementById("main-content");
    const quranDisplay = document.querySelector(".quran-display");
    const quranPlatform = document.querySelector(".quran-display--platform");
    const quranScroll = document.querySelector(".quran-display-scroll");
    const html = document.documentElement;
    const body = document.body;
    return {
      html: pick(html),
      body: pick(body),
      mainContent: pick(main),
      quranDisplay: pick(quranDisplay),
      quranPlatform: pick(quranPlatform),
      quranScroll: pick(quranScroll),
      mainScrollHeight: main?.scrollHeight,
      mainClientHeight: main?.clientHeight,
      quranPlatformScrollHeight: quranPlatform?.scrollHeight,
      quranPlatformClientHeight: quranPlatform?.clientHeight,
    };
  });
  console.log("SCROLL_DIAGNOSTIC", JSON.stringify(result, null, 2));
});
