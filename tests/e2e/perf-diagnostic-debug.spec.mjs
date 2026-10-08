import { test, expect } from "@playwright/test";

test.use({ serviceWorkers: "block" });

test("diagnostic: loading + scroll perf on reader and home", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("mushaf-plus-settings", JSON.stringify({
      skipSplashAnimation: true, showHome: false, sidebarOpen: false,
      displayMode: "surah", mushafLayout: "list", lang: "fr", riwaya: "hafs",
    }));
  });

  const resourceSizes = new Map();
  page.on("response", async (resp) => {
    try {
      const len = Number(resp.headers()["content-length"] || 0);
      resourceSizes.set(resp.url(), (resourceSizes.get(resp.url()) || 0) + len);
    } catch {}
  });

  const results = {};

  // --- Reading page ---
  let t0 = Date.now();
  await page.goto("/surah/2", { waitUntil: "domcontentloaded" });
  results.domContentLoadedMs = Date.now() - t0;
  await page.waitForSelector("#main-content", { timeout: 30000 });
  // Time until first ayah text is painted
  t0 = Date.now();
  await page.waitForSelector("[data-ayah-number], .quran-verse, .mushaf-verse", { timeout: 30000 }).catch(() => {});
  results.firstAyahVisibleMs = Date.now() - t0;
  await page.waitForTimeout(2500);

  results.navTiming = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const paints = performance.getEntriesByType("paint");
    return {
      responseEnd: Math.round(nav?.responseEnd || 0),
      domContentLoaded: Math.round(nav?.domContentLoadedEventEnd || 0),
      loadEvent: Math.round(nav?.loadEventEnd || 0),
      firstContentfulPaint: Math.round(paints.find(p => p.name === "first-contentful-paint")?.startTime || 0),
      transferSizeKB: Math.round((nav?.transferSize || 0) / 1024),
    };
  });

  results.slowResources = [...resourceSizes.entries()]
    .sort((a, b) => b[1] - a[1]).slice(0, 12)
    .map(([url, size]) => ({ url, kb: Math.round(size / 1024) }));

  // Scroll jank measurement on the reader
  results.readerScroll = await page.evaluate(async () => {
    const scrollers = [];
    const walk = (el) => {
      if (el.scrollHeight > el.clientHeight + 50) scrollers.push(el);
      for (const c of el.children) walk(c);
    };
    walk(document.body);
    const target = scrollers.sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
    if (!target) return { error: "no scroller found" };
    const isWindowLike = target === document.body || target === document.documentElement;
    const startTop = isWindowLike ? window.scrollY : target.scrollTop;
    const max = isWindowLike
      ? document.documentElement.scrollHeight - window.innerHeight
      : target.scrollHeight - target.clientHeight;
    const frames = [];
    let last = performance.now();
    let pos = startTop;
    let rafId;
    const step = (now) => {
      frames.push(now - last);
      last = now;
      pos = Math.min(max, pos + 120);
      if (isWindowLike) window.scrollTo(0, pos); else target.scrollTop = pos;
      if (pos < max) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    await new Promise((res) => {
      const check = () => (rafId && pos >= max ? res() : requestAnimationFrame(check));
      check();
    });
    frames.sort((a, b) => a - b);
    return {
      scroller: target.tagName + "." + (target.className || "").toString().slice(0, 60),
      frames: frames.length,
      medianFrameMs: Math.round(frames[Math.floor(frames.length / 2)] * 10) / 10,
      p95FrameMs: Math.round(frames[Math.floor(frames.length * 0.95)] * 10) / 10,
      maxFrameMs: Math.round(frames[frames.length - 1] * 10) / 10,
      longFramesOver50ms: frames.filter(f => f > 50).length,
      domNodes: document.querySelectorAll("*").length,
    };
  });

  // Force style/layout heavy check: count CSS rules
  results.cssRules = await page.evaluate(() => {
    let total = 0;
    for (const sheet of document.styleSheets) {
      try { total += sheet.cssRules.length; } catch {}
    }
    return total;
  });

  // --- Home page ---
  t0 = Date.now();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  results.homeDCLMs = Date.now() - t0;
  await page.waitForSelector("#main-content", { timeout: 30000 });
  await page.waitForTimeout(1500);
  results.homeNavTiming = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const paints = performance.getEntriesByType("paint");
    return {
      domContentLoaded: Math.round(nav?.domContentLoadedEventEnd || 0),
      loadEvent: Math.round(nav?.loadEventEnd || 0),
      firstContentfulPaint: Math.round(paints.find(p => p.name === "first-contentful-paint")?.startTime || 0),
    };
  });

  console.log("PERF_DIAG", JSON.stringify(results, null, 2));
  expect(results.readerScroll.error || results.readerScroll.frames).toBeTruthy();
});
