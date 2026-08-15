import { test, expect } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";

const SETTINGS_KEY = "mushaf-plus-settings";

async function seedReadingState(page, overrides = {}) {
  await page.addInitScript(({ key, overrides }) => {
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          skipSplashAnimation: true,
          showHome: false,
          showDuas: false,
          sidebarOpen: false,
          displayMode: "surah",
          mushafLayout: "list",
          lang: "fr",
          riwaya: "hafs",
          fontFamily: "qpc-hafs",
          quranFontSize: 34,
          lastPosition: {
            surah: 3,
            ayah: 1,
            page: 50,
            juz: 3,
          },
          ...overrides,
        }),
      );
    } catch {
      // The visible assertions below will fail if the state cannot be seeded.
    }
  }, { key: SETTINGS_KEY, overrides });
}

async function openReader(page, viewport, overrides = {}) {
  await installQuranNetworkFixtures(page);
  await seedReadingState(page, overrides);
  await page.addInitScript(() => {
    try { sessionStorage.removeItem("mushafplus-reader-tools-open"); } catch {}
  });
  await page.setViewportSize(viewport);
  await page.goto("/surah/3");
  await expect(page.locator(".mp-header").first()).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".quran-display--platform").first()).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".qc-ayah-text-ar").first()).toBeVisible({ timeout: 30_000 });
  if (viewport.width <= 1024) {
    const maxHeaderHeight = viewport.width <= 640 ? 56 : 60;
    await expect
      .poll(async () => (await box(page, ".mp-header__bar"))?.height || 0)
      .toBeLessThanOrEqual(maxHeaderHeight);
  }
}

async function openHome(page, viewport) {
  await page.addInitScript((key) => {
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          skipSplashAnimation: true,
          showHome: true,
          showDuas: false,
          sidebarOpen: false,
          lang: "fr",
          riwaya: "hafs",
          displayMode: "surah",
          homeSection: "surah",
        }),
      );
    } catch {
      // The visible assertions below will fail if the state cannot be seeded.
    }
  }, SETTINGS_KEY);
  await page.setViewportSize(viewport);
  await page.goto("/");
  await expect(page.locator(".mp-header").first()).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".app-view-home").first()).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".hp-card").first()).toBeAttached({ timeout: 30_000 });
}

async function openDuas(page, viewport) {
  await openHome(page, viewport);
  await page.locator(".mp-header__more").first().click();
  await page.locator('.mp-header-menu__item[data-key="duas"]').click();
  await expect(page.locator(".app-view-duas").first()).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".duas-page").first()).toBeVisible({ timeout: 30_000 });
}

async function box(page, selector) {
  return page.locator(selector).first().boundingBox();
}

async function revealReaderTools(page, viewportWidth) {
  const trigger = page.locator(
    viewportWidth <= 640
      ? ".srh-mobile-bar__disclosure"
      : ".srh-identity__disclosure",
  );
  await expect(trigger).toBeVisible();
  if ((await trigger.getAttribute("aria-expanded")) !== "true") {
    await trigger.focus();
    await trigger.press("Enter");
  }
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#srh-reader-tools")).not.toHaveAttribute("aria-hidden", "true");
  return trigger;
}

async function fontSizePx(page, selector) {
  return page.locator(selector).evaluateAll((nodes, currentSelector) => {
    const node = nodes.find((candidate) => candidate.getClientRects().length > 0);
    if (!node) throw new Error(`No visible element found for ${currentSelector}`);
    return Number.parseFloat(getComputedStyle(node).fontSize);
  }, selector);
}

async function waitForFontSizePx(page, selector) {
  const handle = await page.waitForFunction((currentSelector) => {
    const node = document.querySelector(currentSelector);
    if (!node) return false;
    const size = Number.parseFloat(getComputedStyle(node).fontSize);
    return Number.isFinite(size) && size > 0 ? size : false;
  }, selector);
  return handle.jsonValue();
}

async function overflowX(page) {
  return page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth));
}

async function headerCenterDelta(page) {
  return page.locator(".mp-header__nav").evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return Math.abs(rect.left + rect.width / 2 - window.innerWidth / 2);
  });
}

async function openAudioPlayer(page) {
  const compactPlayer = page.getByTestId("audio-player-compact");
  if (await compactPlayer.isVisible().catch(() => false)) {
    await compactPlayer.locator(".mp-player-minimized-open").click();
  }

  const openPlayer = page.getByTestId("audio-player-open");
  await expect(openPlayer).toBeVisible();
  return openPlayer;
}

test("home density: mobile and tablet text, icons and cards scale with viewport", async ({ page }) => {
  await openHome(page, { width: 390, height: 844 });

  expect(await overflowX(page)).toBeLessThanOrEqual(2);
  expect((await box(page, ".mp-header__icon-btn"))?.width || 0).toBeGreaterThanOrEqual(40);
  expect((await box(page, ".mp-header__more"))?.width || 0).toBeGreaterThanOrEqual(40);
  expect(await fontSizePx(page, ".home-resume-panel h1")).toBeLessThanOrEqual(34);
  expect(await fontSizePx(page, ".hp-card-name")).toBeGreaterThanOrEqual(12);
  expect(await fontSizePx(page, ".hp-card-meta")).toBeGreaterThanOrEqual(11);

  await openHome(page, { width: 820, height: 920 });

  expect(await overflowX(page)).toBeLessThanOrEqual(2);
  expect((await box(page, ".mp-header__icon-btn"))?.width || 0).toBeGreaterThanOrEqual(42);
  expect(await fontSizePx(page, ".hp-card-name")).toBeGreaterThanOrEqual(14);
});

