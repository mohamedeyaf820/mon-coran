import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 393, height: 851 }, deviceScaleFactor: 4 });

const open = async (layout, name) => {
  const pg = await context.newPage();
  await pg.addInitScript(([l]) => {
    localStorage.setItem("mushaf-plus-settings", JSON.stringify({
      skipSplashAnimation: true, showHome: false, showDuas: false, sidebarOpen: false,
      displayMode: "page", mushafLayout: l, lang: "fr", riwaya: "hafs",
      fontFamily: "qpc-hafs", fontFamilyByRiwaya: { hafs: "qpc-hafs", warsh: "qpc-warsh" },
      showTranslation: false, showTajwid: true, showTransliteration: false,
      currentSurah: 2, currentPage: 3, currentJuz: 1,
      lastPosition: { surah: 2, ayah: 19, page: 3, juz: 1 },
    }));
  }, [layout]);
  await pg.goto("http://127.0.0.1:4173/page/3", { waitUntil: "domcontentloaded" });
  await pg.waitForSelector(".quran-display--platform", { timeout: 45000 });
  await pg.waitForTimeout(3000);
  await pg.screenshot({ path: `.scratch-diag/captures/tj-${name}-full.png` });
  // Find the ayah with أَصَابِعَهُمْ and crop tightly around it
  const box = await pg.evaluate(() => {
    const strip = (s) => s.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "");
    const els = document.querySelectorAll("[data-tajwid-word], .quran-word-item");
    for (const el of els) {
      if (strip(el.textContent).includes("\u0627\u0635\u0627\u0628\u0639")) {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      }
    }
    return null;
  });
  if (box) {
    await pg.screenshot({
      path: `.scratch-diag/captures/tj-${name}-word.png`,
      clip: { x: Math.max(0, box.x - 30), y: Math.max(0, box.y - 50), width: Math.min(box.w + 60, 393), height: box.h + 100 },
    });
  }
  console.log(name, "word box:", JSON.stringify(box));
  await pg.close();
};

await open("mushaf", "page");
await open("list", "list");
await browser.close();
