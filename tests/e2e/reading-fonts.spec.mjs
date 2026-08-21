import { test, expect } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";

async function openReader(page, { withWaqfSigns = false } = {}) {
  await installQuranNetworkFixtures(page, { withWaqfSigns });
  await page.goto(withWaqfSigns ? "/surah/3" : "/surah/1/1");
  await expect(page.locator(".quran-display--platform")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.locator(".qc-ayah-text-ar").first()).toBeVisible({
    timeout: 30_000,
  });
}

async function expectFontFamily(locator, family) {
  await expect
    .poll(() =>
      locator.evaluate((element) => window.getComputedStyle(element).fontFamily),
    )
    .toContain(family);
}

async function expectCanonicalWaqfMark(page, riwaya) {
  const marker = page.locator(".waqf-marker:visible").first();
  await expect(marker).toBeVisible();
  const metrics = await marker.evaluate((element) => {
    const style = getComputedStyle(element);
    const ayah = element.closest(".qc-ayah-text-ar, .verse-text");
    const ayahStyle = ayah ? getComputedStyle(ayah) : null;
    return {
      text: element.textContent || "",
      fontFamily: style.fontFamily,
      fontRatio: ayahStyle
        ? Number.parseFloat(style.fontSize) / Number.parseFloat(ayahStyle.fontSize)
        : 1,
    };
  });

  expect(metrics.text).toMatch(/[\u06D6-\u06DC]/u);
  expect(metrics.text).not.toMatch(/(?:صلى|قلى|∴)/u);
  expect(metrics.text).not.toContain("\u25CC");
  expect(metrics.fontRatio).toBeLessThanOrEqual(0.8);
  expect(metrics.fontFamily).toContain(riwaya === "warsh" ? "Warsh" : "QPC Hafs");
}

async function expectCanonicalQuranFlow(locator, { maxLeading }) {
  await expect(locator).toBeVisible();
  const metrics = await locator.evaluate((element) => {
    const style = window.getComputedStyle(element);
    const fontSize = Number.parseFloat(style.fontSize);
    const lineHeight = Number.parseFloat(style.lineHeight);
    return {
      direction: style.direction,
      letterSpacing: style.letterSpacing,
      wordSpacing: style.wordSpacing,
      leading: lineHeight / fontSize,
      text: element.textContent || "",
    };
  });

  expect(metrics.direction).toBe("rtl");
  expect(["0px", "normal"]).toContain(metrics.letterSpacing);
  expect(["0px", "normal"]).toContain(metrics.wordSpacing);
  expect(metrics.leading).toBeGreaterThanOrEqual(1.6);
  expect(metrics.leading).toBeLessThanOrEqual(maxLeading);
  expect(metrics.text).not.toContain("\u25cc");
}

async function revealReaderTools(page) {
  const trigger = page
    .locator(".srh-identity__disclosure:visible, .srh-mobile-bar__disclosure:visible")
    .first();
  await expect(trigger).toBeVisible();
  if ((await trigger.getAttribute("aria-expanded")) !== "true") {
    await trigger.focus();
    await trigger.press("Enter");
  }
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
}

async function switchToMushaf(page) {
  await revealReaderTools(page);
  await page.getByRole("radio", { name: "Mushaf", exact: true }).click();
  await expect(page.locator(".mushaf-container .verse-text").first()).toBeVisible();
}

async function openTypographyPanel(page) {
  await revealReaderTools(page);
  const select = page.getByRole("combobox", { name: "Police arabe" }).first();
  const typographyTrigger = page.locator(".srh-typography-trigger").first();
  await expect
    .poll(async () =>
      Number(await select.isVisible()) + Number(await typographyTrigger.isVisible()),
    )
    .toBeGreaterThan(0);
  if (!(await select.isVisible()) && (await typographyTrigger.isVisible())) {
    await typographyTrigger.click();
  }
  await expect(select).toBeVisible({ timeout: 5000 });
  return select;
}

