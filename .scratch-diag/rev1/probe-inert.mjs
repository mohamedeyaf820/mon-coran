import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";
const browser = await chromium.launch({ args: ["--mute-audio"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
const inert = () => page.evaluate(() => document.querySelector(".app-root")?.hasAttribute("inert"));
await page.goto("http://127.0.0.1:4191/surah/2", { waitUntil: "domcontentloaded" });
for (let i = 0; i < 20; i++) { if (await page.evaluate(() => !!document.querySelector("[data-ayah-number]"))) break; await page.waitForTimeout(2000); }
console.log("before open:", await inert());
await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.offsetParent && /Agrandir/.test(x.getAttribute("aria-label") || x.textContent || "")); b?.click(); });
await page.waitForTimeout(1200);
await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.offsetParent && /Options et r/i.test((x.getAttribute("aria-label") || "") + x.textContent)); b?.setAttribute("data-probe-o", "1"); });
await page.click("button[data-probe-o]");
await page.waitForTimeout(1200);
console.log("while open:", await inert());
await page.keyboard.press("Escape");
await page.waitForTimeout(900);
console.log("after escape:", await inert());
await browser.close();
