import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:4173";
const KEY = "mushaf-plus-settings";
const browser = await chromium.launch();

const open = async ({ riwaya, font, size, vp = { width: 1280, height: 900 } }) => {
  const context = await browser.newContext({ viewport: vp });
  const p = await context.newPage();
  await p.addInitScript(
    ({ key, value }) => {
      localStorage.setItem(key, value);
      localStorage.setItem("mpp.sheetZoom.v1", "fit");
    },
    {
      key: KEY,
      value: JSON.stringify({
        skipSplashAnimation: true,
        showHome: false,
        sidebarOpen: false,
        lang: "fr",
        theme: "light",
        riwaya,
        displayMode: "page",
        mushafLayout: "mushaf",
        showTajwid: true,
        quranFontSize: size,
        fontFamily: font,
        fontFamilyByRiwaya: { hafs: font, warsh: font },
        currentPage: 294,
        currentSurah: 18,
        lastPosition: { surah: 18, ayah: 1, page: 294, juz: 15 },
      }),
    },
  );
  await p.goto(`${BASE}/page/294`, { waitUntil: "domcontentloaded" });
  await p.waitForSelector(".qcm-lines .qcm-word", { timeout: 25_000 });
  await p.waitForTimeout(4000);
  return { p, context };
};

const cases = [
  { riwaya: "hafs", font: "amiri-quran", size: 25 },
  { riwaya: "hafs", font: "noto-naskh-arabic", size: 25 },
  { riwaya: "warsh", font: "qpc-warsh", size: 25 },
  { riwaya: "warsh", font: "kfgqpc-warsh", size: 25 },
  { riwaya: "warsh", font: "scheherazade-new-warsh", size: 25 },
  { riwaya: "warsh", font: "qpc-warsh", size: 18 },
  { riwaya: "warsh", font: "qpc-warsh", size: 40 },
  { riwaya: "hafs", font: "amiri-quran", size: 40 },
];

for (const c of cases) {
  const { p, context } = await open(c);
  const r = await p.evaluate(() => {
    const word = document.querySelector(".qcm-word");
    const lines = document.querySelector(".qcm-lines");
    const display = document.querySelector(".quran-display--platform, [class*='quran-display']");
    const frame = word.closest(".qcm-page") || lines.parentElement;
    return {
      dataFont: display?.dataset?.quranFont,
      qd: getComputedStyle(lines).getPropertyValue("--qd-font-family").trim().slice(0, 40),
      fq: getComputedStyle(lines).getPropertyValue("--font-quran").trim().slice(0, 40),
      family: getComputedStyle(word).fontFamily.split(",")[0].replace(/"/g, ""),
      px: Number.parseFloat(getComputedStyle(word).fontSize),
      sheet: `${Math.round(frame.clientWidth)}x${Math.round(frame.clientHeight)}`,
      sheetClass: String(frame.className).slice(0, 30),
    };
  });
  console.log(
    `${c.riwaya}/${c.font} size=${c.size} -> data=${r.dataFont} word=${r.family} ${r.px}px sheet=${r.sheet} [${r.sheetClass}] qd="${r.qd}" fq="${r.fq}"`,
  );
  await context.close();
}
await browser.close();
