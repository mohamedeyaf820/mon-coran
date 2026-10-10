import { expect, test } from "@playwright/test";

// The invocations hub (/duas), the Hisn al-Muslim chapters (/duas/hisn, /duas/hisn/27)
// and the Quranic supplications (/duas/coran): navigation, language, sources, search.

function seed() {
  return ({ lang, theme }) => {
    localStorage.setItem(
      "mushaf-plus-settings",
      JSON.stringify({ skipSplashAnimation: true, showHome: true, showDuas: false, lang, theme, riwaya: "hafs" }),
    );
  };
}

async function open(page, path, lang = "fr", theme = "light") {
  await page.addInitScript(seed(), { lang, theme });
  await page.goto(path);
}

test("hub: quick adhkar and the two libraries are links to real pages", async ({ page }) => {
  await open(page, "/duas");
  await expect(page.getByRole("heading", { level: 1, name: "Invocations & Adhkar" })).toBeVisible({ timeout: 30_000 });

  const quick = page.locator(".duas-quick a");
  await expect(quick).toHaveCount(4);
  await expect(quick.nth(0)).toHaveAttribute("href", "/duas/hisn/27");
  await expect(quick.nth(1)).toHaveAttribute("href", "/duas/hisn/28");
  await expect(quick.nth(3)).toHaveAttribute("href", "/duas/hisn/25");

  await expect(page.locator(".duas-tile").nth(0)).toHaveAttribute("href", "/duas/hisn");
  await expect(page.locator(".duas-tile").nth(1)).toHaveAttribute("href", "/duas/coran");
  // The counts come from the data, not from a constant.
  await expect(page.locator(".duas-tile").nth(0)).toContainText("132 chapitres · 267 invocations");
  await expect(page.locator(".duas-tile").nth(1)).toContainText("58 invocations");
  await expect(page.locator(".duas-tile").nth(2)).toHaveAttribute("href", "/duas/rabbana");
  await expect(page.locator(".duas-tile").nth(3)).toHaveAttribute("href", "/duas/khatm");
});

test("Rabbana: forty numbered supplications, each with its verse, opening in the reader", async ({ page }) => {
  await open(page, "/duas/rabbana");
  await expect(page.getByRole("heading", { level: 1, name: "Les 40 Rabbana" })).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".dua-card-v5")).toHaveCount(40);
  const first = page.locator(".dua-card-v5").first();
  await expect(first).toContainText("La Vache");
  await expect(first).toContainText("2:127");
  await expect(first).toContainText("1 sur 40");
  await expect(page.locator(".dua-card-v5").nth(39)).toContainText("66:8");
  // The three parts of 2:286 are told apart.
  await expect(page.locator(".dua-card-v5", { hasText: "2:286 (2/3)" })).toHaveCount(1);
  await expect(page.locator(".duas-results-copy")).toContainText("Sens écrit par MushafPlus");
  await first.getByRole("button", { name: "Lire le verset dans le Coran" }).click();
  await expect(page).toHaveURL(/\/surah\/2\/127/);
});

test("khatm: says that no wording is established, and does not pass a weak text off as the Prophet's", async ({ page }) => {
  await open(page, "/duas/khatm");
  await expect(page.getByRole("heading", { level: 1, name: /khatm/ })).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".dua-info-card")).toContainText("Anas ibn Mâlik");
  await expect(page.locator(".dua-info-card")).toContainText("non au Prophète");
  const weak = page.locator(".dua-card-v5", { hasText: "ارْحَمْنِي بِالْقُرْآنِ" });
  await expect(weak).toContainText("ne l’attribuez pas au Prophète");
  const link = weak.locator("a[href^='https://dorar.net/']");
  await expect(link).toHaveAttribute("rel", /noopener/);
  // Suggested supplications come from the Quran list and the Hisn library, each keeping its own sources.
  await expect(page.locator(".dua-card-v5", { hasText: "2:127" })).toHaveCount(1);
  await expect(page.locator(".dua-card-v5 .dua-sources").first()).toBeVisible();
});

