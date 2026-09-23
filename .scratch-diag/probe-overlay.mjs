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

const probe = await page.evaluate(() => {
  const desc = (el) => el ? `${el.tagName.toLowerCase()}.${(el.className || "").toString().split(" ")[0]} z=${getComputedStyle(el).zIndex} pos=${getComputedStyle(el).position}` : null;
  const pts = [[21, 222], [19, 222], [15, 222], [373, 150], [376, 150], [380, 150]];
  const hits = pts.map(([x, y]) => ({ pt: [x, y], el: desc(document.elementFromPoint(x, y)) }));
  // list pseudo/overlay children of page + shell
  const shell = document.querySelector(".mfp-portal-root .qcm-page-shell");
  const pg = shell.querySelector(".qcm-page");
  const kids = [...shell.querySelectorAll("*")].filter((el) => {
    const cs = getComputedStyle(el);
    return cs.position === "absolute" || cs.position === "fixed";
  }).map((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return { cls: (el.className || "").toString().slice(0, 30), z: cs.zIndex, bg: cs.backgroundImage.slice(0, 40) || cs.backgroundColor, rect: [r.left, r.top, r.right, r.bottom].map((v) => +v.toFixed(1)) };
  });
  const pe = getComputedStyle(pg, "::before"), ae = getComputedStyle(pg, "::after");
  return { hits, kids: kids.slice(0, 15), before: { c: pe.content, z: pe.zIndex, bg: pe.background.slice(0, 60) }, after: { c: ae.content, z: ae.zIndex, bg: ae.background.slice(0, 60) } };
});
console.log(JSON.stringify(probe, null, 1));
await browser.close();
