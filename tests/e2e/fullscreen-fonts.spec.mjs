import { test, expect } from "@playwright/test";

// Intentionally use real Quran page data and fonts: substituting a font load
// success hides missing QCF glyphs in automated browsers.
for (const width of [1280, 390]) {
  test(`fullscreen shared Quran fonts at ${width}px`, async ({ page }, testInfo) => {
    await page.addInitScript(() => localStorage.setItem("mushafplus-page-layout", "1"));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/page/564");
    const fullscreen = page.getByRole("button", { name: "Plein écran", exact: true });
    await expect(fullscreen).toBeVisible();
    await expect(page.locator('[data-ayah-number="27"]').first()).toBeAttached();
    await fullscreen.click();
    const overlay = page.locator(".mfp-portal-root");
    for (const target of [564, 565, 566]) {
      // Continuous reading may update the initial page before the overlay opens.
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const label = await overlay.locator("h2").textContent();
        const current = Number(label.match(/Page (\d+)/)[1]);
        if (current === target) break;
        await page.keyboard.press(current < target ? "ArrowLeft" : "ArrowRight");
        await expect(overlay.locator("h2")).not.toHaveText(label);
      }
      await expect(overlay.locator("h2")).toContainText(`Page ${target}`);
      await expect.poll(() => overlay.locator(".quran-word-item").first().evaluate((el) => {
        const family = getComputedStyle(el).fontFamily.split(",")[0].replaceAll('"', "").trim();
        return [...document.fonts].some((face) => face.family === family && face.status === "loaded") ? family : "";
      })).toBe("QPC Hafs");
      await expect(overlay.locator(".mushaf-text-block")).toHaveAttribute("dir", "rtl");
      await expect(overlay.locator(".cpv-verse").first()).toBeVisible();
      for (const opening of await overlay.locator('.bismillah > span').all()) {
        await expect(opening).toHaveCSS('opacity', '1');
        await expect(opening).toHaveCSS('transform', 'none');
        await expect(opening).toHaveCSS('animation-name', 'none');
      }
      await page.screenshot({ path: testInfo.outputPath(`page-${target}.png`) });
    }
  });
}

test("shared fullscreen does not depend on QCF page fonts", async ({ page }) => {
  await page.route("**/fonts/quran/hafs/**/p*.woff2", (route) => route.abort());
  await page.goto("/page/566");
  await page.getByRole("button", { name: "Plein écran", exact: true }).click();
  const overlay = page.locator(".mfp-portal-root");
  await expect(overlay.locator(".qcm-page")).toHaveCount(0);
  const word = overlay.locator(".quran-word-item").first();
  await expect(word).toContainText(/[\u0621-\u064A]/u);
  expect(await word.evaluate((el) => getComputedStyle(el).fontFamily)).not.toContain("qcf-");
});