test("mobile surah rows keep names, metadata, Arabic labels and play controls aligned", async ({ page }) => {
  for (const viewport of [
    { width: 280, height: 700 },
    { width: 320, height: 780 },
    { width: 390, height: 844 },
  ]) {
    await openHome(page, viewport);
    const card = page.locator(".hp-card--surah.hp-card--list").first();
    await expect(card).toBeVisible();
    await card.scrollIntoViewIfNeeded();

    const metrics = await card.evaluate((node) => {
      const rect = (selector) => {
        const target = node.querySelector(selector);
        const bounds = target.getBoundingClientRect();
        return {
          x: bounds.x,
          width: bounds.width,
          height: bounds.height,
          right: bounds.right,
          bottom: bounds.bottom,
        };
      };
      const bounds = node.getBoundingClientRect();
      const name = node.querySelector(".hp-card-name");
      const open = node.querySelector(".hp-card-open");
      return {
        card: {
          width: bounds.width,
          height: bounds.height,
          right: bounds.right,
          bottom: bounds.bottom,
        },
        content: rect(".hp-card-content"),
        arabic: rect(".hp-card-ar"),
        play: rect(".hp-card-play"),
        open: rect(".hp-card-open"),
        openPosition: getComputedStyle(open).position,
        nameFits: name.scrollWidth <= name.clientWidth + 1,
      };
    });

    expect(metrics.card.height).toBeLessThanOrEqual(112);
    expect(metrics.nameFits).toBe(true);
    expect(metrics.openPosition).toBe("absolute");
    expect(metrics.open.width).toBeGreaterThanOrEqual(metrics.card.width - 3);
    expect(metrics.open.height).toBeGreaterThanOrEqual(metrics.card.height - 3);
    expect(metrics.content.right).toBeLessThanOrEqual(metrics.arabic.x + 1);
    expect(metrics.content.right).toBeLessThanOrEqual(metrics.play.x + 1);
    expect(metrics.play.width).toBeGreaterThanOrEqual(34);
    expect(metrics.play.right).toBeLessThanOrEqual(metrics.card.right + 1);
    expect(metrics.play.bottom).toBeLessThanOrEqual(metrics.card.bottom + 1);
    expect(await overflowX(page)).toBeLessThanOrEqual(2);
  }
});

test("tablet and desktop surah cards give Arabic names a clear visual column", async ({ page }) => {
  for (const viewport of [
    { width: 768, height: 900 },
    { width: 834, height: 900 },
    { width: 1024, height: 900 },
    { width: 1440, height: 900 },
  ]) {
    await openHome(page, viewport);
    const card = page.locator(".hp-grid--surah .hp-card--surah").first();
    await expect(card).toBeVisible();
    await card.scrollIntoViewIfNeeded();

    const metrics = await card.evaluate((node) => {
      const bounds = node.getBoundingClientRect();
      const content = node.querySelector(".hp-card-content").getBoundingClientRect();
      const arabicNode = node.querySelector(".hp-card-ar");
      const arabic = arabicNode.getBoundingClientRect();
      const play = node.querySelector(".hp-card-play").getBoundingClientRect();
      return {
        cardHeight: bounds.height,
        contentRight: content.right,
        arabicLeft: arabic.left,
        arabicRight: arabic.right,
        arabicFontSize: Number.parseFloat(getComputedStyle(arabicNode).fontSize),
        playLeft: play.left,
        playWidth: play.width,
      };
    });

    expect(metrics.cardHeight).toBeGreaterThanOrEqual(88);
    expect(metrics.cardHeight).toBeLessThanOrEqual(124);
    expect(metrics.arabicFontSize).toBeGreaterThanOrEqual(26);
    expect(metrics.contentRight).toBeLessThanOrEqual(metrics.arabicLeft + 1);
    expect(metrics.arabicRight).toBeLessThanOrEqual(metrics.playLeft + 1);
    expect(metrics.playWidth).toBeGreaterThanOrEqual(40);
    expect(await overflowX(page)).toBeLessThanOrEqual(2);

    if (viewport.width <= 834) {
      const positions = await page.locator(".hp-grid--surah .hp-card--surah").evaluateAll((nodes) =>
        nodes.slice(0, 2).map((node) => {
          const rect = node.getBoundingClientRect();
          return { x: rect.x, y: rect.y };
        }),
      );
      expect(Math.abs(positions[0].x - positions[1].x)).toBeLessThanOrEqual(1);
      expect(positions[1].y).toBeGreaterThan(positions[0].y);
    }
  }
});

test("home audit breakpoints preserve hierarchy without horizontal overflow", async ({ page }) => {
  for (const width of [320, 360, 390, 412, 768, 1024]) {
    await openHome(page, { width, height: width <= 412 ? 780 : 900 });
    expect(await overflowX(page)).toBeLessThanOrEqual(2);

    await expect(page.locator(".home-resume-panel")).toBeVisible();
    await expect(page.locator(".home-today-panel")).toBeVisible();
    if (width <= 700) {
      const resume = await box(page, ".home-resume-panel");
      const today = await box(page, ".home-today-panel");
      expect(resume?.y || 0).toBeLessThan(today?.y || 0);
      await expect(page.locator(".home-today-suggestion:visible")).toHaveCount(3);
    }
  }

  await openHome(page, { width: 320, height: 780 });
  const mobileHero = await box(page, ".home-resume-panel");
  const mobileHeaderCenter = await box(page, ".mp-header__center");
  const mobileHeaderSummary = await box(page, ".mp-header__home-summary");
  expect(mobileHero?.height || 0).toBeLessThanOrEqual(360);
  expect(mobileHeaderSummary?.x || 0).toBeGreaterThanOrEqual(
    (mobileHeaderCenter?.x || 0) - 1,
  );
  expect(
    (mobileHeaderSummary?.x || 0) + (mobileHeaderSummary?.width || 0),
  ).toBeLessThanOrEqual(
    (mobileHeaderCenter?.x || 0) + (mobileHeaderCenter?.width || 0) + 1,
  );
  const firstCards = await page.locator(".hp-list .hp-card").evaluateAll((nodes) =>
    nodes.slice(0, 2).map((node) => {
      const rect = node.getBoundingClientRect();
      return { x: rect.x, y: rect.y };
    }),
  );
  expect(firstCards).toHaveLength(2);
  expect(Math.abs(firstCards[0].x - firstCards[1].x)).toBeLessThanOrEqual(1);
  expect(firstCards[1].y).toBeGreaterThan(firstCards[0].y);
});

