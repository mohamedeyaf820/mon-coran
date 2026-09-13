import { expect, test } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";

const SETTINGS_KEY = "mushaf-plus-settings";

async function openFullscreenReader(page, viewport, overrides = {}) {
  await page.setViewportSize(viewport);
  await installQuranNetworkFixtures(page);
  await page.addInitScript(({ key, overrides }) => {
    localStorage.setItem(key, JSON.stringify({
      skipSplashAnimation: true,
      showHome: false,
      showDuas: false,
      sidebarOpen: false,
      displayMode: "surah",
      mushafLayout: "mushaf",
      lang: "fr",
      riwaya: "hafs",
      currentSurah: 3,
      currentPage: 50,
      lastPosition: { surah: 3, ayah: 1, page: 50, juz: 3 },
      ...overrides,
    }));
  }, { key: SETTINGS_KEY, overrides });
  await page.goto("/surah/3");
  await expect(page.locator(".quran-display--platform")).toBeVisible({ timeout: 30_000 });
  const trigger = page.locator(".srh-fullscreen-btn:visible").first();
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(page.locator(".mfp-portal-root")).toBeVisible({ timeout: 30_000 });
  return trigger;
}

test("fullscreen reader keeps accessible audio and settings controls", async ({ page }) => {
  await openFullscreenReader(page, { width: 1280, height: 800 });
  const overlay = page.locator(".mfp-portal-root");

  await expect(page.locator("body")).toHaveClass(/mfp-open/);
  await expect(overlay.getByRole("button", { name: "Lecture" }).first()).toBeVisible();
  await expect(overlay.getByRole("button", { name: "Audio" }).first()).toBeVisible();

  const undersizedControls = await overlay.locator("button:visible").evaluateAll((buttons) =>
    buttons.filter((button) => {
      const box = button.getBoundingClientRect();
      return box.width < 44 || box.height < 44;
    }).map((button) => button.getAttribute("aria-label")),
  );
  expect(undersizedControls).toEqual([]);

  await overlay.getByRole("button", { name: "Audio" }).first().click();
  const modal = page.locator(".audio-player-modal--simple");
  await expect(modal).toBeVisible();
  const layers = await page.evaluate(() => ({
    modal: Number(getComputedStyle(document.querySelector(".audio-player-modal--simple")).zIndex),
    overlay: Number(getComputedStyle(document.querySelector(".mfp-portal-root")).zIndex),
  }));
  expect(layers.modal).toBeGreaterThan(layers.overlay);
  await page.keyboard.press("Escape");
  await expect(modal).toBeHidden();
  await expect(overlay).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(overlay).toBeHidden();
  await expect(page.locator(":is(.reader-fullscreen-trigger, .srh-fullscreen-btn):visible").first()).toBeFocused();
});

test("mobile fullscreen reader fits without clipped controls", async ({ page }) => {
  await openFullscreenReader(page, { width: 390, height: 844 });
  const overlay = page.locator(".mfp-portal-root");
  await expect(overlay.locator(".mfp-mobile-footer")).toBeVisible();
  const overflow = await overlay.evaluate((element) => element.scrollWidth - element.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.screenshot({ path: "test-results/fullscreen-reader-mobile.png" });
});
