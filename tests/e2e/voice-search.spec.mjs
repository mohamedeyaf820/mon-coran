import { expect, test } from "@playwright/test";

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
  const searchButton = page
    .getByRole("button", { name: /Rechercher|Search|بحث/i })
    .first();
  await expect(searchButton).toBeVisible({ timeout: 15_000 });
  await searchButton.click();

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

  const searchButton = page
    .getByRole("button", { name: /Rechercher|Search|بحث/i })
    .first();
  await expect(searchButton).toBeVisible({ timeout: 15_000 });
  await searchButton.click();

  const dialog = page.getByRole("dialog", { name: /Recherche|Search|بحث/i });
  const voiceButton = dialog.getByRole("button", {
    name: /Rechercher avec votre voix|Search with your voice|البحث باستخدام صوتك/i,
  });
  const box = await voiceButton.boundingBox();
  expect(box?.width).toBeLessThanOrEqual(44);
  expect(box?.height).toBeLessThanOrEqual(44);
  const iconBox = await voiceButton.locator("svg").boundingBox();
  expect(iconBox?.width).toBeLessThanOrEqual(18);
  await expect(voiceButton.locator(".search-pro__voice-label")).toBeHidden();

  await voiceButton.click();
  await expect(dialog.locator(".search-pro__voice-error")).toContainText(
    /pas prise en charge|not supported|غير مدعوم/i,
  );
});
