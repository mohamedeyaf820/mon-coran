import { test, expect } from "@playwright/test";

const SETTINGS_KEY = "mushaf-plus-settings";
const CANONICAL_THEMES = {
  light: {
    themeBg: "#f7f9f8",
    themeSurface: "#ffffff",
    themeText: "#17211c",
    themePrimary: "#0b6235",
    themeAccent: "#0b6235",
    primary: "#0b6235",
    bgPrimary: "#f7f9f8",
    textPrimary: "#17211c",
  },
  sepia: {
    themeBg: "#f3e8cf",
    themeSurface: "#fff6e3",
    themeText: "#241505",
    themePrimary: "#7c4a17",
    themeAccent: "#7c4a17",
    primary: "#7c4a17",
    bgPrimary: "#f3e8cf",
    textPrimary: "#241505",
  },
  dark: {
    themeBg: "#101412",
    themeSurface: "#191f1c",
    themeText: "#eceae3",
    themePrimary: "#2f9f6b",
    themeAccent: "#d6b45c",
    primary: "#2f9f6b",
    primaryDark: "#247c55",
    bgPrimary: "#101412",
    textPrimary: "#eceae3",
  },
};

async function seedState(page, theme, showHome = true) {
  await page.addInitScript(
    ({ key, selectedTheme, home }) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          skipSplashAnimation: true,
          showHome: home,
          showDuas: false,
          sidebarOpen: false,
          displayMode: "surah",
          currentSurah: 3,
          currentAyah: 1,
          lang: "fr",
          riwaya: "hafs",
          theme: selectedTheme,
        }),
      );
    },
    { key: SETTINGS_KEY, selectedTheme: theme, home: showHome },
  );
}

async function readThemeState(page) {
  return page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const read = (name) => root.getPropertyValue(name).trim().toLowerCase();
    const header = document.querySelector(".mp-header");
    const headerBar = document.querySelector(".mp-header__bar");
    const headerStyle = header ? getComputedStyle(header) : null;
    const barStyle = headerBar ? getComputedStyle(headerBar) : null;

    return {
      tokens: {
        themeBg: read("--theme-bg"),
        themeSurface: read("--theme-surface"),
        themeText: read("--theme-text"),
        themePrimary: read("--theme-primary"),
        themeAccent: read("--theme-accent"),
        primary: read("--primary"),
        primaryDark: read("--primary-dark"),
        bgPrimary: read("--bg-primary"),
        textPrimary: read("--text-primary"),
        border: read("--border"),
      },
      header: {
        backgroundColor: headerStyle?.backgroundColor || "",
        backgroundImage: headerStyle?.backgroundImage || "",
        backdropFilter: headerStyle?.backdropFilter || "",
        barBackgroundColor: barStyle?.backgroundColor || "",
        barBackgroundImage: barStyle?.backgroundImage || "",
        barBackdropFilter: barStyle?.backdropFilter || "",
      },
    };
  });
}

