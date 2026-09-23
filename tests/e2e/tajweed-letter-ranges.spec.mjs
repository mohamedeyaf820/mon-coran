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

test("Warsh Tajweed colours only rule ranges within intact words", async ({ page }) => {
  await openWarshPage(page, true);
  const result = await page.evaluate(() => {
    const words = [...document.querySelectorAll('[data-stream-page="565"] .qcm-word')];
    const wordNodes = new Set(words.map((word) => word.firstChild));
    const coloured = [...CSS.highlights.entries()]
      .filter(([name]) => name.startsWith("tajwid-") && name !== "tajwid-hover" && name !== "tajwid-playing")
      .flatMap(([name, highlight]) => [...highlight].filter((range) => wordNodes.has(range.startContainer))
        .map((range) => ({
          name,
          text: range.startContainer.data,
          start: range.startOffset,
          end: range.endOffset,
        })));
    return { coloured, wordCount: words.length, wholeWordInk: words.some((word) =>
      word.hasAttribute("data-tajwid") || word.style.getPropertyValue("--qcm-word-tajwid")) };
  });
  expect(result.wordCount).toBeGreaterThan(50);
  expect(result.coloured.length).toBeGreaterThan(0);
  expect(result.coloured.some(({ start, end, text }) => start > 0 || end < text.length)).toBe(true);
  expect(result.wholeWordInk).toBe(false);
});

test("Warsh without Tajweed keeps words uncoloured", async ({ page }) => {
  await openWarshPage(page, false);
  const result = await page.evaluate(() => ({
    coloured: [...CSS.highlights.entries()].filter(([name]) => name.startsWith("tajwid-") && name !== "tajwid-hover" && name !== "tajwid-playing")
      .reduce((sum, [, highlight]) => sum + highlight.size, 0),
    wholeWordInk: [...document.querySelectorAll('[data-stream-page="565"] .qcm-word')].some((word) =>
      word.hasAttribute("data-tajwid") || word.style.getPropertyValue("--qcm-word-tajwid")),
  }));
  expect(result.coloured).toBe(0);
  expect(result.wholeWordInk).toBe(false);
});
