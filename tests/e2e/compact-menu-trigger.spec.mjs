import { test, expect } from "@playwright/test";

// The floating menu button sits over the top-left corner. Screens that start at
// the top edge (Home, Duas, Prayers, legal pages) had their title or their back
// button under it, so only the reader, which keeps a free band there, mounts it.
test.use({ viewport: { width: 360, height: 740 } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "mushaf-plus-settings",
      JSON.stringify({ skipSplashAnimation: true, lang: "fr", riwaya: "hafs" }),
    );
  });
});

for (const path of ["/", "/duas", "/prieres", "/about", "/privacy"]) {
  test(`phone ${path} has no floating menu button over its content`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator(".app-root")).toBeVisible();
    await expect(page.locator(".mobile-navigation")).toBeVisible();
    await expect(page.locator(".compact-menu-trigger")).toHaveCount(0);
  });
}

test("phone reader keeps the menu button and it opens the directory", async ({ page }) => {
  await page.goto("/surah/1");
  const trigger = page.locator(".compact-menu-trigger");
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(page.locator(".app-root")).toHaveClass(/is-sidebar-open/);
});

test("phone Plus menu reaches the surah directory from Home", async ({ page }) => {
  await page.goto("/");
  await page.locator(".mobile-navigation [data-destination=more]").click();
  await page.locator(".mobile-navigation-menu").getByRole("button", { name: "Liste des sourates" }).click();
  await expect(page.locator(".app-root")).toHaveClass(/is-sidebar-open/);
});
