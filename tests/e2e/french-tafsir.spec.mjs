import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const QURANENC_SURAH = "https://quranenc.com/api/v1/translation/sura/french_mokhtasar/*";
// A real QuranEnc response for surah 1 (tests/fixtures), so the suite never
// depends on the third-party API being reachable.
const SURAH_1 = readFileSync("tests/fixtures/quranenc-french-mokhtasar-001.json", "utf8");

// Renders the French tafsir through the app's real verse-action flow to prove the
// Al-Mukhtasar edition is fetched from QuranEnc, is the French reader's default
// source, reopens from the device when the API is unreachable, and carries its
// attribution + error-report link.
test.describe("French tafsir (Al-Mukhtasar)", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(QURANENC_SURAH, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: SURAH_1,
      }),
    );
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

  test("shows the French commentary by default, from QuranEnc", async ({
    page,
  }) => {
    const dialog = await openTafsir(page);

    // The default source for a French reader is the French edition, not the
    // English Ibn Kathir that stood in before it existed.
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
    await expect(dialog.getByText(/Centre Tafsir/i)).toBeVisible();
    await expect(dialog.getByText(/texte de QuranEnc\.com/i)).toBeVisible();
    await expect(dialog.getByText(/Awqaf/i)).toHaveCount(0);
    await expect(dialog.getByText("QuranEnc.com", { exact: true })).toBeVisible();
  });

  test("reopens a surah already read when the API is unreachable", async ({
    page,
  }) => {
    const first = await openTafsir(page);
    await expect
      .poll(async () => (await first.locator("article").innerText()).length, {
        timeout: 15_000,
      })
      .toBeGreaterThan(40);
    const expected = await first.locator("article").innerText();

    // Reload so the in-memory copy is gone, then cut the API: only the copy kept
    // on the device can answer.
    await page.unroute(QURANENC_SURAH);
    await page.route(QURANENC_SURAH, (route) => route.abort("internetdisconnected"));
    await page.reload();
    await expect(page.locator(".qc-verse-card").first()).toBeVisible({
      timeout: 30_000,
    });
    const reopened = await openTafsir(page);
    await expect(reopened.locator("article")).toHaveText(expected, {
      timeout: 15_000,
    });
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
