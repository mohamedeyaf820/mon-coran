import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";

async function open(page, path, { width = 390, height = 844, lang = "fr", extra = {} } = {}) {
  await page.setViewportSize({ width, height });
  await installQuranNetworkFixtures(page);
  await page.addInitScript(
    ({ lang, extra }) => {
      if (window.sessionStorage.getItem("landing-e2e-seeded") === "1") return;
      window.sessionStorage.setItem("landing-e2e-seeded", "1");
      localStorage.setItem(
        "mushaf-plus-settings",
        JSON.stringify({ skipSplashAnimation: true, lang, theme: "light", riwaya: "hafs", ...extra }),
      );
    },
    { lang, extra },
  );
  await page.goto(path);
}

// Headless Chromium has no H.264 decoder: record what the page asks the media
// elements to do instead of depending on codecs.
async function spyOnMedia(page) {
  await page.addInitScript(() => {
    window.__media = [];
    HTMLMediaElement.prototype.play = function play() {
      window.__media.push(["play", this.getAttribute("src")]);
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function pause() {
      window.__media.push(["pause", this.getAttribute("src")]);
    };
  });
}
const mediaCalls = (page, kind) =>
  page.evaluate((wanted) => window.__media.filter(([name]) => name === wanted).map(([, src]) => src), kind);

const horizontalOverflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

test("/ is the welcome page and /accueil is the app home", async ({ page }) => {
  await open(page, "/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Le Coran, tel que vous le lisez\./, {
    timeout: 30_000,
  });
  await expect(page.getByRole("button", { name: "Commencer la lecture" })).toBeVisible();
  // No store address exists yet: the page says so instead of linking nowhere.
  await expect(page.locator(".landing__soon")).toHaveText(/Bientôt sur Android et iOS/);
  await expect(page.locator(".landing a[href^='http']")).toHaveCount(0);

  await page.locator(".landing__actions").getByRole("button", { name: "Ouvrir MushafPlus" }).click();
  await expect(page).toHaveURL(/\/accueil$/);
  await expect(page.locator(".landing")).toHaveCount(0);
  await expect(page.locator(".app-root")).toHaveAttribute("data-view", "home");

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator(".landing")).toBeVisible();
});

test("the page is five folios in order, and says nothing it cannot back", async ({ page }) => {
  await open(page, "/");
  await expect(page.locator(".landing")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("[data-folio]")).toHaveCount(5);
  expect(await page.locator("[data-folio]").evaluateAll((nodes) => nodes.map((node) => node.dataset.folio))).toEqual([
    "1", "2", "3", "4", "5",
  ]);
  const text = await page.locator(".landing").innerText();
  expect(text).not.toMatch(/Android Auto|CarPlay|TestFlight/i);
  expect(text).toMatch(/54/);
  expect(text).toMatch(/267/);
  // The onboarding recording was not refilmed for the current version.
  await expect(page.locator(".landing [src*='onboarding']")).toHaveCount(0);
});

test("the app home answers at /accueil directly, in every language", async ({ page }) => {
  await open(page, "/accueil");
  await expect(page.locator(".app-root")).toHaveAttribute("data-view", "home", { timeout: 30_000 });
  await expect(page.locator(".landing")).toHaveCount(0);
});

test("the main action continues the saved reading", async ({ page }) => {
  await open(page, "/", { extra: { lastPosition: { surah: 18, ayah: 10 } } });
  const cta = page.locator(".landing__actions .landing__btn--primary");
  await expect(cta).toHaveText(/Continuer · .+ v\.10/, { timeout: 30_000 });
  await cta.click();
  await expect(page).toHaveURL(/\/surah\/18\/10$/);
});

test("the main action is visible without scrolling on a small phone", async ({ page }) => {
  await open(page, "/", { width: 375, height: 667 });
  const cta = page.locator(".landing__actions .landing__btn--primary");
  await expect(cta).toBeVisible({ timeout: 30_000 });
  const box = await cta.boundingBox();
  expect(box.y + box.height).toBeLessThanOrEqual(667);
});

test("invocations and listening open from the entries", async ({ page }) => {
  await open(page, "/");
  await page.getByRole("button", { name: "Ouvrir les invocations" }).click({ timeout: 30_000 });
  await expect(page).toHaveURL(/\/duas$/);
  await page.goBack();
  await page.getByRole("button", { name: "Écouter", exact: true }).click();
  await expect(page).toHaveURL(/\/accueil$/);
  await expect(page.locator(".app-root")).toHaveAttribute("data-home-section", "audio");
});

