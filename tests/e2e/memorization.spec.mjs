import { test, expect } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";

async function goToSurah(page, surahNum = 1) {
  await installQuranNetworkFixtures(page);
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  if (
    !(await page
      .locator(".qc-verse-card, .qc-ayah-text-ar")
      .first()
      .isVisible()
      .catch(() => false))
  ) {
    const cta = page.getByRole("button", {
      name: /Commencer|Reprendre|Continuer|Start|Continue|Resume/i,
    });
    await cta.first().click();
  }

  await expect(page.locator(".qc-verse-card, .qc-ayah-text-ar").first()).toBeVisible({
    timeout: 20000,
  });

  const sidebar = page.getByRole("complementary", {
    name: /Navigation Coran|Quran navigation/i,
  });
  if (await sidebar.isVisible().catch(() => false)) {
    const clickout = page.locator(".sidebar-clickout-overlay").first();
    if (await clickout.isVisible().catch(() => false)) {
      await clickout.click({ position: { x: 1000, y: 120 } });
      await expect(clickout).toBeHidden({ timeout: 5000 }).catch(() => null);
    }
  }

  if (surahNum !== 1) {
    const nextSurah = page
      .getByRole("button", {
        name: /Sourate suivante|Next surah/i,
      })
      .first();
    if (await nextSurah.isVisible().catch(() => false)) {
      await nextSurah.click();
      await expect(page.locator(".qc-verse-card, .qc-ayah-text-ar").first()).toBeVisible({
        timeout: 20000,
      });
    }
  }
}

test.describe("Lecteur sans mode mémorisation", () => {
  test("aucune commande de mémorisation n’est exposée", async ({
    page,
  }) => {
    await goToSurah(page, 1);

    await expect(
      page.getByRole("button", {
        name: /Mémorisation|Memorization|وضع الحفظ/i,
      }),
    ).toHaveCount(0);
    await expect(page.locator(".mem-container")).toHaveCount(0);
    await expect(page.locator(".app-root")).not.toHaveClass(/is-memorizing/);
  });

  test("Switch Hafs vers Warsh ne casse pas le rendu des ayahs", async ({
    page,
  }) => {
    await goToSurah(page, 2);

    const initialCount = await page.locator(".qc-ayah-text-ar, .qc-verse-card").count();
    expect(initialCount).toBeGreaterThan(0);

    const riwayaToggle = page
      .getByRole("button", {
        name: /Changer de riwaya|riwaya|Warsh|Hafs/i,
      })
      .first();
    if (await riwayaToggle.isVisible()) {
      await riwayaToggle.click();
      await page.waitForTimeout(1000);

      const afterCount = await page.locator(".qc-ayah-text-ar, .qc-verse-card").count();
      expect(afterCount).toBeGreaterThan(0);
    } else {
      test.info().annotations.push({
        type: "note",
        description: "Toggle Riwaya non trouve dans le header",
      });
    }
  });

});
