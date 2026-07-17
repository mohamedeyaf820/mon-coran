import { expect, test } from "@playwright/test";

const SETTINGS_KEY = "mushaf-plus-settings";

function mockVerse(number) {
  return {
    id: number + 7,
    chapter_id: 2,
    verse_key: `2:${number}`,
    verse_number: number,
    page_number: 2,
    juz_number: 1,
    text_uthmani: `\u0627\u0644\u0622\u064a\u0629 \u0627\u0644\u0645\u062c\u0631\u0628\u0629 ${number}`,
    text_qpc_hafs: `\u0627\u0644\u0622\u064a\u0629 \u0627\u0644\u0645\u062c\u0631\u0628\u0629 ${number}`,
    words: [],
  };
}

async function prepareReader(page) {
  await page.addInitScript(({ key }) => {
    localStorage.setItem(
      key,
      JSON.stringify({
        splashDone: true,
        showHome: false,
        showDuas: false,
        sidebarOpen: false,
        displayMode: "surah",
        mushafLayout: "list",
        lang: "fr",
        riwaya: "hafs",
        reciter: "abu_bakr_ash_shaatree",
        showTranslation: false,
        lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 },
      }),
    );

    HTMLMediaElement.prototype.load = function load() {};
    HTMLMediaElement.prototype.play = function play() {
      Object.defineProperty(this, "paused", {
        configurable: true,
        value: false,
      });
      return Promise.reject(new DOMException("blocked", "NotAllowedError"));
    };
  }, { key: SETTINGS_KEY });

  await page.route(
    (url) =>
      url.hostname === "api.quran.com" &&
      url.pathname.includes("/verses/by_chapter/2"),
    (route) =>
      route.fulfill({
        json: {
          verses: Array.from({ length: 50 }, (_, index) => mockVerse(index + 1)),
          pagination: { total_pages: 1 },
        },
      }),
  );
}

test("phase 8: rapid verse changes keep only the latest audio target", async ({
  page,
}) => {
  const runtimeErrors = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await prepareReader(page);
  await page.goto("/surah/2");

  const cards = page.locator(".qc-list-card");
  await expect(cards.nth(1)).toBeVisible({ timeout: 30_000 });
  const firstPlay = cards.nth(0).locator(".ayah-action--play").first();
  const secondPlay = cards.nth(1).locator(".ayah-action--play").first();
  await expect(firstPlay).toBeVisible();
  await expect(secondPlay).toBeVisible();

  await page.evaluate(() => {
    const cards = document.querySelectorAll(".qc-list-card");
    window.__phase8StartedAt = performance.now();
    cards[0]?.querySelector(".ayah-action--play")?.click();
    cards[1]?.querySelector(".ayah-action--play")?.click();
  });
  await expect(secondPlay).toHaveAttribute("aria-label", "Pause");
  const responseTime = await page.evaluate(
    () => performance.now() - window.__phase8StartedAt,
  );
  expect(responseTime).toBeLessThan(1_500);
  await expect(firstPlay).not.toHaveAttribute("aria-label", "Pause");
  expect(runtimeErrors).toEqual([]);
});
