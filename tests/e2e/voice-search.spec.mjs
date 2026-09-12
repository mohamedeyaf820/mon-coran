import { expect, test } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";

test.beforeEach(async ({ page }) => {
  await installQuranNetworkFixtures(page);
  await page.addInitScript(() => localStorage.setItem('mushaf-plus-settings', JSON.stringify({ skipSplashAnimation: true, lang: 'fr' })));
});

test('dictation retries after a microphone error without an end event', async ({ page }) => {
  await page.addInitScript(() => {
    window.__recognitions = [];
    window.SpeechRecognition = class {
      constructor() { window.__recognitions.push(this); }
      start() { this.onstart?.(); }
      stop() { this.onend?.(); }
      abort() {}
    };
  });
  await page.goto('/surah/1');
  await openSearch(page);
  const dialog = page.getByRole('dialog', { name: /Recherche/ });
  const start = dialog.getByRole('button', { name: /Rechercher avec votre voix/ });
  await start.click();
  await page.evaluate(() => {
    const old = window.__recognitions[0];
    window.__lateResult = old.onresult;
    old.onerror({ error: 'audio-capture' });
  });
  await expect(dialog.getByRole('alert')).toContainText(/microphone/);
  await expect(dialog.locator('.search-pro__voice-status')).toBeHidden();
  await start.click();
  await page.evaluate(() => {
    window.__lateResult({ results: [[{ transcript: 'ancienne session' }]] });
    const current = window.__recognitions[1];
    current.onresult({ results: [[{ transcript: 'الرحمن' }]] });
    current.onend();
  });
  await expect(dialog.getByRole('textbox').first()).toHaveValue('الرحمن');
  await expect(dialog.getByRole('alert')).toHaveCount(0);
});

async function openSearch(page) {
  const viewportWidth = page.viewportSize()?.width || 1280;
  const searchButton = page
    .getByRole("button", { name: /Rechercher|Search|بحث/i })
    .first();
  if (viewportWidth > 620) {
    await expect(searchButton).toBeVisible({ timeout: 15_000 });
    await searchButton.click();
    return;
  }

  const moreButton = page.locator(".mp-header__more");
  await expect(moreButton).toBeVisible({ timeout: 15_000 });
  await moreButton.click();
  const menuSearch = page.locator('.mp-header-menu__item[data-key="search"]');
  await expect(menuSearch).toBeVisible();
  await menuSearch.click();
}

test("voice search transcribes speech into the Quran search field", async ({
  page,
}) => {
  await page.addInitScript(() => {
    class MockSpeechRecognition {
      continuous = false;
      interimResults = false;
      maxAlternatives = 1;

      start() {
        this.onstart?.();
        window.setTimeout(() => {
          this.onresult?.({
            results: [[{ transcript: "الرحمن" }]],
          });
          this.onend?.();
        }, 20);
      }

      stop() {
        this.onend?.();
      }

      abort() {}
    }

    window.SpeechRecognition = MockSpeechRecognition;
  });

  await page.goto("/surah/1");
  await openSearch(page);

  const dialog = page.getByRole("dialog", { name: /Recherche|Search|بحث/i });
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("button", { name: /Rechercher avec votre voix|Search with your voice|البحث باستخدام صوتك/i })
    .click();

  await expect(dialog.getByRole("textbox").first()).toHaveValue("الرحمن");
  await expect(dialog.locator(".search-pro__voice-status")).toBeHidden();
});

test("voice search remains compact and explains unsupported mobile browsers", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;
  });
  await page.goto("/surah/1");

  await openSearch(page);

  const dialog = page.getByRole("dialog", { name: /Recherche|Search|بحث/i });
  await expect(dialog.locator(".search-pro__modes")).toHaveCount(0);
  await expect(dialog.locator(".search-pro__summary")).toHaveCount(0);
  const voiceButton = dialog.getByRole("button", {
    name: /Rechercher avec votre voix|Search with your voice|البحث باستخدام صوتك/i,
  });
  const box = await voiceButton.boundingBox();
  expect(box?.width).toBeLessThanOrEqual(44);
  expect(box?.height).toBeLessThanOrEqual(44);
  const iconBox = await voiceButton.locator("svg").boundingBox();
  expect(iconBox?.width).toBeLessThanOrEqual(18);
  await expect(voiceButton.locator(".search-pro__voice-label")).toBeHidden();

  const dialogBox = await dialog.boundingBox();
  expect(dialogBox?.width || 0).toBeLessThanOrEqual(390);
  expect(dialogBox?.height || 0).toBeLessThanOrEqual(844);
  expect(
    await dialog.evaluate(
      (node) => node.scrollWidth - node.clientWidth,
    ),
  ).toBeLessThanOrEqual(2);

  await voiceButton.click();
  await expect(dialog.locator(".search-pro__voice-error")).toContainText(
    /pas prise en charge|not supported|غير مدعوم/i,
  );
});
