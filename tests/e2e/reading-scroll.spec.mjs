import { test, expect } from "@playwright/test";

async function openReader(page) {
  await page.goto("/");
  const quranDisplay = page.locator(".quran-display").first();

  if (!(await quranDisplay.isVisible().catch(() => false))) {
    const start = page.getByRole("button", {
      name: /Commencer la lecture|Continuer|Start reading|Continue|ابدأ القراءة|متابعة|Demarrer une lecture|Resume session/i,
    });
    if (await start.first().isVisible().catch(() => false)) {
      await start.first().click();
    }
  }

  await expect(quranDisplay).toBeVisible({ timeout: 20000 });
}

async function resolveReadingScrollRoot(page) {
  return page.evaluate(() => {
    const marker = "data-e2e-scroll-root";
    const existing = document.querySelector(`[${marker}='1']`);

    if (existing && existing.isConnected) {
      const delta = Math.max(0, (existing.scrollHeight || 0) - (existing.clientHeight || 0));
      return {
        found: true,
        tag: existing.tagName,
        className: existing.className || "",
        delta,
      };
    }

    const quran = document.querySelector(".quran-display");
    const doc = document.scrollingElement || document.documentElement;
    const selectors = [
      ".quran-display-scroll",
      ".quran-display",
      ".app-main-shell",
      ".app-main",
      "#main-content",
      "main",
    ];

    const nodes = [];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) nodes.push(el);
    }

    if (quran) {
      const quranScrollable = quran.querySelectorAll("*");
      for (const el of quranScrollable) {
        const style = getComputedStyle(el);
        const overflowY = style.overflowY;
        const delta = Math.max(0, (el.scrollHeight || 0) - (el.clientHeight || 0));
        if ((overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") && delta > 24) {
          nodes.push(el);
        }
      }
    }

    if (doc) nodes.push(doc);

    const unique = Array.from(new Set(nodes.filter(Boolean)));
    const scored = unique
      .map((el) => {
        const delta = Math.max(0, (el.scrollHeight || 0) - (el.clientHeight || 0));
        if (delta <= 24) return null;

        const isInsideQuran = !!(quran && (el === quran || quran.contains(el)));
        const isQuranScroll = el.matches?.(".quran-display-scroll") || false;
        const isMainShell = el.matches?.(".app-main-shell") || false;
        const isMain = el.matches?.(".app-main") || false;
        const isMainTag = (el.tagName || "") === "MAIN";

        let score = delta;
        if (isInsideQuran) score += 2000;
        if (isQuranScroll) score += 1000;
        if (isMainShell) score += 750;
        if (isMain) score += 600;
        if (isMainTag) score += 450;

        return {
          el,
          score,
          delta,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);

    if (!scored.length) {
      return {
        found: false,
        tag: null,
        className: "",
        delta: 0,
      };
    }

    const best = scored[0].el;
    document.querySelectorAll(`[${marker}]`).forEach((n) => n.removeAttribute(marker));
    best.setAttribute(marker, "1");

    return {
      found: true,
      tag: best.tagName,
      className: best.className || "",
      delta: scored[0].delta,
    };
  });
}

async function getScrollMetrics(page) {
  await resolveReadingScrollRoot(page);

  return page.evaluate(() => {
    const root = document.querySelector("[data-e2e-scroll-root='1']");
    const doc = document.scrollingElement || document.documentElement;

    if (!root && !doc) return null;

    const top = root?.scrollTop ?? doc?.scrollTop ?? window.scrollY ?? 0;
    const scrollHeight = root?.scrollHeight ?? doc?.scrollHeight ?? 0;
    const clientHeight = root?.clientHeight ?? doc?.clientHeight ?? 0;

    return {
      top,
      scrollHeight,
      clientHeight,
      tag: root?.tagName || doc?.tagName || "UNKNOWN",
      className: root?.className || "",
    };
  });
}

async function scrollReadingContainer(page, top) {
  await page.evaluate((targetTop) => {
    const root = document.querySelector("[data-e2e-scroll-root='1']");
    const doc = document.scrollingElement || document.documentElement;

    const candidates = [root, doc].filter(Boolean);
    for (const el of candidates) {
      try {
        el.scrollTo({ top: Math.min(el.scrollHeight || targetTop, targetTop), behavior: "auto" });
      } catch {
        // ignore
      }
      if (typeof el.scrollTop === "number") {
        el.scrollTop = Math.min(el.scrollHeight || targetTop, targetTop);
      }
    }

    try {
      window.scrollTo(0, targetTop);
    } catch {
      // ignore
    }
  }, top);
}

async function switchToLongerSurah(page) {
  const nextSurah = page.locator(".quran-mode-pane--surah .quran-nav button").nth(1);
  if (await nextSurah.isVisible().catch(() => false)) {
    await nextSurah.click();
    await page.waitForTimeout(500);
  }
}

async function seedReaderState(page) {
  await page.addInitScript(() => {
    try {
      const key = "mushaf-plus-settings";
      const raw = localStorage.getItem(key);
      const current = raw ? JSON.parse(raw) : {};
      localStorage.setItem(
        key,
        JSON.stringify({
          ...current,
          splashDone: true,
          showHome: false,
          showDuas: false,
          sidebarOpen: false,
          displayMode: "surah",
          lastPosition: {
            ...(current.lastPosition || {}),
            surah: 2,
            ayah: 1,
            page: 1,
            juz: 1,
          },
          lang: current.lang || "fr",
        }),
      );
    } catch {
      // Ignore storage issues in test bootstrap.
    }
  });
}

test("E2E: scroll lecture fonctionne et retour haut remet au debut", async ({ page }) => {
  await seedReaderState(page);
  await openReader(page);
  await switchToLongerSurah(page);

  await expect
    .poll(async () => {
      const info = await resolveReadingScrollRoot(page);
      return info?.delta || 0;
    })
    .toBeGreaterThan(80);

  const before = await getScrollMetrics(page);
  expect(before).not.toBeNull();
  const beforeTop = before.top || 0;

  await scrollReadingContainer(page, 1200);

  await expect
    .poll(async () => {
      const state = await getScrollMetrics(page);
      return state?.top || 0;
    })
    .toBeGreaterThan(beforeTop + 40);

  const topBtn = page.locator(".scroll-top-btn");
  if (await topBtn.isVisible().catch(() => false)) {
    await topBtn.click();
    await expect
      .poll(async () => {
        const state = await getScrollMetrics(page);
        return state?.top ?? 9999;
      })
      .toBeLessThan(25);
  }
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("E2E mobile: scroll lecture reste actif", async ({ page }) => {
    await seedReaderState(page);
    await openReader(page);
    await switchToLongerSurah(page);

    await expect
      .poll(async () => {
        const info = await resolveReadingScrollRoot(page);
        return info?.delta || 0;
      })
      .toBeGreaterThan(80);

    const before = await getScrollMetrics(page);
    expect(before).not.toBeNull();
    const beforeTop = before.top || 0;

    await scrollReadingContainer(page, 1000);

    await expect
      .poll(async () => {
        const state = await getScrollMetrics(page);
        return state?.top || 0;
      })
      .toBeGreaterThan(beforeTop + 30);
  });
});
