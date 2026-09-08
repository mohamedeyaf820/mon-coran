import { test, expect } from "@playwright/test";

test("recitation titles and Arabic names stay clear of tablet and phone actions", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
    skipSplashAnimation: true, showHome: true, lang: "fr", theme: "light", riwaya: "hafs", sidebarOpen: false,
  })));
  await page.goto("/");
  await page.getByRole("tab", { name: "Audio", exact: true }).click();
  await page.locator(".reciter-card__main").first().click();
  await expect(page.locator(".reciter-detail")).toBeVisible();
  for (const width of [280, 390, 820]) {
    await page.setViewportSize({ width, height: 900 });
    const row = page.locator(".recitation-row").first();
    await expect(row).toBeVisible();
    const layout = await row.evaluate(node => {
      const copy = node.querySelector(".recitation-row__copy").getBoundingClientRect();
      const actions = node.querySelector(".recitation-row__actions").getBoundingClientRect();
      const arabic = node.querySelector(".recitation-row__arabic").getBoundingClientRect();
      return {
        gap: actions.top - copy.bottom,
        arabicWidth: arabic.width,
        overflow: document.documentElement.scrollWidth - innerWidth,
        buttons: [...node.querySelectorAll("button")].map(button => {
          const r = button.getBoundingClientRect();
          return { width: r.width, height: r.height };
        }),
      };
    });
    expect(layout.gap).toBeGreaterThanOrEqual(0);
    expect(layout.arabicWidth).toBeGreaterThan(10);
    expect(layout.overflow).toBeLessThanOrEqual(2);
    for (const button of layout.buttons) {
      expect(button.width).toBeGreaterThanOrEqual(44);
      expect(button.height).toBeGreaterThanOrEqual(44);
    }
  }
});
