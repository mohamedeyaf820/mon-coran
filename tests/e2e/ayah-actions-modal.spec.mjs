import { expect, test } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";

const SETTINGS_KEY = "mushaf-plus-settings";

test("verse actions open as a compact, usable mobile sheet", async ({ page }) => {
  await installQuranNetworkFixtures(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript((settingsKey) => {
    window.localStorage.setItem(
      settingsKey,
      JSON.stringify({
        lang: "fr",
        theme: "dark",
        riwaya: "hafs",
        reciter: "ar.alafasy",
        showHome: false,
        displayMode: "surah",
        mushafLayout: "mushaf",
      }),
    );
  }, SETTINGS_KEY);

  await page.goto("/surah/8");
  const firstMarker = page.locator(".cpv-verse .native-ayah-marker").first();
  await expect(firstMarker).toBeVisible({ timeout: 20_000 });
  await firstMarker.click();

  const dialog = page.locator(".ayah-actions-modal[role='dialog']");
  const panel = dialog.locator(".ayah-actions-modal__panel");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".ayah-action-card")).toHaveCount(3);
  await expect(dialog.locator(".ayah-actions__grid")).toHaveCSS(
    "grid-template-columns",
    /^\d+(?:\.\d+)?px \d+(?:\.\d+)?px$/,
  );
  await expect(dialog.getByRole("button", { name: /couter$/ })).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Favori/ })).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Plus d.actions/ })).toBeVisible();
  // The sheet has settled: identity transform, or none once the entrance
  // animation has been discarded.
  await expect(panel).toHaveCSS("transform", /^(?:none|matrix\(1, 0, 0, 1, 0, 0\))$/);

  const panelBox = await panel.boundingBox();
  expect(panelBox?.y).toBeGreaterThanOrEqual(0);
  expect((panelBox?.y || 0) + (panelBox?.height || 0)).toBeLessThanOrEqual(844);

  const badges = dialog.locator(".ayah-actions__badge");
  await expect(badges.first()).toHaveCSS("display", "flex");
  await expect(badges.first()).toHaveCSS("white-space", "nowrap");
  const firstBadgeBox = await badges.nth(0).boundingBox();
  expect(firstBadgeBox?.height || 0).toBeGreaterThan(20);

  await dialog.getByRole("button", { name: "Favori" }).click();
  await expect(dialog.getByRole("button", { name: "Favori" })).toHaveAttribute("aria-pressed", "true");

  await page.screenshot({
    path: "test-results/ayah-actions-modal-mobile.png",
    fullPage: false,
  });
});

test("verse sharing creates and shares a real PNG card", async ({ page }) => {
  await installQuranNetworkFixtures(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript((settingsKey) => {
    window.localStorage.setItem(
      settingsKey,
      JSON.stringify({
        lang: "fr",
        theme: "dark",
        riwaya: "hafs",
        reciter: "ar.alafasy",
        showHome: false,
        displayMode: "surah",
        mushafLayout: "mushaf",
      }),
    );
    window.__sharedImage = null;
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (payload) => {
        const file = payload.files?.[0];
        const bytes = file ? new Uint8Array(await file.arrayBuffer()) : [];
        window.__sharedImage = {
          type: file?.type,
          name: file?.name,
          size: file?.size,
          signature: Array.from(bytes.slice(0, 4)),
          includesText: Boolean(payload.text),
        };
      },
    });
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: (payload) => payload.files?.[0]?.type === "image/png",
    });
  }, SETTINGS_KEY);

  await page.goto("/surah/8");
  const firstMarker = page.locator(".cpv-verse .native-ayah-marker").first();
  await expect(firstMarker).toBeVisible({ timeout: 20_000 });
  await firstMarker.click();

  const actionsDialog = page.locator(".ayah-actions-modal[role='dialog']");
  await actionsDialog.getByRole("button", { name: /Plus d.actions/ }).click();
  await page.getByRole("menuitem", { name: "Partager en image" }).click();

  const studio = page.getByRole("dialog", { name: "Partager le verset en image" });
  await expect(studio).toBeVisible();
  await expect(studio.locator(".share-studio__preview-frame img")).toBeVisible();
  await expect(studio.locator(".share-format-picker button")).toHaveCount(3);
  await expect(studio.locator(".share-theme-picker .share-tile")).toHaveCount(18);
  // Light and dark palettes are told apart, each in its own labelled group.
  await expect(studio.locator(".share-theme-group__title")).toHaveText(["Clairs", "Sombres"]);

  // Personalisation: frame, pattern and Arabic-text scale are independent of
  // the palette, each behind its own tab; the card facts stay visible under
  // the preview.
  const tabs = studio.getByRole("tab");
  await expect(tabs).toHaveCount(4);
  await studio.getByRole("tab", { name: "Cadre" }).click();
  await expect(studio.locator(".share-choice-picker .share-tile")).toHaveCount(10);
  await studio.getByRole("tab", { name: "Motif" }).click();
  await expect(studio.locator(".share-choice-picker .share-tile")).toHaveCount(9);
  await studio.getByRole("tab", { name: "Texte" }).click();
  await expect(studio.locator(".share-scale-picker button")).toHaveCount(3);
  await expect(studio.locator(".share-studio__quick-setting")).toBeVisible();
  await expect(studio.locator(".share-studio__quick-setting .share-toggle")).toHaveCount(3);
  await expect(studio.locator("textarea, .share-editor")).toHaveCount(0);
  await expect(studio.locator(".share-studio__meta > span")).toHaveCount(2);
  await expect(studio.locator(".share-studio__meta > span").nth(1)).toHaveText(/kB|PNG/);
  await page.screenshot({
    path: "test-results/verse-share-studio-mobile.png",
    fullPage: false,
  });

  await page.setViewportSize({ width: 768, height: 900 });
  await expect(studio.locator(".share-studio__workspace")).toHaveCSS(
    "grid-template-columns",
    /^\d+(?:\.\d+)?px$/,
  );
  await page.screenshot({
    path: "test-results/verse-share-studio-tablet.png",
    fullPage: false,
  });

  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(studio.locator(".share-studio__workspace")).toHaveCSS(
    "grid-template-columns",
    /^\d+(?:\.\d+)?px \d+(?:\.\d+)?px$/,
  );
  const studioBox = await studio.boundingBox();
  expect(studioBox?.width || 0).toBeLessThanOrEqual(1180);
  await page.screenshot({
    path: "test-results/verse-share-studio-desktop.png",
    fullPage: false,
  });

  await studio.getByRole("button", { name: "Partager l’image" }).click();
  // Encoding a 1080 x 1080 PNG can take several seconds on a loaded machine.
  await expect
    .poll(() => page.evaluate(() => window.__sharedImage), { timeout: 30_000 })
    .not.toBeNull();
  const shared = await page.evaluate(() => window.__sharedImage);
  expect(shared.type).toBe("image/png");
  expect(shared.name).toMatch(/^mushafplus-8-1-square\.png$/);
  expect(shared.size).toBeGreaterThan(10_000);
  expect(shared.signature).toEqual([137, 80, 78, 71]);
  expect(shared.includesText).toBe(false);
});

