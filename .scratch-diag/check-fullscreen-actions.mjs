import { chromium } from "playwright";

const RIWAYA = process.argv[2] === "warsh" ? "warsh" : "hafs";
const SEED = {
  splashCompleted: true,
  skipSplashAnimation: true,
  showHome: false,
  displayMode: "page",
  mushafLayout: "mushaf",
  lang: "fr",
  riwaya: RIWAYA,
  fontFamily: RIWAYA === "warsh" ? "qpc-warsh" : "qpc-hafs",
  quranFontSize: 36,
  showTajwid: false,
  showTranslation: false,
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
await page.addInitScript((seed) => {
  localStorage.setItem("mushaf-plus-settings", JSON.stringify(seed));
}, SEED);
await page.goto("http://127.0.0.1:4173/page/1", { waitUntil: "domcontentloaded" });
const splash = page.locator(".splash-screen");
if (await splash.count()) {
  const skip = page.locator(".splash-screen button").filter({ hasText: /Passer|Skip/ }).first();
  if (await skip.count()) await skip.click({ force: true }).catch(() => {});
}
await page.waitForSelector(".qcm-ayah-marker, .ayah-marker-wrap, .reader-fullscreen-trigger, .srh-fullscreen-btn", { timeout: 15000 });

// Enter fullscreen
const fsBtn = page.locator(".reader-fullscreen-trigger, .srh-fullscreen-btn").first();
await fsBtn.waitFor({ timeout: 15000 });
await fsBtn.click();
await page.waitForSelector(".mfp-portal-root", { timeout: 10000 });
await page.waitForSelector(".mfp-portal-root [class*='ayah-marker']", { timeout: 15000 });
console.log("fullscreen open, markers:", await page.locator(".mfp-portal-root [class*='ayah-marker']").count());

// Tap the first verse-end marker
const marker = page.locator(".mfp-portal-root [class*='ayah-marker']").first();
await marker.click();
await page.waitForSelector("body > .ayah-actions-modal--fullscreen", { timeout: 5000 });
const title = await page.locator(".ayah-actions-modal__title").innerText();
const actions = await page.locator(".ayah-actions-modal__body button").count();
console.log("marker tap -> sheet open:", JSON.stringify(title.trim()), "| action buttons:", actions);

// Escape closes the sheet but keeps the overlay open
await page.keyboard.press("Escape");
await page.waitForSelector("body > .ayah-actions-modal--fullscreen", { state: "detached", timeout: 5000 });
const overlayStill = await page.locator(".mfp-portal-root").count();
console.log("escape -> sheet closed, overlay alive:", overlayStill === 1);

// Backdrop tap closes too
await marker.click();
await page.waitForSelector("body > .ayah-actions-modal--fullscreen", { timeout: 5000 });
await page.mouse.click(195, 120);
await page.waitForSelector("body > .ayah-actions-modal--fullscreen", { state: "detached", timeout: 5000 });
console.log("backdrop tap -> sheet closed:", (await page.locator(".ayah-actions-modal--fullscreen").count()) === 0);

// Word tap must NOT open the sheet (word = audio contract)
const word = page.locator(".mfp-portal-root .qcm-word").first();
await word.click();
await page.waitForTimeout(600);
console.log("word tap keeps sheet closed:", (await page.locator(".ayah-actions-modal--fullscreen").count()) === 0);

// Page turn clears the selection
await marker.click();
await page.waitForSelector("body > .ayah-actions-modal--fullscreen", { timeout: 5000 });
await page.evaluate(() => document.querySelector(".mfp-mobile-pagination button").click());
await page.waitForTimeout(1500);
console.log("page turn closes sheet:", (await page.locator(".ayah-actions-modal--fullscreen").count()) === 0);

await browser.close();
console.log("DONE");
