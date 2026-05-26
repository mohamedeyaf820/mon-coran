import { test, expect } from "@playwright/test";

async function openReader(page) {
  await page.goto("/");
  const start = page.getByRole("button", {
    name: /Commencer la lecture|Continuer|Start reading|Continue|ابدأ القراءة|متابعة/i,
  });
  await expect(start.first()).toBeVisible();
  await start.first().click();
  await expect(page.locator(".qc-ayah-text-ar").first()).toBeVisible();
}

test("E2E: audio player minimized click restores panel and options modal opens", async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
    } catch {}
  });

  await openReader(page);

  const desktopPlayer = page.locator(".mp-audio-player--desktop").first();
  await expect(desktopPlayer).toBeVisible();

  const initialClass = (await desktopPlayer.getAttribute("class")) || "";
  const startsMinimized = initialClass.includes("is-minimized");

  if (!startsMinimized) {
    const minimizeBtn = desktopPlayer
      .locator("button:has(i.fa-chevron-down), button:has(i.fa-window-minimize)")
      .first();
    await expect(minimizeBtn).toBeVisible();
    await minimizeBtn.click();
    await expect(desktopPlayer).toHaveClass(/is-minimized/);
  }

  const reopenBtn = desktopPlayer.locator(".mp-player-minimized-open").first();
  await expect(reopenBtn).toBeVisible();
  await reopenBtn.click();

  await expect(desktopPlayer).not.toHaveClass(/is-minimized/);

  const optionsTrigger = desktopPlayer.locator(".mp-player-options-trigger").first();
  await expect(optionsTrigger).toBeVisible();
  await optionsTrigger.click();

  const optionsModal = page.locator(".audio-player-modal").first();
  await expect(optionsModal).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(optionsModal).toBeHidden();
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("E2E mobile: minimized restore works and options modal toggles", async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.clear();
      } catch {}
    });

    await openReader(page);

    const mobilePlayer = page.locator(".mp-audio-player--mobile").first();
    await expect(mobilePlayer).toBeVisible();

    const reopenFromMin = mobilePlayer.locator(".mp-player-minimized-open").first();
    if (await reopenFromMin.isVisible().catch(() => false)) {
      await reopenFromMin.click();
    }

    const dockPlayer = page.locator(".mp-audio-player--mobile.mp-audio-player--dock").first();
    await expect(dockPlayer).toBeVisible();

    const optionsTrigger = dockPlayer.locator(".mp-player-options-trigger").first();
    await expect(optionsTrigger).toBeVisible();
    await optionsTrigger.click();

    const optionsModal = page.locator(".audio-player-modal").first();
    await expect(optionsModal).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(optionsModal).toBeHidden();

    const minimizeBtn = dockPlayer.locator("button:has(i.fa-chevron-down)").first();
    await expect(minimizeBtn).toBeVisible();
    await minimizeBtn.click();

    const minimizedPlayer = page.locator(".mp-audio-player--mobile:not(.mp-audio-player--dock)").first();
    await expect(minimizedPlayer).toBeVisible();

    const reopenBtn = minimizedPlayer.locator(".mp-player-minimized-open").first();
    await expect(reopenBtn).toBeVisible();
    await reopenBtn.click();

    await expect(page.locator(".mp-audio-player--mobile.mp-audio-player--dock").first()).toBeVisible();
  });
});
