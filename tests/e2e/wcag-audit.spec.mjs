import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "mushaf-plus-settings",
      JSON.stringify({
        skipSplashAnimation: true,
        showHome: false,
        showDuas: false,
        sidebarOpen: false,
        displayMode: "surah",
        mushafLayout: "list",
        showTranslation: true,
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

async function expectAccessibleDialog(page, name) {
  const dialog = page.getByRole("dialog", { name });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await expect(dialog.locator(".ayah-action-sheet__close")).toHaveAccessibleName(
    "Fermer",
  );
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.activeElement?.closest(".ayah-action-sheet")?.getAttribute(
            "role",
          ) || "",
      ),
    )
    .toBe("dialog");
  return dialog;
}

test("les panneaux d’actions ont un nom, piègent le focus et le restaurent", async ({
  page,
}) => {
  const studyTrigger = page.locator(".qcom-list-study-link").first();
  await studyTrigger.focus();
  await studyTrigger.click();

  const studyDialog = await expectAccessibleDialog(
    page,
    "Comprendre cette ayah",
  );
  await expect(studyDialog.getByRole("tablist")).toHaveAccessibleName(
    "Rubriques d’étude",
  );

  for (let index = 0; index < 12; index += 1) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(() =>
        Boolean(document.activeElement?.closest(".ayah-action-sheet")),
      ),
    ).toBe(true);
  }

  const axeResults = await new AxeBuilder({ page })
    .include(".ayah-action-sheet")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    axeResults.violations.filter(
      (violation) =>
        violation.impact === "critical" || violation.impact === "serious",
    ),
  ).toEqual([]);

  await page.keyboard.press("Escape");
  await expect(studyDialog).toBeHidden();
  await expect(studyTrigger).toBeFocused();
});

test("partage, playlist et note exposent des dialogues correctement étiquetés", async ({
  page,
}) => {
  await page.locator(".ayah-action--share").first().click();
  await expectAccessibleDialog(page, "Exporter cette ayah");
  await page.keyboard.press("Escape");

  const noteTrigger = page.locator(".ayah-action--note").first();
  await noteTrigger.click();
  const noteDialog = await expectAccessibleDialog(page, "Ecrire sur cette ayah");
  await expect(
    noteDialog.getByRole("textbox", {
      name: "Note personnelle sur ce verset",
    }),
  ).toBeVisible();
  await page.keyboard.press("Escape");

  await page.locator(".ayah-action--options").first().click();
  await page.getByRole("menuitem", { name: /Playlists/ }).click();
  await expectAccessibleDialog(page, "Ajouter à une playlist");
  await page.keyboard.press("Escape");
});

test("navigation, réglages et lecture exposent leurs relations accessibles", async ({
  page,
}) => {
  await page.locator(".mp-header__title-btn").click();
  await expect(
    page.getByRole("spinbutton", { name: /Sourate|Page|Juz/i }),
  ).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: /Menu/i }).first().click();
  const selectedSidebarTab = page.locator('#sidebar [role="tab"][aria-selected="true"]');
  const panelId = await selectedSidebarTab.getAttribute("aria-controls");
  expect(panelId).toBeTruthy();
  await expect(page.locator(`#${panelId}`)).toHaveAttribute("role", "tabpanel");
  await page.keyboard.press("Escape");

  const settingsButton = page.locator(".mp-header__settings").first();
  if (await settingsButton.isVisible().catch(() => false)) {
    await settingsButton.click();
  } else {
    await page.locator(".mp-header__more").first().click();
    await page.locator('.mp-header-menu__item[data-key="settings"]').click();
  }
  await page.getByRole("tab", { name: /Affichage|Display/i }).click();
  await expect(page.locator("#settings-font-family")).toHaveAccessibleName(
    /Police|Font/i,
  );
  await page.getByRole("tab", { name: /Audio/i }).click();
  await expect(page.getByLabel(/Rechercher.*récitant/i)).toBeVisible();
});
