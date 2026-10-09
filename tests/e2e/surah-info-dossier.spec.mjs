import { expect, test } from "@playwright/test";

for (const viewport of [{ width: 390, height: 800 }, { width: 1280, height: 800 }]) {
  test(`surah information opens the full dossier at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.route("**/chapters/2/info?language=en", (route) => route.fulfill({
      json: { chapter_info: {
        short_text: "Short overview.",
        text: "Name\n\nThis is the full editorial dossier, available immediately when the reader opens Infos.\n\nContext\n\nThe second chapter has a longer history and context.",
        source: "Quran.com",
      } },
    }));
    await page.route("**/chapters/2?language=en", (route) => route.fulfill({
      json: { chapter: { revelation_order: 87, revelation_place: "madinah", pages: [2, 49] } },
    }));
    await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
      skipSplashAnimation: true, showHome: false, currentSurah: 2, riwaya: "hafs", lang: "fr",
    })));
    await page.goto("/surah/2");
    const trigger = viewport.width <= 640
      ? page.locator(".srh-mobile-bar .srh-info-btn").last()
      : page.locator(".srh-actions .srh-info-btn").last();
    await trigger.click();
    const modal = page.locator(".surah-info-modal");
    await expect(modal).toBeVisible();
    await expect(modal.locator(".sip-dossier__copy")).toContainText("full editorial dossier");
    await expect(modal.locator(".sip-dossier__facts")).toContainText("Médine");
    const box = await modal.boundingBox();
    expect(box.width).toBeGreaterThan(viewport.width * (viewport.width <= 640 ? 0.95 : 0.7));
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
    await expect(trigger).toBeFocused();
  });
}
