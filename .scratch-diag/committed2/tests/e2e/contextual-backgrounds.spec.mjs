import { expect, test } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";

const SETTINGS_KEY = "mushaf-plus-settings";

async function seed(page, overrides) {
  await page.addInitScript(({ key, overrides }) => {
    localStorage.setItem(
      key,
      JSON.stringify({
        skipSplashAnimation: true,
        sidebarOpen: false,
        lang: "fr",
        riwaya: "hafs",
        displayMode: "surah",
        ...overrides,
      }),
    );
  }, { key: SETTINGS_KEY, overrides });
}

async function pseudoStyle(page, selector) {
  return page.locator(selector).evaluate((node) => {
    const style = getComputedStyle(node, "::before");
    return {
      background: style.backgroundImage,
      opacity: Number.parseFloat(style.opacity),
    };
  });
}

test("home, audio and reading use distinct asset-free atmospheres", async ({ page }) => {
  await installQuranNetworkFixtures(page);
  await seed(page, { showHome: true, showDuas: false, homeSection: "surah" });
  await page.goto("/");

  const root = page.locator(".app-root");
  await expect(root).toHaveAttribute("data-view", "home");
  await expect(root).toHaveAttribute("data-home-section", "surah");
  const home = await pseudoStyle(page, ".app-view-home");
  expect(home.background).toContain("gradient");
  expect(home.background).not.toContain("url(");

  await root.evaluate((node) => node.setAttribute("data-home-section", "audio"));
  const audio = await pseudoStyle(page, ".app-view-home");
  expect(audio.background).toContain("gradient");
  expect(audio.background).not.toBe(home.background);

  await page.goto("/surah/14");
  await expect(root).toHaveAttribute("data-view", "reading");
  const reading = await pseudoStyle(page, ".app-view-reading");
  expect(reading.background).toContain("gradient");
  expect(reading.background).not.toBe(home.background);
});

test("duas atmosphere adapts to mobile and all three themes", async ({ page }) => {
  await seed(page, { showHome: true, showDuas: false, theme: "light" });
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/");

  const root = page.locator(".app-root");
  await page.locator(".mp-header__more").first().click();
  await page.locator('.mp-header-menu__item[data-key="duas"]').click();
  await expect(root).toHaveAttribute("data-view", "duas");
  const duas = await pseudoStyle(page, ".app-view-duas");
  expect(duas.background).toContain("gradient");
  expect(duas.opacity).toBeLessThanOrEqual(0.72);

  const colors = [];
  for (const theme of ["light", "sepia", "dark"]) {
    colors.push(await root.evaluate((node, nextTheme) => {
      document.documentElement.dataset.theme = nextTheme;
      return getComputedStyle(node).getPropertyValue("--context-glow").trim();
    }, theme));
  }
  expect(new Set(colors).size).toBe(3);
});