test("Hafs font selection applies to list and Mushaf layouts", async ({ page }) => {
  await openReader(page);

  const hafsFontSelect = await openTypographyPanel(page);
  await hafsFontSelect.selectOption("amiri-quran");
  await expectFontFamily(page.locator(".qc-ayah-text-ar").first(), "Amiri Quran");

  await switchToMushaf(page);
  await expectFontFamily(
    page.locator(".mushaf-container .verse-text").first(),
    "Amiri Quran",
  );

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator(".quran-display--platform")).toBeVisible({
    timeout: 30_000,
  });
  await revealReaderTools(page);
  await page.getByRole("radio", { name: "Liste", exact: true }).click();
  await expectFontFamily(page.locator(".qc-ayah-text-ar").first(), "Amiri Quran");
});

test("Warsh font selection applies to list and Mushaf layouts", async ({ page }) => {
  await openReader(page);

  await page.getByRole("button", { name: "Changer de riwaya" }).click();
  await expect(page.locator(".quran-display--warsh")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.locator(".qc-ayah-text-ar").first()).toBeVisible({
    timeout: 30_000,
  });

  const warshFontSelect = await openTypographyPanel(page);
  await warshFontSelect.selectOption("scheherazade-new-warsh");
  await expectFontFamily(
    page.locator(".qc-ayah-text-ar").first(),
    "Scheherazade New",
  );

  await switchToMushaf(page);
  await expectFontFamily(
    page.locator(".mushaf-container .verse-text").first(),
    "Scheherazade New",
  );
});

const FONT_MATRIX = {
  hafs: [
    ["qpc-hafs", "QPC Hafs"],
    ["qpc-indopak", "IndoPak"],
    ["scheherazade-new", "Scheherazade New"],
    ["amiri-quran", "Amiri Quran"],
    ["noto-naskh-arabic", "Noto Naskh Arabic"],
  ],
  warsh: [
    ["qpc-warsh", "QPC Warsh"],
    ["kfgqpc-warsh", "KFGQPC Warsh"],
    ["scheherazade-new-warsh", "Scheherazade New"],
  ],
};

for (const [riwaya, fonts] of Object.entries(FONT_MATRIX)) {
  test(`${riwaya}: every exposed Quran font keeps a compact continuous flow`, async ({
    page,
  }) => {
    await page.addInitScript(({ riwaya, fontFamily }) => {
      localStorage.setItem(
        "mushaf-plus-settings",
        JSON.stringify({
          skipSplashAnimation: true,
          showHome: false,
          displayMode: "surah",
          mushafLayout: "list",
          lang: "fr",
          riwaya,
          fontFamily,
          quranFontSize: 34,
          showTajwid: true,
        }),
      );
    }, { riwaya, fontFamily: fonts[0][0] });

    await page.setViewportSize({ width: 319, height: 698 });
    await openReader(page, { withWaqfSigns: true });
    await expect(
      page.locator(
        riwaya === "warsh" ? ".quran-display--warsh" : ".quran-display--hafs",
      ),
    ).toBeVisible({ timeout: 30_000 });

    await revealReaderTools(page);
    await page.getByRole("radio", { name: "Liste", exact: true }).click();
    for (const [fontId, family] of fonts) {
      const select = await openTypographyPanel(page);
      await select.selectOption(fontId);
      const listText = page.locator(".qc-ayah-text-ar").first();
      await expectFontFamily(listText, family);
      await expectCanonicalQuranFlow(listText, { maxLeading: 1.92 });
      await expectCanonicalWaqfMark(page, riwaya);
    }

    await switchToMushaf(page);
    for (const [fontId, family] of fonts) {
      const select = await openTypographyPanel(page);
      await select.selectOption(fontId);
      const mushafText = page.locator(".mushaf-container .verse-text").first();
      await expectFontFamily(mushafText, family);
      await expectCanonicalQuranFlow(mushafText, { maxLeading: 1.78 });
      await expectCanonicalWaqfMark(page, riwaya);
    }
  });
}
