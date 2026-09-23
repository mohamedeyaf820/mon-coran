import { chromium } from "playwright";

const BASE = "http://127.0.0.1:4173/";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.addInitScript(
  ([s]) => localStorage.setItem("mushaf-plus-settings", JSON.stringify(s)),
  [{ lang: "fr", theme: "light", riwaya: "hafs", mushafLayout: "mushaf", showTajwid: false, skipSplashAnimation: true, showHome: true }],
);
const page = await ctx.newPage();
await page.goto(`${BASE}page/294`, { waitUntil: "load" });
await page.waitForSelector(".qcm-page .qcm-word", { timeout: 30000 });
await page.waitForTimeout(4000);

const snap = async (label) => {
  const d = await page.evaluate(() => {
    const s = document.querySelector(".qcm-page");
    const w = s?.querySelector(".qcm-word");
    const r = w?.getBoundingClientRect();
    return {
      words: s ? s.querySelectorAll(".qcm-word").length : -1,
      family: w ? getComputedStyle(w).fontFamily : null,
      size: w ? getComputedStyle(w).fontSize : null,
      firstBox: r ? `${Math.round(r.width)}x${Math.round(r.height)}` : null,
      visible: r ? r.width > 2 && r.height > 2 : false,
      qcf: [...document.fonts].filter((f) => f.family.startsWith("qcf")).map((f) => `${f.family}:${f.status}`).join(","),
    };
  });
  console.log(label.padEnd(34), JSON.stringify(d));
};

await snap("baseline (qpc-hafs, v2)");
await page.click(".reader-typography-trigger");
for (const font of ["amiri-quran", "noto-naskh-arabic", "scheherazade-new", "qpc-indopak", "qpc-hafs"]) {
  await page.selectOption(".afc-select", font).catch((e) => console.log("select fail", font, e.message.split("\n")[0]));
  await page.waitForTimeout(4000);
  await snap(`after font=${font}`);
  await page.screenshot({ path: `.design-shots/mushaf-audit/font-${font}.png` });
}
await page.click(".reader-toolbar-btn--tajweed");
await page.waitForTimeout(5000);
await snap("tajweed on (qpc-hafs)");
await page.screenshot({ path: ".design-shots/mushaf-audit/tajweed-on.png" });
await browser.close();
