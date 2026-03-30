import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

const SETTINGS_KEY = "mushaf-plus-settings";
const OUTPUT_DIR = path.join("test-results", "visual-surah-zones");

const THEMES = ["light", "sepia", "dark"];
const VIEWPORTS = [
  { id: "desktop", width: 1440, height: 900, isMobile: false },
  { id: "mobile", width: 390, height: 844, isMobile: true },
];

function buildSeedSettings(theme) {
  return {
    lang: "fr",
    theme,
    riwaya: "hafs",
    displayMode: "surah",
    showHome: false,
    showDuas: false,
    currentSurah: 4,
    currentAyah: 1,
    quranFontSize: 42,
    fontFamily: "scheherazade-new",
    showTranslation: true,
    showTajwid: true,
    showWordByWord: false,
    showTransliteration: false,
    showWordTranslation: false,
    splashDone: true,
  };
}

for (const viewport of VIEWPORTS) {
  for (const theme of THEMES) {
    test(`Visual ${viewport.id} ${theme} - zones sourate`, async ({ browser, baseURL }) => {
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

      await page.waitForSelector(".qc-surah-header", { timeout: 30000 });
      await page.waitForTimeout(1000);

      const prefix = `${viewport.id}-${theme}`;

      await page.locator(".qc-surah-header").first().screenshot({
        path: path.join(OUTPUT_DIR, `${prefix}-header.png`),
      });

      await page.locator(".hdr-v7__search-btn").first().click();
      const searchModal = page.locator(".search-modal-shell");
      await expect(searchModal).toBeVisible();
      await searchModal.screenshot({
        path: path.join(OUTPUT_DIR, `${prefix}-search.png`),
      });
      await page.keyboard.press("Escape");
      await expect(searchModal).toBeHidden();

      await page.locator(".hdr-v7__menu-btn").first().click();
      const sidebar = page.locator(".sb-wrapper.open");
      await expect(sidebar).toBeVisible();
      await sidebar.screenshot({
        path: path.join(OUTPUT_DIR, `${prefix}-sidebar.png`),
      });

      await page.screenshot({
        path: path.join(OUTPUT_DIR, `${prefix}-full.png`),
        fullPage: true,
      });

      await context.close();
    });
  }
}
