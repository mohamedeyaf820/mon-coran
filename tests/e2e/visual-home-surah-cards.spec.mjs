import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

const SETTINGS_KEY = "mushaf-plus-settings";
const OUTPUT_DIR = path.join("test-results", "visual-home-surah-cards");

const VIEWPORTS = [
  { id: "desktop", width: 1440, height: 900, isMobile: false },
  { id: "tablet", width: 834, height: 1112, isMobile: true },
  { id: "mobile", width: 390, height: 844, isMobile: true },
];
const THEMES = ["light", "sepia", "dark"];

function buildSeedSettings(theme) {
  return {
    lang: "fr",
    theme,
    riwaya: "hafs",
    displayMode: "surah",
    showHome: true,
    showDuas: false,
    skipSplashAnimation: true,
    currentSurah: 1,
    currentAyah: 1,
    quranFontSize: 42,
    fontFamily: "scheherazade-new",
    showTranslation: true,
    showTajwid: true,
  };
}

for (const viewport of VIEWPORTS) {
  for (const theme of THEMES) {
  test(`Visual ${viewport.id} ${theme} - home surah cards`, async ({ browser, baseURL }) => {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: viewport.isMobile,
      hasTouch: viewport.isMobile,
    });

    const page = await context.newPage();

    await page.addInitScript(
      ({ key, payload }) => {
        window.localStorage.setItem(key, JSON.stringify(payload));
      },
      {
        key: SETTINGS_KEY,
        payload: buildSeedSettings(theme),
      },
    );

    await page.goto(baseURL || "http://127.0.0.1:4173", {
      waitUntil: "domcontentloaded",
    });

    await page.waitForSelector(".hp-card--surah", { timeout: 30000 });
    await page.waitForTimeout(1000);

    const prefix = `${viewport.id}-${theme}`;
    const cardsGrid = page.locator(".hp-grid.hp-grid--surah, .hp-list").first();
    await expect(cardsGrid).toBeVisible();

    await cardsGrid.screenshot({
      path: path.join(OUTPUT_DIR, `${prefix}-surah-grid.png`),
    });

    const firstCard = page.locator(".hp-card--surah").first();
    await expect(firstCard).toBeVisible();

    await firstCard.screenshot({
      path: path.join(OUTPUT_DIR, `${prefix}-surah-card-first.png`),
    });

    await page.evaluate(() => {
      window.scrollTo(0, 0);
      const main = document.querySelector("#main-content");
      if (main) main.scrollTop = 0;
    });

    await page.screenshot({
      path: path.join(OUTPUT_DIR, `${prefix}-home-full.png`),
      fullPage: true,
    });

    await context.close();
  });
  }
}