test("reader header stays stable and visually centered across breakpoints", async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 780 },
    { width: 390, height: 844 },
    { width: 820, height: 920 },
    { width: 1280, height: 900 },
  ]) {
    await openReader(page, viewport);
    expect(await headerCenterDelta(page)).toBeLessThanOrEqual(3);
    expect(await overflowX(page)).toBeLessThanOrEqual(2);

    const disclosure = await revealReaderTools(page, viewport.width);
    await expect(page.locator(".srh-controls")).toBeVisible();
    await disclosure.click();
    await expect(disclosure).toHaveAttribute("aria-expanded", "false");

    const titleMotion = await page.locator(".mp-header__title").evaluate((node) =>
      getComputedStyle(node).animationName,
    );
    expect(titleMotion).toBe("none");

    if (viewport.width <= 390) {
      const maxLegendHeight = viewport.width <= 320 ? 120 : 140;
      expect((await box(page, ".tajweed-legend"))?.height || 0).toBeLessThanOrEqual(maxLegendHeight);
      expect((await box(page, ".srh-root"))?.height || 0).toBeLessThanOrEqual(170);
    }
  }
});

test("reader header keeps the Arabic title and search affordance legible", async ({ page }) => {
  await openReader(page, { width: 320, height: 780 });
  const compactArabicTitleSize = await page.locator(".mp-header__title-sub").first().evaluate((node) =>
    Number.parseFloat(getComputedStyle(node).fontSize),
  );
  expect(compactArabicTitleSize).toBeGreaterThanOrEqual(22);

  await openReader(page, { width: 1280, height: 900 });
  const desktopArabicTitleSize = await page.locator(".mp-header__title-sub").first().evaluate((node) =>
    Number.parseFloat(getComputedStyle(node).fontSize),
  );
  expect(desktopArabicTitleSize).toBeGreaterThanOrEqual(24);

  const searchButton = page.locator(".mp-header__search");
  await expect(searchButton).toBeVisible();
  const searchIcon = await box(page, ".mp-header__search svg");
  expect(searchIcon?.width || 0).toBeGreaterThanOrEqual(18);
  expect(searchIcon?.height || 0).toBeGreaterThanOrEqual(18);
  const searchContrast = await searchButton.evaluate((node) => {
    const style = getComputedStyle(node);
    return { color: style.color, background: style.backgroundColor };
  });
  expect(searchContrast.color).not.toBe(searchContrast.background);
  expect(await overflowX(page)).toBeLessThanOrEqual(2);
});

test("reader chrome yields the screen while scrolling and remains easy to reveal", async ({ page }) => {
  await openReader(page, { width: 390, height: 844 });

  const root = page.locator(".app-root");
  const main = page.locator(".app-main-shell");
  const header = page.locator(".mp-header");
  const player = page.locator(".mp-audio-player").first();
  await expect(player).toBeAttached();

  await main.evaluate((node) => node.scrollTo({ top: 720, behavior: "instant" }));
  await expect(root).toHaveClass(/immersive-mode/);
  await expect(header).toHaveAttribute("aria-hidden", "true");
  await expect(player).toHaveCSS("opacity", "0");
  await expect(page.locator(".immersive-reveal--top")).toBeVisible();
  await expect(page.locator(".immersive-reveal--bottom")).toBeVisible();

  await page.locator(".immersive-reveal--top").dispatchEvent("click");
  await expect(root).not.toHaveClass(/immersive-mode/);
  await expect(header).not.toHaveAttribute("aria-hidden", "true");
  await expect(player).not.toHaveCSS("opacity", "0");
});

test("Mushaf mode mounts only the pages near the reading viewport", async ({ page }) => {
  await openReader(
    page,
    { width: 390, height: 844 },
    { mushafLayout: "mushaf", showTranslation: false },
  );

  const virtualPages = page.locator('[data-virtualized-page="true"]');
  await expect(virtualPages.first()).toBeAttached();
  const totalPages = await virtualPages.count();
  const renderedPages = await page.locator('[data-virtualized-page="true"][data-rendered="true"]').count();

  expect(totalPages).toBeGreaterThan(8);
  expect(renderedPages).toBeGreaterThan(0);
  expect(renderedPages).toBeLessThan(totalPages);
  expect(renderedPages).toBeLessThanOrEqual(6);
  expect(await page.locator("*").count()).toBeLessThan(1800);
});

