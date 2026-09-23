import { test, expect } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";

// Regression net for the "écritures qui coupent" class of bugs (role="button"
// overflow reset, import-order line-height fights): measure every rendered
// verse line box against each hidden/clip ancestor, and pin the large-list
// leading floor that keeps tall harakat inside their line.
const FONTS = [
  "qpc-hafs",
  "qpc-indopak",
  "amiri-quran",
  "noto-naskh-arabic",
  "scheherazade-new",
];

for (const fontFamily of FONTS) {
  test(`list ink at a large size stays inside every clipping ancestor (${fontFamily})`, async ({
    page,
  }) => {
    await page.addInitScript(
      ({ fontFamily }) => {
        localStorage.setItem(
          "mushaf-plus-settings",
          JSON.stringify({
            skipSplashAnimation: true,
            showHome: false,
            showDuas: false,
            sidebarOpen: false,
            displayMode: "surah",
            mushafLayout: "list",
            lang: "fr",
            riwaya: "hafs",
            fontFamily,
            quranFontSize: 30,
            showTajwid: true,
            showTranslation: false,
          }),
        );
      },
      { fontFamily },
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await installQuranNetworkFixtures(page);
    await page.goto("/surah/1/1");
    await expect(page.locator(".qc-ayah-text-ar").first()).toBeVisible({
      timeout: 30_000,
    });
    await page.evaluate(() => document.fonts.ready);

    const clipped = await page.evaluate(() => {
      const offenders = [];
      for (const element of document.querySelectorAll(".qc-ayah-text-ar")) {
        const range = document.createRange();
        range.selectNodeContents(element);
        const rects = Array.from(range.getClientRects()).filter(
          (r) => r.width >= 1 && r.height >= 1,
        );
        for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
          const style = window.getComputedStyle(ancestor);
          // Only a vertical hidden/clip is a real cutter: scrollports (auto /
          // scroll, including the computed auto forced by overflow-x:hidden)
          // legitimately hold lines outside their box until scrolled to.
          const y = style.overflowY;
          if (y !== "hidden" && y !== "clip") {
            continue;
          }
          const box = ancestor.getBoundingClientRect();
          for (const rect of rects) {
            if (rect.top < box.top - 0.5 || rect.bottom > box.bottom + 0.5) {
              offenders.push({
                ancestor: `${ancestor.tagName}.${ancestor.className}`.slice(0, 80),
                verse: (element.textContent || "").slice(0, 24),
                overflowPx: Math.max(
                  box.top - rect.top,
                  rect.bottom - box.bottom,
                ).toFixed(1),
              });
            }
          }
        }
      }
      return offenders;
    });
    expect(clipped).toEqual([]);

    const leading = await page
      .locator(".qc-ayah-text-ar")
      .first()
      .evaluate((element) => {
        const style = window.getComputedStyle(element);
        return (
          Number.parseFloat(style.lineHeight) / Number.parseFloat(style.fontSize)
        );
      });
    // Resolved 30 px list size sits on the ink floor (>=1.95), never below.
    expect(leading).toBeGreaterThanOrEqual(1.94);
  });
}
