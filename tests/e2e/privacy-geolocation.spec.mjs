import { test, expect } from "@playwright/test";

const SETTINGS_KEY = "mushaf-plus-settings";

async function seedHome(page, overrides = {}) {
  await page.addInitScript(({ key, settings }) => {
    localStorage.setItem(key, JSON.stringify({
      splashDone: true,
      showHome: true,
      showDuas: false,
      sidebarOpen: false,
      lang: "fr",
      riwaya: "hafs",
      autoNightMode: true,
      ...settings,
    }));

    window.__geolocationCalls = 0;
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition(success) {
          window.__geolocationCalls += 1;
          success({ coords: { latitude: 14.7167, longitude: -17.4677 } });
        },
      },
    });
  }, { key: SETTINGS_KEY, settings: overrides });
}

test("privacy: geolocation is never requested before explicit opt-in", async ({ page }) => {
  await seedHome(page, { usePrayerTimes: false });
  await page.goto("/");
  await expect(page.locator(".app-view-home")).toBeVisible();
  await page.waitForTimeout(2_500);

  expect(await page.evaluate(() => window.__geolocationCalls)).toBe(0);
  await expect(page.locator(".home-prayer-card [title^='Fajr']")).toHaveCount(0);
});

test("privacy: opt-in enables local prayer-time calculation", async ({ page }) => {
  await seedHome(page, { usePrayerTimes: true });
  await page.goto("/");
  await expect(page.locator(".app-view-home")).toBeVisible();

  await expect.poll(() => page.evaluate(() => window.__geolocationCalls)).toBeGreaterThan(0);
  await expect(page.locator(".home-prayer-card [title^='Fajr']")).toBeVisible();
});
