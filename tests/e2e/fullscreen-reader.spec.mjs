import { expect, test } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";

const SETTINGS_KEY = "mushaf-plus-settings";

async function openFullscreenReader(page, viewport, overrides = {}) {
  await page.setViewportSize(viewport);
  await installQuranNetworkFixtures(page);
  await page.addInitScript(({ key, overrides }) => {
    localStorage.setItem(key, JSON.stringify({
      skipSplashAnimation: true,
      showHome: false,
      showDuas: false,
      sidebarOpen: false,
      displayMode: "surah",
      mushafLayout: "mushaf",
      lang: "fr",
      riwaya: "hafs",
      currentSurah: 3,
      currentPage: 50,
      lastPosition: { surah: 3, ayah: 1, page: 50, juz: 3 },
      ...overrides,
    }));
  }, { key: SETTINGS_KEY, overrides });
  await page.goto(overrides.currentPage ? `/page/${overrides.currentPage}` : "/surah/3");
  await expect(page.locator(".quran-display--platform")).toBeVisible({ timeout: 30_000 });
  const trigger = page.locator(":is(.reader-fullscreen-trigger, .srh-fullscreen-btn):visible").first();
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(page.locator(".mfp-portal-root")).toBeVisible({ timeout: 30_000 });
  return trigger;
}

test("fullscreen reader keeps accessible audio and settings controls", async ({ page }) => {
  await openFullscreenReader(page, { width: 1280, height: 800 });
  const overlay = page.locator(".mfp-portal-root");

  await expect(page.locator("body")).toHaveClass(/mfp-open/);
  await expect(overlay.getByRole("button", { name: "Lecture" }).first()).toBeVisible();
  await expect(overlay.getByRole("button", { name: "Audio" }).first()).toBeVisible();

  const undersizedControls = await overlay.locator("button:visible").evaluateAll((buttons) =>
    buttons.filter((button) => {
      const box = button.getBoundingClientRect();
      return box.width < 44 || box.height < 44;
    }).map((button) => button.getAttribute("aria-label")),
  );
  expect(undersizedControls).toEqual([]);

  await overlay.getByRole("button", { name: "Audio" }).first().click();
  const modal = page.locator(".audio-player-modal--simple");
  await expect(modal).toBeVisible();
  const layers = await page.evaluate(() => ({
    modal: Number(getComputedStyle(document.querySelector(".audio-player-modal--simple")).zIndex),
    overlay: Number(getComputedStyle(document.querySelector(".mfp-portal-root")).zIndex),
  }));
  expect(layers.modal).toBeGreaterThan(layers.overlay);
  await page.keyboard.press("Escape");
  await expect(modal).toBeHidden();
  await expect(overlay).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(overlay).toBeHidden();
  await expect(page.locator(":is(.reader-fullscreen-trigger, .srh-fullscreen-btn):visible").first()).toBeFocused();
});

