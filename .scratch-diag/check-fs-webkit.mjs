import { webkit } from "playwright";
const BASE = "http://127.0.0.1:4173";
const browser = await webkit.launch();
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
await page.goto(`${BASE}/surah/113`, { waitUntil: "domcontentloaded" });
if (await page.locator(".splash-screen").count()) {
  await page.locator(".splash-screen button", { hasText: /Passer|Skip/ }).first().click().catch(() => {});
  await page.waitForSelector(".splash-screen", { state: "detached", timeout: 10000 }).catch(() => {});
}
await page.waitForTimeout(2000);
for (const item of ["Warsh", "Mushaf"]) {
  await page.locator('button[aria-label*="Plus"], .mp-header-more').last().click().catch(() => {});
  await page.waitForTimeout(400);
  await page.locator(".mp-header-menu button").filter({ hasText: new RegExp(`^${item}$`) }).first().click().catch(() => {});
  await page.waitForTimeout(2500);
  await page.mouse.click(195, 820).catch(() => {});
  await page.waitForTimeout(600);
}
const clicked = await page.evaluate(() => {
  const t = document.querySelector('.srh-fullscreen-btn, button[aria-label*="mmersive" i]');
  if (!t) return null;
  t.click();
  return t.getAttribute("aria-label");
});
console.log("clicked:", clicked);
await page.waitForSelector(".mfp-portal-root", { timeout: 8000 }).catch(() => console.log("no portal"));
await page.waitForTimeout(3500);
const portal = await page.evaluate(() => {
  const flow = document.querySelector(".qcm-flow");
  const vp = document.querySelector(".mfp-viewport");
  return {
    layout: document.querySelector(".mfp-portal-root")?.dataset.layout,
    hasWarshFlow: !!flow,
    words: document.querySelectorAll(".qcm-word--warsh").length,
    overflowX: vp ? vp.scrollWidth - vp.clientWidth : null,
    overflowY: vp ? vp.scrollHeight - vp.clientHeight : null,
    sample: flow ? flow.textContent.slice(0, 40) : null,
  };
});
await page.screenshot({ path: ".scratch-diag/captures/warsh-diag/webkit-fullscreen-warsh.png" });
console.log(JSON.stringify(portal));
await browser.close();
process.exit(0);
