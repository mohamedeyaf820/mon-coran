import { expect, test } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";

test.use({ serviceWorkers: "block" });

test("desktop keeps its header while mobile commands live in the bottom navigation", async ({ page }) => {
  await installQuranNetworkFixtures(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({ skipSplashAnimation: true, showHome: true, lang: "fr" })));
  await page.goto("/");
  await expect(page.locator('html[data-deferred-styles="ready"]')).toBeAttached();
  await expect(page.locator(".mp-header")).toBeVisible();
  await expect(page.locator(".mobile-navigation")).toBeHidden();
  expect((await page.locator("#main-content").boundingBox()).y).toBeGreaterThan(0);
  await page.screenshot({ path: ".codex-artifacts/mobile-navigation/header-desktop.png", animations: "disabled" });
});

for (const [width, lang] of [[280, "fr"], [390, "fr"], [390, "ar"], [820, "fr"], [1024, "en"]]) {
  test(`mobile navigation preserves the reader and contains the audio dock (${width}, ${lang})`, async ({ page }) => {
    await installQuranNetworkFixtures(page);
    await page.setViewportSize({ width, height: width === 1024 ? 768 : 844 });
    await page.addInitScript(({ lang }) => {
      localStorage.setItem("mushaf-plus-settings", JSON.stringify({
        skipSplashAnimation: true, showHome: false, sidebarOpen: false,
        lang, riwaya: "hafs", displayMode: "surah", mushafLayout: "list",
        lastPosition: { surah: 2, ayah: 29, page: 6, juz: 1 },
      }));
      const paused = new WeakMap();
      Object.defineProperty(HTMLMediaElement.prototype, "paused", {
        configurable: true,
        get() { return paused.get(this) !== false; },
      });
      HTMLMediaElement.prototype.play = function () {
        paused.set(this, false);
        this.dispatchEvent(new Event("play"));
        return Promise.resolve();
      };
      const NativeAudio = window.Audio;
      const elements = [];
      window.Audio = function (...args) {
        const audio = new NativeAudio(...args);
        elements.push(audio);
        return audio;
      };
      Object.defineProperty(window, "__navigationMedia", { get() {
        return elements.find(audio => audio.hasAttribute("webkit-playsinline") && audio.src);
      } });
    }, { lang });
    await page.goto("/surah/2/29");
    await expect(page.locator(".qc-ayah-text-ar").first()).toBeVisible({ timeout: 30000 });
    await expect(page.locator('html[data-deferred-styles="ready"]')).toBeAttached();
    const navigation = page.locator(".mobile-navigation");
    await page.locator('#main-content').click({ position: { x: 4, y: 180 } });
    await expect(navigation).toBeVisible();
    await expect(navigation.getByRole("button")).toHaveCount(5);
    await expect(page.locator(".mp-header")).toBeHidden();
    expect((await page.locator("#main-content").boundingBox()).y).toBeLessThanOrEqual(1);
    const more = navigation.locator('[data-destination="more"]');
    await more.click();
    await expect(page.locator(".mobile-navigation-menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(more).toBeFocused();
    await more.click();
    await page.locator('[data-tool="settings"]').click();
    await expect(page.locator(".settings-drawer")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".settings-drawer")).toBeHidden();
    await more.click();
    await page.locator('[data-tool="search"]').click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const readerUrl = page.url();
    for (const button of await navigation.getByRole("button").all()) {
      const bounds = await button.boundingBox();
      expect(bounds.width).toBeGreaterThanOrEqual(44);
      expect(bounds.height).toBeGreaterThanOrEqual(44);
    }
    await page.locator('[data-ayah-number="29"] .ayah-action--play').click();
    await expect.poll(() => page.evaluate(() => window.__navigationMedia?.paused)).toBe(false);
    await page.evaluate(() => { window.__navigationInitialMedia = window.__navigationMedia; });
    await page.locator('#main-content').click({ position: { x: 4, y: 180 } });
    await navigation.locator('[data-destination="audio"]').click();
    await expect(page.locator(".home-content-toolbar [role=tab]").nth(2)).toHaveAttribute("aria-selected", "true");
    await expect(page.locator('.home-content-toolbar > [role="tablist"]')).toBeHidden();
    await expect(navigation.locator('[data-destination="audio"]')).toHaveAttribute("aria-current", "page");
    await expect(page.locator(".home-overview")).toBeHidden();
    await expect(page.locator(".home-audio-title")).toBeVisible();
    const navBounds = await navigation.boundingBox();
    await expect.poll(async () => {
      const dock = await page.getByTestId("audio-player-compact").boundingBox();
      return dock ? dock.y + dock.height : Infinity;
    }).toBeLessThanOrEqual(navBounds.y + 1);
    await navigation.locator('[data-destination="home"]').click();
    await expect(page.locator(".home-overview")).toBeVisible();
    await navigation.locator('[data-destination="prayers"]').click();
    await expect(page.locator(".app-view-prayers")).toBeVisible();
    await expect(navigation.locator('[data-destination="prayers"]')).toHaveAttribute("aria-current", "page");
    await navigation.locator('[data-destination="read"]').click();
    await expect(page).toHaveURL(readerUrl);
    await expect(navigation.locator('[data-destination="read"]')).toHaveAttribute("aria-current", "page");
    expect(await page.evaluate(() => window.__navigationMedia === window.__navigationInitialMedia && !window.__navigationMedia.paused)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(2);
    await page.screenshot({ path: `.codex-artifacts/mobile-navigation/reader-${width}-${lang}.png` });
    await page.locator('#main-content').click({ position: { x: 4, y: 180 } });
    await navigation.locator('[data-destination="audio"]').click();
    await expect(page.locator(".home-content-toolbar [role=tab]").nth(2)).toHaveAttribute("aria-selected", "true");
    await expect.poll(() => page.locator(".home-content-toolbar [role=tab]").evaluateAll(tabs => {
      const selected = tabs.find(tab => tab.getAttribute("aria-selected") === "true");
      const inactive = tabs.filter(tab => tab !== selected);
      return inactive.every(tab => getComputedStyle(tab).backgroundColor === "rgba(0, 0, 0, 0)")
        && getComputedStyle(selected).backgroundColor !== "rgba(0, 0, 0, 0)";
    })).toBe(true);
    await page.screenshot({ path: `.codex-artifacts/mobile-navigation/audio-${width}-${lang}.png`, animations: "disabled" });
  });
}
