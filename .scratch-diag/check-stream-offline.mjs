import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
await page.addInitScript(() => {
  localStorage.setItem("mushaf-plus-settings", JSON.stringify({
    splashCompleted: true, skipSplashAnimation: true, showHome: false,
    displayMode: "page", mushafLayout: "list", lang: "fr", riwaya: "hafs",
    fontFamily: "qpc-hafs", quranFontSize: 30, showTajwid: false,
  }));
});
await page.goto("http://127.0.0.1:4173/page/5", { waitUntil: "domcontentloaded" });
const splash = page.locator(".splash-screen");
if (await splash.count()) {
  const s = page.locator(".splash-screen button").filter({ hasText: /Passer|Skip/ }).first();
  if (await s.count()) await s.click({ force: true }).catch(() => {});
}
await page.waitForSelector(".qc-ayah-text-ar", { timeout: 15000 });
const ayahsBefore = await page.locator(".qc-ayah-text-ar").count();
const pagesBefore = await page.locator("[data-stream-page]").count();

// Cut the network, then scroll to the end of the stream.
await page.context().setOffline(true);
const seen = new Set();
for (let i = 0; i < 12; i += 1) {
  await page.locator(".page-stream__sentinel").last().scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(700);
  for (const text of await page.locator(".toast-notification").allInnerTexts()) {
    for (const line of text.split("\n")) if (line.trim()) seen.add(line.trim());
  }
}
const toasts = [...seen];
const ayahsAfter = await page.locator(".qc-ayah-text-ar").count();
const pagesAfter = await page.locator("[data-stream-page]").count();
console.log(`ayahs ${ayahsBefore} -> ${ayahsAfter}; stream pages ${pagesBefore} -> ${pagesAfter}`);
console.log(`toasts (${toasts.length}):`, JSON.stringify(toasts));
const ok =
  toasts.length >= 1 &&
  toasts.length <= 3 &&
  toasts.some((x) => /connexion/i.test(x)) &&
  ayahsAfter >= ayahsBefore;
console.log(ok ? "PASS: offline stream announces once, text intact" : "FAIL");
await browser.close();
