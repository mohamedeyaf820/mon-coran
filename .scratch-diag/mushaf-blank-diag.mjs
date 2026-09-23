import { chromium } from "playwright";

const BASE = "http://127.0.0.1:4173/";
const page_ = process.argv[2] || "294";
const widths = [1280, 768, 390];

const browser = await chromium.launch();
for (const w of widths) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
  await ctx.addInitScript(
    ([s]) => localStorage.setItem("mushaf-plus-settings", JSON.stringify(s)),
    [{ lang: "fr", theme: "light", riwaya: "hafs", mushafLayout: "mushaf", showTajwid: process.env.TJ === "on", skipSplashAnimation: true, showHome: true }],
  );
  const fonts = new Set();
  ctx.on("response", (r) => {
    const u = new URL(r.url());
    if (u.pathname.endsWith(".woff2")) fonts.add(u.pathname.split("/").pop());
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}page/${page_}`, { waitUntil: "load" });
  await page.waitForTimeout(6000);
  const info = await page.evaluate(() => {
    const sheets = [...document.querySelectorAll(".qcm-page")];
    const loaded = [...document.fonts].filter((f) => f.family.startsWith("qcf")).map((f) => `${f.family}:${f.status}`);
    return {
      sheetCount: sheets.length,
      firstSheetClasses: sheets[0]?.className,
      perSheet: sheets.slice(0, 3).map((s) => ({
        words: s.querySelectorAll(".qcm-word").length,
        lines: s.querySelectorAll(".qcm-line").length,
        glyphSpans: s.querySelectorAll("span").length,
        textLen: (s.innerText || "").replace(/\s+/g, " ").length,
        sample: (s.innerText || "").replace(/\s+/g, " ").slice(0, 60),
        family: getComputedStyle(s.querySelector(".qcm-word") || s).fontFamily,
      })),
      qcfFonts: loaded.slice(0, 8),
      qcfCount: loaded.length,
    };
  });
  console.log(`\n### hafs page ${page_} @ ${w} tajweed ON`);
  console.log(JSON.stringify(info, null, 1));
  console.log("woff2:", [...fonts].join(", "));
  await page.screenshot({ path: `.design-shots/mushaf-audit/clean-hafs-${w}.png` });
  await ctx.close();
}
await browser.close();
