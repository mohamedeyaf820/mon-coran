import { test, expect } from "@playwright/test";

const SETTINGS_KEY = "mushaf-plus-settings";

test.use({ serviceWorkers: "block" });

const mockWords = [
  ["بِسْمِ", "bismi", "Au nom"],
  ["ٱللَّهِ", "allāhi", "d’Allah"],
  ["ٱلرَّحْمَـٰنِ", "ar-raḥmāni", "Le Tout Miséricordieux"],
  ["ٱلرَّحِيمِ", "ar-raḥīmi", "Le Très Miséricordieux"],
].map(([arabic, transliteration, translation], index) => ({
  id: index + 1,
  chapter_id: 1,
  verse_key: "1:1",
  location: `1:1:${index + 1}`,
  position: index + 1,
  char_type_name: "word",
  text_uthmani: arabic,
  text_qpc_hafs: arabic,
  transliteration: { text: transliteration },
  translation: { text: translation },
  audio_url: null,
}));

const mockVerse = {
  id: 1,
  chapter_id: 1,
  verse_key: "1:1",
  verse_number: 1,
  page_number: 1,
  juz_number: 1,
  hizb_number: 1,
  text_uthmani: mockWords.map((word) => word.text_uthmani).join(" "),
  text_qpc_hafs: mockWords.map((word) => word.text_qpc_hafs).join(" "),
  words: mockWords,
};

const embeddedEnglishVerse = {
  ...mockVerse,
  words: mockWords.map((word, index) => ({
    ...word,
    translation: {
      text: ["In (the) name", "(of) Allah", "the Most Gracious", "the Most Merciful"][index],
    },
  })),
};

async function openWordByWordReader(page, viewport) {
  const wordLanguageRequests = [];
  await page.route("https://api.quran.com/api/v4/**", async (route) => {
    const url = new URL(route.request().url());
    const isTranslationRequest = url.searchParams.has("translations");
    const isWordRequest = url.pathname.includes("/verses/by_key/");
    const requestedWordLanguage = url.searchParams.get("language");
    if (isWordRequest && requestedWordLanguage) {
      wordLanguageRequests.push(url.toString());
    }
    const requestedVerse =
      isWordRequest && requestedWordLanguage === "fr"
        ? mockVerse
        : { ...embeddedEnglishVerse, words: [] };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        verses: isTranslationRequest
          ? [
              {
                ...mockVerse,
                translations: [
                  {
                    text: "Au nom d’Allah, le Tout Miséricordieux, le Très Miséricordieux.",
                    resource_name: "Test français",
                  },
                ],
              },
            ]
          : [requestedVerse],
        pagination: { current_page: 1, total_pages: 1 },
        verse: requestedVerse,
      }),
    });
  });

  await page.addInitScript((key) => {
    localStorage.setItem(
      key,
      JSON.stringify({
        splashDone: true,
        showHome: false,
        showDuas: false,
        sidebarOpen: false,
        displayMode: "surah",
        mushafLayout: "list",
        currentSurah: 1,
        currentAyah: 1,
        lang: "fr",
        riwaya: "hafs",
        fontFamily: "qpc-hafs",
        quranFontSize: 36,
        showTranslation: false,
        showTajwid: true,
        showWordByWord: true,
        showTransliteration: true,
        showWordTranslation: true,
        wordTranslationLang: "fr",
      }),
    );
  }, SETTINGS_KEY);

  await page.setViewportSize(viewport);
  await page.goto("/surah/1");
  await expect(page.locator(".quran-display--word-by-word")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.locator(".wbw-study-grid .wbw-word-block").first()).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.locator(".wbw-study-grid").first()).toHaveAttribute(
    "data-translation-language",
    "fr",
  );
  await expect
    .poll(() => wordLanguageRequests.length, { timeout: 10_000 })
    .toBeGreaterThan(0);
  await expect(
    page.locator(".wbw-study-grid .wbw-word-block .wbw-translation").first(),
  ).toHaveText("Au nom", { timeout: 30_000 });
  return wordLanguageRequests;
}

test("mobile word-by-word cards stay readable and never expose tooltip content", async ({
  page,
}) => {
  const wordLanguageRequests = await openWordByWordReader(page, {
    width: 390,
    height: 844,
  });

  const cards = page.locator(".wbw-study-grid .wbw-word-block");
  expect(await cards.count()).toBeGreaterThanOrEqual(4);

  const firstBox = await cards.nth(0).boundingBox();
  const secondBox = await cards.nth(1).boundingBox();
  expect(firstBox?.width || 0).toBeGreaterThanOrEqual(130);
  expect(secondBox?.width || 0).toBeGreaterThanOrEqual(130);
  expect(Math.abs((firstBox?.y || 0) - (secondBox?.y || 0))).toBeLessThanOrEqual(2);
  expect(firstBox?.x || 0).toBeGreaterThan(secondBox?.x || 0);

  const typography = await cards.first().evaluate((card) => {
    const style = (selector) => getComputedStyle(card.querySelector(selector));
    return {
      arabic: Number.parseFloat(style(".wbw-arabic").fontSize),
      transliteration: Number.parseFloat(style(".wbw-transliteration").fontSize),
      translation: Number.parseFloat(style(".wbw-translation").fontSize),
      translationWordBreak: style(".wbw-translation").wordBreak,
      translationHyphens: style(".wbw-translation").hyphens,
    };
  });

  expect(typography.arabic).toBeGreaterThanOrEqual(27);
  expect(typography.transliteration).toBeLessThanOrEqual(14);
  expect(typography.translation).toBeLessThanOrEqual(15);
  expect(typography.translationWordBreak).toBe("normal");
  expect(typography.translationHyphens).toBe("none");
  expect(wordLanguageRequests.some((url) => url.includes("language=fr"))).toBe(true);

  const tooltipAnchor = await page.locator(".wbw-tooltip-anchor").first().evaluate((node) => {
    const box = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return {
      width: box.width,
      height: box.height,
      position: style.position,
      overflow: style.overflow,
    };
  });
  expect(tooltipAnchor.width).toBeLessThanOrEqual(1);
  expect(tooltipAnchor.height).toBeLessThanOrEqual(1);
  expect(tooltipAnchor.position).toBe("absolute");
  expect(tooltipAnchor.overflow).toBe("hidden");

  const overflow = await page.evaluate(() =>
    Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
  );
  expect(overflow).toBeLessThanOrEqual(2);
});
