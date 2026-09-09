import { test, expect } from "@playwright/test";

async function seed(page, riwaya, mockAudio = false) {
  await page.addInitScript(({ riwaya, mockAudio }) => {
    localStorage.setItem("mushafplus-page-layout", "1");
    localStorage.setItem("mushaf-plus-settings", JSON.stringify({
      skipSplashAnimation: true, showHome: false, sidebarOpen: false,
      displayMode: "page", mushafLayout: "mushaf", lang: "fr", riwaya,
      fontFamily: riwaya === "warsh" ? "kfgqpc-warsh" : "qpc-hafs",
      reciter: riwaya === "warsh" ? "warsh_yassin" : "alafasy",
      quranFontSize: 34, showTajwid: true,
      lastPosition: { surah: 1, ayah: 1, page: 1, juz: 1 },
    }));
    if (!mockAudio) return;
    const states = new WeakMap();
    const state = (el) => { if (!states.has(el)) states.set(el, { paused: true, time: 0 }); return states.get(el); };
    Object.defineProperties(HTMLMediaElement.prototype, {
      paused: { configurable: true, get() { return state(this).paused; } },
      duration: { configurable: true, get() { return 30; } },
      readyState: { configurable: true, get() { return 4; } },
      currentTime: { configurable: true, get() { return state(this).time; }, set(v) { state(this).time = v; } },
    });
    HTMLMediaElement.prototype.load = function () {};
    HTMLMediaElement.prototype.play = function () {
      state(this).paused = false;
      window.__playedElements ||= [];
      window.__playedElements.push(this);
      this.dispatchEvent(new Event("playing"));
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function () { state(this).paused = true; this.dispatchEvent(new Event("pause")); };
  }, { riwaya, mockAudio });
}

const typography = (element) => {
  const style = getComputedStyle(element);
  return Object.fromEntries(["fontFamily", "fontSize", "lineHeight", "letterSpacing", "wordSpacing", "fontWeight"].map((key) => [key, style[key]]));
};

for (const riwaya of ["hafs", "warsh"]) {
  test(`${riwaya} list to Mushaf and repeated fullscreen keeps every verse`, async ({ page }, testInfo) => {
    await seed(page, riwaya);
    await page.addInitScript(() => {
      const settings = JSON.parse(localStorage.getItem("mushaf-plus-settings"));
      localStorage.setItem("mushaf-plus-settings", JSON.stringify({ ...settings, mushafLayout: "list" }));
    });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => {
      if (message.type() === "error" && /numberInSurah|SmartAyahRenderer|TypeError/.test(message.text())) errors.push(message.text());
    });
    await page.goto("/page/3");
    await page.getByRole("button", { name: "Mushaf", exact: true }).click();
    const verses = page.locator('[data-stream-page="3"] .cpv-verse');
    await expect(verses.first()).toBeVisible();
    const text = await verses.allTextContents();
    expect(text.length).toBeGreaterThan(1);
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await page.getByRole("button", { name: "Plein écran", exact: true }).click();
      const overlay = page.locator(".mfp-portal-root");
      await expect(overlay.locator(".cpv-verse").first()).toBeVisible();
      expect(await overlay.locator(".cpv-verse").allTextContents()).toEqual(text);
      await page.screenshot({ path: testInfo.outputPath(`fullscreen-${attempt}.png`) });
      await page.keyboard.press("Escape");
      await expect(overlay).toHaveCount(0);
      expect(await verses.allTextContents()).toEqual(text);
    }
    expect(errors).toEqual([]);
  });
}