test("reader typography and action glyphs follow the connected device scale", async ({ page }) => {
  const samples = [];

  for (const viewport of [
    { width: 320, height: 780, maxArabic: 32, maxIcon: 13.2 },
    { width: 820, height: 920, maxArabic: 40, maxIcon: 14.8 },
    { width: 1280, height: 900, maxArabic: 52, maxIcon: 16.1 },
  ]) {
    await openReader(page, viewport, {
      mushafLayout: "list",
      quranFontSize: 42,
      showTajwid: true,
    });
    await revealReaderTools(page, viewport.width);

    const arabicSize = await fontSizePx(page, ".qc-ayah-text-ar");
    const icon = await box(page, ".srh-toggle svg");
    const touchTarget = await box(page, ".srh-toggle");

    expect(arabicSize).toBeLessThanOrEqual(viewport.maxArabic + 0.1);
    expect(icon?.width || 0).toBeLessThanOrEqual(viewport.maxIcon);
    expect(icon?.height || 0).toBeLessThanOrEqual(viewport.maxIcon);
    expect(touchTarget?.height || 0).toBeGreaterThanOrEqual(40);
    expect(await overflowX(page)).toBeLessThanOrEqual(2);
    samples.push(arabicSize);
  }

  expect(samples[1]).toBeGreaterThan(samples[0]);
  expect(samples[2]).toBeGreaterThan(samples[1]);

  await openReader(page, { width: 1128, height: 800 }, { showTajwid: true });
  expect((await box(page, ".tajweed-legend"))?.height || 0).toBeLessThanOrEqual(115);
});

test("mobile QCF4 Mushaf mode reveals the complete reader command bar on demand", async ({ page }) => {
  await openReader(
    page,
    { width: 390, height: 844 },
    { mushafLayout: "mushaf", fontFamily: "qcf-v4-tajweed" },
  );

  const toolbar = page.locator(".srh-root");
  await expect(toolbar).toBeVisible();
  await expect(toolbar.locator(".srh-mobile-bar")).toBeVisible();
  const disclosure = toolbar.locator(".srh-mobile-bar__disclosure");
  await expect(disclosure).toHaveAttribute("aria-expanded", "false");
  await expect(toolbar.locator("#srh-reader-tools")).toHaveAttribute("aria-hidden", "true");

  await disclosure.click();
  await expect(disclosure).toHaveAttribute("aria-expanded", "true");
  await expect(toolbar.locator(".srh-controls")).toBeVisible();
  await expect(toolbar.locator(".srh-footer")).toBeVisible();
  await expect(toolbar.locator(".srh-typography-trigger")).toBeVisible();

  await disclosure.click();
  await expect(disclosure).toHaveAttribute("aria-expanded", "false");
  await expect(toolbar.locator("#srh-reader-tools")).toHaveAttribute("aria-hidden", "true");
  expect(await overflowX(page)).toBeLessThanOrEqual(2);
});

test("mobile Mushaf keeps desktop proportions at the largest text preference", async ({ page }) => {
  await openReader(
    page,
    { width: 390, height: 844 },
    { mushafLayout: "mushaf", fontFamily: "qcf-v4-tajweed", quranFontSize: 96 },
  );

  expect(await fontSizePx(page, ".mushaf-text-block")).toBeLessThanOrEqual(30);

  const marker = page.locator(".cpv-ayah-marker").first();
  await expect(marker).toHaveAttribute("data-marker-font", "qcf-v4-tajweed");
  await expect(marker).toContainText(/\u06dd[\u0660-\u0669]+/u);
  expect(await overflowX(page)).toBeLessThanOrEqual(2);
});

