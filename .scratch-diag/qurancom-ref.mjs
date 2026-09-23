import { chromium } from "playwright";

const browser = await chromium.launch({ args: ["--disable-blink-features=AutomationControlled"] });
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  locale: "en-US",
});
const page = await ctx.newPage();

async function report(url, label) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 }).catch((e) => console.log("nav fail", label, e.message.split("\n")[0]));
  await page.waitForTimeout(6000);
  const d = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const ar = document.querySelector("[data-footnote], .quran-text, [class*='verse'], [class*='Aya'], p[dir='rtl']");
    const styles = [...document.querySelectorAll("style,link[rel=stylesheet]")].length;
    const fonts = [...document.fonts].map((f) => `${f.family}:${f.status}`);
    return {
      title: document.title,
      url: location.pathname,
      arabicSample: (ar?.textContent || "").replace(/\s+/g, " ").slice(0, 80),
      arClass: ar?.className?.toString().slice(0, 80) || null,
      arFont: ar ? getComputedStyle(ar).fontFamily : null,
      arSize: ar ? getComputedStyle(ar).fontSize : null,
      pages: [...document.querySelectorAll("[data-page-number], .page-marker, [class*='page']")].slice(0, 5).map((n) => `${n.className.toString().slice(0, 40)}|${(n.textContent || '').trim().slice(0, 20)}`),
      buttons: [...document.querySelectorAll("button")].map((b) => (b.getAttribute("aria-label") || b.textContent || "").trim()).filter((t) => /font|size|tajweed|mushaf|script|page|zoom|width|settings/i.test(t)).slice(0, 25),
      loadedFonts: fonts.filter((f) => /kfgqpc|me_quran|amiri|scheherazade|indopak|uthmani|hafs/i.test(f)).slice(0, 12),
      styleTags: styles,
    };
  });
  console.log(`\n### ${label} (${url})`);
  console.log(JSON.stringify(d, null, 1));
  await page.screenshot({ path: `.design-shots/qurancom/${label}.png` });
}

await report("https://quran.com/page/294", "mushaf-page");
await report("https://quran.com/18", "surah-reading");
await browser.close();
