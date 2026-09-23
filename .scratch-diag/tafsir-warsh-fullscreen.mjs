import { chromium } from "playwright";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const reqs = [];
page.on("request", (r) => {
  if (/tafsirs/.test(r.url())) reqs.push(decodeURIComponent(r.url()));
});
await page.addInitScript(() =>
  window.localStorage.setItem(
    "mushaf-plus-settings",
    JSON.stringify({
      lang: "fr",
      riwaya: "warsh",
      warshStrictMode: false,
      displayMode: "page",
      currentPage: 41,
      currentSurah: 2,
      mushafLayout: "mushaf",
      showTranslation: false,
    }),
  ),
);
await page.goto("http://127.0.0.1:4173/page/42", { waitUntil: "domcontentloaded" });
const skip = page.locator(".splash-screen button", { hasText: /Passer|Skip/ });
if (await skip.count()) {
  await skip.first().click().catch(() => {});
  await page.waitForSelector(".splash-screen", { state: "detached", timeout: 10000 }).catch(() => {});
}
await page.waitForSelector(".qcm-lines, .mushaf-page-wrapper", { timeout: 20000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1500);
await page.locator(".reader-fullscreen-trigger, .srh-fullscreen-btn, button[aria-label*='lein']").first().click();
await page.waitForSelector(".mfp-portal-root", { timeout: 10000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1500);

const token = page.locator('.mfp-book [data-surah-number="2"][data-ayah-number="253"]').first();
if (!(await token.count())) {
  console.log("token 253 not on the initial spread; footer:", await page.locator(".mfp-book .qcm-page-footer").first().textContent());
}
await token.scrollIntoViewIfNeeded();
await token.click();
await page.waitForSelector(".ayah-actions-modal", { timeout: 5000 });
console.log("modal ref:", await page.locator(".ayah-actions-modal__ref").textContent());
await page.locator('.ayah-actions-modal [aria-label="Tafsir"]').first().click();
await page.waitForFunction(() => /2:255/.test(document.querySelector("#tafsir-sidebar-title")?.textContent || ""), null, { timeout: 12000 });
console.log("title:", await page.locator("#tafsir-sidebar-title").textContent(), "| REQS:", reqs);
const ok = reqs.some((u) => /by_ayah\/2:255/.test(u)) && !reqs.some((u) => /by_ayah\/2:253/.test(u));
console.log(ok ? "PASS: fullscreen Warsh 2:253 -> Hafs 255 tafsir" : "FAIL");
await browser.close();
process.exit(ok ? 0 : 1);
