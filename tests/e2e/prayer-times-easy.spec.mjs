import { expect, test } from "@playwright/test";

const SETTINGS_KEY = "mushaf-plus-settings";

const requested = [];

// Aladhan answers in "HH:MM"; build a day around the current time so the
// "next prayer" is deterministic: Asr is the next one, Fajr and Dhuhr are past.
function aladhanPayload() {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const at = (delta) => {
    const total = Math.min(1439, Math.max(0, nowMinutes + delta));
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  };
  return {
    code: 200,
    data: {
      timings: { Fajr: at(-180), Sunrise: at(-150), Dhuhr: at(-60), Asr: at(45), Maghrib: at(150), Isha: at(210) },
      date: { hijri: { date: "27-04-1448" } },
      meta: { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, method: { name: "UOIF" } },
    },
  };
}

async function open(page, { lang = "fr", location = null } = {}) {
  await page.route("**/api.aladhan.com/**", (route) => {
    requested.push(new URL(route.request().url()));
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(aladhanPayload()) });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(
    ({ key, settings }) => {
      window.localStorage.setItem(key, JSON.stringify(settings));
      window.localStorage.setItem("mushaf-splash-seen", String(Date.now()));
    },
    {
      key: SETTINGS_KEY,
      settings: {
        skipSplashAnimation: true,
        lang,
        theme: "light",
        riwaya: "hafs",
        showHome: false,
        prayerTimesEnabled: Boolean(location),
        prayerMethod: 12,
        ...(location ? { prayerLocation: location } : {}),
      },
    },
  );
  await page.goto("/prieres");
  await expect(page.locator(".prayers-page")).toBeVisible({ timeout: 30_000 });
}

