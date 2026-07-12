import { test, expect } from "@playwright/test";

const verses = [
  { id: 1, chapter_id: 1, verse_key: "1:1", verse_number: 1, page_number: 1, juz_number: 1, text_uthmani: "بِسْمِ اللَّهِ" },
  { id: 2, chapter_id: 1, verse_key: "1:2", verse_number: 2, page_number: 1, juz_number: 1, text_uthmani: "الْحَمْدُ لِلَّهِ" },
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    HTMLMediaElement.prototype.play = function play() {
      window.__modernAudioPlayCalls = (window.__modernAudioPlayCalls || 0) + 1;
      return Promise.reject(new DOMException("Interaction simulated", "NotAllowedError"));
    };
  });
  await page.route("**/api.quran.com/api/v4/verses/**", (route) => {
    const translated = new URL(route.request().url()).searchParams.has("translations");
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        verses: translated ? verses.map((verse) => ({ ...verse, translations: [{ text: "Traduction", resource_name: "Test" }] })) : verses,
        pagination: { total_pages: 1 },
      }),
    });
  });
});

test("opens the audio library and selects a reciter", async ({ page }) => {
  await page.goto("/audio");
  await expect(page.getByRole("heading", { name: "Une recitation qui reste avec vous." })).toBeVisible();
  await expect(page.locator(".modern-reciter-list > button").first()).toBeVisible();
  await page.getByLabel("Rechercher un recitateur").fill("Husary");
  const result = page.locator(".modern-reciter-list > button").first();
  await expect(result).toContainText(/Husary|Hussary/i);
  await result.click();
  await expect(result).toHaveAttribute("aria-pressed", "true");
});

test("starts a verse queue and keeps all actions aligned", async ({ page }) => {
  await page.goto("/surah/1");
  const actions = page.locator(".modern-verse-actions").first();
  await expect(actions.getByRole("button")).toHaveCount(4);
  const tops = await actions.getByRole("button").evaluateAll((buttons) => buttons.map((button) => Math.round(button.getBoundingClientRect().top)));
  expect(new Set(tops).size).toBe(1);
  await page.getByRole("button", { name: "Ecouter le verset" }).first().click();
  await expect(page.getByRole("complementary", { name: "Lecteur audio" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__modernAudioPlayCalls || 0)).toBeGreaterThan(0);
  const queue = await page.evaluate(() => JSON.parse(localStorage.getItem("mushaf_recitation_queue_v1")));
  expect(queue.items).toHaveLength(2);
});

test("audio surfaces do not overflow on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/audio");
  await expect(page.locator(".modern-audio-page")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("restores a persisted queue after navigation", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("mushaf_recitation_queue_v1", JSON.stringify({ items: [{ surah: 114, ayah: 4, number: 6234, text: "" }], index: 0, updatedAt: Date.now() }));
    localStorage.setItem("mushaf-audio-resume", JSON.stringify({ surah: 114, ayah: 4, currentTime: 3, duration: 7, reciter: "ar.alafasy", riwaya: "hafs", timestamp: Date.now() }));
  });
  await page.goto("/audio");
  await expect(page.getByRole("complementary", { name: "Lecteur audio" })).toContainText("An-Nas");
  await expect(page.locator(".modern-audio-queue li")).toHaveCount(1);
});