test("mobile fullscreen reader fits without clipped controls", async ({ page }) => {
  await openFullscreenReader(page, { width: 390, height: 844 });
  const overlay = page.locator(".mfp-portal-root");
  await expect(overlay.locator(".mfp-mobile-footer")).toBeVisible();
  const overflow = await overlay.evaluate((element) => element.scrollWidth - element.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.screenshot({ path: "test-results/fullscreen-reader-mobile.png" });
});

test("Warsh fullscreen uses the shared 15-line page with one marker per ayah", async ({ page }) => {
  await openFullscreenReader(page, { width: 390, height: 844 }, {
    displayMode: "page",
    currentPage: 50,
    currentSurah: 3,
    currentJuz: 3,
    lastPosition: { surah: 3, ayah: 1, page: 50, juz: 3 },
    riwaya: "warsh",
    fontFamily: "qpc-warsh",
    fontFamilyByRiwaya: { hafs: "qpc-hafs", warsh: "qpc-warsh" },
  });
  const overlay = page.locator(".mfp-portal-root");
  const lines = overlay.locator('.qcm-lines[data-warsh="true"]');

  await expect(lines.locator(".qcm-word--warsh").first()).toBeVisible({ timeout: 30_000 });
  await expect(lines.locator(".qcm-line")).toHaveCount(15);
  await expect(lines.locator(".qcm-ayah-marker")).toHaveCount(5);
  expect(await lines.textContent()).not.toMatch(/[\uFC00-\uFD1C]/u);
  const typography = await lines.evaluate((element) => ({
    family: getComputedStyle(element.querySelector(".qcm-word--warsh")).fontFamily,
    wraps: [...element.querySelectorAll(".qcm-line")].map((line) => getComputedStyle(line).flexWrap),
  }));
  expect(typography.family).toMatch(/QPC Warsh|KFGQPC Warsh/i);
  expect(new Set(typography.wraps)).toEqual(new Set(["nowrap"]));
  await expect.poll(() => overlay.evaluate((root) => {
    const pageBox = root.querySelector(".qcm-page").getBoundingClientRect();
    return [...root.querySelectorAll(".qcm-word, .qcm-ayah-marker")].filter((word) => {
      const box = word.getBoundingClientRect();
      return box.left < pageBox.left - 2 || box.right > pageBox.right + 2;
    }).length;
  })).toBe(0);
  await page.screenshot({ path: "test-results/fullscreen-reader-warsh-mobile.png" });
});

test("Warsh opening leaves keep the title, basmala and page 2 to 3 carry", async ({ page }) => {
  await openFullscreenReader(page, { width: 632, height: 840 }, {
    displayMode: "page",
    currentSurah: 2,
    currentPage: 2,
    currentJuz: 1,
    lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 },
    riwaya: "warsh",
    fontFamily: "qpc-warsh",
    fontFamilyByRiwaya: { hafs: "qpc-hafs", warsh: "qpc-warsh" },
  });
  const overlay = page.locator(".mfp-portal-root");
  await expect(overlay.locator(".qcm-line--surah-header")).toBeVisible();
  await expect(overlay.locator(".qcm-line--basmala")).toBeVisible();
  await expect(overlay.locator(".qcm-ayah-marker")).toHaveCount(3);
  await expect(overlay.locator(".qcm-lines")).not.toContainText("أُوْلَٰٓئِكَ");

  await overlay.locator(".mfp-mobile-pagination button").first().click();
  await expect(overlay.locator(".mfp-header__copy h2")).toContainText("Page 3");
  await expect(overlay.locator('.qcm-line[data-line-number="1"]')).toContainText("أُوْلَٰٓئِكَ");
  expect(await overlay.locator('.qcm-line[data-line-number="1"]').evaluate((line) => getComputedStyle(line).justifyContent)).toBe("center");
});

test("fullscreen page remains usable from 280px to 1920px and zoom persists", async ({ page }) => {
  await openFullscreenReader(page, { width: 1280, height: 800 });
  const overlay = page.locator(".mfp-portal-root");
  const zoom = overlay.locator(".mfp-zoom-value");
  const plus = overlay.getByRole("button", { name: "Zoom avant" });
  await expect(overlay.locator(".qcm-word").first()).toBeVisible({ timeout: 30_000 });
  const sheetWidth = () => overlay.locator(".mfp-book").evaluate((node) => node.getBoundingClientRect().width);
  const baseWidth = await sheetWidth();

  await plus.click();
  await expect(zoom).toHaveText("115%");
  // Whole-page zoom: the sheet's layout box itself grows, frame included.
  expect(await sheetWidth()).toBeGreaterThan(baseWidth * 1.1);

  // Fit Page / Fit Width rescale the sheet without ever recomposing it:
  // the fifteen lines keep exactly their words.
  const composition = () => overlay.locator(".qcm-lines").first().evaluate((node) =>
    [...node.querySelectorAll(".qcm-line")].map((line) => `${line.dataset.lineNumber}:${line.textContent}`),
  );
  const beforeFit = await composition();
  await overlay.getByRole("button", { name: "Ajuster à la page" }).click();
  const fitPageZoom = Number.parseInt(await zoom.textContent(), 10);
  expect(Math.abs(fitPageZoom - 100)).toBeLessThanOrEqual(15);
  expect(await composition()).toEqual(beforeFit);
  await overlay.getByRole("button", { name: "Ajuster à la largeur" }).click();
  expect(Math.abs(Number.parseInt(await zoom.textContent(), 10) - 100)).toBeLessThanOrEqual(15);
  expect(await composition()).toEqual(beforeFit);
  await zoom.click();
  await expect(zoom).toHaveText("100%");
  await plus.click();
  await expect(zoom).toHaveText("115%");

  const pageLabelBefore = await overlay.locator(".mfp-header__copy h2").textContent();
  await overlay.locator(".mfp-side-nav--next").click();
  await expect.poll(() => overlay.locator(".mfp-header__copy h2").textContent()).not.toBe(pageLabelBefore);
  await expect(zoom).toHaveText("115%");

  await overlay.getByRole("button", { name: "Fermer" }).click();
  await expect(overlay).toBeHidden();
  await page.locator(":is(.reader-fullscreen-trigger, .srh-fullscreen-btn):visible").first().click();
  await expect(page.locator(".mfp-zoom-value")).toHaveText("115%");
  await page.locator(".mfp-zoom-value").click();

  // A desktop spread is one open book: two same-size leaves sharing one
  // scale, the lower folio on the right.
  await expect(overlay.locator(".qcm-page")).toHaveCount(2);
  expect(await overlay.evaluate((root) => root.dataset.layout)).toBe("double");
  const leafBoxes = await overlay.locator(".qcm-page").evaluateAll((pages) => pages.map((page) => {
    const box = page.getBoundingClientRect();
    return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, height: box.height };
  }));
  expect(leafBoxes).toHaveLength(2);
  expect(leafBoxes[0].width).toBeCloseTo(leafBoxes[1].width, 0);
  expect(leafBoxes[0].height).toBeCloseTo(leafBoxes[1].height, 0);
  expect(leafBoxes[0].top).toBeCloseTo(leafBoxes[1].top, 0);
  expect(leafBoxes[0].right).toBeGreaterThan(leafBoxes[1].right);

  for (const width of [280, 320, 360, 390, 414, 768, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
    const contract = await page.locator(".mfp-portal-root").evaluate((root) => {
      const viewport = root.querySelector(".mfp-viewport");
      const controls = [...root.querySelectorAll("button")].filter((button) => button.getClientRects().length > 0);
      const clippedControls = controls.filter((button) => {
        const box = button.getBoundingClientRect();
        return box.left < -1 || box.right > innerWidth + 1 || box.top < -1 || box.bottom > innerHeight + 1;
      }).length;
      const words = [...root.querySelectorAll(".qcm-word")];
      const clippedWords = words.filter((word) => {
        const pageBox = word.closest(".qcm-page")?.getBoundingClientRect();
        if (!pageBox) return true;
        const box = word.getBoundingClientRect();
        return box.left < pageBox.left - 2 || box.right > pageBox.right + 2;
      }).length;
      return {
        clippedControls,
        clippedWords,
        canScrollX: viewport.scrollWidth >= viewport.clientWidth,
      };
    });
    expect(contract.clippedControls, `${width}px controls`).toBe(0);
    expect(contract.clippedWords, `${width}px Arabic words`).toBe(0);
    expect(contract.canScrollX).toBe(true);
  }
});

