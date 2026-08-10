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

async function revealReaderTools(page) {
  const trigger = page
    .locator(".srh-identity__disclosure:visible, .srh-mobile-bar__disclosure:visible")
    .first();
  await expect(trigger).toBeVisible();
  if ((await trigger.getAttribute("aria-expanded")) !== "true") {
    await trigger.focus();
    await trigger.press("Enter");
  }
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
}

async function switchToMushaf(page) {
  await revealReaderTools(page);
  // The view-mode pills use role="radio" inside a radiogroup
  await page.getByRole("radio", { name: "Mushaf", exact: true }).click();
  await expect(page.locator(".mushaf-container .verse-text").first()).toBeVisible();
}

async function openTypographyPanel(page) {
  await revealReaderTools(page);
  const select = page.locator(".srh-footer .afc-select").first();
  await expect(select).toBeVisible({ timeout: 5000 });
  return select;
}

test("Hafs font selection applies to list and Mushaf layouts", async ({ page }) => {
  await openReader(page);

  const hafsFontSelect = await openTypographyPanel(page);
  await hafsFontSelect.selectOption("amiri-quran");
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
  await revealReaderTools(page);
  await page.getByRole("radio", { name: "Liste", exact: true }).click();
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

  const warshFontSelect = await openTypographyPanel(page);
  await warshFontSelect.selectOption("scheherazade-new-warsh");
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
