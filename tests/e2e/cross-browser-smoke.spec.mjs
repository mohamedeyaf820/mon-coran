import { expect, test } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem("mushaf-plus-settings")) return;
    localStorage.setItem(
      "mushaf-plus-settings",
      JSON.stringify({
        skipSplashAnimation: true,
        showHome: true,
        showDuas: false,
        lang: "fr",
        theme: "light",
        riwaya: "hafs",
      }),
    );
  });
});

test("compatibilité: accueil, route légale et lecteur", async ({ page }) => {
  await page.goto("/", { waitUntil: "commit" });
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/lecture|reading|قراءة/i);
  await expect(page.locator(".hp-card--surah").first()).toBeVisible();

  await page.goto("/privacy", { waitUntil: "commit" });
  await expect(page.locator(".legal-page")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/lecture|reading|بيانات/i);

  await page.goto("/surah/1", { waitUntil: "commit" });
  await expect(page.locator(".qc-ayah-text-ar").first()).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
});

test("la recherche unifiée reste simple sur un très petit écran", async ({ page }) => {
  await installQuranNetworkFixtures(page);
  await page.setViewportSize({ width: 319, height: 698 });
  await page.goto("/surah/63", { waitUntil: "domcontentloaded" });

  await page.locator(".mp-header__more").click();
  await page.locator('.mp-header-menu__item[data-key="search"]').click();

  const dialog = page.getByRole("dialog", { name: /Recherche|Search|بحث/i });
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await expect(dialog.locator(".search-pro__modes")).toHaveCount(0);
  await expect(dialog.locator(".search-pro__summary")).toHaveCount(0);
  await expect(dialog.getByRole("textbox")).toBeVisible();
  await expect(
    dialog.getByRole("button", {
      name: /Rechercher avec votre voix|Search with your voice|البحث باستخدام صوتك/i,
    }),
  ).toBeVisible();

  const layout = await dialog.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const input = node.querySelector(".search-pro__input-shell").getBoundingClientRect();
    const close = node.querySelector(".search-pro__close").getBoundingClientRect();
    const voice = node.querySelector(".search-pro__voice-btn").getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      overflow: node.scrollWidth - node.clientWidth,
      inputHeight: input.height,
      closeWidth: close.width,
      voiceWidth: voice.width,
    };
  });

  expect(layout.width).toBeLessThanOrEqual(319);
  expect(layout.height).toBeLessThanOrEqual(698);
  expect(layout.overflow).toBeLessThanOrEqual(2);
  expect(layout.inputHeight).toBeLessThanOrEqual(50);
  expect(layout.closeWidth).toBeLessThanOrEqual(44);
  expect(layout.voiceWidth).toBeLessThanOrEqual(38);

  for (const viewport of [
    { width: 768, height: 900 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await expect.poll(async () => {
      const rect = await dialog.boundingBox();
      return rect?.width || 0;
    }).toBeLessThanOrEqual(720);
    expect(
      await dialog.evaluate((node) => node.scrollWidth - node.clientWidth),
    ).toBeLessThanOrEqual(2);
  }
});

test("le verset 53:4 conserve un flux arabe canonique et RTL sur mobile", async ({ page }) => {
  await installQuranNetworkFixtures(page);
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
        lang: "fr",
        riwaya: "hafs",
        fontFamily: "qpc-hafs",
        quranFontSize: 42,
        showTajwid: true,
        showTranslation: false,
        showTransliteration: false,
        lastPosition: { surah: 53, ayah: 4, page: 526, juz: 27 },
      }),
    );
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/surah/53/4", { waitUntil: "domcontentloaded" });

  const card = page.locator(".qc-list-card").filter({
    has: page.getByRole("button", { name: "Verset 4", exact: true }),
  });
  const ayah = card.locator(".qc-ayah-text-ar");
  await expect(ayah).toBeVisible({ timeout: 30_000 });
  await expect(ayah.locator(".wbw-word")).toHaveCount(0);
  await expect(ayah.locator(".quran-word-unit")).toHaveCount(0);
  await expect(ayah).toContainText("إِنْ هُوَ إِلَّا وَحْيٌ يُوحَىٰ");

  let layout;
  await expect.poll(async () => {
    try {
      layout = await ayah.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          text: element.textContent.replace(/\s+/g, " ").trim(),
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
          direction: style.direction,
          display: style.display,
          overflowWrap: style.overflowWrap,
          wordBreak: style.wordBreak,
          tajwidDisplay: getComputedStyle(
            element.querySelector(".quran-tajwid-text"),
          ).display,
        };
      });
      return `${layout.direction}:${layout.display}`;
    } catch {
      return null;
    }
  }, { timeout: 10_000 }).toBe("rtl:block");

  expect(layout.text).toContain("إِنْ هُوَ إِلَّا وَحْيٌ يُوحَىٰ");
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
  expect(layout.direction).toBe("rtl");
  expect(layout.display).toBe("block");
  expect(layout.tajwidDisplay).toBe("inline");
  expect(layout.overflowWrap).toBe("normal");
  expect(layout.wordBreak).toBe("normal");

  const reference = card.locator(".qc-list-card__reference");
  const touchTarget = await reference.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
  // The compact reader row intentionally uses a 34px control on phones. It
  // remains above the WCAG 2.2 minimum target size while leaving enough room
  // for reference, play, bookmark and overflow on a 319px WebKit viewport.
  expect(touchTarget.width).toBeGreaterThanOrEqual(33.9);
  expect(touchTarget.height).toBeGreaterThanOrEqual(33.9);
  expect(touchTarget.width).toBeLessThanOrEqual(34.1);
  expect(touchTarget.height).toBeLessThanOrEqual(34.1);

  for (const width of [320, 375, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await expect.poll(async () => {
      try {
        return await ayah.evaluate((element) => ({
          ayahFits: element.scrollWidth <= element.clientWidth + 1,
          pageFits: document.documentElement.scrollWidth <= window.innerWidth + 1,
        }));
      } catch {
        return null;
      }
    }, {
      message: `le lecteur ne doit pas déborder à ${width}px`,
      timeout: 10_000,
    }).toEqual({ ayahFits: true, pageFits: true });
  }
});

