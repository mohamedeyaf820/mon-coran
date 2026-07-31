import { expect, test } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";

const SETTINGS_KEY = "mushaf-plus-settings";

async function seedFrenchState(page, overrides = {}) {
  await page.addInitScript(
    ({ key, next }) => {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(
        key,
        JSON.stringify({
          skipSplashAnimation: true,
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

async function patchDeterministicAudio(page) {
  await page.addInitScript(() => {
    window.__playedAudioUrls = [];

    HTMLMediaElement.prototype.load = function patchedLoad() {};
    HTMLMediaElement.prototype.play = function patchedPlay() {
      const url = String(this.src || "");
      window.__playedAudioUrls.push(url);
      this.dispatchEvent(new Event("playing"));
      return Promise.resolve();
    };
  });
}

async function openAudioOptions(page) {
  const openPlayer = page.getByTestId("audio-player-open");
  const compactPlayer = page.getByTestId("audio-player-compact");
  if (await compactPlayer.isVisible().catch(() => false)) {
    await compactPlayer.locator(".mp-player-minimized-open").click();
  }
  await expect(openPlayer).toBeVisible();
  await openPlayer.locator(".mp-player-options-trigger").first().click();
  await expect(page.locator(".audio-player-modal__surface")).toBeVisible();
}

test("home, reader and browser history form a complete navigation loop", async ({
  page,
}) => {
  await seedFrenchState(page);
  await page.goto("/");
  await expect(page.locator(".app-view-home")).toBeVisible();

  await page.getByTestId("surah-card-open").first().click();
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

test("switching reciter in the player updates the selected voice", async ({
  page,
}) => {
  await seedFrenchState(page, {
    showHome: false,
    reciter: "ar.alafasy",
    mushafLayout: "list",
  });
  await patchDeterministicAudio(page);
  await page.goto("/surah/1");
  await expect(page.locator(".qc-list-card").first()).toBeVisible({
    timeout: 30_000,
  });

  await page.getByTestId("surah-play").first().click();
  await openAudioOptions(page);

  const target = page.locator(
    '[data-testid="reciter-option"][data-reciter-id="abu_bakr_ash_shaatree"]',
  );
  await expect(target).toBeVisible();
  await target.click();
  await expect(target).toHaveAttribute("aria-pressed", "true");
});

test("searching a translation result navigates to the matching ayah", async ({
  page,
}) => {
  await seedFrenchState(page);
  await installQuranNetworkFixtures(page);
  await page.route("https://api.alquran.cloud/v1/search/**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        code: 200,
        status: "OK",
        data: {
          count: 1,
          matches: [
            {
              number: 4902,
              text: "Lequel donc des bienfaits de votre Seigneur nierez-vous ?",
              numberInSurah: 13,
              surah: { number: 55 },
            },
          ],
        },
      }),
    });
  });

  await page.goto("/");
  await expect(page.locator(".app-view-home")).toBeVisible();
  await page.locator(".mp-header__search").first().click();

  const searchInput = page.getByRole("combobox");
  await searchInput.fill("miséricorde");
  await page.getByRole("tab", { name: "FR" }).click();

  const result = page.getByTestId("search-result").first();
  await expect(result).toBeVisible({ timeout: 15_000 });
  await expect(result).toHaveAttribute("data-surah", "55");
  await expect(result).toHaveAttribute("data-ayah", "13");
  await result.click();

  await expect(page).toHaveURL(/\/surah\/55\/13$/);
  await expect(page.locator(".quran-display--platform")).toBeVisible({
    timeout: 30_000,
  });
});