test("surah information dossier stays accessible and contained on mobile", async ({ page }) => {
  await openReader(page, { width: 390, height: 844 });

  const trigger = page.locator(".srh-mobile-bar .srh-info-btn");
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");

  const dialog = page.getByRole("dialog", { name: "Informations sur la sourate" });
  await expect(dialog).toBeVisible();
  await expect(page.locator(".surah-info-modal button[aria-label='Fermer']")).toBeFocused();
  await expect(dialog.getByText("Repères essentiels")).toBeVisible();
  await expect(dialog.getByText("Editorial overview for surah 3.")).toBeVisible();
  await dialog.getByRole("button", { name: /Dossier complet/ }).click();
  await expect(dialog.getByText("Complete historical context for testing.")).toBeVisible();
  await expect(dialog.getByText(/89e dans l’ordre de révélation/)).toBeVisible();

  const modalBox = await dialog.locator(".surah-info-modal").boundingBox();
  expect(modalBox?.x || 0).toBeGreaterThanOrEqual(0);
  expect(modalBox?.y || 0).toBeGreaterThanOrEqual(0);
  expect((modalBox?.x || 0) + (modalBox?.width || 0)).toBeLessThanOrEqual(391);
  expect(await overflowX(page)).toBeLessThanOrEqual(2);
  expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("Tajweed guide stays compact and explains coloured rules on hover", async ({ page }) => {
  await openReader(
    page,
    { width: 1280, height: 800 },
    { showTajwid: true },
  );

  const legend = page.getByTestId("tajweed-legend");
  await expect(legend).toBeVisible();
  await expect(legend).not.toHaveAttribute("open", "");
  await expect(legend.locator(".tajweed-legend__rules")).toBeHidden();
  const collapsedLegendBox = await legend.boundingBox();
  expect(collapsedLegendBox?.height || 0).toBeLessThanOrEqual(56);

  await legend.locator("summary").click();
  await expect(legend).toHaveAttribute("open", "");
  await expect(legend.locator(".tajweed-legend__rules")).toBeVisible();
  const legendBox = await legend.boundingBox();
  expect(legendBox?.width || 0).toBeLessThanOrEqual(1280);
  expect(legendBox?.height || 0).toBeLessThanOrEqual(150);

  const segment = page.locator(".tajwid-rule-segment").first();
  await expect(segment).toBeVisible();
  await expect(segment).not.toHaveAttribute("title", /.+/);
  await segment.hover();

  const tooltip = page.locator(".tajwid-rule-tooltip");
  await expect(tooltip).toBeVisible();
  await expect(tooltip.locator(".tajwid-rule-tooltip__head strong")).not.toBeEmpty();
  await expect(tooltip.locator(".tajwid-rule-tooltip__description")).not.toBeEmpty();
  expect(await overflowX(page)).toBeLessThanOrEqual(2);
});

test("mobile density: header, reading toolbar and audio player fit without horizontal overflow", async ({ page }) => {
  await openReader(page, { width: 390, height: 844 });

  const header = await box(page, ".mp-header__bar");
  const toolbar = await box(page, ".srh-root");
  const audioDock = await box(page, ".mp-audio-player--mobile");
  const firstAction = await box(page, ".mp-header__icon-btn");
  const settingsButton = await box(page, ".mp-header__more");
  const moreButton = await box(page, ".mp-header__more");
  const typographyTrigger = await box(page, ".srh-typography-trigger");
  const verseReference = await box(page, ".qc-list-card__reference");
  const versePlay = await box(page, ".qc-list-card__start .ayah-action--play");
  const verseBookmark = await box(page, ".qc-list-card__start .ayah-action--bookmark");

  expect(header?.height || 0).toBeLessThanOrEqual(56);
  expect(toolbar?.height || 0).toBeLessThanOrEqual(220);
  expect(audioDock?.height || 0).toBeLessThanOrEqual(160);
  expect(firstAction?.width || 0).toBeGreaterThanOrEqual(39.9);
  expect(firstAction?.height || 0).toBeGreaterThanOrEqual(39.9);
  expect(firstAction?.width || 0).toBeLessThanOrEqual(40.1);
  expect(settingsButton?.width || 0).toBeGreaterThanOrEqual(39.9);
  expect(moreButton?.width || 0).toBeGreaterThanOrEqual(39.9);
  expect(typographyTrigger?.width || 0).toBeGreaterThanOrEqual(39.9);
  expect(typographyTrigger?.height || 0).toBeGreaterThanOrEqual(39.9);
  expect(verseReference?.width || 0).toBeGreaterThanOrEqual(33.9);
  expect(verseReference?.width || 0).toBeLessThanOrEqual(34.1);
  expect(versePlay?.width || 0).toBeGreaterThanOrEqual(33.9);
  expect(versePlay?.width || 0).toBeLessThanOrEqual(34.1);
  expect(verseBookmark?.width || 0).toBeGreaterThanOrEqual(33.9);
  expect(verseBookmark?.width || 0).toBeLessThanOrEqual(34.1);
  expect(Math.abs((verseReference?.y || 0) - (versePlay?.y || 0))).toBeLessThanOrEqual(1);
  expect(Math.abs((verseReference?.y || 0) - (verseBookmark?.y || 0))).toBeLessThanOrEqual(1);
  await revealReaderTools(page, 390);
  await expect(page.locator(".srh-typography-panel")).toBeHidden();
  await page.locator(".srh-typography-trigger").click();
  await expect(page.locator(".srh-typography-trigger")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".srh-typography-panel")).toBeVisible();
  const fontControls = await box(page, ".srh-root .arabic-font-controls--compact");
  const fontSelect = await box(page, ".srh-root .afc-select");
  const sizeControls = await box(page, ".srh-root .afc-size-group");
  expect(fontControls?.height || 0).toBeGreaterThanOrEqual(38);
  expect(fontSelect?.width || 0).toBeGreaterThanOrEqual(88);
  expect(sizeControls?.width || 0).toBeGreaterThanOrEqual(145);
  await openAudioPlayer(page);
  const audioOptionsButton = await box(page, ".mp-player-options-trigger");
  expect(audioOptionsButton?.width || 0).toBeGreaterThanOrEqual(43.9);
  expect(audioOptionsButton?.height || 0).toBeGreaterThanOrEqual(43.9);
  expect(audioOptionsButton?.width || 0).toBeLessThanOrEqual(44.1);
  expect(await overflowX(page)).toBeLessThanOrEqual(2);
});

test("mobile reader header keeps Home visible and exposes only contextual quick actions", async ({ page }) => {
  await openReader(page, { width: 390, height: 844 });

  const homeLogo = page.getByTestId("mobile-home-logo");
  await expect(homeLogo).toBeVisible();
  await expect(page.locator(".mp-header__riwaya-toggle")).toBeHidden();

  await page.locator(".mp-header__more").click();
  const menu = page.locator(".mp-header-menu");
  await expect(menu).toBeVisible();
  const mobileSearch = menu.locator('.mp-header-menu__item[data-key="search"]');
  await expect(mobileSearch).toBeVisible();
  await expect(menu.locator('.mp-header-menu__item[data-key="theme"]')).toBeVisible();
  await expect(menu.locator('.mp-header-menu__item[data-key="settings"]')).toBeVisible();
  await expect(menu.locator('.mp-header-menu__item[data-key="duas"]')).toBeVisible();
  await expect(menu.locator('[data-key="about"], [data-key="privacy"], [data-key="sources"], [data-key="help"]')).toHaveCount(0);

  await expect(page.getByTestId("header-mobile-riwaya")).toBeVisible();
  await expect(page.getByTestId("header-reader-layout-list")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("header-reader-font-increase")).toBeVisible();
  await expect(menu.locator("output")).toHaveText("34px");
  await page.getByTestId("header-reader-font-increase").click();
  await expect(menu.locator("output")).toHaveText("36px");

  await page.getByTestId("header-reader-layout-mushaf").click();
  await expect(page.getByTestId("header-reader-layout-mushaf")).toHaveAttribute("aria-pressed", "true");
  const mobileSearchIcon = await box(page, '.mp-header-menu__item[data-key="search"] .mp-header-menu__item-icon');
  expect(mobileSearchIcon?.width || 0).toBeLessThanOrEqual(30);
  await mobileSearch.click();
  await expect(page.getByRole("dialog", { name: /Recherche|Search|بحث/i })).toBeVisible();
  await page.keyboard.press("Escape");
  await homeLogo.click();
  await expect(page.locator(".app-view-home")).toBeVisible();
  expect(await overflowX(page)).toBeLessThanOrEqual(2);
});

test("tiny mobile density keeps the reader usable at 280px", async ({ page }) => {
  await openReader(page, { width: 280, height: 700 });

  const header = await box(page, ".mp-header__bar");
  const homeLogo = await box(page, "[data-testid=mobile-home-logo]");
  const verseReference = await box(page, ".qc-list-card__reference");
  const versePlay = await box(page, ".qc-list-card__start .ayah-action--play");
  const verseBookmark = await box(page, ".qc-list-card__start .ayah-action--bookmark");
  const audioDock = await box(page, ".mp-audio-player--mobile");

  expect(header?.height || 0).toBeLessThanOrEqual(56);
  expect(homeLogo?.width || 0).toBeGreaterThanOrEqual(37.9);
  expect(homeLogo?.height || 0).toBeGreaterThanOrEqual(37.9);
  expect(verseReference?.width || 0).toBeGreaterThanOrEqual(33.9);
  expect(verseReference?.width || 0).toBeLessThanOrEqual(34.1);
  expect(versePlay?.width || 0).toBeGreaterThanOrEqual(33.9);
  expect(versePlay?.width || 0).toBeLessThanOrEqual(34.1);
  expect(verseBookmark?.width || 0).toBeGreaterThanOrEqual(33.9);
  expect(verseBookmark?.width || 0).toBeLessThanOrEqual(34.1);
  expect(Math.abs((verseReference?.y || 0) - (versePlay?.y || 0))).toBeLessThanOrEqual(1);
  expect(Math.abs((verseReference?.y || 0) - (verseBookmark?.y || 0))).toBeLessThanOrEqual(1);
  expect(audioDock?.width || 0).toBeLessThanOrEqual(280);
  expect(await overflowX(page)).toBeLessThanOrEqual(2);
});

test("mobile surfaces: sidebar, settings drawer and audio modal fit the viewport", async ({ page }) => {
  await openReader(page, { width: 390, height: 844 });

  await page.locator(".mp-header__icon-btn").first().click();
  const sidebar = page.locator(".sb-wrapper").first();
  await expect(sidebar).toBeVisible();
  const sidebarBox = await sidebar.boundingBox();
  const sidebarClose = await box(page, ".sb-wrapper button");
  const sidebarCloseIcon = await box(page, ".sidebar-close-button svg");
  expect(sidebarBox?.width || 0).toBeLessThanOrEqual(390);
  expect(sidebarBox?.height || 0).toBeLessThanOrEqual(844);
  expect(sidebarClose?.width || 0).toBeGreaterThanOrEqual(39.9);
  expect(sidebarClose?.height || 0).toBeGreaterThanOrEqual(39.9);
  expect(sidebarCloseIcon?.width || 0).toBeLessThanOrEqual(15);
  expect(sidebarCloseIcon?.height || 0).toBeLessThanOrEqual(15);
  await page.locator('.sb-wrapper button[aria-label="Fermer"]').first().click();
  await expect(sidebar).not.toHaveClass(/open/);

  await page.locator(".mp-header__more").first().click();
  await page.getByRole("button", { name: /Paramètres|Settings|الإعدادات/i }).last().click();
  const settingsDrawer = page.locator(".settings-drawer").first();
  await expect(settingsDrawer).toBeVisible();
  const settingsBox = await settingsDrawer.boundingBox();
  const settingsClose = await box(page, '.settings-drawer button[aria-label="Fermer les paramètres"]');
  const settingsCloseIcon = await box(page, ".settings-close-button svg");
  expect(settingsBox?.width || 0).toBeLessThanOrEqual(390);
  expect(settingsBox?.height || 0).toBeLessThanOrEqual(844);
  expect(settingsClose?.width || 0).toBeGreaterThanOrEqual(40);
  expect(settingsClose?.height || 0).toBeGreaterThanOrEqual(40);
  expect(settingsCloseIcon?.width || 0).toBeLessThanOrEqual(15);
  expect(settingsCloseIcon?.height || 0).toBeLessThanOrEqual(15);
  await page.locator('.settings-drawer button[aria-label="Fermer les paramètres"]').first().click();
  await expect(settingsDrawer).toBeHidden();

  await openAudioPlayer(page);
  await page.locator(".mp-player-options-trigger").first().click();
  const audioModal = page.locator(".audio-player-modal__surface--settings").first();
  await expect(audioModal).toBeVisible();
  const audioModalBox = await audioModal.boundingBox();
  const audioClose = await box(page, ".audio-player-modal__close");
  const audioCloseIcon = await box(page, ".audio-player-modal__close svg");
  expect(audioModalBox?.width || 0).toBeLessThanOrEqual(390);
  expect(audioModalBox?.height || 0).toBeLessThanOrEqual(844);
  expect(audioClose?.width || 0).toBeGreaterThanOrEqual(40);
  expect(audioClose?.height || 0).toBeGreaterThanOrEqual(40);
  expect(audioCloseIcon?.width || 0).toBeLessThanOrEqual(15);
  expect(audioCloseIcon?.height || 0).toBeLessThanOrEqual(15);
  expect(await overflowX(page)).toBeLessThanOrEqual(2);
});

test("tablet density: header controls and audio options modal remain compact", async ({ page }) => {
  await openReader(page, { width: 820, height: 920 });

  const header = await box(page, ".mp-header__bar");
  const toolbar = await box(page, ".srh-root");
  const settingsButton = await box(page, ".mp-header__more");
  const fontControls = await box(page, ".srh-root .arabic-font-controls--compact");
  await openAudioPlayer(page);
  const audioOptionsButton = await box(page, ".mp-player-options-trigger");

  expect(header?.height || 0).toBeLessThanOrEqual(60);
  expect(toolbar?.height || 0).toBeLessThanOrEqual(280);
  expect(settingsButton?.width || 0).toBeGreaterThanOrEqual(42);
  expect(fontControls?.height || 0).toBeGreaterThanOrEqual(38);
  expect(audioOptionsButton?.width || 0).toBeGreaterThanOrEqual(42);
  expect(audioOptionsButton?.height || 0).toBeGreaterThanOrEqual(42);
  expect(await overflowX(page)).toBeLessThanOrEqual(2);

  const optionsTrigger = page.locator(".mp-player-options-trigger").first();
  if (await optionsTrigger.isVisible().catch(() => false)) {
    await optionsTrigger.click();
    const modal = page.locator(".audio-player-modal__surface--settings").first();
    await expect(modal).toBeVisible();
    const modalBox = await modal.boundingBox();
    expect(modalBox?.width || 0).toBeLessThanOrEqual(820);
    expect(modalBox?.height || 0).toBeLessThanOrEqual(860);
  }
});

test("small phone: verse actions and search stay usable inside the viewport", async ({ page }) => {
  const viewport = { width: 320, height: 568 };
  await openReader(page, viewport);

  const reference = await box(page, ".qc-list-card__reference");
  expect(reference?.width || 0).toBeGreaterThanOrEqual(33.9);
  expect(reference?.width || 0).toBeLessThanOrEqual(34.1);
  expect(reference?.height || 0).toBeGreaterThanOrEqual(33.9);
  expect(reference?.height || 0).toBeLessThanOrEqual(34.1);

  const visibleActionSizes = await page
    .locator(".qc-list-card__top .ayah-actions button")
    .evaluateAll((buttons) =>
      buttons
        .filter((button) => button.getClientRects().length > 0)
        .map((button) => {
          const rect = button.getBoundingClientRect();
          return { width: rect.width, height: rect.height };
        }),
    );
  expect(visibleActionSizes.length).toBeGreaterThanOrEqual(3);
  for (const action of visibleActionSizes) {
    expect(action.width).toBeGreaterThanOrEqual(33.9);
    expect(action.height).toBeGreaterThanOrEqual(33.9);
    expect(action.width).toBeLessThanOrEqual(34.1);
    expect(action.height).toBeLessThanOrEqual(34.1);
  }

  await page.getByRole("button", { name: "Rechercher", exact: true }).last().click();

  const overlay = page.locator(".search-pro-overlay").first();
  const searchSurface = page.locator(".search-pro").first();
  await expect(searchSurface).toBeVisible();

  const overlayPosition = await overlay.evaluate((node) => getComputedStyle(node).position);
  const overlayBox = await overlay.boundingBox();
  const searchBox = await searchSurface.boundingBox();
  expect(overlayPosition).toBe("fixed");
  expect(overlayBox?.x || 0).toBeGreaterThanOrEqual(0);
  expect(overlayBox?.y || 0).toBeGreaterThanOrEqual(0);
  expect((overlayBox?.x || 0) + (overlayBox?.width || 0)).toBeLessThanOrEqual(viewport.width + 1);
  expect((overlayBox?.y || 0) + (overlayBox?.height || 0)).toBeLessThanOrEqual(viewport.height + 1);
  expect(searchBox?.x || 0).toBeGreaterThanOrEqual(0);
  expect(searchBox?.y || 0).toBeGreaterThanOrEqual(0);
  expect((searchBox?.x || 0) + (searchBox?.width || 0)).toBeLessThanOrEqual(viewport.width + 1);
  expect((searchBox?.y || 0) + (searchBox?.height || 0)).toBeLessThanOrEqual(viewport.height + 1);
  expect(await overflowX(page)).toBeLessThanOrEqual(2);
});

test("device typography: interface and Quran text scale progressively", async ({ page }) => {
  const samples = [];
  const viewports = [
    { width: 320, height: 568 },
    { width: 768, height: 900 },
    { width: 1366, height: 900 },
    { width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    await openReader(page, viewport);
    samples.push({
      root: await fontSizePx(page, "html"),
      quran: await waitForFontSizePx(page, ".qc-ayah-text-ar"),
    });
    expect(await overflowX(page)).toBeLessThanOrEqual(2);
  }

  expect(samples[0].root).toBeGreaterThanOrEqual(15);
  expect(samples.at(-1).root).toBeLessThanOrEqual(17.1);
  expect(samples[0].quran).toBeGreaterThanOrEqual(24);
  expect(samples.at(-1).quran).toBeGreaterThanOrEqual(34);

  for (let index = 1; index < samples.length; index += 1) {
    expect(samples[index].root).toBeGreaterThanOrEqual(samples[index - 1].root);
    expect(samples[index].quran).toBeGreaterThanOrEqual(samples[index - 1].quran);
  }
});

test("Arabic reading controls visibly reduce and enlarge device-aware text", async ({ page }) => {
  await openReader(
    page,
    { width: 390, height: 844 },
    { quranFontSize: 25 },
  );

  const arabicText = page.locator(".qc-ayah-text-ar").first();
  const verseCard = page.locator(".qc-list-card").first();
  const initialPhoneSize = await fontSizePx(page, ".qc-ayah-text-ar");
  await expect
    .poll(() => verseCard.evaluate((node) => Number.parseFloat(getComputedStyle(node).paddingTop) || 0))
    .toBeGreaterThan(0);
  const initialCardPadding = await verseCard.evaluate((node) =>
    Number.parseFloat(getComputedStyle(node).paddingTop) || 0,
  );
  expect(initialPhoneSize).toBe(24);

  await revealReaderTools(page, 390);
  await page.locator(".srh-typography-trigger").click();
  await expect(page.locator(".srh-typography-trigger")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".srh-typography-panel")).toBeVisible();
  await page.locator('button[title="A-"]').click();
  await expect
    .poll(() => arabicText.evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize)))
    .toBeLessThan(initialPhoneSize);
  await expect
    .poll(() => verseCard.evaluate((node) => Number.parseFloat(getComputedStyle(node).paddingTop)))
    .toBeLessThan(initialCardPadding);
  await expect(page.locator(".afc-size-value")).toHaveText("23");

  await page.locator('button[title="A+"]').click();
  await expect
    .poll(() => arabicText.evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize)))
    .toBe(initialPhoneSize);
  await expect
    .poll(() => verseCard.evaluate((node) => Number.parseFloat(getComputedStyle(node).paddingTop)))
    .toBe(initialCardPadding);
  await expect(page.locator(".afc-size-value")).toHaveText("25");

  await openReader(
    page,
    { width: 1440, height: 900 },
    { quranFontSize: 25 },
  );
  expect(await fontSizePx(page, ".qc-ayah-text-ar")).toBe(34);
});

