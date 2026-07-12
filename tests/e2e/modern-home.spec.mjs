import { test, expect } from "@playwright/test";

const widths = [360, 390, 768, 1440];

function collectFailures(page) {
  const failures = [];
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      failures.push(`console ${message.type()}: ${message.text()}`);
    }
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      failures.push(`response ${response.status()}: ${response.url()}`);
    }
  });
  return failures;
}

test("searches surahs and exposes a clear empty state", async ({ page }) => {
  const failures = collectFailures(page);
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Revenir au texte, simplement." })).toBeVisible();
  await page.getByRole("button", { name: "Rechercher" }).click();
  const search = page.getByRole("searchbox", { name: "Nom, traduction ou numero" });
  await expect(search).toBeFocused();

  await search.fill("vache");
  await expect(page.getByRole("link", { name: /Al-Baqara/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Al-Fatiha/ })).toHaveCount(0);

  await search.fill("aucune-sourate");
  await expect(page.getByText("Aucune sourate ne correspond a cette recherche.")).toBeVisible();
  expect(failures).toEqual([]);
});

test("loads more surahs and opens the modern reader", async ({ page }) => {
  await page.goto("/");
  const surahLinks = page.locator(".modern-home__surah-list a");
  await expect(surahLinks).toHaveCount(12);
  await page.getByRole("button", { name: "Afficher plus de sourates" }).click();
  await expect(surahLinks).toHaveCount(30);

  const resume = page.getByRole("link", { name: /Reprendre la lecture/ });
  await expect(resume).toHaveAttribute("href", /\/surah\/\d+/);
  await resume.click();
  await expect(page).toHaveURL(/\/surah\/\d+/);
  await expect(page.locator(".modern-reader")).toBeVisible();
});

for (const width of widths) {
  for (const theme of ["light", "dark"]) {
    test(`home ${width}px ${theme} is stable`, async ({ page }) => {
      await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
      await page.addInitScript(
        ({ selectedTheme }) => localStorage.setItem("mushaf-plus-modern-theme", selectedTheme),
        { selectedTheme: theme },
      );
      const failures = collectFailures(page);
      await page.goto("/");
      await expect(page.locator(".modern-app")).toHaveAttribute("data-modern-theme", theme);
      await expect(page.locator(".modern-home__resume")).toBeVisible();
      const metrics = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        navPosition: getComputedStyle(document.querySelector(".modern-nav")).position,
        navTop: document.querySelector(".modern-nav").getBoundingClientRect().top,
        actionsTop: document.querySelector(".modern-header__actions").getBoundingClientRect().top,
      }));
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
      if (width <= 768) {
        expect(metrics.navPosition).toBe("static");
        expect(metrics.actionsTop).toBeLessThan(metrics.navTop);
      }
      expect(failures).toEqual([]);
    });
  }
}