test("a first visit asks where the reader is, then shows today's times with the next prayer", async ({ page }) => {
  await open(page);

  await expect(page.getByRole("heading", { name: "Où êtes-vous ?" })).toBeVisible();
  // No tabs, no empty schedule: one question, two ways to answer it.
  await expect(page.locator(".prayers-view-switch")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Utiliser ma position" })).toBeVisible();

  // Popular cities first; the search ignores accents and works across languages.
  await expect(page.locator(".prayers-picker__city")).toHaveCount(8);
  await page.getByRole("searchbox", { name: "Rechercher une ville" }).fill("geneve");
  await expect(page.locator(".prayers-picker__city")).toHaveText(["Genève"]);
  await page.getByRole("searchbox", { name: "Rechercher une ville" }).fill("zzz");
  await expect(page.locator(".prayers-picker__none")).toBeVisible();
  await page.getByRole("searchbox", { name: "Rechercher une ville" }).fill("");
  await page.getByRole("button", { name: "Paris" }).click();

  await expect(page.locator(".prayers-place__name")).toHaveText("Paris");
  await expect(page.locator(".prayers-next")).toContainText("Asr");
  await expect(page.locator(".prayers-day-row")).toHaveCount(5);
  await expect(page.locator(".prayers-day-row.is-next")).toHaveCount(1);
  await expect(page.locator(".prayers-day-row.is-next")).toHaveAttribute("aria-current", "time");
  await expect(page.locator(".prayers-day-row.is-past")).toHaveCount(2);
  // Sunrise is shown as a landmark, not as a sixth prayer.
  await expect(page.locator(".prayers-day-sun")).toContainText("Chourouq");
  await expect(page.locator(".prayers-day-sun")).toContainText("pas une prière");

  // Changing place stays on the page.
  const change = page.locator(".prayers-place > .prayers-place__change");
  await change.click();
  await expect(change).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("button", { name: "Lyon" }).click();
  await expect(page.locator(".prayers-place__name")).toHaveText("Lyon");
  await expect(page.locator("#prayers-place-panel")).toHaveCount(0);

  // "How it works" names the method in plain words and links to the settings.
  await page.locator(".prayers-how > summary").click();
  await expect(page.locator(".prayers-how")).toContainText("UOIF");
  await page.locator(".prayers-how__settings").click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("the device position is one tap, and a refusal says what to do next", async ({ page, context }) => {
  await open(page);
  await page.getByRole("button", { name: "Utiliser ma position" }).click();
  await expect(page.locator(".prayers-picker__error")).toBeVisible();
  await expect(page.locator(".prayers-picker__city").first()).toBeVisible();

  // Once the browser allows the position the page uses it by itself: no second tap.
  await context.setGeolocation({ latitude: 48.8566, longitude: 2.3522 });
  await context.grantPermissions(["geolocation"]);
  await expect(page.locator(".prayers-place__name")).toHaveText("Près de Paris");
  await expect(page.locator(".prayers-method__name")).toHaveText("UOIF (France)");
  await expect(page.locator(".prayers-next")).toContainText("Asr");
});

test("the schedule reads right to left in Arabic with Arabic names", async ({ page }) => {
  await open(page, { lang: "ar", location: { latitude: 48.85, longitude: 2.35, label: "باريس" } });
  await expect(page.locator(".prayers-page")).toHaveAttribute("dir", "rtl");
  await expect(page.locator(".prayers-next")).toContainText("العصر");
  await expect(page.locator(".prayers-day-row.is-next")).toHaveCount(1);
});

test("the Arabic name beside a prayer does not need the Arabic locale", async ({ page }) => {
  await open(page, { location: { latitude: 48.85, longitude: 2.35, label: "Paris" } });
  await expect(page.locator(".prayers-day-row").first().locator("[lang='ar']")).toHaveText("الفجر");
});

test("the method follows the reader's region and a manual choice is kept", async ({ page }) => {
  requested.length = 0;
  await open(page);
  await page.getByRole("button", { name: "Paris" }).click();
  await expect(page.locator(".prayers-method__name")).toHaveText("UOIF (France)");
  await expect(page.locator(".prayers-method__why")).toContainText("Choisie pour votre région");
  await expect.poll(() => requested.at(-1)?.searchParams.get("method")).toBe("12");

  // Another region proposes its own authority, with no setting to open.
  await page.locator(".prayers-place > .prayers-place__change").click();
  await page.getByRole("searchbox", { name: "Rechercher une ville" }).fill("casablanca");
  await page.getByRole("button", { name: "Casablanca" }).click();
  await expect(page.locator(".prayers-method__name")).toHaveText("Maroc");
  await expect.poll(() => requested.at(-1)?.searchParams.get("method")).toBe("21");

  await page.locator(".prayers-place > .prayers-place__change").click();
  await page.getByRole("searchbox", { name: "Rechercher une ville" }).fill("mecque");
  await page.getByRole("button", { name: "La Mecque" }).click();
  await expect(page.locator(".prayers-method__name")).toHaveText("Umm al-Qura (La Mecque)");
  await expect.poll(() => requested.at(-1)?.searchParams.get("method")).toBe("4");

  // The reader follows their own mosque: the choice survives a change of place.
  await page.locator(".prayers-method__change").click();
  await expect(page.getByRole("radio")).toHaveCount(18);
  await expect(page.getByRole("radio").first()).toBeChecked();
  await page.locator(".prayers-method__option", { hasText: "Ligue islamique mondiale" }).click();
  await expect(page.locator(".prayers-method__name")).toHaveText("Ligue islamique mondiale");
  await expect(page.locator(".prayers-method__why")).toContainText("Choisie par vous");
  await page.locator(".prayers-place > .prayers-place__change").click();
  await page.getByRole("searchbox", { name: "Rechercher une ville" }).fill("lyon");
  await page.getByRole("button", { name: "Lyon" }).click();
  await expect(page.locator(".prayers-method__name")).toHaveText("Ligue islamique mondiale");
  await expect(page.locator(".prayers-method__why")).toContainText("UOIF (France)");

  // Picking the regional method again hands the choice back to the app.
  await page.locator(".prayers-method__option", { hasText: "UOIF" }).click();
  await page.locator(".prayers-place > .prayers-place__change").click();
  await page.getByRole("searchbox", { name: "Rechercher une ville" }).fill("tunis");
  await page.getByRole("button", { name: "Tunis" }).click();
  await expect(page.locator(".prayers-method__name")).toHaveText("Tunisie");
});
