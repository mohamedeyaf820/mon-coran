import { test, expect } from "@playwright/test";

test.use({ serviceWorkers: "allow" });

test("PWA: the visited app shell reloads while offline", async ({ page, context }) => {
  await page.addInitScript(() => {
    localStorage.setItem("mushaf-plus-settings", JSON.stringify({
      skipSplashAnimation: true,
      showHome: true,
      showDuas: false,
      sidebarOpen: false,
      lang: "fr",
      riwaya: "hafs",
    }));
  });

  await page.goto("/");
  await expect(page.locator(".app-view-home")).toBeVisible({ timeout: 30_000 });
  await page.evaluate(() => navigator.serviceWorker.ready);

  if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))) {
    await page.reload();
    await expect(page.locator(".app-view-home")).toBeVisible({ timeout: 30_000 });
  }

  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await expect.poll(() => page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    return registration.active?.state;
  })).toBe("activated");

  await page.evaluate(async () => {
    const response = await fetch("/index.html", { cache: "reload" });
    if (!response.ok) throw new Error(`App shell probe failed: ${response.status}`);
    await response.arrayBuffer();
  });
  await page.waitForTimeout(250);

  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });

  await expect(page.locator(".mp-header")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".app-view-home")).toBeVisible({ timeout: 30_000 });
});

test("PWA: a visited surah keeps its Quran text offline", async ({ page, context }) => {
  await page.addInitScript(() => {
    localStorage.setItem("mushaf-plus-settings", JSON.stringify({
      skipSplashAnimation: true,
      showHome: false,
      showDuas: false,
      displayMode: "surah",
      currentSurah: 1,
      currentAyah: 1,
      lang: "fr",
      riwaya: "hafs",
    }));
  });

  await page.goto("/surah/1");
  const firstAyah = page.locator(".qc-ayah-text-ar").first();
  await expect(firstAyah).toBeVisible({ timeout: 30_000 });
  const onlineText = (await firstAyah.textContent())?.trim();
  expect(onlineText?.length).toBeGreaterThan(3);

  await page.evaluate(() => navigator.serviceWorker.ready);
  if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))) {
    await page.reload();
    await expect(firstAyah).toBeVisible({ timeout: 30_000 });
  }
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await page.waitForTimeout(500);

  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator(".qc-ayah-text-ar").first()).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".qc-ayah-text-ar").first()).toContainText(onlineText);
});

test("PWA: an explicitly downloaded recitation is served while offline", async ({
  page,
  context,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "mushaf-plus-settings",
      JSON.stringify({ skipSplashAnimation: true, showHome: true, lang: "fr" }),
    );
  });
  await page.goto("/");
  await expect(page.locator(".app-view-home")).toBeVisible({ timeout: 30_000 });
  await page.evaluate(() => navigator.serviceWorker.ready);
  if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))) {
    await page.reload();
  }
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);

  const audioUrl =
    "https://cdn.islamic.network/quran/audio/128/offline-test/1.mp3";
  await page.evaluate(async (url) => {
    const cache = await caches.open("mushafplus-audio-v2");
    await cache.put(
      url,
      new Response(new Uint8Array([73, 68, 51, 4, 0, 0, 0, 0, 0, 0]), {
        status: 200,
        headers: { "Content-Type": "audio/mpeg" },
      }),
    );
  }, audioUrl);

  await context.setOffline(true);
  const cachedResponse = await page.evaluate(async (url) => {
    const response = await fetch(url, { mode: "no-cors" });
    return { ok: response.ok, status: response.status, type: response.type };
  }, audioUrl);
  expect(
    cachedResponse.ok ||
      cachedResponse.status === 200 ||
      cachedResponse.type === "opaque",
  ).toBe(true);
});