test("the demo phone follows the entry in view on a wide screen", async ({ page }) => {
  await open(page, "/", { width: 1280, height: 800 });
  const stage = page.locator(".landing-demo__stage");
  await expect(stage).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".landing-demo video")).toHaveCount(3);
  await expect(stage.locator("video.is-current")).toHaveAttribute("src", /mob-reader-scroll\.mp4$/);

  await page.locator(".landing-entry[data-entry='duas']").scrollIntoViewIfNeeded();
  await expect(stage.locator("video.is-current")).toHaveAttribute("src", /mob-duas-scroll\.mp4$/);

  await page.locator(".landing-entry[data-entry='listen']").scrollIntoViewIfNeeded();
  await expect(stage.locator("video.is-current")).toHaveAttribute("src", /mob-listen-player\.mp4$/);
  // The phone stays on screen while the third entry is read (sticky).
  const box = await stage.boundingBox();
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(800);
});

test("on a phone each entry carries its own recording, and only the one in view plays", async ({ page }) => {
  await spyOnMedia(page);
  await open(page, "/", { width: 390, height: 844 });
  await expect(page.locator(".landing-entry")).toHaveCount(3, { timeout: 30_000 });
  await expect(page.locator(".landing-demo video")).toHaveCount(3);
  for (const entry of ["read", "duas", "listen"]) {
    await expect(page.locator(`.landing-entry[data-entry='${entry}'] video`)).toHaveCount(1);
  }
  await page.locator(".landing-entry[data-entry='duas'] video").scrollIntoViewIfNeeded();
  await expect.poll(() => mediaCalls(page, "play")).toContain("/videos/landing/mob-duas-scroll.mp4");
  expect(await mediaCalls(page, "play")).not.toContain("/videos/landing/mob-listen-player.mp4");
});

test("recordings are not fetched until the demo is reached", async ({ page }) => {
  const requested = [];
  page.on("request", (request) => {
    if (/\.mp4(\?|$)/.test(request.url())) requested.push(request.url());
  });
  await open(page, "/", { width: 1280, height: 800 });
  await expect(page.locator(".landing")).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1200);
  expect(requested).toEqual([]);
});

test("a visible pause control stops the demo and brings the native controls back", async ({ page }) => {
  await spyOnMedia(page);
  await open(page, "/", { width: 1280, height: 800 });
  const stage = page.locator(".landing-demo__stage");
  await stage.scrollIntoViewIfNeeded({ timeout: 30_000 });
  await expect.poll(() => mediaCalls(page, "play")).toContain("/videos/landing/mob-reader-scroll.mp4");
  const pause = page.locator(".landing__pause");
  await expect(pause).toHaveAttribute("aria-pressed", "false");
  await expect(stage.locator("video.is-current")).not.toHaveAttribute("controls", "");
  await pause.click();
  await expect(pause).toHaveAttribute("aria-pressed", "true");
  await expect(stage.locator("video.is-current")).toHaveAttribute("controls", "");
  expect(await mediaCalls(page, "pause")).toContain("/videos/landing/mob-reader-scroll.mp4");
});

test("with reduced motion nothing plays, nothing moves and the controls are native", async ({ page }) => {
  await spyOnMedia(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, "/", { width: 1280, height: 800 });
  const stage = page.locator(".landing-demo__stage");
  await stage.scrollIntoViewIfNeeded({ timeout: 30_000 });
  await expect(stage.locator("video.is-current")).toHaveAttribute("controls", "");
  await page.locator(".landing-entry[data-entry='listen']").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  expect(await mediaCalls(page, "play")).toEqual([]);
  await expect(page.locator(".landing")).not.toHaveClass(/landing--motion/);
  await expect(page.locator(".landing__pause")).toHaveCount(0);
  // One background layer only, and not a single running animation or transition.
  await expect(page.locator(".landing__tint")).toHaveCount(1);
  expect(await page.evaluate(() => document.querySelector(".landing").getAnimations({ subtree: true }).length)).toBe(0);
});

test("the page takes the colour of the theme shown in the rail, and keeps still when motion is reduced", async ({ page }) => {
  await open(page, "/", { width: 390, height: 844 });
  const themes = page.locator(".landing-theme");
  await expect(themes).toHaveCount(5, { timeout: 30_000 });
  await expect(page.locator(".landing-theme .landing-theme__new")).toHaveCount(2);
  await themes.nth(2).scrollIntoViewIfNeeded();
  await themes.nth(2).click();
  await expect(page.locator(".landing")).toHaveAttribute("data-tint", "rose");
  await expect(themes.nth(2)).toHaveAttribute("aria-pressed", "true");
  await themes.nth(4).click();
  await expect(page.locator(".landing")).toHaveAttribute("data-tint", "ocean");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.locator(".landing-theme")).toHaveCount(5, { timeout: 30_000 });
  await page.locator(".landing-theme").nth(2).scrollIntoViewIfNeeded();
  await page.locator(".landing-theme").nth(2).click();
  await expect(page.locator(".landing")).toHaveAttribute("data-tint", "fajr");
});