for (const riwaya of ["hafs", "warsh"]) {
  test(`${riwaya} double page preserves RTL order, preference and audio through rotation`, async ({ page }, testInfo) => {
    await seed(page, riwaya, true);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/page/3');
    await expect(page.locator('[data-stream-page="3"] .cpv-verse').first()).toBeVisible({ timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    await page.getByRole('button', { name: 'Plein écran', exact: true }).click();
    const overlay = page.locator('.mfp-portal-root');
    await overlay.locator('summary').click();
    await overlay.getByRole('button', { name: '2 pages', exact: true }).click();
    await overlay.locator('summary').click();
    await expect(overlay.locator('[data-immersive-page="4"] .cpv-verse').first()).toBeVisible({ timeout: 30000 });
    await expect(overlay.locator('[data-immersive-page="3"] .mushaf-page-number-medallion')).toHaveText('3');
    await expect(overlay.locator('[data-immersive-page="4"] .mushaf-page-number-medallion')).toHaveText('4');
    const right = await overlay.locator('[data-immersive-page="3"]').boundingBox();
    const left = await overlay.locator('[data-immersive-page="4"]').boundingBox();
    expect(right.x).toBeGreaterThan(left.x + left.width - 1);
    expect(await overlay.locator('main').evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(2);
    const leftVerse = overlay.locator('[data-immersive-page="4"] .cpv-verse').first();
    await expect(leftVerse.locator('.native-ayah-marker')).toHaveCount(1);
    await leftVerse.locator('.native-ayah-marker').click();
    await expect(overlay.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
    await expect(overlay.locator('.mfp-track')).toContainText('2:');
    await expect.poll(() => page.evaluate(() => window.__playedElements?.length || 0)).toBeGreaterThan(0);
    await page.evaluate(() => { window.__transport = window.__playedElements[0]; window.__transport.currentTime = 8; });
    await page.screenshot({ path: testInfo.outputPath('double-page.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(overlay.locator('.mfp-spread')).toHaveAttribute('data-page-count', '1');
    expect(await page.evaluate(() => localStorage.getItem('mushafplus-page-layout'))).toBe('2');
    expect(await page.evaluate(() => window.__transport.currentTime)).toBe(8);
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(overlay.locator('.mfp-spread')).toHaveAttribute('data-page-count', '2');
    expect(await page.evaluate(() => new Set(window.__playedElements).size)).toBe(1);
    await overlay.locator('summary').click();
    await overlay.getByRole('button', { name: '1 page', exact: true }).click();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Plein écran', exact: true }).click();
    await expect(page.locator('.mfp-spread')).toHaveAttribute('data-page-count', '1');
  });
}

test('last page never requests or renders page 605', async ({ page }) => {
  await seed(page, 'hafs');
  await page.addInitScript(() => localStorage.setItem('mushafplus-page-layout', '2'));
  await page.setViewportSize({ width: 1440, height: 900 });
  const invalid = [];
  page.on('request', request => { if (/\/page\/605(?:\?|$)/.test(request.url())) invalid.push(request.url()); });
  await page.goto('/page/604');
  await expect(page.locator('[data-stream-page="604"] .cpv-verse').first()).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: 'Plein écran', exact: true }).click();
  await expect(page.locator('.mfp-spread')).toHaveAttribute('data-page-count', '1');
  await expect(page.locator('.mfp-portal-root').getByRole('button', { name: 'Page suivante', exact: true })).toBeDisabled();
  expect(invalid).toEqual([]);
});

for (const riwaya of ["hafs", "warsh"]) {
  for (const width of [280, 320, 360, 375, 390, 393, 402, 412, 430, 480, 600, 768, 820, 1024, 1280, 1440, 1920]) {
    test(`${riwaya} shared fullscreen at ${width}px`, async ({ page }, testInfo) => {
      await seed(page, riwaya);
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/page/564");
      const normal = page.locator('[data-stream-page="564"] .cpv-verse');
      await expect(normal.first()).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const text = await normal.allTextContents();
      const normalStyle = await normal.first().locator(".verse-text").evaluate(typography);
      await page.screenshot({ path: testInfo.outputPath("normal.png") });
      await page.getByRole("button", { name: "Plein écran", exact: true }).click();
      const overlay = page.locator(".mfp-portal-root");
      await expect(overlay).toHaveAttribute("data-riwaya", riwaya);
      expect(await overlay.locator(".cpv-verse").allTextContents()).toEqual(text);
      expect(await overlay.locator(".verse-text").first().evaluate(typography)).toEqual(normalStyle);
      expect(await overlay.locator("main").evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(2);
      for (const rect of await overlay.locator("header button:visible, footer button:visible").evaluateAll((els) => els.map((el) => ({ w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height })))) {
        expect(rect.w).toBeGreaterThanOrEqual(44);
        expect(rect.h).toBeGreaterThanOrEqual(44);
      }
      await page.screenshot({ path: testInfo.outputPath("fullscreen.png") });
      await page.setViewportSize({ width: 900, height: width });
      await expect(overlay).toHaveAttribute("data-riwaya", riwaya);
      await page.setViewportSize({ width, height: 900 });
      await page.keyboard.press("Escape");
      await expect(overlay).toHaveCount(0);
      expect(await normal.allTextContents()).toEqual(text);
      expect(await normal.first().locator(".verse-text").evaluate(typography)).toEqual(normalStyle);
      await expect(page.getByRole("button", { name: "Plein écran", exact: true })).toBeFocused();
    });
  }
}

test("one audio transport survives fullscreen and simulated background ended", async ({ page }) => {
  await seed(page, "hafs", true);
  await page.goto("/page/1");
  await expect(page.locator(".cpv-verse").first()).toBeVisible({ timeout: 30000 });
  await page.getByRole("button", { name: "Écouter la page", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__playedElements?.length || 0)).toBeGreaterThan(0);
  await page.evaluate(() => { window.__transport = window.__playedElements[0]; window.__transport.currentTime = 12; window.__beforeOpen = window.__playedElements.length; });
  await page.getByRole("button", { name: "Plein écran", exact: true }).click();
  const overlay = page.locator(".mfp-portal-root");
  await expect(overlay.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.__playedElements.length === window.__beforeOpen && window.__transport.currentTime === 12)).toBe(true);
  await overlay.getByRole("button", { name: "Pause", exact: true }).click();
  await overlay.getByRole("button", { name: "Lecture", exact: true }).click();
  await overlay.getByRole("button", { name: "Verset suivant", exact: true }).click();
  await expect(overlay.locator(".mfp-track")).toHaveText("1:2");
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
    window.__transport.dispatchEvent(new Event("ended"));
  });
  await expect(overlay.locator(".mfp-track")).toHaveText("1:3");
  // Finish the rest of page 1 with animation frames suspended. The native
  // transport must start page 2 before React can render the new reading page.
  await page.evaluate(() => {
    window.__originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = () => 0;
  });
  for (let ayah = 4; ayah <= 13; ayah += 1) {
    await page.evaluate(() => window.__transport.dispatchEvent(new Event("ended")));
    const verseFile = ayah <= 7 ? `001${String(ayah).padStart(3, "0")}` : `002${String(ayah - 7).padStart(3, "0")}`;
    await expect.poll(() => page.evaluate(() => window.__transport.src)).toMatch(new RegExp(`/(${ayah}|${verseFile})\\.mp3$`));
  }
  await page.evaluate(() => {
    window.requestAnimationFrame = window.__originalRAF;
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => window.__playedElements.every((el) => el === window.__transport) && !window.__transport.paused)).toBe(true);
});

test("native ended crosses a juz boundary with animation frames suspended", async ({ page }) => {
  test.setTimeout(120000);
  await seed(page, "hafs", true);
  await page.goto("/juz/1");
  await page.getByRole("button", { name: "Écouter le juz", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__playedElements?.length || 0)).toBeGreaterThan(0);
  await page.evaluate(() => {
    window.__transport = window.__playedElements[0];
    window.requestAnimationFrame = () => 0;
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  // Juz 1 contains Al-Fatiha and Al-Baqarah 1-141 (148 tracks).
  for (let global = 2; global <= 149; global += 1) {
    await page.evaluate(() => window.__transport.dispatchEvent(new Event("ended")));
    const verseFile = global <= 7 ? `001${String(global).padStart(3, "0")}` : `002${String(global - 7).padStart(3, "0")}`;
    await expect.poll(() => page.evaluate(() => window.__transport.src)).toMatch(new RegExp(`/(${global}|${verseFile})\\.mp3$`));
  }
  expect(await page.evaluate(() => window.__playedElements.every(el => el === window.__transport) && !window.__transport.paused)).toBe(true);
});

test("juz play waits for its verses instead of accepting an ineffective click", async ({ page }) => {
  await seed(page, "hafs", true);
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route(/\/juz\/1(?:\/|\?)/, async route => {
    await gate;
    await route.continue();
  });
  await page.goto('/juz/1');
  const play = page.getByRole('button', { name: 'Écouter le juz', exact: true });
  try {
    await expect(play).toBeVisible();
    await expect(play).toBeDisabled();
  } finally { release(); }
  await expect(play).toBeEnabled({ timeout: 30000 });
  await play.click();
  await expect.poll(() => page.evaluate(() => window.__playedElements?.length || 0)).toBeGreaterThan(0);
});
