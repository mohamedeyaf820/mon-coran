import { test, expect } from "@playwright/test";

async function openReader(page) {
  await page.goto("/");
  const start = page.getByRole("button", {
    name: /Commencer la lecture|Reprendre la lecture|Continuer|Start reading|Continue|Resume reading/i,
  });
  await expect(start.first()).toBeVisible();
  await start.first().click();
  await expect(page.locator(".qc-ayah-text-ar").first()).toBeVisible();
}

test("A11y: le lien d'évitement ne décale pas l'accueil mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const header = page.locator("header").first();
  await expect(header).toBeVisible();
  const headerBox = await header.boundingBox();
  expect(headerBox?.y ?? 999).toBeLessThan(2);

  const skipLink = page.locator('a[href="#main-content"]');
  await expect(skipLink).not.toBeInViewport();
  await page.keyboard.press("Tab");
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeInViewport();

  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();

  await expect(
    page.getByRole("button", { name: /^Commencer la lecture$/i }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: /^Commencer la lecture: .+/i }),
  ).toHaveCount(1);
});

test("A11y: les notifications utilisent la langue de l'interface", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "mushaf-plus-settings",
      JSON.stringify({
        lang: "ar",
        theme: "light",
        riwaya: "hafs",
        showHome: true,
        skipSplashAnimation: true,
      }),
    );
  });
  await page.goto("/");
  await page.evaluate(() => {
    window.dispatchEvent(
      new CustomEvent("quran-toast", {
        detail: { type: "info", message: "اختبار" },
      }),
    );
  });

  await expect(page.getByRole("alert")).toContainText("اختبار");
  await expect(
    page.getByRole("button", { name: "إغلاق" }),
  ).toBeVisible();
});

test("A11y smoke: landmarks, focus clavier et modal recherche", async ({ page }) => {
  await openReader(page);

  const main = page.locator("main").first();
  await expect(main).toBeVisible();

  const ayahCount = await page.locator(".qc-ayah-text-ar").count();
  expect(ayahCount).toBeGreaterThan(0);

  const menuButton = page.getByRole("button", { name: /Menu/i }).first();
  await expect(menuButton).toBeVisible();
  await menuButton.focus();
  await page.keyboard.press("Tab");

  const activeTag = await page.evaluate(() => document.activeElement?.tagName || "");
  expect(activeTag).not.toBe("BODY");

  const searchButton = page.getByRole("button", { name: /Rechercher|Search|بحث/i }).first();
  await expect(searchButton).toBeVisible();
  await searchButton.focus();
  await page.keyboard.press("Enter");

  const searchModal = page.locator(".search-pro-overlay");
  await expect(searchModal).toBeVisible();
  await expect(searchModal.locator("input").first()).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(searchModal).toBeHidden();
});

test("A11y: la sidebar est inerte fermée et piège le focus ouverte", async ({ page }) => {
  const accessibilityWarnings = [];
  page.on("console", (message) => {
    if (/aria-hidden|inert/i.test(message.text())) {
      accessibilityWarnings.push(message.text());
    }
  });

  await openReader(page);

  const sidebar = page.locator("#sidebar");
  await expect(sidebar).toHaveCount(1);
  await expect(sidebar).toHaveAttribute("inert", "");
  await expect(sidebar).toHaveAttribute("aria-hidden", "true");

  const menuButton = page.getByRole("button", { name: /Menu/i }).first();
  await menuButton.focus();
  await menuButton.click();

  await expect(sidebar).toHaveClass(/\bopen\b/);
  await expect(sidebar).not.toHaveAttribute("inert");
  await expect(sidebar).toHaveAttribute("aria-modal", "true");
  await expect(
    sidebar.getByRole("textbox", { name: /Rechercher une sourate/i }),
  ).toBeVisible();

  await expect
    .poll(() =>
      page.evaluate(() => document.activeElement?.closest("#sidebar")?.id || ""),
    )
    .toBe("sidebar");

  for (let index = 0; index < 12; index += 1) {
    await page.keyboard.press("Tab");
    const focusOwner = await page.evaluate(
      () => document.activeElement?.closest("#sidebar")?.id || "",
    );
    expect(focusOwner).toBe("sidebar");
  }

  await page.keyboard.press("Escape");
  await expect(sidebar).not.toHaveClass(/\bopen\b/);
  await expect(sidebar).toHaveAttribute("inert", "");
  await expect(sidebar).toHaveAttribute("aria-hidden", "true");
  await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute("aria-controls"))).toBe("sidebar");
  expect(accessibilityWarnings).toEqual([]);
});

test("A11y: la recherche du lecteur garde un contraste lisible en thème sombre", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "mushaf-plus-settings",
      JSON.stringify({
        lang: "fr",
        theme: "dark",
        riwaya: "hafs",
        displayMode: "surah",
        showHome: false,
        currentSurah: 4,
        skipSplashAnimation: true,
      }),
    );
  });
  await page.goto("/surah/4");
  await expect(page.locator(".srh-root")).toBeVisible();

  await page.getByRole("button", { name: /Rechercher/i }).first().click();
  const searchModal = page.locator(".search-pro");
  await expect(searchModal).toBeVisible();

  const contrast = await searchModal.locator("h2").evaluate((title) => {
    const parseRgb = (value) =>
      (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    const luminance = (value) => {
      const channels = parseRgb(value).map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    };

    const foreground = luminance(getComputedStyle(title).color);
    const header = title.closest(".search-pro__header");
    const background = luminance(getComputedStyle(header).backgroundColor);
    const lighter = Math.max(foreground, background);
    const darker = Math.min(foreground, background);
    return (lighter + 0.05) / (darker + 0.05);
  });

  expect(contrast).toBeGreaterThanOrEqual(4.5);
});
