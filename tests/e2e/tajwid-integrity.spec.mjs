import { writeFileSync } from "node:fs";
import { test, expect } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";
const widths = [280, 320, 360, 375, 384, 390, 414, 430, 768, 1024, 1440, 1920];

async function openReader(page, width, overrides = {}, path, fixtureOptions = {}) {
  await installQuranNetworkFixtures(page, fixtureOptions);
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(settings => {
    localStorage.setItem("mushaf-plus-settings", JSON.stringify(settings));
    sessionStorage.setItem("mushafplus-reader-tools-open", "true");
  }, {
    skipSplashAnimation: true, showHome: false, showDuas: false, sidebarOpen: false,
    displayMode: "surah", mushafLayout: "list", lang: "fr", riwaya: "hafs",
    fontFamily: "qpc-hafs", quranFontSize: 34, showTajwid: true,
    lastPosition: { surah: 53, ayah: 1, page: 526, juz: 27 }, ...overrides,
  });
  await page.goto(path || `/surah/${overrides.lastPosition?.surah || 53}`);
  await expect(page.locator(".qc-ayah-text-ar, .qcm-page-shell").first()).toBeVisible();
  await expect(page.locator('html[data-deferred-styles="ready"]')).toBeAttached();
  await page.evaluate(() => document.fonts.ready);
}

for (const [index, width] of widths.entries()) {
  test(`Tajwid ${width}px: exact ON/OFF text, geometry, guide and focus`, async ({ page }, info) => {
    const lang = width === 384 || width === 1024 ? "ar" : "fr";
    const theme = ["light", "dark", "sepia"][index % 3];
    await openReader(page, width, { lang, theme });
    const trigger = page.getByTestId("tajweed-legend");
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("[data-visual-group]")).toHaveCount(8);
    const body = dialog.locator(".tajwid-guide__content");
    await expect(body).toHaveAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    const close = dialog.getByRole("button").first();
    // The desktop popover scales during entry; measure the settled target.
    await expect.poll(async () => (await close.boundingBox())?.height || 0).toBeGreaterThanOrEqual(44);
    const box = await close.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    if ([384, 1440].includes(width)) await page.screenshot({ path: info.outputPath(`guide-${lang}-${width}.png`) });
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    const snapshot = () => page.locator(".qc-ayah-text-ar").evaluateAll(nodes => nodes.slice(0, 4).map(node => ({
      text: node.textContent, height: node.getBoundingClientRect().height,
      width: node.getBoundingClientRect().width, font: getComputedStyle(node).fontSize,
    })));
    const before = await snapshot();
    const disclosure = page.locator(".srh-identity__disclosure:visible").first();
    if (!(await page.locator(".srh-toggle:visible").count())) await disclosure.click();
    const toggle = page.getByRole("button", { name: lang === "ar" ? "تجويد" : "Tajweed", exact: true });
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(await snapshot()).toEqual(before);
    await expect(page.locator(".qc-ayah-text-ar .is-tajweed-painted")).toHaveCount(0);
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(await snapshot()).toEqual(before);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(2);
  });
}

test("Warsh paints its printed signs and discloses the shared palette", async ({ page }, info) => {
  const requests = [];
  page.on("request", request => { if (/phonemizer|qud/i.test(request.url())) requests.push(request.url()); });
  await openReader(page, 390, { riwaya: "warsh", fontFamily: "qpc-warsh", lastPosition: { surah: 3, ayah: 1, page: 50, juz: 3 } }, undefined, { withWarshDabt: true });
  await expect.poll(() => page.locator(".qc-ayah-text-ar .is-tajweed-painted").count()).toBeGreaterThan(0);
  const snapshot = () => page.locator(".qc-ayah-text-ar").allTextContents();
  const original = await snapshot();
  await page.screenshot({ path: info.outputPath("warsh-colours-mobile.png") });
  await page.getByTestId("tajweed-legend").click();
  await expect(page.getByRole("dialog")).toContainText("mêmes couleurs que Hafs");
  await expect(page.locator("[data-visual-group]")).toHaveCount(8);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Tajweed", exact: true }).click();
  await expect(page.locator(".qc-ayah-text-ar .is-tajweed-painted")).toHaveCount(0);
  expect(await snapshot()).toEqual(original);
  await page.getByRole("button", { name: "Tajweed", exact: true }).click();
  await expect.poll(() => page.locator(".qc-ayah-text-ar .is-tajweed-painted").count()).toBeGreaterThan(0);
  expect(await snapshot()).toEqual(original);
  expect(requests).toEqual([]);
});