const axeOnLanding = (page) =>
  new AxeBuilder({ page }).include(".landing").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
const summary = (results) => results.violations.map((violation) => `${violation.id}: ${violation.nodes[0]?.target.join(" ")}`);

for (const [theme, tint] of [["light", "fajr"], ["sepia", "parchemin"], ["dark", "medine"]]) {
  test(`the page stays readable in the ${theme} theme (axe, reduced motion, one layer)`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/", { width: 390, height: 844, extra: { theme } });
    await expect(page.locator(".landing")).toHaveAttribute("data-tint", tint, { timeout: 30_000 });
    await expect(page.locator(".landing__tint")).toHaveCount(1);
    expect(summary(await axeOnLanding(page))).toEqual([]);
  });
}

test("the page stays readable when the rail turns it Dawn Rose or Ocean Night (axe, motion on)", async ({ page }) => {
  await open(page, "/", { width: 390, height: 844 });
  const themes = page.locator(".landing-theme");
  await expect(themes).toHaveCount(5, { timeout: 30_000 });
  for (const [index, tint] of [[2, "rose"], [4, "ocean"]]) {
    await themes.nth(index).scrollIntoViewIfNeeded();
    await themes.nth(index).click();
    await expect(page.locator(".landing")).toHaveAttribute("data-tint", tint);
    await page.waitForTimeout(900);
    expect(summary(await axeOnLanding(page)), tint).toEqual([]);
  }
});

