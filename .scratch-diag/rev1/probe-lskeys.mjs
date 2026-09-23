import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";

const KEY = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
await page.goto("http://127.0.0.1:4191/surah/2", { waitUntil: "domcontentloaded" });
const keys = await page.evaluate(() => Object.keys(localStorage));
console.log(JSON.stringify(keys));
await browser.close();
void KEY;
