import { expect, test } from "@playwright/test";

test.use({ serviceWorkers: "allow" });

test("keeps the modern application available after the network is lost", async ({ page, context }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    const registration = await navigator.serviceWorker.getRegistration();
    await registration?.update().catch(() => null);
  });
  await page.waitForTimeout(500);
  await context.setOffline(true);
  await page.goto("/study");
  await expect(page.getByRole("heading", { name: "Votre espace d'etude." })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Navigation principale" })).toBeVisible();
  await context.setOffline(false);
});
