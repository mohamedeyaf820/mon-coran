import { test, expect } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";

async function openReader(page) {
  await installQuranNetworkFixtures(page);
  await page.goto("/surah/1/1");
  await expect(page.locator(".quran-display--platform")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.locator(".qc-ayah-text-ar").first()).toBeVisible({
    timeout: 30_000,
  });
}

async function expectFontFamily(locator, family) {
  await expect
    .poll(() =>
      locator.evaluate((element) => window.getComputedStyle(element).fontFamily),
    )
    .toContain(family);
}

async function switchToMushaf(page) {
  await page.getByRole("button", { name: "Mushaf", exact: true }).click();
  await expect(page.locator(".mushaf-container .verse-text").first()).toBeVisible();
}

test("Hafs font selection applies to list and Mushaf layouts", async ({ page }) => {
  await openReader(page);

  await page.locator(".afc-select").selectOption("amiri-quran");
  await expectFontFamily(page.locator(".qc-ayah-text-ar").first(), "Amiri Quran");

  await switchToMushaf(page);
  await expectFontFamily(
    page.locator(".mushaf-container .verse-text").first(),
    "Amiri Quran",
  );

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator(".quran-display--platform")).toBeVisible({
    timeout: 30_000,
  });
  await page.getByRole("button", { name: "Liste", exact: true }).click();
  await expectFontFamily(page.locator(".qc-ayah-text-ar").first(), "Amiri Quran");
});

test("Warsh font selection applies to list and Mushaf layouts", async ({ page }) => {
  await openReader(page);

  await page.getByRole("button", { name: "Changer de riwaya" }).click();
  await expect(page.locator(".quran-display--warsh")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.locator(".qc-ayah-text-ar").first()).toBeVisible({
    timeout: 30_000,
  });

  await page.locator(".afc-select").selectOption("scheherazade-new-warsh");
  await expectFontFamily(
    page.locator(".qc-ayah-text-ar").first(),
    "Scheherazade New",
  );

  await switchToMushaf(page);
  await expectFontFamily(
    page.locator(".mushaf-container .verse-text").first(),
    "Scheherazade New",
  );
});
