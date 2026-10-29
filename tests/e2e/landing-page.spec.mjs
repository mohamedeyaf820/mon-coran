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
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Le Coran dans la lecture que vous suivez/, {
    timeout: 30_000,
  });
  await expect(page.getByRole("button", { name: "Commencer la lecture" })).toBeVisible();
  // No store address exists yet: the page says so instead of linking nowhere.
  await expect(page.locator(".landing__soon")).toHaveText(/Bientôt sur Android et iOS/);
  await expect(page.locator(".landing a[href^='http']")).toHaveCount(0);

  await page.locator(".landing__actions").getByRole("button", { name: "Ouvrir MushafPlus" }).click();
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
  const cta = page.locator(".landing__actions .landing__btn--gold");
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
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("القرآن بالقراءة التي تتبعها");
    expect(await horizontalOverflow(page), `${width}px`).toBeLessThanOrEqual(1);
    for (const button of await page.locator(".landing button:visible").all()) {
      expect((await button.boundingBox()).height, "touch target").toBeGreaterThanOrEqual(44);
    }
  }
});

test("the app home reached from the welcome page keeps the bottom bar behaviour", async ({ page }) => {
  await open(page, "/", { height: 700 });
  await page.locator(".landing__actions").getByRole("button", { name: "Ouvrir MushafPlus" }).click({ timeout: 30_000 });
  await expect(page.locator(".mobile-navigation")).toBeVisible();
  const main = page.locator("#main-content");
  for (let attempt = 0; attempt < 6; attempt++) {
    for (const top of [0, 120, 320]) {
      await main.evaluate((node, value) => { node.scrollTop = value; }, top);
      await page.waitForTimeout(150);
    }
    if (await page.locator(".app-root.nav-away").count()) break;
  }
  await expect(page.locator(".app-root.nav-away")).toHaveCount(1);
});

test("the Home tab of the reader leads to /accueil, not back to the welcome page", async ({ page }) => {
  await open(page, "/");
  await page.getByRole("button", { name: "Commencer la lecture" }).click({ timeout: 30_000 });
  await expect(page).toHaveURL(/\/surah\/1$/);
  await page.locator(".mobile-navigation__item[data-destination='home']").click();
  await expect(page).toHaveURL(/\/accueil$/);
  await expect(page.locator(".app-view-home")).toBeVisible();
  await expect(page.locator(".landing")).toHaveCount(0);
});

test("the demo section plays the recording of the chosen step and keeps the controls when motion is reduced", async ({ page }) => {
  await open(page, "/");
  const section = page.locator(".landing-how");
  await section.scrollIntoViewIfNeeded({ timeout: 30_000 });
  await expect(section.locator("video.is-active")).toHaveAttribute("src", /app-onboarding\.mp4$/);
  await section.getByRole("button", { name: /Lisez et faites défiler/ }).click();
  await expect(section.locator("video.is-active")).toHaveAttribute("src", /app-scroll\.mp4$/);
  await expect(section.getByRole("button", { name: /Lisez et faites défiler/ })).toHaveAttribute("aria-current", "step");
});

test("with reduced motion the demo does not autoplay and shows its controls", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, "/");
  const video = page.locator(".landing-how video.is-active");
  await video.scrollIntoViewIfNeeded({ timeout: 30_000 });
  await expect(video).toHaveAttribute("controls", "");
  expect(await video.evaluate((node) => node.paused)).toBe(true);
});