/*
 * Browsers only let a page open the share sheet inside the tap that asked for
 * it (about a second on Safari). The stub below enforces that window; the PNG
 * encode is slowed to what a phone needs, so only a card prepared ahead of the
 * tap, or a second tap on the finished file, can pass.
 */
async function openShareStudioWithStrictGesture(page, { encodeDelayMs }) {
  await installQuranNetworkFixtures(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(({ settingsKey, delay }) => {
    window.localStorage.setItem(
      settingsKey,
      JSON.stringify({ lang: "fr", theme: "dark", riwaya: "hafs", reciter: "ar.alafasy", showHome: false, displayMode: "surah", mushafLayout: "mushaf" }),
    );
    window.__sharedImage = null;
    window.__shareAttempts = [];
    window.__lastClickAt = 0;
    document.addEventListener("click", () => { window.__lastClickAt = performance.now(); }, true);
    const toBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function slowToBlob(callback, ...rest) {
      window.setTimeout(() => toBlob.call(this, callback, ...rest), delay);
    };
    Object.defineProperty(navigator, "canShare", { configurable: true, value: (payload) => payload.files?.[0]?.type === "image/png" });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (payload) => {
        const elapsed = performance.now() - window.__lastClickAt;
        window.__shareAttempts.push(Math.round(elapsed));
        if (elapsed > 800) {
          const error = new Error("Must be handling a user gesture to perform a share request.");
          error.name = "NotAllowedError";
          throw error;
        }
        const file = payload.files?.[0];
        window.__sharedImage = { type: file?.type, size: file?.size };
      },
    });
  }, { settingsKey: SETTINGS_KEY, delay: encodeDelayMs });

  await page.goto("/surah/8");
  const firstMarker = page.locator(".cpv-verse .native-ayah-marker").first();
  await expect(firstMarker).toBeVisible({ timeout: 20_000 });
  await firstMarker.click();
  await page.locator(".ayah-actions-modal[role='dialog']").getByRole("button", { name: /Plus d.actions/ }).click();
  await page.getByRole("menuitem", { name: "Partager en image" }).click();
  const studio = page.getByRole("dialog", { name: "Partager le verset en image" });
  await expect(studio.locator(".share-studio__preview-frame img")).toBeVisible();
  return studio;
}

test("sharing the card right away asks for one more tap instead of failing", async ({ page }) => {
  const studio = await openShareStudioWithStrictGesture(page, { encodeDelayMs: 1500 });
  const shareButton = studio.getByRole("button", { name: "Partager l’image" });

  await shareButton.click();
  await expect(studio.locator(".share-studio__feedback")).toContainText("seconde fois", { timeout: 30_000 });
  expect(await page.evaluate(() => window.__sharedImage)).toBeNull();

  await shareButton.click();
  await expect.poll(() => page.evaluate(() => window.__sharedImage), { timeout: 10_000 }).not.toBeNull();
  const attempts = await page.evaluate(() => window.__shareAttempts);
  expect(attempts.at(-1)).toBeLessThan(800);
  expect((await page.evaluate(() => window.__sharedImage)).size).toBeGreaterThan(10_000);
});

test("a card prepared ahead is handed to the share sheet inside the tap", async ({ page }) => {
  const studio = await openShareStudioWithStrictGesture(page, { encodeDelayMs: 1500 });
  // The weight label turns into "≈ N kB" once the PNG has been prepared.
  await expect(studio.locator(".share-studio__meta > span").nth(1)).toHaveText(/kB/, { timeout: 30_000 });

  await studio.getByRole("button", { name: "Partager l’image" }).click();
  await expect.poll(() => page.evaluate(() => window.__sharedImage), { timeout: 10_000 }).not.toBeNull();
  const attempts = await page.evaluate(() => window.__shareAttempts);
  expect(attempts).toHaveLength(1);
  expect(attempts[0]).toBeLessThan(300);
});
