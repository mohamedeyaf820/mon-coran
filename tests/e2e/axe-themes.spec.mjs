import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";

// axe on the combinations the light/French specs do not reach: the dark and
// sepia themes, Arabic (RTL) and English, on a phone and a wide screen. A review
// cleared every finding there (on-primary ink, readable greens, headings,
// landmarks, tab semantics); this keeps it that way. Any impact fails.

const COMBOS = [
  { name: "phone dark Arabic", width: 390, height: 844, theme: "dark", lang: "ar" },
  { name: "wide sepia English", width: 1440, height: 900, theme: "sepia", lang: "en" },
  { name: "wide dark French", width: 1440, height: 900, theme: "dark", lang: "fr" },
];

const SCREENS = [
  { name: "home", path: "/", ready: ".app-view-home" },
  { name: "reader", path: "/surah/1", ready: ".qc-ayah-text-ar" },
  { name: "page reader", path: "/page/1", ready: ".reader-context-card" },
  { name: "prayers", path: "/prieres", ready: ".prayers-page, [data-view='prayers']" },
  { name: "duas", path: "/duas", ready: "[class*=dua]" },
  { name: "legal", path: "/about", ready: ".legal-page" },
];

for (const combo of COMBOS) {
  test.describe(combo.name, () => {
    test.use({ viewport: { width: combo.width, height: combo.height } });

    test.beforeEach(async ({ page }) => {
      await installQuranNetworkFixtures(page);
      await page.addInitScript(({ theme, lang }) => {
        localStorage.setItem(
          "mushaf-plus-settings",
          JSON.stringify({ skipSplashAnimation: true, theme, lang, riwaya: "hafs" }),
        );
      }, combo);
    });

    for (const screen of SCREENS) {
      test(`${screen.name} has no axe violation`, async ({ page }) => {
        await page.goto(screen.path);
        await expect(page.locator(screen.ready).first()).toBeVisible({ timeout: 30_000 });
        await page.waitForFunction(() => document.documentElement.dataset.deferredStyles === "ready", null, {
          timeout: 15_000,
        });
        // Entrance fades blend the colours axe samples: freeze motion first.
        await page.addStyleTag({
          content: "*, *::before, *::after { animation: none !important; transition: none !important; }",
        });
        await page.waitForTimeout(400);
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
          .analyze();
        // The minimised player's rail paints 3px but carries a 44px ::after hit
        // area (audio-player-simple.css): axe measures the element, not the pseudo.
        const violations = results.violations.filter(
          (violation) =>
            !(violation.id === "target-size" &&
              violation.nodes.every((node) => node.target.join(" ").includes(".mp-player-progress"))),
        );
        const summary = violations.map(
          (violation) => `${violation.id} (${violation.nodes.length}): ${violation.nodes[0]?.target.join(" ")}`,
        );
        expect(summary, `${combo.name} / ${screen.name}`).toEqual([]);
      });
    }
  });
}
