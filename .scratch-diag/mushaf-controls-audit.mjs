import { chromium } from "playwright";

const BASE = "http://127.0.0.1:4173/";
const riwayas = process.argv.slice(2).length ? process.argv.slice(2) : ["hafs", "warsh"];

const seed = (extra) => ({
  lang: "fr",
  theme: "light",
  showHome: true,
  skipSplashAnimation: true,
  mushafLayout: "mushaf",
  ...extra,
});

async function measure(page, label) {
  const data = await page.evaluate(() => {
    const word = document.querySelector(".qcm-page .qcm-word");
    const sheet = document.querySelector(".qcm-page");
    const colored = [...document.querySelectorAll(".qcm-page .qcm-word[data-tajwid]")];
    const cs = word ? getComputedStyle(word) : null;
    return {
      words: document.querySelectorAll(".qcm-page .qcm-word").length,
      fontFamily: cs?.fontFamily ?? null,
      fontSize: cs?.fontSize ?? null,
      lineHeight: cs?.lineHeight ?? null,
      sheetH: sheet ? Math.round(sheet.getBoundingClientRect().height) : null,
      sheetW: sheet ? Math.round(sheet.getBoundingClientRect().width) : null,
      colored: colored.length,
      colorSample: colored.slice(0, 4).map((w) => `${w.dataset.tajwid}=${getComputedStyle(w).color}`),
      inkSample: word ? getComputedStyle(word).color : null,
    };
  });
  console.log(`  ${label.padEnd(26)} ${JSON.stringify(data)}`);
  return data;
}

const browser = await chromium.launch();
for (const riwaya of riwayas) {
  for (const vp of [
    { name: "1280", w: 1280, h: 900 },
    { name: "390", w: 390, h: 844 },
  ]) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
    await ctx.addInitScript(
      ([s]) => localStorage.setItem("mushaf-plus-settings", JSON.stringify(s)),
      [seed({ riwaya, showTajwid: false })],
    );
    const fonts = new Set();
    ctx.on("response", (r) => {
      const u = new URL(r.url());
      if (u.pathname.endsWith(".woff2")) fonts.add(u.pathname.split("/").pop());
    });
    const page = await ctx.newPage();
    await page.goto(BASE + "page/294", { waitUntil: "load" });
    await page.waitForSelector(".qcm-page .qcm-word", { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
    console.log(`\n### ${riwaya} @ ${vp.name}  (page 294)`);
    await measure(page, "mushaf tajweed off");
    await page.click(".reader-toolbar-btn--tajweed").catch((e) => console.log("  tajweed btn missing:", e.message.split("\n")[0]));
    await page.waitForTimeout(2500);
    await measure(page, "mushaf tajweed on");
    await page.click(".reader-typography-trigger").catch(() => {});
    await page.waitForTimeout(400);
    const opts = await page.$$eval(".afc-select option", (os) => os.map((o) => o.value));
    console.log("  font options:", opts.join(","));
    const target = opts.find((v) => v !== "qpc-hafs" && v.includes("amiri")) || opts[1];
    if (target) {
      await page.selectOption(".afc-select", target).catch(() => {});
      await page.waitForTimeout(2500);
      await measure(page, `font=${target}`);
    }
    for (const step of ["+", "+", "+", "-", "-"]) {
      await page.click(`.afc-size-group button:has(svg.lucide-${step === "+" ? "plus" : "minus"})`).catch(() => {});
      await page.waitForTimeout(500);
    }
    await measure(page, "after 3+ / 2- size clicks");
    console.log("  woff2 fetched:", [...fonts].join(", "));
    await page.screenshot({ path: `.design-shots/mushaf-audit/${riwaya}-${vp.name}.png`, fullPage: false });
    await ctx.close();
  }
}
await browser.close();