test("les signes de waqf restent des annotations coraniques compactes", async ({ page }) => {
  await installQuranNetworkFixtures(page, { withWaqfSigns: true });
  await page.addInitScript(() => {
    localStorage.setItem(
      "mushaf-plus-settings",
      JSON.stringify({
        skipSplashAnimation: true,
        showHome: false,
        showDuas: false,
        sidebarOpen: false,
        displayMode: "surah",
        mushafLayout: "mushaf",
        lang: "fr",
        theme: "light",
        riwaya: "hafs",
        fontFamily: "qpc-hafs",
        quranFontSize: 30,
        showTajwid: true,
        showTranslation: false,
        showTransliteration: false,
        lastPosition: { surah: 3, ayah: 2, page: 1, juz: 1 },
      }),
    );
  });
  await page.setViewportSize({ width: 319, height: 698 });
  await page.goto("/surah/3", { waitUntil: "domcontentloaded" });

  const markers = page.locator(".mushaf-text-block .waqf-marker");
  await expect(markers).toHaveCount(3, { timeout: 30_000 });
  await expect(markers.nth(0)).toHaveAttribute("data-waqf", "6D7");
  await expect(markers.nth(1)).toHaveAttribute("data-waqf", "6DA");
  await expect(markers.nth(2)).toHaveAttribute("data-waqf", "6D6");
  await expect(markers.nth(0)).toContainText("\u06D7");
  await expect(markers.nth(1)).toContainText("\u06DA");
  await expect(markers.nth(2)).toContainText("\u06D6");

  for (const marker of await markers.all()) {
    const layout = await marker.evaluate((element) => {
      const markerStyle = getComputedStyle(element);
      const ayah = element.closest(".qc-ayah-text-ar");
      const ayahStyle = getComputedStyle(ayah);
      const rect = element.getBoundingClientRect();
      return {
        display: markerStyle.display,
        borderWidth: markerStyle.borderWidth,
        outlineWidth: markerStyle.outlineWidth,
        backgroundColor: markerStyle.backgroundColor,
        boxShadow: markerStyle.boxShadow,
        markerFontSize: Number.parseFloat(markerStyle.fontSize),
        markerHeight: rect.height,
        ayahFontSize: Number.parseFloat(ayahStyle.fontSize),
        ayahLineHeight: Number.parseFloat(ayahStyle.lineHeight),
      };
    });
    expect(layout.display).toBe("inline-block");
    expect(layout.borderWidth).toBe("0px");
    expect(layout.outlineWidth).toBe("0px");
    expect(layout.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(layout.boxShadow).toBe("none");
    expect(layout.markerFontSize).toBeLessThan(layout.ayahFontSize * 0.8);
    expect(layout.markerHeight).toBeLessThan(layout.ayahLineHeight * 0.5);
  }

  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBe(true);
});

test("Warsh garde un seul médaillon de fin et un shell progressif à 319px", async ({ page }) => {
  await installQuranNetworkFixtures(page, { withWaqfSigns: true });
  await page.addInitScript(() => {
    localStorage.setItem(
      "mushaf-plus-settings",
      JSON.stringify({
        skipSplashAnimation: true,
        showHome: false,
        showDuas: false,
        sidebarOpen: false,
        displayMode: "surah",
        mushafLayout: "mushaf",
        lang: "fr",
        theme: "light",
        riwaya: "warsh",
        fontFamily: "scheherazade-new",
        quranFontSize: 22,
        showTajwid: true,
        showTranslation: false,
        showTransliteration: false,
        lastPosition: { surah: 3, ayah: 1, page: 50, juz: 3 },
      }),
    );
  });
  await page.setViewportSize({ width: 319, height: 698 });
  await page.goto("/surah/3", { waitUntil: "domcontentloaded" });

  const firstAyah = page.locator("#ayah-1");
  await expect(firstAyah).toBeVisible({ timeout: 30_000 });
  await expect(firstAyah.locator(".warsh-waqf-marker")).toHaveCount(2);
  await expect(firstAyah.locator(".warsh-waqf-marker").first()).toContainText("\u06D6");
  await expect(firstAyah.locator(".native-ayah-marker")).toHaveCount(1);

  await expect(page.locator(".mp-header__search")).toBeHidden();
  await expect(page.locator(".mp-header__more")).toBeVisible();
  await page.locator(".mp-header__more").click();
  const quickMenu = page.locator(".mp-header-menu");
  await expect(quickMenu.locator('.mp-header-menu__item[data-key="search"]')).toBeVisible();
  await expect(quickMenu.locator(".mp-header-menu__header-text")).toHaveCount(0);
  const quickMenuBox = await quickMenu.boundingBox();
  expect(quickMenuBox?.width || 0).toBeLessThanOrEqual(315);
  expect(quickMenuBox?.height || 0).toBeLessThanOrEqual(310);
  await page.mouse.click(4, 520);
  await expect(quickMenu).toBeHidden();

  const compactPlayer = page.getByTestId("audio-player-compact");
  await expect(compactPlayer).toBeVisible();
  const compactPlayerBox = await compactPlayer.boundingBox();
  expect(compactPlayerBox?.width || 0).toBeLessThanOrEqual(319);
  expect(compactPlayerBox?.height || 0).toBeLessThanOrEqual(80);

  const mobileTitle = page.locator(".srh-mobile-bar__title");
  await expect(mobileTitle).toBeHidden();
  await expect(page.locator(".srh-mobile-bar__name")).toBeVisible();
  const mobileActions = page.locator(".srh-mobile-bar__actions button");
  await expect(mobileActions).toHaveCount(3);
  for (const action of await mobileActions.all()) {
    const dimensions = await action.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    expect(dimensions.width).toBeLessThanOrEqual(40);
    expect(dimensions.height).toBeGreaterThanOrEqual(40);
  }

  const disclosure = page.locator(".srh-mobile-bar__disclosure");
  if ((await disclosure.getAttribute("aria-expanded")) !== "true") {
    await disclosure.click();
  }
  await expect(page.locator(".srh-controls")).toBeVisible();
  const typographyTrigger = page.locator(".srh-typography-trigger");
  await expect(typographyTrigger).toBeVisible();
  await typographyTrigger.click();
  await expect(page.locator(".srh-typography-panel")).toBeVisible();

  const responsiveLayout = await page.evaluate(() => ({
    fitsViewport: document.documentElement.scrollWidth <= window.innerWidth + 1,
    navWidth: document.querySelector(".mp-header__nav")?.getBoundingClientRect().width || 0,
    controlsHeight: document.querySelector(".srh-controls")?.getBoundingClientRect().height || 0,
    fontRows: Array.from(
      document.querySelectorAll(".srh-typography-panel .afc-font-group, .srh-typography-panel .afc-size-group"),
      (element) => element.getBoundingClientRect().height,
    ),
  }));
  expect(responsiveLayout.fitsViewport).toBe(true);
  expect(responsiveLayout.navWidth).toBeLessThanOrEqual(168);
  expect(responsiveLayout.controlsHeight).toBeLessThanOrEqual(53);
  expect(responsiveLayout.fontRows.length).toBeGreaterThanOrEqual(2);
  for (const height of responsiveLayout.fontRows) expect(height).toBeLessThanOrEqual(44);

  await page.setViewportSize({ width: 1263, height: 698 });
  await expect(page.locator(".mp-header__search")).toBeVisible();
  await expect(page.locator(".mp-header__riwaya-toggle")).toBeVisible();
  await expect(page.locator(".srh-identity")).toBeVisible();
  await expect(page.locator(".srh-mobile-bar")).toBeHidden();
});

test("le mode Mushaf compose les ayahs dans un seul paragraphe continu", async ({ page }) => {
  await installQuranNetworkFixtures(page);
  await page.addInitScript(() => {
    localStorage.setItem(
      "mushaf-plus-settings",
      JSON.stringify({
        skipSplashAnimation: true,
        showHome: false,
        showDuas: false,
        sidebarOpen: false,
        displayMode: "page",
        mushafLayout: "mushaf",
        lang: "fr",
        riwaya: "hafs",
        fontFamily: "qpc-hafs",
        quranFontSize: 34,
        showTajwid: true,
        showTranslation: false,
        showTransliteration: false,
        lastPosition: { surah: 2, ayah: 1, page: 3, juz: 1 },
      }),
    );
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/page/3", { waitUntil: "domcontentloaded" });

  const textBlock = page.locator(".mushaf-text-block.mushaf-container").first();
  const verses = textBlock.locator(":scope > .quran-verse-inline");
  await expect(textBlock).toBeVisible({ timeout: 30_000 });
  await expect.poll(() => verses.count()).toBeGreaterThan(1);

  const layout = await textBlock.evaluate((element) => {
    const style = getComputedStyle(element);
    const verse = element.querySelector(".quran-verse-inline");
    const ayah = verse?.querySelector(".qc-ayah-text-ar");
    const inlineText = ayah?.querySelector(
      ".quran-tajwid-text, .quran-canonical-text",
    );
    const fontSize = Number.parseFloat(style.fontSize);
    const lineHeight = Number.parseFloat(style.lineHeight);
    return {
      direction: style.direction,
      textAlign: style.textAlign,
      verseDisplay: verse ? getComputedStyle(verse).display : null,
      ayahDisplay: ayah ? getComputedStyle(ayah).display : null,
      ayahWidth: ayah?.getBoundingClientRect().width ?? 0,
      blockWidth: element.getBoundingClientRect().width,
      inlineTextDisplay: inlineText ? getComputedStyle(inlineText).display : null,
      lineHeightRatio: lineHeight / fontSize,
      pageFits: document.documentElement.scrollWidth <= window.innerWidth + 1,
    };
  });

  expect(layout.direction).toBe("rtl");
  expect(layout.textAlign).toBe("justify");
  expect(layout.verseDisplay).toBe("inline");
  expect(layout.ayahDisplay).toBe("inline");
  expect(layout.inlineTextDisplay).toBe("inline");
  expect(layout.ayahWidth).toBeLessThan(layout.blockWidth);
  expect(layout.lineHeightRatio).toBeLessThanOrEqual(2.1);
  expect(layout.pageFits).toBe(true);

  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width <= 430 ? 844 : 900 });
    let responsiveLayout;
    await expect.poll(async () => {
      responsiveLayout = await textBlock.evaluate((element) => {
        const ayah = element.querySelector(
          ".quran-verse-inline .qc-ayah-text-ar",
        );
        return {
          ayahDisplay: ayah?.isConnected ? getComputedStyle(ayah).display : null,
          lineHeightRatio:
            Number.parseFloat(getComputedStyle(element).lineHeight) /
            Number.parseFloat(getComputedStyle(element).fontSize),
          pageFits: document.documentElement.scrollWidth <= window.innerWidth + 1,
        };
      });
      return responsiveLayout.ayahDisplay;
    }).toBe("inline");
    expect(responsiveLayout.ayahDisplay, `${width}px doit conserver le flux inline`).toBe("inline");
    expect(responsiveLayout.lineHeightRatio).toBeLessThanOrEqual(2.1);
    expect(responsiveLayout.pageFits, `${width}px ne doit pas déborder`).toBe(true);
  }
});

test("Al-Fātiḥa garde son arabe canonique si un cache livre les mots d'un autre verset", async ({ page }) => {
  await installQuranNetworkFixtures(page, { corruptFatihaWords: true });
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
        lang: "fr",
        riwaya: "hafs",
        fontFamily: "qpc-hafs",
        quranFontSize: 42,
        showTajwid: true,
        showTranslation: true,
        showTransliteration: true,
        lastPosition: { surah: 1, ayah: 1, page: 1, juz: 1 },
      }),
    );
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/surah/1/1", { waitUntil: "domcontentloaded" });

  const card = page.locator(".qc-list-card").filter({
    has: page.getByRole("button", { name: "Verset 1", exact: true }),
  });
  const ayah = card.locator(".qc-ayah-text-ar");
  await expect(ayah).toBeVisible({ timeout: 30_000 });
  await expect(ayah).toContainText("بِسْمِ");
  await expect(ayah).not.toContainText("الْحَمْدُ");
  await expect(ayah.locator(".wbw-word")).toHaveCount(0);
});
