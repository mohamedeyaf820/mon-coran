import { chromium } from "playwright";
const BASE = "http://localhost:3003";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.addInitScript(() => {
  localStorage.setItem("mushaf-plus-settings", JSON.stringify({
    skipSplashAnimation: true, showHome: false, showDuas: false, sidebarOpen: false,
    displayMode: "surah", mushafLayout: "mushaf", lang: "fr", riwaya: "hafs",
    currentSurah: 3, currentPage: 50, lastPosition: { surah: 3, ayah: 1, page: 50, juz: 3 },
  }));
});
await page.goto(BASE + "/page/50", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".quran-display--platform", { timeout: 30000 });
await page.waitForTimeout(2500);
const trigger = page.locator(":is(.reader-fullscreen-trigger, .srh-fullscreen-btn):visible").first();
await trigger.click();
await page.waitForSelector(".mfp-portal-root", { timeout: 30000 });
await page.waitForTimeout(2500);
for (const width of [280, 320]) {
  await page.setViewportSize({ width, height: 844 });
  await page.waitForTimeout(1500);
  const info = await page.locator(".mfp-portal-root").evaluate((root) => {
    const out = [];
    for (const b of root.querySelectorAll("button")) {
      if (!b.getClientRects().length) continue;
      const x = b.getBoundingClientRect();
      if (x.left < -1 || x.right > innerWidth + 1 || x.top < -1 || x.bottom > innerHeight + 1) {
        out.push({ label: b.getAttribute("aria-label") || b.textContent.trim(), cls: b.className, l: Math.round(x.left), r: Math.round(x.right), t: Math.round(x.top), b: Math.round(x.bottom) });
      }
    }
    const foot = root.querySelector(".mfp-mobile-footer");
    const pag = root.querySelector(".mfp-mobile-pagination");
    const aud = root.querySelector(".mfp-audio-controls--compact");
    return {
      clipped: out, iw: innerWidth,
      footer: foot && { l: foot.getBoundingClientRect().left, w: Math.round(foot.getBoundingClientRect().width), sw: foot.scrollWidth },
      pag: pag && Math.round(pag.getBoundingClientRect().width),
      aud: aud && Math.round(aud.getBoundingClientRect().width),
    };
  });
  console.log(width, JSON.stringify(info, null, 1));
}
await browser.close();
