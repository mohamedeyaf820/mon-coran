import { expect, test } from "@playwright/test";

const SETTINGS = {
  skipSplashAnimation: true,
  showHome: false,
  showDuas: false,
  sidebarOpen: false,
  displayMode: "surah",
  mushafLayout: "list",
  showTranslation: true,
  lang: "fr",
  riwaya: "hafs",
  theme: "light",
};

test.use({ serviceWorkers: "block" });

test.beforeEach(async ({ page }) => {
  await page.addInitScript((settings) => {
    localStorage.setItem("mushaf-plus-settings", JSON.stringify(settings));
  }, SETTINGS);
});

test("un lien profond vers un verset atterrit sur ce verset", async ({ page }) => {
  test.slow();

  await page.goto("/surah/2/250");
  const target = page.locator("#ayah-250");
  await expect(target).toBeAttached({ timeout: 20_000 });

  // The sheet keeps growing while the Arabic web fonts and the lazily rendered
  // verses settle, so wait for the anchor to stop moving before judging it.
  let previous = -1;
  let offset = -2;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    offset = await target.evaluate((el) => Math.round(el.getBoundingClientRect().top));
    if (offset === previous) break;
    previous = offset;
    await page.waitForTimeout(150);
  }

  const viewport = page.viewportSize();
  expect(offset).toBeGreaterThanOrEqual(-200);
  expect(offset).toBeLessThanOrEqual(viewport.height * 0.75);
});

test("la colonne de lecture revient en haut sans animation", async ({ page }) => {
  await page.goto("/surah/1");
  const shell = page.locator("#main-content");
  await expect(shell).toBeVisible();

  // scroll-behavior also drives scrollTop assignments and behavior:"auto", so a
  // smooth shell turns every navigation reset into a multi-second flight.
  await expect
    .poll(() => shell.evaluate((el) => getComputedStyle(el).scrollBehavior))
    .toBe("auto");

  const landed = await shell.evaluate(async (el) => {
    el.scrollTop = 30_000;
    el.scrollTo({ top: 0, behavior: "auto" });
    await new Promise((resolve) => requestAnimationFrame(resolve));
    return Math.round(el.scrollTop);
  });
  expect(landed).toBe(0);
});
