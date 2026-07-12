import { test, expect } from "@playwright/test";

const widths = [360, 390, 768, 1440];

function collectRuntimeFailures(page) {
  const failures = [];
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
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

test("loads a clean modern shell and switches theme", async ({ page }) => {
  const failures = collectRuntimeFailures(page);
  await page.goto("/");

  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Navigation principale" })).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByText("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ")).toBeVisible();

  const themeButton = page.getByRole("button", { name: "Activer le theme sombre" });
  await themeButton.click();
  await expect(page.locator(".modern-app")).toHaveAttribute("data-modern-theme", "dark");
  await expect(page.getByRole("button", { name: "Activer le theme clair" })).toBeVisible();

  const fonts = await page.locator(".modern-arabic").evaluate((element) => ({
    family: getComputedStyle(element).fontFamily,
    loaded: document.fonts.check(`40px ${JSON.stringify(getComputedStyle(element).fontFamily.split(",")[0])}`),
  }));
  expect(fonts.family).toContain("Scheherazade New");
  expect(fonts.loaded).toBe(true);
  expect(failures).toEqual([]);
});

for (const width of widths) {
  for (const theme of ["light", "dark"]) {
    test(`${width}px ${theme} has no horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
      await page.addInitScript(
        ({ selectedTheme }) => localStorage.setItem("mushaf-plus-modern-theme", selectedTheme),
        { selectedTheme: theme },
      );
      const failures = collectRuntimeFailures(page);
      await page.goto("/");
      await expect(page.locator(".modern-app")).toHaveAttribute("data-modern-theme", theme);
      const metrics = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
      expect(failures).toEqual([]);
    });
  }
}
