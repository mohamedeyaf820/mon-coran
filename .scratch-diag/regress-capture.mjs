import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 393, height: 851 }, deviceScaleFactor: 3 });
const open = async (riwaya, p) => {
  const pg = await context.newPage();
  await pg.addInitScript(([r, pn]) => {
    localStorage.setItem("mushaf-plus-settings", JSON.stringify({
      skipSplashAnimation: true, showHome: false, showDuas: false, sidebarOpen: false,
      displayMode: "page", mushafLayout: "mushaf", lang: "fr", riwaya: r,
      fontFamily: r === "warsh" ? "qpc-warsh" : "qpc-hafs",
      fontFamilyByRiwaya: { hafs: "qpc-hafs", warsh: "qpc-warsh" },
      currentSurah: 2, currentPage: pn, currentJuz: 1,
      lastPosition: { surah: 2, ayah: 1, page: pn, juz: 1 },
    }));
  }, [riwaya, p]);
  await pg.goto(`http://127.0.0.1:4173/page/${p}`, { waitUntil: "domcontentloaded" });
  await pg.waitForSelector(".quran-display--platform", { timeout: 45_000 });
  await pg.waitForTimeout(2500);
  await pg.locator(":is(.reader-fullscreen-trigger, .srh-fullscreen-btn):visible").first().click();
  await pg.waitForSelector(".mfp-portal-root .qcm-page", { timeout: 30_000 });
  await pg.waitForTimeout(riwaya === "warsh" ? 4000 : 2500);
  await pg.locator(".mfp-portal-root .qcm-page").first().screenshot({ path: `.scratch-diag/captures/regress-${riwaya}-${p}.png` });
  await pg.close();
};
await open("hafs", 2);
await open("warsh", 50);
await browser.close();