test("navigation: one history entry per page, Back returns, the title takes focus", async ({ page }) => {
  await open(page, "/duas");
  await page.locator(".duas-tile").nth(0).click();
  await expect(page).toHaveURL(/\/duas\/hisn$/);
  await expect(page.locator(".hisn-row").first()).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".duas-title")).toBeFocused();

  await page.locator(".hisn-row").nth(1).click();
  await expect(page).toHaveURL(/\/duas\/hisn\/28$/);
  await expect(page.getByRole("heading", { level: 1, name: "Avant de dormir" })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/duas\/hisn$/);
  await expect(page.locator(".hisn-row").first()).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/duas$/);
  await expect(page.locator(".duas-quick")).toBeVisible();
});

test("chapters are named in the language the reader chose, Arabic stays secondary", async ({ page }) => {
  await open(page, "/duas/hisn", "fr");
  const first = page.locator(".hisn-row").first();
  await expect(first.locator(".hisn-row__title")).toHaveText("Adhkar du matin et du soir", { timeout: 30_000 });
  await expect(first.locator(".hisn-row__ar")).toHaveText("أذكار الصباح والمساء");
  await expect(first.locator(".hisn-row__title")).toHaveAttribute("lang", "fr");

  await open(page, "/duas/hisn", "en");
  await expect(page.locator(".hisn-row .hisn-row__title").first()).toHaveText("Morning and evening adhkar", { timeout: 30_000 });
});

test("Arabic interface: Arabic titles alone, right-to-left layout, English line under the Arabic text", async ({ page }) => {
  await open(page, "/duas/hisn/28", "ar");
  await expect(page.locator(".dua-card-v5").first()).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".duas-title")).toHaveText("أذكار النوم");
  await expect(page.locator(".dua-arabic").first()).toHaveCSS("direction", "rtl");
  const translation = page.locator(".dua-translation").first();
  await expect(translation).toHaveAttribute("dir", "ltr");
  await expect(translation).toHaveAttribute("lang", "en");

  await page.goto("/duas/hisn");
  const row = page.locator(".hisn-row").first();
  await expect(row.locator(".hisn-row__title--arabic")).toHaveText("أذكار الصباح والمساء", { timeout: 30_000 });
  await expect(row.locator(".hisn-row__ar")).toHaveCount(0);
});

test("a chapter shows its sources: the verse opens in the reader, the hadith opens on sunnah.com", async ({ page }) => {
  await open(page, "/duas/hisn/27");
  const kursi = page.locator(".dua-card-v5").first();
  await expect(kursi).toBeVisible({ timeout: 30_000 });
  const sources = kursi.locator("details.dua-sources");
  await expect(sources).not.toHaveAttribute("open");
  await expect(kursi.locator("button.dua-source-link")).toBeHidden();
  const toggle = sources.locator("summary");
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(sources).toHaveAttribute("open", "");
  await expect(kursi.locator("button.dua-source-link")).toBeVisible();
  await page.keyboard.press("Space");
  await expect(sources).not.toHaveAttribute("open");
  await toggle.click();
  await expect(sources).toContainText("La Vache 2:255");
  await expect(page.locator(".dua-card-v5").nth(1).locator(".dua-repeat-pill")).toContainText("3 fois");

  // A supplication with a hadith reference carries a safe external link.
  const link = page.locator(".dua-source-link[href^='https://sunnah.com/']").first();
  await link.locator("xpath=ancestor::details").locator("summary").click();
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", /noopener/);
  await expect(link).toHaveAttribute("aria-label", /sunnah\.com/);
  expect((await link.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(43);

  await kursi.locator("button.dua-source-link").first().click();
  await expect(page).toHaveURL(/\/surah\/2\/255/);
});

test("sources disclose independently in French, English and Arabic", async ({ page }) => {
  for (const [lang, width, theme] of [["fr", 390, "light"], ["en", 1440, "light"], ["ar", 390, "dark"], ["ar", 1440, "dark"]]) {
    await page.setViewportSize({ width, height: 900 });
    await open(page, "/duas/hisn/27", lang, theme);
    const panels = page.locator("details.dua-sources");
    await expect(panels.first()).toBeVisible({ timeout: 30_000 });
    await expect(panels.first().locator(".dua-sources__content")).toBeHidden();
    await panels.first().locator("summary").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `.codex-artifacts/dua-sources/closed-${lang}-${width}.png` });
    await panels.first().locator("summary").click();
    await expect(panels.first().locator(".dua-sources__content")).toBeVisible();
    await expect(panels.nth(1).locator(".dua-sources__content")).toBeHidden();
    await page.screenshot({ path: `.codex-artifacts/dua-sources/open-${lang}-${width}.png` });
    await panels.first().locator("summary").click();
    await expect(panels.first().locator(".dua-sources__content")).toBeHidden();
  }
});

