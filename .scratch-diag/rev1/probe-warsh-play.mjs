import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";

const BASE = "http://127.0.0.1:4191";
const log = (...a) => console.log(...a);
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required","--mute-audio"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
page.on("pageerror", (e) => log("PAGEERROR", e.message));
const mp3s = [];
page.on("request", (r) => { if (/\.mp3(\?|$)/.test(r.url())) mp3s.push(r.url().split("/").pop()); });

await page.goto(BASE + "/surah/2", { waitUntil: "domcontentloaded" });
for (let i = 0; i < 20; i++) { if (await page.evaluate(() => !!document.querySelector("[data-ayah-number]"))) break; await page.waitForTimeout(2000); }
await page.waitForTimeout(2500);

// Warsh
await page.evaluate(() => document.querySelector('button[aria-label^="Changer de riwaya"]').click());
await page.waitForTimeout(5000);
for (let i = 0; i < 20; i++) { if (await page.evaluate(() => !!document.querySelector("[data-ayah-number]"))) break; await page.waitForTimeout(2000); }
log("riwaya:", await page.evaluate(() => document.querySelector('button[aria-label^="Changer de riwaya"]')?.getAttribute("aria-label")));
log("warsh verse count on screen:", await page.evaluate(() => document.querySelectorAll("[data-ayah-number]").length));

// play the surah
await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => x.offsetParent && /Écouter/.test(x.getAttribute("aria-label") || x.textContent));
  b?.click();
});
await page.waitForTimeout(9000);
log("mp3 requests:", JSON.stringify(mp3s.slice(0, 12)));
log("player label:", await page.evaluate(() => document.querySelector("[class*='player'] [class*='ayah'], [class*='player'] [class*='ref'], [class*='now-playing']")?.textContent?.trim()?.slice(0, 60) ?? null));
await browser.close();
