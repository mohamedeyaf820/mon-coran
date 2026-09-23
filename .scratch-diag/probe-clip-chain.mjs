import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 632, height: 840 } });
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
const res = await page.evaluate(() => {
  const f = document.querySelector(".mfp-portal-root .qcm-flow");
  const w = [...f.querySelectorAll(".qcm-word")].find((x) => x.textContent.includes("يَخْدَعُونَ")) || f.querySelector(".qcm-word");
  const chain = [];
  for (let el = w; el && el !== document.documentElement; el = el.parentElement) {
    const cs = getComputedStyle(el);
    chain.push({
      el: `${el.tagName.toLowerCase()}.${[...el.classList].join(".")}`.slice(0, 70),
      overflow: cs.overflow, contain: cs.contain, transform: cs.transform,
      h: +el.getBoundingClientRect().height.toFixed(1),
    });
  }
  // line geometry: group words by their client rects' top
  const rects = [...f.querySelectorAll(".qcm-word")].map((x) => x.getBoundingClientRect());
  const tops = [...new Set(rects.map((r) => Math.round(r.top)))].sort((a, b) => a - b);
  const fr = f.getBoundingClientRect();
  return {
    chain,
    flowTop: +fr.top.toFixed(1), flowH: +fr.height.toFixed(1),
    wordTops: tops.slice(0, 6),
    minWordTop: Math.min(...rects.map((r) => +r.top.toFixed(1))),
    firstRowBottom: tops.length > 1 ? rects.filter((r) => Math.round(r.top) === tops[0]).map((r) => +r.bottom.toFixed(1)).sort((a,b)=>b-a)[0] : null,
  };
});
console.log(JSON.stringify(res, null, 1));
await browser.close();