test("search: a French word finds chapters and invocations, nonsense finds nothing", async ({ page }) => {
  await open(page, "/duas");
  const search = page.getByRole("textbox", { name: "Rechercher dans les invocations" });
  await expect(search).toBeVisible({ timeout: 30_000 });
  await search.fill("mosquée");
  await expect(page.locator(".hisn-row").first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Chapitres" })).toBeVisible();
  await expect(page.locator(".dua-card-v5").first()).toBeVisible();

  await search.fill("wxcvbn");
  await expect(page.locator(".duas-empty")).toBeVisible();
  await page.getByRole("button", { name: "Réinitialiser la recherche" }).click();
  await expect(search).toHaveValue("");
  await expect(page.locator(".duas-quick")).toBeVisible();
});

test("an unknown chapter says so and leads back to the list", async ({ page }) => {
  await open(page, "/duas/hisn/999");
  await expect(page.getByText("Ce chapitre n’existe pas.")).toBeVisible({ timeout: 30_000 });
  await page.getByRole("link", { name: "Chapitres" }).last().click();
  await expect(page).toHaveURL(/\/duas\/hisn$/);
});

test("unreachable library: Arabic text is not claimed, a retry is offered and works", async ({ page }) => {
  let blocked = true;
  await page.route("**/data/hisn/hisn.json", (route) => (blocked ? route.abort() : route.continue()));
  await open(page, "/duas/hisn");
  await expect(page.getByRole("alert")).toContainText("Impossible de charger la Citadelle du musulman.", { timeout: 30_000 });
  blocked = false;
  await page.getByRole("button", { name: "Réessayer" }).click();
  await expect(page.locator(".hisn-row").first()).toBeVisible({ timeout: 30_000 });
});

test("missing translation: the Arabic stays readable and the page says the translation is unavailable", async ({ page }) => {
  await page.route("**/data/hisn/fr.json", (route) => route.abort());
  await open(page, "/duas/hisn/28");
  await expect(page.locator(".dua-arabic").first()).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".dua-notice").first()).toContainText("Traduction indisponible");
});

for (const [width, height] of [[320, 568], [390, 844], [1280, 900]]) {
  test(`no horizontal overflow at ${width}px on the hub, the list and a chapter`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    for (const path of ["/duas", "/duas/hisn", "/duas/hisn/27", "/duas/coran", "/duas/rabbana", "/duas/khatm"]) {
      await open(page, path);
      await expect(page.locator(".duas-title")).toBeVisible({ timeout: 30_000 });
      await expect(page.locator(".dua-card-v5, .hisn-row, .duas-quick").first()).toBeVisible({ timeout: 30_000 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${path} at ${width}px`).toBeLessThanOrEqual(2);
    }
  });
}

test("touch targets: quick links, tiles, rows and source links are at least 44px tall", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [path, selector] of [
    ["/duas", ".duas-quick a"],
    ["/duas", ".duas-tile"],
    ["/duas/hisn", ".hisn-row"],
    ["/duas/hisn/27", ".dua-sources__title"],
    ["/duas/hisn/27", ".dua-source-link"],
  ]) {
    await open(page, path);
    const target = page.locator(selector).first();
    if (selector === ".dua-source-link") await page.locator(".dua-sources__title").first().click();
    await expect(target).toBeVisible({ timeout: 30_000 });
    const box = await target.boundingBox();
    expect(box?.height ?? 0, `${selector} on ${path}`).toBeGreaterThanOrEqual(43.5);
  }
});

test("dark theme keeps the cards and rows readable", async ({ page }) => {
  await open(page, "/duas/hisn", "fr", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark", { timeout: 30_000 });
  const row = page.locator(".hisn-row").first();
  await expect(row).toBeVisible();
  const colours = await row.evaluate((node) => {
    const style = getComputedStyle(node);
    return { background: style.backgroundColor, text: getComputedStyle(node.querySelector(".hisn-row__title")).color };
  });
  const luminance = (rgb) => {
    const [r, g, b] = rgb.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  };
  expect(luminance(colours.background)).toBeLessThan(0.25);
  expect(luminance(colours.text)).toBeGreaterThan(0.6);
});