test("the language switches on the fly, direction included", async ({ page }) => {
  await open(page, "/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Le Coran, tel que vous le lisez/, { timeout: 30_000 });
  await page.getByRole("button", { name: "EN English" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/The Quran, the way you read it\./);
  await expect(page.locator(".landing")).toHaveAttribute("lang", "en");
  await expect(page.locator(".landing")).toHaveAttribute("dir", "ltr");
  await page.getByRole("button", { name: "ع العربية" }).click();
  await expect(page.locator(".landing")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/القرآن، كما تقرؤه أنت\./);
});

test("the welcome page is Arabic and right-to-left at /ar/, and fits every width", async ({ page }) => {
  for (const width of [320, 390, 768, 1280, 1440]) {
    await open(page, "/ar/", { width, lang: "ar" });
    await expect(page.locator(".landing")).toHaveAttribute("dir", "rtl", { timeout: 30_000 });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/القرآن، كما تقرؤه أنت/);
    expect(await horizontalOverflow(page), `${width}px`).toBeLessThanOrEqual(1);
    for (const button of await page.locator(".landing button:visible").all()) {
      expect((await button.boundingBox()).height, `touch target at ${width}px`).toBeGreaterThanOrEqual(44);
    }
  }
});

test("French fits every width without a sideways scroll", async ({ page }) => {
  for (const width of [320, 375, 768, 1024, 1440]) {
    await open(page, "/", { width, height: 800 });
    await expect(page.locator(".landing")).toBeVisible({ timeout: 30_000 });
    expect(await horizontalOverflow(page), `${width}px`).toBeLessThanOrEqual(1);
    for (const button of await page.locator(".landing button:visible, .landing a:visible").all()) {
      expect((await button.boundingBox()).height, `touch target at ${width}px`).toBeGreaterThanOrEqual(44);
    }
  }
});

test("one image loads eagerly, the others wait, and every image keeps its size", async ({ page }) => {
  await open(page, "/");
  await expect(page.locator(".landing")).toBeVisible({ timeout: 30_000 });
  const images = await page.locator(".landing img").evaluateAll((nodes) =>
    nodes.map((node) => ({
      src: node.getAttribute("src"),
      loading: node.getAttribute("loading"),
      priority: node.getAttribute("fetchpriority"),
      sized: Boolean(node.getAttribute("width") && node.getAttribute("height")),
    })),
  );
  const eager = images.filter((image) => image.loading !== "lazy" && !image.src.includes("logo"));
  expect(eager).toHaveLength(1);
  expect(eager[0].priority).toBe("high");
  expect(images.every((image) => image.sized)).toBe(true);
});

test("the app home reached from the welcome page keeps the bottom bar behaviour", async ({ page }) => {
  await open(page, "/", { height: 700 });
  await page.locator(".landing__actions").getByRole("button", { name: "Ouvrir MushafPlus" }).click({ timeout: 30_000 });
  await expect(page.locator(".mobile-navigation")).toBeVisible();
  const main = page.locator("#main-content");
  for (let attempt = 0; attempt < 6; attempt++) {
    for (const top of [0, 120, 320]) {
      await main.evaluate((node, value) => { node.scrollTop = value; }, top);
      await page.waitForTimeout(150);
    }
    if (await page.locator(".app-root.nav-away").count()) break;
  }
  await expect(page.locator(".app-root.nav-away")).toHaveCount(1);
});

test("the Home tab of the reader leads to /accueil, not back to the welcome page", async ({ page }) => {
  await open(page, "/");
  await page.getByRole("button", { name: "Commencer la lecture" }).click({ timeout: 30_000 });
  await expect(page).toHaveURL(/\/surah\/1$/);
  await page.locator(".mobile-navigation__item[data-destination='home']").click();
  await expect(page).toHaveURL(/\/accueil$/);
  await expect(page.locator(".app-view-home")).toBeVisible();
  await expect(page.locator(".landing")).toHaveCount(0);
});

for (const lang of ["fr", "ar"]) {
  test(`the mobile folio keeps its text and its phones apart from 768 to 1280 px (${lang})`, async ({ page }) => {
    for (const width of [768, 820, 1024, 1100, 1280]) {
      await open(page, lang === "ar" ? "/ar/" : "/", { width, height: 900, lang });
      await page.locator("[data-folio='4']").scrollIntoViewIfNeeded({ timeout: 30_000 });
      const m = await page.evaluate(() => {
        const root = document.querySelector(".landing");
        const box = (node) => {
          const b = node.getBoundingClientRect();
          return [b.left, b.top, b.right, b.bottom];
        };
        const phones = [...document.querySelectorAll(".landing-mobile .landing-phone")]
          .filter((node) => getComputedStyle(node).display !== "none")
          .map(box);
        return { scroll: root.scrollWidth, client: root.clientWidth, text: box(document.querySelector(".landing-mobile__text")), phones };
      });
      const at = `${lang} ${width}px`;
      // .landing is its own scroller: the window never shows a sideways scroll here.
      expect(m.scroll, `${at} scrollWidth`).toBeLessThanOrEqual(m.client + 1);
      for (const phone of m.phones) {
        expect(phone[0], `${at} phone left`).toBeGreaterThanOrEqual(0);
        expect(phone[2], `${at} phone right`).toBeLessThanOrEqual(m.client + 1);
        const sideBySide = Math.min(phone[3], m.text[3]) > Math.max(phone[1], m.text[1]);
        if (sideBySide) {
          const gap = Math.max(phone[0] - m.text[2], m.text[0] - phone[2]);
          expect(gap, `${at} gap between text and phone`).toBeGreaterThanOrEqual(16);
        }
      }
      if (m.phones.length === 2) {
        const gap = Math.max(m.phones[1][0] - m.phones[0][2], m.phones[0][0] - m.phones[1][2]);
        expect(gap, `${at} gap between phones`).toBeGreaterThanOrEqual(8);
      }
    }
  });
}

test("the theme rail starts at its edge on a tablet, with no empty space before the first theme", async ({ page }) => {
  await open(page, "/", { width: 768, height: 900 });
  const rail = page.locator(".landing-themes__rail");
  await expect(rail).toBeVisible({ timeout: 30_000 });
  const railBox = await rail.boundingBox();
  const firstBox = await page.locator(".landing-theme").first().boundingBox();
  expect(firstBox.x - railBox.x).toBeLessThanOrEqual(24);
});

test("the foot links are real links that keep the in-app navigation", async ({ page }) => {
  await open(page, "/");
  const links = page.locator(".landing__footer nav a");
  await expect(links).toHaveCount(3, { timeout: 30_000 });
  expect(await links.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")))).toEqual([
    "/about", "/privacy", "/sources",
  ]);
  await links.nth(1).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.locator(".landing")).toHaveCount(0);

  await open(page, "/ar/", { lang: "ar" });
  await expect(page.locator(".landing__footer nav a")).toHaveCount(3, { timeout: 30_000 });
  expect(
    await page.locator(".landing__footer nav a").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href"))),
  ).toEqual(["/ar/about", "/ar/privacy", "/ar/sources"]);
});

test("offline, the page says before any click that only opened content will load", async ({ page, context }) => {
  await open(page, "/");
  await expect(page.locator(".landing")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".landing__offline")).toHaveCount(0);
  await context.setOffline(true);
  await expect(page.locator(".landing__offline")).toBeVisible();
  await expect(page.locator(".landing__offline")).toHaveAttribute("role", "status");
  await context.setOffline(false);
  await expect(page.locator(".landing__offline")).toHaveCount(0);
});

test("the hero never promises more than the app keeps offline", async ({ page }) => {
  await open(page, "/");
  const lead = page.locator(".landing-hero .landing__lead");
  await expect(lead).toBeVisible({ timeout: 30_000 });
  await expect(lead).not.toHaveText(/même hors ligne/);
  await expect(lead).toHaveText(/hors ligne/);
});