test("duas page: cards, Arabic text and controls adapt to phone and tablet", async ({ page }) => {
  await openDuas(page, { width: 320, height: 568 });

  expect(await overflowX(page)).toBeLessThanOrEqual(2);
  expect(await fontSizePx(page, ".duas-title")).toBeGreaterThanOrEqual(21);
  expect(await fontSizePx(page, ".dua-arabic")).toBeGreaterThanOrEqual(22);
  const phoneColumns = await page
    .locator(".gallery-grid")
    .first()
    .evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(" ").length);
  expect(phoneColumns).toBe(1);

  const visibleControls = await page.locator(".duas-page button").evaluateAll((buttons) =>
    buttons
      .filter((button) => button.getClientRects().length > 0)
      .slice(0, 8)
      .map((button) => button.getBoundingClientRect().height),
  );
  expect(visibleControls.length).toBeGreaterThan(0);
  for (const height of visibleControls) {
    expect(height).toBeGreaterThanOrEqual(38);
  }

  await openDuas(page, { width: 820, height: 920 });
  expect(await overflowX(page)).toBeLessThanOrEqual(2);
  expect(await fontSizePx(page, ".dua-arabic")).toBeGreaterThanOrEqual(24);

  await openDuas(page, { width: 1280, height: 900 });
  const copyIcon = await box(page, '.dua-open-btn-v5[aria-label="Copier l\'invocation"] svg');
  expect(copyIcon?.width || 0).toBeGreaterThanOrEqual(13);
  expect(copyIcon?.height || 0).toBeGreaterThanOrEqual(13);
});