function parseRgb(value) {
  const channels = (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
  return value.startsWith("color(srgb")
    ? channels.map((channel) => channel * 255)
    : channels;
}

function luminance(value) {
  const [red = 0, green = 0, blue = 0] = parseRgb(value).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground, background) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

for (const [theme, expectedTokens] of Object.entries(CANONICAL_THEMES)) {
  test(`${theme}: la palette reste identique après accueil → lecteur → accueil`, async ({ page }) => {
    await seedState(page, theme, true);
    await page.goto("/");
    await expect(page.locator(".app-view-home")).toBeVisible();
    await expect(page.locator(".mp-header")).toBeVisible();

    const initial = await readThemeState(page);
    expect(initial.tokens).toMatchObject(expectedTokens);

    const start = page.getByRole("button", {
      name: /Commencer la lecture|Reprendre la lecture|Continuer|Start reading|Continue|Resume reading/i,
    });
    await start.first().click();
    await expect(page.locator(".quran-display--platform")).toBeVisible({ timeout: 30_000 });
    await expect(page.locator(".qc-ayah-text-ar").first()).toBeVisible({ timeout: 30_000 });

    const reader = await readThemeState(page);
    expect(reader.tokens).toEqual(initial.tokens);

    await page.goBack();
    await expect(page.locator(".app-view-home")).toBeVisible({ timeout: 30_000 });

    const returnedHome = await readThemeState(page);
    expect(returnedHome.tokens).toEqual(initial.tokens);
    expect(returnedHome.header).toEqual(initial.header);
  });
}

test("sombre: les cartes de l'accueil restent sur la palette sombre", async ({ page }) => {
  await seedState(page, "dark", true);
  await page.goto("/");
  await expect(page.locator(".home-resume-panel")).toBeVisible();

  const surfaces = await page.locator(".home-resume-panel").evaluate((card) => {
    const heading = card.querySelector("h1");
    return {
      background: getComputedStyle(card).backgroundColor,
      heading: heading ? getComputedStyle(heading).color : "",
    };
  });

  expect(surfaces.background).not.toBe("rgb(255, 255, 255)");
  expect(contrastRatio(surfaces.heading, surfaces.background)).toBeGreaterThanOrEqual(4.5);
});

test("reprendre une lecture en mode page conserve la page", async ({ page }) => {
  await seedState(page, "light", false);
  await page.goto("/page/42");
  await expect(page.locator(".mp-header")).toBeVisible();
  await page.locator(".mp-header__brand").click();
  await expect(page.locator(".app-view-home")).toBeVisible();
  await page.locator(".home-resume-panel__primary").click();
  await expect(page).toHaveURL(/\/page\/42$/);
});

test("clair: les onglets et la fermeture de la sidebar restent lisibles", async ({ page }) => {
  await seedState(page, "light", false);
  await page.goto("/surah/3");
  await expect(page.locator(".quran-display--platform")).toBeVisible({ timeout: 30_000 });

  await page.getByRole("button", { name: /Menu/i }).first().click();
  const sidebar = page.locator("#sidebar");
  await expect(sidebar).toHaveClass(/\bopen\b/);

  const tabStyles = await sidebar.locator(".sidebar-tab-trigger").evaluateAll((tabs) =>
    tabs.map((tab) => {
      const own = getComputedStyle(tab);
      const parent = getComputedStyle(tab.parentElement);
      return {
        selected: tab.getAttribute("aria-selected") === "true",
        color: own.color,
        backgroundColor:
          own.backgroundColor === "rgba(0, 0, 0, 0)"
            ? parent.backgroundColor
            : own.backgroundColor,
        backgroundImage: own.backgroundImage,
      };
    }),
  );

  expect(tabStyles.length).toBeGreaterThanOrEqual(3);
  for (const tab of tabStyles) {
    expect(tab.backgroundImage).toBe("none");
    expect(contrastRatio(tab.color, tab.backgroundColor)).toBeGreaterThanOrEqual(4.5);
  }

  const closeStyle = await sidebar.locator(".sidebar-close-button").evaluate((button) => {
    const style = getComputedStyle(button);
    const icon = button.querySelector("svg")?.getBoundingClientRect();
    return {
      color: style.color,
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      iconWidth: icon?.width || 0,
      iconHeight: icon?.height || 0,
    };
  });

  expect(closeStyle.backgroundImage).toBe("none");
  expect(contrastRatio(closeStyle.color, closeStyle.backgroundColor)).toBeGreaterThanOrEqual(3);
  expect(closeStyle.iconWidth).toBeGreaterThanOrEqual(16);
  expect(closeStyle.iconHeight).toBeGreaterThanOrEqual(16);
});

test("clair: la recherche utilise un backdrop translucide et une surface lisible", async ({ page }) => {
  await seedState(page, "light", false);
  await page.goto("/surah/3");
  await expect(page.locator(".quran-display--platform")).toBeVisible({ timeout: 30_000 });

  await page.getByRole("button", { name: /Rechercher|Search/i }).first().click();
  const overlay = page.locator(".search-pro-overlay");
  const surface = page.locator(".search-pro");
  await expect(surface).toBeVisible();
  await expect(overlay).not.toHaveClass(/search-modal-shell/);

  const overlayStyle = await overlay.evaluate((node) => {
    const style = getComputedStyle(node);
    const alpha = Number((style.backgroundColor.match(/[\d.]+/g) || [0, 0, 0, 0])[3] || 1);
    return {
      alpha,
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
    };
  });
  expect(overlayStyle.alpha).toBeGreaterThanOrEqual(0.2);
  expect(overlayStyle.alpha).toBeLessThan(0.7);
  expect(overlayStyle.backgroundImage).not.toContain("7, 18, 40");

  const titleContrast = await surface.locator("h2").evaluate((title) => {
    const foreground = getComputedStyle(title).color;
    const background = getComputedStyle(title.closest(".search-pro__header")).backgroundColor;
    return { foreground, background };
  });
  expect(contrastRatio(titleContrast.foreground, titleContrast.background)).toBeGreaterThanOrEqual(4.5);
});

test("sombre: sidebar, recherche et états actifs gardent des contrastes cohérents", async ({ page }) => {
  await seedState(page, "dark", false);
  await page.goto("/surah/3");
  await expect(page.locator(".quran-display--platform")).toBeVisible({ timeout: 30_000 });

  await page.getByRole("button", { name: /Menu/i }).first().click();
  const sidebar = page.locator("#sidebar");
  await expect(sidebar).toHaveClass(/\bopen\b/);

  const sidebarStyles = await sidebar.locator(".sidebar-tab-trigger").evaluateAll((tabs) =>
    tabs.map((tab) => {
      const style = getComputedStyle(tab);
      const parent = getComputedStyle(tab.parentElement);
      return {
        color: style.color,
        backgroundColor:
          style.backgroundColor === "rgba(0, 0, 0, 0)"
            ? parent.backgroundColor
            : style.backgroundColor,
      };
    }),
  );
  for (const tab of sidebarStyles) {
    expect(contrastRatio(tab.color, tab.backgroundColor)).toBeGreaterThanOrEqual(4.5);
  }

  await sidebar.locator(".sidebar-close-button").click();
  await expect(sidebar).not.toHaveClass(/\bopen\b/);
  await page.getByRole("button", { name: /Rechercher|Search/i }).first().click();

  const overlay = page.locator(".search-pro-overlay");
  const surface = page.locator(".search-pro");
  await expect(surface).toBeVisible();

  const overlayAlpha = await overlay.evaluate((node) =>
    Number((getComputedStyle(node).backgroundColor.match(/[\d.]+/g) || [0, 0, 0, 0])[3] || 1),
  );
  expect(overlayAlpha).toBeGreaterThanOrEqual(0.55);
  expect(overlayAlpha).toBeLessThanOrEqual(0.72);

  const contrastSamples = await surface.evaluate((node) => {
    const sample = (element, pseudo = null) => {
      const style = getComputedStyle(element, pseudo);
      return { color: style.color, backgroundColor: getComputedStyle(element).backgroundColor };
    };
    const input = node.querySelector(".search-pro__input-shell input");
    const activeMode = node.querySelector(".search-pro__modes button.is-active");
    const header = node.querySelector(".search-pro__header");
    const title = node.querySelector("h2");
    return {
      title: {
        color: getComputedStyle(title).color,
        backgroundColor: getComputedStyle(header).backgroundColor,
      },
      input: sample(input),
      placeholder: {
        color: getComputedStyle(input, "::placeholder").color,
        backgroundColor: getComputedStyle(input).backgroundColor,
      },
      activeMode: sample(activeMode),
    };
  });

  for (const [label, sample] of Object.entries(contrastSamples)) {
    expect(
      contrastRatio(sample.color, sample.backgroundColor),
      `${label}: ${sample.color} sur ${sample.backgroundColor}`,
    ).toBeGreaterThanOrEqual(4.5);
  }
});
