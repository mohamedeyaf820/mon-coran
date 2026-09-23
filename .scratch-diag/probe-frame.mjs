import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 393, height: 851 }, deviceScaleFactor: 1 });
const page = await context.newPage();
await page.addInitScript(() => {
  localStorage.setItem("mushaf-plus-settings", JSON.stringify({
    skipSplashAnimation: true, showHome: false, showDuas: false, sidebarOpen: false,
    displayMode: "page", mushafLayout: "mushaf", lang: "fr", riwaya: "warsh",
    fontFamily: "qpc-warsh", fontFamilyByRiwaya: { hafs: "qpc-hafs", warsh: "qpc-warsh" },
    currentSurah: 2, currentPage: 3, currentJuz: 1,
    lastPosition: { surah: 2, ayah: 1, page: 3, juz: 1 },
  }));
});
await page.goto("http://127.0.0.1:4173/page/3", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".quran-display--platform", { timeout: 45_000 });
await page.waitForTimeout(3000);
await page.locator(":is(.reader-fullscreen-trigger, .srh-fullscreen-btn):visible").first().click();
await page.waitForSelector(".mfp-portal-root .qcm-flow .qcm-word", { timeout: 30_000 });
await page.waitForTimeout(4000);

const dump = await page.evaluate(() => {
  const pick = (cs) => ({
    pos: cs.position, z: cs.zIndex, inset: `${cs.top}/${cs.right}/${cs.bottom}/${cs.left}`,
    w: cs.width, h: cs.height, border: cs.border, borderImage: cs.borderImageSource.slice(0, 60),
    bg: cs.backgroundColor, bgImg: cs.backgroundImage.slice(0, 80), clip: cs.clipPath, mask: cs.maskImage.slice(0, 60),
    outline: cs.outline, boxShadow: cs.boxShadow.slice(0, 60),
  });
  const shell = document.querySelector(".mfp-portal-root .qcm-page-shell");
  const pg = shell.querySelector(".qcm-page");
  const out = { page: pick(getComputedStyle(pg)) };
  for (const pe of ["::before", "::after"]) out["page" + pe] = pick(getComputedStyle(pg, pe));
  out.shell = pick(getComputedStyle(shell));
  for (const pe of ["::before", "::after"]) out["shell" + pe] = pick(getComputedStyle(shell, pe));
  // direct children of page
  out.children = [...pg.children].map((c) => {
    const cs = getComputedStyle(c); const r = c.getBoundingClientRect();
    return { cls: (c.className || "").toString().slice(0, 30), ...pick(cs), rect: [r.left, r.top, r.right, r.bottom].map((v) => +v.toFixed(1)) };
  });
  return out;
});
console.log(JSON.stringify(dump, null, 1));
await browser.close();
