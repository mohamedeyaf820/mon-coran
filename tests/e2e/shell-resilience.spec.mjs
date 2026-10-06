import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

// A lazy accessory of the shell whose chunk never arrives (flaky network, a
// stale hash after a deploy) must not take the reader down with it.
const manifest = JSON.parse(readFileSync("dist/.vite/manifest.json", "utf8"));

for (const [name, source] of [
  ["audio player", "src/components/AudioPlayer.jsx"],
  ["header", "src/components/Header.jsx"],
  ["sidebar", "src/components/Sidebar.jsx"],
  ["bottom navigation", "src/components/MobileNavigation.jsx"],
]) {
  test(`the reader stays usable when the ${name} chunk fails to load`, async ({ page }) => {
    const file = manifest[source]?.file;
    expect(file, `${source} must be a build entry`).toBeTruthy();
    await page.addInitScript(() => {
      localStorage.setItem(
        "mushaf-plus-settings",
        JSON.stringify({ skipSplashAnimation: true, lang: "fr", riwaya: "hafs" }),
      );
      // The full-page reload that recovers a stale hash is not what is tested.
      sessionStorage.setItem("mushafplus-chunk-reload-at", String(Date.now()));
    });
    await page.route(`**/${file}`, (route) => route.abort());
    await page.goto("/surah/1");
    await expect(page.locator("[data-ayah-number]").first()).toBeVisible({ timeout: 30000 });
    await expect(page.locator('[role="alert"]')).toHaveCount(0);
  });
}
