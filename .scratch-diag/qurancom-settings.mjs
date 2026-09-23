import { chromium } from "playwright";

const browser = await chromium.launch({ args: ["--disable-blink-features=AutomationControlled"] });
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
});
const page = await ctx.newPage();
await page.goto("https://quran.com/page/294", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(7000);

// mushaf text element + its computed type
const text = await page.evaluate(() => {
  const nodes = [...document.querySelectorAll("div,span,p")].filter((n) => {
    const own = [...n.childNodes].filter((c) => c.nodeType === 3).map((c) => c.textContent).join("");
    return /[\u0600-\u06FF]{6,}/.test(own);
  });
  const big = nodes.sort((a, b) => b.textContent.length - a.textContent.length)[0];
  if (!big) return null;
  const cs = getComputedStyle(big);
  return {
    cls: big.className.toString().slice(0, 90),
    font: cs.fontFamily,
    size: cs.fontSize,
    lh: cs.lineHeight,
    color: cs.color,
    width: Math.round(big.getBoundingClientRect().width),
    sample: big.textContent.replace(/\s+/g, " ").slice(0, 70),
  };
});
console.log("MUSHAF TEXT:", JSON.stringify(text, null, 1));

for (const label of ["Change Settings"]) {
  const btn = page.getByRole("button", { name: label }).first();
  if (await btn.isVisible().catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(1500);
    const panel = await page.evaluate(() => {
      const dlg = document.querySelector("[role='dialog'], [class*='Modal'], [class*='settings']");
      if (!dlg) return null;
      return {
        headings: [...dlg.querySelectorAll("h1,h2,h3,h4,legend,[class*='title']")].map((h) => h.textContent.trim()).filter(Boolean).slice(0, 20),
        radios: [...dlg.querySelectorAll("input[type=radio],[role=radio],[aria-checked]")].map((r) => r.value || r.textContent?.trim()).slice(0, 30),
        labels: [...dlg.querySelectorAll("label")].map((l) => l.textContent.trim()).filter(Boolean).slice(0, 30),
        sliders: [...dlg.querySelectorAll("input[type=range], [role=slider]")].map((s) => `${s.min}-${s.max}:${s.value}`),
        buttons: [...dlg.querySelectorAll("button")].map((b) => (b.getAttribute("aria-label") || b.textContent || "").trim()).filter(Boolean).slice(0, 40),
        text: dlg.textContent.replace(/\s+/g, " ").slice(0, 900),
      };
    });
    console.log(`\nPANEL after "${label}":`, JSON.stringify(panel, null, 1));
    await page.screenshot({ path: ".design-shots/qurancom/settings.png" });
  }
}
await browser.close();
