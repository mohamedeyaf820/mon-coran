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

test("E2E: clic verset n'active pas l'audio, bouton play explicite oui", async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
    } catch {}
    const originalPlay = HTMLMediaElement.prototype.play;
    window.__audioPlayCalls = 0;
    HTMLMediaElement.prototype.play = function patchedPlay(...args) {
      window.__audioPlayCalls += 1;
      return Promise.reject(new DOMException("blocked", "NotAllowedError"));
    };
    window.__restorePlay = () => {
      HTMLMediaElement.prototype.play = originalPlay;
    };
  });

  await openReader(page);

  await page.evaluate(() => {
    window.__audioPlayCalls = 0;
  });

  await page.locator(".qc-ayah-text-ar").first().click();

  await expect
    .poll(async () => page.evaluate(() => Number(window.__audioPlayCalls || 0)))
    .toBe(0);

  const explicitPlay = page
    .locator(".reader-toolbar-btn--primary, .btn-play-surah")
    .first();
  await expect(explicitPlay).toBeVisible();
  await explicitPlay.click();

  await expect
    .poll(async () => page.evaluate(() => Number(window.__audioPlayCalls || 0)))
    .toBeGreaterThan(0);

  await page.evaluate(() => {
    window.__restorePlay?.();
  });
});

test("E2E: clic mot sans audioUrl/lecture mot en echec fallback ayah", async ({ page }) => {
  await page.addInitScript(() => {
    const originalPlay = HTMLMediaElement.prototype.play;
    window.__audioPlayCalls = 0;
    HTMLMediaElement.prototype.play = function patchedPlay(...args) {
      window.__audioPlayCalls += 1;
      return Promise.reject(new DOMException("blocked", "NotAllowedError"));
    };
    window.__restorePlay = () => {
      HTMLMediaElement.prototype.play = originalPlay;
    };
  });

  await openReader(page);

  const wbwToggle = page.getByRole("button", {
    name: /Liste|List|قائمة|Mot à mot|Word by Word|كلمة بكلمة/i,
  });
  if (await wbwToggle.first().isVisible()) {
    await wbwToggle.first().click();
  } else {
    await page.locator(".mushaf-layout-btn").first().click();
  }

  await expect(page.locator(".wbw-word-block").first()).toBeVisible({ timeout: 20000 });

  await page.evaluate(() => {
    window.__audioPlayCalls = 0;
  });

  await page.locator(".wbw-word-block").first().click();

  await expect
    .poll(async () => page.evaluate(() => Number(window.__audioPlayCalls || 0)))
    .toBeGreaterThan(1);

  await page.evaluate(() => {
    window.__restorePlay?.();
  });
});
