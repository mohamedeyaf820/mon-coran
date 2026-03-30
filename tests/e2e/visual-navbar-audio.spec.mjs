import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

const OUTPUT_DIR = path.join("test-results", "visual-navbar-audio");

async function openReader(page) {
  await page.goto("/");
  const start = page.getByRole("button", {
    name: /Commencer la lecture|Continuer|Start reading|Continue|ابدأ القراءة|متابعة/i,
  });
  await expect(start.first()).toBeVisible();
  await start.first().click();
  await expect(page.locator(".qc-ayah-text-ar").first()).toBeVisible();
}

test("Visual desktop: navbar + modal audio options", async ({ page }) => {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  await page.setViewportSize({ width: 1440, height: 900 });
  await openReader(page);

  const header = page.locator(".hdr-v7").first();
  await expect(header).toBeVisible();
  await header.screenshot({
    path: path.join(OUTPUT_DIR, "desktop-navbar.png"),
  });

  const player = page.locator(".mp-audio-player--desktop").first();
  await expect(player).toBeVisible();

  const optionsTrigger = player.locator(".mp-player-options-trigger").first();
  await expect(optionsTrigger).toBeVisible();
  await optionsTrigger.click();

  const modal = page.locator(".audio-player-modal__surface").first();
  await expect(modal).toBeVisible();
  await modal.screenshot({
    path: path.join(OUTPUT_DIR, "desktop-audio-modal.png"),
  });
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("Visual mobile: navbar + modal audio options", async ({ page }) => {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    await openReader(page);

    const header = page.locator(".hdr-v7").first();
    await expect(header).toBeVisible();
    await header.screenshot({
      path: path.join(OUTPUT_DIR, "mobile-navbar.png"),
    });

    const minimized = page.locator(".mp-audio-player--mobile:not(.mp-audio-player--dock)").first();
    const reopenBtn = minimized.locator(".mp-player-minimized-open").first();
    if (await reopenBtn.isVisible().catch(() => false)) {
      await reopenBtn.click();
    }

    const dock = page.locator(".mp-audio-player--mobile.mp-audio-player--dock").first();
    await expect(dock).toBeVisible();

    const optionsTrigger = dock.locator(".mp-player-options-trigger").first();
    await expect(optionsTrigger).toBeVisible();
    await optionsTrigger.click();

    const modal = page.locator(".audio-player-modal__surface").first();
    await expect(modal).toBeVisible();
    await modal.screenshot({
      path: path.join(OUTPUT_DIR, "mobile-audio-modal.png"),
    });
  });
});
