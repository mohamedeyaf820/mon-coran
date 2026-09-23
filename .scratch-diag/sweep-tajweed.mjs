import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 393, height: 851 }, deviceScaleFactor: 3 });

const shoot = async (riwaya, page) => {
  const pg = await context.newPage();
  await pg.addInitScript(([r, p]) => {
    localStorage.setItem("mushaf-plus-settings", JSON.stringify({
      skipSplashAnimation: true, showHome: false, showDuas: false, sidebarOpen: false,
      displayMode: "page", mushafLayout: "mushaf", lang: "fr", riwaya: r,
      fontFamily: r === "warsh" ? "qpc-warsh" : "qpc-hafs",
      fontFamilyByRiwaya: { hafs: "qpc-hafs", warsh: "qpc-warsh" },
      showTranslation: false, showTajwid: true, showTransliteration: false,
      currentSurah: 2, currentPage: p, currentJuz: 1,
      lastPosition: { surah: 2, ayah: 1, page: p, juz: 1 },
    }));
  }, [riwaya, page]);
  await pg.goto(`http://127.0.0.1:4173/page/${page}`, { waitUntil: "domcontentloaded" });
  await pg.waitForSelector(".quran-display--platform", { timeout: 45000 });
  await pg.waitForTimeout(riwaya === "warsh" ? 4000 : 2500);
  await pg.screenshot({ path: `.scratch-diag/captures/sweep-${riwaya}-${page}.png` });
  const stats = await pg.evaluate(() => ({
    tajwidRoots: document.querySelectorAll(".quran-tajwid-text").length,
    words: document.querySelectorAll("[data-tajwid-word]").length,
  }));
  console.log(riwaya, page, JSON.stringify(stats));
  await pg.close();
};

for (const p of [77, 150, 300, 598]) await shoot("hafs", p);
for (const p of [50, 300]) await shoot("warsh", p);
await browser.close();
