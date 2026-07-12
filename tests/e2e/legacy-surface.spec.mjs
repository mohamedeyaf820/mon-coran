import { test, expect } from "@playwright/test";

test("keeps the current application available under legacy", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/legacy");
  await expect(page.locator(".modern-app")).toHaveCount(0);
  await expect(page.locator(".app-root")).toBeVisible();
  await expect(page).toHaveURL(/\/legacy(?:\/)?$/);
  expect(pageErrors).toEqual([]);
});