for (const width of [384, 1440]) {
  for (const theme of ["light", "dark", "sepia"]) {
    test(`Warsh ${width}px ${theme}: the shared palette paints the canonical text`, async ({ page }, info) => {
      await openReader(page, width, { riwaya: "warsh", fontFamily: "qpc-warsh", theme, lang: width === 384 ? "ar" : "fr", lastPosition: { surah: 3, ayah: 1, page: 50, juz: 3 } }, undefined, { withWarshDabt: true });
      const painted = page.locator(".qc-ayah-text-ar .is-tajweed-painted");
      await expect.poll(() => painted.count()).toBeGreaterThan(0);
      const gradients = await painted.evaluateAll(nodes => nodes.map(node => ({ text: node.textContent, gradient: node.style.getPropertyValue("--tajweed-paint"), fill: getComputedStyle(node).backgroundImage })));
      expect(gradients.some(word => word.gradient.includes("var(--tajwid-ghunna)") || word.gradient.includes("var(--tajwid-ham-wasl)"))).toBe(true);
      expect(gradients.every(word => word.fill !== "none" && word.text.length > 0)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(2);
      await page.screenshot({ path: info.outputPath(`warsh-${width}-${theme}.png`) });
    });
  }
}

for (const width of [280, 1440]) {
  test(`Fullscreen ${width}px keeps the page text and closes only the guide on Escape`, async ({ page }) => {
    await openReader(page, width, { displayMode: "page", mushafLayout: "mushaf", fontFamily: "qcf4-tajweed", lastPosition: { surah: 2, ayah: 1, page: 3, juz: 1 } }, "/page/3");
    const original = await page.locator(".qcm-page-shell").first().locator(".qcm-word").allTextContents();
    await page.locator(".reader-fullscreen-trigger").click();
    const fullscreen = page.locator(".mfp-portal-root");
    await expect(fullscreen).toBeVisible();
    expect(await fullscreen.locator('.qcm-page-shell[data-page="3"] .qcm-word').allTextContents()).toEqual(original);
    const guideTrigger = fullscreen.getByTestId("tajweed-legend");
    await guideTrigger.click();
    const guide = page.getByRole("dialog", { name: "Guide Tajwid", exact: true });
    await expect(guide).toBeVisible();
    await expect(guide.getByRole("button").first()).toBeInViewport();
    await page.keyboard.press("Escape");
    await expect(guide).toBeHidden();
    await expect(fullscreen).toBeVisible();
    await expect(guideTrigger).toBeFocused();
    const toolbar = await fullscreen.locator(".mfp-header").boundingBox();
    expect(toolbar.x).toBeGreaterThanOrEqual(0);
    expect(toolbar.x + toolbar.width).toBeLessThanOrEqual(width);
    await page.keyboard.press("Escape");
    await expect(fullscreen).toBeHidden();
  });
}

test("Warsh page and fullscreen preserve the same painted words", async ({ page }) => {
  await openReader(page, 390, { riwaya: "warsh", fontFamily: "qpc-warsh", displayMode: "page", mushafLayout: "mushaf", lastPosition: { surah: 2, ayah: 24, page: 5, juz: 1 } }, "/page/5");
  const sheet = page.locator('.qcm-page-shell[data-page="5"]').first();
  const snapshot = locator => locator.locator('.qcm-word').evaluateAll(nodes => nodes.map(node => ({ text: node.textContent, paint: node.style.getPropertyValue('--tajweed-paint') })));
  await expect.poll(() => sheet.locator('.is-tajweed-painted').count()).toBeGreaterThan(0);
  const original = await snapshot(sheet);
  await page.getByRole('button', { name: 'Plein écran', exact: true }).click();
  const full = page.locator('.mfp-portal-root .qcm-page-shell[data-page="5"]');
  await expect(full).toBeVisible();
  await expect.poll(() => full.locator('.is-tajweed-painted').count()).toBeGreaterThan(0);
  // Gradient percentages depend on the layout; the source words and rule IDs do not.
  expect((await snapshot(full)).map(word => word.text)).toEqual(original.map(word => word.text));
  const rules = locator => locator.locator('.is-tajweed-painted').evaluateAll(nodes => nodes.map(node => [...node.style.getPropertyValue('--tajweed-paint').matchAll(/var\(--tajwid-([a-z-]+)\)/g)].map(match => match[1])));
  expect(await rules(full)).toEqual(await rules(sheet));
});
test("English guide remains readable and restores keyboard focus", async ({ page }) => {
  await openReader(page, 390, { lang: "en" });
  const trigger = page.getByRole("button", { name: "Tajweed guide", exact: true });
  await trigger.click();
  const guide = page.getByRole("dialog");
  await expect(guide).toContainText("Natural madd");
  await expect(guide.locator("[data-visual-group]")).toHaveCount(8);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("Al-Baqara keeps a bounded rendered verse set when Tajwid is toggled", async ({ page }, info) => {
  await openReader(page, 390, { lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } });
  const measure = () => page.locator(".qc-ayah-text-ar").evaluateAll(nodes => ({ verses: nodes.length, nodes: nodes.reduce((sum, node) => sum + node.querySelectorAll("*").length, 0), text: nodes.map(node => node.textContent) }));
  const before = await measure();
  expect(before.verses).toBeLessThan(286);
  expect(before.verses).toBeGreaterThan(0);
  const toggle = page.getByRole("button", { name: "Tajweed", exact: true });
  const start = Date.now();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  const offMs = Date.now() - start;
  const off = await measure();
  expect(off.text).toEqual(before.text);
  const onStart = Date.now();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  const onMs = Date.now() - onStart;
  const after = await measure();
  expect(after.text).toEqual(before.text);
  expect(after.nodes).toEqual(before.nodes);
  const measurement = JSON.stringify({ dataset: "286 verses, deterministic UI fixtures", before: { verses: before.verses, nodes: before.nodes }, off: { verses: off.verses, nodes: off.nodes }, after: { verses: after.verses, nodes: after.nodes }, offMs, onMs, note: "Browser interaction timings include Playwright; this is not a before/after implementation benchmark." }, null, 2);
  writeFileSync(info.outputPath("al-baqara-render.json"), measurement);
  await info.attach("al-baqara-render-measurement", { body: measurement, contentType: "application/json" });
});


test("normal, page and fullscreen Hafs use the same annotated source words", async ({ page }) => {
  await openReader(page, 390, { displayMode: "page", lastPosition: { surah: 53, ayah: 1, page: 1, juz: 1 } }, "/page/1", { pageSurah: 53 });
  const normal = page.getByRole("listitem", { name: "Verset 53:4", exact: true }).locator("[data-tajwid-word]");
  await expect(normal).toHaveCount(6);
  const normalWords = await normal.evaluateAll(nodes => nodes.filter(node => !node.classList.contains("native-ayah-marker")).map(node => ({ text: node.textContent, rule: node.dataset.tajwidName || null })));
  await page.getByRole("button", { name: "Mushaf", exact: true }).click();
  const flow = page.locator('.qcm-word[data-surah-number="53"][data-ayah-number="4"]');
  await expect(flow).toHaveCount(normalWords.length);
  expect(await flow.evaluateAll(nodes => nodes.map(node => ({ text: node.textContent, rule: node.dataset.tajwidName || null })))).toEqual(normalWords);
  await page.locator(".reader-fullscreen-trigger").click();
  const full = page.locator('.mfp-portal-root .qcm-word[data-surah-number="53"][data-ayah-number="4"]');
  await expect(full).toHaveCount(normalWords.length);
  expect(await full.evaluateAll(nodes => nodes.map(node => ({ text: node.textContent, rule: node.dataset.tajwidName || null })))).toEqual(normalWords);
});
