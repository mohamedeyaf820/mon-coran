import { expect, test } from "@playwright/test";
import fs from "node:fs";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";

const SETTINGS_KEY = "mushaf-plus-settings";
const shotDir = ".scratch-diag/shots";

async function openPhone(page, pageNum, { live = false } = {}) {
  await page.setViewportSize({ width: 546, height: 900 });
  if (!live) await installQuranNetworkFixtures(page);
  await page.addInitScript(({ key, p }) => {
    localStorage.setItem(key, JSON.stringify({
      skipSplashAnimation: true,
      showHome: false,
      showDuas: false,
      sidebarOpen: false,
      displayMode: "page",
      mushafLayout: "mushaf",
      lang: "fr",
      riwaya: "hafs",
      currentSurah: p === 1 ? 1 : 67,
      currentPage: p,
      lastPosition: { surah: p === 1 ? 1 : 67, ayah: 1, page: p, juz: p === 1 ? 1 : 29 },
    }));
  }, { key: SETTINGS_KEY, page: pageNum });
  await page.goto(`/page/${pageNum}`);
  await expect(page.locator(".quran-display--platform")).toBeVisible({ timeout: 30_000 });
  const trigger = page.locator(":is(.reader-fullscreen-trigger, .srh-fullscreen-btn):visible").first();
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(page.locator(".mfp-portal-root")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".mfp-portal-root .qcm-word").first()).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(2500);
}

const diag = () => {
  const root = document.querySelector(".mfp-portal-root");
  const book = root.querySelector(".mfp-book--exact");
  const folio = root.querySelector(".qcm-page-folio");
  const marker = root.querySelector(".qcm-line .ayat-marker, .qcm-line .ayah-marker, .qcm-ayah-marker");
  const lines = root.querySelector(".qcm-lines");
  const title = root.querySelector(".qcm-surah-title");
  const cs = (el) => el && getComputedStyle(el);
  const rr = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; };
  const firstMarkerLine = marker ? marker.closest(".qcm-line") : null;
  return {
    style: {
      zoom: cs(book)?.zoom,
      linesFont: cs(lines)?.fontSize,
      folioW: cs(folio)?.width,
      folioH: cs(folio)?.height,
      folioFs: cs(folio)?.fontSize,
      markerFs: cs(marker)?.fontSize,
      markerMl: cs(marker)?.marginInlineStart,
      markerMr: cs(marker)?.marginInlineEnd,
    },
    rects: {
      book: rr(book),
      folio: rr(folio),
      header: rr(root.querySelector(".mfp-header")),
      footer: rr(root.querySelector(".mfp-mobile-footer")),
      surahTitle: rr(title),
      firstLine: rr(root.querySelector(".qcm-line")),
    },
    counts: {
      lines: root.querySelectorAll(".qcm-line").length,
      words: root.querySelectorAll(".qcm-word").length,
      markers: root.querySelectorAll(".qcm-ayah-marker, .ayat-marker").length,
    },
    titleText: title ? title.textContent : null,
    markerLineKids: firstMarkerLine ? [...firstMarkerLine.children].map((k) => ({ cls: k.className.toString().slice(0, 26), x: Math.round(k.getBoundingClientRect().x), w: Math.round(k.getBoundingClientRect().width) })) : null,
    viewportH: innerHeight,
  };
};

for (const pageNum of [559, 565, 566, 1]) {
  test(`capture overlay page ${pageNum}`, async ({ page }) => {
    await openPhone(page, pageNum);
    const out = await page.evaluate(diag);
    fs.writeFileSync(`${shotDir}/e2e-${pageNum}.json`, JSON.stringify(out, null, 1));
    await page.screenshot({ path: `${shotDir}/e2e-${pageNum}.png` });
  });
}

for (const pageNum of [565, 566, 1]) {
  test(`live capture overlay page ${pageNum}`, async ({ page }) => {
    test.setTimeout(120_000);
    await openPhone(page, pageNum, { live: true });
    const out = await page.evaluate(diag);
    fs.writeFileSync(`${shotDir}/live-${pageNum}.json`, JSON.stringify(out, null, 1));
    await page.screenshot({ path: `${shotDir}/live-${pageNum}.png` });
  });
}
