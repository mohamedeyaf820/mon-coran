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
  await expect(openPlayer.or(compactPlayer).first()).toBeVisible();
  if (await compactPlayer.isVisible()) {
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

test("settings keep essential controls visible and advanced tools contextual", async ({
  page,
}) => {
  await seedFrenchState(page, { autoNightMode: false });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await openSettings(page);

  await expect(page.getByRole("button", { name: "Français" })).toBeVisible();
  await expect(page.getByRole("button", { name: "English" })).toBeVisible();
  await expect(page.getByRole("button", { name: "العربية" })).toBeVisible();
  await expect(page.locator(".settings-theme-tile")).toHaveCount(3);
  await expect(page.locator('input[type="time"]')).toHaveCount(0);

  await page.locator("#settings-auto-night").check({ force: true });
  await expect(page.locator('input[type="time"]')).toHaveCount(2);

  await page.getByRole("tab", { name: "Affichage" }).click();
  await expect(page.getByRole("heading", { name: "Riwaya par défaut" })).toBeVisible();
  await expect(page.locator("#settings-font-family")).toBeVisible();
  await expect(page.locator("#settings-font-size-quran")).toBeVisible();
  await expect(page.locator("#settings-font-size-translation")).toBeVisible();
  await expect(page.locator("#settings-show-tajwid")).toBeAttached();
  await expect(page.locator("#settings-show-translation")).toBeAttached();
  await expect(page.locator("#settings-show-transliteration")).toBeAttached();

  await page.getByRole("tab", { name: "Audio" }).click();
  await expect(page.locator("#settings-audio-speed")).toBeVisible();
  await expect(page.locator("#settings-audio-volume")).toBeVisible();
  await expect(page.locator("#settings-reciter-search")).toBeVisible();
  const troubleshooting = page.locator(".settings-advanced-disclosure");
  await expect(troubleshooting).not.toHaveAttribute("open", "");
  await troubleshooting.locator("summary").click();
  await expect(page.getByRole("button", { name: /Vider le cache/i })).toBeVisible();

  await page.getByRole("tab", { name: "Confidentialité" }).click();
  await expect(page.getByRole("heading", { name: "Données et confidentialité" })).toBeVisible();
  await expect(page.getByText("Protection locale avancée", { exact: true })).toBeVisible();
  await expect(page.getByTestId("delete-local-data")).toBeVisible();

  const drawerBox = await page.locator(".settings-drawer").boundingBox();
  expect(drawerBox?.width || 0).toBeLessThanOrEqual(390);
  expect(drawerBox?.height || 0).toBeLessThanOrEqual(844);
});

test("home presents one reading journey and one unified audio library", async ({
  page,
}) => {
  await seedFrenchState(page, {
    currentSurah: 3,
    currentAyah: 7,
    favoriteReciters: ["ar.alafasy"],
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");

  await expect(page.locator(".home-resume-panel")).toHaveCount(1);
  await expect(page.locator(".home-today-panel")).toHaveCount(1);
  await expect(page.locator(".home-session-card, .home-daily-verse-card")).toHaveCount(0);
  await expect(page.locator(".home-today-suggestion")).toHaveCount(5);
  await expect(page.getByLabel("Rechercher dans le Saint Coran…")).toBeVisible();
  await expect(page.getByLabel("Trier les sourates")).toBeVisible();
  await expect(page.getByRole("button", { name: "Grille" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Liste" })).toBeVisible();

  await page.getByRole("tab", { name: "Audio", exact: true }).click();
  await expect(page.getByRole("tab", { name: /Récitations/ })).toBeVisible();
  await expect(page.getByRole("tab", { name: /Radio/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Murattal", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Mujawwad", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Muallim", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Favoris", exact: true })).toBeVisible();
  await expect(page.getByText(/Murattal : posé/)).toBeVisible();
  await expect(page.locator(".home-content-section input[type='range']")).toHaveCount(0);

  await expect(page.locator(".mp-footer-v2__nav")).toBeHidden();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".mp-footer-v2__nav")).toBeVisible();
  await expect(page.getByRole("button", { name: "Bibliothèque" })).toBeVisible();
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

  const searchInput = page.locator(".search-pro").getByRole("textbox").first();
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