test("duas dark theme keeps its devotional palette on a direct load", async ({ page }) => {
  await seedReadingState(page, { showDuas: true, theme: "dark" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/duas");
  await expect(page.locator(".duas-page").first()).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  const surfaces = await page.evaluate(() => {
    const hero = getComputedStyle(document.querySelector(".duas-hero"));
    const card = getComputedStyle(document.querySelector(".dua-card-v5"));
    return {
      heroImage: hero.backgroundImage,
      heroBorder: hero.borderTopColor,
      cardBackground: card.backgroundColor,
    };
  });

  expect(surfaces.heroImage).toContain("rgb(17, 29, 24)");
  expect(surfaces.heroBorder).toContain("202, 160, 63");
  expect(surfaces.cardBackground).toBe("rgb(16, 27, 23)");
  expect(await overflowX(page)).toBeLessThanOrEqual(2);

  const copyIcon = await box(page, '.dua-open-btn-v5[aria-label="Copier l\'invocation"] svg');
  expect(copyIcon?.width || 0).toBeGreaterThanOrEqual(13);
  expect(copyIcon?.height || 0).toBeGreaterThanOrEqual(13);
});

test("short landscape: reader search remains fully reachable", async ({ page }) => {
  const viewport = { width: 844, height: 390 };
  await openReader(page, viewport);

  await page.locator(".mp-header__search").first().click();
  const overlay = page.locator(".search-pro-overlay").first();
  const searchSurface = page.locator(".search-pro").first();
  await expect(searchSurface).toBeVisible();

  const overlayBox = await overlay.boundingBox();
  const searchBox = await searchSurface.boundingBox();
  expect(await overlay.evaluate((node) => getComputedStyle(node).position)).toBe("fixed");
  expect((overlayBox?.width || 0)).toBeLessThanOrEqual(viewport.width);
  expect((overlayBox?.height || 0)).toBeLessThanOrEqual(viewport.height);
  expect(searchBox?.y || 0).toBeGreaterThanOrEqual(0);
  expect((searchBox?.y || 0) + (searchBox?.height || 0)).toBeLessThanOrEqual(viewport.height + 1);
  expect(await overflowX(page)).toBeLessThanOrEqual(2);
});
