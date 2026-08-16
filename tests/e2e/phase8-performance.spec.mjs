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

async function prepareReader(page, verseCount = 50) {
  await page.addInitScript(({ key }) => {
    localStorage.setItem(
      key,
      JSON.stringify({
        skipSplashAnimation: true,
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
          verses: Array.from({ length: verseCount }, (_, index) => mockVerse(index + 1)),
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

  await expect(page.locator("#ayah-2 .qc-list-card")).toBeVisible({ timeout: 30_000 });
  const firstPlay = page.locator("#ayah-1 .ayah-action--play").first();
  const secondPlay = page.locator("#ayah-2 .ayah-action--play").first();
  await expect(firstPlay).toBeVisible();
  await expect(secondPlay).toBeVisible();

  await page.evaluate(() => {
    window.__phase8StartedAt = performance.now();
    document.querySelector("#ayah-1 .ayah-action--play")?.click();
    document.querySelector("#ayah-2 .ayah-action--play")?.click();
  });
  await expect(secondPlay).toHaveAttribute("aria-label", "Pause");
  const responseTime = await page.evaluate(
    () => performance.now() - window.__phase8StartedAt,
  );
  expect(responseTime).toBeLessThan(1_500);
  await expect(firstPlay).not.toHaveAttribute("aria-label", "Pause");
  expect(runtimeErrors).toEqual([]);
});

test("phase 8: verse and sidebar windows release offscreen components", async ({
  page,
}) => {
  await prepareReader(page, 160);
  await page.goto("/surah/2");

  const anchors = page.locator('.qc-verse-by-verse-view [role="listitem"][id^="ayah-"]');
  await expect(anchors).toHaveCount(160);
  await expect(page.locator("#ayah-1 .qc-list-card")).toBeVisible();
  expect(await page.locator(".qc-list-card").count()).toBeLessThan(40);

  const lastAnchor = page.locator("#ayah-160");
  await page.locator(".app-main-shell").evaluate((scroller) => {
    scroller.scrollTop = scroller.scrollHeight;
  });
  // scrollIntoView ensures IntersectionObserver fires for the target node,
  // even when programmatic scrollTop doesn't synchronously trigger it.
  await lastAnchor.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await expect(lastAnchor.locator(".qc-list-card")).toBeVisible();
  await expect(page.locator("#ayah-40 .qc-list-card")).toHaveCount(0);
  expect(await page.locator(".qc-list-card").count()).toBeLessThan(50);

  const revealReaderChrome = page.locator(".immersive-reveal--top");
  if (await revealReaderChrome.isVisible().catch(() => false)) {
    await revealReaderChrome.dispatchEvent("click");
  }
  await page.locator(".mp-header__icon-btn").first().click();
  const sidebarItems = page.locator(".sidebar-virtual-item");
  await expect(sidebarItems).toHaveCount(114);
  expect(await page.locator(".sidebar-virtual-item > button").count()).toBeLessThan(60);

  const lastSidebarItem = sidebarItems.last();
  await lastSidebarItem.evaluate((element) =>
    element.scrollIntoView({ block: "center", behavior: "auto" }),
  );
  await expect(lastSidebarItem.locator("button")).toBeVisible();
  expect(await page.locator(".sidebar-virtual-item > button").count()).toBeLessThan(60);
});

test("phase 8: navigation performance stays aggregated on-device", async ({
  page,
}) => {
  await prepareReader(page);
  await page.goto("/surah/2");
  await expect(page.locator("#ayah-1 .qc-list-card")).toBeVisible({
    timeout: 30_000,
  });

  await expect
    .poll(() =>
      page.evaluate(() => {
        const report = JSON.parse(
          localStorage.getItem("mp_performance_metrics_v1") || "{}",
        );
        return {
          ttfb: report.ttfb_ms?.count || 0,
          interactive: report.dom_interactive_ms?.count || 0,
          load: report.page_load_ms?.count || 0,
        };
      }),
    )
    .toEqual({ ttfb: 1, interactive: 1, load: 1 });
});
