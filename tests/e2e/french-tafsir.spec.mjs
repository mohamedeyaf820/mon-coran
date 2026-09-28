import { expect, test } from "@playwright/test";

// Renders the French tafsir through the app's real verse-action flow to prove the
// vendored Al-Mukhtasar edition is served offline (same-origin asset), is the
// French reader's default source, and carries its attribution + error-report link.
test.describe("French tafsir (Al-Mukhtasar)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      if (sessionStorage.getItem("mp-fr-tafsir-seed")) return;
      sessionStorage.setItem("mp-fr-tafsir-seed", "1");
      localStorage.setItem(
        "mushaf-plus-settings",
        JSON.stringify({
          skipSplashAnimation: true,
          showHome: false,
          showDuas: false,
          sidebarOpen: false,
          displayMode: "surah",
          mushafLayout: "list",
          showTranslation: false,
          lang: "fr",
          theme: "light",
          riwaya: "hafs",
          lastPosition: { surah: 1, ayah: 1, page: 1, juz: 1 },
        }),
      );
    });
    await page.goto("/surah/1");
    await expect(page.locator(".qc-verse-card").first()).toBeVisible({
      timeout: 30_000,
    });
  });

  const openTafsir = async (page) => {
    await page.locator(".ayah-action--options").first().click();
    await page.getByRole("menuitem", { name: "Tafsir" }).click();
    const dialog = page.getByRole("dialog", { name: /1:1/ });
    await expect(dialog).toBeVisible();
    return dialog;
  };

  test("shows the French commentary by default, from the local asset", async ({
    page,
  }) => {
    const dialog = await openTafsir(page);

    // The default source for a French reader is the vendored French edition,
    // not the English Ibn Kathir that stood in before it existed.
    await expect(page.locator("#tafsir-source-select")).toHaveValue(
      "fr-mokhtasar",
    );

    // The article carries French prose and none of the English fallback wording.
    const article = dialog.locator("article");
    await expect(article).toBeVisible();
    await expect
      .poll(async () => (await article.innerText()).length, { timeout: 15_000 })
      .toBeGreaterThan(40);
    const text = await article.innerText();
    expect(text).toMatch(/[a-zà-ÿ]/i);
    expect(text.toLowerCase()).not.toMatch(/arabic ibn kathir/);

    // Attribution + a real error-report link wired to the project's GitHub issues.
    await expect(
      dialog.getByRole("link", { name: /Signaler une erreur/i }),
    ).toHaveAttribute("href", /\/issues\/new/);
    await expect(dialog.getByText(/Awqaf/i)).toBeVisible();
  });

  test("lists a French source group and stays readable on a phone and wide screen", async ({
    page,
  }) => {
    const dialog = await openTafsir(page);

    const optionText = await page
      .locator("#tafsir-source-select option[value='fr-mokhtasar']")
      .innerText();
    expect(optionText).toMatch(/\[FR\]/);
    await expect(
      page.locator("#tafsir-source-select optgroup[label='Français']"),
    ).toHaveCount(1);

    // The French body renders LTR even though the app chrome may mirror.
    await expect(dialog.locator("article")).toHaveAttribute("dir", "ltr");

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(dialog.locator("article")).toBeInViewport();
    const overflowX = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflowX).toBeLessThanOrEqual(1);

    await page.screenshot({
      path: "test-results/french-tafsir-phone.png",
      fullPage: false,
    });
  });
});
