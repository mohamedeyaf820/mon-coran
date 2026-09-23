import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";

const BASE = "http://127.0.0.1:4191";
const log = (...a) => console.log(...a);
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required", "--mute-audio"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
page.on("pageerror", (e) => log("PAGEERROR", e.message));
const toasts = async () => page.evaluate(() =>
  [...document.querySelectorAll("body *")].filter((x) => x.children.length === 0 && /indisponible|saut/.test(x.textContent || "")).map((x) => x.textContent.trim()));

await page.goto(BASE + "/surah/14", { waitUntil: "domcontentloaded" });
for (let i = 0; i < 20; i++) { if (await page.evaluate(() => !!document.querySelector("[data-ayah-number]"))) break; await page.waitForTimeout(2000); }
await page.waitForTimeout(1500);
log("warsh controls:", JSON.stringify(await page.evaluate(() =>
  [...document.querySelectorAll("button,[role=radio],[role=tab]")]
    .filter((x) => x.offsetParent && /warsh|riway/i.test((x.getAttribute("aria-label") || "") + " " + x.textContent))
    .map((x) => (x.getAttribute("aria-label") || x.textContent).trim().slice(0, 40)))));
log("verse count:", await page.evaluate(() => document.querySelectorAll("[data-ayah-number]").length));
await browser.close();
