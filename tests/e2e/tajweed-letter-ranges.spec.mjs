import { expect, test } from "@playwright/test";

async function openWarshPage(page, showTajwid) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript((enabled) => {
    localStorage.setItem("mushaf-plus-settings", JSON.stringify({
      skipSplashAnimation: true,
      showHome: false,
      displayMode: "page",
      mushafLayout: "mushaf",
      riwaya: "warsh",
      showTajwid: enabled,
      lang: "fr",
      lastPosition: { surah: 77, ayah: 1, page: 565, juz: 29 },
    }));
  }, showTajwid);
  await page.route((url) => url.hostname === "raw.githubusercontent.com", (route) => route.abort());
  await page.goto("/page/565", { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-stream-page="565"] .qcm-word').first()).toBeVisible({ timeout: 15_000 });
}

// Only the transient guides may be highlights now; a colour highlight would
// re-shape its sub-run and print detached Arabic strokes.
const COLOUR_HIGHLIGHTS = `
  [...CSS.highlights.entries()]
    .filter(([name]) => name.startsWith("tajwid-") && name !== "tajwid-hover" && name !== "tajwid-playing")
    .reduce((sum, [, highlight]) => sum + highlight.size, 0)`;

test("Warsh Tajweed colours rule bands inside intact words", async ({ page }) => {
  await openWarshPage(page, true);
  await expect
    .poll(() => page.locator('[data-stream-page="565"] .qcm-word.is-tajweed-painted').count(),
      { timeout: 15_000 })
    .toBeGreaterThan(0);
  const result = await page.evaluate(() => {
    const words = [...document.querySelectorAll('[data-stream-page="565"] .qcm-word')];
    const painted = words.filter((word) => word.classList.contains("is-tajweed-painted"));
    return {
      wordCount: words.length,
      paintedCount: painted.length,
      // A word is one shaped run: no child element, no second text node.
      fragmented: words.filter((word) => word.childNodes.length !== 1).length,
      banded: painted.filter((word) =>
        (word.style.getPropertyValue("--tajweed-paint").match(/%/g) || []).length >= 4).length,
    };
  });
  const colourHighlights = await page.evaluate(COLOUR_HIGHLIGHTS);
  expect(result.wordCount).toBeGreaterThan(50);
  expect(result.paintedCount).toBeGreaterThan(0);
  expect(result.banded).toBe(result.paintedCount);
  expect(result.fragmented).toBe(0);
  expect(colourHighlights).toBe(0);
});

test("Warsh without Tajweed keeps words uncoloured", async ({ page }) => {
  await openWarshPage(page, false);
  const painted = await page
    .locator('[data-stream-page="565"] .qcm-word.is-tajweed-painted')
    .count();
  const colourHighlights = await page.evaluate(COLOUR_HIGHLIGHTS);
  expect(painted).toBe(0);
  expect(colourHighlights).toBe(0);
});