test("whole-page zoom keeps the sheet inside the viewport and grows its scroll bounds", async ({ page }) => {
  await openFullscreenReader(page, { width: 1280, height: 800 });
  const overlay = page.locator(".mfp-portal-root");
  const zoom = overlay.locator(".mfp-zoom-value");
  const minus = overlay.getByRole("button", { name: "Zoom arrière" });
  const plus = overlay.getByRole("button", { name: "Zoom avant" });
  await expect(overlay.locator(".qcm-word").first()).toBeVisible({ timeout: 30_000 });

  const metrics = () => overlay.evaluate((root) => {
    const viewport = root.querySelector(".mfp-viewport");
    const sheet = root.querySelector(".mfp-book");
    const words = [...root.querySelectorAll(".qcm-word")].filter((word) => {
      const pageBox = word.closest(".qcm-page")?.getBoundingClientRect();
      if (!pageBox) return true;
      const box = word.getBoundingClientRect();
      return box.left < pageBox.left - 2 || box.right > pageBox.right + 2;
    }).length;
    return {
      sheetWidth: sheet.getBoundingClientRect().width,
      scrollWidth: viewport.scrollWidth,
      clientWidth: viewport.clientWidth,
      clippedWords: words,
    };
  });

  const full = await metrics();
  await minus.click();
  await minus.click();
  await expect(zoom).toHaveText("75%");
  const shrunk = await metrics();
  expect(shrunk.sheetWidth).toBeLessThan(full.sheetWidth);
  expect(shrunk.clippedWords).toBe(0);
  expect(shrunk.scrollWidth).toBeLessThanOrEqual(shrunk.clientWidth + 1);

  await zoom.click();
  await expect(zoom).toHaveText("100%");
  await plus.click();
  await plus.click();
  await plus.click();
  await expect(zoom).toHaveText("145%");
  const enlarged = await metrics();
  expect(enlarged.sheetWidth).toBeGreaterThan(full.sheetWidth);
  // The enlarged sheet must be reachable by scrolling, not cut off.
  expect(enlarged.scrollWidth).toBeGreaterThan(enlarged.clientWidth);
  expect(enlarged.clippedWords).toBe(0);
});
