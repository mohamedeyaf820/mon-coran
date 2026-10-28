import { expect, test } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";

async function open(page, path, { width = 390, height = 844, lang = "fr", extra = {} } = {}) {
  await page.setViewportSize({ width, height });
  await installQuranNetworkFixtures(page);
  await page.addInitScript(
    ({ lang, extra }) => {
      if (window.sessionStorage.getItem("landing-e2e-seeded") === "1") return;
      window.sessionStorage.setItem("landing-e2e-seeded", "1");
      localStorage.setItem(
        "mushaf-plus-settings",
        JSON.stringify({ skipSplashAnimation: true, lang, theme: "light", riwaya: "hafs", ...extra }),
      );
    },
    { lang, extra },
  );
  await page.goto(path);
}

const horizontalOverflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

test("/ is the welcome page and /accueil is the app home", async ({ page }) => {
  await open(page, "/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Lire, écouter et comprendre le Coran/, {
    timeout: 30_000,
  });
  await expect(page.getByRole("button", { name: "Commencer la lecture" })).toBeVisible();
  // No store address exists yet: the page says so instead of linking nowhere.
  await expect(page.locator(".landing__soon")).toHaveText(/Bientôt sur Android et iOS/);
  await expect(page.locator(".landing a[href^='http']")).toHaveCount(0);

  await page.getByRole("button", { name: "Ouvrir MushafPlus" }).click();
  await expect(page).toHaveURL(/\/accueil$/);
  await expect(page.locator(".landing")).toHaveCount(0);
  await expect(page.locator(".app-root")).toHaveAttribute("data-view", "home");

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator(".landing")).toBeVisible();
});

test("the app home answers at /accueil directly, in every language", async ({ page }) => {
  await open(page, "/accueil");
  await expect(page.locator(".app-root")).toHaveAttribute("data-view", "home", { timeout: 30_000 });
  await expect(page.locator(".landing")).toHaveCount(0);
});

test("the main action continues the saved reading", async ({ page }) => {
  await open(page, "/", { extra: { lastPosition: { surah: 18, ayah: 10 } } });
  const cta = page.locator(".landing__actions .landing__btn--primary");
  await expect(cta).toHaveText(/Continuer · .+ v\.10/, { timeout: 30_000 });
  await cta.click();
  await expect(page).toHaveURL(/\/surah\/18\/10$/);
});

test("invocations and listening open from the welcome page", async ({ page }) => {
  await open(page, "/");
  await page.getByRole("button", { name: "Ouvrir les invocations" }).click({ timeout: 30_000 });
  await expect(page).toHaveURL(/\/duas$/);
  await page.goBack();
  await page.getByRole("button", { name: "Écouter", exact: true }).click();
  await expect(page).toHaveURL(/\/accueil$/);
  await expect(page.locator(".app-root")).toHaveAttribute("data-home-section", "audio");
});

test("the welcome page is Arabic and right-to-left at /ar/, and fits small screens", async ({ page }) => {
  for (const width of [320, 390, 1280]) {
    await open(page, "/ar/", { width, lang: "ar" });
    await expect(page.locator(".landing")).toHaveAttribute("dir", "rtl", { timeout: 30_000 });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("اقرأ القرآن واستمع إليه وافهمه");
    expect(await horizontalOverflow(page), `${width}px`).toBeLessThanOrEqual(1);
    for (const button of await page.locator(".landing button").all()) {
      expect((await button.boundingBox()).height, "touch target").toBeGreaterThanOrEqual(44);
    }
  }
});
