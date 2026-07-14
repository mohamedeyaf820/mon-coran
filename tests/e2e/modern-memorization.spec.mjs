import { test, expect } from "@playwright/test";
test("memorization mode masks and reveals verses", async ({ page }) => {
  await page.goto("/surah/1");
  await page.getByRole("button", { name: "Memoriser" }).click();
  const first = page.locator(".modern-reader-verse").first();
  await expect(first.locator(".modern-reader-verse__arabic")).toHaveClass(/is-masked/);
  await first.getByRole("button", { name: "Reveler" }).click();
  await expect(first.locator(".modern-reader-verse__arabic")).not.toHaveClass(/is-masked/);
});
