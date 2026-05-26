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

test("A11y smoke: landmarks, focus clavier et modal recherche", async ({ page }) => {
  await openReader(page);

  const main = page.locator("main").first();
  await expect(main).toBeVisible();

  const ayahCount = await page.locator(".qc-ayah-text-ar").count();
  expect(ayahCount).toBeGreaterThan(0);

  const menuButton = page.locator(".hdr-v7__menu-btn").first();
  await expect(menuButton).toBeVisible();
  await menuButton.focus();
  await page.keyboard.press("Tab");

  const activeTag = await page.evaluate(() => document.activeElement?.tagName || "");
  expect(activeTag).not.toBe("BODY");

  const searchButton = page.locator(".hdr-v7__search-btn").first();
  await expect(searchButton).toBeVisible();
  await searchButton.focus();
  await page.keyboard.press("Enter");

  const searchModal = page.locator(".search-modal-shell");
  await expect(searchModal).toBeVisible();
  await expect(searchModal.locator("input").first()).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(searchModal).toBeHidden();
});
