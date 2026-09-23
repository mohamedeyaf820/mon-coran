import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
const click = (re) => page.evaluate((src) => {
  const rx = new RegExp(src, "i");
  const el = [...document.querySelectorAll("button,[role=button]")].find((x) => x.offsetParent && rx.test((x.getAttribute("aria-label") || "") + " " + x.textContent));
  if (!el) return false; el.click(); return true;
}, re.source);
const sheetLabels = () => page.evaluate(() => {
  const t = (el) => (el.textContent || "").trim().replace(/\s+/g, " ");
  const sheet = document.querySelector(".ayah-action-sheet, [class*=action-sheet]");
  if (!sheet) return null;
  const bm = [...sheet.querySelectorAll('[aria-label*="favori"],[aria-label*="bookmark"],[aria-label*="Mفضلة"],[aria-label*="bookmark" i]')].map((x) => x.getAttribute("aria-label"));
  return {
    close: [...sheet.querySelectorAll("button")].map((x) => t(x)).filter((x) => /Fermer|Close|إغلاق/.test(x)),
    note: [...sheet.querySelectorAll("span,button")].map((x) => t(x)).filter((x) => /note|Note|ملاحظة/.test(x)).slice(0, 3),
    bookmark: bm.slice(0, 2),
  };
});
await page.goto("http://127.0.0.1:4191/surah/2", { waitUntil: "domcontentloaded" });
for (let i = 0; i < 20; i++) { if (await page.evaluate(() => !!document.querySelector("[data-ayah-number]"))) break; await page.waitForTimeout(2000); }
await page.waitForTimeout(1500);
await click(/Options du verset/);
await page.waitForTimeout(1200);
console.log("FR sheet:", JSON.stringify(await sheetLabels()));
await page.keyboard.press("Escape");
await page.waitForTimeout(600);
await click(/Plus d.options|Menu/);
await page.waitForTimeout(700);
await click(/Paramètres/);
await page.waitForTimeout(1500);
console.log("lang tiles:", JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("button")].filter((x) => x.offsetParent).map((x) => x.textContent.trim()).filter((s) => /Fran|English|العربي/.test(s)).slice(0, 6))));
await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.offsetParent && /العربية|Arabic/.test(x.textContent)); b && b.click(); });
await page.waitForTimeout(2500);
await page.keyboard.press("Escape");
await page.waitForTimeout(700);
await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.offsetParent && /خيارات|Options/i.test(x.getAttribute("aria-label") || "")); b && b.click(); });
await page.waitForTimeout(1200);
console.log("AR sheet:", JSON.stringify(await sheetLabels()));
await page.screenshot({ path: ".scratch-diag/rev1/labels-ar.png" });
await browser.close();
