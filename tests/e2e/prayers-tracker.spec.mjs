import { expect, test } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";

// Playwright serializes the init script plus its single argument: nothing from
// the Node scope (no closures) reaches the page. The same-day plaintext
// timings cache lets the tracker render offline, as the modal spec does.
function seed(state) {
  // addInitScript runs on EVERY navigation, reload included: seeding again
  // would erase what the test just persisted, so only the first load writes.
  if (window.sessionStorage.getItem("mushafplus-e2e-seeded") === "1") return;
  window.sessionStorage.setItem("mushafplus-e2e-seeded", "1");
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const at = (delta) => {
    const total = (((nowMinutes + delta) % 1440) + 1440) % 1440;
    const hours = Math.floor(total / 60);
    const minutes = total % 60;
    return {
      hhmm: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
      minutes: total,
    };
  };
  window.localStorage.setItem(
    "mushaf-plus-prayer-timings",
    JSON.stringify({
      timings: {
        Fajr: at(-180),
        Sunrise: at(-150),
        Dhuhr: at(-60),
        Asr: at(45),
        Maghrib: at(150),
        Isha: at(210),
      },
      hijri: "12 Rabi' al-Awwal 1448",
      timezone: "Europe/Paris",
      methodName: "UOIF",
      latitude: 48.85,
      longitude: 2.35,
      method: 12,
      fetchedAt: Date.now(),
      dayKey: `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`,
    }),
  );
  window.localStorage.setItem(
    "mushaf-plus-settings",
    JSON.stringify({
      skipSplashAnimation: true,
      showHome: true,
      lang: "fr",
      theme: "dark",
      riwaya: "hafs",
      prayerTimesEnabled: true,
      prayerMethod: 12,
      prayerLocation: { latitude: 48.85, longitude: 2.35, label: "Paris" },
      ...state,
    }),
  );
}

test("prayer tracker records a mark, keeps it after reload, and summarizes the month", async ({
  page,
}) => {
  await installQuranNetworkFixtures(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(seed, { prayerTrackingEnabled: true });

  await page.goto("/prires");
  const rows = page.locator(".prayers-day-row");
  await expect(rows).toHaveCount(5);

  // Timings come from the same-day cache: the first row shows a real HH:MM.
  await expect(rows.first().locator(".prayers-day-time")).not.toHaveText("—");

  const asr = page.locator(".prayers-day-row").filter({ hasText: "Asr" });
  await asr.locator(".prayers-mark-btn").click();
  await expect(asr.locator(".prayers-mark-btn")).toHaveAttribute("aria-pressed", "true");

  // The mark is the reader's answer and must survive a reload (private, local).
  await page.reload();
  await expect(
    page.locator(".prayers-day-row").filter({ hasText: "Asr" }).locator(".prayers-mark-btn"),
  ).toHaveAttribute("aria-pressed", "true", { timeout: 20_000 });

  // Week view: exactly one prayed cell — today's Asr.
  await page.getByRole("tab", { name: "Semaine" }).click();
  await expect(page.locator(".prayers-grid-cell.is-prayed")).toHaveCount(1);

  // Month view: the count reads as a note, not a score.
  await page.getByRole("tab", { name: "Mois" }).click();
  await expect(page.locator(".prayers-month-cell").first()).toBeVisible();
  await expect(page.locator(".prayers-month-total")).toContainText("1 prière notée");

  // Undo from the day view clears the mark again.
  await page.getByRole("tab", { name: "Aujourd’hui" }).click();
  await page
    .locator(".prayers-day-row")
    .filter({ hasText: "Asr" })
    .locator(".prayers-mark-btn")
    .click();
  await expect(page.locator(".prayers-mark-btn.is-on")).toHaveCount(0);
});

test("prayer tracker stays honest about its on-device scope", async ({ page }) => {
  await installQuranNetworkFixtures(page);
  await page.addInitScript(seed, {});

  await page.goto("/prires");
  // Tracking is opt-in: the page explains it before it stores anything.
  await expect(page.locator(".prayers-empty")).toBeVisible();
  await page.getByRole("button", { name: /Activer le suivi/ }).click();
  await expect(page.locator(".prayers-day-row")).toHaveCount(5);
  // The copy has to name the real boundary: a key the browser holds on the
  // device, not user-controlled encryption. The earlier wording ("chiffrées sur
  // cet appareil") over-claimed, so this asserts the honest phrase rather than
  // any string that merely mentions encryption.
  await expect(page.locator(".prayers-private-note").first()).toContainText(
    "clé locale de ce navigateur",
  );
});

test("prayer settings tab configures location, adhan and manual adjustment", async ({ page }) => {
  await installQuranNetworkFixtures(page);
  await page.addInitScript(seed, { prayerTrackingEnabled: true });

  await page.goto("/");
  await page.getByRole("button", { name: /Plus d.options/ }).click();
  await page.getByRole("button", { name: "Paramètres" }).click();

  const dialog = page.getByRole("dialog", { name: /Paramètres/ });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("tab", { name: "Prière" }).click();

  const panel = page.getByRole("tabpanel", { name: "Prière" });
  await expect(panel.locator("#settings-prayer-enabled")).toBeChecked();
  await expect(panel.locator("#settings-prayer-city")).toContainText("Paris");

  // Manual adjustment shifts Fajr by -10 minutes and persists across a reload.
  await panel.locator("#prayer-offset-Fajr").selectOption("-10");
  await expect(panel.locator("#prayer-offset-Fajr")).toHaveValue("-10");

  // Adhan controls exist even before the sources land.
  await expect(panel.locator("#settings-prayer-adhan")).toBeChecked();
  await expect(panel.locator("#settings-prayer-volume")).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: /Plus d.options/ }).click();
  await page.getByRole("button", { name: "Paramètres" }).click();
  const reopened = page.getByRole("dialog", { name: /Paramètres/ });
  await reopened.getByRole("tab", { name: "Prière" }).click();
  await expect(
    page.getByRole("tabpanel", { name: "Prière" }).locator("#prayer-offset-Fajr"),
  ).toHaveValue("-10", { timeout: 20_000 });
});
