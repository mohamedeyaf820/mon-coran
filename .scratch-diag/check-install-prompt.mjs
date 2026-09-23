import { webkit, chromium } from "playwright";
import fs from "node:fs";
const BASE = "http://127.0.0.1:4173";
const OUT = ".scratch-diag/captures/pwa";
fs.mkdirSync(OUT, { recursive: true });

async function passSplash(page) {
  if (await page.locator(".splash-screen").count()) {
    await page.locator(".splash-screen button", { hasText: /Passer|Skip/ }).first().click().catch(() => {});
    await page.waitForSelector(".splash-screen", { state: "detached", timeout: 10000 }).catch(() => {});
  }
  await page.waitForTimeout(1500);
}

{
  const browser = await webkit.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1" });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await passSplash(page);
  const card = page.locator('div[role="note"]');
  const visible = await card.count();
  await page.screenshot({ path: `${OUT}/ios-install-hint.png` });
  let afterDismiss = -1, afterReload = -1;
  if (visible) {
    await card.locator('button[aria-label="Ignorer"]').click();
    await page.waitForTimeout(400);
    afterDismiss = await card.count();
    await page.reload({ waitUntil: "domcontentloaded" });
    await passSplash(page);
    afterReload = await card.count();
  }
  console.log("webkit ios card:", visible, "after dismiss:", afterDismiss, "after reload:", afterReload);
  await ctx.close(); await browser.close();
}
{
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36" });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await passSplash(page);
  await page.evaluate(() => {
    const ev = new Event("beforeinstallprompt", { cancelable: true });
    ev.prompt = () => {}; ev.userChoice = Promise.resolve({ outcome: "dismissed" });
    window.dispatchEvent(ev);
  });
  await page.waitForTimeout(600);
  const card = page.locator('div[role="note"]');
  const visible = await card.count();
  const hasInstall = await page.locator('button:has-text("Installer")').count();
  await page.screenshot({ path: `${OUT}/android-install-prompt.png` });
  console.log("chromium android card:", visible, "install btn:", hasInstall);
  await ctx.close(); await browser.close();
}
process.exit(0);
