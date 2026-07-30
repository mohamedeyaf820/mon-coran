import { expect, test } from "@playwright/test";

const SETTINGS_KEY = "mushaf-plus-settings";

async function seedFrenchState(page, overrides = {}) {
  await page.addInitScript(
    ({ key, next }) => {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(
        key,
        JSON.stringify({
          splashDone: true,
          showHome: true,
          showDuas: false,
          sidebarOpen: false,
          currentSurah: 1,
          currentAyah: 1,
          displayMode: "surah",
          lang: "fr",
          riwaya: "hafs",
          theme: "light",
          ...next,
        }),
      );
    },
    { key: SETTINGS_KEY, next: overrides },
  );
}

async function openSettings(page) {
  const directButton = page.locator(".mp-header__settings").first();
  if (await directButton.isVisible().catch(() => false)) {
    await directButton.click();
  } else {
    await page.locator(".mp-header__more").first().click();
    await page.locator('.mp-header-menu__item[data-key="settings"]').click();
  }
  await expect(page.locator(".settings-drawer")).toBeVisible();
}

test("home, reader and browser history form a complete navigation loop", async ({
  page,
}) => {
  await seedFrenchState(page);
  await page.goto("/");
  await expect(page.locator(".app-view-home")).toBeVisible();

  await page.locator(".hp-card--surah .hp-card-open").first().click();
  await expect(page).toHaveURL(/\/surah\/1$/);
  await expect(page.locator(".quran-display--platform")).toBeVisible({
    timeout: 30_000,
  });

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator(".app-view-home")).toBeVisible();
});

test("theme selection through settings is immediate and persists after reload", async ({
  page,
}) => {
  await seedFrenchState(page);
  await page.goto("/");
  await expect(page.locator(".app-view-home")).toBeVisible();

  await openSettings(page);
  await page
    .locator(".settings-theme-tile")
    .filter({ hasText: "Parchemin du Mushaf" })
    .click();

  await expect(page.locator("html")).toHaveAttribute("data-theme", "sepia");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "sepia");
  await expect(page.locator(".app-view-home")).toBeVisible();
});

test("bookmarking a verse survives a page reload", async ({ page }) => {
  await seedFrenchState(page, { showHome: false });
  await page.goto("/surah/1");
  await expect(page.locator(".qc-list-card").first()).toBeVisible({
    timeout: 30_000,
  });

  const addBookmark = page
    .getByRole("button", { name: "Ajouter aux favoris" })
    .first();
  await expect(addBookmark).toBeVisible();
  await addBookmark.click();
  await expect(
    page.getByRole("button", { name: "Retirer le favori" }).first(),
  ).toBeVisible();

  await page.reload();
  await expect(page.locator(".qc-list-card").first()).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    page.getByRole("button", { name: "Retirer le favori" }).first(),
  ).toBeVisible();
});
